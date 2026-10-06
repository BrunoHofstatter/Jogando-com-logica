# Review 3: Rubik's Class 3 learning phase

Date: 2026-09-26. Scope: the complete current `Aprender` flow for Class 3, including lesson content, progression, hints, cube motion, written calculations, accessibility, responsive styling, navigation, completion, analytics, and relevant tests.

Inspected revision: branch `dev`, HEAD `cd6b504f32dd30d3cc9cb865cf3782513559f933`, **including existing uncommitted edits** in Class 3, its shared cube/calculation components, Class 2 styles, and supporting documentation. This is a feature review, not a review of a commit range. Existing work was preserved. Only this report and the pending recommendations list were edited. A sepa rate Class 2 review took the review2.md number; its report and recommendations were preserved.

## R3-1 — Scope calculation keyboard handling to the intended control

**Type:** bug. **Impact:** medium. **Confidence:** confirmed by source; browser event behavior was not exercised.

During any written calculation, `VerticalCalculation` installs a window-wide keydown listener. It prevents the default action for every Enter and calls `checkAnswer`, without inspecting the event target. A child who tabs to `Aulas` or `Preciso de ajuda` and presses Enter submits the calculation instead of activating that button. An incomplete calculation also increments the error counter. The same interference affects Enter activation of calculation cells and the visible keypad. Space or pointer activation remains a workaround, so this is not a universal completion blocker.

Evidence: `src/Shared/Calculation/components/VerticalCalculation.tsx:538–560` (`handleKeyDown`); Class 3 mounts it with adaptive checking at `src/RubiksClass/Classes/Class3_totalSquares/Class3TotalSquares.tsx:111–117`. `CalculationCell.tsx` renders native buttons.

Direction: preserve native button activation, scope arithmetic shortcuts to the calculation workspace, and ignore unrelated targets/modifier shortcuts. Add an interaction regression check covering Enter on help, navigation, a cell, and a keypad digit, as well as intentional answer submission. This shared fix needs verification against other calculation consumers.

## R3-2 — Keep adaptive arithmetic hints monotonic and foreground-aware

**Type:** bug. **Impact:** medium. **Confidence:** confirmed by source.

On `16 × 4`, request help twice before 12 seconds elapse, without completing the active column. Detailed help appears, but the still-pending 12-second timer unconditionally resets the hint to level 1. The 26-second timer restores level 2. Both callbacks increment `usedHints`, even if that support has already appeared. Thus waiting can remove useful explanation and inflate the completion's `Dicas usadas` count. The same pattern applies to the later calculations with their longer delays.

These timers also run without a visibility check. Leaving a calculation in a background tab can consume its help progression and count hints that the child did not see. The ordinary Class 3 hint-emphasis timer, by contrast, counts only foreground seconds.

Evidence: `src/Shared/Calculation/components/VerticalCalculation.tsx:233–265` schedules unconditional timed levels; `:279–316` handles manual help without canceling those timers. `Class3TotalSquares.tsx:113` sets the thresholds and `:116` forwards `usedHints`; `class3Lesson.ts:121` adds it to assistance. `useClass3.ts:15–23` shows the foreground-only ordinary-question behavior.

Direction: centralize actual hint escalation for each pending step, never lower a revealed level, count only newly revealed support, and pause automatic timing while hidden. Preserve intentional immediate manual help. Verify manual-help/timer overlap, background return, step changes, and cleanup; current tests do not exercise these effects.

## R3-3 — Acknowledge wrong choices after the last hint

**Type:** bug. **Impact:** medium. **Confidence:** confirmed by source.

After the third hint is open, an incorrect multiple-choice answer changes only `incorrectCount`. The options have no wrong-answer state, the hint text remains unchanged, and the count is only displayed at completion. The child receives no new visible or announced response explaining that the answer was rejected, and can repeatedly click it while accumulating errors. Earlier wrong answers at least reveal additional help.

Evidence: `src/RubiksClass/Classes/Class3_totalSquares/class3Lesson.ts:125–129`; `Class3TotalSquares.tsx:120` renders identical buttons; `:127` disables further hints. `LessonCube.tsx:16–21` does not replay support when only the error count changes.

Direction: add short Portuguese rejection feedback and identify the attempted option, including a polite status announcement, independently of hint escalation. Keep the question available and do not turn errors into automatic advancement. Cover repeated wrong answers at hint level 3.

## R3-4 — Make the reduced-motion bottom cue reach a bottom-facing view

**Type:** bug. **Impact:** medium. **Confidence:** confirmed angle calculation; visual consequence inferred from the renderer, not browser-verified.

The first orange 5×5 question intentionally hides one selected face underneath and introduces the cue `Arraste para cima e veja embaixo`. Its home X angle is −22°. The reduced-motion timeline caps travel at 0.4, so the vertical demo reaches only `−22 + 40 × 0.4 = −6°`: it never tilts below the horizontal view to expose the bottom. Both repetitions therefore fail to demonstrate the surface their tooltip describes. Manual rotation and the counting tour still provide access.

Evidence: `class3Lesson.ts:13–15,29` defines the home/configuration; `rotationCue.ts:7–8,31` selects the vertical cue and scales travel; `useFaceMotion.ts:113` maps travel to the cube angle; `LessonCube.tsx:54–55` supplies the instruction. `RubiksCube.module.css` places the bottom using `rotateX(-90deg)` and supplies an opaque inner core.

Direction: retain a meaningful bottom-visible endpoint in both motion settings, while reducing speed, repetitions, or decorative hand movement as appropriate to the accepted interaction design. Extend the existing timeline checks to validate the resulting cube orientation, not just normalized travel. A later explicitly authorized visual check should confirm readability of the exposed face.

## R3-5 — Expose the inspected face to assistive technology

**Type:** product/usability suggestion. **Impact:** medium. **Confidence:** confirmed markup gap; assistive-technology experience not tested.

The cube group announces its size and how to rotate, but not the current face, its selected/gray status, or its square grouping. Ordinary stickers/faces are unnamed divs; keyboard rotation changes only the visual transform. A nonvisual learner cannot perform the initial independent face inspection from that information. Counting hints announce totals, but requiring answer-revealing hints is not equivalent to offering the discovery activity.

Evidence: `src/RubiksClass/Classes/Class3_totalSquares/LessonCube.tsx:30–41`; `src/RubiksClass/Components/RubiksCube.tsx`, `renderSticker` and `FACES.map`. Row-guide labels are also `aria-hidden`. The existing keyboard controls and tour count statuses are useful foundations.

Direction: offer deliberate face-by-face inspection with Portuguese face names, selected status, and row structure; announce settled/user-requested views rather than every animation frame. Preserve the mathematical task instead of immediately announcing the final answer. Also expose written-calculation cell values and column identity: `CalculationCell.tsx` currently names every result cell only `Resultado`, overriding its displayed digit as its accessible name. This is a focused accessibility extension, not a request to redesign the lesson.

## R3-6 — Decide what the completion counters mean

**Type:** behavior question. **Impact:** low. **Confidence:** confirmed implementation; intended measurement requires a decision.

The completion labels are `Erros` and `Dicas usadas`, but written calculations count more than wrong mathematical answers or newly revealed hints. Clicking a future blank cell calls `registerAdaptiveMistake`; that increments both `onMistake` and `usedHints`, even when the later calculation's first mistake is below its hint threshold. Repeated help clicks also add to `usedHints` after maximum detail. Ordinary lesson questions instead increment assistance only when the hint level increases.

Evidence: `VerticalCalculation.tsx:293–316,369–385`; `Class3TotalSquares.tsx:82,113,116–117`; `class3Lesson.ts:120–129`. `.agents/rules/googleanalytics.md:292–297` accurately describes importing arithmetic `usedHints`, but its description of wrong answers/failed checks does not explain wrong-cell navigation. These are raw activity counters, not validated learning scores.

Decision needed: should the counters include procedural misclicks and repeated assistance requests, or represent mathematical errors and distinct support reveals? If the former, clarify internal documentation and child-facing labels; if the latter, separate navigation, error, and actual hint-escalation events in the shared component. This decision is separate from the unconditional timed downgrade in R3-2.

## Coverage and assessment

- **Content and pedagogy:** seven configurations, 16 questions, five numerical totals, and three written calculations match the current reference. The progression transfers equal rows to equal whole faces, reduces scaffolding after 3×3, includes hidden/bottom faces, and preserves child-paced face-result and first-calculation explanations. Correct products, target colors, six distinct numerical choices, and exclusion of equivalent-valued expression distractors are covered by tests. These are design/code observations, not classroom validation.
- **State and lifecycle:** the reducer guards stale transition indices, prevents duplicate progression outside the question phase, and completes at the final calculation. Transition/idle timers and motion RAFs have cleanup paths. Question-key remounts intentionally reset orientation. Guided tours count selected faces once and allow gray waypoints; pure route tests cover all nonempty face subsets and starting faces. React-level interruption, hint/tour overlap, focus transfer, and media-query changes are not covered by those tests.
- **Architecture:** lesson data/reducer, orchestration, and motion are separated sensibly; reusing the calculation engine avoids a second arithmetic implementation. Direct composition of Class 2 styles couples the two lessons' presentation, but no broad refactor is justified by this review. The shared calculation boundary is where most actionable gaps lie.
- **Integration:** menu exposes only `Aprender`; the existing route constant and menu navigation are consistent. Class-menu images use `BASE_URL`. Completion uses the existing attempt lifecycle with the Class 3 lesson identifier; duplicate-completion guards live in the tracker. No new lesson dependency or external content API was found. This does not establish application-wide offline caching.
- **Presentation:** inspected both desktop and portrait rules, scrolling answer panel, hint dock, success overlay, and read-only calculation integration. No clipping/overlap claim is made without rendering. The final accepted corrections in the implementation plan supersede older conflicting orientation/cue descriptions; historical browser permission and verification records were not treated as permission or fresh evidence for this task.

## Checks and limits

- `npm run test -- src/RubiksClass src/Shared/Calculation src/analytics/GameAttemptTracker.test.ts`: **70 tests passed in 8 files**.
- `npx eslint src/RubiksClass/Classes/Class3_totalSquares src/RubiksClass/Components/RubiksCube.tsx src/Shared/Calculation/components/VerticalCalculation.tsx src/Shared/Calculation/types.ts`: **passed**.
- `npm run build`: **passed**, including TypeScript. Vite warns about the existing monolithic output chunk (approximately 808 kB minified JS); this alone does not establish a Class 3-specific performance regression.
- No tests or implementation fixes were added, following the review workflow. Existing calculation component tests are server-render smoke tests; lesson and cue tests are pure logic tests, so their success does not refute the interaction findings above.
- No browser, screenshots, Playwright, preview server, screen reader, or runtime performance profiling was used. Findings are based on source inspection and the stated code-only checks. Repository-wide lint was not run; scoped lint success is not a claim that the entire repository is lint-clean.
