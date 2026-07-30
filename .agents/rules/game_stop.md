---
trigger: model_decision
description: Stop Matemático documentation.
---

# Stop Matemático

## Purpose of This File

Use this file as the main reference when discussing ideas, balancing progression, or making code changes to Stop Matemático.

This file should help with both:

- product and design discussions about how the game should feel
- coding work on rules, progression, UI, and future features

## Game Summary

Stop Matemático is a fast mental-math game inspired by the classic "Stop" format. A Magic Number is revealed at the start of the round, and the player must use that number to solve a grid of arithmetic challenges as quickly as possible.

The game is focused on mental calculation under time pressure. It is currently a solo game.

## Current Reality

- The game is already implemented and playable
- It includes solo and server-authoritative online multiplayer modes.
- The shipped solo modes are:
  - random mode
  - level mode
  - tutorial-fixed mode
- The tutorial is shown automatically on first contact and the first run effectively forces easy difficulty (`d1`)
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
- `src/Stop/Pages/StopGamePage.tsx`: page-level orchestration for reveal, tutorial, and board
- `src/Stop/Components/NumberReveal.tsx`: animated Magic Number reveal
- `src/Stop/Components/GameBoard.tsx`: round generation, timer, checking, level result modal, keyboard flow
- `src/Stop/Components/CalculationCell.tsx`: individual single/dual calculation cells and validation feedback
- `src/Stop/Logic/gameConfig.ts`: hidden random-mode difficulty configs (`d1` to `d6`)
- `src/Stop/Logic/levelsConfig.ts`: custom level configs, stars, unlock logic
- `src/Stop/Logic/gameLogic.ts`: number selection, shuffle helpers, timer formatting
- `src/Stop/Logic/validationUtils.ts`: single and dual answer validation

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
- first-time play also effectively forces `d1` until the tutorial is marked complete

### Generation Logic

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

### Rules Modal vs Actual Box Counts

The detailed rules modal in `src/Stop/Pages/RegrasPage.tsx` says the game presents 10 challenge boxes and frames the round around those 10 boxes.

That is not always true in the shipped implementation:

- random `d2` to `d6` effectively total 10 boxes if dual boxes are counted as one answer each
- random `d1` currently generates only 8 boxes because its config lengths do not match
- level mode does not always use 10 boxes; some levels use 6 boxes and others use 8

So the current rules text is too absolute and should eventually be updated.

### Manual STOP vs Actual End Conditions

The rules modal suggests the player finishes all challenges and then clicks `STOP`.

In the actual implementation:

- the player can press `STOP` early
- pressing `Enter` on the last input also ends the round automatically

### Random Difficulties Are Hidden

Random mode internally uses six difficulty presets, but the player is not told which one was rolled. This may be fine, but it makes balancing and user understanding less transparent.

### Level Entry from the Rules Page

In `RegrasPage.tsx`, the main `Jogar` button in level mode currently launches level 1 because `currentLevel` is still a placeholder constant.

Choosing a specific level currently depends on entering the level menu.

### Level Config vs Difficulty Key Coupling

`GameBoard.tsx` still passes a `difficulty` key into helper logic even when level mode is using a custom `LevelConfig`.

This is mostly harmless with the current levels, but it is a coupling worth remembering if future levels introduce division-heavy or more advanced subtraction behavior.

## Future Ideas / Planned Work

- expand and refine the level progression
- improve rules clarity so the written rules match the actual current modes
- possibly expose or rethink random difficulty presentation
- add better analytics for how players start, finish, retry, and abandon rounds

## Open Questions

- Should the public rules explain the game in a generic way, or should they explain random mode and level mode separately?
- Should dual boxes keep using one final answer only, or would showing intermediate reasoning ever be useful?
- Should random mode keep hidden difficulties, or should difficulty be visible to the player?
- Should early STOP remain allowed, or should some modes encourage full completion more strongly?
- Should the box count be standardized more strictly across modes?
