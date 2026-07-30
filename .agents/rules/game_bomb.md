---
trigger: model_decision
description: Bomb Game planning and implementation reference.
---

# Bomb Game

## Purpose of This File

Use this file as the main reference when discussing, designing, or implementing Bomb Game.

This file documents the current design direction. It should help future work stay aligned on:

- the online-only cooperative structure
- room and role flow
- level design expectations
- server authority boundaries
- the level design template used by non-programmer level designers

## Current Reality

- Bomb Game Level 1 has an implemented private-room frontend and authoritative backend flow.
- Bomb Game uses the shared online lobby conventions, cached player name, and temporary classroom browser used by the other online games.
- The game should be designed as an online-only two-player cooperative game.
- The project already has a separate multiplayer backend in `multiplayer-server/`.
- Online multiplayer should follow the current server-authoritative project pattern documented in `.agents/rules/docs_multiplayer_backend.md`.
- The internal code name can remain `BombGame` for now.
- The final user-facing name has not been decided yet.
- All user-facing text must be in Brazilian Portuguese when implemented.

## Core Concept

Bomb Game is a two-player cooperative communication game.

One player sees the bomb. The other player sees the manual. Neither player should be able to solve the level alone:

- the bomb player sees the puzzle state and can interact with the bomb
- the manual player sees rules, clues, or instructions, but not the live bomb state
- players must talk to each other to connect what each side knows

The game should preserve the feeling of a bomb-defusal challenge while being appropriate for students around ages 8 to 13.

## Online-Only Decision

Earlier planning assumed two offline devices with wall-clock synchronization. That model is no longer the target.

The current target is:

- internet connection required
- one online room per match
- backend owns the room state
- backend owns countdown, timer, role assignment, level selection, success, and failure
- clients send player intents
- server validates and broadcasts the updated state

Because the game is online, these older offline concepts should not be used:

- no wall-clock 10-second synchronization
- no manual level matching by both players
- no four-digit completion code
- no manual-side final code-entry verification
- no isolated offline guest session flow

## Player Roles

Each match has exactly two roles:

- Bomb player: sees the bomb UI and interacts with the puzzle.
- Manual player: sees the manual UI and gives instructions to the bomb player.

Role selection should use player preferences:

1. Each player chooses the role they prefer.
2. If players choose different roles, the server assigns those roles.
3. If both players choose the same role, the server randomly assigns roles.

This keeps the flow fair while still allowing friends to coordinate when they want to.

## Level Access And Hosting

The preferred flow is private-room first, with level selection controlled by the host.

Recommended model:

1. Host creates a room.
2. Host selects a level from the level list.
3. Host chooses whether hints are enabled.
4. Server creates the room and gives a room code.
5. Second player joins by room code.
6. Joined players can play that hosted level even if it is locked locally for them.

This keeps progression meaningful for the host while avoiding a bad social problem where friends cannot play together because one device has less progress.

Local level unlocks may still exist for browsing or hosting, but joining by room code should bypass local unlock restrictions.

## Room Flow

Baseline room flow:

1. Player creates a room.
2. Host selects a level.
3. Host selects hints on or off. Default should be hints on.
4. Second player joins with the room code.
5. Both players choose their preferred role.
6. Server assigns roles.
7. Both players click ready.
8. Server starts the countdown.
9. Server starts the round timer.
10. Players communicate out loud while each sees only their role-specific view.
11. Bomb player submits actions or answers.
12. Server validates actions and updates the room state.
13. Round ends in success or failure.

During a match:

- either player can leave
- the other player should be notified if their partner leaves or disconnects
- refresh/reconnection should not be promised unless that feature is explicitly implemented later

On failure:

- both players see a failure result
- both can vote to retry
- retry starts only after both players agree
- either player can leave instead

On success:

- both players see a success result
- both can vote to play the next level
- next level starts only after both players agree
- both can also vote to retry or leave

If only one player has voted for retry or next level, the UI should show a waiting state.

## Hints Setting

Hints are a room-level setting chosen by the host before the round starts.

Default:

- hints enabled

Server behavior:

- store `hintsEnabled` in the authoritative room state
- send it to both clients
- make it available to the active level

Level behavior:

- each level decides what `hintsEnabled` means
- simple levels may ignore hints
- hints should help students think, notice, compare, or recover from confusion
- hints do not need to be text

Do not build a generic feedback engine before levels prove they need one. Level-specific educational hints should stay inside each level's design and implementation.

## Educational Direction

Bomb Game can be educational without interrupting the active round with long explanations.

The active round should stay tense, cooperative, and communication-focused. The educational value should come from:

- logical deduction
- careful description
- listening and communication
- conditional reasoning
- sequencing
- comparing attributes
- math reasoning when a level uses numbers
- reflecting on the solution after a win or fail

Ordinary UI polish feedback, such as shaking, glow, hover states, button animations, success flashes, and timer pulse, does not need to be specified by non-programmer level designers. That can be handled during implementation.

The level design document should focus only on educational hints or teaching feedback.

## Level Design Philosophy

Each level should be flexible in design.

The shared identity is:

- there is a bomb
- the bomb contains one or more sections/modules
- the bomb player sees and interacts with those sections
- the manual player sees separate manual sections
- solving the level requires communication between both roles

Do not lock the game into one puzzle family too early. Level designers should be free to invent different puzzle mechanics over time.

However, every implemented level must be compatible with server authority:

- official puzzle state must be serializable
- official actions must be sent as intents
- official validation must happen on the server
- clients should not be trusted to decide success by themselves
- React-only internal state is acceptable for UI details, but not for authoritative puzzle state

## Approved Bomb Visual System

The implemented bomb-side shell uses the approved modern comic style.

Current visual direction:

- The bomb is a wide, lidless, shallow equipment case rather than an open suitcase with a raised lid.
- The case is mostly graphite gray, black, and dark metal, with bold ink outlines, simple cel shading, and restrained comic texture.
- Yellow-and-black caution strips provide the main warning accent.
- Clearly fictional red explosive bundles are attached around the outer rim so the object immediately reads as a cartoon bomb without looking old, realistic, or instructional.
- A separate reinforced timer case sits beside the landscape bomb and is connected with red, yellow, and blue wires.
- The portrait composition places the timer above the case and connects it with the same three wires.
- The shared background is a very dark wine red, matching the active Bomb Game screen.
- The generated artwork contains no digits, labels, buttons, puzzles, or baked-in interface text.

The image is the physical shell only. Interactive modules, timer digits, labels, status states, inputs, and accessible text remain HTML/CSS so they can change with game state, respond to different screens, and stay readable.

Implemented assets:

- `public/bombGameCaseComicLandscape.webp`: landscape case with the timer mounted at the right.
- `public/bombGameCaseComicPortrait.webp`: portrait case with the timer mounted above.
- `src/BombGame/Components/BombCaseLayout.tsx`: selects the artwork by orientation and overlays the live timer and current level content.
- `src/BombGame/styles/BombCaseLayout.module.css`: defines the calibrated safe areas for the timer and bomb modules.

For the first implementation, every level should reuse this same outer bomb visual. Variations to the shell are a future option, not a current requirement.

## Level-Specific Module Layout Rule

The outer bomb is shared, but the sections inside it must not be treated as one universal grid. Each level needs its own module composition based on its mechanics.

For every new level, decide and document:

- how many bomb modules it needs
- which module deserves the most space
- the exact landscape arrangement
- the exact portrait arrangement
- whether controls are buttons, switches, wires, symbols, diagrams, numeric inputs, or another interaction
- how players recognize pending, selected, mistaken, solved, and locked states
- how decorative wire paths and module accents reinforce the level without obscuring its controls
- why the proposed arrangement is readable at the expected content density

All modules must remain inside the calibrated interior safe area. They must not overlap the illustrated frame, explosive bundles, caution strips, connection wires, or timer. Generated artwork must never contain level-specific controls or answers; those remain live interface elements.

The three-panel Level 1 arrangement is specific to Level 1. It currently uses one wide sequence module above two calculation modules because the sequence benefits from horizontal space while the calculation modules benefit from additional height. A future level may instead use one full-size panel, two unequal columns, four compact modules, or another purpose-built arrangement. Do not copy Level 1 automatically.

Module colors may correspond with the bomb's red, yellow, and blue wires, but correctness and meaning must never depend on color alone. Labels, shapes, status lights, and state changes should provide redundant cues.

## Engine And Level Boundary

The game should still have an engine-level flow and level-specific content, but the online version changes what "engine" means.

The engine or room layer should handle:

- room creation and joining
- host level selection
- hints setting
- role preference collection
- role assignment
- ready state
- countdown
- timer
- match phase
- success and failure state
- retry voting
- next-level voting
- leave and disconnect behavior
- level registry

Each level should handle:

- bomb-side UI for that level
- manual-side UI for that level
- level-specific puzzle state shape
- level-specific player action types
- level-specific validation rules
- level-specific educational hints
- level-specific success condition

The level should not own:

- room lifecycle
- role assignment
- global countdown
- global timer
- retry or next-level voting
- final room result flow

## Server Authority

Online Bomb Game should follow the current project multiplayer pattern:

- clients send intents
- server validates
- server updates authoritative state
- server broadcasts the updated room state

Examples of possible level intents:

- cut a wire
- press a button
- enter a number
- select a symbol
- choose an item
- submit a sequence
- request or reveal a level-specific hint, if the level needs explicit hint actions

The exact intent types can vary by level.

The server should own:

- selected level
- assigned roles
- hints setting
- round phase
- timer start and end
- official puzzle state
- attempts, strikes, or mistakes when a level uses them
- success or failure

## Level Design Template

Use this template when designing a new Bomb Game level, especially in Google Docs.

```md
# Bomb Game Level Design Template

## Level Name

## Theme
What broad theme does this level use? Examples: Numbers, Geometry, Navigation.

## Bomb View

### Bomb Sections
List the sections/modules visible inside the bomb.

### Bomb Layout
Describe the exact module arrangement in landscape and portrait, which modules receive more space, and why that composition fits this level's interactions and content density.

### What The Bomb Player Sees
Describe exactly what appears on the bomb player's screen.

### Bomb Player Inputs
Describe what the bomb player can do.

## Manual View

### Manual Sections
List the sections/rule blocks shown to the manual player.

### What The Manual Player Sees
Describe exactly what instructions, clues, tables, diagrams, or rules appear in the manual.

## Solution Logic
Explain how the correct answer is determined.

## Educational Feedback / Hints

### Hint Goal
What should the hint help the players understand or notice?

### When It Happens
When should the hint appear or become available?
Examples: after a wrong input, after repeated mistakes, after too much time, after choosing a partial answer, near the end of the timer, after the round ends.

### What It Does
Describe the hint itself.
Examples: highlights a relevant clue, reveals a faded number or symbol, points to a section, asks a guiding question, shows a short text hint, reveals part of a rule, gives a post-round explanation.

### If Hints Are Disabled
What changes when the host turns hints off?
Usually: remove teaching hints, but keep the puzzle playable.
```

`Theme` should be required for every level (for example, Numbers, Geometry, or Navigation).

An explicit learning-goal field is not required. The level's educational practice should still be clear from its mechanics and documentation.

`Educational Feedback / Hints` may be simple or even unused for very easy levels, but level designers should still consider whether the level needs a hint or post-round teaching moment.

## Implementation Notes For Later

When implementation begins:

- use a dedicated Bomb Game multiplayer namespace unless there is a strong reason not to
- add Bomb Game protocol types under `src/BombGame/Logic/multiplayer/`
- add a Bomb Game client hook similar to the existing multiplayer hooks
- add backend room handling under `multiplayer-server/src/`
- keep level rules serializable and server-validatable
- fix placeholder mojibake in the current Bomb Game pages
- keep displayed text in Brazilian Portuguese

Do not implement a large generic Bomb Game framework before at least one template level proves what the architecture actually needs.

## Shared Lives And Timing

- Lives are shared by the team and visible to both players.
- Each level configures its starting lives and duration; the usual default is three lives.
- The server owns both values and the final failure decision.
- A level decides whether a valid player intent is correct or a mistake.
- A mistake costs at most one life. Malformed, unauthorized, duplicate, early, or late network intents do not cost lives.
- The shared match UI announces a lost heart. The level owns answer clearing, red feedback, retry behavior, and educational hints.
- The round timer continues during disconnect grace.

## Implemented Level 1: Numbers

- Theme: Numbers
- Duration: 3 minutes
- Shared lives: 3
- All three bomb sections are available simultaneously.
- Section 1 generates seven varied numbers across controlled low, middle, and high bands. The bomb player selects them from smallest to largest. Correct progress is preserved after a mistake.
- The manual contains fresh simple calculations for A, B, C, and D on every round. Their results stay within A: 2–7, B: 5–10, C: 1–5, and D: 11–14.
- Section 2 asks for A + B, B − C, and C + A. Complete numeric inputs are submitted after two seconds without typing.
- Section 3 asks the player to select among plus, minus, and multiplication. Its equations resolve to 5 + A, 8 − C, and D − 3; multiplication is an unused distractor.
- A completed section gets a green border and subtle green background, then locks.
- Hints highlight ordering direction or the relevant manual calculations after mistakes.

## Implemented Online Screen Flow

- `/bombgame/online` is the standard online lobby for private rooms, direct room-code joining, and temporary classroom rooms.
- `/bombgame/online/partida` owns the in-room flow: role preference, ready state, role assignment, countdown, active round, result, and replay.
- Player names use the shared `active_player_name_v1` cache.
- Classroom membership uses the shared `active_classroom_session_v1` cache and is detected across supported games.
- Role preference buttons are Bomba, Manual, and Tanto faz. Ready players keep their preference visible and gain a visual ready marker.
- The assigned role is announced during the three-second pre-round countdown.
- Replay votes are authoritative, visible to both players, and cancellable until both players agree.
- After both replay votes, a three-second replay countdown returns the same room to role selection with a newly generated puzzle.
- The result screen also allows a player to leave for the online lobby.

## Level 1 Interface Details

- Sections 2 and 3 use two rows on top with the third centered below.
- Numeric answers validate two seconds after typing stops.
- Operator answers use a plus/minus/multiplication selector and validate two seconds after selection; changing the selection restarts the delay.
- The server identifies the exact mistaken section and row so only the incorrect control clears.
- Pending validation timers are cancelled when their control locks or the round ends.
- Each submitted intent has an action identifier so duplicate delivery cannot cost multiple lives.
- Manual calculations never contain zero or negative operands.
- The manual uses the full available width and does not show redundant section-status cards.
- The bomb view uses the approved modern comic shell: gray and black cel-shaded metal, bold outlines, yellow caution accents, rim-mounted cartoon explosive bundles, and a separate wired timer case.
- The live timer is HTML positioned inside the artwork's blank timer display; it is not baked into the image.
- The three sections are HTML/CSS modules fitted inside the artwork's blank interior safe area.
- In landscape, the sequence module spans the top row and the code and operator modules share the deeper bottom row.
- In portrait, the three modules stack inside the taller case interior.
- Module panels use flat dark hardware surfaces, heavy outlines, accent-color status cues, and high-contrast controls so they remain clear against the illustrated shell.
- The broader game palette remains dark wine red, near-black, graphite gray, warning yellow, red, blue, green status feedback, and warm cream.
