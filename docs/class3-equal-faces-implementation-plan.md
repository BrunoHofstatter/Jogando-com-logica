# Class 3 redesign: multiplication across equal faces

Status: learning rework implemented. The sections below retain the agreed design
and implementation requirements; the summary game remains deferred.

## Objective and scope

Extend Class 2's equal-row grouping to equal whole faces of one cube:

`number of selected faces × quadradinhos per face`

Selected faces precede the whole cube; all six faces are an application of the same rule. Students identify the multiplication and calculate selected totals. Use `face`, `linhas`, and `quadradinhos` in Brazilian Portuguese UI, without introducing formal area units.

Reuse Class 2's activity-first presentation and progressive visual hints. Do not add a mandatory repeated-addition lesson or concept-reveal question. One-face multiplication is recalled through expression selection and feedback, without a separate numerical question.

This work covers the learning section only. Partial rows across multiple faces are deferred to a future class. Class 4 currently has a different proposed scope; do not silently replace that roadmap. The Class 3 summary game remains separate future work.

## Cube appearance

- Within each configuration, all selected whole faces use one target color.
- Vary the target between blue, red, green, orange, and yellow. Never use white as a target.
- Keep every unselected face gray throughout questions, feedback, and hints. Use Class 2's excluded-sticker treatment, retaining visible sticker borders.
- Keep the target color and selected faces stable across questions about the same configuration.
- Use whole-face outlines and contrasting labels for emphasis. Do not recolor individual selected faces during a hint or label every sticker when counting faces.
- Derive question wording from the configuration's color. Preserve natural Portuguese forms: `faces azuis` / `quadradinhos azuis`, `faces vermelhas` / `quadradinhos vermelhos`, `faces verdes` / `quadradinhos verdes`, `faces laranja` / `quadradinhos laranja`, and `faces amarelas` / `quadradinhos amarelos`.
- Ensure labels remain readable on yellow and orange. Selected-versus-excluded styling must also differ in emphasis, not only hue.

The shared renderer already exposes named `faceAppearances`, per-face color/muting, focus labels, dragging, and scripted rotations. Extend these generic capabilities only as needed; lesson content and timing belong in Class 3.

## Rotation and discovery cue

Use a brief demonstration followed by student-controlled inspection, rather than continuous automatic spinning during questions.

1. Initially show a hand/cursor that drags a short distance; the cube follows and gently returns to its initial teaching angle.
2. Show `Arraste para girar`. Use a touch-appropriate hand cue on touch devices.
3. Repeat after a quiet pause only if the student has not interacted. Stop immediately on pointer interaction, answer selection, or a hint starting.
4. Let dragging take over from the currently displayed angle without a jump. Never reset a student's view as the end of the demonstration.
5. Demonstrate vertical inspection when needed, because the bottom cannot be inspected through horizontal rotation alone.
6. Preserve orientation between questions on the same configuration unless an explicit teaching hint needs to focus a face. A new configuration can establish its own useful starting angle.

Add opt-in control over automatic rotation/resumption for Class 3, preserving the defaults used elsewhere. Scripted rotation currently blocks dragging; implement an explicit handoff for the interruptible introductory cue. Guided hint tours may own rotation while playing, with a way to finish/skip and return control. Respect reduced-motion settings by using static cues and child-paced face views.

## Face-counting hint animation

Provide a replayable guided tour that counts only selected faces. This is required even though students can rotate manually.

- Travel through adjacent cube faces in a logical route, avoiding direct front-to-back or other opposite-face jumps.
- Use intermediate unselected faces as travel waypoints when necessary. They stay gray and do not increment the count.
- Pause on each selected face, outline it, and show the next ordinal. Update a compact running count in the feedback area.
- Count each selected face exactly once. End with a clear total such as `São 4 faces verdes.`
- Include the bottom when selected. Six-face questions must count all six surfaces, not only those visible from above.
- Preserve each face's color during the tour. Keep an ordinal face-count label distinct from later labels describing quadradinhos per face.
- At completion, hold a useful view and release control without snapping. Replay restarts the tour deliberately; cancel timers on question changes and unmount.

Implementation approach:

Represent the cube's six named faces as an adjacency graph: every pair is adjacent except opposite faces. Build a deterministic short route visiting all selected faces, allowing gray waypoints. Prefer minimal travel and consistent tie-breaking rather than random ordering. An all-face route can be `front → right → back → left → top → bottom`, but the final opposite transition must be routed through an adjacent side, for example `top → front → bottom`; revisiting front must not count it twice.

Do not iterate the current renderer face-index order (`front, back, right, left, top, bottom`), which creates opposite-face jumps. Keep that index mapping unchanged for existing callers and create a separate tour order.

Rotation keyframes must implement adjacent moves with continuous angles, including wraparound handling; simply sorting face indices or interpolating arbitrary existing Euler targets does not guarantee a short visual path. Start from the current displayed orientation through a smooth approach. Tune movement/pause durations as named constants; the count should occur only after the target face is readable. With reduced motion, show the same ordered faces as discrete child-paced views.

## Lesson sequence

Seven configurations, 16 answerable questions, five numerical totals. Feedback reveals are not extra questions.

| Configuration | Target color | Selected faces | Questions | Total |
| --- | --- | --- | --- | --- |
| 2×2 | Blue | 2 | Face count; one-face expression; total expression; numerical total | 2 × 4 = 8 |
| 3×3 | Red | 3 | Face count; one-face expression; total expression; numerical total | 3 × 9 = 27 |
| 4×4 | Green | 4 | Total expression; written calculation | 4 × 16 = 64 |
| 5×5 | Orange | 3 | Total expression only | 3 × 25; do not ask for 75 |
| 5×5 | Yellow | 6 | Total expression; written calculation | 6 × 25 = 150 |
| 6×6 | Blue | 5 | Total expression only | 5 × 36; do not ask for 180 |
| 6×6 | Red | 6 | Total expression; written calculation | 6 × 36 = 216 |

The specific color assignment is a deterministic implementation default; using all five permitted colors and keeping one target color per configuration are requirements. Avoid random lesson variation in this rework.

Suggested face placements:

- First configuration: front and right, both visible at the starting angle.
- Second: front, right, and top, initially visible together.
- Four-face configuration: front, right, back, and left, introducing inspection around the cube.
- Three-face 5×5: front, right, and bottom, transferring the concept to a different arrangement and introducing bottom inspection before the first all-face configuration.
- Five-face 6×6: all except back, so the bottom remains part of the selected group.
- All-face configurations: all six, including bottom.

These placements are implementation defaults, not additional learning objectives. Face counting must always be possible through manual inspection or the hint tour.

### First configuration in detail

1. `Quantas faces azuis há neste cubo?` → 2.
2. `Qual multiplicação calcula os quadradinhos de uma face azul?` → `2 × 2`.
3. Brief correct-answer feedback: `2 × 2 = 4 quadradinhos em cada face azul.`
4. `São 2 faces azuis, com 4 quadradinhos em cada uma. Qual multiplicação calcula o total?` → `2 × 4`.
5. `Quantos quadradinhos azuis há no cubo?` → 8.

Repeat the structure for 3×3 with three red faces and `3 × 3 = 9`. Keep the established face count and per-face result available as compact supporting information during these early total-expression questions.

From 4×4 onward, remove the separate face-count and one-face-expression questions. Ask which multiplication calculates the target-colored quadradinhos, letting the child infer the factors. Recover those intermediate steps through hints. After expression selection, confirm the meanings of the factors before numerical work.

### Expression answers

Use `selected faces × quadradinhos per face` consistently. Require expression selection before numerical totals to assess the grouping connection; mental counting need not be prohibited.

Use distractors that reflect distinct errors, such as using cube size instead of squares per face, including gray faces, or adding the two quantities. Never mark an equivalent reversed product as incorrect, and avoid distractors with coincidentally equivalent values. Do not expose the final total before its numerical question.

## Progressive hints

Reuse Class 2's behavior: immediate `Dica` access, wrong answers advancing visual help, at most three levels, and separate help/error counters. Preserve its foreground-only idle emphasis behavior rather than treating elapsed time as an error.

Adapt support to the question:

- Face count: identify a selected face, then provide the ordered counting tour.
- One-face expression: focus one selected face, expose equal rows, then connect row count and squares per row to multiplication. Keep excluded faces gray.
- Total expression: recover the one-face quantity and selected-face count, then connect the equal faces to repeated addition and multiplication with labeled factors. Hints can combine a focused face view and the counting tour without changing the selection.
- Small numerical totals: connect face groups to repeated addition, then running totals per face if needed.
- Larger numerical totals: use the existing written calculation component's own arithmetic help.

Repeated addition belongs in optional help, not a mandatory concept reveal. Reuse Class 2's feedback placement and brief ordinary success transition. Do not auto-advance while an intentional child-paced explanation is still being read.

## Written multiplication

Reuse `VerticalMultiplication` and the current Class 3 adaptive guidance, input, keypad, and process validation behavior for the three larger totals. Do not redesign the arithmetic component in this task.

The lesson expression keeps groups first (`4 × 16`), while the existing written layout puts the two-digit quantity above the one-digit multiplier (`16 × 4`). Before the first written calculation, explicitly connect the arrangements with `4 × 16 = 16 × 4` and a short explanation that changing factor order preserves the result. Do not reveal 64. Retain a compact equivalent-expression connection for later calculations.

Small totals 8 and 27 use numerical answer choices. Expression-only configurations end after correct expression feedback and require no numerical total.

## Implementation work

1. Extract typed lesson/configuration data and pure progression/visual derivation from `useClass3.ts`, following the Class 2 separation. Include target color, selected named faces, question kind, correct expression, hints, and tour state.
2. Extend `RubiksCube.tsx` and its animation helpers with the minimum opt-in motion controls and face-level visual capabilities needed. Preserve existing caller behavior and face-index mappings.
3. Implement the interruptible drag demonstration and adjacent-face counting tour with explicit timer cleanup and smooth control handoff.
4. Replace Class 3's existing six-face-only questions with the agreed sequence. Reuse Class 2's learning UI conventions and help/error accounting, preserving the existing written multiplication integration.
5. Update Class 3 styles using CSS Modules and project-standard fluid units. Keep mobile input and Portuguese accents intact; add no external APIs or heavy dependencies.
6. Update completion copy to describe selected equal faces, including the whole cube. Use `Multiplicação nas Faces` as the proposed visible Class 3 title because `Cubo Inteiro` covers only the endpoint; update menu/lesson labels consistently while preserving route constants and route paths.
7. Preserve analytics start/completion behavior. Report actual wrong answers separately from hint use, aligned with Class 2 and the analytics documentation.
8. After implementation, update `.agents/rules/game_rubiks.md` and `docs/rubiks-cube-component.md` to describe shipped behavior. Update analytics documentation if its Class 3 accounting changes. Keep planned game work explicitly separate from current reality.

Likely primary files:

- `src/RubiksClass/Classes/Class3_totalSquares/useClass3.ts`
- New Class 3 lesson-data/state helper alongside the hook
- `src/RubiksClass/Classes/Class3_totalSquares/Class3TotalSquares.tsx`
- `src/RubiksClass/Classes/Class3_totalSquares/Class3TotalSquares.module.css`
- `src/RubiksClass/Components/RubiksCube.tsx`
- `src/RubiksClass/Components/RubiksCube.module.css`
- `src/RubiksClass/Components/RubiksCubeAnimations.ts`
- `src/RubiksClass/Classes/ClassMenu.tsx` and the actual source of class-title metadata

## Verification and acceptance

Run `npm run build` and `npm run lint`. Add focused code tests for lesson progression and face-tour logic, including:

- Seven configurations, 16 questions, five numerical totals, and three written calculations.
- Correct products and target colors; white is never selected as the target color.
- Every selected face counted exactly once, gray waypoints never counted, and every route hop adjacent, including tours containing top/bottom and all six faces.
- Expression distractors do not incorrectly reject an equivalent product.
- Help and errors counted separately; transition/tour timers cannot advance a later question accidentally.

Check diffs for UTF-8 Portuguese, unintended shared-renderer default changes, and unrelated edits. Preserve pre-existing working-tree changes.

The user explicitly authorized browser verification for this implementation.
Verification includes a complete browser lesson walkthrough, desktop and mobile
layouts, keyboard/keypad arithmetic, reduced-motion counting, normal-motion tours,
and manual interruption of the drag cue. Normal-motion checks use a temporary local
harness of the actual lesson cube because the in-app browser prefers reduced motion;
that harness is removed afterward.

Code verification covers lesson/reducer/route tests, existing shared cube and
calculation tests, the production build, and lint of changed TypeScript files.
Repository-wide lint currently reports 61 errors and 7 warnings outside these changes.

## Deferred summary-game direction

Retain the earlier discussion as future proposals only: short size and one-face warm-ups, then target-color face-group challenges on slowly rotating cubes; planned ammo/target relationships; and segmented hearts with different penalties for missed shots and escaping targets. Challenge scheduling, distractor removal, penalties, and how the bottom is represented remain for the separate game design. Do not implement or expose a Class 3 `Jogar` entry as part of this learning rework.
