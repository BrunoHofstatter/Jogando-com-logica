---
trigger: model_decision
description: Math War (Guerra Matemática) documentation.
---

# Math War (Guerra Matemática)

## 🧩 Thematic Summary
A logic-combat game utilizing dice rolls, arithmetic, and energy-based movement. Pieces have math operations or numerical values associated with them. The core tension lies in choosing between risky high-value moves or methodical, low-value safe plays.

## ⚙️ Core Mechanics
- **Energy Pool:** Instead of single moves per turn, players start with a pool of Energy derived from a Dice Roll (or static base).
- **Movement Costs:** Moving pieces consumes energy based on distance and the math operation required.
- **Math Integration:** Attack strengths or movement capabilities are determined by solving small arithmetic equations or utilizing piece "values".
- **Objective:** Typically to eliminate opponent pieces while optimizing energy consumption.

## 🏗 Technical Architecture
- **Location:** `src/MathWar/`
- **Engine Type:** Uses the global board engine (`AA_baseGame/Logic/gameEngine.ts`).
- **Configuration File:** `src/MathWar/Logic/gameConfig.ts` overrides default turn logic to implement `turnRules: { usesDice: true, energyPerTurn: ... }`.
- **Rules File:** `src/MathWar/Logic/gameRules.ts` intercepts `calculateActionCost` to apply dynamic energy deduction based on math-heavy operations.

## 📝 Roadmap, Bugs, & Future Ideas
*(Use this section below to jot down high-level game ideas using NotebookLM or your phone)*

- [ ] Rebalance energy costs for specific math operations so Division/Multiplication feel more rewarding.
- [ ] Add visual explosion effects or floating numbers representing damage during combat.
- [ ] Refine mobile portrait layouts to make sure the dice rolling button and energy UI stay above the fold.