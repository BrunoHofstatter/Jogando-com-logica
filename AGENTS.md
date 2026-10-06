# AGENTS.md

##### ALWAYS ANSWER IN ENGLISH

## Communication Note

- User messages may come from voice transcription and can contain unintended wording or minor errors. Infer the likely intent from context and only ask for clarification when the meaning is genuinely ambiguous or the decision is important.

**Jogando com Lógica** is a free educational game platform teaching logic and math to Brazilian public school students (ages 8-13). No login required, instant play. All user-facing text must be in Brazilian Portuguese.

## Commands

```bash
npm run dev        # Start dev server
npm run build      # TypeScript check + Vite build
npm run lint       # ESLint
npm run deploy     # Build and deploy to GitHub Pages
npm run preview    # Preview production build
```

## Verification

- Browser-based visual verification, screenshots, Playwright checks, and local website preview checks are prohibited by default. Only use them when the user explicitly gives permission for that task.
- Code-only checks such as `npm run build`, `npm run lint`, tests, or diffs are still allowed when relevant.

## Tech Stack

- **React 18 + TypeScript + Vite**
- **CSS Modules**, mobile-first. Fluid units only (`vw`, `dvh`, `%`, `min()`) for layout, spacing, and fonts. Avoid `px` and `rem` for layout.
- **Font:** Cherry Bomb One (platform standard, loaded globally)
- **Routing:** `react-router-dom`. All routes defined as constants in `src/routes.ts`. `BackButton` in `App.tsx` auto-renders on all non-home routes.
- **Assets:** Always prefix with `import.meta.env.BASE_URL` (GitHub Pages requirement)
- **Deployment:** GitHub Pages via `gh-pages -d dist`, hosted on Cloudflare

## Directory Structure

```text
src/
├── Main/              # Platform shell: Home, Jogos, Sobre, Contato, manual pages + shared components
├── AA_baseGame/       # Shared board game engine, types, and base components
├── CrownChase/        # Caça Coroa
├── MathWar/           # Guerra Matemática
├── Damas/             # Damas
├── SPTTT/             # Super Jogo da Velha
├── Stop/              # Stop Matemático
├── Caca_soma/         # Caça Soma
└── RubiksClass/       # Cubo Mágico educational modules
```

## Architecture

**Board games** (`CrownChase`, `MathWar`, `Damas`, `SPTTT`) use the shared engine in `AA_baseGame/Logic/gameEngine.ts`. Each implements a `GameRules` interface (`validateMove`, `executeAction`, `getAvailableActions`, `checkWinCondition`) and a `GameConfig`. The shared `Board` component handles rendering, selection, and turn flow. `CrownChase`, `MathWar`, and `SPTTT` also have AI opponent pages (`aiGamePage.tsx`).

**Non-board games** (`Stop`, `Caca_soma`, `RubiksClass`) have fully custom logic. Do not try to plug them into the board engine.

Routes follow the pattern `/{game}Pg` (play) and `/{game}Rg` (rules). `RubiksClass` has a class menu plus individual class routes.

## Key Constraints

- All UI text must be in Brazilian Portuguese
- Preserve Portuguese accents directly in UTF-8 source files (for example `não`, `código`, `Você`). Do not commit mojibake such as `nÃ£o`, `cÃ³digo`, or `VocÃª`.
- No login and no external APIs. Games must work offline after first load
- Performance matters. School computers may be slow, so keep bundles lean
- **Windows reserved filenames:** Never create files named `CON`, `PRN`, `AUX`, `NUL`, `COM1-9`, or `LPT1-9` with or without extensions

## Documentation Notes

- Treat project documentation as structured context, not all as equal source-of-truth
- Keep **current reality** clearly separated from **planned ideas** or future roadmap items
- Grade ranges and pedagogical fit are recommendations unless a doc explicitly says they were validated in practice

## Context Files

Project documentation lives in `docs/`. Start with [the documentation index](docs/README.md), then read these references when relevant:

| File | When to read |
|------|--------------|
| `docs/games/crown-chase.md` | Working on Caça Coroa |
| `docs/games/math-war.md` | Working on Guerra Matemática |
| `docs/games/spttt.md` | Working on Super Jogo da Velha |
| `docs/games/stop.md` | Working on Stop Matemático |
| `docs/games/caca-soma.md` | Working on Caça Soma |
| `docs/games/rubiks.md` | Working on Cubo Mágico |
| `docs/games/bomb.md` | Working on Bomb Game |
| `docs/project/games-overview.md` | Need the full game catalog at a glance |
| `docs/project/overview.md` | Need overall project context, positioning, current priorities, or future plans |
| `docs/systems/multiplayer.md` | Working on online multiplayer architecture, backend deployment, or adding multiplayer to another game |
| `docs/systems/calculations.md` | Working on shared vertical arithmetic components |
| `docs/systems/rubiks-cube-component.md` | Working on the reusable Rubik's cube renderer |
| `docs/systems/classrooms.md` | Working on classroom codes, classroom room browsers, or adding classroom support to another online game |
| `docs/project/teacher-manual.md` | Working on the `/manual` page or teacher-facing content |
| `docs/systems/analytics.md` | Adding or modifying GA4 event tracking |
| `docs/tutorials/overview.md` | Understanding playable tutorials, their philosophy, and the documentation map |
| `docs/tutorials/technical-contract.md` | Working on the implemented shared session/history or a game integration |
| `docs/tutorials/crown-chase.md` | Working on Crown Chase's playable lesson and its game-specific decisions |
| `docs/plans/tutorials/next-tutorials.md` | Considering another game's tutorial; flexible context, not a prescribed workflow |
| `docs/plans/tutorials/roadmap.md` | Reviewing future tutorial work separately from implemented capabilities |

## Optional Skills

Reusable on-demand skills live in `.agents/skills/`. These are separate from project documentation in `docs/` and should only be loaded when the user explicitly asks for that skill or clearly requests that workflow.

Current skill:

| File | When to read |
|------|--------------|
| `jogando-design/SKILL.md` | User asks to use the design skill, follow the design system, apply the Jogando design, or use the design guide |

##### ALWAYS ANSWER IN ENGLISH
