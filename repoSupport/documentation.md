# Documentation guide

Use with [Repo Support](overview.md). The user's prompt selects update, create, or review mode. Documentation should let a person or agent understand a system's important behavior, purpose, and integration points without reconstructing it from source first.

## Shared procedure

1. Identify the requested subject, documents, and mode. Locate approximate document names and check related references before creating a duplicate.
2. Establish each relevant document's purpose and status: current implementation, project context, operational instructions, accepted design, tentative plan, or history.
3. Read the relevant implementation and trace its callers, shared components, configuration, and tests where needed. References already in the document are starting points, not the complete search scope.
4. Separate factual corrections from questions of intended behavior. Do not turn an apparent bug into an intended rule by rewriting the documentation. Describe the observed behavior and conflicting requirement explicitly when needed.
5. Follow the mode below, check references and affected summaries, then append one brief entry to [the documentation log](documentation-log.md).

## Mode 1: Update existing documentation

Use when the user asks to bring existing documentation into agreement with current code, including after a feature change.

- Identify which sections are obsolete, incomplete, or newly relevant. Update or add text while preserving useful structure and reasoning.
- Verify behavior beyond the diff when necessary to explain the completed feature accurately.
- Update directly affected links and summaries within scope. Surface broader unrelated problems instead of silently expanding the task.
- Preserve clearly labeled plans and accepted requirements. Do not erase them merely because implementation differs or is incomplete.
- Leave unresolved product, historical, or pedagogical claims explicit rather than guessing. Complete independent factual updates without waiting on those questions.
- Summarize changed files and unresolved points in chat. No separate report is required.
- Only update the file if user asks to edit the documentation, if not present the reccomended changes in the chat thread

## Mode 2: Create new documentation

Use when the user asks to document an undocumented feature or part of the codebase.

- Check whether extending an existing document would better serve the subject. Avoid creating a second primary explanation of the same system.
- Inspect the implementation and choose a clear scope and appropriate document type.
- Put new permanent documentation in `docs/` by default, using a descriptive filename. Follow a user-specified location; do not migrate existing documents as a side effect.
- Explain purpose, current behavior, important responsibilities and interfaces, limitations, and useful source entry points. Include examples only where they clarify use.
- Link the new document from the relevant existing overview or context index so it can be discovered.
- Summarize the new coverage and any unknowns in chat.

## Mode 3: Review documentation consistency

Use when the user asks whether several documents agree or whether documentation is organized coherently.

- Compare claims, terminology, status labels, coverage, duplicated explanations, and references across the scoped documents.
- For conflicts about current behavior, inspect the relevant code to determine which claim is supported. Do not decide correctness by document age or apparent authority alone.
- Report directly in the chat thread: the conflicting claims and locations, supporting evidence, recommended correction, and any unresolved decision. Also report useful organization recommendations.
- Review alone does not edit the reviewed documents. If the user also asks to fix/update them, apply the update procedure within the same task; no separate invocation is necessary.
- If no conflicts are found, say so for the inspected scope without claiming universal correctness. Record the review in the documentation log even when no files were changed.

## Writing standards

- State purpose and scope early. Use headings that help a reader answer practical questions.
- Distinguish current implementation, accepted future design, tentative ideas, and historical decisions. Mixed documents may use labeled sections; separate files are not mandatory.
- Document behavior and contracts: inputs, outputs, ownership, state transitions, constraints, and consequential edge cases. Avoid line-by-line code narration or inventories of every helper.
- Explain important choices when their rationale is supported. Mark inference as inference; do not invent a reason from implementation alone.
- Reference important paths and symbols. Keep copied code small and necessary; prefer links to implementation over large snapshots that will drift.
- Give each subject one primary home. Related documents should summarize and link rather than repeat detailed explanations.
- Keep detail proportional to the subject. Use a flexible structure appropriate to implementation references, game/lesson descriptions, operational instructions, or design proposals.
- Distinguish recommended grade ranges and educational benefits from classroom-validated results. Source code cannot establish educational validation, outreach status, or user intent.
- Preserve meaningful history and future ideas with clear labels. Do not retain obsolete instructions as though they still apply.
- Internal Markdown documentation and teacher-facing React content have different editing scopes. Updating `/manual` or a rules page changes the application; documentation-only tasks do not authorize those edits by default.

## Organization standards

Consider organization during all modes, especially review:

- Split a document when distinct subjects would be easier to find and maintain separately, not solely because it is long.
- Merge documents when they cover the same responsibility or force readers through fragmented explanations.
- Consolidate repetitive material into its primary document and use links elsewhere.
- Recommend removing obsolete or redundant files only after identifying any unique reasoning, plans, or useful history to preserve.
- Check whether filenames, folders, indexes, and links make the intended reading path clear.

Review mode recommends restructuring in chat. Update/create mode may make small organizational improvements within scope. Broad moves, splits, merges, or deletions require the user to request that restructuring. When authorized, preserve useful content and update incoming references, including agent instructions and indexes. Keep permanent project documentation in `docs/`; keep agent instructions, skills, and Repo Support workflows in their dedicated locations.

## Final checks

Read the final document or findings for unsupported claims and accidental mixing of plans with current behavior. Verify referenced paths and symbols, changed links, and affected summaries. Check the diff for unintended edits and encoding damage. Log the date, mode, documents changed or reviewed, and a short description of the result; do not log every edit separately.
