---
trigger: model_decision
description: High-level overview of the entire game catalog on the platform.
---

# Games Overview - Catalog Summary

This file contains a brief overview of all current games implemented in the "Jogando com Lógica" platform. Each game also has its own dedicated `.md` file with deeper technical details and roadmaps.

## 🎲 Board-Based Games (Using the Shared Engine `AA_baseGame`)

These board games share the central `gameEngine.ts` and component logic for their grids, turn systems, and move executions.

1. **Crown Chase (Caça Coroa):** 
   - A strategic battle where the goal is to protect your "King" while navigating multiple piece types (Warriors, Pawns) across the board. Teaches spatial awareness and sacrifice logic. It is simple, doesnt last long and has a small board (5x5)
2. **Math War (Guerra Matemática):** 
   - A logic-combat game utilizing dice rolls, arithmetic, and energy-based movement. Pieces have math operations or values associated with them. Complex game, lasts longer, big board (10x10)

## 🧩 Custom Logic Games (Independent Logic)

These games have bespoke rules and their own internal engines optimized for their specific UI requirements.

3. **SPTTT (Super Jogo da Velha / Super Tic-Tac-Toe):** 
   - An advanced meta-tic-tac-toe where winning a small 3x3 grid contributes to winning a cell in the larger overarching 3x3 grid. Excellent for recursive thinking.
4. **Stop Matemático:** 
   - A fast-paced arithmetic game (based on levels (1-10 for now, planned to add more)). A "magic number" drops, and players must rush to perform addition, subtraction, multiplication, and division to reach the target number across multiple rows. Includes solo play and server-authoritative online rooms for 2-8 players, including classroom room discovery.
5. **Caça Soma (Number Hunting):** 
   - A grid puzzle game with an active timer. Players find numbers on the board that sum to a generated Magic Number. Includes solo levels, legacy local versus play, and private-room online 1v1 or collaborative 2v2 races. Trains fast visual scanning, rapid addition, decomposition, and team reasoning.
6. **Rubiks Class (Cubo Mágico):** 
   - A structured educational sequence (currently modules 2 out of 6+ completed) teaching children math concepts with the Rubik's Cube, using interactive 3D elements and logical breakdowns. 

