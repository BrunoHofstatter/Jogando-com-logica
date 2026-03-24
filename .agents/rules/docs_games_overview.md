---
trigger: model_decision
description: High-level overview of the entire game catalog on the platform.
---

# Games Overview - Catalog Summary

This file contains a brief overview of all current games implemented in the "Jogando com Lógica" platform. Each game also has its own dedicated `.md` file with deeper technical details and roadmaps.

## 🎲 Board-Based Games (Using the Shared Engine `AA_baseGame`)

These games share the central `gameEngine.ts` and component logic for their grids, turn systems, and move executions.

1. **Crown Chase (Caça Coroa):** 
   - A strategic battle where the goal is to protect your "King" while navigating multiple piece types (Warriors, Pawns) across the board. Teaches spatial awareness and sacrifice logic.
2. **Math War (Guerra Matemática):** 
   - A logic-combat game utilizing dice rolls, arithmetic, and energy-based movement. Pieces have math operations or values associated with them.
3. **Damas (Checkers):** 
   - A variant of the classic game of Checkers. Essential for teaching long-term planning, multi-jumps, and grid dominance.
4. **SPTTT (Super Jogo da Velha / Super Tic-Tac-Toe):** 
   - An advanced meta-tic-tac-toe where winning a small 3x3 grid contributes to winning a cell in the larger overarching 3x3 grid. Excellent for recursive thinking.

## 🧩 Custom Logic Games (Independent Logic)

These games have bespoke rules and their own internal engines optimized for their specific UI requirements.

5. **Stop Matemático:** 
   - A fast-paced arithmetic game (6 difficulty levels). A "magic number" drops, and players must rush to perform addition, subtraction, multiplication, and division to reach the target number across multiple rows. Includes multi-player and time-attack setups.
6. **Caça Soma (Number Hunting):** 
   - A grid puzzle game with an active timer. Players must find sequences of numbers on the board that sum up to a specific target value. Trains fast visual scanning and rapid addition.
7. **Rubiks Class (Cubo Mágico):** 
   - A structured educational sequence (currently modules 2 out of 6+ completed) teaching children how to solve the Rubik's Cube step-by-step using interactive 3D elements and logical breakdowns. 

---

## 🛠 Global Gameplay Ideas
*(For notebook cross-pollination of ideas that apply to ALL games)*
- [ ] Implement an AI opponent (Bot) for all 2-player board games to allow solo practice.
- [ ] Add specific visual/audio feedback for "Combo" moves or perfect rounds across the board.
- [ ] Create a "Daily Challenge" mode picking one module from the 7 games.