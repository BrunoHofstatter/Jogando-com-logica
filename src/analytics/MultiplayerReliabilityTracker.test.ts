import { describe, expect, it, vi } from "vitest";
import { MultiplayerReliabilityTracker } from "./MultiplayerReliabilityTracker";

function createTracker(nowValue = 1_000) {
  let now = nowValue;
  const sendJoinResult = vi.fn(() => true);
  const sendDisconnect = vi.fn(() => true);
  const tracker = new MultiplayerReliabilityTracker(
    sendJoinResult,
    sendDisconnect,
    () => now,
  );

  return {
    tracker,
    sendJoinResult,
    sendDisconnect,
    setNow(value: number) {
      now = value;
    },
  };
}

describe("MultiplayerReliabilityTracker", () => {
  it("reports one confirmed private-room join with elapsed wait time", () => {
    const { tracker, sendJoinResult, setNow } = createTracker();

    tracker.startJoin("caca_coroa", "private_code");
    setNow(1_275);

    expect(tracker.joinSucceeded()).toBe(true);
    expect(tracker.joinSucceeded()).toBe(false);
    expect(sendJoinResult).toHaveBeenCalledOnce();
    expect(sendJoinResult).toHaveBeenCalledWith({
      gameId: "caca_coroa",
      joinType: "private_code",
      success: true,
      waitMs: 275,
      errorCode: undefined,
    });
  });

  it("reports controlled classroom-room failures without room data", () => {
    const { tracker, sendJoinResult, setNow } = createTracker(2_000);

    tracker.startJoin("stop_matematico", "classroom_room");
    setNow(2_450);

    expect(tracker.failServer("room_full")).toBe(true);
    expect(sendJoinResult).toHaveBeenCalledWith({
      gameId: "stop_matematico",
      joinType: "classroom_room",
      success: false,
      waitMs: 450,
      errorCode: "room_full",
    });
  });

  it("normalizes unknown server failures instead of sending raw codes", () => {
    const { tracker, sendJoinResult } = createTracker(5_000);

    tracker.startJoin("bomb_game", "private_code");
    tracker.failServer("database_secret_failure");

    expect(sendJoinResult).toHaveBeenCalledWith({
      gameId: "bomb_game",
      joinType: "private_code",
      success: false,
      waitMs: 0,
      errorCode: "server_error",
    });
  });

  it("ignores automatic classroom validation errors during private joins", () => {
    const { tracker, sendJoinResult } = createTracker(9_000);

    tracker.startJoin("super_jogo_da_velha", "private_code");

    expect(tracker.failServer("classroom_not_found")).toBe(false);
    expect(tracker.joinSucceeded()).toBe(true);
    expect(sendJoinResult).toHaveBeenCalledOnce();
  });

  it("keeps private room creation context after automatic classroom failure", () => {
    const { tracker, sendDisconnect } = createTracker();

    tracker.startRoomCreation("caca_coroa", "private_code");
    expect(tracker.failServer("classroom_not_found")).toBe(false);
    expect(tracker.roomCreated()).toBe(true);
    tracker.disconnected("transport error", "waiting");

    expect(sendDisconnect).toHaveBeenCalledWith({
      gameId: "caca_coroa",
      joinType: "private_code",
      connectionStage: "waiting",
      errorCode: "transport_error",
    });
  });

  it("reports unexpected disconnects only after a room is confirmed", () => {
    const { tracker, sendDisconnect } = createTracker();

    tracker.startRoomCreation("caca_soma", "classroom_room");
    expect(tracker.roomCreated()).toBe(true);
    expect(tracker.disconnected("ping timeout", "playing")).toBe(true);
    expect(tracker.disconnected("transport close", "playing")).toBe(false);
    expect(sendDisconnect).toHaveBeenCalledWith({
      gameId: "caca_soma",
      joinType: "classroom_room",
      connectionStage: "playing",
      errorCode: "timeout",
    });
  });

  it("ignores intentional leaves and completed-room disconnects", () => {
    const { tracker, sendDisconnect } = createTracker();

    tracker.startRoomCreation("guerra_matematica", "private_code");
    tracker.roomCreated();
    expect(tracker.disconnected("io client disconnect", "playing")).toBe(false);

    tracker.startRoomCreation("guerra_matematica", "private_code");
    tracker.roomCreated();
    expect(tracker.disconnected("transport close", "ended")).toBe(false);
    expect(sendDisconnect).not.toHaveBeenCalled();
  });

  it("converts a connection loss during join into one failed join only", () => {
    const { tracker, sendJoinResult, sendDisconnect } = createTracker();

    tracker.startJoin("stop_matematico", "private_code");
    expect(tracker.disconnected("transport close", "connecting")).toBe(true);

    expect(sendJoinResult).toHaveBeenCalledWith({
      gameId: "stop_matematico",
      joinType: "private_code",
      success: false,
      waitMs: 0,
      errorCode: "network_error",
    });
    expect(sendDisconnect).not.toHaveBeenCalled();
  });
});
