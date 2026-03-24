---
description: General platform architecture, concept, and technical stack details.
---

# Jogando com Lógica - General Overview

## 🎯 Platform Mission
- **Target Audience:** Brazilian public school students (ages 8-13).
- **Core Goal:** Gamify mathematics and logical thinking to make learning highly engaging, reducing friction for both teachers and students.
- **Accessibility:** Zero login required, instant play, designed to work smoothly on mobile phones, tablets, and low-end school computer labs without an active internet connection after the first load.
- **Language:** All user-facing UI text is strictly in Brazilian Portuguese. 

## 🛠 Tech Stack
- **Framework:** React 18 with TypeScript.
- **Bundler:** Vite.
- **Styling Strategy:** Vanilla CSS Modules with a strict Mobile-First approach. 
  - **Sizing:** Fluid units ONLY (`vw`, `dvh`, `%`, `min(vw, dvh)`) are used for layout, margins, paddings, and fonts. `px` and `rem` are forbidden for layouts to ensure perfect responsiveness across devices.
  - **Typography:** The "Cherry Bomb One" font family is the platform standard, giving it a playful, kid-friendly aesthetic.
- **Deployment:** Hosted statically on GitHub Pages via Cloudflare.

## 🧭 Core Structure & Routing
The application layout is highly modular but connected via a central UI.
- **Main Pages:** Home (`/`), Game Selection (`/jogos`), About (`/sobre`), Contact (`/contato`), and Teacher Manual (`/manual`).
- **Game Architecture:** The platform utilizes an extensible game engine (`AA_baseGame/Logic/gameEngine.ts`) for all turn-based/board games. Independent custom games don't use this engine but follow the same component/logic separation patterns.
- **Routing:** Handled in `App.tsx` using `react-router-dom`. The Home button uniquely auto-appears on non-home routes via the `BackButton` component.

## 📝 Roadmap & Future Platform Ideas
*(Use this section below to jot down high-level global ideas using NotebookLM or your phone)*

- [ ] Add a global session-based achievement/score system using `localStorage`.
- [ ] PWA (Progressive Web App) implementation for deep native offline support on school tablets.
- [ ] Add sound effect toggles globally.
- [ ] Implement an overall progression map that unlocks new games or levels as the student plays.
