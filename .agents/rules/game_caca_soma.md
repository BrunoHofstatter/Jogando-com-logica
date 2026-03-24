---
trigger: model_decision
description: Caça Soma (Number Hunting) documentation.
---

# Caça Soma (Number Hunting)

## 🧩 Thematic Summary
A fast-paced grid puzzle where players must find sequences of numbers that sum up to a specific target value before time runs out. Emphasizes rapid visual scanning and quick addition skills.

## ⚙️ Core Mechanics
- **Grid Layout:** Various number tiles populate a grid.
- **Target Value:** A rotating or increasing target sum is displayed to the user.
- **Selection:** Players drag or tap consecutive blocks to continuously add their values.
- **Validation:** When the sum is exactly the target number, the blocks are cleared, score increases, and new blocks may fall in (Tetris/Candy Crush style).
- **Timer/Pressure:** Time ticks down, refilling slightly upon successful matches.

## 🏗 Technical Architecture
- **Location:** `src/Caca_soma/`
- **Engine Type:** Custom logic (Does not use `AA_baseGame`).
- **Core Components:** 
  - `GridComponent.tsx` (Handles touch/drag selection).
  - `ScoreBoard.tsx` (Handles the active target number and current sum).
- **Styling:** Highly dependent on touch-friendly CSS (`min(vw, dvh)`) and prominent active-state styling.

## 📝 Roadmap, Bugs, & Future Ideas
*(Use this section below to jot down high-level game ideas using NotebookLM or your phone)*

- [ ] Add multiplier bonuses for selecting longer chains of smaller numbers instead of just two large numbers.
- [ ] Create a "Zen Mode" with no timer for younger students just learning to add.