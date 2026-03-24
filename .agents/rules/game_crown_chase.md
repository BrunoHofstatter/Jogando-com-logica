---
trigger: model_decision
description: Crown Chase (Caça Coroa) documentation.
---

# Crown Chase (Caça Coroa)

## 🧩 Thematic Summary
A chess-like strategic board game where the ultimate goal is to protect your "King" from being captured by the opponent. Different pieces have varied movement rules.

## ⚙️ Core Mechanics
- **Objective:** Capture the opponent's King while defending your own.
- **Piece Types:** 
  - **King (Coroa):** Moves 1 tile in any direction. If captured, the game ends.
  - **Pawns/Warriors:** Basic orthogonal or diagonal movements.
- **Turn System:** Players alternate moving one piece per turn natively. Capture mechanics resolve instantly.

## 🏗 Technical Architecture
- **Location:** `src/CrownChase/`
- **Engine Type:** Uses the global board engine (`AA_baseGame/Logic/gameEngine.ts`).
- **Configuration File:** `src/CrownChase/Logic/gameConfig.ts` contains the board matrix, piece start positions, and validation masks.
- **Rules File:** `src/CrownChase/Logic/gameRules.ts` defines win conditions (capture target: "king", player: 2).

## 📝 Roadmap, Bugs, & Future Ideas
*(Use this section below to jot down high-level game ideas using NotebookLM or your phone)*

- [ ] Add visual "Danger/Check" notifications when the King is threatened by an opponent.
- [ ] Implement a "Promotion" system for Pawns that reach the opposite edge.