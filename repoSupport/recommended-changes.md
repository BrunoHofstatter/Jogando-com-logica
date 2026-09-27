# Recommended changes

Pending findings from Repo Support code reviews. This is an editable list, not a log or an approved implementation plan. Remove items when implemented or rejected; keep the original review reports. Do not automatically restore removed entries from older reports.

Each entry should contain a short actionable summary, its finding identifier (for example `R1-1`), and a link to the finding in `reviews/review1.md`. Merge duplicate pending recommendations. Keep the full explanation in the report.

## Recommended changes

- **R1-1:** Validate Bomb Game socket envelopes before destructuring or string operations to prevent uncaught exceptions. [Review](reviews/review1.md#r1-1--validate-socket-payloads-before-destructuring-and-string-operations).
- **R1-2:** Show active-match partner disconnections, disable disconnected Level 1 controls, cancel pending input, and provide a clear lobby exit. [Review](reviews/review1.md#r1-2--make-disconnection-visible-and-stop-accepting-local-input).
- **R1-3:** Synchronize countdown displays with server time rather than assuming matching device clocks. [Review](reviews/review1.md#r1-3--base-displayed-time-on-a-synchronized-server-clock).
- **R1-4:** Respect hints-off for manual calculation highlighting. [Review](reviews/review1.md#r1-4--disabling-hints-still-highlights-the-manuals-answer-calculations).
- **R1-5:** Improve numeric-field focus, exit-dialog keyboard behavior, and accessible error/status feedback. [Review](reviews/review1.md#r1-5--improve-keyboard-focus-and-accessible-feedback).
- **R1-6:** Add meaningful Level 1 lifecycle, generation, role-projection, and input-timer coverage. [Review](reviews/review1.md#r1-6--add-level-1-coverage-at-the-actual-failure-boundaries).


- **R2-1:** Guard Class 2 review spawning while all active targets are temporarily absent, and cover delayed final-slot replacement. [Review](reviews/review2.md#r2-1--prevent-spawning-from-an-empty-target-pool-during-replacement).
- **R2-2:** Preserve review card travel/lane coordinates across desktop/portrait changes, including held cards. [Review](reviews/review2.md#r2-2--remap-card-coordinates-when-the-layout-changes-orientation).
- **R2-3:** Provide explicit incorrect-answer feedback after Class 2 reaches its hint cap. [Review](reviews/review2.md#r2-3--give-incorrect-answers-feedback-after-the-last-hint).
- **R2-4:** Fix the CSS cascade overriding Class 2's single-column addition choices. [Review](reviews/review2.md#r2-4--restore-the-addition-choices-intended-css-layout).
- **R2-5:** Preserve keyboard focus when review controls disappear and clarify cube matching versus rotation. [Review](reviews/review2.md#r2-5--preserve-keyboard-focus-through-review-transitions).
- **R2-6:** Extend reduced-motion handling to the Class 2 review introduction, cube pulses, and moving numbers. [Review](reviews/review2.md#r2-6--extend-reduced-motion-support-to-the-review-activity).


- **R3-1:** Preserve native Enter activation and scope written-calculation keyboard shortcuts to their intended controls. [Review](reviews/review3.md#r3-1--scope-calculation-keyboard-handling-to-the-intended-control).
- **R3-2:** Make automatic arithmetic hint escalation monotonic, avoid counting repeated reveals, and pause timers while the page is hidden. [Review](reviews/review3.md#r3-2--keep-adaptive-arithmetic-hints-monotonic-and-foreground-aware).
- **R3-3:** Give visible and announced rejection feedback for wrong Class 3 choices even after all hints are open. [Review](reviews/review3.md#r3-3--acknowledge-wrong-choices-after-the-last-hint).
- **R3-4:** Preserve a bottom-visible endpoint in the reduced-motion vertical cube demonstration. [Review](reviews/review3.md#r3-4--make-the-reduced-motion-bottom-cue-reach-a-bottom-facing-view).
- **R3-5:** Add accessible face inspection and meaningful calculation-cell names/values without revealing the lesson answer automatically. [Review](reviews/review3.md#r3-5--expose-the-inspected-face-to-assistive-technology).


## Unresolved behavior questions

- **R1-7:** Keep predictable operator solutions for onboarding, or vary them to sustain cooperation on replay? [Review](reviews/review1.md#r1-7--decide-whether-fixed-operator-answers-meet-the-cooperation-goal).
- **R1-8:** Retain life-costing submission after two seconds of inactivity, or require explicit confirmation? Define selector-reopening behavior too. [Review](reviews/review1.md#r1-8--decide-whether-two-seconds-without-typing-should-commit-a-life-costing-answer).
- **R2-7:** Keep Class 2 review as independent practice, or offer optional row/factor help when students remain stuck? [Review](reviews/review2.md#r2-7--decide-how-the-game-should-help-a-student-who-remains-stuck).
- **R3-6:** Decide whether Class 3 completion counters should include procedural misclicks/repeated help requests or only mathematical errors/distinct support reveals. [Review](reviews/review3.md#r3-6--decide-what-the-completion-counters-mean).
