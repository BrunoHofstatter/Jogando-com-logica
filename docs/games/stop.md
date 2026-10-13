# Stop Matemático

Reference refreshed against source on October 12, 2026.

## Purpose of This File

Use this file as the main reference when discussing ideas, balancing progression, or making code changes to Stop Matemático.

This file should help with both:

- product and design discussions about how the game should feel
- coding work on rules, progression, UI, and future features

## Game Summary

Stop Matemático is a fast mental-math game inspired by the classic "Stop" format. A Magic Number is revealed at the start of the round, and the player must use that number to solve a grid of arithmetic challenges as quickly as possible.

The game focuses on mental calculation under time pressure, with solo random/level play and server-authoritative online rounds for 2–8 players.

## Current Reality

- The game is already implemented and playable
- It includes solo and server-authoritative online multiplayer modes.
- The shipped solo modes are:
  - random mode
  - level mode
  - tutorial-fixed mode
- The explanation overlay is shown on first contact; initial random/tutorial difficulty is `d1`, while level mode uses its selected level's own configuration
- Random mode uses hidden internal difficulties (`d1` to `d6`)
- Level mode uses a separate custom progression with 10 levels
- On touch devices, the game uses a custom virtual keyboard instead of the native keyboard
- Online private rooms support 2 to 8 players, host-controlled settings, multiple rounds, and rematches
- While a match is still in the lobby, the host can remove non-host players after confirming the action
- Classroom room discovery is implemented using the existing 2–8 player room capacity and host-controlled settings

## Core Rules

### Round Flow

1. A Magic Number is revealed at the start of the round.
2. The player sees a grid of challenge boxes.
3. The player fills in the answers mentally, using the Magic Number as the starting point.
4. The player ends the round by pressing `STOP`.
5. The game checks answers and shows performance feedback.

### Single Boxes

Each single box contains one operation and one number, for example `+7` or `x3`.

The player must apply that operation to the Magic Number and write the final result.

Important rule:

- each box starts again from the original Magic Number
- the result from one box does not carry into the next box

### Dual Boxes

Some boxes are dual boxes. They contain two operations in sequence.

Example structure:

- first operation applied to the Magic Number
- second operation applied to the intermediate result

The player gives only one final answer for the whole dual box.

This matches the current implementation: dual boxes are sequential operations with one final input, not two separate answers.

### End of Round

- The player can press `STOP` manually at any time
- On desktop or keyboard flow, pressing `Enter` on the last input also ends the round automatically
- After the round ends, answers are checked and the game shows time and correct answers

### Level Mode Progression

- Level mode uses star criteria based on time and number of correct boxes
- A level is considered cleared with at least 1 star
- The next level is unlocked only when the previous level has at least 2 stars

## Educational Value

### Best Current Grade Fit

Best current fit is around 3rd to 7th grade, depending on the level and on how much teacher support is given.

### Skills Developed

- rapid mental calculation
- basic operations
- attention under time pressure
- number sense
- flexible calculation strategies

### School Content / Broad BNCC-Aligned Themes

- operations with natural numbers
- mental math fluency
- arithmetic strategy
- choosing efficient ways to calculate

### Classroom Fit

- short warm-up activity
- individual reinforcement
- station rotation
- quick practice round in lab sessions

## Player Experience

### Typical Session Feel

The game is meant to feel quick, direct, and pressure-based. The fun comes from speed, mental agility, and trying to complete a full board cleanly.

### Current Session Length

- Random rounds are usually short
- The teacher manual currently treats typical rounds as roughly 1 to 5 minutes
- Level mode depends on the level and on the player, but is also designed around short rounds

### Likely Confusion Points

- understanding that each box starts from the same Magic Number
- understanding that dual boxes expect one final answer
- understanding the difference between random mode and level mode
- understanding how stars and unlocking work in levels

## Current Implementation

### Main Files

- `src/Stop/Pages/RegrasPage.tsx`: rules modal and mode selection
- `src/Stop/Pages/StopGamePage.tsx`: creates rounds from mode templates; orchestrates reveal, explanation overlay, board, and attempt analytics
- `src/Stop/Components/NumberReveal.tsx`: animated Magic Number reveal
- `src/Stop/Components/GameBoard.tsx`: renders the generated round, timer, checking, level result modal, and keyboard flow
- `src/Stop/Components/CalculationCell.tsx`: individual single/dual calculation cells and validation feedback
- `src/Stop/Logic/gameConfig.ts`: hidden random-mode difficulty configs (`d1` to `d6`)
- `src/Stop/Logic/levelsConfig.ts`: custom level configs, stars, unlock logic
- `src/Stop/Logic/stopRound.ts`: shared serializable round generation, answer evaluation, and point values
- `src/Stop/Logic/gameLogic.ts`: timer formatting and older helpers; current generation is in `stopRound.ts`
- `src/Stop/Logic/validationUtils.ts`: arithmetic helpers used by shared round evaluation
- `src/Stop/Logic/multiplayer/types.ts` and `matchLogic.ts`: online settings, phases, points, and transitions
- `src/Stop/Logic/multiplayer/protocol.ts`: socket contract
- `src/Stop/Hooks/useStopMultiplayer.ts`: online state, snapshots, room/classroom entry, and reliability telemetry
- `src/Stop/Pages/multiplayerLobbyPage.tsx` and `multiplayerGamePage.tsx`: online lobby and match UI
- `multiplayer-server/src/stop/stopAdapter.ts` and `stopRoomTypes.ts`: shared-rules adapter and room state
- `multiplayer-server/src/sockets/registerStopRoomHandlers.ts`: server lifecycle, snapshots, STOP locking, settings, rematch, and classroom listing

### Mode Structure

#### Random Mode

- route state uses `mode: "random"`
- difficulty is chosen internally and is not shown to the player
- after a reset, random mode rerolls to a different difficulty key when possible

#### Level Mode

- route state uses `mode: "level"` plus a level number
- levels use `levelsConfig.ts`, not the random difficulty presets
- each level has its own possible numbers, operations, grid width, and star thresholds

#### Tutorial Mode

- route state uses `mode: "tutorial_fixed"`
- tutorial currently uses fixed difficulty `d1`
- first-contact random play uses `d1`; custom level templates remain distinct from difficulty presets

### Generation Logic

- The page builds a template from either the selected level or a random/tutorial difficulty, then calls `createStopRound`. `GameBoard` receives the generated round; it does not generate boxes or pass a difficulty key into level validation.
- The Magic Number is chosen from the current difficulty or level's `possibleRandomNumbers`
- Single boxes are generated from `possibleNumbersByBox` and `contasPorBox`
- Dual boxes are generated from `dualBoxes`
- Division boxes only use values that produce integer results
- Subtraction normally avoids negative results, except hidden difficulty `d6`, which allows negatives

### Input / Validation Behavior

- Each box has one input field
- Dual boxes also use one input field, for the final result only
- Validation happens when the round ends
- Correct answers increase the `acertos` count by box, not by individual operation

## Known Mismatches and Design Tensions

### Variable Box Counts and Random Configuration

The current rules modal correctly says box counts and operations vary by mode and level. It explains sequential dual boxes with one final answer. The former absolute claim of ten boxes is no longer present.

That is not always true in the shipped implementation:

- random `d2` to `d6` effectively total 10 boxes if dual boxes are counted as one answer each
- random `d1` currently generates only 8 boxes because its config lengths do not match
- level mode does not always use 10 boxes; some levels use 6 boxes and others use 8

Random `d1` still has eight operand arrays but nine operation entries. That configuration mismatch remains worth checking when changing generation; it is not a claim that the current rules modal requires ten boxes.

### Manual STOP vs Actual End Conditions

The rules modal now accurately documents early `STOP` and final-field `Enter` as solo end conditions.

Current solo behavior:

- the player can press `STOP` early
- pressing `Enter` on the last input also ends the round automatically

### Random Difficulties Are Hidden

Random mode internally uses six difficulty presets, but the player is not told which one was rolled. This may be fine, but it makes balancing and user understanding less transparent.

### Level Entry from the Rules Page

`RegrasPage.tsx` uses `getCurrentLevelId()` from `levelsConfig.ts`: the main `Jogar` button enters the highest currently unlocked level from saved stars, rather than a hard-coded level 1.

The level menu remains available for choosing another unlocked level. Completion uses at least one star; unlocking the next level requires two.

### Level Templates and Difficulty Presets

The older difficulty-key coupling in `GameBoard` has been removed. Level templates explicitly use authored settings and `allowNegativeSubtraction: false`; difficulty templates permit negative subtraction only for `d6`.

If future levels introduce negative subtraction, change their template policy deliberately rather than assuming a random-mode difficulty controls it.

## Online Round and Match Flow

- Rooms contain 2–8 players. The host chooses initial difficulty, fixed/progressive difficulty, 1–10 rounds, and player limit. Defaults: `d2`, fixed difficulty, 5 rounds, 8 seats.
- The host starts after at least two players join. Private codes and temporary classroom discovery are implemented.
- The server generates one shared round and owns countdown, playing, locked, and results phases. Clients submit answer snapshots.
- Unlike solo early STOP, online `press_stop` requires every box to have a nonblank answer. Correctness is not required to press it; the server checks answers when locking.
- An accepted STOP locks the round for everyone. A 120-second safety deadline also locks a round if nobody stops it.
- The server evaluates the latest snapshots and accumulates box points across rounds. Highest total wins; ties retain multiple winners.
- Rematch requires all players' votes and starts fresh in the same room. Non-host removal while waiting is host-controlled.
- Refresh reconnection is not implemented. Room lifecycle, temporary membership, and availability follow [multiplayer.md](../systems/multiplayer.md) and [classrooms.md](../systems/classrooms.md).

Solo start/end, foreground duration, completion, retry, and abandonment analytics are implemented. Online join/disconnect reliability exists; canonical online match lifecycle analytics remain deferred. See [analytics.md](../systems/analytics.md).

## Future Ideas / Planned Work

- expand and refine the level progression
- maintain rules clarity as mode and progression behavior change; the previously listed solo rules mismatches have been corrected
- possibly expose or rethink random difficulty presentation
- extend analytics only for a concrete reporting need; solo start/end/retry/abandonment and online join/disconnect reliability already exist

## Open Questions

- Should the public rules explain the game in a generic way, or should they explain random mode and level mode separately?
- Should dual boxes keep using one final answer only, or would showing intermediate reasoning ever be useful?
- Should random mode keep hidden difficulties, or should difficulty be visible to the player?
- Should early STOP remain allowed, or should some modes encourage full completion more strongly?
- Should the box count be standardized more strictly across modes?
