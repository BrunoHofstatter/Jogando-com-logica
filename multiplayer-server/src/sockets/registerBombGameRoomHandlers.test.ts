import type { AddressInfo } from "node:net";
import { io, type Socket } from "socket.io-client";
import { expect, it, vi } from "vitest";
import { createMultiplayerServer } from "../server.ts";
import type { NavigationBombViewState, NavigationManualViewState, RoomPayload, StatePayload } from "../../../src/BombGame/Logic/multiplayer/protocol.ts";
import type { NavigationIntent } from "../../../src/BombGame/Logic/navigation.ts";

function next<T>(socket: Socket, event: string, matches: (value: T) => boolean = () => true): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { socket.off(event, listener); reject(new Error(`Timed out: ${event}`)); }, 8000);
    const listener = (value: T) => {
      if (!matches(value)) return;
      clearTimeout(timeout);
      socket.off(event, listener);
      resolve(value);
    };
    socket.on(event, listener);
  });
}

it("enforces navigation roles, deadlines, lives, duplicate protection and fresh replay rounds over sockets", async () => {
  const server = createMultiplayerServer();
  await new Promise<void>((resolve) => server.httpServer.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${(server.httpServer.address() as AddressInfo).port}/bomb-game`;
  const bomb = io(url, { forceNew: true, transports: ["websocket"] });
  const manual = io(url, { forceNew: true, transports: ["websocket"] });
  let code: string | null = null;
  let actionId = 0;
  try {
    await Promise.all([next(bomb, "connect"), next(manual, "connect")]);
    const invalid = next<{ code: string }>(bomb, "multiplayer_error");
    bomb.emit("create_room", { playerName: "Bomba", hintsEnabled: false, levelId: 2 });
    expect((await invalid).code).toBe("invalid_level");
    // Existing clients can omit the level and still create Numbers.
    let created = next<RoomPayload>(bomb, "room_created");
    bomb.emit("create_room", { playerName: "Bomba", hintsEnabled: false });
    const legacyRoom = await created;
    code = legacyRoom.code;
    expect(legacyRoom.levelId).toBe(1);
    let closed = next(bomb, "room_closed");
    bomb.emit("leave_room", { code });
    await closed;
    created = next<RoomPayload>(bomb, "room_created");
    bomb.emit("create_room", { playerName: "Bomba", hintsEnabled: false, levelId: 3 });
    code = (await created).code;
    const joined = next<RoomPayload>(manual, "room_joined");
    manual.emit("join_room", { playerName: "Manual", code });
    expect((await joined).levelId).toBe(3);

    const start = async () => {
      const bombPlaying = next<StatePayload>(bomb, "state_updated", (p) => p.state?.phase === "playing");
      const manualPlaying = next<StatePayload>(manual, "state_updated", (p) => p.state?.phase === "playing");
      bomb.emit("set_role_preference", { code, preference: "bomb" });
      manual.emit("set_role_preference", { code, preference: "manual" });
      bomb.emit("set_ready", { code, ready: true });
      manual.emit("set_ready", { code, ready: true });
      return [(await bombPlaying).state as NavigationBombViewState, (await manualPlaying).state as NavigationManualViewState] as const;
    };
    let [state, manualState] = await start();
    const originalRound = state.roundId;
    expect(state.lives).toBe(3);
    expect(state.timerEndsAt! - Date.now()).toBeGreaterThan(250_000);
    expect(state.timerEndsAt! - Date.now()).toBeLessThanOrEqual(252_000);
    expect(state).not.toHaveProperty("maps");
    expect(state).not.toHaveProperty("componentValues");
    expect(manualState).not.toHaveProperty("routes");
    expect(manualState).not.toHaveProperty("correctMap");

    // Unauthorized manual movement is ignored; a wrong equation updates only the manual.
    manual.emit("submit_action", { code, roundId: originalRound, actionId: "manual-move", intent: { type: "move_probe", to: 3, revision: 0 } });
    const wrongAnswer = next<StatePayload>(manual, "state_updated", (p) => p.state?.eventId === 1);
    manual.emit("submit_action", { code, roundId: originalRound, actionId: "wrong-equation", intent: { type: "solve_component", component: 0, value: 99, revision: 0 } });
    expect((await wrongAnswer).state).toMatchObject({ lives: 3, wrongEquation: 0, solvedValues: [null, null, null] });

    // A wrong round token and nonadjacent move must not consume a revision or a heart.
    bomb.emit("submit_action", { code, roundId: "stale", actionId: "stale", intent: { type: "move_probe", to: 3, revision: 0 } });
    bomb.emit("submit_action", { code, roundId: originalRound, actionId: "skip", intent: { type: "move_probe", to: 8, revision: 0 } });
    const moved = next<StatePayload>(bomb, "state_updated", (p) => p.state?.eventId === 2);
    const firstMove = { code, roundId: originalRound, actionId: "same-id", intent: { type: "move_probe", to: 3, revision: 0 } };
    bomb.emit("submit_action", firstMove);
    bomb.emit("submit_action", firstMove);
    state = (await moved).state as NavigationBombViewState;
    expect(state).toMatchObject({ gridPosition: 3, gridRevision: 1, lives: 3 });

    // Check the deadline on receipt, even before the scheduled timer callback runs.
    const expired = next<StatePayload>(bomb, "state_updated", (p) => p.state?.phase === "lost");
    bomb.emit("submit_action", { code, roundId: originalRound, actionId: "late", intent: { type: "move_probe", to: -1, revision: 1 } });
    // Advance after enqueueing, so the client's own heartbeat check still uses real time.
    const clock = vi.spyOn(Date, "now").mockReturnValue(state.timerEndsAt! + 1);
    expect((await expired).state).toMatchObject({ phase: "lost", resultReason: "time", gridPosition: 3, lives: 3 });
    clock.mockRestore();

    const singleVote = next<StatePayload>(bomb, "state_updated", (p) => p.state?.replayVotes.length === 1);
    bomb.emit("set_replay_vote", { code, wantsReplay: true });
    expect((await singleVote).state?.phase).toBe("lost");
    const reset = next<StatePayload>(bomb, "state_updated", (p) => p.state === null && p.players.every((player) => !player.ready));
    manual.emit("set_replay_vote", { code, wantsReplay: true });
    expect((await reset).levelId).toBe(3);
    [state, manualState] = await start();
    expect(state.roundId).not.toBe(originalRound);
    expect(state).toMatchObject({ lives: 3, gridPosition: -1, energyStep: -1, completedSections: [], gridRevision: 0, energyRevision: 0 });
    expect(manualState.solvedValues).toEqual([null, null, null]);
    bomb.emit("submit_action", { code, roundId: originalRound, actionId: "old-round", intent: { type: "move_probe", to: 3, revision: 0 } });

    const values: number[] = [];
    for (const equation of manualState.equations) {
      const left = equation.left === "previous" ? values[values.length - 1] : equation.left;
      values.push(equation.operator === "+" ? left + equation.right : left - equation.right);
    }
    const expensive = state.routes.findIndex((route) => route.reduce<number>((total, id) => total + values[id], 0) > state.initialEnergy);
    const send = async (intent: NavigationIntent) => {
      const updated = next<StatePayload>(bomb, "state_updated", (p) => (p.state?.eventId ?? 0) > state.eventId);
      const payload = { code, roundId: state.roundId, actionId: `energy-${actionId++}`, intent };
      bomb.emit("submit_action", payload);
      bomb.emit("submit_action", payload);
      state = (await updated).state as NavigationBombViewState;
    };
    for (let attempt = 0; attempt < 3; attempt += 1) {
      for (let step = 0; step < state.routes[expensive].length; step += 1) await send({ type: "move_energy", route: expensive, step, revision: state.energyRevision });
      expect(state).toMatchObject({ lives: 2 - attempt, gridPosition: -1, energyStep: -1, activeRoute: null, energy: state.initialEnergy });
    }
    expect(state).toMatchObject({ phase: "lost", resultReason: "lives" });
    closed = next(bomb, "room_closed");
    bomb.emit("leave_room", { code });
    await closed;
    code = null;
  } finally {
    vi.restoreAllMocks();
    if (code && bomb.connected) {
      const closed = next(bomb, "room_closed");
      bomb.emit("leave_room", { code });
      await closed;
    }
    bomb.disconnect(); manual.disconnect();
    await new Promise<void>((resolve) => server.io.close(() => resolve()));
    server.httpServer.close();
  }
}, 25_000);
