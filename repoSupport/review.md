# Review guide

Use with [Repo Support](overview.md). Review the specific feature, change, or system the user names. Evaluate correctness and meaningful improvement opportunities, then report without modifying implementation by default.

## Procedure

1. Resolve the scope. For recent changes, establish the comparison or scoped working-tree changes; for a feature review, inspect the current feature even if there is no diff. Use any supplied plan or requirements.
2. Read the relevant implementation and trace affected callers, shared systems, state, and tests. Expand beyond changed lines where their behavior depends on existing code.
3. Apply the review lenses below where relevant. Look for evidence against a suspected issue before reporting it. Do not invent findings to fill categories.
4. Run proportionate permitted checks. Distinguish verified behavior, static reasoning, and untested hypotheses; report relevant pre-existing failures separately where established.
5. Create `reviews/review<N>.md` using the numbering rules in the overview.
6. Update [recommended changes](recommended-changes.md) with actionable summaries and separately identified unresolved behavior questions. Finish in chat with the key results and report path.

## Review lenses

### Correctness and integration

Look for clear bugs, regressions, invalid states, edge cases, error handling, cleanup/lifecycle problems, and performance concerns with a concrete impact. Evaluate relevant tests and missing coverage; do not write tests or fixes unless requested.

For Jogando, follow the affected paths rather than assuming all games share one architecture. As relevant, inspect local/AI/online behavior, server authority and move validation, room and classroom lifecycle, browser storage on shared school devices, analytics lifecycle/payloads, route and asset conventions, Portuguese text, and performance on modest hardware. Consult the corresponding project documents and verify their implementation claims.

For cross-system audits, compare implementations of the scoped concept, locate duplicated rules or conflicting definitions, and distinguish deliberate game-specific variation from accidental inconsistency. Trace usage before calling an old path abandoned.

### Code and architecture

Ask whether there is a materially better way to implement the feature given its needs and surrounding code. Consider responsibility boundaries, state ownership, coupling, duplication, unnecessary complexity, and opportunities to reuse existing components or logic.

Explain the concrete benefit and likely cost of a proposed change. Avoid broad refactors justified only by personal style, generic best practices, or hypothetical future requirements.

### Intended behavior

Compare with the user's request and supplied design, then relevant documentation, tests, and established surrounding behavior. None of these should be silently invented or treated as infallible.

When intent is uncertain, state the observed behavior and the condition under which it would be undesirable. Label it as a behavior question rather than a confirmed bug. Describe what decision would resolve the uncertainty.

### Product and usability

Consider conceptual improvements to interactions, feedback, learning flow, accessibility, and layout, not only code structure. Explain the user's difficulty and how the suggestion might help. Keep suggestions distinct from defects and educational claims distinct from validated results.

Browser verification, screenshots, Playwright, and local previews require explicit user permission for this task. Permission to review visuals is not automatically permission to operate a browser. Without visual inspection, label layout observations as hypotheses based on code. Lack of browser permission does not prevent useful code review.

## Report format

Use a descriptive title such as `# Review 1: Classroom room lifecycle` and a short scope line with date, inspected revision/comparison, and relevant uncommitted state.

Lead with the most consequential findings. Give each finding a stable identifier, such as `R1-1`, using a heading that supports a Markdown link. For each finding include, without unnecessary repeated labels:

- **Type:** bug, architecture improvement, behavior question, or product/usability suggestion.
- **Impact and confidence:** severity based on consequences (high/medium/low); confidence as confirmed, likely, or possible. Suggestions are not automatically defects.
- **Explanation:** trigger or situation, what happens, and why it matters.
- **Evidence:** relevant paths and symbols, plus line references or check results where useful.
- **Direction:** a recommended change or a decision needed, with material tradeoffs.

Finish with relevant checks and limitations. If there are no findings, say so within the reviewed scope. Avoid empty sections, exhaustive file lists, trivial stylistic nits, and claims that passing tests prove the whole feature correct. Concision must not remove the explanation needed to judge a finding.

## Maintaining recommended changes

- Add a brief actionable summary with the finding identifier and a direct link to its report heading. Keep the full explanation in the report.
- Keep unresolved behavior questions separate from recommended changes; do not disguise an undecided product choice as an approved task.
- Read the current list before editing. Merge duplicate pending recommendations and add the new supporting reference instead of making duplicate entries.
- Preserve unrelated entries. This file is a mutable pending list, not an append-only log. The user may remove implemented or rejected items.
- Do not refill the list from historical reports or automatically restore deleted recommendations. Add only findings from the current review that remain relevant; heed any supplied prior decisions.
- Reports remain as the evidence behind their numbered findings. A recommendation is not authorization to implement it.
