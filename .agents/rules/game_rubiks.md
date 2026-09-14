---
trigger: model_decision
description: Rubik's Class (Cubo Mágico) documentation.
---

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
- Classes 1 and 2 include `Aprender` and `Jogar`; Class 3 currently offers only `Aprender`
- The summary or review parts are designed to be more game-like and interactive
- More modules are already planned and should be easy to document later in the same structure

## Current Structure

### Menu Structure

The class menu currently exposes:

- Aula 1: Dimensões
- Aula 2: Multiplicação no Cubo
- Aula 3: Multiplicação nas Faces
- more classes marked as `Em Breve`

For Classes 1 and 2, the menu offers:

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

The current implemented lesson uses cube sizes:

- 2x2
- 3x3
- 4x4
- 5x5
- 6x6

The student is asked:

- `Qual o tamanho deste cubo?`

### Hint Structure

Current hints are progressive:

- first hint: count the squares in the top row
- second hint: show the counting more explicitly with indices

This matches the teaching philosophy well:

- the student tries first
- the system only reveals more structure when needed

### Current Summary / Review Activity

The summary activity for Module 1 is a matching game.

The player:

- sees a shuffled set of cubes
- selects a cube
- matches it to the correct size label (`2x2`, `3x3`, etc.)

This summary is already more game-like than the teaching phase and fits the general idea that summary reviews should be fun, interactive, and dynamic.

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
3. Reveal `3 + 3 + 3` as `3 × 3`, with labeled factors, `Continuar`, and replay.
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
intentional reveal `3 + 3 + 3` → `3 × 3`, with factor labels, a replay action, and
a child-controlled `Continuar` action. Other correct answers use a brief 1.2-second
transition before advancing.

### Hint Structure

- The `Dica` button offers visual help immediately; each wrong answer also advances the visual help by one level.
- There are at most three hint levels. After 45 foreground seconds without help, the button is emphasized; time alone is not counted as an error.
- The first level usually isolates one row. Later levels label the equal groups and connect them to repeated addition and multiplication.
- Outlines, labels, and a short staggered row pulse are reserved for hints and reveals.
- The final support shows running totals by row. Excluded rows stay muted through every hint.
- Sticker counts and outside row labels animate in sequence; row hints gradually restore color.
- Row-count and row-size questions use counting cues appropriate to their specific question, including sticker indices when needed.
- Hint text appears above the cube, replacing the old cube heading.
- Sum selections retain a colored border and shadow until changed or submitted.
- The smaller `Aulas` button stays at the bottom-left; the lightbulb hint control stays at the bottom-right.
- Help usage and incorrect answers are separate counters. The review receives only actual incorrect answers as its lesson-error count.

The shared cube renderer accepts optional named-face colors, row-major per-sticker
overrides, muted stickers, row outlines/labels, and a staggered pattern animation.
Default callers retain the original appearance. The implementation is generic so
later modules can reuse it for selected faces and other educational patterns.

### Current Summary / Review Activity

The review starts with a large animated introduction: a 3×3 cube with two colored
rows, a labeled `2 × 3 = 6` calculation, three moving number cards, and a pointer
showing number-then-cube selection. The overlay occupies 85% of the viewport height.
Its 12-second loop slowly moves the cards, clicks the correct total, then clicks
the cube; only then does the checkmark appear, holding for four seconds. `Jogar`
starts play, so no cards move or spawn behind the introduction.

Five cubes are shown at once, mixing full and partial faces. The player selects a
moving total, then a cube with that many colored stickers. Dragging a cube rotates
it without submitting a match. Correct matches display the calculation and replace
the cube with its slot's second target. The game ends after ten matches; each slot
empties after its second match. Different groups with the same total can both accept
that total. Wrong matches keep the target available for another attempt. Expressions
appear in feedback rather than on falling cards.

The deck contains two 2×2, three 3×3, three 4×4, one 5×5, and one 6×6 target.
The 6×6 always replaces the 5×5 in the same slot, so they never coexist. Slot pairs
(rows × squares per row) are: 2×3 → 2×4, 3×4 → 1×3, 4×5 → 3×6,
3×3 → 4×4, and 2×2 → 1×2.

Cards travel at 4.8% of the lane per second, 60% of the previous speed, with roughly
8.6 seconds between spawns and a four-card safety cap. Initial cards are staggered
along the lane. Feedback moves below the main instruction and fades after three seconds.

## Module 3 - Multiplicação nas Faces

Class 3 is implemented and reachable through `Aprender`; its existing route remains
`/aulas/3-cubo-inteiro`. It has no summary game or `Jogar` entry.

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
before written work, a child-paced explanation connects `4 × 16 = 16 × 4`
(and later equivalent products) to the reused vertical calculation component.
Equivalent-valued distractors are excluded. Ordinary successes advance after
1.2 seconds. The final lesson question completes the activity.

### Appearance, Interaction, and Hints

- All selected faces in a configuration share its target color; other faces stay
  gray, including during hints. Colors vary across blue, red, green, orange, and
  yellow. White is never a target.
- A brief hand-drag cue introduces rotation. Later cues also demonstrate vertical
  movement for bottom inspection. Dragging interrupts the cue and retains the
  child's angle. Arrow controls offer an alternative to dragging. Class 3 does
  not resume ambient auto-spin or inertia after inspection.
- `Dica` is immediately available; incorrect answers also advance support up to
  three levels. After 45 foreground seconds without help, the button is emphasized.
  Inactivity does not count as an error.
- Face-counting help tours adjacent faces in a stable order, with gray waypoints
  if needed. Only newly visited selected faces increment the count. The route
  includes the bottom, avoids opposite-face jumps and unnecessary half-turns,
  and keeps top/bottom count labels upright. Tours can be stopped or replayed.
- Reduced-motion users receive child-paced `Próxima face` views and no animated
  drag demonstration. Selected faces remain inspectable through manual controls.
- One-face hints reuse front-face row guides. Later hints connect equal faces to
  repeated addition, labeled multiplication factors, and small running totals.
  There is no compulsory repeated-addition concept lesson.
- Written arithmetic retains the existing shared adaptive guidance and mobile
  keypad, with Class 3 styling. Help usage and incorrect answers are separate.

The implementation plan and verification record are in
`docs/class3-equal-faces-implementation-plan.md`.

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
