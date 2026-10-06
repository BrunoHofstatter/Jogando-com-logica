# Caça Coroa - Playable Tutorial Design

## Status and Scope

Updated October 5, 2026. The user-approved redesign is implemented locally as seven short practice stages. This replaces the September continuous-match storyboard. Learning effectiveness and duration have not been validated with children.

The tutorial teaches Ninja movement and capture, Saltador steps and jumps, preservation of jumped pieces, stationary kings, the Saltador's capture restriction, and the consequence of losing a king. It does not teach every rule, turn alternation, strategy, capture counters, difficulty unlocking, skipped turns, or draws. Full rules remain available separately.

## Current Implementation

- The isolated route is `/caca-coroa/tutorial`. First-entry gates wrap local, AI, and online lobby entry before those components mount. Existing online rooms bypass onboarding; direct tutorial entry with an active room returns to the lobby.
- Shared lifecycle/history lives in `src/Shared/Tutorial/`; fixtures, rules integration, controller, pointers, and navigation are in `src/CrownChase/Tutorial/`. The page is `src/CrownChase/Pages/tutorialPage.tsx`.
- Use the original Crown Chase Board, purple outer frame, piece renderer, and green legal-move markers. Remove tutorial-added solid/dashed piece rings. Internal `killer` remains unchanged; visible Crown Chase text and accessible labels say `Ninja`.
- Exercises start automatically with the blue piece selected. No introductory start button, permanent instruction panel, numeric progress bar, or stage Back button.
- These are separate practice fixtures, not a miniature competitive match. Supporting red pieces are placed deterministically after blue actions. No opponent AI or invented turn sequence is needed.
- Only tutorial state is mutated. Normal AI, online actions, match analytics, difficulty progression, and ordinary victory screens never mount for this route.
- Refresh starts from stage 1. Return context is validated in router history state, with session-storage backup scoped to the entry. Invalid context returns to the rules menu; permitted AI difficulty is validated.
- Completion uses `crown-chase.core.v2`. The substantial redesign can auto-launch once under its new identity. Previous completion/dismissal history is preserved. Menu replay never erases history.
- Completion is recorded after the successful final king-capture visual. Skip records dismissal and returns to the validated destination. Navigation/unmount cancels without recording completion or dismissal. Normal play creates its own initial board.
- Crown Chase has no separate mode introductions yet. Caça Soma and shared Core V1 remain future work.

## Presentation

Center the board. Short pointing pop-ups alternate left/right in landscape and above/below in portrait. Pointers use measured board-cell and pop-up geometry and adapt to resize. `Tutorial` and `Pular` are grouped at top-left beside Back. A muted yellow-orange `Dica` button with a small lightbulb appears at top-right below Home when hints are available.

Instruction copy is Brazilian Portuguese. Pop-ups use a slightly lighter version of the game's button purple, white lettering with the game's purple WebKit stroke, and hard purple shadows. Highlight `qualquer direção` and the Saltador's `cima`, `baixo`, and `lados` in lighter red with a slightly lighter red stroke, 20% thinner than the previous inherited highlight stroke. Continue/play/repeat and toolbar buttons have hover, pressed, and keyboard-focus states. Centered retry feedback keeps plain text without a WebKit stroke. Do not add piece outlines or dashed target circles. Portuguese board labels identify type, owner, row, and column for keyboard/accessibility use.

Board, tile, token, padding, border, and gap dimensions inherit directly from normal Crown Chase styles. The tutorial does not override grid row/column sizes or impose a cell aspect ratio. Piece animation wrappers use `display: contents`, preserving the normal piece sizing parent; motion animates the token itself using the original cell pitch. Browser measurements matched original game board/tile dimensions in both portrait and landscape, including the original horizontally wider token proportions and standard selected-piece lift.

Important stage instructions stay visible while the child acts. The kings explanation has `Continuar`. The short post-jump observation lasts three visible seconds. Incorrect-attempt feedback appears with stronger hierarchy in the center of the board for two visible seconds, then disappears automatically. There is no retry confirmation button.

## Stage Sequence

Coordinates are internal zero-based `(row, col)`. Player 1 is blue; player 0 is red. Each exercise has `currentPlayer: 1`, isolated practice state, and no competitive opponent turn.

| Stage | Starting board and instruction | Advancement |
|---|---|---|
| 1: Ninja movement | Only blue Ninja at (2,2), selected. `Ninja` / `Anda uma casa em qualquer direção.` Pointer to Ninja; eight normal legal markers. | Any legal one-square move. |
| 2: Ninja capture | Keep the moved blue Ninja. Spawn red Ninja preferably one square diagonally up-right; deterministic in-bounds fallback directions. `Capture o Ninja vermelho.` Pointer to red Ninja. | Capture red Ninja using the real game rules. Other legal moves keep the exercise and reposition the supporting red Ninja adjacent to blue. |
| 3: Saltador movement | Fresh board with only blue Saltador at (2,2), selected. `Anda uma casa para cima, para baixo ou para os lados.` Pointer to Saltador; four legal markers. | Any legal one-square orthogonal move. |
| 4: Jumping | Keep moved blue Saltador. Spawn red Saltador adjacent, preferring right, then up/down/left, with an in-bounds landing beyond it. `Pule por cima da peça.` | Legal jump over the supporting piece. Alternate legal steps retain the exercise and reposition support. After success, keep both pieces visible; point to red piece with `Depois do salto` / `A peça pulada fica no tabuleiro.` for three visible seconds. |
| 5: Kings | Fresh board with blue king (4,0) and red king (0,4). `Rei` / `O rei não se move.` Pointers to both kings; move input locked. | `Continuar`. |
| 6: King capture | Blue king (4,0), red king (0,4), red Ninja (0,3), selected blue Saltador (0,2). Primary pop-up points to red king: `O Saltador só captura o rei.` Secondary points to blue king: `Se capturarem seu rei, você perde.` | Jump from (0,2) over the Ninja to (0,4), capturing only the king. The Ninja remains. |
| 7: Ready to play | Show the complete normal `createInitialState()` board. `Agora é sua vez de jogar Caça Coroa!` | `Jogar` and `Repetir tutorial`. Play opens the intended mode, or mode selection at the menu for direct/menu replay. No automatic navigation. |

Supporting-piece placement is game-owned practice setup. It preserves a legal opportunity at every blue board position, including edges. Repeated alternate moves never skip an objective and do not require an AI.

## Attempts, Guidance, and Restoration

- All player intents are validated with the production v2 rules. Tutorial input interception happens before the normal board filters illegal destinations.
- Stages 1/3 accept every legal move available in their fixtures. Stages 2/4 require capture/jump respectively but let alternate legal moves remain on the board. Supporting pieces relocate with a brief appearance animation.
- Stage 6 previews a different legal move, locks input, and shows `Tente capturar o rei vermelho.` centered over the board for two visible seconds. The message disappears; the Saltador animates back to the exact fixture and is reselected. No fabricated loss, opponent capture, or button acknowledgement.
- Illegal moves never mutate the board or pretend to capture anything. Show a short relevant rule in the same temporary central feedback treatment, then automatically restore input and selection.
- Neutral deselection and empty taps without selection do not count as attempts. Enemy/king selection can explain ownership or immobility without increasing the mistake count.
- After two meaningful unsuccessful attempts, color the legal objective destination gold/orange; other legal destinations remain green. After three, add a move arrow and `Pule até a casa dourada.` or `Vá até a casa dourada.` The objective never auto-completes. `Dica` can reveal the same guidance.
- Attempt counts/guidance remain within an exercise; a new exercise resets them. Input cannot enqueue another action during feedback, movement, spawn, observation, or return animation. Skip and navigation remain usable.
- Every delayed callback belongs to the current session/stage activation and is cancelled on skip, replay, navigation, or unmount.
- Shared waits pause while the document is hidden and resume with their remaining duration. Reduced motion removes movement/spawn/return delays and CSS motion, retaining two-second feedback and three-second observation reading time.
- Movement/return waits are 350 ms and support appearance is 300 ms. Progress does not depend on receiving an animation-end event.

## Verification and Remaining Validation

Code checks: 52 passing tests across seven targeted shared tutorial/Crown Chase suites, production build, and targeted ESLint. Coverage includes all eight initial Ninja choices crossed with all four initial Saltador choices; support placement on every board square; repeated alternate moves without skipping; illegal feedback; final automatic rollback; gold guidance; visible-time pauses; stale/double input; skip/replay/cancellation; blocked storage; validated return context; keyboard/focus; and existing rules/AI/orientation regressions.

The user explicitly authorized browser verification for this redesign. Browser checks at 390×844 and 1024×768 covered responsive pop-ups, original frame/piece appearance, full interaction, centered feedback with automatic return, gold guidance, post-jump observation, completion, and replay. A global paragraph font override was found and corrected. No browser console errors were reported. This is visual verification, not classroom or real-device pedagogical validation.

Remaining product validation: test the short copy, timed observation/feedback, pointer clarity, and hint escalation with children. No implementation decision is blocked on that later validation.

The later visual refinement reran 14 rendered tutorial interaction checks and five existing board-orientation regressions, plus production build and targeted lint. Browser measurements matched normal-game board/tile sizes at 1280×720 and 390×844; the phone completion view fit without scroll overflow. Full exercise completion and replay remained functional, with no reported browser console errors.
