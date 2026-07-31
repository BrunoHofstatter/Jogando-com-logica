---
trigger: model_decision
description: Math War (Guerra Matemática) documentation.
---

# Math War (Guerra Matemática)

## Purpose of This File

Use this file as the main reference when discussing ideas, balancing the game, or making code changes to Guerra Matemática.

This file should help with both:

- product and design discussions about rules clarity, difficulty, and player experience
- coding work on the board logic, AI, turn system, and future improvements

## Game Summary

Guerra Matemática is a strategy board game inspired by chess, but built around arithmetic energy instead of fixed movement range. Each piece has a permanent value, the dice generate a shared number every few turns, and the chosen piece's value plus the dice result determines how much energy that piece can spend on movement and capture.

The main objective is to capture the opponent's Captain.

## Current Reality

- The game is already implemented and playable
- The shipped modes are:
  - local 2-player mode
  - versus AI mode
- AI mode currently has 4 player-facing difficulty levels:
  - Muito Fácil
  - Fácil
  - Médio
  - Difícil
- AI difficulties are progression-locked through local storage
- The game includes a tutorial that auto-shows on first contact
- There is no multiplayer or online mode yet

## Core Rules

### Objective

The only victory condition is capturing the opponent's Captain.

If a Captain is captured, the game ends immediately.

### Board and Pieces

- The board is 8x8
- Each player starts with 10 pieces
- Piece values are permanently distributed as:
  - 4 pieces with value `+2`
  - 3 pieces with value `+3`
  - 3 pieces with value `+4`
- There are 2 movement types:
  - `sum`: moves orthogonally
  - `sumDiag`: moves diagonally

In the teacher-facing rules text these are described as:

- round sum piece
- square sum piece

### Captain Selection

- Each player has exactly one Captain
- The Captain is chosen randomly from that player's back-row pieces at game start
- The Captain can be either a `sum` or a `sumDiag` piece

### Turn Flow

- Players alternate turns
- A player moves exactly one piece per turn
- Every completed move ends the turn

### Dice and Energy

- Dice are rolled every 3 turns
- The active dice total is shared across turns until the next roll
- A piece's available energy is:
  - `piece value + current dice total`

### Movement Cost

- Moving costs `2` energy per square
- Capturing costs `+2` additional energy on top of movement cost
- Captains currently cost double energy for all movement and capture

### Movement Restrictions

- `sum` pieces move only orthogonally
- `sumDiag` pieces move only diagonally
- Pieces cannot jump over other pieces
- Pieces cannot land on allied pieces
- Captures happen by moving onto an enemy-occupied square if enough energy is available

## Educational Value

### Best Current Grade Fit

Best current fit is around 6th to 7th grade.

It may also work for some younger or older students depending on how much rule explanation and strategic support they receive.

### Skills Developed

- mental calculation
- strategic planning
- tactical reasoning
- resource management
- anticipating consequences of a move

### School Content / Broad BNCC-Aligned Themes

- arithmetic with natural numbers
- addition through game decisions
- planning under constraints
- comparing movement cost and available resources
- multi-step decision-making

### Classroom Fit

- pair play
- advanced strategy station
- teacher-guided challenge activity
- individual practice through AI mode

## Player Experience

### Typical Session Feel

The game is meant to feel more strategic and demanding than the simpler games on the platform. The fun comes from combining tactical board positioning with quick arithmetic and from trying to protect or hunt the Captain.

### Current Session Length

- The teacher manual currently treats a full match as roughly 10 to 30 minutes
- AI games can vary a lot depending on difficulty and player skill

### Likely Confusion Points

- understanding that energy belongs to the chosen piece, not as a shared pool for multiple moves
- understanding that movement cost scales with distance
- understanding that captures cost extra energy
- understanding that the dice are not rerolled every single turn
- recognizing which piece is the Captain
- understanding that the Captain costs double energy in the current implementation

## Current Implementation

### Main Files

- `src/MathWar/Pages/regrasPage.tsx`: mode selection, AI difficulty selection, rules modal, progress reset
- `src/MathWar/Pages/baseGamePage.tsx`: local 2-player page, tutorial, dice animation hookup
- `src/MathWar/Pages/aiGamePage.tsx`: AI page, difficulty handling, unlock progression, AI move loop
- `src/MathWar/Components/board-component.tsx`: selection, highlighting, move execution, board UI, win screen
- `src/MathWar/Components/piece.tsx`: piece rendering, shape differences, captain marker
- `src/MathWar/Components/DiceAnimation.tsx`: dice reveal animation
- `src/MathWar/Logic/gameConfig.ts`: board setup, initial piece distribution, metadata
- `src/MathWar/Logic/gameRules.ts`: Math War rule logic, energy, capture, turn rules, win checks
- `src/MathWar/Logic/gameEngine.ts`: generic engine used by Math War
- `src/MathWar/Logic/aiPlayer.ts`: AI heuristics by difficulty
- `src/Shared/Hooks/useDifficultyLock.ts`: AI difficulty unlock persistence

### Piece Setup

- Each side has 10 pieces
- Values are shuffled per player from the same base set
- Each side currently starts with:
  - 8 `sum` pieces
  - 2 `sumDiag` pieces
- The Captain is assigned after board creation, not pre-marked in the setup

### Mode Structure

#### Local 2-Player Mode

- Uses `baseGamePage.tsx`
- Starts from the default engine initialization
- Player `0` starts first

#### AI Mode

- Uses `aiGamePage.tsx`
- Forces Player `1` (blue / human) to start first
- AI is Player `0` (red)
- Winning as the human unlocks the next AI difficulty

### Turn and Dice Logic

- On game start, `onTurnStart` is called immediately
- Math War's `onTurnStart` rolls `2d5` when `turnCount % 3 === 0`
- That means the dice roll at the start of turns 1, 4, 7, and so on
- The board UI shows the current dice total and how many rounds remain until the next roll

### Energy Logic

- Piece energy is not stored permanently per piece
- It is recalculated from `dice total + piece value` during move validation
- The selected piece's current energy is displayed in the UI
- Only one move is allowed per turn, so the effective use of energy is choosing whether a given move is affordable

### AI Difficulty Structure

- Difficulty 1: random legal moves
- Difficulty 2: simple heuristics with capture preference
- Difficulty 3: medium heuristics with some threat awareness
- Difficulty 4: stronger evaluated heuristics with more captain-safety logic

## Known Mismatches and Design Tensions

### Static Config vs Actual Dice Logic

The public rules say the game uses `2d5`, producing totals from `2` to `10`.

The actual turn-start logic agrees with that:

- `gameRules.onTurnStart` rolls `GameUtils.rollDice(2, 5)`

But `gameConfig.ts` still says:

- `diceCount: 2`
- `diceSides: 4`

So the config and the actual rules implementation are inconsistent.

At the moment this does not usually break gameplay because the real dice roll is handled in `onTurnStart`, not by the generic config path. But it is still confusing and should eventually be cleaned up.

### Roll Dice Button Is Effectively Dead for Normal Play

The board component contains a `Roll Dice` button path through the generic engine.

In normal Math War flow this button is effectively unused because:

- the game already starts with a dice roll
- later rolls are also handled automatically in `onTurnStart`

If this button ever becomes visible in another state, it would use the static config values instead of the `2d5` logic, which increases the inconsistency risk.

### AI Mode Starts with Blue, PvP Starts with Red

In local 2-player mode, default initialization starts with Player `0`.

In AI mode, the page manually forces Player `1` (blue / human) to start first.

This is intentional in code, but it means starting-player behavior is not uniform across modes.

### Captain Cost Rule Exists in Code but Is Easy to Miss

The detailed rules modal does mention that the Captain spends double energy, but this is a rule that players may still miss because it is not always obvious in play.

It is enforced in code by doubling the calculated action cost for Captain pieces.

### AI Difficulty Lock Can Be Bypassed by Tutorial Flow

The main `Jogar` button blocks access to locked AI difficulties.

But the tutorial button currently navigates into AI mode using the selected difficulty without checking whether that difficulty is unlocked first.

That may be acceptable, but it means the progression lock is not fully strict.

### Generic Engine Coupling

Math War uses a generic board-game engine, but some of its core behaviors depend on game-specific hooks and state mutation inside validation:

- `validateMove` mutates piece data and UI-facing energy state
- `getAvailableActions` contains a hack that sets `remainingEnergy = 9999` when gathering all moves

This works, but it is fragile and worth remembering before deeper refactors.

## Future Ideas / Planned Work

- improve AI further and possibly add more visible personality differences between difficulties
- clean up the dice configuration so config and actual rules match cleanly
- make Captain behavior and energy rules easier for players to understand
- improve progression and difficulty communication in AI mode
- potentially add online or multiplayer support in the future
- add analytics for rule-page interactions, mode choice, difficulty choice, and game outcomes

## Open Questions

- Should the Captain double-energy rule stay, or is it making the game too punishing?
- Should the game expose more movement-cost feedback before the player clicks a piece?
- Should the current dice total be more visually central so the arithmetic feels clearer?
- Should AI mode and PvP mode use the same starting-player rule?
- Should difficulty locking remain lightweight, or become stricter and more explicit?
