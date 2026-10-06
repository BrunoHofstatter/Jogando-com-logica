# Crown Chase (Caça Coroa)

## Core Rules

- The king does not move.
- The goal is to capture the opponent's king.
- The Ninja (internal type `killer`) moves 1 tile in any direction and can capture any enemy piece.
- The jumper moves 1 tile orthogonally, can jump 2 tiles orthogonally over any occupied middle square, and can capture only the enemy king.

## Current Reality

- The playable tutorial is implemented at `/caca-coroa/tutorial`, using seven isolated practice stages: Ninja movement/capture, Saltador steps/jumps, stationary kings, king capture, and the normal starting board. It uses the original board frame, short pointing pop-ups, automatic retry, and version 2 history. Local, AI, and online lobby entry use a first-entry gate; existing online rooms bypass it. The menu Tutorial button replays it without clearing completion history.
- Tutorial lifecycle/history is shared in `src/Shared/Tutorial/`; Crown Chase pedagogy is in `src/CrownChase/Tutorial/`. Read `docs/tutorials/overview.md` for philosophy, `docs/tutorials/technical-contract.md` for the implemented API, and `docs/tutorials/crown-chase.md` for this lesson. `docs/plans/tutorials/next-tutorials.md` collects flexible considerations for other games.

- The shipped local, computer, and online game modes use the source of truth in `src/CrownChase/Logic/v2/`.
- The current board setup is defined in `src/CrownChase/Logic/v2/crownChase.ts`.
- Player `1` starts by default in the local, computer, and online game flows.
- In online games, each player sees their own pieces from the bottom-left: player `1` keeps the canonical view, while player `0` sees a display-only 180-degree rotation.
- The rules layer automatically skips a turn when the current player has no legal moves.
- If both players are stuck with no legal moves, the game ends in a draw.
