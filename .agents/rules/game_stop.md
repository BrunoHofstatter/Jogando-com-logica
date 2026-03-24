---
trigger: model_decision
description: Stop Matemático documentation.
---

# Stop Matemático

## 🧩 Thematic Summary
A fast-paced, high-stress arithmetic game where a global "Magic Number" drops from the top, and players must rush to formulate basic mathematical equations (addition, subtraction, multiplication, division) that evaluate to the target number.

## ⚙️ Core Mechanics
- **The Magic Number:** A randomly generated target constraint.
- **The Matrix (Tabela):** A grid of inputs. Usually 3 to 5 rows based on difficulty level (1-6).
- **Verification:** Once a player completes their board, they hit "STOP". The system calculates standard PEMDAS math strings provided by the user. 
- **Mobile Input:** Rather than a virtual keyboard, logic depends on numeric input or structured number pad components to fit onto small portrait phone screens.

## 🏗 Technical Architecture
- **Location:** `src/Stop/`
- **Engine Type:** Custom logic, heavily UI-driven.
- **Core Components:**
  - `StopGamePage.tsx`
  - `GameBoard.tsx` (Contains the magic number reveal and input rows).
  - `CalculationCell.tsx` (Validates math expressions against the magic number constraint).
- **CSS Strategy:** Dependent heavily on `.tabela`, utilizing specific `@media (orientation: portrait)` rules to dynamically adjust margins and paddings for small viewports.

## 📝 Roadmap, Bugs, & Future Ideas
*(Use this section below to jot down high-level game ideas using NotebookLM or your phone)*

- [ ] Multiplayer Sync Logic: Integrate WebSocket or P2P real-time syncing so players on multiple devices can race each other.
- [ ] Improve calculation cell touch targets for students with lower fine motor skills on tablets.
- [ ] Polish the celebration screen modal with pure CSS animations and dynamic fireworks on victory.