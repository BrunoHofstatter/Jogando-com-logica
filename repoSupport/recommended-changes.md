# Recommended changes

Pending findings from Repo Support code reviews. This is an editable list, not a log or an approved implementation plan. Remove items when implemented or rejected; keep the original review reports. Do not automatically restore removed entries from older reports.

Each entry should contain a short actionable summary, its finding identifier (for example `R1-1`), and a link to the finding in `reviews/review1.md`. Merge duplicate pending recommendations. Keep the full explanation in the report.

## Recommended changes

- **R3-3:** Give visible and announced rejection feedback for wrong Class 3 choices even after all hints are open. [Review](reviews/review3.md#r3-3--acknowledge-wrong-choices-after-the-last-hint).
- **R3-4:** Preserve a bottom-visible endpoint in the reduced-motion vertical cube demonstration. [Review](reviews/review3.md#r3-4--make-the-reduced-motion-bottom-cue-reach-a-bottom-facing-view).
- **R3-5 (remaining):** Add accessible face inspection without revealing the lesson answer automatically. The new Class 3 calculator now names cells by place and value. [Review](reviews/review3.md#r3-5--expose-the-inspected-face-to-assistive-technology).

## Unresolved behavior questions

No pending questions. The approved Class 3 calculator rework counts settled wrong
entries/unsuccessful checks and distinct revealed support levels, excluding cell
selection and repeated help. Current details are in
[`docs_calculation_system.md`](../.agents/rules/docs_calculation_system.md).
