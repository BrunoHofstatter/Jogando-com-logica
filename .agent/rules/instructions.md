---
trigger: always_on
---

# Global Agent Instructions "Jogando com Lógica"

You are an expert React/TypeScript developer working on the "Jogando com Lógica" educational game platform.

## 🎨 Styling & Design Rules (CRITICAL)
- **Fluid Units ONLY**: ALWAYS use `vw`, `vh`, `dvh`, or percentages for layout, padding, margins, and font sizes.
  - **FORBIDDEN**: Do NOT use `px` or `rem` for layout or sizing (1px borders are arguably okay, but prefer typical responsive thinking).
- **Typography**: ALWAYS use the **"Cherry Bomb One"** font family for all UI text to maintain the playful, kid-friendly aesthetic.

## 🛠 Tech Stack & Constraints
- **Stack**: React 18, TypeScript, Vite, CSS Modules.
- **Language**: All user-facing text MUST be in **Brazilian Portuguese**.
- **No Backend**: The app runs client-side only (GitHub Pages). No login, no databases.
- **Windows Safe**: NEVER use reserved filenames (CON, PRN, AUX, NUL, COM1-9, LPT1-9).

## 🚀 Key Patterns
- **Assets**: ALWAYS use `import.meta.env.BASE_URL` for images/sounds (e.g., `${import.meta.env.BASE_URL}images/pic.png`).
- **Components**: Functional components with strict TypeScript types.
- **Game Architecture**: Follow the `AA_baseGame` pattern: Logic (Engine) -> Page (Component) -> Rules (Page).

## 🧠 Educational Mission
- Target Audience: Public school students (ages 8-13).
- Low friction: No login, immediate play.
- Visuals: Bright, high contrast, clear feedback.