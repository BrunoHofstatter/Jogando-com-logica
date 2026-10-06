# Crown Chase: implemented playable tutorial

Current reference for Caça Coroa's playable lesson, consolidated October 6, 2026. This is the implemented seven-stage lesson, not the superseded continuous-match storyboard.

Read [overview.md](overview.md) for shared philosophy and [technical-contract.md](technical-contract.md) for the shared APIs. This document records Crown Chase-specific decisions; its sequence, copy, timing, colors, and hint thresholds are not a specification for other games.

## Purpose and limits

Teach enough piece behavior and the king-capture objective to begin a match: Ninja movement/capture, Saltador steps/jumps, the fact that a jumped piece remains, stationary kings, the Saltador's capture restriction, and losing one's king.

The lesson does not explicitly teach turn alternation, strategies, capture counters, difficulty progression, skipped turns, draws, or every legal-move edge case. Detailed rules remain available. This is a controlled set of exercises; it is not a competitive match with an opponent making turns.

Implementation and visual behavior have verification records. Learning effectiveness, lesson duration, and reading-time suitability have not been validated with children.

## Why this sequence

**Movement before capture.** Begin with a single piece in the center so its available directions are clear. Preselection lets the child act immediately. Any legal first move is accepted: the concept is movement, not reproducing one prescribed square.

**A capture opportunity that follows the child.** Place the red Ninja relative to the accepted move. Later alternate legal moves can remain visible while the supporting Ninja relocates. This keeps the practice goal achievable without teaching that other legal destinations are forbidden.

**Separate the Saltador's step and jump.** A fresh single-piece exercise introduces orthogonal movement before adding another piece. A jump then exposes the middle square and landing separately. Holding the result briefly makes the preserved piece observable without a long explanation.

**Explain kings in context.** Show both kings at their real corner positions and pause for Continue. The final fixture lets the Saltador jump over a Ninja to capture a king: the action shows the difference between jumping over an ordinary piece and capturing the landing king. A second short instruction explains the consequence for the child's own king.

**Correct the final attempt without inventing a loss.** Preview a legal alternative, attract attention with a temporary central reminder, and return the Saltador automatically. The current lesson does not simulate an enemy capturing the child's king or require a Try again acknowledgement.

**Finish with the real starting position.** The complete normal board connects the simplified practice to normal play. The child chooses play or replay; the lesson does not navigate automatically.

## Stage sequence

Coordinates are internal zero-based `(row, col)`, from top-left. They are not shown in the child-facing copy. Player 1 is blue; player 0 is red.

| Stage | Board and child-facing copy | Advancement |
|---|---|---|
| 1: Ninja movement | Only selected blue Ninja at (2,2). Title `Ninja`; `Anda uma casa em qualquer direção.` Pointer to the piece and eight ordinary legal markers. | Any legal one-square move. |
| 2: Ninja capture | Keep blue Ninja at its new square; place a red Ninja adjacent. `Capture o Ninja vermelho.` Pointer to red Ninja. | Capture the red Ninja. Alternate legal moves retain this exercise and reposition support. |
| 3: Saltador movement | Fresh board with selected blue Saltador at (2,2). Title `Saltador`; `Anda uma casa para cima, para baixo ou para os lados.` Four ordinary legal markers. | Any legal one-square orthogonal move. |
| 4: Jumping | Keep blue Saltador at its new square; place red Saltador adjacent with a valid landing beyond. `Pule por cima da peça.` | Jump over it. Hold both pieces with `Depois do salto` / `A peça pulada fica no tabuleiro.` for three visible seconds, then advance. |
| 5: Kings | Fresh board: blue king (4,0), red king (0,4). Title `Rei`; `O rei não se move.` Pointers to both kings; movement locked. | `Continuar`. |
| 6: King capture | Blue king (4,0), red king (0,4), red Ninja (0,3), selected blue Saltador (0,2). Primary: `O Saltador só captura o rei.` Secondary: `Se capturarem seu rei, você perde.` | Jump (0,2) → (0,4), over Ninja, capturing the red king. Ninja remains. |
| 7: Ready to play | Complete normal `createInitialState()` board. `Agora é sua vez de jogar Caça Coroa!` | `Jogar` or `Repetir tutorial`. |

Action stages have one automatically selected movable blue piece when input becomes active. Selecting it again can deselect it, as in normal play. Selection/destination also works through focusable board cells with Enter/Space and Portuguese labels identifying type, ownership, row, and column.

## Deterministic supporting pieces

Stage 2 prefers a red Ninja one square up-right from blue. In-bounds fallback order is down-right, up-left, down-left, right, up, down, left.

Stage 4 prefers a red Saltador to the right, then up, down, left. Both its adjacent square and the square beyond it must be in bounds. This preserves a legal jump opportunity at every blue board position, including edges.

This is exercise setup, not a red turn or competitive AI. Setup retains the blue position and relevant counters, reconstructs the two-piece fixture, and sets the practice player to blue. Player move legality still comes from the production v2 rules.

Advancing from Ninja capture to Saltador movement and from the jump observation to kings prepares explicit new exercises. No unverified opponent sequence connects them.

## Attempts and guidance

| Input | Current response |
|---|---|
| Accepted legal action | Apply the real action and advance through the relevant visual/observation condition. |
| Alternate legal action in stages 2/4 | Keep the moved blue piece; reposition red support after movement; retain the objective. No rollback or automatic skipping. |
| Alternate legal action in stage 6 | Preview the move; show `Tente capturar o rei vermelho.` centrally for two visible seconds; remove it and animate return to the exact fixture; reselect blue. |
| Illegal action | Leave the board unchanged; briefly explain the relevant rule centrally; automatically restore active input and selection. |
| Enemy/king selection without a move | Can explain ownership or immobility without increasing the unsuccessful-attempt count. |
| Same-piece deselection or empty tap without selection | Neutral; no unsuccessful-attempt count or progression. |
| Input during movement, feedback, spawn, observation, or return | Locked; does not enqueue another move. Skip and navigation remain available. |

Move legality and exercise acceptance are evaluated separately. A legal alternative is not presented as violating a movement rule. Illegal feedback can explain Ninja's one-square limit, a stationary king, own occupancy, Saltador's direction/distance, missing jump support, or its capture restriction.

In objective exercises 2/4/6, two meaningful unsuccessful attempts reveal a gold/orange legal destination. Three add an arrow and `Pule até a casa dourada.` or `Vá até a casa dourada.`. Other legal destinations remain green. Dica can reveal the destination and then the stronger guidance. No hint executes the action.

Counts/guidance remain within the exercise and reset on a new one. There is no inactivity timer, attempt-limit auto-skip, fabricated penalty, or whole-lesson restart after a mistake.

## Reading, animation, and interruption

| Event | Current duration |
|---|---|
| Movement and automatic return | 350 ms controller wait; 300 ms token CSS animation. |
| Supporting-piece appearance | 300 ms. |
| Central feedback | Two visible seconds. |
| Post-jump observation | Three visible seconds. |
| Kings explanation | Manual Continue. |

Primary instructions stay visible while the child acts. Central feedback has stronger hierarchy and temporarily dims the surrounding instructional pop-ups/pointers.

The page maps document visibility to the shared session's pause state. Pending waits retain their remaining duration while hidden. Reduced motion removes cosmetic waits and practice animations but retains the observation and feedback reading durations. Progress does not depend on an animation-end event.

All pending callbacks belong to the current activation. Stage change, replay, skip, completion, and unmount invalidate them. Input locking is synchronous, preventing double actions before React renders.

## Visual treatment and transfer to normal play

Use the original Crown Chase Board and piece renderer, including its purple frame, padding, borders, gaps, tile shapes, token proportions, shadows, and green legal markers. Tutorial CSS does not replace row/column sizes or impose a cell aspect ratio. Animation wrappers use `display: contents` so the token keeps the normal sizing parent; motion uses the original cell pitch. There are no additional tutorial rings around red or blue pieces.

Internal piece type `killer` and its existing asset name remain unchanged. Visible Crown Chase text and accessible names say `Ninja`.

Short purple pointing pop-ups alternate sides in landscape and occupy above/below positions in portrait. Actual cell/pop-up geometry and resize observation keep pointers connected to their subjects. White text uses the game's purple WebKit outline and hard shadows. Lighter red emphasis distinguishes movement words and important rule phrases with an explicitly thinner red outline. Central feedback uses plain text without that stroke.

Top-left has `Tutorial` and `Pular`, beside platform Back. A muted yellow-orange lightbulb `Dica` button sits top-right below Home when available. Continue/play/repeat and toolbar buttons have hover, pressed, and focus states.

The normal HUD, diagnostic selected-piece text, difficulty display, capture totals, and ordinary victory controls are hidden. There is no start button, permanent instruction panel, numeric progress bar, or stage Back button.

These choices keep attention on a small action and preserve the familiar game appearance. They are game-owned presentation, not a shared tutorial theme.

## Entry, history, and return

- Route: `ROUTES.CROWN_CHASE_TUTORIAL`, currently `/caca-coroa/tutorial`.
- Local, AI, and online lobby first-entry gates run before those gameplay components mount. Existing online sessions bypass onboarding. Direct tutorial entry with an active room redirects to the lobby without replacing it.
- The rules/menu Tutorial button opens explicit replay. Old history is retained.
- Identity: `{ game: "crown-chase", scope: "core", version: 2 }`. This material redesign has a separate identity from the earlier playable version and legacy overlays. No separate mode introductions exist.
- Return context is validated in router history, with session-storage backup scoped to that history entry. AI difficulty is checked against unlocked progress. Direct/invalid context returns to the rules menu.
- Refresh begins again at stage 1; no partial exercise restoration.
- Completing the final legal king capture records completion after its visual wait. The full initial board is then shown. Tutorial capture does not count as a normal win or unlock.
- Pular records dismissal and returns immediately. Platform Back, browser navigation, and unmount cancel without recording dismissal/completion. Interrupted or skipped replay retains prior completion.
- Jogar opens the intended mode; direct/menu replay opens the rules menu's mode selection. Repetir tutorial restarts the whole lesson. Normal play initializes its own state.

The route never mounts normal AI, progression, room participation, or ordinary match-victory logic. Global page-view tracking still exists; no shared tutorial lifecycle analytics have been added.

## Source map

| Source | Responsibility |
|---|---|
| `src/CrownChase/Logic/v2/` | Production rules and initial normal state; authority for legal moves and king-capture victory. |
| `src/CrownChase/Tutorial/lesson.ts` | Identity, fixtures, support placement, objective discovery, rule-engine calls, and illegal feedback. |
| `src/CrownChase/Tutorial/CrownChaseTutorialController.ts` | Canonical/preview state, phases, locking, attempts, guidance, movement, waits, observation, completion, and replay. |
| `src/CrownChase/Pages/tutorialPage.tsx` | Instruction copy, composition, React lifecycle/visibility, keyboard focus, controls, and navigation. |
| `src/CrownChase/Tutorial/TutorialPointers.tsx` and `tutorial.module.css` | Pointer measurement and game-specific presentation. |
| `src/CrownChase/Components/board-component.tsx` | Optional practice adapter for raw intents, selection, gold targets, visuals, and board-local feedback; normal behavior remains the default. |
| `src/CrownChase/Tutorial/TutorialGate.tsx` and `navigation.ts` | Automatic entry, active-room bypass, validated return context, and storage fallback. |
| `src/App.tsx`, `src/routes.ts`, and `src/CrownChase/Pages/regrasPage.tsx` | Route wiring, platform controls, rotation-overlay exclusion, and explicit replay entry. |

Controller snapshots contain `stage`, `phase`, `board`, `feedback`, `guidance`, `attempts`, `revision`, `movement`, and `spawned`. Game-specific phases are `active`, `feedback`, `returning`, `moving`, `spawning`, `observation`, `kings`, `completed`, and `cancelled`. These are separate from the shared session's three phase values.

## Verification evidence and open validation

The October 5 implementation record reports 52 passing checks across seven shared tutorial/Crown Chase suites, production build, and targeted lint. The later visual refinement reran 14 rendered interaction checks and five orientation regressions. No new runtime checks are claimed by this documentation consolidation.

- `CrownChaseTutorialController.test.ts`: all eight Ninja initial choices crossed with all four Saltador initial choices; support legality on every board square; repeated alternatives without skipping; preview/return; illegal attempts; escalation; pause; cancellation; and replay.
- `TutorialInteractions.test.tsx`: actual Board interactions in StrictMode; preselection; feedback inside the board; automatic recovery; keyboard/focus; visible-time observation; guidance; route gates; and return behavior.
- Shared tests cover activation/history and blocked storage. Existing rules, AI, and orientation tests cover normal-game regressions.

Browser verification was explicitly authorized for this implementation. It covered phone/landscape layout, pointing pop-ups, full progression, centered recovery, guidance, completion, and replay. Measurements matched normal-game board/tile dimensions at 390×844 and 1280×720 after visual refinement; the phone completion view fit without scroll overflow. A global paragraph override and tutorial sizing wrappers were found and corrected. No browser console errors were reported.

Remaining learning validation concerns clarity of short copy, reading durations, hint escalation, pointer understanding, and transfer to a normal match. These are observations to make with children, not missing implementation branches.
