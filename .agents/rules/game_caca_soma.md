---
trigger: model_decision
description: Caça Soma (Number Hunting) documentation.
---

# Caça Soma (Number Hunting)

## Purpose

Use this file as the main reference when discussing ideas, redesigning the game, or making code changes to Caça Soma.

Keep current implemented behavior separate from future ideas. The game now has three distinct systems:

- solo levels mode
- legacy local 2-player versus mode
- online points-race mode

They share the core idea of selecting numbers whose sum matches a Magic Number, but their pacing, scoring, and implementations differ.

## Current Reality

- Caça Soma is implemented and playable.
- Solo levels mode is shipped.
- Legacy local 2-player versus mode is still shipped.
- Online multiplayer is implemented with server-authoritative private rooms and classroom-visible waiting rooms.
- Online supports `1v1` and `2v2`.
- Creating an online room first asks only whether the room is `1v1` or `2v2`.
- Online settings live inside the room and only the host can change them.
- While a match is still waiting to start, the host can remove non-host players after confirming the action.
- The host starts the online match manually after the required players join.
- Online points mode is the only online scoring mode currently implemented.
- Online total-time mode remains a future idea.

## Core Game Idea

The player selects board numbers whose sum matches the Magic Number.

Important shared concepts:

- board cells contain fixed numeric values
- selected numbers contribute to the attempted sum
- cells used in correct answers become unavailable later
- target generation should prefer solvable rounds

Submission differs by mode:

- levels and local versus use the older local flow
- online uses an explicit `Pronto` button

## Solo Levels Mode

### Summary

Levels mode is a solo progression system with multiple rounds, stars, and unlocks.

Each level defines:

- board size
- number of rounds
- required selected-number count
- valid Magic Number ranges per round
- star thresholds based on accuracy and total time

### Current Flow

1. The player enters a level.
2. The player clicks `Começar`.
3. A Magic Number is generated.
4. The timer starts.
5. The player selects numbers whose sum should match the target.
6. The player confirms the attempt through the local submission flow.
7. The result is stored and the next round starts.
8. At the end, stars are calculated from accuracy and total time.

### Current Level Structure

- 10 levels are defined.
- Levels 1-5 use 5x5 boards.
- Levels 6-10 use 7x7 boards.
- Current levels require exactly 2 selected numbers per round.
- Levels currently contain 5 to 7 rounds.
- Earning at least 2 stars unlocks the next level.

### Level Lockout

- Correct answers permanently remove the selected cells for the rest of that level.
- Wrong answers do not permanently consume cells.

## Legacy Local Versus Mode

### Summary

The legacy local versus mode is a same-device 2-player format with alternating turns. It remains implemented, but the online mode is now the more deliberate competitive direction.

### Current Flow

1. Player 1 solves a generated Magic Number.
2. Player 2 receives another target and repeats the process.
3. Times are compared.
4. The faster correct player receives a point.
5. First to 5 points wins.

### Legacy Characteristics

- 10x10 board.
- Players may select 2 or 3 numbers.
- Correct cells stay unavailable later in the match.
- Wrong answers use the older penalty-time model.
- This mode has technical and product debt. Avoid treating it as the reference architecture for online work.

## Online Points-Race Mode

### Summary

Online mode is a server-authoritative points race for private rooms. The same Magic Number should be shown to both sides whenever possible.

Players:

- choose `1v1` or `2v2` in a quick prompt when creating a room
- create or join a private room using a 4-character code
- enter a temporary classroom code to discover open rooms
- choose settings inside the room
- wait for the host to press `Começar Partida`
- race to solve each round

### Supported Room Modes

#### 1v1

- 2 room seats.
- One player per team.
- Easy: exactly 2 selected numbers.
- Medium and Hard: 2 or 3 selected numbers.
- No selection-change cooldown.

#### 2v2

- 4 room seats.
- Two players per team.
- Each player selects exactly one number.
- The team answer therefore always contains exactly 2 numbers.
- A player can only change their own selected cell.
- Teammates can see each other's selected cell.
- A teammate's ready cell shows a small checkmark.
- Selection changes have a 1-second cooldown.

### Difficulty Presets

| Difficulty | Board | Round play time | Board values | Magic Number range |
|------------|-------|-----------------|--------------|--------------------|
| Easy | 5x5 | 60 seconds | 1 to 25 | 5 to 35 |
| Medium | 7x7 | 90 seconds | 1 to 49 | 10 to 70 |
| Hard | 10x10 | 120 seconds | 1 to 100 | 20 to 150 |

Online board values are ordered, not shuffled.

Online Magic Numbers are generated from solvable sums in the selected difficulty's range when possible.

### Round Start Phases

Every online round is server-controlled:

1. `countdown`: overlay shows `Rodada X começa em...` for 3 seconds.
2. `rolling`: the Magic Number visually rolls for 1.5 seconds.
3. `playing`: the real Magic Number is revealed, the timer starts, and actions are accepted.

The server rejects selection and ready actions before the `playing` phase. This is real rules enforcement, not only a client-side animation.

### Ready And Submission Rules

- Each player presses `Pronto` explicitly.
- Changing a selection makes only that player unready.
- In 2v2, the team submits automatically when both teammates are ready and both required cells are selected.
- In 1v1, the player submits automatically when ready with a valid number count.
- Opponent selections remain hidden during the round.

### Scoring

- One round gives at most one point.
- If only one side is correct, that side scores.
- If both sides are wrong or time out, nobody scores.
- If both sides are correct, the faster side scores.
- Times are compared at 0.01-second precision internally.
- If rounded times tie, nobody scores.
- Match target score can be 2, 3, 4, or 5 points. Default is 3.

The visible countdown timer uses whole seconds for readability.

### Persistent Lockout

- Cells used in correct online answers become locked for that team for the rest of the match.
- Teams lock cells independently, so their available boards can diverge.
- Wrong answers do not lock cells.

### Target Generation

- Prefer a shared Magic Number solvable by both teams' remaining cells.
- If no shared target exists, generate a distinct solvable target for each side.
- The fallback strategy is called `fallback_distinct`.
- The fallback avoids broken rounds but should remain rare.

### Room Lifecycle

- Waiting rooms expire after 10 minutes.
- If the host leaves while waiting, the room closes.
- While waiting, the host can remove another player; the freed seat can be filled again.
- Once a match starts, a player leaving means the match cannot continue.
- A disconnect receives a short grace period before the room closes.
- Rematch uses the same room and requires all active players to vote.
- Refresh reconnection is not implemented.

## Educational Value

### Best Current Grade Fit

Best current fit is around 4th to 7th grade. This remains a recommendation, not a validated classroom result.

### Skills Developed

- rapid addition
- number composition and decomposition
- visual scanning
- speed and accuracy
- planning combinations under constraints
- team coordination in online 2v2

### Classroom Fit

- levels mode supports structured individual practice
- local versus supports same-device pair competition
- online 1v1 supports quick head-to-head races
- online 2v2 supports collaborative team reasoning

## Main Files

### Solo And Legacy Local

- `src/Caca_soma/Pages/Regras_CacaSoma.tsx`
- `src/Caca_soma/Pages/LevelGamePage.tsx`
- `src/Caca_soma/Pages/LevelSelectionPage.tsx`
- `src/Caca_soma/Pages/VersusModePage.tsx`
- `src/Caca_soma/componentes/tabuleiro.tsx`
- `src/Caca_soma/Logic/levelConfigs.ts`
- `src/Caca_soma/Logic/levelProgress.ts`

### Online V2

- `src/Caca_soma/Logic/v2/types.ts`
- `src/Caca_soma/Logic/v2/cacaSoma.ts`
- `src/Caca_soma/Logic/v2/cacaSoma.test.ts`
- `src/Caca_soma/Logic/multiplayer/protocol.ts`
- `src/Caca_soma/Hooks/useCacaSomaMultiplayer.ts`
- `src/Caca_soma/Pages/multiplayerLobbyPage.tsx`
- `src/Caca_soma/Pages/multiplayerGamePage.tsx`
- `multiplayer-server/src/cacaSoma/cacaSomaAdapter.ts`
- `multiplayer-server/src/cacaSoma/cacaSomaRoomTypes.ts`
- `multiplayer-server/src/sockets/registerCacaSomaRoomHandlers.ts`

## Known Limitations

- Refresh reconnection is not implemented.
- `fallback_distinct` is represented in state but does not yet have dedicated telemetry.
- Online total-time mode is not implemented.
- Public rules UI should remain concise; avoid trying to explain every online edge case in one modal.
- The legacy local versus flow still has older rough edges and should not guide new multiplayer architecture.

## Future Ideas

### Total-Time Online Mode

Future teaching-mode idea:

- teams play multiple rounds
- time accumulates
- a wrong answer can be retried until correct or timeout
- feedback could explain whether the submitted sum was above or below the target

This is not implemented.

### Telemetry

Track how often target generation uses `fallback_distinct`. If fallback becomes common, tune target generation or board-lockout behavior.
