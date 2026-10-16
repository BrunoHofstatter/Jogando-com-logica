# Guerra Matemática

Current reference checked against source on October 12, 2026; playable tutorial updated October 14. Use this for rules, balancing, AI, rendering, and online work. The [superseded reference](../archive/math-war-legacy-reference.md) preserves the older mutable-engine description and suspected bugs; those are not current findings.

## Game summary

Guerra Matemática is a strategy board game inspired by chess, with arithmetic energy determining affordable movement and capture. Each piece has a permanent value. Two dice provide a shared total for three turns; a chosen piece's value plus that total determines its energy. Capture the opposing Captain to win.

## Current modes

- Local two-player mode.
- Computer opponent with four visible difficulties: Muito Fácil, Fácil, Médio, Difícil. Winning unlocks subsequent difficulties through browser-local progress.
- Server-authoritative online 1v1, with private room codes, temporary classroom discovery, and rematches. The namespace is `/math-war`.
- A dedicated [playable tutorial](../tutorials/math-war.md) teaches movement, energy, capture, dice cadence, and Captains. It replaces the old local/AI explanation overlays and gates first entry to local/AI/online lobby before their pages mount.

Current local, AI, and online rules come from `src/MathWar/Logic/v2/`. The public modes do not use the old `AA_baseGame` engine or removed Math War `gameConfig.ts`/`gameRules.ts` files.

## Core rules

### Board and pieces

- Board: 8×8.
- Ten pieces per player: eight orthogonal `sum` pieces and two diagonal `sumDiag` pieces.
- Each player's values are shuffled from four `+2`, three `+3`, and three `+4` pieces. Values remain fixed throughout a match.
- One back-row piece is randomly chosen as that player's Captain. It can be either movement type.

Teacher-facing names are Soma Redonda (orthogonal) and Soma Quadrada (diagonal). The Captain marker identifies the piece whose capture ends the game.

### Turns and dice

Players alternate, moving one piece per turn. Dice are rolled at initialization and after each third completed non-winning move, so the new pair applies at the start of turns 1, 4, 7, and so on. Both dice have five sides; their total ranges from 2 to 10. The total is shared until the next roll.

Local play starts with player `0` (red). AI play starts with player `1` (blue/human); AI is player `0`. The online adapter also initializes player `1` first. Starting-player behavior intentionally differs between local and the other two modes in current source.

### Energy and movement

Available energy is `piece value + dice total`. It is calculated for the selected piece, not held in a shared pool or permanently stored as remaining energy.

- Moving costs 2 energy per square.
- Capturing adds 2 energy to the movement cost.
- Captain movement/capture doubles the entire resulting cost.
- Orthogonal pieces move horizontally or vertically; diagonal pieces move diagonally.
- Pieces cannot jump through occupied squares or land on allies.
- An affordable move onto an enemy captures it.
- Capturing a Captain ends the game immediately.

The v2 API has no pass or automatic draw action for a side without legal moves. Do not assume Caça Coroa's automatic skip/draw rules also apply here.

## Current implementation

| Source | Responsibility |
|---|---|
| `src/MathWar/Logic/v2/mathWar.ts` | Board constants, shuffled setup, Captain assignment, dice, move evaluation/costs, legal actions, state transitions, and victory |
| `src/MathWar/Logic/v2/types.ts` | Serializable state, intents, actions, costs, and events |
| `src/MathWar/Logic/v2/ai.ts` | AI choice over real legal actions, by difficulty |
| `src/MathWar/Logic/v2/mathWar.test.ts` | Rules and state-transition checks |
| `src/MathWar/Components/board-component.tsx` | Selection, legal/energy feedback, move rendering, local/remote interaction, and results |
| `src/MathWar/Components/piece.tsx` | Piece shape/value and Captain presentation |
| `src/MathWar/Components/DiceAnimation.tsx` | Local/AI dice reveal |
| `src/MathWar/Pages/regrasPage.tsx` | Mode selection, difficulty lock, rules, and progress reset |
| `src/MathWar/Pages/baseGamePage.tsx` | Local state, dice animation, and activity analytics |
| `src/MathWar/Pages/aiGamePage.tsx` | AI turn loop, human-first setup, unlocks, and activity analytics |
| `src/MathWar/Pages/tutorialPage.tsx` and `src/MathWar/Tutorial/` | Isolated practice lesson, controlled fixtures, cost labels, local history, entry gate, and validated return |
| `src/MathWar/Pages/multiplayerLobbyPage.tsx` | Private/classroom room entry |
| `src/MathWar/Pages/multiplayerGamePage.tsx` | Authoritative match view, leave confirmation, and rematch controls |
| `src/MathWar/Hooks/useMathWarMultiplayer.ts` | Socket/session state, intents, classroom listing, and join/disconnect telemetry |
| `src/MathWar/Logic/multiplayer/protocol.ts` | Shared socket payload contract |
| `multiplayer-server/src/mathWar/mathWarAdapter.ts` | Calls the same v2 initial-state, resolution, and apply functions |
| `multiplayer-server/src/sockets/registerMathWarRoomHandlers.ts` | Server room lifecycle, turn enforcement, and broadcasts |

### Rule API and board ownership

`createInitialState` prepares the setup and opening dice. `evaluateMove` and `calculateMoveCost` describe legality and affordability without mutating state. `resolveMoveIntent` resolves `{ from, to }`; `applyAction` revalidates and returns cloned next state plus events. Optional RNG/dice inputs support controlled rule checks.

In local/AI mode the page owns state and the Board applies real actions. In remote mode the Board emits move intents and waits for server state. The server owns dice, accepted actions, and the result; client predictions are not authoritative. See [multiplayer.md](../systems/multiplayer.md) and [classrooms.md](../systems/classrooms.md).

There is no current generic Roll Dice button/config fallback. The old `2d4` config versus `2d5` hook mismatch and the `remainingEnergy = 9999` workaround belong only to the archived reference, not the v2 implementation.

### AI and progression

- Difficulty 1 chooses a random legal action.
- Difficulty 2 prefers captures, particularly Captain capture, with movement preferences when no capture exists.
- Difficulties 3–4 evaluate moves with threat awareness and increasingly strong Captain-safety/tactical heuristics.
- Human victory unlocks the next difficulty through `src/Shared/Hooks/useDifficultyLock.ts`.
- The menu's normal play button enforces the selected difficulty lock. Tutorial automatic return validates difficulty against unlocked progress; explicit menu replay returns to the menu without resetting completion history or unlocking difficulties.

### Analytics

Local/AI attempts use the shared foreground lifecycle. Their pages mount after onboarding; attempts start after the opening dice animation and finish at rules-based ending or abandonment. Tutorial practice does not emit normal-match start/end events or unlock difficulties. Online join/disconnect reliability is instrumented; canonical online match start/end analytics remain deferred. See [analytics.md](../systems/analytics.md).

## Educational and classroom context

Best current grade recommendation is around 6th–7th grade, with support and suitability varying by group. The activity can practice mental calculation, strategic planning, comparison of costs/resources, and anticipating consequences. These are intended uses, not measured outcomes or formal BNCC certification.

Possible settings include pairs, an advanced strategy station, teacher-guided play, or individual AI practice. The teacher reference estimates around 10–30 minutes per match; actual duration and grade fit require observation.

Potential confusion includes energy belonging to one chosen piece, cost scaling with distance, capture's extra cost, a shared dice total lasting three turns, and the Captain's double-cost rule. These are product hypotheses to assess with players, not newly verified usability failures.

## Limits and future discussion

- Online refresh reconnection is not implemented; normal leave/disconnect/rematch behavior follows the shared server contract.
- Grade fit, game length, balance, and explanation clarity are not established by code checks.
- Consider stronger or more distinct AI behavior, clearer Captain/energy feedback, and whether starting-player behavior should be uniform.
- The Captain's double-cost rule and progression-lock strictness remain possible design discussions, not approved changes.
- More rule-menu/mode-selection analytics could be considered for a concrete reporting need; existing activity and reliability tracking should not be described as entirely future work.

The October 12 documentation refresh used source inspection and reference checks. The October 14 tutorial implementation and its technical verification are documented in [the tutorial reference](../tutorials/math-war.md); there is no classroom-validation claim.
