---
trigger: model_decision
description: Current multiplayer backend architecture, deployment decisions, and extension guide for adding online multiplayer to other games.
---

# Multiplayer Backend

## Purpose

This file explains the current backend multiplayer architecture used in this repo.

It is meant to help future work on other games without needing to read the whole `multiplayer-server/` folder first.

This is not a rules doc for any specific game. Crown Chase remains the first reference example, while Math War, Stop Matemático, Super Jogo da Velha, and Caça Soma now add game-specific variations of the same server-authoritative approach.

## Current Reality

- Online multiplayer currently exists for Crown Chase, Math War, Stop Matemático, Super Jogo da Velha, Caça Soma, and Bomb Game Level 1.
- The frontend remains a static site.
- The backend is a separate Node.js service deployed independently from the frontend.
- The server is authoritative. Clients do not own the real game state during online play.
- Rooms are in memory only. There is no database, login, account system, or persistence.
- Crown Chase, Math War, Super Jogo da Velha, Caça Soma, and Stop Matemático support one shared temporary classroom code that groups each game's visible waiting rooms.
- Student classroom membership is remembered across supported games in browser `localStorage`; room and match sessions remain game-specific.
- Temporary classroom sessions are in memory, last 8 hours, and can be deleted from the creating browser.
- Reconnection after refresh is not implemented yet.
- Crown Chase uses the root Socket.io namespace.
- Math War uses the `/math-war` namespace.
- Stop Matemático uses the `/stop` namespace.
- Super Jogo da Velha uses the `/spttt` namespace.
- Caça Soma uses the `/caca-soma` namespace.
- Bomb Game uses the `/bomb-game` namespace.

Important:

- `.agents/rules/multiplayer_private_rooms.md` is the original planning document.
- `.agents/rules/docs_classroom_system.md` is the current implementation guide for temporary classroom codes and room browsers.
- This file describes the implemented architecture and the decisions that were actually used.
- When the plan doc and the code disagree, trust the code and this file.

## Why The Backend Is Separate

The frontend is deployed as a static site, so it cannot run a persistent WebSocket process.

Because of that, online multiplayer is split into two deploys:

- Frontend: static site
- Backend: separate Node.js web service

Current hosting choice:

- Frontend stays on GitHub Pages behind Cloudflare
- Backend runs on Render

This split is intentional and should stay unless the whole platform hosting model changes later.

## Core Architecture

```text
Browser client
  -> sends room actions and move intents
Node multiplayer server
  -> validates room action
  -> validates move with shared game logic
  -> updates authoritative state
  -> broadcasts full updated state
Browser clients
  -> re-render from server state
```

The key rule is:

- clients send intents
- server resolves and applies
- clients render the returned state

For Crown Chase and Math War, the move payload is a `MoveIntent` such as `{ from, to }`. Caça Soma instead sends selection and ready intents. In every case, the client does not send a fully trusted applied move or the next game state.

Caça Soma adds an important pattern for timed games:

- the server owns round phases
- the server transitions `countdown -> rolling -> playing`
- the server starts the real play timer only after the pre-round phases finish
- the server rejects early actions before the `playing` phase

## Main Files

Current implementation is spread across these areas:

- `multiplayer-server/src/server.ts`
  Server bootstrap, Express health check, Socket.io setup, namespaces, CORS from env.
- `multiplayer-server/src/sockets/registerRoomHandlers.ts`
  Crown Chase room lifecycle and socket event handling on the root namespace.
- `multiplayer-server/src/sockets/registerMathWarRoomHandlers.ts`
  Math War room lifecycle and socket event handling on `/math-war`.
- `multiplayer-server/src/sockets/registerCacaSomaRoomHandlers.ts`
  Caça Soma room lifecycle, dynamic 1v1/2v2 capacity, classroom room listing, server-controlled round phases, and socket event handling on `/caca-soma`.
- `multiplayer-server/src/sockets/registerStopRoomHandlers.ts`
  Stop Matemático room lifecycle, host-started 2–8 player rooms, classroom room listing, and socket event handling on `/stop`.
- `multiplayer-server/src/rooms/roomTypes.ts`
  Shared room structure, seat constants, timeout constants.
- `multiplayer-server/src/rooms/roomStore.ts`
  Small room-store factory used by each game namespace.
- `multiplayer-server/src/rooms/roomCode.ts`
  Short room code generation.
- `multiplayer-server/src/classrooms/classroomStore.ts`
  Temporary classroom code generation, management tokens, expiry, and deletion.
- `multiplayer-server/src/crownChase/crownChaseAdapter.ts`
  Thin adapter that connects the backend to the pure Crown Chase domain logic.
- `multiplayer-server/src/mathWar/mathWarAdapter.ts`
  Thin adapter that connects the backend to the pure Math War v2 domain logic.
- `multiplayer-server/src/cacaSoma/cacaSomaAdapter.ts`
  Thin adapter that connects the backend to the pure Caça Soma v2 domain logic.
- `src/CrownChase/Logic/multiplayer/protocol.ts`
  Shared socket payload types and event names.
- `src/CrownChase/Hooks/useCrownChaseMultiplayer.ts`
  Client-side socket session state and event wiring.
- `src/Main/Pages/classroomsPage.tsx`
  Teacher-facing temporary classroom management page with game selection, linked from the manual.
- `src/CrownChase/Components/board-component.tsx`
  Board supports a remote mode where it emits intent instead of mutating state locally.
- `src/MathWar/Logic/multiplayer/protocol.ts`
  Shared Math War socket payload types and event names.
- `src/MathWar/Hooks/useMathWarMultiplayer.ts`
  Client-side Math War session state and event wiring.
- `src/MathWar/Components/board-component.tsx`
  Math War board supports local and remote authoritative modes.
- `src/SPTTT/Logic/multiplayer/protocol.ts`
  Shared Super Jogo da Velha socket payload types and event names.
- `src/SPTTT/Hooks/useSPTTTMultiplayer.ts`
  Client-side Super Jogo da Velha socket session state and event wiring.
- `src/SPTTT/Pages/multiplayerLobbyPage.tsx`
  Super Jogo da Velha private-room and classroom lobby.
- `src/Caca_soma/Logic/multiplayer/protocol.ts`
  Shared Caça Soma socket payload types and event names.
- `src/Caca_soma/Hooks/useCacaSomaMultiplayer.ts`
  Client-side Caça Soma socket session state and event wiring.
- `src/Caca_soma/Pages/multiplayerLobbyPage.tsx`
  Caça Soma host-controlled lobby for private or classroom-visible 1v1 and 2v2 rooms.
- `src/Caca_soma/Pages/multiplayerGamePage.tsx`
  Caça Soma online match UI rendered from authoritative state.
- `render.yaml`
  Render deployment config for the backend service.

## Main Decisions

These were deliberate choices, not accidents:

- The server is authoritative.
- Full game state is broadcast after every accepted move.
- Room state lives only in memory.
- There is no database for Phase 1.
- There is no reconnection flow yet.
- There is no account system or permanent player identity.
- Multiplayer was implemented for one game first instead of trying to build a fully generic engine up front.
- The server supports multiple games, but each game still keeps its own protocol, adapter, hook, and room handler.

This matters for future work:

- Reuse the pattern first.
- Generalize only after a second game creates real duplication worth extracting.
- Do not build a big generic multiplayer framework before there is proof that two or more games need the same abstraction.

## Shared Logic Boundary

Any game that wants online multiplayer needs a pure rules layer that both client and server can use.

The required properties are:

- deterministic
- side-effect free
- serializable state
- no React or browser APIs
- no local storage
- no DOM access
- no singleton mutable engine state

Crown Chase works because the backend can call pure logic through a very small adapter:

- create initial state
- resolve move intent
- apply action

That is the real multiplayer boundary.

If another game does not have a clean pure rules module yet, that refactor should happen before backend work starts.

## Generic Online Flow

Using Crown Chase as the example:

1. Player creates a room from the frontend.
2. Server generates a short code and stores a room in memory.
3. Second player joins using the code.
4. Both clients receive the initial state and seat assignment.
5. On a turn, the board emits an intent such as `{ from, to }`.
6. The hook sends `submit_move` to the backend.
7. The backend resolves and validates that intent with the shared game logic.
8. If valid, the backend applies the move and stores the next state.
9. The backend broadcasts the full updated state to both clients.
10. Both clients re-render from that state.

This same pattern should be used for other turn-based games unless they have a very different interaction model.

## Room Model

The current backend stores rooms in a `Map<roomCode, Room>`.

A room includes:

- room code
- status
- players
- authoritative game state
- timestamps
- rematch votes
- timeout handles for waiting-room expiry and disconnect grace

Important current lifecycle rules:

- room codes are short uppercase codes
- waiting rooms expire after 10 minutes
- disconnect gets a 30 second grace period
- explicit leave closes the room immediately
- rematch happens inside the same room
- rematch starts only after both players vote
- rematch is allowed only if both players are still connected

These values are simple on purpose. Keep them simple unless real usage proves they are wrong.

## Socket Contract Pattern

Current pattern:

Client to server:

- `create_room`
- `join_room`
- `submit_move`
- `request_rematch`
- `leave_room`

Server to client:

- `room_created`
- `room_joined`
- `room_ready`
- `state_updated`
- `rematch_requested`
- `rematch_started`
- `opponent_left`
- `room_closed`
- `multiplayer_error`

For future games, keep the same room lifecycle event shape when possible.

The game-specific part should usually be only:

- the payload used to describe an intended move or action
- the game state type
- any game-specific domain events that need to be rendered

## Client Responsibilities

The online client should stay thin.

Its job is:

- connect to the socket server
- keep local session state for the current tab
- show lobby and room UI
- send move intents
- render the latest authoritative game state
- block interaction when it is not the local player turn

Its job is not:

- deciding the official result of a move
- mutating the real online game state by itself
- trusting local-only move validation as the final authority

For Crown Chase and Math War, this required a `remote` board mode. That is an important pattern:

- local mode can apply moves itself
- remote mode must emit intent and wait for server state

Any board game added later should follow the same split.

## Session Behavior

The current client hook stores lightweight multiplayer session data in module state plus `sessionStorage`.

This helps with normal in-app navigation inside the same tab, but it is not true reconnection.

Current behavior:

- leaving the online route closes the room session on purpose
- refreshing the page is effectively a disconnect
- the backend may keep the room alive briefly during the disconnect grace window, but the frontend does not rejoin automatically

This is good enough for Phase 1 and should not be treated as a bug unless reconnection work is explicitly in scope.

## Client Reliability Analytics

The frontend now uses `src/analytics/MultiplayerReliabilityTracker.ts` in all
six multiplayer hooks. It measures participant-side lobby/connection
reliability without sending names, room/classroom codes, socket IDs, or raw
server messages.

Current signals:

- `multiplayer_join_result` begins after local input validation and finishes
  on `room_joined`, a controlled join error, or a network/configuration failure;
- `wait_ms` includes server cold-start and network delay;
- private-code and classroom-room joins use separate controlled context;
- `multiplayer_disconnect` fires after a server-confirmed created/joined room
  loses its socket unexpectedly while waiting or playing;
- intentional `io client disconnect` leaves and ended-room disconnects are
  excluded.

These are affected-participant events, not canonical room or match counts.
Online game start/end events remain deferred until a canonical match emitter
or an explicitly participant-scoped lifecycle is designed. See
`.agents/rules/googleanalytics.md` for the payload and reporting contract.

## How To Add Multiplayer To Another Game

Use this order:

1. Make sure the game has a pure shared rules module.
2. Make sure the game board or page can run in a server-authoritative remote mode.
3. Add a small backend adapter for that game, similar to the Crown Chase adapter.
4. Define that game's socket protocol types.
5. Add a game-specific multiplayer hook and lobby/game pages.
6. Reuse the existing room and lifecycle approach unless the game truly needs different behavior.
7. Prefer a dedicated namespace when adding another game if that avoids event-name collisions with already shipped multiplayer flows.
8. Test locally with two tabs before touching deployment.
9. Deploy only after local two-device testing is solid.

If the game should also support classroom room browsing, read `.agents/rules/docs_classroom_system.md` after the base online multiplayer flow is working. Do not add classroom browsing before the game has a reliable private-room flow.

Things to avoid:

- duplicating core rules between client and server
- making the board authoritative in online mode
- introducing a database before it is actually needed
- over-generalizing the backend after only one game

## Local Development And Env Wiring

Current local setup:

- frontend runs from the main repo with `npm run dev`
- backend runs from `multiplayer-server/` with `npm run dev`
- frontend points to the backend through `VITE_MULTIPLAYER_SERVER_URL`

Typical local frontend env:

```env
VITE_MULTIPLAYER_SERVER_URL=http://localhost:3001
```

Important split:

- frontend env uses `VITE_MULTIPLAYER_SERVER_URL`
- backend env uses values such as `HOST`, `PORT`, and `CLIENT_ORIGINS`

For production:

- backend is deployed first
- then the frontend production env is updated with the public backend URL
- then the frontend is rebuilt and redeployed

This ordering matters. The public frontend cannot work until the backend URL already exists.

## Render Deployment Notes

The repo uses a root `render.yaml` so the multiplayer backend can be deployed from this monorepo as a Render Blueprint.

Important current deployment decisions:

- Render is used only for the backend
- the frontend remains a static deploy
- CORS is driven by `CLIENT_ORIGINS`
- the backend exposes `/health` for Render health checks

Current required backend env:

- `CLIENT_ORIGINS`

Current example value:

```text
https://jogandocomlogica.com,https://www.jogandocomlogica.com
```

If the backend hosting changes later, update this file to explain the new deployment pattern instead of leaving Render instructions as false current reality.

## What Phase 1 Is Supposed To Already Handle

The current multiplayer pattern is intended to cover this baseline feature set:

- create private room
- join room by code
- authoritative turn validation
- both players stay in sync through full-state updates
- reject invalid or out-of-turn moves
- handle normal game ending
- rematch in the same room
- leave room
- opponent disconnect handling
- waiting-room expiration

If a future game is being added to multiplayer and it does not at least meet this baseline, it is still behind the current Crown Chase standard.

## Local QA Checklist

Before deploying multiplayer for another game, test at least these cases locally:

- second tab can join a valid room code
- invalid code fails cleanly
- both boards stay in sync after each move
- only the correct player can act
- trying to act out of turn does not break the room
- win or end-of-game state reaches both clients correctly
- rematch resets both clients correctly
- closing one tab notifies the other player
- leaving the online flow closes the room cleanly
- waiting room actually expires when nobody joins

The first serious test should be two tabs. The second serious test should be two real devices.

## When To Generalize

The backend supports several online games while keeping game-specific handlers and adapters.

If duplication becomes costly, the most likely shared pieces to extract are:

- room lifecycle
- room code generation
- generic socket connection helpers
- generic waiting/disconnect/rematch handling

The parts that should remain game specific are:

- game state type
- move intent type
- rules adapter
- online pages and UI text

## Hosting Decision For Now

Current decision:

- stay on Render free plan for the backend for now
- keep the frontend as a static deploy

Reason:

- there are no real users yet
- the current goal is validation, testing, and learning
- free-tier cold starts are acceptable for now

Upgrade only when the free plan becomes a real product problem, for example:

- regular public usage starts
- cold starts become too annoying
- classroom sessions need better reliability
- more online games increase backend importance

The expected first infrastructure upgrade is the backend service, not the frontend host.

Important latency note:

- free-tier cold starts affect the start of a session after inactivity
- per-move delay is mostly caused by the current server-authoritative round trip plus real network latency

In other words:

- paying for backend compute can improve reliability
- it does not remove the core round-trip delay by itself

If move responsiveness becomes a product problem, the first likely UX improvement is optimistic client rendering with server reconciliation, not a full architecture rewrite.

## Current Limitations

Not implemented yet:

- reconnection after refresh
- spectators
- public matchmaking
- persistence across backend restarts
- server-side room/match monitoring and canonical match analytics
- cross-game shared multiplayer framework

These are all optional future improvements, not missing parts of the current core architecture.

## Source Of Truth

When working on multiplayer, use this order of trust:

1. current code in `multiplayer-server/`
2. current shared protocol and client hook
3. this document
4. older planning docs

If this file becomes outdated, update it when the architecture changes so future multiplayer work does not have to be rediscovered from scratch.
