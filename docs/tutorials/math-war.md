# Math War: implemented playable tutorial

Implemented October 14, 2026; presentation and progression refined October 22. This replaces Math War's legacy explanation overlays and uses the shared session/history without changing normal match rules. Read [overview.md](overview.md), [technical-contract.md](technical-contract.md), and the [game reference](../games/math-war.md) for context.

## Lesson sequence

All practice copy is Brazilian Portuguese. The normal 8×8 board and piece renderer are reused; the tutorial owns its green pop-ups, measured pointers, and practice presentation. Player 1 is blue.

| Stage | Situation and progression |
|---|---|
| 1: Round movement | One selected round blue piece at (3,3), value hidden. Exact legal destinations along the entire row/column to the board edge, no direction arrows. Hidden introductory dice provide enough energy; any legal move advances. |
| 2: Energy | Retain the accepted position, reveal +2, roll a fixed total of 4 in the center, then connect dice and piece value to `4 + 2 = 6`. Label and color-match the terms. Cost labels and ordinary orange legal-square highlights support any affordable move. Hold `Gastou X ⚡` for three visible seconds, then advance automatically. |
| 3: Diagonal movement | A fresh square piece at (3,3), +2, reusing the same dice total 4 without another roll. Calculation, costs, and exact legal destinations appear immediately. Any legal diagonal move leads to a three-second spent-energy observation. |
| 4: Capture | Round blue piece at (3,3), energy 6; red pieces at (3,5) and (0,3). The first costs 6 to capture; the second costs 8. A legal non-capture is previewed and restored. Capturing the affordable target advances after three visible seconds. |
| 5: Turns/dice | A centered opening roll shows 7. Three automatic legal moves alternate red, blue, red. Selection and the turn label follow the moving player during motion and the next player between moves. A countdown shows three/two/one turns until a centered roll changes the dice total to 3. Blue's energy changes from 9 to 5; three visible seconds later the lesson advances. |
| 6: Captain hunt | Show the ten blue starting pieces, with the already designated Captain visually concealed. After four visible seconds reveal it and its pointer; after two more seconds add the enemy Captain at (3,3) and its box/pointer. Only then show the win/loss copy. Preselect blue at (6,3); any blue piece may be selected. Legal moves remain until the real Captain capture wins; advance three visible seconds later. |
| 7: Captain costs | Only a blue round Captain at (3,3) and an adjacent ordinary red piece at (3,4), +2 and dice total 6. Ask for capture (cost 8). A legal non-capture is previewed/restored. The separate Captain movement exercise is removed. Three visible seconds after the successful capture records completion. |
| 8: Ready | Show the full normal starting board with Play and Replay. Normal play creates its own state. |

Coordinates are internal zero-based `(row,col)`. The exercises are authored situations, not one continuous competitive match. In Captain Hunt each non-winning move is retained and the next blue practice action is offered with the same dice; there is no competitive AI or simulated enemy attack. The separate turn demonstration uses real alternating state transitions.

The introduction omits a standalone path-blocking exercise. Production rules still enforce path and occupancy restrictions; non-energy illegal moves receive the brief generic correction `A peça não pode ir aí.`.

## Energy, attempts, and guidance

Cost labels show the total action cost along all selected-piece movement rays to the board edge, stopping at the first occupied square. Allied occupancy has no label. Unaffordable empty squares remain priced; squares beyond blockers do not. An enemy's label is a small lower-right corner badge, offset from the piece value. Green/red costs, numbers, lightning symbols, and Portuguese accessible labels communicate affordability.

Labels appear immediately in energy, diagonal, capture, and Captain-cost practice. Whenever costs are visible, ordinary orange legal-square highlights replace the yellow direction arrows. Captain Hunt initially uses direction arrows and the ordinary energy display; Dica or repeated invalid attempts reveal labels/exact destinations. Two meaningful unsuccessful attempts reveal a target; three add a short instruction, without a progressive hint arrow. Dica can reveal a legal next step toward the enemy Captain and select its source. Neutral deselection does not count. No hint performs a move or skips an objective.

All costs/legality come from the production v2 functions. Captain costs depend on the moving piece, not the captured target. One-square ordinary movement/capture costs 2/4; one-square Captain movement/capture costs 4/8. Energy is an affordability limit for one move, not a persistent pool permitting additional normal-turn actions.

Short corrections recover after two visible seconds; numeric energy feedback gets 3.2 seconds and highlights required energy in red and available energy in green. Spent-energy results, changed-energy observation, and the practice win advance after three visible seconds; there are no Continue controls. Movement waits are 350 ms. The dice use the normal game's shared centered presentation, with flicker/result timing controlled by the tutorial session. Cosmetic waits disappear with reduced motion; reading periods remain. All session waits pause while hidden and cancel on replay, skip, navigation, or unmount. Input locks synchronously while resolving.

The page fits the viewport and anchors the board near the top. The larger dice card stays at the upper-left across stages. Calculation panels use a white background on the left and instruction panels appear on the right; in portrait the two panels sit beneath the board. Titles, body copy, emphasis, and feedback have separately sized text strokes. Board layout transitions are disabled in practice so measured pointers remain aligned after resizing; move and highlight animations remain.

## Entry and isolation

- Route: `ROUTES.MATH_WAR_TUTORIAL`, `/guerra-matematica/tutorial`.
- Identity: `{ game: "math-war", scope: "core", version: 1 }`; legacy overlay history is neither deleted nor treated as playable completion.
- Local, AI, and online lobby gates run before their gameplay/room hooks mount. Existing online rooms bypass onboarding; direct tutorial entry redirects to the lobby without leaving the room.
- Menu replay returns to the rules/menu. Automatic entry retains the intended local/AI/lobby destination; AI difficulty is validated against unlocked progress.
- Router history stores return context with a session-storage backup scoped to its entry. Direct/invalid context falls back to the menu. Refresh restarts stage 1.
- Skip records dismissal. Back/Home/unmount cancel without writing dismissal or completion. Replay retains prior history.
- No normal AI loop, difficulty unlock, room action, or normal-match victory analytics runs inside practice. Global page views still run.

## Source and verification

`src/MathWar/Tutorial/lesson.ts` owns fixtures, cost labels, feedback, and hunt hints. `MathWarTutorialController.ts` owns phases and transitions. `Pages/tutorialPage.tsx`, `TutorialPointers.tsx`, and `tutorial.module.css` own presentation/lifecycle. `Components/DiceAnimation.tsx` exports the shared `DiceReveal` presentation; normal gameplay retains its own original roll timing, while the tutorial controls it through session waits. `TutorialGate.tsx` and `navigation.ts` own entry/return. The Board has an optional practice adapter; normal behavior remains the default, with local input locking now respected as well as remote locking.

Controller tests cover all initial/diagonal destinations, capture affordability and restoration, actual costs, turn cadence, timed Captain reveals, selection during the hunt, hints, history, and cancellation. React interaction tests exercise the real Board in StrictMode, keyboard input, hidden values/reveals, complete progression, gates, storage failure, and return validation. These checks establish technical behavior, not classroom learning effectiveness.

October 14 verification: the full code suite passed 348 tests with two workers; the final Math War suites passed 23 tests after the last copy/layout changes and addition of reduced-motion coverage. Production build and lint for changed source files passed. Authorized browser verification covered the full lesson, numeric correction, keyboard input, replay, and the original board appearance at the default 708×618 viewport and a 390×844 phone viewport. No browser console errors were observed. This is implementation verification, not learning validation with children.

October 22 verification: 66 relevant checks passed across Math War, shared tutorial, and Crown Chase suites, including the normal game's dice timing after presentation reuse. Production build, changed-source lint, and diff checks passed. Authorized browser checks covered progression, readable numeric feedback, capture badges, countdown/turn presentation, and viewport fit at 1280×720, 390×844, 640×360, and 320×568. The test suite separately checks the delayed Captain pointer, automatic advance cancellation/pause, and no second roll for stage 3.
