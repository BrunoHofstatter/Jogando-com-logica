# CLAUDE.md

**Jogando com Lógica** is a free educational game platform teaching logic and math to Brazilian public school students (ages 8-13). No login required, instant play. All user-facing text must be in Brazilian Portuguese.

## Commands

```bash
npm run dev        # Start dev server
npm run build      # TypeScript check + Vite build
npm run lint       # ESLint
npm run deploy     # Build and deploy to GitHub Pages
npm run preview    # Preview production build
```

## Tech Stack

- **React 18 + TypeScript + Vite**
- **CSS Modules**, mobile-first. Fluid units only (`vw`, `dvh`, `%`, `min()`) for all layout, spacing, and fonts — `px` and `rem` are forbidden for layout.
- **Font:** Cherry Bomb One (platform standard, loaded globally)
- **Routing:** `react-router-dom`. All routes defined as constants in `src/routes.ts`. `BackButton` in `App.tsx` auto-renders on all non-home routes.
- **Assets:** Always prefix with `import.meta.env.BASE_URL` (GitHub Pages requirement)
- **Deployment:** GitHub Pages via `gh-pages -d dist`, hosted on Cloudflare

## Directory Structure

```
src/
├── Main/              # Platform shell: Home, Jogos, Sobre, Contato, manual pages + shared components
├── AA_baseGame/       # Shared board game engine, types, and base components
├── CrownChase/        # Caça Coroa
├── MathWar/           # Guerra Matemática
├── Damas/             # Damas (Checkers)
├── SPTTT/             # Super Jogo da Velha
├── Stop/              # Stop Matemático
├── Caca_soma/         # Caça Soma
└── RubiksClass/       # Cubo Mágico educational modules
```

## Architecture

**Board games** (CrownChase, MathWar, Damas, SPTTT) use the shared engine in `AA_baseGame/Logic/gameEngine.ts`. Each implements a `GameRules` interface (`validateMove`, `executeAction`, `getAvailableActions`, `checkWinCondition`) and a `GameConfig`. The shared `Board` component handles rendering, selection, and turn flow. CrownChase, MathWar, and SPTTT also have AI opponent pages (`aiGamePage.tsx`).

**Non-board games** (Stop, Caca_soma, RubiksClass) have fully custom logic — do not try to plug them into the board engine.

Routes follow the pattern `/{game}Pg` (play) and `/{game}Rg` (rules). RubiksClass has a class menu + individual class routes.

## Key Constraints

- All UI text in Brazilian Portuguese
- No login, no external APIs — games work offline after first load
- Performance: school computers may be slow, keep bundles lean
- **Windows reserved filenames:** Never create files named `CON`, `PRN`, `AUX`, `NUL`, `COM1-9`, `LPT1-9` (with or without extensions) — they cause file system errors on Windows

## Context Files

Deeper context lives in `.agents/rules/`. Read these when relevant:

| File | When to read |
|------|-------------|
| `game_crown_chase.md` | Working on Caça Coroa |
| `game_math_war.md` | Working on Guerra Matemática |
| `game_damas.md` | Working on Damas |
| `game_spttt.md` | Working on Super Jogo da Velha |
| `game_stop.md` | Working on Stop Matemático |
| `game_caca_soma.md` | Working on Caça Soma |
| `game_rubiks.md` | Working on Cubo Mágico |
| `docs_games_overview.md` | Need the full game catalog at a glance |
| `docs_teacher_manual.md` | Working on the `/manual` page or teacher-facing content |
| `googleanalytics.md` | Adding or modifying GA4 event tracking |
