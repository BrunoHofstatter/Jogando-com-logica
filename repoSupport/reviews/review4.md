# Review 4: Rubik's Class 1 learning and game phases

Date: 2026-09-27. Scope: current Class 1 `Aprender` and `Jogar`, including questions, hints, cube interaction, matching, completion, accessibility, responsive rules, routing/checkpoints, analytics, architecture, and existing test coverage.

Inspected revision: branch `dev`, HEAD `2c2361f7af8a68d2fe9efd58936b34a5c5c53ca9`, including the existing working-tree changes to Class 1, lesson checkpoint entry, routes, and supporting documentation. This is a feature review, not a commit-range review. Existing unrelated work was preserved. Only this report and `repoSupport/recommended-changes.md` were edited. No implementation or tests were added. Creative directions below are proposals, not accepted designs or classroom-validated results.

## R4-1 — Make matching possible with the keyboard

**Type:** bug. **Impact:** high for keyboard-only users. **Confidence:** confirmed by source; no browser interaction performed.

Every review cube is a clickable `div` without a tab stop or keyboard handler. Its nested cube also has no keyboard controls because Class 1 does not enable `returnToDefault`. A keyboard user can reach the size buttons, but every attempt encounters `Selecione um cubo primeiro!`; there is no way to select the required cube. This blocks completion in both direct `Jogar` and the review following `Aprender`.

Evidence: `src/RubiksClass/Classes/Class1_dimensions/SummaryView.tsx:31–42,100–119`; `src/RubiksClass/Components/RubiksCube.tsx:601–609`.

Direction: use native selection buttons with neutral identities such as `Cubo A`, `aria-pressed`, and visible focus. Do not name them `Cubo 3×3`, which would supply the answer. Keep rotation separate from selection if rotation is introduced. Move focus deliberately after a match disables its label, and into the completion interface; the current modal at `SummaryView.tsx:158–176` has no dialog semantics or focus management. Verify an entire round with Tab, Enter, and Space, including wrong answers and completion. Neutral names fix operation, but nonvisual inspection also needs R4-9.

## R4-2 — Separate wrong answers from waiting and assistance

**Type:** bug. **Impact:** medium. **Confidence:** confirmed by source.

Wait for 30 interval ticks without answering: `totalFlags` increases when hint 1 appears. Answer every question correctly afterward and the completion still reports `Erros nas lições` and includes that wait in `Total de Erros`. The same counter also includes every actual wrong lesson answer, including guesses after all hints are open. Thus it measures neither errors nor distinct hints accurately. The interval has no visibility check, so background time can also trigger support and the apparent penalty, subject to browser timer throttling.

Evidence: `useClass1.ts:81–98,134–145`; `SummaryView.tsx:162–167`, both under `src/RubiksClass/Classes/Class1_dimensions/`. `Class1Dimensions.tsx:34–40` sends flags as `assistanceCount` and only game mistakes as `incorrectCount`. `.agents/rules/googleanalytics.md:274–276` documents that legacy mapping, so this is not an undocumented analytics regression; it is a misleading displayed error count and an ambiguous metric.

Direction: keep lesson wrong answers, actual assistance reveals, and game mistakes separately. Count foreground time only and use waiting to offer help rather than record an error. Provide immediate `Dica` access instead of requiring waiting or a wrong guess; Class 2's `useClass2` already demonstrates foreground-only help emphasis. Preserve metric compatibility explicitly if changing the analytics mapping and update its documentation with the eventual implementation. Move cross-state changes out of the `setTimer` updater into an explicit transition: that updater currently also changes phase, flags, and camera state, making repeated evaluation unsafe. Verify waiting, hidden-tab return, repeated wrong answers, and direct review with zero lesson activity.

## R4-3 — Keep counting help visible after cube interaction

**Type:** bug. **Impact:** medium. **Confidence:** confirmed control-flow gap; its rendered appearance has not been verified.

After hint 1 snaps the cube toward the highlighted front row, drag it away and answer incorrectly again. `resetToFront` remains `true` between hint 1 and hint 2, so its effect does not run again; numbering can appear on a face the child has turned away. Despite the prop's documented interaction lock, `onPointerDown` does not reject `resetToFront` or locked mode. A drag switches back into the inertia/automatic-spin path while the hint is still active. Also, opening the hint during existing inertia does not cancel that RAF in the reset effect, so it can overwrite the requested angle.

Evidence: `useClass1.ts:138–162`; `src/RubiksClass/Components/RubiksCube.tsx:296–312,340–374,421–472`. `.locked` in `RubiksCube.module.css` changes transition and cursor, not pointer access. The separate effect that cancels motion only handles `disableInteraction`/`scriptedRotation`, neither supplied by Class 1.

Direction: choose a coherent camera contract. Prefer free inspection with an explicit focus request for each hint, reusing the existing `returnToDefault`/`focusRequest` path; if temporarily locking the counting demonstration, enforce that lock and cancel all competing motion. Keep a way to bring the row back or replay counting. Verify hint arrival during inertia, drag between hint levels, and release/return while support remains visible. Changes to the legacy shared lock must be checked against its other callers.

## R4-4 — Respond to wrong answers after the final hint

**Type:** bug. **Impact:** medium. **Confidence:** confirmed by source.

At `hint2`, another wrong lesson answer changes only the hidden flags counter. The hint text, option styles, and phase remain identical; the hint card retains the same key and the sticker numbering is not replayed. The child gets no new response even though the eventual error total increases. Earlier mistakes reveal help, but never explicitly distinguish rejection from a general hint either.

Evidence: `useClass1.ts:134–145`; `Class1Dimensions.tsx:68–80,98–107`; `RubiksCube.tsx`, `renderSticker` keys and number spans.

Direction: make answer feedback independent from hint level. Briefly mark the attempted option and announce `Ainda não. Conte uma linha e tente novamente.` in a status region. Keep the task available and offer replay of the visual support without adding an error. Verify repeated rejection at the hint cap. This is the same interaction pattern found in Classes 2 and 3, but Class 1 has its own handler and needs its own correction.

## R4-5 — Synchronize cube sizing with responsive layout

**Type:** bug. **Impact:** medium. **Confidence:** confirmed breakpoint/subscription mismatch; overlap or clipping remains a code-based hypothesis.

Both Class 1 views decide cube size by reading a 600px portrait media query during render, while their CSS switches panels at 650px. At portrait widths of 601–650px, the stacked layout therefore receives desktop-sized cubes. Neither view subscribes to media changes. During review, rotating a device can change CSS immediately while leaving the inline cube size stale until another state update; selecting a cube can then cause an unrelated size jump. The lesson's question timer incidentally refreshes it, but there is no such interval during hints or review.

Evidence: `Class1Dimensions.tsx:58,88`; `SummaryView.tsx:113`; `Class1Dimensions.module.css:184`; `SummaryView.module.css:282`. The existing `src/RubiksClass/Components/useCubeMobileLayout.ts` uses the matching 650px query and a change subscription.

Direction: use that shared hook in both views or drive sizing entirely through the same CSS breakpoint. Verify resizing/orientation changes while idle, during hints, and with a selected cube. Later authorized visual checks should cover short landscape screens, portrait label-list scrolling, and the 601–650px boundary; this review does not claim those layouts were rendered.

## R4-6 — Let students inspect stable cubes and reduce motion

**Type:** product/usability suggestion. **Impact:** medium. **Confidence:** confirmed motion behavior; learning/discomfort effects are inferred.

The lesson and all five review cubes opt into default continuous spin. Review additionally disables pointer access to each nested cube, so a student cannot hold one still to count a row. Even matched, visually dimmed cubes continue spinning. The shared reduced-motion rule disables highlighted pulses but not `.autoRotate`; Class 1's shake and completion scale animations also have no reduced-motion overrides.

Evidence: `SummaryView.tsx:106–118`; `Class1Dimensions.tsx:86–89`; `RubiksCube.tsx:238`; `RubiksCube.module.css:29–31,377–383`; `SummaryView.module.css:170–177,230,449`.

Direction: start from a readable, stationary three-quarter view, or at minimum stop the selected review cube and suppress ambient spin under reduced motion. Offer deliberate inspection where useful, keeping selection distinct from dragging. Preserve correct/error states without shake or scale movement. Existing opt-in educational motion avoids changing all cube callers. This may also reduce ongoing rendering work, but no performance gain was measured; no new rendering library is justified.

## R4-7 — Teach the notation through discovery and then test transfer

**Type:** product/usability suggestion. **Impact:** medium. **Confidence:** confirmed content gap; proposed educational benefit is unvalidated.

All five lesson questions are identical except size: 2, 3, 4, 5, then 6, with fixed ascending options 2×2 through 9×9. Help counts one row but never connects that count to both parts of the label. A child can succeed by recognizing successive button positions, or leave knowing how to count a row without knowing why its answer is written `3×3`. The generic `tamanho` prompt also does not distinguish grid size from physical/display size. The current review keeps every cube at the same display size, which is a useful start, but does not explicitly test that distinction.

Evidence: `class1Lesson.ts:1–4`; `useClass1.ts:41–57,120–133`; `Class1Dimensions.tsx:95–106`; `SummaryView.tsx:111–118`. `.agents/rules/game_rubiks.md`, Module 1, sets the goal of understanding what the labels mean, with activity before explanation.

Direction: preserve the quick first attempt and add one short, child-paced discovery bridge. A concrete candidate sequence is:

| Step | Student action / Portuguese prompt | Purpose |
| --- | --- | --- |
| 1 | Inspect 2×2: `Quantos quadradinhos há em uma linha desta face?` | Establish a countable unit; show support only on request or error. |
| 2 | On the same face: `Quantas linhas há nesta face?` | Connect both directions of the grid. |
| Reveal | Outline a row and column in turn: `2 linhas, com 2 quadradinhos em cada linha. Este cubo é chamado de 2×2.` Then `Continuar`. | Attach the name to a discovery without teaching face totals prematurely. |
| 3 | Identify an ordinary 3×3: `Qual é o tamanho deste cubo?` | Apply the name without permanent highlights. |
| 4 | Identify 5×5, then 4×4. | Break the ascending-answer shortcut. |
| 5 | Compare two 3×3 cubes shown at different display sizes: `Eles têm o mesmo tamanho de grade?` | Separate grid structure from screen size. |
| 6 | Rotate a known cube: `Depois de girar, o tamanho da grade mudou?` | Test orientation invariance. |
| 7 | Identify 6×6 without highlights; offer optional row-count help. | Transfer the strategy to a denser grid. |

These are proposed tasks, not a mandatory seven-screen expansion. Fold the first two into one interaction if it stays clear. Use a small set of plausible nearby size distractors rather than eight choices at every step; reserve 7×7 or larger for an optional extension if desired. Keep the distinction between a cube's size label and Class 2's multiplication for a face total. A row-tapping interaction is another possible extension, but would need sticker input support and keyboard parity; the current renderer does not provide a sticker-click API, so it costs more than reusing count choices and row guides.

## R4-8 — Turn review into supported practice with a short independent round

**Type:** product/usability suggestion. **Impact:** medium. **Confidence:** confirmed game structure; engagement and learning effects are proposals.

The game contains one cube of each size and one matching label. Correct pairs become unavailable, so the last pair can always be solved by elimination. A wrong match clears selection and says only `Tamanho incorreto! Tente de novo.`; the child must reselect a cube and receives no new counting strategy. The initial instruction is only `Combine os Tamanhos!`, with the required input order explained after a label-first click. There is no replay action or next-class action at completion.

Evidence: `SummaryView.tsx:13,31–59,128–150,158–174`. This is a valid finite matching exercise, not a correctness defect, and it already avoids a speed penalty or loss of progress.

Direction: retain matching as the accessible entry activity and consider a compact “organize the cube collection” progression:

1. Begin with `Escolha um cubo e depois o tamanho dele.` and three readable stationary cubes. Preserve selection after an incorrect label, keeping feedback until the next attempt. Offer optional `Ver uma linha` after difficulty; count assistance separately.
2. Expand to the five sizes, using neutral cube identities and clear completed slots. Add a simple `3 de 5` progress indicator; avoid a countdown that rewards speed over counting.
3. Finish with two independently answered cubes, without exhausting the available label set. Repeat a previously encountered size with a different orientation or display scale so visual structure, rather than elimination, determines the answer.

Offer `Jogar novamente` and `Próxima aula` after completion, while keeping `Aulas`. Direct `Jogar` should not present `Erros nas lições: 0` as though a lesson was attempted. A single-round repair to instructions, retry selection, and help is low cost; multiple rounds require explicit round state and more verification. If repeated sizes coexist, give each cube a unique identity separate from its numeric size: current selection and completion use size as identity. Replace random-comparator sorting with a real shuffle when revising the deck. Do not add moving cards merely to make the game feel busier; counting and varied challenges can provide the activity.

## R4-9 — Expose the counting task and lesson changes accessibly

**Type:** product/usability suggestion. **Impact:** medium. **Confidence:** confirmed markup gaps; no screen-reader testing performed.

The unhinted lesson cube exposes no meaningful grid/face structure, and its ordinary rotation is pointer-only. Hints and success text are generic divs without status semantics. Because the title and option labels remain unchanged as the cube advances, a nonvisual student is not told what new object is being examined. Naming a cube by its answer would remove the intended task rather than make it accessible.

Evidence: `Class1Dimensions.tsx:68–107`; `RubiksCube.tsx:595–640` and `renderSticker`; `SummaryView.tsx:79–83,100–119`. This overlaps the shared inspection opportunity in R3-5, but Class 1 specifically asks for grid size rather than selected-face totals.

Direction: reuse a deliberate accessible face/row inspection model across lessons, with ordered countable units, neutral cube identities, keyboard inspection, and short Portuguese task-change/status announcements. Let the learner inspect or count the row rather than automatically announcing the final size. Announce discrete actions, not animation frames. This is a larger content-accessibility addition than the selection fix in R4-1 and should be evaluated with assistive technology when that testing is authorized.

## R4-10 — Decide whether completion should indicate practice or independent understanding

**Type:** behavior question. **Impact:** low. **Confidence:** confirmed implementation; intended assessment meaning is unresolved.

All five eventual matches complete the activity with `success: true`, regardless of guesses or lesson help. Unlimited attempts and elimination make that a measure of finishing practice, not evidence of independent size identification. The final interface emphasizes error totals but offers no account of which sizes needed support. Also, finishing the five learning questions alone does not end the lesson attempt: it completes only after the matching phase.

Evidence: `SummaryView.tsx:63–69,161–167`; `Class1Dimensions.tsx:34–40`; `useClass1.ts:123–125`. The current documented flow includes review, so mandatory matching is not reported as a bug.

Decision needed: keep completion as friendly practice completion, or add a distinct independent-understanding signal? Recommend keeping unlimited supportive practice and celebrating completion. If an assessment signal is wanted, define it from fresh unassisted checks such as the final round in R4-8; keep it separate from `completed` and do not impose a speculative error threshold or a hard gate before Class 2. Any teacher-facing interpretation needs an explicit product decision and classroom evaluation.

## Coverage and implementation direction

- **Mathematical correctness:** current answer checks correctly use the row dimension for sizes 2–6. Matching accepts equality, retains earlier successful pairs, ignores already matched sizes, and does not count label-first clicks as mathematical mistakes. No incorrect answer key was found. The missing notation bridge is a teaching opportunity, not a claim that the labels are mathematically wrong.
- **State and architecture:** lesson, view, and matching responsibilities are already reasonably separated. A small lesson reducer would make hint/error counters and timer transitions easier to verify when R4-2/R4-7 are implemented; no general lesson framework is warranted. Derive the ordinary review sizes from `CLASS1_CUBES` if they must stay aligned, or explicitly define a separate practice deck if adopting R4-8. Keep checkpoint IDs stable and derive checkpoint indices from the actual future sequence.
- **Lifecycle:** the lesson interval and transition timeout have cleanup. Review's short shake timeout has no cleanup or attempt identity; rapid errors can let an earlier timeout clear newer feedback. This is a small secondary issue to address with retry feedback, not evidence of a lasting memory leak. The shared attempt tracker guards duplicate completion. Existing tests do not cover Class 1's timed progression or matching handlers.
- **Routing/integration:** menu `Aprender`, state-based `Jogar`, and `?mode=game` reach the expected initial phases. Current `LessonEntry` validates checkpoints, remounts on navigation, overrides game mode for checkpoints, and suppresses attempt analytics there. The old class is still explicitly routed at `/aulas/1-antiga`; it is legacy, not dead code. App-level return chrome is suppressed for the current class, which supplies `Aulas` itself. The global portrait rotation overlay can be bypassed, so portrait behavior remains relevant.
- **Assets/performance/offline:** cubes are CSS/DOM geometry, and menu image URLs use `BASE_URL`. Matching renders 540 stickers across five six-faced cubes, plus the cores; no new dependency is needed for the proposed changes. Continuous animation is a plausible performance concern on school devices, not a measured bottleneck. Class 1 has no gameplay content-fetch dependency or lesson persistence on shared devices. This does not establish application-wide offline caching or remove the existing analytics integration.
- **Presentation:** both phase styles and their responsive rules were read. Possible short-screen overflow, hint placement, legibility of dense small cubes, and selected-state visibility need authorized visual validation before making precise layout claims. Preserve fluid sizing and Brazilian Portuguese. The scoped sources showed no mojibake.
- **Priority:** first restore keyboard completion, honest counters, reliable hint focus, and explicit rejection. Then fix responsive/motion behavior. Prototype the notation bridge and a short independent review round before investing in a larger game redesign. Reuse existing cube controls and guides; preserve activity-first discovery.

## Checks and limitations

- `npm run test -- src/RubiksClass src/analytics/GameAttemptTracker.test.ts`: **69 tests passed in 8 files**. Class 1 coverage here checks initial lesson/review/checkpoint states through server rendering; it does not exercise timer effects, answer progression, keyboard selection, or a complete review round. Shared cube tests are static-markup tests. Passing tests do not refute the interaction findings.
- `npx eslint src/RubiksClass/Classes/Class1_dimensions src/RubiksClass/Components/RubiksCube.tsx src/RubiksClass/Testing`: **passed**.
- `npm run build`: **passed**, including TypeScript. Vite warned about the large bundled JS chunk (814.36 kB minified); this is an application build observation, not a demonstrated Class 1 regression.
- No browser, screenshots, Playwright, local preview, screen reader, runtime profiling, or newly written tests were used. Behavioral findings are source-based; educational directions are hypotheses for future evaluation. Repository-wide lint was not run.
- Future implementation verification should cover correct progression from every Class 1 checkpoint, independent help/error counters, background timers, repeated wrong answers at maximum help, hint/drag overlap, complete keyboard matching, orientation changes, replay/reset, and completion analytics. Keep any DOM-level checks distinct from later explicitly authorized browser/visual checks.

## Implementation follow-up — 2026-09-27

The user authorized R4-1 through R4-8, specifying stationary cubes and the Class 3 gesture demonstration repeated on the first three questions until actual rotation. Those changes are implemented, including the notation discovery, varied identification/comparison questions, supported matching, two fresh review questions, and replay. The optional three-to-five-cube expansion was not added; matching retains its five-cube collection. R4-9 and R4-10 were explicitly declined: no nonvisual inspection mode or mastery requirement was introduced. Original findings above are retained as historical review evidence.

Verification: 93 tests passed in 11 Rubik's/analytics files, including reducer and jsdom interaction checks for Class 1. Scoped lint and production build passed; the build retains the existing large-chunk warning. No browser or visual verification was performed.

### User refinement — 2026-09-27

The subsequent user request supersedes the initial expanded sequence: Class 1 now has six questions with four choices each, retains the 2×2 notation reveal, and removes the repeated 3×3/4×4 comparison tasks. Review ends after five matches, with no extra challenges. Counters and visible cube names are removed. The controls/hints follow Classes 2–3, transient answer feedback sits near the bottom, and answer borders/shadows follow persistent red or green states.
