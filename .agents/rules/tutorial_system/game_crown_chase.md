# Caça Coroa - Playable Tutorial Design

## Status and Scope

Proposed complete storyboard, September 10, 2026. Planning only: no tutorial runtime or UI is implemented by this document. The overall plan's settled product direction applies; the concrete choices below are a reviewable design proposal, not previously approved product decisions. Learning effectiveness and duration have not been validated with children.

Teach enough to start a match through six player moves in one small, continuous practice match. Keep the normal 5-by-5 board, existing piece symbols, player 1/blue at the bottom-left, and both stationary kings in their normal corners. Use fewer pieces to reduce the initial reading and visual load. Target a few minutes, with no deadline.

The child learns selection/destination input, assassin movement and capture, alternating turns, jumper steps and jumps, the fact that jumped pieces remain, the jumper's capture restriction, and capturing the enemy king. Do not teach capture counters, difficulty unlocking, strategy, skipped turns, or draws here. These remain in detailed rules and future contextual help.

## Current Implementation Reality

- Rules and state: `src/CrownChase/Logic/v2/crownChase.ts` and `types.ts`. The shipped Crown Chase board is `src/CrownChase/Components/board-component.tsx`, not the generic `AA_baseGame` Board.
- `applyAction` resolves legality, capture, turn switching, and victory. Kings cannot move; assassins move one square in all eight directions; jumpers step orthogonally or jump exactly one occupied adjacent square orthogonally. Jumpers may land on an enemy king but never another enemy piece.
- Local and AI pages currently duplicate explanation-overlay steps and use `tutorial_crownchase_v1_completed`.
- The menu replay action currently clears old completion. The playable design will request replay without erasing history.
- The board currently commits only legal intents; invalid targets generally clear selection. It cannot yet report the attempts this storyboard needs.
- `interactionLocked` currently affects remote interaction only. Tutorial locking needs an explicit local integration change.
- AI is scheduled by the normal AI page, and normal victory can unlock difficulty. Neither may run for tutorial states.
- Online lobby initialization uses the multiplayer hook. A pre-room tutorial gate must be outside that mounted participation flow, not a board overlay inside a room.

## Proposed Entry, Persistence, and Exit

- One `crown-chase.core.v1` playable lesson shared across local, AI, and online entry. No separately persisted mode introductions for Crown Chase V0: the moves and goal do not change.
- Use an isolated tutorial page with a new route constant in `src/routes.ts`. Local/AI first entry gates before normal game components mount; online first entry gates before the lobby participation component mounts. Keep the intended destination and allowed AI difficulty in validated navigation context, surviving a tutorial refresh through session storage if available. Direct tutorial entry defaults to the rules/menu destination.
- Existing live/rejoining online sessions bypass automatic onboarding. Do not disconnect a room to start this lesson, and do not expose replay within a live match in V0.
- The existing menu `Tutorial` button launches replay explicitly, including on shared devices. Replay from the menu returns to that menu; automatic onboarding returns to the chosen mode after completion or skip.
- `Pular tutorial` is available throughout, including feedback and scripted replies. It stores dismissal, disposes of tutorial state, and returns to the destination. The platform Back control/browser navigation cancels without storing dismissal; do not add a second Back control.
- Refresh restarts from the first stage; no partial board restoration. A lost or invalid return context safely returns to the menu. Storage failure uses memory history for the current app session and never traps the player.
- Use a new playable identity: old overlay completion does not prove completion of these actions. Auto-launch the playable introduction once under its own history; minor copy fixes retain the same version.
- Completing all six moves records completion immediately after the final legal king capture. A previous completion survives an interrupted or skipped replay. Finishing the tutorial never unlocks AI levels, sends room actions, or records a normal-match win.
- Tutorial completion shows `Jogar` for automatic entry and `Voltar ao menu` for menu replay. Both also offer `Repetir tutorial`. Normal play starts from `createInitialState()`; the practice board never becomes the real match.

## Presentation and Interaction

- Reuse existing board and piece visuals. Place a compact instruction panel above the board on narrow screens and beside it where space permits; never cover actionable squares with a blocking spotlight.
- Always show `Treino`, `Você: azul`, and the current turn (`Sua vez` / `Vez do oponente`). Ownership also uses labels and piece outlines, so instructions do not depend only on color.
- Hide difficulty, capture totals, selected-piece diagnostic text, and ordinary victory controls during practice. No new artwork is needed. Keep Cherry Bomb One, fluid layout units, and base-prefixed assets.
- Tap/click a piece, then its destination. Selecting the same piece deselects it. Empty-board taps without selection do nothing. Support the same actions through focusable board cells with Enter/Space and Portuguese accessible labels identifying piece, owner, row, and column.
- Legal destination markers remain visible after selection, as in normal play. An exercise target has a distinct outlined ring; it is not the same marker as general legality. Invalid squares still receive attempts rather than becoming untappable.
- `Dica` is available on action stages. First use outlines the relevant piece; second use shows the exact target and a short arrow. After two meaningful unsuccessful attempts, expose the first hint automatically; do not auto-play the solution. Do not use inactivity timers.
- A success animation may finish automatically (roughly 300 ms, no dependency on precise duration). New rule text and error explanations always wait for a button or the next required action. Reduced motion updates positions instantly, retaining text and manual reading points.
- No stage Back button and no numeric progress bar in V0. Named lessons (`Assassino`, `Saltador`, `Capture o rei`) identify the current focus. Replay restarts the whole lesson.

## Canonical State Specification

Coordinates below are internal zero-based `(row, col)`, top to bottom and left to right. Do not show this notation to children. Identity names here are storyboard labels; engine pieces currently have only `type` and `owner`.

| Piece | Engine type / owner | Initial square |
|---|---|---|
| Blue king BK | king / 1 | (4,0) |
| Blue assassin BA | killer / 1 | (3,0) |
| Blue jumper BJ | jumper / 1 | (3,2) |
| Red king RK | king / 0 | (0,4) |
| Red assassin RA | killer / 0 | (1,4) |
| Red jumper RJ | jumper / 0 | (2,2) |
| Red jumper RS | jumper / 0 | (0,2) |

All other squares are empty. Initial state S0: `currentPlayer: 1`, `turnCount: 0`, `status: playing`, `winner: null`, `endReason: null`, `capturedByPlayer: [0,0]`. Selection and hint count start empty/zero.

Every subsequent state is the result of applying the following moves to the previous state with the v2 rules, without replacing pieces or overriding the turn. Preserve all fields returned by the engine.

| Player action | Required blue move | Red scripted reply | Next action state |
|---|---|---|---|
| 1 | BA (3,0) → (2,1) | RS (0,2) → (0,1) | S1, turnCount 2 |
| 2 | BA (2,1) → (2,2), captures RJ | RA (1,4) → (2,4) | S2, turnCount 4 |
| 3 | BJ (3,2) → (3,3) | RA (2,4) → (2,3) | S3, turnCount 6 |
| 4 | BJ (3,3) → (1,3), over RA (2,3) | RS (0,1) → (1,1) | S4, turnCount 8 |
| 5 | BJ (1,3) → (0,3) OR (1,4) | RA (2,3) → (2,4) | S5a or S5b, turnCount 10 |
| 6 | BJ from its S5 square → RK (0,4) | None: king captured | S6a or S6b, turnCount 11 |

At S1 counters remain `[0,0]`; S2 through S5 have `[0,1]`; S6 has `[0,2]`, `status: ended`, `winner: 1`, `endReason: king_captured`, and `currentPlayer: 1`. RA remains after action 4. Both action-5 branches are intentionally accepted and get the same legal reply. No randomized AI, skipped turns, invented time lapses, or new scenario fixtures are needed.

## Stage-by-Stage Storyboard

The general attempt rules below apply to every action stage, including restoration, irrelevant input, hints, and interruption. Canonical state names refer to the complete sequence above.

### 0. Enter the Practice Match

- Objective: recognize own pieces, the stationary king, and the goal.
- Start: S0, board visible and move input locked.
- Instruction: `Vamos treinar com poucas peças. Você joga com as azuis. Capture o rei vermelho para ganhar. Os reis não se movem.`
- Visual: outline the blue army, then keep both king symbols clearly identified with `Seu rei` and `Rei adversário` labels. No timed reading sequence.
- Actions: `Começar` or `Pular tutorial`; board taps do not mutate state.
- Advance: `Começar` enters action 1 with unchanged S0. No restoration or scripted bridge.

### 1. Move the Assassin

- Objective: select a piece and move one square, including diagonally.
- Start: S0. Outline BA and the empty target (2,1).
- Instruction: `O Assassino anda uma casa em qualquer direção, até na diagonal. Toque nele e depois na casa marcada.`
- Required: BA (3,0) → (2,1). Other blue pieces and destination attempts remain available for feedback.
- Relevant mistakes: a longer BA move gets `O Assassino anda só uma casa por vez.`; attempting BK movement gets `O rei fica parado. Use o Assassino.`; another legal move gets the legal-alternative response below.
- Success: hold the moved position and show `Você moveu uma peça. Agora é a vez do oponente.` with `Continuar`.
- Advance/bridge: on `Continuar`, animate RS (0,2) → (0,1) with input locked and the opponent-turn label. Finish in S1, show `Sua vez`, enter action 2. This manual reading point teaches turns once; later replies run directly after success animation.
- Wrong attempts restore S0, not the accepted position or S1.

### 2. Capture with the Assassin

- Objective: capture by moving onto an enemy; ordinary capture does not end the match.
- Start: S1. Outline RJ at (2,2), then BA when selected or hinted.
- Instruction: `O Assassino pode capturar qualquer peça inimiga. Capture o Saltador vermelho marcado.`
- Required: BA (2,1) → (2,2). Show BA occupying the target and RJ removed.
- Relevant mistakes: attempting a distant target uses the one-square explanation; selecting BJ to capture RJ uses `O Saltador só captura o rei. Nesta jogada, use o Assassino.`; choosing a legal empty square gets the legal-alternative response.
- Advance/bridge: after the capture animation, RA (1,4) → (2,4). Finish in S2 and enter action 3. The removed piece stays removed, and the match continues normally.
- Wrong attempts restore S1, including RJ and capture counters.

### 3. Step with the Jumper

- Objective: the jumper can move without jumping, but never diagonally.
- Start: S2. Outline BJ and the empty target (3,3).
- Instruction: `O Saltador anda uma casa para cima, para baixo ou para os lados. Leve-o até a casa marcada.`
- Required: BJ (3,2) → (3,3).
- Relevant mistakes: a diagonal attempt gets `O Saltador não anda na diagonal.`; a two-square attempt over an empty middle gets `Para saltar, precisa ter uma peça no meio.`; trying to land on BA at (2,2) gets the own-piece response below.
- Advance/bridge: after success, RA (2,4) → (2,3). Finish in S3; the approaching red assassin visibly creates the next jumping opportunity.
- Wrong attempts restore S2.

### 4. Jump over a Piece

- Objective: jump exactly one occupied square and leave that piece in place.
- Start: S3. Outline RA (2,3) and the empty landing square (1,3), with BJ selected only by the child.
- Instruction: `Pule a peça vermelha e caia na casa marcada. O Saltador pode pular uma peça de qualquer cor.`
- Required: BJ (3,3) → (1,3), over RA. Animate the path so the landing and middle squares remain distinct.
- Relevant mistakes: trying to land on RA gets `O Saltador só captura o rei. Pule esta peça e caia na casa vazia depois dela.`; diagonal/too-long attempts use the movement feedback below. Other legal moves get the legal-alternative response.
- Success: hold the board before the reply; outline the still-present RA. Text: `A peça pulada continua no tabuleiro. Saltar não captura essa peça.` Button: `Continuar`.
- Advance/bridge: `Continuar` runs RS (0,1) → (1,1), finishing in S4. Enter the final challenge.
- Wrong attempts restore S3, including RA; correct jumping never removes RA.

### 5. Approach the King

- Objective: use the jumper's movement to get ready to capture the king without copying a single prescribed destination.
- Start: S4. Outline RK only; no answer arrow or target square initially.
- Instruction: `O Saltador só captura o rei. Aproxime seu Saltador para capturar o rei vermelho na próxima jogada.`
- Accepted moves: BJ (1,3) → (0,3) or BJ (1,3) → (1,4). Either leaves a legal one-step capture on the next blue turn. These are two explicit authored branches, not unrestricted play.
- Relevant mistakes: direct diagonal capture of RK gets `O Saltador não anda na diagonal. Chegue ao lado do rei primeiro.`; moving another piece or moving BJ away uses `Essa jogada é permitida. Neste desafio, aproxime o Saltador do rei.`
- Hint 1 outlines BJ; hint 2 shows (0,3) as one possible answer. Keep (1,4) accepted even when the hint is visible.
- Advance/bridge: RA (2,3) → (2,4). Finish in the matching S5 branch. The same brief opponent-turn treatment runs before action 6.
- Wrong attempts restore S4. No whole-lesson restart or penalty.

### 6. Capture the King and Finish

- Objective: independently complete the win action.
- Start: S5a or S5b, depending on action 5.
- Instruction: `Agora capture o rei vermelho!`
- Required: BJ from its current square → (0,4). The child must select and move; no finish button substitutes for capture.
- Relevant mistakes: targeting an ordinary enemy piece gets the jumper capture restriction; another legal move gets `Essa jogada é permitida. Agora capture o rei com o Saltador.`
- Hint 1 outlines BJ; hint 2 outlines RK and the one-square capture path.
- Advance: only the successful v2 action ending with `king_captured` and winner 1 finishes the teaching sequence. Suppress the normal VictoryScreen and show tutorial success after the capture visual.
- Result: S6a or S6b. Text: `Você capturou o rei! Já pode começar uma partida.` Follow with `Na partida, cada lado começa com mais peças. As regras são as mesmas.` Buttons follow the entry/exit section; no automatic navigation or red reply.
- Wrong attempts restore the exact S5 branch, never move the jumper to the other branch.

## Attempt Classification, Feedback, and Restoration

Handle input before the board drops invalid destinations or permanently commits a move. The game integration, not the core runner, owns classification.

1. A required/accepted legal action executes with `applyAction` against the tutorial state and follows its stage's success flow.
2. A different legal action executes only on a temporary preview clone. Show `Essa jogada é permitida. Vamos tentar o objetivo marcado.` (or the stage's specific version), with `Tentar de novo`. Do not run an opponent reply or normal victory side effects. On acknowledgement restore the complete canonical stage state.
3. An illegal action never becomes a legal board state. A short attempted-path/target outline acknowledges it; no ghost capture or removal. Show a specific reason and `Tentar de novo`; acknowledgement clears selection and retains the canonical state.
4. Selecting an enemy without a selected blue piece shows `Essas peças são do oponente. Escolha uma peça azul.` without advancing. Selecting the own king shows `O rei não se move. Proteja-o e capture o rei adversário.` The next blue selection can replace this feedback. A selected piece then targeted at a different own piece is treated as reselection, preserving the normal control convention; show `Essa casa já tem uma peça sua.` and allow reselection without a rollback animation.
5. Same-square deselection and empty taps without a selected piece are neutral and do not count as failed attempts. Input during feedback resolution or opponent animation cannot enqueue moves; Skip and navigation remain usable.

Illegal feedback priority: stationary king; own occupied destination; wrong direction; wrong distance or missing jump middle; forbidden enemy landing. Stage-specific copy may replace the generic response when it explains the same rule more clearly.

Generic additional copy:

- Jumper diagonal: `O Saltador não anda nem pula na diagonal.`
- Jumper too far: `O Saltador anda uma casa ou pula uma peça e cai logo depois dela.`
- Empty jump middle: `Para saltar, precisa ter uma peça no meio.`
- Non-king enemy landing: `O Saltador só pode capturar o rei.`

Restoration includes board, turn, counters, outcome fields, selection, and pending visual effects. It retains stage-local mistake count/hint escalation. Advancing to a new action resets those hints. A late callback after retry, Skip, replay, navigation, or stage replacement must be ignored using the current activation identity. Reduced motion performs the same operations without waiting for an animation event that may never fire.

## Planned Implementation Boundary

- Game-owned isolated tutorial page/controller holds fixtures, accepted branches, copy, hints, preview state, and scripted replies. Mount it without normal AI, normal match analytics, difficulty progression, or room participation.
- Extend the Crown Chase board narrowly for optional attempt interception, tutorial presentation, and interaction locking. Observe raw selection/destination intent before legal filtering, retaining default normal-game behavior. Do not change movement rules or use remote mode as a tutorial shortcut.
- Reuse the existing piece renderer and board layout. Exact hook/prop names remain for Phase 4; do not finalize a universal stage schema from this document.
- The shared runner needs identity/version history, session/stage activation, once-only progression, cancellation, and completion/skip/replay. This storyboard needs action/manual/animation advancement; it does not justify building extra timer types or contextual lessons now.
- Reuse DynamicTutorial geometry only if needed during implementation; this layout does not require selector-based spotlights.

## Verification and Remaining Review

Design-time check performed September 10, 2026: executed both eleven-ply branches against the current v2 implementation using an in-memory TypeScript transpilation. Both passed legality, turn alternation, turn counts, capture counters, preservation of the jumped assassin, input-snapshot immutability, rejection of the direct diagonal jumper capture, and the final king-capture win. This verifies the authored sequence, not an implemented tutorial controller or its UI.

Code-level scenario verification must cover all eleven plies in both accepted branches, expected counters and winner, preserved jumped piece, representative illegal attempts, and restoration to the branch-specific snapshot. Integration verification must cover double input, skip during a reply, stale stage callbacks, storage failures, refresh fallback, and absence of normal AI/unlock/network effects. The existing production rule implementation remains authoritative.

No visual preview or browser verification is authorized by this design request. Exact responsive layout, focus handling, and motion still require verification during implementation under repository permissions.

Remaining product review: whether the six-move length is appropriate in practice, whether the two final approach choices are understandable, and whether children distinguish the exercise target ring from normal legal-move markers. These are validation questions, not missing branches in the storyboard. The short Caça Soma outline and first shared technical contract remain the next planning phases.
