---
trigger: model_decision
description: Crown Chase (Caça Coroa) documentation.
---

# Crown Chase (Caça Coroa)

## Core Rules

- The king does not move.
- The goal is to capture the opponent's king.
- The killer moves 1 tile in any direction and can capture any enemy piece.
- The jumper moves 1 tile orthogonally, can jump 2 tiles orthogonally over any occupied middle square, and can capture only the enemy king.

## Current Reality

- The shipped local, computer, and online game modes use the source of truth in `src/CrownChase/Logic/v2/`.
- The current board setup is defined in `src/CrownChase/Logic/v2/crownChase.ts`.
- Player `1` starts by default in the local, computer, and online game flows.
- In online games, each player sees their own pieces from the bottom-left: player `1` keeps the canonical view, while player `0` sees a display-only 180-degree rotation.
- The rules layer automatically skips a turn when the current player has no legal moves.
- If both players are stuck with no legal moves, the game ends in a draw.
