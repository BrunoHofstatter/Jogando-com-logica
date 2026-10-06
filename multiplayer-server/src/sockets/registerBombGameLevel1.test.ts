import type { AddressInfo } from "node:net";
import { io, type Socket } from "socket.io-client";
import { expect, it, vi } from "vitest";
import { createMultiplayerServer } from "../server.ts";
import type { BombViewState, ManualViewState, RoomPayload, StatePayload } from "../../../src/BombGame/Logic/multiplayer/protocol.ts";
import type { Level1Intent, Letter } from "../../../src/BombGame/Logic/level1.ts";

function next<T>(socket: Socket, event: string, matches: (value: T) => boolean = () => true): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { socket.off(event, listener); reject(new Error(`Timed out: ${event}`)); }, 8000);
    const listener = (value: T) => { if (!matches(value)) return; clearTimeout(timeout); socket.off(event, listener); resolve(value); };
    socket.on(event, listener);
  });
}
const sync = (socket: Socket) => new Promise<number>((resolve) => socket.emit("sync_time", resolve));

it("plays Level 1 win/loss/replay, protects rapid clicks, and survives malformed socket envelopes", async () => {
  const server = createMultiplayerServer();
  await new Promise<void>((resolve) => server.httpServer.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${(server.httpServer.address() as AddressInfo).port}/bomb-game`;
  const bomb = io(url, { forceNew: true, transports: ["websocket"] });
  const manual = io(url, { forceNew: true, transports: ["websocket"] });
  let code: string | null = null;
  let state: BombViewState, manualState: ManualViewState;
  let sequence = 0;
  bomb.on("state_updated", (p: StatePayload) => { if (p.state) state = p.state as BombViewState; });
  manual.on("state_updated", (p: StatePayload) => { if (p.state) manualState = p.state as ManualViewState; });
  try {
    await Promise.all([next(bomb, "connect"), next(manual, "connect")]);
    for (const event of ["create_room", "join_room", "join_classroom", "leave_classroom", "list_open_rooms", "set_role_preference", "set_ready", "submit_action", "set_replay_vote", "leave_room", "sync_time"]) {
      for (const payload of [null, {}, { code: 123, playerName: [] }]) {
        const error = next<{ code: string }>(bomb, "multiplayer_error");
        bomb.emit(event, payload);
        expect((await error).code).toBe("invalid_payload");
      }
    }
    const now = await sync(bomb); expect(Math.abs(Date.now() - now)).toBeLessThan(2000);
    const created = next<RoomPayload>(bomb, "room_created");
    bomb.emit("create_room", { playerName: "Bomba", hintsEnabled: false }); code = (await created).code;
    const joined = next<RoomPayload>(manual, "room_joined");
    manual.emit("join_room", { code, playerName: "Manual" }); await joined;

    const start = async () => {
      const playing = next<StatePayload>(bomb, "state_updated", (p) => p.state?.phase === "playing");
      const manualPlaying = next<StatePayload>(manual, "state_updated", (p) => p.state?.phase === "playing");
      bomb.emit("set_role_preference", { code, preference: "bomb" }); manual.emit("set_role_preference", { code, preference: "manual" });
      bomb.emit("set_ready", { code, ready: true }); manual.emit("set_ready", { code, ready: true });
      await Promise.all([playing, manualPlaying]);
    };
    const send = async (intent: Level1Intent) => {
      const previous = state.eventId;
      const updated = next<StatePayload>(bomb, "state_updated", (p) => (p.state?.eventId ?? 0) > previous);
      bomb.emit("submit_action", { code, roundId: state.roundId, actionId: `action-${sequence++}`, intent });
      await updated;
    };
    const replay = async () => {
      const oldRound = state.roundId;
      const vote = next<StatePayload>(bomb, "state_updated", (p) => p.state?.replayVotes.length === 1);
      bomb.emit("set_replay_vote", { code, wantsReplay: true }); await vote;
      const cancelled = next<StatePayload>(bomb, "state_updated", (p) => p.state?.replayVotes.length === 0);
      bomb.emit("set_replay_vote", { code, wantsReplay: false }); await cancelled;
      const reset = next<StatePayload>(bomb, "state_updated", (p) => p.state === null && p.players.every((player) => !player.ready));
      bomb.emit("set_replay_vote", { code, wantsReplay: true }); manual.emit("set_replay_vote", { code, wantsReplay: true });
      await reset; await start();
      expect(state.roundId).not.toBe(oldRound); expect(state.lives).toBe(3); expect(state.orderingRevision).toBe(0);
      const ignored = next<StatePayload>(bomb, "state_updated", (p) => p.state?.eventId === 0);
      // A malformed intent gets a fresh authoritative snapshot; stale round tokens are ignored.
      bomb.emit("submit_action", { code, roundId: oldRound, actionId: "stale", intent: { type: "submit_numeric_answer", row: 0, value: 999 } });
      bomb.emit("submit_action", { code, roundId: state.roundId, actionId: "invalid", intent: null });
      await ignored; expect(state.lives).toBe(3);
    };

    await start();
    expect(state!.timerEndsAt! - state!.serverNow!).toBeLessThanOrEqual(180000);
    expect(state!.timerEndsAt! - state!.serverNow!).toBeGreaterThan(179000);
    expect(state!).not.toHaveProperty("operatorSolutions"); expect(state!).not.toHaveProperty("values");
    expect(manualState!).not.toHaveProperty("orderingNumbers"); expect(manualState!.hintsEnabled).toBe(false);
    const sorted = [...state!.orderingNumbers].sort((a, b) => a - b);
    const wrong = { code, roundId: state!.roundId, actionId: "repeat", intent: { type: "select_ordering_number", value: sorted[2], revision: 0 } };
    const mistake = next<StatePayload>(bomb, "state_updated", (p) => p.state?.eventId === 1);
    bomb.emit("submit_action", wrong); bomb.emit("submit_action", wrong);
    bomb.emit("submit_action", { ...wrong, actionId: "rapid-second-click", intent: { ...wrong.intent, revision: 1 } });
    await mistake; await sync(bomb);
    expect(state!.lives).toBe(2); expect(state!.orderingRevision).toBe(1);
    manual.emit("submit_action", { ...wrong, actionId: "wrong-role" }); await sync(manual);
    expect(state!.lives).toBe(2);

    // Read the manual as a player would; no access to authoritative server state.
    const values = Object.fromEntries(manualState!.calculations.map(({ letter, expression }) => {
      const [left, op, right] = expression.split(" "); return [letter, op === "+" ? Number(left) + Number(right) : Number(left) - Number(right)];
    })) as Record<Letter, number>;
    for (const value of sorted) await send({ type: "select_ordering_number", value, revision: state!.orderingRevision });
    const answers = [values.A + values.B, values.B - values.C, values.C + values.A];
    for (let row = 0; row < 3; row++) await send({ type: "submit_numeric_answer", row: row as 0 | 1 | 2, value: answers[row] });
    const manualWin = next<StatePayload>(manual, "state_updated", (p) => p.state?.phase === "won");
    for (let row = 0; row < 3; row++) {
      const equation = state!.operatorEquations[row];
      const left = equation.left in values ? values[equation.left as Letter] : Number(equation.left);
      const right = equation.right in values ? values[equation.right as Letter] : Number(equation.right);
      await send({ type: "select_operator", row: row as 0 | 1 | 2, value: left + right === equation.result ? "+" : "-" });
    }
    await manualWin; expect(state!.phase).toBe("won"); expect(state!.completedSections).toHaveLength(3);
    await replay();
    for (const row of [0, 1, 2] as const) await send({ type: "submit_numeric_answer", row, value: 999 });
    expect(state!.phase).toBe("lost"); expect(state!.resultReason).toBe("lives"); expect(state!.lives).toBe(0);
    await replay();
    const expired = next<StatePayload>(bomb, "state_updated", (p) => p.state?.phase === "lost");
    bomb.emit("submit_action", { code, roundId: state!.roundId, actionId: "late", intent: { type: "submit_numeric_answer", row: 0, value: 999 } });
    const clock = vi.spyOn(Date, "now").mockReturnValue(state!.timerEndsAt! + 1);
    await expired; clock.mockRestore();
    expect(state!.resultReason).toBe("time"); expect(state!.lives).toBe(3);
    const partnerLeft = next<StatePayload>(bomb, "state_updated", (p) => p.players.some((player) => !player.connected));
    manual.disconnect(); await partnerLeft;
  } finally {
    vi.restoreAllMocks();
    if (code && bomb.connected) { const closed = next(bomb, "room_closed"); bomb.emit("leave_room", { code }); await closed; }
    bomb.disconnect(); manual.disconnect();
    await new Promise<void>((resolve) => server.io.close(() => resolve())); server.httpServer.close();
  }
}, 40000);
