# Math War: implemented playable tutorial

Implemented October 14, 2026. This replaces Math War's legacy explanation overlays and uses the shared session/history without changing normal match rules. Read [overview.md](overview.md), [technical-contract.md](technical-contract.md), and the [game reference](../games/math-war.md) for context.

## Lesson sequence

All practice copy is Brazilian Portuguese. The normal 8×8 board and piece renderer are reused; the tutorial owns its green pop-ups, measured pointers, and practice presentation. Player 1 is blue.

| Stage | Situation and progression |
|---|---|
| 1: Round movement | One selected round blue piece at (3,3), value hidden. Exact legal destinations, no direction arrows. Any legal move advances. |
| 2: Energy | Retain the accepted position, reveal +2, roll a fixed total of 4, then connect dice and piece value to `4 + 2 = 6`. Direction arrows and cost labels support any affordable move. Hold `Gastou X ⚡` until Continue. |
| 3: Diagonal movement | A fresh square piece at (3,3), +2 and dice total 4. Calculation and pointers return. Exact legal destinations replace direction arrows. Any legal diagonal move leads to spent-energy acknowledgement. |
| 4: Capture | Round blue piece at (3,3), energy 6; red pieces at (3,5) and (0,3). The first costs 6 to capture; the second costs 8. A legal non-capture is previewed and restored. Capturing the affordable target advances after acknowledgement. |
| 5: Turns/dice | Three automatic legal moves alternate blue, red, blue. Dice total remains 7 for those moves, then changes to 3. The calculation shows blue's energy decreasing from 9 to 5. Continue advances. |
| 6: Captain hunt | Show the ten blue starting pieces, with the already designated Captain visually concealed. After 2.4 visible seconds reveal it; after two more seconds add the enemy Captain at (3,3). Only then show the win/loss copy. Preselect blue at (6,3); any blue piece may be selected. Legal moves remain until the real Captain capture wins. Continue advances. |
| 7: Captain costs | A blue round Captain at (3,3), +2 and dice total 6. Ask for a one-square move (cost 4). After acknowledgement add an adjacent ordinary red piece and ask for capture (cost 8). Legal alternatives are previewed/restored. Final acknowledgement records completion. |
| 8: Ready | Show the full normal starting board with Play and Replay. Normal play creates its own state. |

Coordinates are internal zero-based `(row,col)`. The exercises are authored situations, not one continuous competitive match. In Captain Hunt each non-winning move is retained and the next blue practice action is offered with the same dice; there is no competitive AI or simulated enemy attack. The separate turn demonstration uses real alternating state transitions.

The introduction omits a standalone path-blocking exercise. Production rules still enforce path and occupancy restrictions and feedback explains attempted violations.

## Energy, attempts, and guidance

Cost labels show the total action cost along all selected-piece movement rays to the board edge, stopping at the first occupied square. Allied occupancy has no label. Unaffordable empty squares remain priced; squares beyond blockers do not. An enemy's label is a corner badge. Green/red costs, numbers, lightning symbols, and Portuguese accessible labels communicate affordability.

Labels appear immediately in energy, diagonal, capture, and Captain-cost practice. Captain Hunt initially uses direction arrows and the ordinary energy display; Dica or repeated invalid attempts reveal labels/exact destinations. Two meaningful unsuccessful attempts reveal a target; three add a pointer/instruction. Dica can reveal a legal next step toward the enemy Captain and select its source. Neutral deselection does not count. No hint performs a move or skips an objective.

All costs/legality come from the production v2 functions. Captain costs depend on the moving piece, not the captured target. One-square ordinary movement/capture costs 2/4; one-square Captain movement/capture costs 4/8. Energy is an affordability limit for one move, not a persistent pool permitting additional normal-turn actions.

Short corrections recover after two visible seconds; numeric energy feedback gets 3.2 seconds. Spent-energy results, changed-energy observation, and the practice win await Continue. Movement waits are 350 ms. Cosmetic waits disappear with reduced motion; explanation reading periods remain. All session waits pause while hidden and cancel on replay, skip, navigation, or unmount. Input locks synchronously while resolving.

## Entry and isolation

- Route: `ROUTES.MATH_WAR_TUTORIAL`, `/guerra-matematica/tutorial`.
- Identity: `{ game: "math-war", scope: "core", version: 1 }`; legacy overlay history is neither deleted nor treated as playable completion.
- Local, AI, and online lobby gates run before their gameplay/room hooks mount. Existing online rooms bypass onboarding; direct tutorial entry redirects to the lobby without leaving the room.
- Menu replay returns to the rules/menu. Automatic entry retains the intended local/AI/lobby destination; AI difficulty is validated against unlocked progress.
- Router history stores return context with a session-storage backup scoped to its entry. Direct/invalid context falls back to the menu. Refresh restarts stage 1.
- Skip records dismissal. Back/Home/unmount cancel without writing dismissal or completion. Replay retains prior history.
- No normal AI loop, difficulty unlock, room action, or normal-match victory analytics runs inside practice. Global page views still run.

## Source and verification

`src/MathWar/Tutorial/lesson.ts` owns fixtures, cost labels, feedback, and hunt hints. `MathWarTutorialController.ts` owns phases and transitions. `Pages/tutorialPage.tsx`, `TutorialPointers.tsx`, and `tutorial.module.css` own presentation/lifecycle. `TutorialGate.tsx` and `navigation.ts` own entry/return. The Board has an optional practice adapter; normal behavior remains the default, with local input locking now respected as well as remote locking.

Controller tests cover all initial/diagonal destinations, capture affordability and restoration, actual costs, turn cadence, timed Captain reveals, selection during the hunt, hints, history, and cancellation. React interaction tests exercise the real Board in StrictMode, keyboard input, hidden values/reveals, complete progression, gates, storage failure, and return validation. These checks establish technical behavior, not classroom learning effectiveness.

October 14 verification: the full code suite passed 348 tests with two workers; the final Math War suites passed 23 tests after the last copy/layout changes and addition of reduced-motion coverage. Production build and lint for changed source files passed. Authorized browser verification covered the full lesson, numeric correction, keyboard input, replay, and the original board appearance at the default 708×618 viewport and a 390×844 phone viewport. No browser console errors were observed. This is implementation verification, not learning validation with children.
