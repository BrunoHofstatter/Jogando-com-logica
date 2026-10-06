# Rubik's Class (Cubo Mágico) - Educational Modules

## Purpose of This File

Use this file as the main reference when discussing ideas, building new modules, or making code changes to the Cubo Mágico learning system.

This file should help with both:

- pedagogical and product discussions about what each class is supposed to teach
- coding work on current modules, future modules, summaries, and learning flow

## What This Is

RubiksClass is not really a normal game. It is a sequence of interactive classes or quiz-like learning modules built around the Rubik's Cube and similar twisty puzzles.

The main idea is to teach math concepts through visual interaction with cubes, instead of starting with abstract explanation.

It can include game-like review activities, especially in the summary sections at the end of each class, but the core purpose is teaching.

## Core Teaching Philosophy

The intended teaching approach is:

- activity first
- hints only when needed
- explanation after a useful discovery or if the student is struggling
- when possible, clarify the visual before adding explanation text

This is one of the most important things to remember about RubiksClass.

The goal is not:

- explain everything first
- then give an activity afterward

The goal is:

- let the student interact first
- let them try to figure things out
- if they struggle, reveal progressive hints
- connect successful discoveries to new notation through short, child-paced reveals

This makes the class feel more fun, dynamic, and discovery-based.

## Current Reality

- RubiksClass is a module system, not a single game loop
- The first 3 modules have lessons available in the class menu
- Classes 1–3 include `Aprender` and `Jogar`; Class 3's game currently requires a mouse
- The summary or review parts are designed to be more game-like and interactive
- More modules are already planned and should be easy to document later in the same structure

## Current Structure

### Menu Structure

The class menu currently exposes:

- Aula 1: Dimensões
- Aula 2: Multiplicação no Cubo
- Aula 3: Multiplicação nas Faces
- more classes marked as `Em Breve`

For Classes 1–3, the menu offers:

- `Aprender`
- `Jogar`

### Meaning of `Aprender` vs `Jogar`

- `Aprender` starts the full teaching flow
- `Jogar` skips directly to the summary review activity for that class

This is implemented by navigating into the same module with `mode: "game"` and starting directly in the summary phase.

## Current Modules

## Module 1 - Dimensions

### Teaching Goal

The purpose of the first module is to teach students how to see the size of a Rubik's Cube correctly.

This is foundational because many children do not naturally know how to identify cube size from visual structure alone. In practice, this makes it necessary to teach the basics first before using cubes for later math content.

The core idea is:

- understand what `2x2`, `3x3`, `4x4`, and so on actually mean
- learn to look at one row or one line of squares and identify the cube size

### Current Learning Content

Class 1 has six questions and one child-paced notation reveal:

1. On a 2×2, count quadradinhos in one row.
2. On the same cube, count rows on one face.
3. After a short reveal connecting those counts to the name `2×2`, identify a 3×3.
4. Identify 5×5, then 4×4, breaking the ascending-size sequence.
5. Identify 6×6 without permanent counting support.

Every question has four choices in a symmetric two-column grid. The display-scale and rotation comparison questions were removed. No discovery counter appears above the question. The reveal waits for `Continuar`. Other correct answers advance after 1.2 seconds. Mathematical face totals remain Class 2 content.

### Cube Interaction and Hints

- Cubes are stationary until deliberately rotated with pointer dragging or arrow keys. They have no ambient spin, inertia, or automatic return.
- The first three questions offer Class 3's hand/tooltip/cube demonstration, repeating with quiet gaps until an actual drag beyond the gesture threshold or arrow-key rotation. A tap pauses it without recording practice. Once the learner rotates, the demonstration stays dismissed for the rest of this lesson attempt. Hints and answer transitions suspend it. It does not appear from question four onward.
- The demonstration shares Class 3's timeline and reduced-travel behavior under reduced motion. Background time does not advance it. Ordinary decorative feedback respects reduced motion.
- `Dica` is immediately available. Wrong answers reveal support up to two levels; a separate visible/status message still rejects wrong answers after the cap.
- Row support highlights a front row and then numbers its squares. Row-count support outlines the rows and then labels them.
- Each help request brings the front row back into view. `Ver dica novamente` replays maximum help without counting another distinct level. Dragging remains available.
- After 30 foreground seconds without help, the hint button is emphasized; waiting never counts as an error or assistance reveal.
- Lesson wrong answers and assistance reveals are separate counters. The responsive cube sizes use the shared 650px portrait subscription.

Both phases reuse Class 2’s bottom-left purple `Aulas` button, compact warm-colored bottom-right hint control, and hint cards above the left-side cubes. Wrong-answer/game-result messages share a bottom-edge status component that disappears after three seconds; repeated attempts restart its lifetime. The notation reveal uses plain dark-blue explanatory text without a text outline. All three lessons share the same top-positioned `Correto!` overlay on desktop and portrait. Class 1 uses `Mais uma dica` for the next help level and the shared `Precisa de uma dica?` invitation, while keeping `Ver dica novamente` for replay. The game title and matching instruction are larger, with matching white text and blue outlines.

### Current Summary / Review Activity

The review begins with five shuffled cubes, one of each size 2–6. The instruction is `Escolha um cubo e depois o tamanho dele.` Cube selection uses native buttons with neutral names, keyboard activation, and selection state; dragging rotates without selecting. Correct matches preserve progress and move keyboard focus to an available cube. Wrong matches retain selection and provide explicit feedback.

The `Dica` control offers optional row highlighting, then sequential counts, for the selected cube. Help and mistakes are tracked separately. The game finishes immediately after the five matches; there are no extra identification questions. Attempts remain unlimited. Visible cube names and the combination counter are omitted. The 6×6 choice is centered below the two paired rows. Matched answers turn green with a matching border/shadow and a separate green checkmark in the top-right corner. Wrong answers stay red through hover/activation, with matching red borders/shadows.

Completion still means finishing the activity. It shows actual lesson errors when a lesson was attempted, game errors, and help usage, with `Jogar novamente`, `Próxima aula`, and `Aulas`. Replay resets review state and starts a new review analytics attempt; direct review/replay omits the unattempted lesson-error line. Completion appears in a modal overlay above the still-mounted finished board. The board is inert while the dialog is open, and keyboard focus stays within the dialog. White outlined summary text matches the class; smaller blue replay and green next-class buttons share a row, with a purple Aulas button below.

Lesson data/reducer live in `class1Lesson.ts`, review rules in `class1Review.ts`, and the Class 1 camera/gesture wrapper in `Class1Cube.tsx`. Existing checkpoint IDs (`two`, `three`, `four`, `five`, `six`) remain stable; the removed comparison checkpoint IDs now resolve as invalid. Checkpoint indices derive from the current sequence.

## Module 2 - Multiplicação no Cubo

### Teaching Goal

The purpose of the second module is to make students understand multiplication through the Rubik's Cube.

The main intended ideas are:

- understand that they do not need to count every small square one by one
- understand that they can calculate the number of squares on one face using multiplication
- understand what multiplication actually means in a visual way

This module is not just about getting the answer. It is also about making students see multiplication as:

- a number of groups
- with the same quantity in each group

Using the cube makes this very concrete.

### Current Learning Content

The lesson has 13 questions and one child-paced concept reveal. Its progression is:

1. 3×3: count squares in one row, then count rows.
2. Choose repeated addition with a visual preview matching terms to rows.
3. Reveal `3 + 3 + 3` as `3 × 3`, with labeled factors, `Continuar`.
4. Ask for the 3×3 face total (9), without giving that total in the reveal.
5. 4×4: choose the full-face multiplication, then its total (16).
6. On that same 4×4, highlight only two rows: choose `2 × 4`, then answer 8.
7. 2×2: choose the full-face multiplication.
8. 5×5: choose the full-face multiplication, then count four highlighted rows (20).
9. 6×6: choose the full-face multiplication on an ordinary face, then count five highlighted rows (30).

Colored stripes expose equal groups on one face of the full 3D cube. Other
stickers remain mostly gray with a faint trace of their colors. All Class 2 cubes
can be dragged or rotated using arrow keys, including during hints and review.
After five idle seconds, they gently return to their home view: a shallow left/top
view in teaching and the original three-quarter view in review. A new drag
immediately interrupts that return. A short initial color sweep introduces the
stripes; this is an educational appearance change, not a simulated Rubik's layer
turn. The ordinary 6×6 question removes stripes until help is used. Student-facing
copy uses `face`, `linhas`, and `quadradinhos`, rather than formal area terminology.

The first factor consistently means number of rows; the second means squares per
row. Equivalent products are not offered as incorrect distractors. On the repeated
addition question, selecting an option first previews one addition term beside
each visual row; the student then confirms the choice. A correct answer opens the
intentional reveal `3 + 3 + 3` → `3 × 3`, with factor labels and
a child-controlled `Continuar` action. Other correct answers use a brief 1.2-second
transition before advancing.

### Hint Structure

- The `Dica` button offers visual help immediately; each wrong answer also advances the visual help by one level.
- There are at most three hint levels. After 45 foreground seconds without help, the button is emphasized; time alone is not counted as an error.
- Individual-square counting remains in the introduction and first 4×4 question. From the second 4×4 question onward, hint 1 labels all requested groups, hint 2 connects addition to multiplication, and hint 3 shows the total or explains the factors for calculation-choice questions.
- Hints and reveals use staggered glowing white outlines fitted directly to each row’s sticker bounds, with no filled glow inside the row.
- Final total support shows the completed multiplication. Excluded rows stay muted through every hint.
- Sticker counts and outside row labels animate in sequence. Hints preserve the question’s original muted-sticker mask: the first question keeps only its top row colored, while counting a row never dims other requested rows.
- Row-count and row-size questions use counting cues appropriate to their specific question, including sticker indices when needed.
- Hint text appears above the cube. The cube uses Class 3’s downward offset (3dvh desktop, 1.5dvh portrait mobile). Correct answers show only `Correto!` in a top-center overlay for 1.2 seconds. The concept reveal plays once and offers only `Continuar`.
- Sum selections retain a colored border and shadow until changed or submitted.
- The smaller `Aulas` button stays at the bottom-left; the lightbulb hint control stays at the bottom-right.
- Help usage and incorrect answers are separate counters. The review receives only actual incorrect answers as its lesson-error count.
- Every committed wrong answer also shows and announces `Ainda não! Tente outra resposta.`, including repeated attempts after all three hints. Addition choices use a single column; choosing a different sum clears its previous rejection before confirmation.

The shared cube renderer accepts optional named-face colors, row-major per-sticker
overrides, muted stickers, row outlines/labels, and a staggered pattern animation.
Default callers retain the original appearance. The implementation is generic so
later modules can reuse it for selected faces and other educational patterns.

### Current Summary / Review Activity

The review starts with a large animated introduction. Three labeled columns show
the sequence directly: count the colored squares with `2 × 3 = 6`, choose the correct total
from a scattered number lane, and touch the corresponding 3×3 cube. The animation
reuses Class 3's solid hand cursor, turns the selected 6 yellow, then pulses and
clicks the cube; only then does the larger checkmark appear. The overlay occupies
85% of the viewport height. `Jogar` starts play, so no cards move or spawn behind it.

Five cubes are shown at once, mixing full and partial faces. The player selects a
moving total, then a cube with that many colored stickers. Dragging a cube rotates
it without submitting a match. Correct matches display the calculation and replace
the cube with its slot's second target after leaving the slot blank for 0.5 seconds.
The same delay precedes a completed-slot checkmark. The game ends after ten matches; each slot
empties after its second match. Different groups with the same total can both accept
that total. Wrong matches keep the target available for another attempt. Expressions
appear in feedback rather than on falling cards.

The deck contains two 2×2, three 3×3, three 4×4, one 5×5, and one 6×6 target.
The 6×6 always replaces the 5×5 in the same slot, so they never coexist. Slot pairs
(rows × squares per row) are: 2×3 → 2×4, 3×4 → 1×3, 4×5 → 3×6,
3×3 → 4×4, and 2×2 → 1×2.

Cards travel at 4.8% of the lane per second, with 4.5 seconds between regular spawns
and a four-card safety cap. A 300ms replenishment keeps at least two choices visible
and restores a valid total or distractor when either is missing. Initial cards are
staggered along the lane. A selected card turns yellow with light text and a dark
text outline, and all available cubes pulse until the player chooses one. Completed slots use a larger, thicker
checkmark. Feedback moves below the main instruction and fades after three seconds.

Card travel and lane position are stored independently of screen orientation, so
switching between desktop and portrait retains each card's progress and selection.
Spawning pauses when all targets are temporarily absent during replacement; it
resumes once the next cube is available. Keyboard-focused cards are brought inside
the lane and keep moving; only explicitly selected cards pause while choosing a cube.

Each review cube has one keyboard stop: arrows rotate, and Enter or Space submits
the match. Starting play focuses a number; keyboard number selection moves to a
cube, and submitting a match returns to the numbers. Removed controls have a focus
fallback, and completion focuses `Jogar novamente`. Pointer drags still suppress matching.

The instructional demonstration and falling numbers run regardless of the system
reduced-motion preference; decorative cube pulses and scaling remain suppressed.
The introduction loops automatically without pause/resume controls. During play, `Parar números`
switches to stationary choices and `Mover números` restores travel without resetting
progress. Stationary choices refresh after matches/replacements, retaining a usable
total and distractor whenever a target is available, with no timed spawns or travel frames.

Completion uses Class 1's shared dialog and typography, with `Jogar novamente`,
`Próxima aula` (Class 3), and `Aulas`. It shows `Erros no jogo` and lesson hint
usage; lesson errors appear only when the lesson was attempted. Replay starts a
fresh review introduction and excludes previous lesson errors/hints. Successful
match feedback uses the same green text styling as Class 1, retaining its
calculation text and placement below the instruction.

Product decision (2026-09-27): keep the review free of hints. Unlocking `Jogar` after
lesson completion is planned separately and is not implemented by these fixes;
direct game entry currently remains available.

## Module 3 - Multiplicação nas Faces

Class 3 is implemented and reachable through `Aprender` and `Jogar`; its existing
route remains `/aulas/3-cubo-inteiro`. The lesson completion also offers `Jogar`.
Direct game entry recognizes navigation state or `?mode=game`; checkpoint entry
continues to take precedence. The review is loaded separately from the lesson.

### Teaching Goal

Extend Class 2's equal rows to equal whole faces: number of selected faces ×
quadradinhos per face. Counting all six faces is an application of the same rule.
UI uses `face` and `quadradinhos`, without formal area units. Partial rows across
multiple faces remain future work.

### Current Learning Content

Seven configurations provide 16 questions and five numerical totals:

| Cube | Target faces | Learning steps |
| --- | --- | --- |
| 2×2 | 2 blue | Face count; one-face expression; total expression; total 8 |
| 3×3 | 3 red | Face count; one-face expression; total expression; total 27 |
| 4×4 | 4 green | Total expression; written calculation 16 × 4 = 64 |
| 5×5 | 3 orange | Total expression only: 3 × 25 |
| 5×5 | 6 yellow | Total expression; written calculation 25 × 6 = 150 |
| 6×6 | 5 blue | Total expression only: 5 × 36 |
| 6×6 | 6 red | Total expression; written calculation 36 × 6 = 216 |

One-face expression answers reveal the per-face quantity with a child-paced
`Continuar`, without another numerical question. Expressions keep faces first;
before the first written calculation only, a child-paced explanation connects
`4 × 16 = 16 × 4` to the reused vertical calculation component. Later calculations
open directly. Continue after a face result advances directly without success feedback.
Equivalent-valued distractors are excluded. Ordinary successes advance after
1.2 seconds. The final lesson question completes the activity.

### Appearance, Interaction, and Hints

- All selected faces in a configuration share its target color; other faces stay
  gray, including during hints. Colors vary across blue, red, green, orange, and
  yellow. White is never a target.
- A brief hand-drag animation introduces rotation on the first face-count question.
  Its tooltip appears above the cube only while the hand and cube are demonstrating
  the gesture. One animation clock drives all three. Dragging immediately dismisses
  the whole cue for that question and retains the child's angle.
- The horizontal cue is offered again on the first four-face question only if the
  child has not yet rotated a cube. The first bottom-face configuration introduces
  a vertical gesture. Other questions do not show a cue. At most two demonstrations
  run, separated by a quiet gap with no tooltip. Keyboard arrows also rotate the
  focused cube; there are no persistent on-screen rotation buttons or caption.
- Class 3 composes the restored Class 2 lesson styles: larger question title,
  hint card above the cube, bottom-left `Aulas`, bottom-right lightbulb hint dock,
  matching answer buttons and staggered multiplication groups. There is no cube
  heading or question-number label. It does not resume ambient auto-spin or inertia.
- `Dica` is immediately available; incorrect answers also advance support up to
  three levels. After 45 foreground seconds without help, the button is emphasized.
  Inactivity does not count as an error.
- Face-counting help tours adjacent faces in a stable order, with gray waypoints
  if needed. Only newly visited selected faces increment the count. The route
  includes the bottom, avoids opposite-face jumps and unnecessary half-turns,
  and keeps top/bottom count labels upright. Tours can be stopped or replayed.
- Face-counting tours run automatically, including under reduced motion (slower
  movement). They retain a shallow 3D angle, finish by themselves, restore dragging,
  and offer `Contar novamente`. Row/square hints can still use a face-on view.
- The opaque hand cue plays twice if untouched in either motion setting; reduced
  motion only reduces its travel. Every new question resets the cube to its home
  view. The 3×3 home view exposes the gray left face.
- Early multiplication prompts separate the two given quantities from the question.
  Numerical multiple-choice totals always have six distinct options.
- Completed written calculations remain mounted, visible, and read-only during
  success feedback. A fixed top-center green `Correto!` overlay replaces inline
  explanations, so the title and calculation do not jump.
- One-face hints reuse front-face row guides. Later hints connect equal faces to
  repeated addition, labeled multiplication factors, and small running totals.
  There is no compulsory repeated-addition concept lesson.
- Written arithmetic starts freely: no selected cell, forced order, clearing of
  wrong input, or automatic cursor movement. Selecting a result or carry cell
  gives it a yellow fill and purple outline. Neutral carry boxes replace green ones.
- The shared multiplication component provides progressive visual help to the right:
  arrows connect operands to the multiplication, reveal its result, then connect
  result digits to their answer/carry cells. The next column explicitly adds the
  incoming carry. Help closes after its column is solved; entries remain editable.
- A wrong entry is assessed after 1.2 foreground seconds without another interaction,
  allowing quick corrections. After 25 idle foreground seconds, help is offered;
  another 25 seconds reveals or advances it. Manual help is immediately available.
  Automatic help never downgrades; a small back button revisits the previous hint
  in the same column. Revisiting the same level does not add another hint count.
- Class 3 accepts a correct result with omitted carries; entered carries must be
  correct. Wrong settled entries and unsuccessful checks count as errors; selecting
  another cell does not. Distinct revealed help levels count separately as hints.
- Desktop keyboard input is scoped to the calculator; Enter/Space retain native
  button activation. The mobile keypad stays available, and completed calculations
  remain visible and read-only during the success transition.

The implementation plan and verification record are in
`docs/plans/class3-equal-faces-implementation-plan.md`.

### Current Summary / Review Activity

The desktop game uses a mouse-aimed toy cannon and a red assisted crosshair.
Its large animated introduction shows `1 × 9`, a 3×3 with only its top colored,
a fully colored 3×3, and a 4×4 with three colored faces. The preview fires at the
correct cube, replaces it with a green checkmark cube, and clears distractors
with dust. The explanation connects the selected face and its grid to the two
factors. One random nonwhite target color is shared by intro, practice, and game.

`Jogar` starts protected shooting practice: a centered 3×3, then a centered 4×4,
each alone and both required. They rock gently and cannot leak or cost health.
No ammo/icon or practice counter is shown; a compact left-side instruction says
`Mire no cubo e clique para atirar!`. Ten main rounds follow with full health.
There is no separate one-face warm-up or global survival timer. Each round starts
with three varied cubes and exactly one matching target. Ammo means selected
faces × quadradinhos per face and always belongs to the oldest unresolved trio.
A second trio can approach and can be shot; every shot at it is wrong. Those cubes
flash/recoil/shake but stay, preserving the next target. Current wrong cubes react
and disappear. A hit or normalized depth 0.55 requests the next trio once, with a
one-second appearance delay, 1.2-second spawn interval and two-trio cap. Correct
hits reserve the target immediately, keep its mathematical cube visible, then
resolve after 0.55 seconds with a solid green/check replacement and simultaneous
visible dust from removed distractors. Ammo changes at resolution; existing later
trios stay visible. Results wait for the last success/dust feedback rather than
covering it immediately.

Curved, slightly staggered paths run from a wide upper frosted-gray entrance
toward the cannon. Grids keep their exact sizes; all mathematical cubes share
the same physical scale. A game-only renderer uses six cached SVG face textures
instead of per-sticker DOM elements, preserving the lesson's gray/colored look.
Rounds 1–4 gently rock ±8° around a shared ±30° pose (6-second cycle), retaining
top/front/one side. Rounds 5–8 sweep continuously ±55° (10-second cycle), revealing
top/front/left/right across motion but never the back; there are no paused views.
Only rounds 9–10 use full Y rotation (10-second turns). Motion styles are shared
within each trio and persist when ammo changes. Every gameplay cube colors the
top first and adds adjacent lateral faces; faces outside its motion's inspectable
set remain gray. Target AND distractor face-count limits are 3/4/5 by stage. Count
distractors prefer a difference of at least two when feasible, with a bounded
fallback. The requested fully colored intro distractor is a demo-only exception.
Initial travel remains 28 seconds; observed readability/balance is not yet visually
validated.

Three red hearts have three irregular shards each (nine health). Wrong cube hits
cost one; required targets escaping cost three; empty shots and distractor escapes
cost nothing. Ten round circles sit below the hearts in two rows of five: current
amber, all completed rounds green/check (including escapes), upcoming gray.
Surviving all ten finishes; zero health loses immediately. Results show actual
remaining full/partial hearts, separate hit/escape/wrong-shot totals, and replay
and Aulas actions, using light outlined text on a contrasting panel.

Solid borderless blue clock cubes accompany rounds 2/4/6/8/10 and move twice as fast.
Collecting one freezes approach and new spawns for five foreground seconds while
rotation and shooting continue. Hidden tabs pause both clock domains without a
catch-up jump. Replay starts a fresh introduction and separate analytics attempt.
Direct review never starts a lesson attempt; the existing Class 3 lesson still
finishes independently before optional review entry. Checkpoint analytics stay
excluded. Coarse-pointer-only devices receive a local mouse notice and Aulas action.
Mobile joystick controls and dedicated reduced-motion adaptation remain planned.

The detailed enlarged SVG cannon has its purple ammo box and small matching energy
icon to the left, without overlap. Blue clock/green success cubes use solid joined
faces with white icons and subtle shading, no dark Rubik-style outlines or grids.
Dust uses larger contrasting gray/white puffs with about a 0.9-second lifetime;
the frosted blue-gray corridor has stronger edge/floor/perspective cues.

Detailed stages, tuning values, and verification are recorded in
`docs/plans/class3-summary-game-implementation-plan.md`.

## Planned Modules

These modules are planned ideas. They should not be described as already implemented.

## Planned Module 4 - Total Squares of Multiple Cubes and Different-Shaped Puzzles

Main idea:

- calculate total squares across multiple puzzles together
- expand beyond one standard cube

Possible examples:

- total squares of a `2x2` and a `4x4` together
- total squares of puzzles with different shapes
- examples like Pyraminx, Megaminx, and other differently shaped twisty puzzles

This module is intended to broaden the visual reasoning and make the content richer and more varied.

## Planned Module 5 - Fractions with Cubes

Main idea:

- teach fractions using cube faces with different color proportions

Possible examples:

- what fraction of the face is one color
- comparing different color proportions
- understanding parts of a whole visually through colored stickers

## Planned Module 7 - Geometry with Cubes

Main idea:

- teach geometry concepts through cube-based and puzzle-based shapes

Possible examples:

- triangle
- square
- other shapes and spatial ideas that can be shown with cube structures or puzzle forms

## Summary Review Philosophy

The summary review activities are important enough to document separately.

The intended direction is:

- make summary reviews fun
- make them interactive
- make them dynamic
- make them feel more game-like than the lesson itself

This becomes even more important in harder or later modules, because those modules will need stronger engagement and better reinforcement.

## Educational Value

### Best Current Grade Fit

Best current fit is around 3rd to 6th grade, depending on the module and the amount of support given.

### Skills Developed

- visual interpretation of cube structure
- counting and grouping
- multiplication understanding
- spatial reasoning
- pattern recognition
- mathematical reasoning through concrete objects

### School Content / Broad BNCC-Aligned Themes

- dimensions and spatial perception
- multiplication as repeated structure
- visual grouping
- counting squares on faces
- later expansion to total surface ideas
- later expansion to fractions and geometry

## Current Implementation

### Main Files

- `src/RubiksClass/Classes/ClassMenu.tsx`: current classes menu
- `src/RubiksClass/Classes/ClassIcon.tsx`: `Aprender` / `Jogar` entry buttons
- `src/RubiksClass/Components/RubiksCube.tsx`: interactive visual cube component
- `src/RubiksClass/Components/hintButton.tsx`: reusable hint modal component

### Module 1 Files

- `src/RubiksClass/Classes/Class1_dimensions/Class1Dimensions.tsx`
- `src/RubiksClass/Classes/Class1_dimensions/useClass1.ts`
- `src/RubiksClass/Classes/Class1_dimensions/SummaryView.tsx`

### Module 2 Files

- `src/RubiksClass/Classes/Class2_faceArea/Class2FaceArea.tsx`
- `src/RubiksClass/Classes/Class2_faceArea/useClass2.ts`
- `src/RubiksClass/Classes/Class2_faceArea/class2Lesson.ts`: sequence, state transitions, and visual/hint data
- `src/RubiksClass/Classes/Class2_faceArea/Class2SummaryView.tsx`

### Module 3 Files

- `src/RubiksClass/Classes/Class3_totalSquares/Class3TotalSquares.tsx`
- `src/RubiksClass/Classes/Class3_totalSquares/useClass3.ts`
- `src/RubiksClass/Classes/Class3_totalSquares/class3Lesson.ts`: configuration data, reducer, hints, and adjacent-face route planning
- `src/RubiksClass/Classes/Class3_totalSquares/LessonCube.tsx`: visual teaching and inspection controls
- `src/RubiksClass/Classes/Class3_totalSquares/useFaceMotion.ts`: interruptible cue, guided tour, and reduced-motion views

### Future Module Structure

There are already placeholder folders for future modules, including:

- `Class4_totalSquares2`
- `Class5_fractions`
- `Class7_geometry`

At the moment, these are not implemented in the class menu as real modules.

### Legacy / Old Content

There is also an older first-class implementation in:

- `src/RubiksClass/Classes/oldClass1`

This should be treated as legacy content, not the current main source of truth.

## Known Design Tensions

### This Is Not a Normal Game

RubiksClass should not be treated like the other games in the platform.

It is closer to:

- an interactive lesson system
- with game-like review sections

This matters for both pedagogy and implementation decisions.

### Summary Reviews Need to Keep Improving

The current summary reviews already move in the right direction, but they are also a major opportunity area.

Especially for harder future modules, the review sections should feel:

- rewarding
- playful
- dynamic
- less like a static quiz

### Module Documentation Must Stay Extendable

This file should stay easy to extend when new modules are added.

The best way to keep it maintainable is to document each module with the same basic structure:

- teaching goal
- what it teaches
- current implementation
- summary review idea
- current status

## Future Ideas / Planned Work

- add the next Rubiks modules soon
- keep the activity-first and hint-first approach across all modules
- make summary reviews increasingly game-like
- use harder modules to create richer and more dynamic review experiences
- expand beyond standard cubes when useful for teaching

## Open Questions

- Should every future module have both `Aprender` and `Jogar` from day one?
- How much direct explanation should ever be shown before the student interacts?
- Should later modules stay focused only on Rubik's Cubes, or fully expand into other twisty puzzles when that helps the concept?
- Should future review modes start tracking performance more formally, or stay light and playful?

Class 3 visual refinement (2026-09-16): cube and counting controls sit slightly
lower, and face-count labels are enlarged independently of sticker counts.

## Hidden Lesson Checkpoint Launcher

`/aulas/testes` is an unlisted testing page for Classes 1–3. It offers the first
question of each cube section, with ordinal labels for repeated sizes. Class 2
row-highlight changes remain within the same cube section. Class 3 configurations
are distinct sections. No public menu links to this route.

Implementation lives in `src/RubiksClass/Testing/`. `registry.ts` derives the
checkpoints from lesson data; `checkpoints.ts` generates labels and resolves IDs.
The `checkpoint` query parameter contains a stable section ID, never a question
index. `LessonEntry` validates it and remounts the lesson on navigation. Refresh
restarts the selected section. Invalid IDs show a link back to the launcher.
Checkpoint entry takes precedence over `mode=game` and resets all lesson state.
The lesson then continues normally, including review/completion. A persistent
`Voltar aos testes` link is available throughout the testing session. Checkpoint
sessions pass null to the attempt analytics hook, excluding starts/completions/
abandonments from student activity metrics (ordinary page views remain enabled).

For another class: declare stable cube-section IDs in its lesson data, derive
checkpoints from its actual question sequence, register its title/route/checkpoints,
wrap its route with `LessonEntry`, and initialize its hook from `useLessonEntry`.
Use the same context to suppress attempt analytics. Keep IDs stable when editing
copy or reordering; separate cube occurrences need distinct IDs even at the same
size. Do not put question-index lists in the launcher.
