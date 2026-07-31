---
trigger: model_decision
description: Temporary classroom code system for online multiplayer room browsers.
---

# Classroom System

## Purpose

The classroom system lets a teacher create one short temporary code that works across every supported online game. Students enter the code once, and supported game lobbies remember it while listing only that game's open waiting rooms.

This is not login, authentication, or a permanent class roster. It is a lightweight classroom filter for live in-class multiplayer sessions.

## Current Reality

- Caça Coroa, Super Jogo da Velha, Guerra Matemática, Caça Soma, Stop Matemático, and Bomb Game currently implement the classroom room browser.
- The teacher-facing page is `/turmas`.
- The manual page links to `/turmas` with `Gerenciar turmas online`.
- Classroom sessions are stored in memory on the multiplayer server.
- Classroom sessions expire after 8 hours.
- Classrooms are game-independent. One code works across every supported online game.
- Student classroom membership is stored in `localStorage` and remembered across game navigation.
- Each game namespace still owns and lists only its own rooms.
- The teacher can delete classrooms created from the same browser.
- Teacher management uses a random `managementToken` stored in that browser's `localStorage`.
- Each classroom card has a collapsed, management-token-protected live monitor for rooms across all supported games.
- The monitor shows waiting, playing, and retained ended rooms, including entered player names, connection state, and occupancy.
- Students do not need accounts.
- Existing private rooms remain available and should not be removed.

Current implementation files:

- `multiplayer-server/src/classrooms/classroomStore.ts`
  Temporary classroom code generation, 8-hour expiry, management tokens, and deletion.
- `multiplayer-server/src/classrooms/classroomMonitor.ts`
  Cross-namespace room-summary aggregation and teacher monitor broadcasts.
- `multiplayer-server/src/sockets/registerRoomHandlers.ts`
  Caça Coroa room lifecycle plus classroom room listing on the root namespace.
- `multiplayer-server/src/sockets/registerSptttRoomHandlers.ts`
  Super Jogo da Velha room lifecycle plus classroom room listing on the `/spttt` namespace.
- `multiplayer-server/src/sockets/registerMathWarRoomHandlers.ts`
  Guerra Matemática room lifecycle plus classroom room listing on the `/math-war` namespace.
- `multiplayer-server/src/sockets/registerCacaSomaRoomHandlers.ts`
  Caça Soma room lifecycle plus dynamic-capacity classroom room listing on the `/caca-soma` namespace.
- `multiplayer-server/src/sockets/registerStopRoomHandlers.ts`
  Stop Matemático room lifecycle plus host-started, dynamic-capacity classroom room listing on the `/stop` namespace.
- `src/Main/Pages/classroomsPage.tsx`
  Teacher-facing temporary classroom page with game selection.
- `src/Main/CSS/classrooms.module.css`
  Teacher classroom page styles.
- `src/CrownChase/Logic/multiplayer/protocol.ts`
  Classroom socket payload and event types.
- `src/Shared/Classrooms/activeClassroomSession.ts`
  Shared browser-level student classroom membership, expiry, and cross-tab synchronization.
- Each game's multiplayer hook
  Validates the shared classroom when its lobby connects and owns that game's live open-room updates.
- `src/CrownChase/Pages/multiplayerLobbyPage.tsx`
  Student lobby UI for entering classrooms, creating classroom-visible rooms, and joining open rooms.
- `src/Caca_soma/Logic/multiplayer/protocol.ts`
  Caça Soma classroom events and richer dynamic-capacity open-room summaries.
- `src/Caca_soma/Hooks/useCacaSomaMultiplayer.ts`
  Caça Soma classroom session state and live open-room updates.
- `src/Caca_soma/Pages/multiplayerLobbyPage.tsx`
  Caça Soma classroom lobby, occupancy display, and sequential team-assignment explanation.

## User Flow

Teacher:

1. Opens `/manual`.
2. Clicks `Gerenciar turmas online`.
3. Opens `/turmas`.
4. Clicks `Criar Nova Turma`.
5. Receives a four-letter classroom code, such as `BKRM`.
6. Writes the code on the board.
7. Optionally copies or deletes the code from the same browser.
8. Optionally expands `Acompanhar salas` to see live rooms and the students occupying them.

Student:

1. Opens the online lobby for a supported game.
2. Enters their name.
3. Clicks `Entrar em Turma`.
4. Types the classroom code.
5. Sees open rooms for that classroom and game.
6. Either creates a visible classroom room or joins another student's room. Caça Soma asks whether the new room is `1v1` or `2v2` before creating it.
7. Can change games without entering the classroom code again.

For Caça Coroa, Super Jogo da Velha, and Guerra Matemática, the visible room card is intentionally minimal:

```text
Sala de Ana
[ Entrar ]
```

Caça Soma room cards also show mode, occupancy, difficulty, and target score because those settings affect whether and how students should join:

```text
Sala de Ana
2 contra 2 · 2/4 jogadores
Médio · Primeiro a 3
[ Entrar ]
```

Stop Matemático room cards show occupancy, difficulty, number of rounds, and whether difficulty is fixed or progressive:

```text
Sala de Ana
3/8 jogadores
Médio 1 · 5 rodadas · Progressiva
[ Entrar ]
```

## Code Rules

Classroom codes:

- are generated by the server;
- are unique among active in-memory classrooms;
- use four uppercase readable letters;
- exclude visually confusing letters.

Current classroom character set:

```text
ABCDEFGHJKMNPQRSTUVWXYZ
```

This excludes `I`, `L`, and `O`. Do not switch classroom codes to teacher-chosen names until there is a proper persistence and collision strategy.

Room codes:

- remain the existing short private room codes;
- are still generated for classroom-visible rooms;
- remain useful as fallback direct-join codes.

## Server Model

The classroom store currently has this conceptual shape:

```ts
type TemporaryClassroom = {
  code: string;
  managementToken: string;
  expiresAt: number;
};
```

The game room needs these additional fields:

```ts
type RoomVisibility = "private" | "classroom";

type ClassroomRoomFields = {
  visibility: RoomVisibility;
  classroomCode: string | null;
};
```

Only rooms with `visibility: "classroom"` and a matching `classroomCode` should appear in classroom room lists.

## Socket Events

Current classroom lifecycle events:

Client to server:

- `create_classroom`
- `list_managed_classrooms`
- `delete_classroom`
- `join_classroom`
- `leave_classroom`
- `list_open_rooms`

Server to client:

- `classroom_created`
- `managed_classrooms`
- `classroom_deleted`
- `classroom_joined`
- `classroom_rooms_updated`
- `classroom_unavailable`
- `classroom_monitor_updated`

Teacher monitor client-to-server events on the root namespace:

- `watch_classroom`
- `unwatch_classroom`

Both monitor events require the classroom code and its matching `managementToken`. The teacher socket joins a separate `classroom-monitor:{code}` channel; possession of the four-letter student code alone does not grant monitor access.

`classroom_joined` includes the classroom expiry so the browser can remember and expire the shared membership. Room creation is still the normal `create_room` event, with an optional `classroomCode`:

```ts
type CreateRoomPayload = {
  playerName: string;
  classroomCode?: string;
};
```

Caça Soma extends this payload with an optional `mode?: "1v1" | "2v2"`. Its current UI always sends the mode selected in the creation prompt; the server keeps the field optional so an older frontend can still create a room during deployment.

Joining a classroom-visible room still uses the normal `join_room` event with the room code. Do not create a separate "join classroom room" action unless a future game needs extra semantics.

## Open Room Filtering

The server must only list rooms that:

- belong to the requested game namespace or handler;
- have `visibility: "classroom"`;
- match the requested `classroomCode`;
- are still waiting for players;
- have at least one open seat;
- have a connected host or creator;
- are not already playing or ended.

For Caça Coroa and Super Jogo da Velha, "joinable" means:

- `room.status === "waiting"`;
- creator is connected;
- joiner seat is still empty.

For Caça Soma, "joinable" means:

- `room.status === "waiting"`;
- creator is connected;
- at least one seat is open within the current `1v1` or `2v2` capacity.

Caça Soma rooms stay visible after a player joins while seats remain open. Changing the room mode can change whether the room appears in the list.

For Stop Matemático, "joinable" means:

- `room.state.status === "lobby"`;
- the host is connected;
- `room.state.players.length < room.state.settings.playerLimit`.

Stop rooms stay visible while seats remain open, even after the minimum of two players has joined. The host starts the match manually, and starting removes the room from the classroom list. The existing player limit is used directly; there is no separate intended classroom capacity.

## Broadcast Rules

Broadcast updated classroom room lists when a visible room can enter or leave the list:

- classroom-visible room is created;
- player joins and the room becomes full or starts;
- host leaves;
- waiting room expires;
- room is closed;
- classroom is deleted or expires;
- game-specific settings change in a way that affects the summary or capacity.

Caça Soma broadcasts after changes to mode, difficulty, or target score because all three appear in its room summary.

Stop Matemático broadcasts after changes to difficulty, round count, player limit, or progressive difficulty because all four affect its room summary or visibility.

For deleted or expired classrooms, emit `classroom_unavailable` to students currently subscribed to that classroom channel.

## Teacher Management Boundary

The temporary version intentionally avoids accounts and database storage.

The management token:

- proves that this browser created the classroom;
- is stored in localStorage;
- can list and delete only matching classrooms;
- is not a security boundary for private student data because there is no roster or sensitive classroom record.

The live monitor is still restricted to a matching management token. It shows only names students entered inside active game rooms. It does not create a classroom roster, attendance record, identity guarantee, or permanent match history. Player totals count occupied room seats rather than deduplicating self-entered names.

Do not build permanent classrooms inside the temporary system. Permanent classrooms require a different product layer:

- teacher login;
- database persistence;
- account recovery;
- classroom ownership;
- classroom rename/delete screens;
- inactive-classroom cleanup;
- privacy decisions.

## Adding Classrooms To Another Game

Use this order:

1. Read `docs_multiplayer_backend.md` and the target game's rules doc.
2. Confirm the game already has server-authoritative online multiplayer.
3. Decide the open room summary fields for that game.
4. Add `visibility` and `classroomCode` to that game's room type.
5. Allow `create_room` to accept an optional `classroomCode`.
6. Validate that the classroom exists before creating a classroom-visible room.
7. Implement `getOpenClassroomRooms` for that game's capacity and status model.
8. Broadcast `classroom_rooms_updated` whenever that game's visible room list changes.
9. Make its hook validate and subscribe to the shared active classroom on connect.
10. Add a student classroom section to that game's online lobby.
11. Keep the private room flow intact.
12. Update this doc and `docs_multiplayer_backend.md` if the shared classroom architecture changes.

## UI Pattern

Teacher page:

```text
Turmas Online

Crie uma turma temporária para organizar partidas de Caça Coroa.
O código funciona por 8 horas.

[ Criar Nova Turma ]
[ Caça Coroa ] [ Super Jogo da Velha ] [ Guerra Matemática ] [ Caça Soma ]

BKRM
Jogo: Caça Coroa
Expira às 15:30

[ Copiar Código ] [ Excluir Turma ]
```

Student lobby:

```text
Caça Coroa Online

Seu nome
[ Ana ]

[ Criar Sala Privada ] [ Entrar em Sala ] [ Entrar em Turma ]

Código da turma
[ BKRM ]
[ Entrar na Turma ]

Turma BKRM
[ Criar Sala para a Turma ]

Sala de Bruno
[ Entrar ]
```

All user-facing text must be Brazilian Portuguese.

## Verification Checklist

For each game that adopts classrooms, test with multiple tabs:

- teacher creates a classroom and sees it in `/turmas`;
- generated code has four readable letters;
- teacher can copy and delete the classroom;
- teacher monitor is collapsed by default and opens only on request;
- opening the monitor with the correct management token shows rooms from every supported game;
- an invalid management token cannot subscribe to the monitor;
- waiting rooms appear immediately with the creator's name;
- joining, leaving, starting, ending, disconnecting, and closing update the monitor live;
- monitor occupancy uses the game's actual capacity and player limit;
- student can join the classroom with a valid code;
- invalid classroom code fails cleanly;
- creating a classroom-visible room makes it appear for another student in the same classroom;
- a student using a different classroom code does not see the room;
- private rooms never appear in classroom lists;
- joining from the list starts or fills the room correctly;
- full or started rooms disappear from the list;
- Caça Soma partially filled `2v2` rooms remain visible until all four seats are occupied;
- changing a Caça Soma room between `1v1` and `2v2` updates its capacity and visibility;
- creating private and classroom-visible Caça Soma rooms uses the selected initial `1v1` or `2v2` capacity immediately;
- partially filled Stop rooms remain visible until their existing player limit is reached;
- changing Stop settings updates its classroom room summary, and changing player limit updates visibility;
- starting a Stop room manually removes it from the classroom list;
- host leaving removes the room from the list;
- deleting the classroom prevents new joins;
- existing private room code join still works.

Browser visual verification is prohibited by default in this repo. Use browser checks only when the user explicitly authorizes them for the task.

## Current Limitations

- No persistent classrooms.
- No teacher login.
- No student accounts.
- No classroom roster.
- The monitor only includes students occupying rooms; students who entered a classroom but have not joined or created a room are not listed.
- No cross-device teacher management.
- No classroom analytics.
- No spectator or teacher monitor mode.
- No reconnection after refresh.

These are future product ideas, not missing pieces of the current temporary classroom system.
