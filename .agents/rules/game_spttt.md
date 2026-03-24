---
trigger: model_decision
description: SPTTT (Super Jogo da Velha / Super Tic-Tac-Toe) documentation.
---

# Super Jogo da Velha (SPTTT)

## 🧩 Thematic Summary
Super Tic-Tac-Toe takes standard tic-tac-toe to a recursive extreme. Winning a small 3x3 local grid allows the player to claim the corresponding square in the large 3x3 global grid. Excellent for teaching recursive planning, positional forcing, and tactical sacrifices.

## ⚙️ Core Mechanics
- **The Board:** 9 large cells, each containing a smaller 3x3 tic-tac-toe grid.
- **Forced Movement:** Player 1's local move determines which large cell Player 2 MUST play in.
- **Winning:** A player must win 3 large cells in a row (horizontally, vertically, or diagonally).
- **Free Pushing:** If a player is sent to a large cell that is already won/tied, they may play their turn in ANY available cell on the board.

## 🏗 Technical Architecture
- **Location:** `src/SPTTT/`
- **Engine Type:** Custom state engine OR modified `AA_baseGame` (since the grid represents cells within cells).
- **Core Components:**
  - `GlobalBoard.tsx`
  - `LocalBoard.tsx`
- **Rules State:** Must track not just `localWinners` but also `globalWinner`, and precisely enforce the `nextValidCell` rules constraint. 
- **Styling:** Highly demanding on mobile-first design, as shrinking an 81-square grid onto a phone screen requires careful `vw` styling.

## 📝 Roadmap, Bugs, & Future Ideas
*(Use this section below to jot down high-level game ideas using NotebookLM or your phone)*

- [ ] Ensure clear visual indicators (glowing borders) show players which large cell they are currently restricted to play in.
- [ ] Add an "AI Mode" applying Minimax with Alpha-Beta pruning to offer a challenging CPU opponent.