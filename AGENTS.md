# AGENTS.md

Technical reference for AI agents working with the Jogando com Lógica codebase.

## Tech Stack

- **Framework**: React 18 + TypeScript + Vite
- **Language**: Brazilian Portuguese (all UI text)
- **Target**: Ages 8-13, Brazilian public schools
- **Platform**: Web (no login/auth, works offline once loaded)
- **Deployment**: GitHub Pages via Cloudflare (jogandocomlogica.com)
- **Critical Constraint**: Must work on mobile/tablet (school computer labs) - highest priority

## Commands

```bash
npm run dev              # Dev server with hot reload
npm run build            # TypeScript compilation + Vite build
npm run lint             # ESLint
npm run deploy           # Build + deploy to GitHub Pages
npm run preview          # Preview production build
```

## Architecture

### Multi-Game Platform Structure

**Pluggable game engine architecture**: Games are isolated modules that plug into a shared engine.

```
src/
├── Main/                    # Platform core (navigation, home, game selection)
│   ├── Pages/              # Home, Jogos, Sobre, Contato, manual
│   ├── Components/         # GameButton, mainMenu, sectionBox, form
│   └── CSS/                # Global styles
├── AA_baseGame/            # Shared game engine & template
│   ├── Logic/              # gameEngine.ts, types.ts, gameRules.ts
│   ├── Pages/              # Template pages (baseGamePage, regrasPage)
│   └── Components/         # board-component.tsx, piece components
└── [GameName]/             # Individual game implementations
    ├── Logic/              # gameConfig.ts, gameRules.ts
    ├── Pages/              # baseGamePage.tsx, regrasPage.tsx
    ├── Components/         # Game-specific UI
    └── styles/             # CSS modules
```

### Current Games

**Board-based (use shared engine):**
- **CrownChase** (Caça Coroa): King protection, multiple piece types
- **MathWar** (Guerra Matemática): Dice + math, energy-based movement
- **Damas**: Checkers variant
- **SPTTT** (Super Jogo da Velha): Advanced tic-tac-toe

**Custom implementations (no shared engine):**
- **Caca_soma** (Caça Soma): Number hunting puzzle with timer
- **Stop** (Stop Matemático): Math word game, 6 difficulty levels, multiplayer
- **RubiksClass** (Cubo Mágico): Educational modules (2 of 6+ complete)

### Routing Pattern

Routes defined in `App.tsx`:
- `/` - Home page
- `/jogos` - Game selection screen
- `/sobre`, `/contato`, `/manual` - Info pages
- `/{game}Pg` - Game page (e.g., `/crownchasePg`, `/mathwarPg`)
- `/{game}Rg` - Rules page (e.g., `/crownchaseRg`, `/mathwarRg`)

Home button auto-appears on non-home routes via `BackButton` component.

## Core Game Engine (`AA_baseGame/Logic/`)

### Type System (`types.ts`)

**Core interfaces:**
```typescript
Position = { row: number, col: number }

Piece = {
  id: string
  type: string                    // e.g., "pawn", "king", "warrior"
  player: number                  // 1 or 2
  value?: number                  // For math-based games
  position: Position
  isPromoted?: boolean
  isKing?: boolean
  moveCount: number
  canBeCaptured?: boolean
  canCapture?: boolean
  customData?: Record<string, any>  // Game-specific extensions
}

TurnAction = {
  type: "move" | "capture" | "special"
  from?: Position
  to?: Position
  piece?: Piece
  cost?: number
  metadata?: Record<string, any>
}

GameState = {
  board: (Piece | null)[][]
  currentPlayer: number
  turnNumber: number
  actionHistory: TurnAction[]
  remainingMoves: number
  remainingEnergy: number
  score: Record<number, number>
  winner: number | null
  lastDiceRoll?: number
  customState?: Record<string, any>  // Game-specific state
}

GameConfig = {
  board: { rows: number, cols: number }
  initialPieces: Piece[]
  turnRules: {
    movesPerTurn?: number
    energyPerTurn?: number
    usesDice?: boolean
    timerSeconds?: number
  }
  winConditions: {
    captureTarget?: { type: string, player: number }
    scoreTarget?: number
    eliminateAllPieces?: boolean
  }
  pieceDefinitions: Record<string, {
    movementPattern: string[]      // e.g., ["orthogonal", "diagonal"]
    capturePattern?: string[]
    value?: number
    canPromote?: boolean
  }>
}
```

**Pre-built movement patterns:**
- `"orthogonal"` - Up/down/left/right
- `"diagonal"` - Diagonal directions
- `"king"` - Chess king (1 square any direction)
- `"distance1"`, `"distance2"`, etc. - Fixed distance moves
- `"jumper"` - Jump over pieces

### GameEngine Class (`gameEngine.ts`)

**Core responsibilities:**
- State initialization and management
- Action validation → execution flow
- Turn management and player switching
- Win condition checking
- Event system for UI reactivity

**Key methods:**
```typescript
class GameEngine {
  initializeGame(config: GameConfig, rules: GameRules): GameState
  validateAndExecuteAction(action: TurnAction): boolean
  getAvailableActionsForPosition(position: Position): TurnAction[]
  getCurrentPlayer(): number
  switchTurn(): void
  checkWinCondition(): WinResult | null
  rollDice(): number
  on(event: GameEvent, callback: (data) => void): void
}
```

**Events emitted:**
- `"win"` - Game over
- `"turn_start"`, `"turn_end"` - Turn lifecycle
- `"action_executed"` - After action completes
- `"piece_captured"` - When piece captured
- `"piece_promoted"` - When piece promoted

**GameUtils namespace:**
```typescript
GameUtils.isInBounds(pos: Position, config: GameConfig): boolean
GameUtils.rollDice(): number
GameUtils.positionsEqual(pos1: Position, pos2: Position): boolean
GameUtils.cloneBoard(board: Board): Board
GameUtils.isAdjacentToEdge(pos: Position, config: GameConfig): boolean
GameUtils.getDirection(from: Position, to: Position): "up" | "down" | "left" | "right" | null
GameUtils.getBounceDirection(direction: string): string
```

### GameRules Interface (`gameRules.ts`)

Games implement this interface to define custom behavior:

**Required methods:**
```typescript
interface GameRules {
  // Validate if action is legal
  validateMove(state: GameState, action: TurnAction): boolean

  // Execute action (mutate state)
  executeAction(state: GameState, action: TurnAction): boolean

  // List all legal moves for current player (or specific position)
  getAvailableActions(state: GameState, position?: Position): TurnAction[]

  // Check for win/loss/draw
  checkWinCondition(state: GameState): WinResult | null
}
```

**Optional hooks:**
```typescript
interface GameRules {
  // Lifecycle hooks
  onGameStart?(state: GameState): void
  onTurnStart?(state: GameState): void
  onTurnEnd?(state: GameState): void
  onAfterAction?(state: GameState, action: TurnAction): void

  // Custom mechanics
  calculateActionCost?(state: GameState, action: TurnAction): number
  shouldEndTurn?(state: GameState, action: TurnAction): boolean
  canCapture?(attacker: Piece, defender: Piece): boolean
  getMovementPattern?(piece: Piece): string[]
}
```

## Board Component (`AA_baseGame/Components/board-component.tsx`)

The shared board component that handles rendering and interaction:

```typescript
interface BoardProps {
  gameConfig: GameConfig
  gameRules: GameRules
  gameState?: GameState                  // Optional external state
  onGameStateChange?: (state) => void    // External state callback
}
```

**Responsibilities:**
- Game initialization using config/rules
- Square/piece selection with visual highlighting
- Action execution through game engine
- Event listening and UI updates
- Controls rendering (dice roll, turn info, score)
- Game phase detection (playing, won, lost)

**Visual feedback:**
- Highlighted selected piece
- Valid move indicators
- Color-coding (player 1 red, player 2 blue)
- Piece values displayed on pieces
- Score tracking

## Adding a New Board Game

**Step-by-step process:**

1. **Create directory**: `src/YourGame/`

2. **Create `Logic/gameConfig.ts`:**
```typescript
import { GameConfig } from "../../AA_baseGame/Logic/types";

export const gameConfig: GameConfig = {
  board: { rows: 8, cols: 8 },
  initialPieces: [
    { id: "p1", type: "pawn", player: 1, position: { row: 0, col: 0 }, moveCount: 0 },
    // ... more pieces
  ],
  turnRules: {
    movesPerTurn: 1,        // OR energyPerTurn: 10
    usesDice: false,
    timerSeconds: 0,        // 0 = no timer
  },
  winConditions: {
    captureTarget: { type: "king", player: 2 },  // OR
    scoreTarget: 10,        // OR
    eliminateAllPieces: true,
  },
  pieceDefinitions: {
    pawn: {
      movementPattern: ["orthogonal"],
      value: 1,
    },
    king: {
      movementPattern: ["king"],
      value: 5,
      canBeCaptured: false,
    },
  },
};
```

3. **Create `Logic/gameRules.ts`:**
```typescript
import { GameRules, GameState, TurnAction, WinResult } from "../../AA_baseGame/Logic/types";

export const gameRules: GameRules = {
  validateMove(state: GameState, action: TurnAction): boolean {
    // Implement move validation logic
    // Return true if action is legal
  },

  executeAction(state: GameState, action: TurnAction): boolean {
    // Mutate state to apply action
    // Return true if successful
  },

  getAvailableActions(state: GameState, position?: Position): TurnAction[] {
    // Return list of legal actions for current player
    // If position provided, return actions for that piece only
  },

  checkWinCondition(state: GameState): WinResult | null {
    // Check if game is over
    // Return { winner: number, reason: string } or null
  },
};
```

4. **Create `Pages/baseGamePage.tsx`:**
```typescript
import React from "react";
import Board from "../../AA_baseGame/Components/board-component";
import { gameConfig } from "../Logic/gameConfig";
import { gameRules } from "../Logic/gameRules";

const YourGamePage: React.FC = () => {
  return (
    <div className="game-page">
      <h1>Your Game Title</h1>
      <Board gameConfig={gameConfig} gameRules={gameRules} />
    </div>
  );
};

export default YourGamePage;
```

5. **Create `Pages/regrasPage.tsx`:**
```typescript
import React from "react";

const YourGameRegras: React.FC = () => {
  return (
    <div className="regras-page">
      <h1>Regras - Your Game</h1>
      {/* Game rules in Portuguese */}
    </div>
  );
};

export default YourGameRegras;
```

6. **Add routes in `App.tsx`:**
```typescript
import YourGamePage from "./YourGame/Pages/baseGamePage";
import YourGameRegras from "./YourGame/Pages/regrasPage";

// In Routes:
<Route path="/yourgamePg" element={<YourGamePage />} />
<Route path="/yourgameRg" element={<YourGameRegras />} />
```

7. **Add game button in `Main/Pages/Jogos.tsx`:**
```typescript
<GameButton
  to="/yourgamePg"
  imageSrc={`${import.meta.env.BASE_URL}images/yourgame.png`}
  altText="Your Game"
  title="Your Game"
/>
```

8. **Update `Main/Pages/manual.tsx`** with teacher information.

## Key Technical Patterns

### 1. Composition Over Inheritance
Games compose rules into `GameRules` object rather than extending classes.

### 2. Data-Driven Configuration
Piece setup defined declaratively in `gameConfig`. Movement patterns as reusable predicates.

### 3. Event-Driven UI
Game engine emits events, UI components subscribe. Decouples logic from rendering.

### 4. Flexible Resource System
Turn-based: moves per turn OR energy per turn. Custom costs via `calculateActionCost` hook.

### 5. Action Validation Flow
Separate validation (`validateMove`) and execution (`executeAction`). All actions tracked in history.

## Critical Technical Constraints

### 1. Windows File System Safety

**NEVER create files with Windows reserved names:**
- `CON`, `PRN`, `AUX`, `NUL`
- `COM1-9`, `LPT1-9`

These reference hardware devices and cause file system errors. Use descriptive names like `test-output.txt`, `debug-log.txt`.

### 2. Asset Loading

Always use `import.meta.env.BASE_URL` prefix for public assets:
```typescript
imageSrc={`${import.meta.env.BASE_URL}images/game.png`}
```

Required for GitHub Pages routing.

### 3. Mobile/Tablet First

All UI must work on touch devices. School computer labs use tablets.
- Touch-friendly (no hover-dependent interactions)
- Responsive layouts (< 768px mobile, 768-1024px tablet, > 1024px desktop)
- Readable text on small screens
- Test landscape and portrait orientations

### 4. Performance

School computers may be old/slow.
- Keep JavaScript bundles small
- Optimize renders (React.memo, useMemo, useCallback where needed)
- Avoid heavy dependencies
- Minimize re-renders

### 5. TypeScript Strictness

- Strict TypeScript enabled (`tsconfig.json`)
- No unused variables/parameters (ESLint enforced)
- Full type coverage required
- Use `Record<string, any>` for `Piece.customData` and `GameState.customState`

### 6. No External Dependencies

- No login/auth systems
- No external APIs
- Games work offline once loaded
- No database/backend

### 7. Portuguese Language

All user-facing text must be in Brazilian Portuguese.

## Component Patterns

### Tutorial System
`DynamicTutorial` component with localStorage persistence for first-time users.

### Difficulty Selection
Dynamic difficulty levels (e.g., Stop Matemático has 6 levels).

### Timer Integration
`Timer` component for speed-based games.

### Visual Feedback
- Highlighted squares for selected pieces
- Valid move indicators
- Color-coding (player colors, piece values)
- Clear action feedback

### Responsive Design
CSS modules + Bootstrap for responsive layouts.

## Deployment

- **Production URL**: https://jogandocomlogica.com/
- **Deploy command**: `npm run deploy`
- **Process**: Build → GitHub Pages → Cloudflare
- **Base URL**: Configured in Vite for GitHub Pages routing

## File Structure Reference

**Critical files to be careful with:**
- `App.tsx` - Central routing, affects entire app navigation
- `AA_baseGame/Logic/gameEngine.ts` - Shared by all board games
- `AA_baseGame/Logic/types.ts` - Core type definitions
- `Main/Pages/manual.tsx` - Teacher-facing documentation

**Common file locations:**
- Global styles: `Main/CSS/`
- Shared components: `Main/Components/`, `AA_baseGame/Components/`
- Game configs: `[GameName]/Logic/gameConfig.ts`
- Game rules: `[GameName]/Logic/gameRules.ts`
- Game pages: `[GameName]/Pages/`
- Public assets: `public/images/`, `public/sounds/`

## Testing Checklist

Before committing:
- [ ] Works on mobile (< 768px width)
- [ ] Works on tablet (768px - 1024px)
- [ ] Works on desktop
- [ ] No TypeScript errors (`npm run build`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] All text in Portuguese
- [ ] Clear visual feedback for all interactions
- [ ] Performance acceptable (no lag)

## Common Gotchas

1. **Asset paths**: Always use `import.meta.env.BASE_URL` prefix
2. **Windows reserved names**: Avoid CON, NUL, COM1-9, LPT1-9
3. **Mobile testing**: Test on real devices, not just DevTools
4. **Type strictness**: ESLint will fail on unused variables
5. **Portuguese**: All UI text must be Portuguese
6. **Piece IDs**: Must be unique across all pieces
7. **State mutation**: `executeAction` mutates state directly
8. **Movement patterns**: Must be defined in `pieceDefinitions` if using default validation

## Technical Priorities (2026)

1. **Mobile responsive design** (critical for Feb/March school launch)
2. Complete Rubik's Cube modules (2 of 6+ done)
3. AI opponents for 2-player games
4. Level/progression systems
5. Enhanced interactive elements in Cube modules
