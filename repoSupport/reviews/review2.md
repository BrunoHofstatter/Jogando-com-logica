# Review 2: Rubik's Class 2 learning and game phases

Date: 2026-09-26. Scope: current Class 2 `Aprender` and `Jogar`, including entry routes, all 13 questions, the concept reveal, hints, cube interaction, review introduction, spawning/matching/replacements, completion, analytics, accessibility, styles, and tests. Inspected HEAD: `cd6b504f32dd30d3cc9cb865cf3782513559f933`, plus the existing working-tree edits in Class 2, the shared cube renderer, and relevant documentation. This is a feature review, not a review of only the diff.

Followed `repoSupport/overview.md` and `repoSupport/review.md`. Existing Class 3/calculation changes and the separate Bomb Game review were preserved. No implementation or tests were edited. Severity describes consequences, not implementation effort.

## Implementation follow-up — 2026-09-27

The findings below preserve the original review. In a subsequent authorized task,
R2-1 through R2-6 were implemented: empty-pool spawning is guarded, card coordinates
are orientation-independent, lesson rejection feedback is separate from hints,
addition CSS specificity is corrected, review focus and cube keyboard actions are
managed, and reduced motion uses stationary replenished choices with a static intro.
Verification: 120 Rubik's/analytics tests across 14 files passed, including new
reducer and jsdom interaction regressions; scoped lint and the production build
passed. The build retains its application-wide chunk-size warning. No browser or
visual verification was performed.

R2-7 is resolved by the user's decision: no hints in the game. Lesson-dependent
unlocking will be separate future work; no unlock logic was added here. Resolved
R2 entries were removed from the pending recommendations, preserving other reviews.

## R2-1 — Prevent spawning from an empty target pool during replacement

**Type:** bug. **Impact:** medium. **Confidence:** confirmed by a direct reducer execution.

Complete both targets in slots 0, 1, 3, and 4, then match the remaining 5×5. At nine matches the game is still playing, all five target entries are temporarily null, and the 6×6 is pending. Replenishment runs after 300 ms, before the replacement appears at 500 ms. `spawn` selects the empty `totals` pool and creates a box whose `value` is `undefined`. React consequently has no number to display. The blank card still occupies capacity and can be selected; matching it necessarily counts as an error. The replacement does not remove it.

Evidence: `src/RubiksClass/Classes/Class2_faceArea/class2Review.ts:23–28,76–84,105–110`; `Class2SummaryView.tsx:72–90`. The code-only reproduction reached `matches: 9`, `targets: [null,null,null,null,null]`, pending target `{id:7,size:6,rows:3}`, and `spawnedValue: undefined` using a valid completion order.

Direction: make spawning safe when no active targets exist, and resume replenishment when a replacement arrives. Guard the reducer independently of the timer effect so regular interval spawns are also safe. Add coverage for the final first-generation target being replaced, including the 300/500 ms ordering; current completion tests install replacements synchronously and skip this interval.

## R2-2 — Remap card coordinates when the layout changes orientation

**Type:** bug. **Impact:** medium. **Confidence:** confirmed coordinate behavior; visible overlap is a code-based hypothesis, not browser-verified.

Desktop stores travel in `top` and lateral position in `left`; portrait mobile reverses these roles. A media-query change restarts the animation effect with the new `mobile` value but leaves existing coordinates untouched. For example, the initial desktop card at `top: -12, left: 25` becomes `top: -12, left: 25.24` after a portrait tick: its former travel position becomes its permanent cross-lane position. Cards near the previous exit can similarly stay beyond the new lane's cross-axis bounds. Since the lane does not clip its children, those cards can travel through instruction/cube regions instead of the intended lane. Held cards do not move at all until deselected.

Evidence: `class2Review.ts:55–63,81–90`; `Class2SummaryView.tsx:50–78`; `src/RubiksClass/Components/useCubeMobileLayout.ts`; desktop/portrait `.fallingArea` rules in `Class2SummaryView.module.css`.

Direction: store orientation-independent progress and lane position, deriving `top`/`left` when rendering, or explicitly swap/remap coordinates on layout changes. Preserve the selected card. Add reducer/coordinate checks for both directions, including entry/exit positions and held cards. This is a small state-model correction, not a reason to replace the animation system.

## R2-3 — Give incorrect answers feedback after the last hint

**Type:** bug. **Impact:** medium. **Confidence:** confirmed by state and rendering inspection.

After hint level 3, another wrong answer increases `incorrectCount` but changes no rendered feedback. `addHint` returns without increasing support, the hint message/key remains identical, and answer buttons have no incorrect state. The count only appears at the end. A student can repeatedly submit the same wrong answer with no explanation that it was rejected while accumulating mistakes. Reconfirming an incorrect addition selection has the same problem.

Evidence: `class2Lesson.ts:119–138`; `Class2FaceArea.tsx:59–77,121–159`. Existing tests verify that errors continue to count at the hint cap but do not verify feedback.

Direction: separate answer-result feedback from hint escalation. Announce a short Portuguese rejection on every committed wrong answer, with an event identifier or equivalent mechanism for repeated identical answers. Keep hint usage and mistakes separate; do not add extra assistance merely to force a rerender. Check repeated wrong submissions at maximum help.

## R2-4 — Restore the addition choices' intended CSS layout

**Type:** bug. **Impact:** low. **Confidence:** confirmed CSS cascade; practical readability impact remains a visual hypothesis.

The addition container receives both `optionsGrid` and `additionOptions`. `.additionOptions` requests one column at line 185, but the later, equally specific `.optionsGrid` rule at line 264 sets three columns and overrides its gap. Thus the special one-column rule never controls this question. Long repeated-addition choices share the ordinary narrow numeric columns, particularly relevant to the four-term distractor on small screens.

Evidence: `Class2FaceArea.tsx:121`; `Class2FaceArea.module.css:185–186,264–273,381–386`.

Direction: use `.optionsGrid.additionOptions` or place the override after the base rules, with an explicit mobile gap if needed. The cascade can be established without a browser; actual wrapping and readability should be inspected only after browser permission is provided.

## R2-5 — Preserve keyboard focus through review transitions

**Type:** product/usability suggestion. **Impact:** medium. **Confidence:** confirmed missing focus handling; assistive-technology behavior was not exercised.

The introduction explicitly focuses `Jogar`, but pressing it removes that button without assigning focus to the playing area. Matching removes both the selected number and the target wrapper; replacements arrive as new keyed elements with no focus handoff. An unselected focused number can also expire. Keyboard users can repeatedly lose their place in the interaction. Each cube additionally has two tab stops: the outer matching button and the inner rotation surface; their different actions are not explained together.

Evidence: `Class2SummaryView.tsx:18–34,47–54,92–106,136,156–163`; `RubiksCube.tsx`, focusable educational cube; `useCubeReturnRotation.ts`, arrow-key handling. Intro and completion focus management already exist and should be retained.

Direction: define a predictable focus destination on start, matching, replacement, and card expiry. Keep focused cards available long enough to act or provide a stable keyboard selection surface. Make matching versus rotating discoverable without introducing duplicate ambiguous stops. Add focused component-level checks; manual keyboard/screen-reader checks remain permission-gated.

## R2-6 — Extend reduced-motion support to the review activity

**Type:** product/usability suggestion. **Impact:** medium. **Confidence:** confirmed code behavior; user discomfort is not measured.

The review's reduced-motion media rule disables only the completion overlay/content animations. The introduction still loops its falling numbers, moving hand, and pulsing cube; every selectable cube pulses indefinitely while a card is held. The JavaScript falling-card loop also continues unchanged. This differs from the lesson's reduced-motion treatment and the shared return-home hook, which already respect the preference.

Evidence: `Class2SummaryView.module.css:504–511,583–610,634–636`; `Class2SummaryView.tsx:55–70`; `Class2FaceArea.module.css:429–431`; `useCubeReturnRotation.ts`, `returnHome`.

Direction: provide a static or gently sequenced instructional example and remove nonessential scaling/hand travel under reduced motion. Consider stationary selectable numbers for that mode, preserving target availability and the same mathematical matching task. This changes presentation and pacing, so retain the ordinary mode unless a broader design change is approved.

## R2-7 — Decide how the game should help a student who remains stuck

**Type:** behavior question. **Impact:** medium. **Confidence:** confirmed current behavior; educational benefit of alternatives is unvalidated.

The learning phase builds from rows to addition to multiplication, offers three levels of help, and allows a child-paced concept reveal. The game accepts only totals and gives the same generic “Conte só os quadradinhos coloridos!” message after every mistake. It never offers the row guides, addition, or factor labels used in learning; a successful match is the only way to see that target's expression. Direct `Jogar` entry skips all teaching. Consequently a struggling student may keep guessing without receiving a more specific strategy.

Evidence: `ClassIcon.tsx`, `handleGameClick`; `Class2FaceArea.tsx:45–53`; `Class2SummaryView.tsx:18–34`; `class2Review.ts:97–110`; contrast with `class2Lesson.ts`, `lessonCubeProps` and `lessonHint`.

Decision: is review intended to be an independent fluency activity, or should it retain on-demand scaffolding? If independence is intentional, keep the current task and describe that expectation. If supported practice is intended, reuse optional row/factor cues after repeated difficulty or through a help control, without automatically revealing every answer. Record review assistance separately if introduced. Neither option is an approved change or a classroom-validated conclusion.

## Overall assessment and verified strengths

- The 13-question progression matches the documented equal-groups goal: row size/count, repeated addition, a child-paced multiplication reveal, full faces, partial rows, and an ordinary 6×6 transfer question. Factor meanings are consistent, numerical answers are correct, and multiplication distractors do not mark equivalent products wrong. The reveal does not prematurely disclose the following total.
- Hint masks preserve excluded rows. Requested help and real errors are separate; idle time only offers help. The 45-second help timer counts foreground ticks, and transition/hint timers are cleaned up on phase changes or unmount.
- The review's ten targets, five paired slots, delayed replacements, and 5×5-to-6×6 dependency agree with the documentation. Duplicate totals are accepted by value. Wrong matches preserve targets, selected numbers stop moving, and intro state prevents background play. Completion rejects later match actions.
- Cube drag suppression prevents pointer drags from being treated as matches, and keyboard arrows use the return-home controller. The review memoizes cube wrappers, avoiding sticker rerenders on ordinary card frames. This is a useful existing performance boundary; no broad architecture rewrite is warranted. Drag and assistive-technology behavior still need interactive verification.
- Menu entry and route constants are wired correctly; the menu prefixes image assets with `BASE_URL`. Class 2 itself introduces no external content dependency. Portuguese copy retains accents in the inspected source. Full application offline behavior was not tested.
- Analytics starts direct review on `Jogar` and learning on lesson entry. Completing the review closes the attempt with lesson plus review errors and separate assistance. Calling start again at the lesson-to-review boundary does not reset an active tracker. Requiring review completion for a lesson completion event is explicitly documented, not classified here as a bug.

## Checks and limitations

- `npm run test -- src/RubiksClass src/analytics`: **100 tests passed across 11 files**. Coverage includes lesson/review reducers, renderer static markup, Class 3 shared behavior, and analytics; it does not establish live Class 2 timer, focus, orientation, or pointer correctness.
- Scoped ESLint over `Class2_faceArea`, `RubiksCube.tsx`, `useCubeReturnRotation.ts`, `educationalCube.ts`, and `useCubeMobileLayout.ts`: **passed**.
- `npm run build`: **passed**. Vite reported the application-wide chunk-size warning (JavaScript approximately 808 kB before gzip); this does not identify Class 2 as its cause.
- Executed the current review reducer directly in Node using in-memory TypeScript transpilation, without adding tests/files, to confirm R2-1 and R2-2's coordinates.
- No browser, screenshots, Playwright, local preview, screen-reader session, or classroom validation was performed, following `AGENTS.md`. Layout consequences are explicitly hypotheses where they require visual inspection.
- The existing scoped working-tree changes were reviewed as current behavior; findings are not claims about which commit introduced an issue. Final status retained those source edits and unrelated work. Only this report and the pending recommendations were written for this task.
