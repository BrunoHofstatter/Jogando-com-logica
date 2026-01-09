# AI Implementation Plan - Jogando com Lógica

## Overview

This document outlines the plan for implementing AI opponents for three games:
- **CrownChase** (Caça Coroa)
- **MathWar** (Guerra Matemática)
- **SPTTT** (Super Jogo da Velha)

---

## Approach Decision: Traditional AI vs LLM API

### ❌ Why NOT to use LLM APIs (Gemini, etc.)

**Technical Issues:**
- **Cost**: Every move requires an API call ($$$)
- **Latency**: 1-3 second delays per move (bad UX)
- **Requires Internet**: Breaks offline functionality
- **Unreliable**: LLMs can hallucinate invalid moves
- **Bundle Size**: No impact on bundle, but adds external dependency

**Project Value Conflicts:**
- CLAUDE.md emphasizes "no external dependencies"
- Target users (municipal schools) may have poor internet
- Platform currently works offline after initial load
- Performance on old school computers is priority

### ✅ Recommended Approach: Traditional Game AI

**Why it's better:**
- **Free**: No API costs
- **Fast**: Instant move calculation
- **Offline**: Runs entirely in browser
- **Reliable**: Deterministic, no hallucinations
- **Controllable**: Easy to tune difficulty levels
- **Proven**: How most games do AI (chess, checkers, mobile games)

---

## Difficulty Level Design

### Target Audience Considerations
- Primary users: Kids aged 8-13
- Should be beatable but provide challenge
- Educational goal: Teach strategy, not frustrate
- Bruno's personal use: One hard difficulty for testing

### Planned Difficulty Levels

#### **Nível 1: Fácil** (Easy)
**Algorithm**: Random move selection

**How it works:**
1. Get all legal moves from `getAvailableActions()`
2. Pick one randomly
3. Execute

**Skill level**: 90% beatable - Perfect for beginners

**Implementation time**: 30 minutes per game

---

#### **Nível 2: Médio** (Medium)
**Algorithm**: Simple rule-based heuristics

**How it works:**
1. Get all legal moves
2. Score each move based on simple rules:
   - Capturing enemy piece: +100 points
   - Threatening high-value target: +50 points
   - Moving to safety: +10 points
   - Random baseline: 0-5 points
3. Pick highest-scoring move

**Game-specific heuristics:**
- **CrownChase**: Prioritize king captures > piece captures > king safety
- **MathWar**: Prioritize captain captures > high-value captures > energy efficiency
- **SPTTT**: Prioritize immediate wins > block opponent wins > center squares

**Skill level**: 70% beatable - Good for learning

**Implementation time**: 2-3 hours per game

---

#### **Nível 3: Difícil** (Hard)
**Algorithm**: One-move lookahead with evaluation

**How it works:**
1. For each possible move:
   - Simulate the move
   - Evaluate the resulting position (score function)
   - Undo simulation
2. Pick move leading to best position

**Evaluation function** (game-specific):
```
Score = (my advantages) - (opponent advantages)

CrownChase:
  + my_piece_count * 10
  - opponent_piece_count * 10
  + king_safety * 20
  - opponent_king_safety * 20

MathWar:
  + sum(my_piece_values)
  - sum(opponent_piece_values)
  + captain_safety * 100
  + average_energy_efficiency * 5

SPTTT:
  + boards_won * 100
  + winning_threats * 30
  + center_control * 10
```

**Skill level**: 40% beatable - Genuinely challenging

**Implementation time**: 4-6 hours per game

---

#### **Nível 4: Muito Difícil** (Very Hard)
**Algorithm**: Minimax search (2-3 moves deep)

**How it works:**
1. Build game tree exploring future moves
2. Assume both players play optimally
3. Use minimax algorithm to find best move
4. Apply alpha-beta pruning for performance

**Conceptual flow:**
```
My turn: Try moves A, B, C
  For Move A:
    Opponent responds with best counter
      I respond with best counter to that
        Evaluate final position
  For Move B:
    ... (same process)
  For Move C:
    ... (same process)
Pick move with best worst-case outcome
```

**Depth settings:**
- Depth 2: Look 2 moves ahead (my move + opponent response)
- Depth 3: Look 3 moves ahead (my move + opponent + my counter)

**Skill level**: 20% beatable - Requires good strategy

**Implementation time**: 8-12 hours per game

---

#### **Nível 5: Impossível** (Impossible - Optional, for Bruno)
**Algorithm**: Minimax depth 4-6 with optimizations

**How it works:**
- Same as Level 4, but searches deeper
- Alpha-beta pruning essential at this depth
- May need move ordering for performance
- Iterative deepening for time management

**Skill level**: 5% beatable - Near-perfect play

**Implementation time**: +4-6 hours tuning

**Note**: This level is NOT for kids. Personal challenge only.

---

## Technical Implementation Strategy

### File Structure

Create AI modules for each game:
```
src/CrownChase/Logic/aiPlayer.ts
src/MathWar/Logic/aiPlayer.ts
src/SPTTT/Logic/aiPlayer.ts
```

### Core AI Module Structure

```typescript
// aiPlayer.ts

export type AIDifficulty = 1 | 2 | 3 | 4 | 5;

export const getAIMove = (
  state: GameState,
  difficulty: AIDifficulty
): TurnAction => {
  const availableMoves = gameRules.getAvailableActions(state);

  if (availableMoves.length === 0) {
    throw new Error("No available moves for AI");
  }

  switch(difficulty) {
    case 1:
      return getRandomMove(availableMoves);
    case 2:
      return getHeuristicMove(state, availableMoves);
    case 3:
      return getLookaheadMove(state, availableMoves);
    case 4:
      return getMinimaxMove(state, availableMoves, depth: 2);
    case 5:
      return getMinimaxMove(state, availableMoves, depth: 4);
  }
}

// Level 1: Random
const getRandomMove = (moves: TurnAction[]): TurnAction => {
  return moves[Math.floor(Math.random() * moves.length)];
}

// Level 2: Heuristics
const getHeuristicMove = (
  state: GameState,
  moves: TurnAction[]
): TurnAction => {
  const scoredMoves = moves.map(move => ({
    move,
    score: scoreMove(state, move)
  }));

  scoredMoves.sort((a, b) => b.score - a.score);
  return scoredMoves[0].move;
}

// Level 3: One lookahead
const getLookaheadMove = (
  state: GameState,
  moves: TurnAction[]
): TurnAction => {
  const scoredMoves = moves.map(move => {
    const stateCopy = cloneState(state);
    gameRules.executeAction(stateCopy, move);

    return {
      move,
      score: evaluatePosition(stateCopy)
    };
  });

  scoredMoves.sort((a, b) => b.score - a.score);
  return scoredMoves[0].move;
}

// Level 4-5: Minimax
const getMinimaxMove = (
  state: GameState,
  moves: TurnAction[],
  depth: number
): TurnAction => {
  let bestMove = moves[0];
  let bestScore = -Infinity;

  for (const move of moves) {
    const stateCopy = cloneState(state);
    gameRules.executeAction(stateCopy, move);

    const score = minimax(stateCopy, depth - 1, -Infinity, Infinity, false);

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

// Minimax with alpha-beta pruning
const minimax = (
  state: GameState,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean
): number => {
  // Base cases
  const winResult = gameRules.checkWinCondition(state);
  if (winResult !== null) {
    if (winResult.winner === AI_PLAYER) return 10000;
    if (winResult.winner === HUMAN_PLAYER) return -10000;
    return 0; // tie
  }

  if (depth === 0) {
    return evaluatePosition(state);
  }

  const moves = gameRules.getAvailableActions(state);

  if (isMaximizing) {
    let maxScore = -Infinity;
    for (const move of moves) {
      const stateCopy = cloneState(state);
      gameRules.executeAction(stateCopy, move);
      gameEngine.endTurn(stateCopy);

      const score = minimax(stateCopy, depth - 1, alpha, beta, false);
      maxScore = Math.max(maxScore, score);
      alpha = Math.max(alpha, score);

      if (beta <= alpha) break; // Prune
    }
    return maxScore;
  } else {
    let minScore = Infinity;
    for (const move of moves) {
      const stateCopy = cloneState(state);
      gameRules.executeAction(stateCopy, move);
      gameEngine.endTurn(stateCopy);

      const score = minimax(stateCopy, depth - 1, alpha, beta, true);
      minScore = Math.min(minScore, score);
      beta = Math.min(beta, score);

      if (beta <= alpha) break; // Prune
    }
    return minScore;
  }
}

// Game-specific evaluation function
const evaluatePosition = (state: GameState): number => {
  // See game-specific sections below
}

// Game-specific move scoring (for heuristics)
const scoreMove = (state: GameState, move: TurnAction): number => {
  // See game-specific sections below
}

// Helper: Deep clone state for simulation
const cloneState = (state: GameState): GameState => {
  // Use gameEngine.cloneBoard or manual deep copy
}
```

---

## Game-Specific Considerations

### CrownChase (Caça Coroa)

**Win Condition**: Capture opponent's king

**Evaluation Function**:
```typescript
const evaluatePosition = (state: GameState): number => {
  let score = 0;

  // Piece count
  const myPieces = countPieces(state, AI_PLAYER);
  const oppPieces = countPieces(state, HUMAN_PLAYER);
  score += (myPieces - oppPieces) * 15;

  // King safety (distance from enemy pieces)
  const myKingSafety = calculateKingSafety(state, AI_PLAYER);
  const oppKingSafety = calculateKingSafety(state, HUMAN_PLAYER);
  score += (myKingSafety - oppKingSafety) * 25;

  // Threat to opponent king
  if (isKingThreatened(state, HUMAN_PLAYER)) score += 50;
  if (isKingThreatened(state, AI_PLAYER)) score -= 50;

  // Board control (pieces in center)
  score += centralPieceCount(state, AI_PLAYER) * 5;

  return score;
}
```

**Heuristic Scoring**:
```typescript
const scoreMove = (state: GameState, move: TurnAction): number => {
  let score = Math.random() * 5; // Randomness baseline

  if (move.type === 'capture') {
    if (move.capturedPiece?.type === 'king') score += 10000; // WIN!
    else if (move.capturedPiece?.type === 'killer') score += 100;
    else if (move.capturedPiece?.type === 'jumper') score += 80;
  }

  // Does this threaten opponent king?
  if (threatensKing(state, move)) score += 200;

  // Move king to safety?
  if (move.from && getPieceAt(state, move.from)?.type === 'king') {
    if (isPositionSafe(state, move.to!)) score += 50;
  }

  return score;
}
```

**Special Considerations**:
- King safety is paramount
- Jumper mechanics (jumping over pieces) add complexity
- Killer vs Jumper value difference

---

### MathWar (Guerra Matemática)

**Win Condition**: Capture opponent's captain

**Evaluation Function**:
```typescript
const evaluatePosition = (state: GameState): number => {
  let score = 0;

  // Total piece value
  const myValue = totalPieceValue(state, AI_PLAYER);
  const oppValue = totalPieceValue(state, HUMAN_PLAYER);
  score += (myValue - oppValue) * 10;

  // Captain safety
  const myCaptainSafety = calculateCaptainSafety(state, AI_PLAYER);
  const oppCaptainSafety = calculateCaptainSafety(state, HUMAN_PLAYER);
  score += (myCaptainSafety - oppCaptainSafety) * 50;

  // Energy efficiency (higher value pieces = better)
  score += averagePieceValue(state, AI_PLAYER) * 5;

  // Board position (pieces advanced toward enemy)
  score += advancementScore(state, AI_PLAYER) * 3;

  return score;
}
```

**Heuristic Scoring**:
```typescript
const scoreMove = (state: GameState, move: TurnAction): number => {
  let score = Math.random() * 5;

  if (move.type === 'capture') {
    const capturedValue = move.capturedPiece?.value || 0;
    score += capturedValue * 30;

    if (move.capturedPiece?.data?.isCaptain) score += 10000; // WIN!
  }

  // Energy efficiency (prefer moves that use available energy)
  const cost = gameRules.calculateActionCost!(state, move);
  const piece = getPieceAt(state, move.from!);
  const pieceEnergy = (piece?.value || 0) + getDiceTotal(state);
  score += (pieceEnergy - cost) * 2; // Bonus for efficient moves

  // Threaten captain
  if (threatsensCaptain(state, move)) score += 150;

  return score;
}
```

**Special Considerations**:
- Dice rolls add randomness (need to handle probabilistic outcomes)
- Energy system (dice + piece value) affects move options
- Captain detection (randomly assigned at start)
- Piece values vary (2-4)

---

### SPTTT (Super Jogo da Velha)

**Win Condition**:
- Line mode: Win 3 small boards in a row
- Majority mode: Win most small boards

**Evaluation Function**:
```typescript
const evaluatePosition = (state: SPTTTState): number => {
  let score = 0;

  // Boards won
  const myBoards = winners.filter(w => w === AI_PLAYER).length;
  const oppBoards = winners.filter(w => w === HUMAN_PLAYER).length;
  score += (myBoards - oppBoards) * 100;

  // Winning threats (2 in a row on big board)
  score += countBigBoardThreats(state, AI_PLAYER) * 50;
  score -= countBigBoardThreats(state, HUMAN_PLAYER) * 50;

  // Small board control (cells won in active boards)
  score += cellAdvantage(state, AI_PLAYER) * 5;

  // Center board control (board 4 is strategically important)
  if (winners[4] === AI_PLAYER) score += 30;
  if (winners[4] === HUMAN_PLAYER) score -= 30;

  // Corner boards
  const corners = [0, 2, 6, 8];
  corners.forEach(c => {
    if (winners[c] === AI_PLAYER) score += 15;
    if (winners[c] === HUMAN_PLAYER) score -= 15;
  });

  return score;
}
```

**Heuristic Scoring**:
```typescript
const scoreMove = (state: SPTTTState, move: Move): number => {
  let score = Math.random() * 5;

  // Does this win a small board?
  if (winsSmallBoard(state, move)) score += 200;

  // Does this win the game?
  if (winsGame(state, move)) score += 10000;

  // Block opponent from winning small board
  if (blocksSmallBoardWin(state, move)) score += 150;

  // Block opponent from winning game
  if (blocksGameWin(state, move)) score += 5000;

  // Center square of small board
  if (move.cellIndex === 4) score += 20;

  // Sends opponent to good/bad board
  const nextBoard = move.cellIndex;
  if (winners[nextBoard] !== null) score += 30; // Send to won board = good
  if (hasWinningMove(state, HUMAN_PLAYER, nextBoard)) score -= 40; // Send to dangerous board = bad

  return score;
}
```

**Special Considerations**:
- Different architecture (not using base game engine)
- Need to create `getAvailableActions()` helper
- Two win conditions (line vs majority)
- Strategic depth (sending opponent to specific boards)
- Minimax very effective here (finite game tree)

---

## UI/UX Integration

### Game Setup Flow

1. **Mode Selection Screen** (before game starts):
   ```
   ┌─────────────────────────────┐
   │   Escolha o Modo de Jogo    │
   ├─────────────────────────────┤
   │  [  Dois Jogadores  ]       │
   │  [ Jogar contra o Bot ]     │
   └─────────────────────────────┘
   ```

2. **Difficulty Selection** (if bot mode chosen):
   ```
   ┌─────────────────────────────┐
   │   Escolha a Dificuldade     │
   ├─────────────────────────────┤
   │  [ Fácil - Iniciante ]      │
   │  [ Médio - Aprendiz ]       │
   │  [ Difícil - Desafiador ]   │
   │  [ Muito Difícil - Expert ] │
   │  [ Impossível - Bruno ]     │ (hidden by default)
   └─────────────────────────────┘
   ```

### Game Loop Integration

```typescript
// In baseGamePage.tsx or game component

const [gameMode, setGameMode] = useState<'pvp' | 'ai'>('pvp');
const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>(2);

useEffect(() => {
  // After player move, check if AI should move
  if (gameMode === 'ai' && currentPlayer === 1 && !gameOver) {
    // Add slight delay for better UX
    setTimeout(() => {
      makeAIMove();
    }, 500); // 500ms thinking time
  }
}, [currentPlayer, gameMode, gameOver]);

const makeAIMove = () => {
  const aiMove = getAIMove(gameState, aiDifficulty);

  // Execute the move through normal game engine
  gameEngine.executeAction(gameState, aiMove);

  // Update UI
  setGameState({...gameState});
}
```

### Visual Feedback

- Show "Bot pensando..." message during delay
- Highlight AI's move briefly after execution
- Optional: Show thinking animation

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
**Goal**: Get Level 1 & 2 working for one game

- [x] Choose first game (recommend SPTTT - simplest rules)
- [ ] Create `aiPlayer.ts` module
- [ ] Implement `getRandomMove()` (Level 1)
- [ ] Implement `getHeuristicMove()` (Level 2)
- [ ] Add mode selection UI
- [ ] Integrate AI into game loop
- [ ] Test and tune heuristics

**Deliverable**: Playable AI opponent with 2 difficulty levels

---

### Phase 2: Advanced AI (Week 2)
**Goal**: Implement Levels 3 & 4

- [ ] Implement `evaluatePosition()` function
- [ ] Implement `getLookaheadMove()` (Level 3)
- [ ] Implement minimax algorithm
- [ ] Implement alpha-beta pruning
- [ ] Add `getMinimaxMove()` (Level 4)
- [ ] Performance testing and optimization
- [ ] Tune evaluation weights

**Deliverable**: Strong AI that provides genuine challenge

---

### Phase 3: Replication (Week 3)
**Goal**: Port AI to remaining games

- [ ] Adapt AI for CrownChase
  - [ ] Write evaluation function
  - [ ] Write heuristic scoring
  - [ ] Handle king mechanics
- [ ] Adapt AI for MathWar
  - [ ] Write evaluation function
  - [ ] Handle dice/energy system
  - [ ] Handle captain detection
- [ ] Cross-game testing

**Deliverable**: All three games have AI opponents

---

### Phase 4: Polish (Week 4)
**Goal**: UX improvements and balancing

- [ ] Add difficulty descriptions
- [ ] Add AI "thinking" animations
- [ ] Tune difficulty levels based on playtesting
- [ ] Add option to hide/show Level 5 (Impossível)
- [ ] Add statistics tracking (win rate per difficulty)
- [ ] Mobile/tablet optimization for mode selection
- [ ] Portuguese translations for all UI text

**Deliverable**: Production-ready AI system

---

## Testing & Balancing

### Per Difficulty Level

**Level 1 (Fácil)**:
- [ ] Beginner (8-9 years old) should win 80%+ of games
- [ ] Moves should feel random but legal
- [ ] Should occasionally make "good" moves by chance

**Level 2 (Médio)**:
- [ ] Average player (10-11 years) should win 60-70% of games
- [ ] Should make obvious good moves (captures, blocks)
- [ ] Should not make intentionally bad moves

**Level 3 (Difícil)**:
- [ ] Experienced player (12-13 years) should win 30-50% of games
- [ ] Should rarely miss obvious threats
- [ ] Should punish bad moves

**Level 4 (Muito Difícil)**:
- [ ] Strong player should win 10-30% of games
- [ ] Should play strategically, not just tactically
- [ ] Should require careful planning to beat

**Level 5 (Impossível)**:
- [ ] Bruno should find it challenging
- [ ] Should feel "smart" and forward-thinking
- [ ] Acceptable if nearly unbeatable

---

## Performance Considerations

### Browser Performance

**Minimax depth limits:**
- SPTTT: Can handle depth 4-5 (smaller state space)
- CrownChase: Depth 3-4 recommended
- MathWar: Depth 2-3 (larger branching factor)

**Optimization strategies:**
- Alpha-beta pruning (essential for depth >2)
- Move ordering (try captures first)
- Transposition tables (cache evaluated positions)
- Iterative deepening (for time management)

**Target performance:**
- Levels 1-2: <100ms per move
- Level 3: <300ms per move
- Level 4: <1000ms per move
- Level 5: <3000ms per move

### Old Computer Compatibility

Test on:
- Low-end laptops
- Tablets (school computer labs often use tablets)
- Chrome on Windows 7 (old school computers)

---

## Future Enhancements (Post-MVP)

### Potential Additions:
- [ ] Undo move against AI
- [ ] Show AI's "thinking" (what it's considering)
- [ ] Hint system (ask AI for suggested move)
- [ ] Replay AI games
- [ ] AI personality (names, avatars, taunts)
- [ ] Adaptive difficulty (AI adjusts to player skill)
- [ ] Training mode (AI explains its moves)
- [ ] Tournament mode (play against multiple AI difficulties)

### Advanced AI Features:
- [ ] Opening book (pre-computed good starts)
- [ ] Endgame tablebase (perfect endgame play)
- [ ] Monte Carlo Tree Search (alternative to minimax)
- [ ] Neural network evaluation (if we ever have training data)

---

## Resources & References

### Algorithms:
- **Minimax**: https://en.wikipedia.org/wiki/Minimax
- **Alpha-Beta Pruning**: https://en.wikipedia.org/wiki/Alpha%E2%80%93beta_pruning
- **Game Tree Search**: https://www.chessprogramming.org/Search

### Tutorials:
- Building Tic-Tac-Toe AI: https://www.neverstopbuilding.com/blog/minimax
- Chess Programming Wiki: https://www.chessprogramming.org/
- Introduction to Game AI: https://www.gamedev.net/tutorials/programming/artificial-intelligence/

### Code Examples:
- JavaScript minimax: https://github.com/Zffu/Tic-Tac-Toe-Minimax
- Ultimate Tic-Tac-Toe AI: https://github.com/davidmccreight/ultimate-tictactoe-AI

---

## Questions & Decisions Needed

### Before Starting:
1. **Which game to implement first?**
   - Recommendation: SPTTT (simplest, most strategic)
   - Alternative: CrownChase (uses base game engine)

2. **Should Level 5 be hidden by default?**
   - Recommendation: Yes, add secret unlock (triple-click on difficulty screen?)

3. **Should we track win/loss statistics?**
   - Could show "You've beaten Medium difficulty 3 times!"
   - Store in localStorage

4. **Portuguese names for difficulties?**
   - Fácil / Médio / Difícil / Muito Difícil / Impossível
   - Or: Iniciante / Aprendiz / Avançado / Expert / Mestre

5. **Mobile considerations?**
   - AI delay might need to be longer on mobile
   - Minimax depth might need to be reduced

---

## Success Criteria

### Must Have (MVP):
- ✅ AI works for all 3 games
- ✅ 4 difficulty levels functional
- ✅ Level 1-2 beatable by target age group
- ✅ Level 3-4 provide genuine challenge
- ✅ No performance issues on target devices
- ✅ Mode selection UI clear and simple
- ✅ All text in Portuguese

### Nice to Have:
- AI "thinking" animation
- Win/loss statistics
- Difficulty descriptions/recommendations
- Level 5 (Impossível) mode

### Success Metrics:
- Students can beat Level 1 (80%+ win rate)
- Level 2 provides learning challenge (50-70% win rate)
- Teachers report students engaged with AI mode
- No complaints about AI being "too hard" or "too easy"
- Bruno finds Level 4-5 challenging

---

## Notes

- This is a **traditional game AI** approach, not machine learning
- No training data needed - all logic is hand-coded
- Perfect for educational games with clear rules
- Easy to tune and debug
- Runs entirely client-side (no servers needed)
- Aligns with project values (free, offline, performant)

---

**Last Updated**: 2026-01-06
**Status**: Planning phase
**Owner**: Bruno
**Priority**: Medium-term (post-MVP mobile responsive fixes)
