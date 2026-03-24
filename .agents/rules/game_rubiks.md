---
description: Rubik's Class (Cubo Mágico) documentation.
---

# Rubik's Class (Cubo Mágico) - Educational Modules

## 🧩 Thematic Summary
A highly structured, interactive educational sequence designed to teach children how to solve the 3x3 Rubik's Cube step-by-step. Instead of just memorizing algorithms, they learn the logic behind moving pieces without destroying prior progress.

## ⚙️ Core Mechanics
- **Module Structure:** Currently contains 2 out of 6+ planned modules (e.g., The White Cross, Corner Insertion).
- **Interactive 3D Elements:** Uses a 3D interface (either custom WebGL/Three.js or CSS isometric transforms) to allow children to manipulate and observe a virtual cube.
- **Scaffolded Learning:** Players cannot progress to Module 3 without completing the logical check of Module 2.
- **Feedback Loop:** Incorrect moves are highlighted conceptually rather than penalizing heavily, encouraging experimentation over rote learning.

## 🏗 Technical Architecture
- **Location:** `src/RubiksClass/`
- **Engine Type:** Custom educational progression (Does not use `AA_baseGame`).
- **Core Components:**
  - `CubeRenderer.tsx` (Handles the visual state).
  - `ModuleRouter.tsx` (Manages progression between lessons).
- **Challenges:** Mobile interactions (swiping to rotate faces vs swiping to rotate the whole cube) requires precise touch handling.

## 📝 Roadmap, Bugs, & Future Ideas
*(Use this section below to jot down high-level game ideas using NotebookLM or your phone)*

- [ ] Complete the remaining 4 modules (F2L edge pairing, Top Cross, Top Corners, Final Layer Permutation).
- [ ] Optimize 3D rendering performance for low-end tablets (or fallback to 2D isometric arrays if slow).
- [ ] Implement a "Sandbox Mode" or timing scramble generator.
