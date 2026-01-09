# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Jogando com Lógica** (Playing with Logic) is a free educational game platform for teaching logic reasoning and mathematical thinking to Brazilian students in grades 3-7 (ages 8-13). Built with React, TypeScript, and Vite.

### Mission & Purpose

**Core Mission:** Make learning math and logic fun, engaging, and accessible to Brazilian public school students through strategy-based games.

**Problems We Solve:**
- **Engagement gap**: Traditional math teaching can be dry and abstract. Our games make concepts concrete and fun.
- **Resource scarcity**: Many Brazilian municipal schools lack engaging educational materials. This platform is completely free.
- **Accessibility**: Teachers often don't have time to create innovative activities. We provide ready-to-use games with full teacher guides.
- **Logic development**: Goes beyond rote memorization to develop genuine problem-solving and strategic thinking skills.

**Original Inspiration:** Using the Rubik's cube to teach mathematical concepts (areas, dimensions, multiplication) in hands-on, engaging ways.

### Target Audience

**Students:**
- Ages 8-13 (grades 3-7, some games starting at grade 1)
- Brazilian students (Portuguese-only platform)
- Primarily municipal/public school students

**Teachers:**
- Elementary/middle school math teachers
- After-school program coordinators ("contra turno")
- Educators looking for supplementary materials
- Teachers who want engaging activities but lack time to create them

**Usage Contexts:**
- In-class activities (teacher-led)
- After-school programs
- Computer lab sessions
- Individual student practice at home

### Educational Philosophy

**Learning by Doing:**
- Start with the activity first, teach concepts through experience
- Provide hints progressively when students struggle (visible in Rubik's Cube modules)
- Let students discover patterns and strategies themselves

**Game-Based Learning:**
- Games as the primary teaching vehicle, not just rewards
- Strategic thinking develops naturally through gameplay
- Competition and challenge as motivators

**Scaffolded Learning:**
- Multiple difficulty levels (e.g., Stop Matemático has 6 levels)
- Hints that build progressively
- Start accessible, increase complexity naturally

**Concrete to Abstract:**
- Use tangible objects/visuals (Rubik's cube, chess pieces, boards)
- Visual representations before formulas
- Real game scenarios before mathematical terminology

### Game Design Principles

**What Makes a Good Game for This Platform:**

1. **Clear Objective**: Every game has one simple goal (capture the Captain, get 5 points, complete calculations)
2. **Mathematical Foundation**: Every action involves calculation
   - Guerra Matemática: Energy = dice + piece value
   - Stop Matemático: Complete 10 calculations with magic number
   - Caça Coroa: Find combinations that sum to target
3. **Strategic Depth**: Simple rules, complex gameplay
   - Super Jogo da Velha: Tic-tac-toe everyone knows → advanced strategy emerges
   - Guerra Matemática: Resource management meets tactics
4. **Accessibility**:
   - No login required
   - Minimal clicks to start playing
   - Visual clarity (color-coding, highlights)
5. **Replayability**:
   - Random elements (dice rolls, magic numbers)
   - Different strategies each game
   - Competitive elements (2-player games)
6. **Self-Contained**: Each game teaches without needing external explanation

**What to Avoid:**
- Overly complex rules
- Requiring external materials/knowledge
- Login barriers
- Unclear win conditions

### Current Status & Timeline

**Phase:** MVP testing (late 2025) → School launch (Feb/March 2026)

**Immediate Priorities (Dec 2025 - March 2026):**
1. **CRITICAL: Mobile responsive design** - Biggest current challenge before school launch
2. Collect teacher feedback via Google Forms
3. Complete Rubik's Cube modules (2 of 6+ done - these are the "face of the project")
4. Fix mobile/tablet compatibility issues

**Medium-term (2026):**
- AI opponents for all 2-player games
- Level/progression systems for solo games
- Enhanced interactive elements in Cube modules
- Broader school outreach via email campaigns

**Long-term Vision:**
- Multiplayer room system (public/private rooms, not matchmaking)
- More math-teaching games (currently emphasizes logic; teachers want more direct math instruction)
- Possible native mobile app
- Become recognized educational platform across Brazil

**What Won't Change:**
- Free access for all users
- No aggressive monetization
- Focus on Brazilian schools and Portuguese language
- Bruno's commitment (continues managing remotely from US starting Aug/Sep 2026)

### Team & Project History

**History:**
- **2024**: Started in one municipal school in Novo Hamburgo, Rio Grande do Sul
- Created by Bruno as high school student teaching after-school programs
- Began with Rubik's cube logic lessons → expanded to original board games
- **2025**: Formalized, expanded to 2 schools, built remote team
- **Late 2025**: MVP website launched (jogandocomlogica.com)

**Team:**
- **Bruno** (Project creator): Primary coder, designer, decision-maker. Created all original games (except Super Jogo da Velha). Graduating high school 2024 → gap year 2025 → studying abroad Aug/Sep 2026.
- **Tiago & Rodrigo**: TypeScript developers (functions/logic)
- **Gabriel**: Ideas, design, strategy (closest collaborator)
- **Bruno (other)**: Ideas, design, strategy (joined Nov 2025)
- All remote, from different parts of Brazil

### Development Priorities

When making decisions, prioritize:

1. **Accessibility First**: No barriers to access. Works on all devices (especially mobile/tablets for school computer labs).
2. **Teacher-Friendly**: Teachers are key users. They need clear instructions, grade recommendations, time estimates.
3. **Simple Rules, Deep Strategy**: Don't over-complicate. Let complexity emerge from simple mechanics.
4. **Mathematical Integration**: Math should be baked into gameplay, not tacked on.
5. **Visual Clarity**: Students should immediately understand what they can do. Use color-coding, highlighting, clear feedback.
6. **Performance**: School computers may be old. Keep it fast and lightweight.
7. **Portuguese Language**: All content in Brazilian Portuguese.

**Current Development Focus:**
- Upgrade existing 6 games before adding new ones
- Complete Rubik's Cube modules (high priority)
- Mobile responsiveness (CRITICAL for Feb/March 2026 launch)
- Teacher feedback integration

## Common Commands

```bash
# Development
npm run dev              # Start dev server with hot reload

# Building
npm run build            # TypeScript compilation + Vite build

# Linting
npm run lint             # Run ESLint on all files

# Deployment
npm run deploy           # Build and deploy to GitHub Pages
npm run preview          # Preview production build locally
```

## Architecture Overview

### Multi-Game Platform Structure

The codebase uses a **pluggable game engine architecture** where games are isolated modules that plug into a shared engine. Directory structure:

```
src/
├── Main/                    # Platform core (Home, Jogos, Sobre, Contato pages)
│   ├── Pages/              # Navigation pages
│   ├── Components/         # Shared UI (GameButton, mainMenu, sectionBox, form)
│   └── CSS/                # Global styles
├── AA_baseGame/            # Base game template & shared engine
│   ├── Logic/              # Core game engine, types, rules interface
│   ├── Pages/              # Template game & rules pages
│   └── Components/         # Reusable board & piece components
└── [GameName]/             # Individual game implementations
    ├── Logic/              # Game-specific config & rules
    ├── Pages/              # baseGamePage.tsx + regrasPage.tsx
    ├── Components/         # Game-specific UI components
    └── styles/             # CSS modules
```

**Current Games:**
- **CrownChase** (Caça Coroa): Board game - king protection, multiple piece types, strategic capture
- **MathWar** (Guerra Matemática): Board game - dice + math, energy-based movement (piece value + dice)
- **Damas**: Board game - checkers variant
- **Caca_soma** (Caça Soma): Puzzle game - number hunting with timer, non-board-based
- **Stop** (Stop Matemático): Math word game - timer-based, 6 difficulty levels, multiplayer
- **SPTTT** (Super Jogo da Velha): Board game - advanced tic-tac-toe with strategic depth
- **RubiksClass** (Cubo Mágico): Educational modules - Dimensions, FaceArea, Fractions, Geometry (2 of 6+ complete)

### Core Game Engine (`AA_baseGame/Logic/`)

The shared game engine provides:

**1. Type System (`types.ts`)**
- `Position`, `Piece`, `GameState`, `TurnAction`, `GameConfig` interfaces
- Pre-built movement patterns: orthogonal, diagonal, king (chess), distance-based, jumper
- Game events: win, turn_start/end, action_executed, piece_captured, piece_promoted

**2. GameEngine Class (`gameEngine.ts`)**
- State initialization and management
- Action validation → execution flow
- Turn management and player switching
- Win condition checking
- Event system for UI reactivity
- Helper utilities (dice rolling, energy calculations, etc.)

**3. GameRules Interface (`gameRules.ts`)**

Games implement this interface:

**Required methods:**
```typescript
validateMove(state, action): boolean          // Check move legality
executeAction(state, action): boolean         // Apply action to state
getAvailableActions(state, position?): TurnAction[]  // List legal moves
checkWinCondition(state): WinResult | null    // Determine win/loss
```

**Optional hooks:**
```typescript
onGameStart(state)                            // Custom initialization
onTurnStart(state), onTurnEnd(state)         // Turn lifecycle
onAfterAction(state, action)                 // Post-action processing
calculateActionCost(state, action): number   // Custom cost logic
shouldEndTurn(state, action): boolean        // Custom turn ending
canCapture(attacker, defender): boolean      // Capture restrictions
getMovementPattern(piece): string[]          // Piece-specific movement
```

### Game Implementation Pattern

Each board-based game follows this structure:

1. **Logic/gameConfig.ts** - Define board dimensions, initial piece placement, turn rules (moves/energy per turn, timers)
2. **Logic/gameRules.ts** - Implement `GameRules` interface with game-specific validation and execution logic
3. **Pages/baseGamePage.tsx** - Main game page that instantiates the board with config and rules
4. **Pages/regrasPage.tsx** - Rules/instructions page
5. **Components/** - Custom board/piece rendering if needed (can reuse from AA_baseGame)

### Board Component Architecture

The shared `Board` component (`AA_baseGame/Components/board-component.tsx`):

```typescript
interface BoardProps {
  gameConfig: GameConfig;
  gameRules: GameRules;
  gameState?: GameState;                  // Optional external state
  onGameStateChange?: (state) => void;    // External state callback
}
```

Handles:
- Game initialization using provided config/rules
- Square/piece selection with visual highlighting
- Action execution through game engine
- Game event listening
- UI controls (dice roll, turn info, score display)
- Game phase detection (playing, won, lost)

### Adding a New Game

1. Create directory: `src/YourGame/`
2. Create `Logic/gameConfig.ts`:
   ```typescript
   export const gameConfig: GameConfig = {
     board: { rows: 8, cols: 8 },
     initialPieces: [...],
     turnRules: { movesPerTurn: 1 },
     // ...
   };
   ```
3. Create `Logic/gameRules.ts` implementing `GameRules` interface
4. Create `Pages/baseGamePage.tsx` using the Board component
5. Create `Pages/regrasPage.tsx` with game instructions
6. Add route in `App.tsx`:
   ```typescript
   <Route path="/yourgamePg" element={<YourGamePage />} />
   <Route path="/yourgameRg" element={<YourGameRegras />} />
   ```
7. Add game button in `Main/Pages/Jogos.tsx` using `GameButton` component

### Routing

Main routes (`App.tsx`):
- `/` - Home page
- `/jogos` - Game selection screen
- `/sobre`, `/contato`, `/manual` - Info pages
- `/{game}Pg` - Game page (e.g., `/crownchasePg`, `/mathwarPg`)
- `/{game}Rg` - Rules page (e.g., `/crownchaseRg`, `/mathwarRg`)

Home button automatically appears on all non-home routes via `BackButton` component.

### Key Architectural Principles

**1. Composition Over Inheritance**
- Games compose rules into `GameRules` object rather than extending classes
- Engine methods available as utilities for custom implementations

**2. Data-Driven Configuration**
- Piece setup defined declaratively in `gameConfig`
- Movement patterns as reusable predicates
- Centralized configuration reduces boilerplate

**3. Event-Driven UI**
- Game engine emits events (`win`, `turn_start`, `action_executed`, etc.)
- UI components subscribe to state changes
- Decouples game logic from rendering

**4. Flexible Resource System**
- Turn-based resources: moves per turn OR energy per turn
- Custom cost calculations via `calculateActionCost` hook
- Automatic turn ending based on resource exhaustion

**5. Action Validation Flow**
- Separate validation (`validateMove`) and execution (`executeAction`) phases
- All actions tracked in history
- Enables undo/replay functionality if needed

### Non-Board Games

Some games don't use the board-based engine:

- **Caca_soma**: Single-player puzzle with timer, custom component structure
- **Stop**: Multiplayer word game with difficulty levels, timer-based rounds
- **RubiksClass**: Educational multi-class system with progressive modules

These implement custom game logic without the shared engine but follow similar directory patterns.

### Utilities & Helpers

**GameUtils namespace** (`gameEngine.ts`):
- `isInBounds()` - Boundary checking
- `rollDice()` - Dice simulation
- `positionsEqual()` - Position comparison
- `cloneBoard()` - Deep state cloning
- `isAdjacentToEdge()` - Edge detection
- `getDirection()` - Calculate move direction
- `getBounceDirection()` - Bounce mechanics for special moves

### UI/UX Patterns

- **Tutorial System**: `DynamicTutorial` component with localStorage persistence for first-time users
- **Difficulty Selection**: Dynamic difficulty in games like Stop Matemático (6 levels)
- **Timer Integration**: Timer component for speed-based games
- **Visual Feedback**: Highlighted squares for selected pieces and valid moves
- **Color-Coding**: Player colors (red/blue), value numbers on pieces (not just colors for accessibility)
- **Teacher Manual**: `/manual` page provides teacher guide with game descriptions, skills taught, recommended grades, time estimates, difficulty levels
- **Responsive Design**: CSS modules + Bootstrap for responsive layouts (mobile/tablet optimization is CRITICAL priority)
- **Asset Loading**: Use `import.meta.env.BASE_URL` prefix for all public assets
- **No Login Required**: Direct access from homepage → "Jogar" → pick game. No barriers.
- **Touch-Friendly**: Click-based interactions designed to work on tablets/phones used in school computer labs

### Content & Language

- **Language**: All content must be in Brazilian Portuguese
- **Age-Appropriate**: Content for ages 8-13 (grades 3-7)
- **Teacher Resources**: Each game should have a regras (rules) page explaining how to play, what skills it teaches, and recommended usage
- **Self-Explanatory**: Games should be playable without external instructions (though teacher guides supplement)

### TypeScript Guidelines

- Strict TypeScript enabled (`tsconfig.json`)
- No unused variables/parameters allowed (ESLint enforced)
- Full type coverage for game mechanics
- Use `Record<string, any>` in `Piece.customData` for game-specific extensions

### File System Safety (Windows Environment)

**CRITICAL: Never create files with Windows reserved names**

The project is developed on Windows. The following names are **reserved device names** and must NEVER be used as filenames (with or without extensions):

- `CON`, `PRN`, `AUX`, `NUL`
- `COM1`, `COM2`, `COM3`, `COM4`, `COM5`, `COM6`, `COM7`, `COM8`, `COM9`
- `LPT1`, `LPT2`, `LPT3`, `LPT4`, `LPT5`, `LPT6`, `LPT7`, `LPT8`, `LPT9`

**Why this matters:**
- These names reference hardware devices in Windows (e.g., `NUL` is the null device, `CON` is the console)
- Creating files with these names causes file system errors
- Such files cannot be deleted or manipulated using standard commands
- Git may show them as untracked but they don't actually exist as files

**What to do instead:**
- When creating test files, use descriptive names like `test-output.txt`, `debug-log.txt`, `temp-data.json`
- For null/empty file operations, use `/dev/null` on Unix or explicit Windows commands
- Never redirect output to files named after these reserved keywords

### Deployment

- Homepage: `https://jogandocomlogica.com/`
- Deployed via GitHub Pages (`gh-pages -d dist`)
- Hosted on Cloudflare
- Base URL configured in Vite for GitHub Pages routing

## Working with This Codebase

### Key Considerations When Making Changes

1. **Mobile First**: With Feb/March 2026 school launch approaching, mobile/tablet compatibility is the highest priority. Test all changes on small screens.

2. **Performance Matters**: School computers may be old/slow. Keep JavaScript bundles small, avoid heavy dependencies, optimize renders.

3. **Accessibility**:
   - Color-blind friendly (use values on pieces, not just colors)
   - Works without mouse (touch-friendly for tablets)
   - Clear visual feedback for all interactions

4. **Teacher Experience**:
   - Teachers are key users who will recommend (or not recommend) this platform
   - Ensure regras (rules) pages are clear and complete
   - Maintain the `/manual` page with accurate game information

5. **Student Age (8-13)**:
   - Keep UI simple and obvious
   - Avoid text-heavy instructions
   - Use visual cues and immediate feedback
   - Don't assume prior gaming knowledge

6. **Portuguese Language**: All user-facing text must be in Brazilian Portuguese

7. **No External Dependencies**: No login systems, no external APIs (games work offline once loaded)

### When Adding Features

**Ask yourself:**
- Does this work on mobile/tablet screens?
- Will 8-13 year olds understand it immediately?
- Does it require login or external services? (If yes, reconsider)
- Does this align with the educational goals (logic reasoning, math thinking)?
- Will teachers find this useful or confusing?
- Does it add significant bundle size? (If yes, is it worth it?)

### Common Tasks

**Adding a new board game:**
1. Follow the pattern in `AA_baseGame/` - don't reinvent the wheel
2. Ensure the game has clear mathematical/logical foundation
3. Create both `/[game]Pg` (play) and `/[game]Rg` (rules) pages
4. Add game button in `Main/Pages/Jogos.tsx`
5. Update `/manual` page with teacher information

**Fixing mobile issues:**
1. Test in Chrome DevTools mobile view AND real devices if possible
2. Check touch interactions (not just hover states)
3. Ensure text is readable on small screens
4. Test landscape and portrait orientations

**Updating Rubik's Cube modules:**
- These are the "face of the project" - high priority to complete
- Follow progressive hint system pattern from existing modules
- Ensure interactive elements work on touch devices
- Mathematical concepts should build on previous modules

### Files to Be Careful With

- `App.tsx`: Central routing - changes affect entire app navigation
- `AA_baseGame/Logic/gameEngine.ts`: Shared by all board games - changes affect multiple games
- `AA_baseGame/Logic/types.ts`: Core type definitions - changes may break existing games
- `Main/Pages/manual.tsx`: Teacher-facing documentation - keep accurate and updated

### Testing Checklist

Before committing significant changes:
- [ ] Works on mobile (< 768px width)
- [ ] Works on tablet (768px - 1024px)
- [ ] Works on desktop
- [ ] No TypeScript errors (`npm run build`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] All text in Portuguese
- [ ] Clear visual feedback for all interactions
- [ ] Performance is acceptable (no lag on user actions)

### Project Values - Keep in Mind

This project is about **making education accessible and fun** for under-resourced Brazilian students. Every decision should support that mission:
- **Free access > Monetization**
- **Simplicity > Feature richness**
- **Accessibility > Sophistication**
- **Teacher usefulness > Technical elegance**
- **Student engagement > Educational orthodoxy**

When in doubt, prioritize what helps students learn and teachers teach.
