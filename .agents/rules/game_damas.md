---
trigger: model_decision
description: Damas (Checkers) documentation.
---

# Damas (Checkers)

## 🧩 Thematic Summary
The classic game of Checkers updated with the platform's colorful and engaging visual aesthetic. Essential for teaching children long-term planning, multi-jumps, and grid positional dominance.

## ⚙️ Core Mechanics
- **Basic Moves:** Diagonal forward 1 tile.
- **Captures:** Diagonal jump over an opponent. Must be taken if available (optional rule toggle).
- **Multi-Jumps:** Chaining diagonal jumps over multiple opponent pieces in a single turn.
- **Promotion:** Reaching the end of the board turns a piece into a "King" (Dama), allowing backward diagonal movement.

## 🏗 Technical Architecture
- **Location:** `src/Damas/`
- **Engine Type:** Uses the global board engine (`AA_baseGame/Logic/gameEngine.ts`).
- **Configuration File:** `src/Damas/Logic/gameConfig.ts` defines 8x8 standard checkers layout.
- **Rules File:** `src/Damas/Logic/gameRules.ts` handles the highly specific recursive capture logic for multi-jumps.

## 📝 Roadmap, Bugs, & Future Ideas
*(Use this section below to jot down high-level game ideas using NotebookLM or your phone)*

- [ ] Fix/verify multi-jump edge cases where the UI might not prompt correctly.
- [ ] Add an "Undo" feature for practice mode.
- [ ] Implement optional localized rule variations (e.g., International Checkers 10x10).