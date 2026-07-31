---
trigger: model_decision
description: Implementation plan for basic private-room online multiplayer, starting with Crown Chase.
---

# Multiplayer - Private Rooms (Phase 1)

Scope: online 1v1 via a room code. No accounts, no matchmaking, no classroom system.
Target game: Crown Chase first, then MathWar and Damas can follow the same pattern.

## User Flow

```text
Player 1 opens "Jogar Online" -> clicks "Criar Sala"
  -> server generates code "X7K2"
  -> P1 waits on a lobby screen showing the code

Player 2 opens "Jogar Online" -> types "X7K2" -> clicks "Entrar"
  -> both see "Jogo comecando..." -> game loads

During the game:
  P1 makes a move -> client sends { from, to } to server
  Server resolves that intent against the shared Crown Chase logic
  Server broadcasts the new GameState to both players
  Both boards re-render

When game ends:
  Server sends winner info -> VictoryScreen shown to both
  Players can click "Jogar de novo" -> server resets state in the same room
  Or "Sair" -> room is destroyed
```

## Architecture

```text
jogando-com-logica/   (existing React app - client)
multiplayer-server/   (new Node.js server - separate folder or repo)
```

The server is authoritative: it holds the only real copy of `GameState`. Clients are renderers plus local interaction logic.

### Why a separate server

GitHub Pages only hosts static files. A WebSocket server needs a persistent process. The client stays on GitHub Pages and the multiplayer server runs on Render or Railway.

## Server Responsibilities

```ts
rooms: Map<roomCode, Room>

type Room = {
  code: string;
  players: [SocketId, SocketId | null];
  playerNames: [string, string | null];
  gameState: CrownChaseState;
  status: "waiting" | "playing" | "ended";
};
```

### Server socket events

| Event | Payload | What server does |
|---|---|---|
| `create_room` | `{ playerName }` | Generates a code, creates room, assigns P1, emits `room_created` |
| `join_room` | `{ code, playerName }` | Finds room, assigns P2, emits `game_start` to both |
| `make_move` | `{ from, to }` | Resolves the move intent with shared Crown Chase logic, updates state, emits `state_update` |
| `rematch` | none | Resets room state, emits `game_start` |
| `leave_room` | none | Removes player, notifies other player, cleans up if empty |
| `disconnect` | automatic | Same behavior as leave_room |

### Server -> client events

| Event | Payload | When |
|---|---|---|
| `room_created` | `{ code, playerIndex: 0 }` | P1 created room |
| `room_joined` | `{ playerIndex: 1 }` | P2 joined |
| `game_start` | `{ gameState, playerIndex }` | Both players connected or rematch starts |
| `state_update` | `{ gameState }` | After every valid move |
| `move_rejected` | `{ reason }` | Move failed validation |
| `opponent_disconnected` | none | Other player left mid-game |
| `room_not_found` | none | Join failed because code was invalid |

### Move validation on the server

The server should import the same pure Crown Chase module used by the client. The intended shared module is `src/CrownChase/Logic/v2/`.

```ts
import {
  applyAction,
  getLegalActions,
} from "../../client-src/CrownChase/Logic/v2";

const legalAction = getLegalActions(room.gameState).find(
  (candidate) =>
    candidate.from.row === intent.from.row &&
    candidate.from.col === intent.from.col &&
    candidate.to.row === intent.to.row &&
    candidate.to.col === intent.to.col,
);

if (!legalAction) {
  socket.emit("move_rejected", { reason: "illegal_action" });
  return;
}

const result = applyAction(room.gameState, legalAction);
if (!result.ok) {
  socket.emit("move_rejected", { reason: result.reason });
  return;
}

room.gameState = result.state;
io.to(room.code).emit("state_update", { gameState: room.gameState });
```

Recommended sharing model:
- Monorepo with a shared Crown Chase logic folder or package.
- Do not import the older mutable engine into the server.

## Client Changes

### New files

```text
src/CrownChase/
  Pages/
    multiplayerLobbyPage.tsx
    multiplayerGamePage.tsx
  Hooks/
    useMultiplayerSocket.ts
```

### New routes

```ts
CROWN_CHASE_MP_LOBBY: "/caca-coroa/online",
CROWN_CHASE_MP_GAME: "/caca-coroa/online/partida",
```

### Socket hook contract

```ts
{
  gameState,
  playerIndex,
  roomCode,
  connectionStatus,
  makeMove(intent),
  createRoom(name),
  joinRoom(code, name),
  rematch(),
}
```

### Multiplayer game page behavior

- Uses `useMultiplayerSocket` instead of local `GameEngine` + `getAIMove`.
- Sends move intent to the server instead of mutating local game state.
- Shows "Sua vez" / "Vez do oponente" from `currentPlayer === playerIndex`.
- Blocks interaction when it is not this player's turn.
- Handles `opponent_disconnected` with a clear notice.

## Player Identity

No accounts. Each player types a name in the lobby. The name is stored only in the room and shown to the opponent.

If a player refreshes mid-game, they disconnect. Reconnection is out of scope for Phase 1.

## Server Stack

```text
Node.js + TypeScript
socket.io
express
```

No database. Rooms live in memory. If the server restarts, rooms are lost. That is acceptable for Phase 1.

### Hosting

Render free tier is enough to start:
- Deploy from GitHub
- Persistent Node.js process
- Acceptable for testing and early classroom use

### Environment variables

```ts
const SERVER_URL = import.meta.env.VITE_MULTIPLAYER_SERVER_URL;
```

- `.env.production`: deployed server URL
- `.env.development`: local server URL

## Room Codes

Short uppercase codes without ambiguous characters.

```ts
const CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function generateCode(length = 4): string {
  return Array.from(
    { length },
    () => CHARS[Math.floor(Math.random() * CHARS.length)],
  ).join("");
}
```

## Out of Scope

- Reconnection after disconnect
- Spectators
- Public rooms
- Games other than Crown Chase
- Classroom or tournament systems
- Persistent scores or history
- Turn timers

## Implementation Steps

1. Set up the server repo or folder with Node.js, TypeScript, socket.io, and express.
2. Share `src/CrownChase/Logic/v2/` with the server.
3. Implement room events: `create_room`, `join_room`, `make_move`, `disconnect`.
4. Test the server locally with two browser tabs.
5. Add `useMultiplayerSocket`.
6. Build `multiplayerLobbyPage.tsx`.
7. Build `multiplayerGamePage.tsx`.
8. Add multiplayer routes.
9. Add a Crown Chase entry point for "Jogar Online".
10. Deploy the server and wire `VITE_MULTIPLAYER_SERVER_URL`.
11. Test on production with two devices.
