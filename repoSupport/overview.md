# Repo Support

Repo Support provides reusable procedures for documentation, code review, and repository investigation. Use it only when the user explicitly requests Repo Support. It is independent of the agent or model being used.

Read the repository's `AGENTS.md`, then load only the guide needed for the assigned task. The user's prompt supplies the objective and scope and can override the guide's defaults.

## Choose a guide

| Task | Guide | Default result |
|---|---|---|
| Update, create, or review documentation | [Documentation](documentation.md) | Documentation edits for update/create; findings in the chat for review; one documentation-log entry |
| Review code, behavior, architecture, or consistency | [Review](review.md) | Numbered review report and actionable entries in recommended changes |
| Understand existing behavior or investigate a future implementation | [Investigation](investigation.md) | Explanation in chat for understanding; numbered report for future implementation |

Infer the mode from the user's wording. Resolve approximate feature or document names by searching the repository. Ask only when ambiguity would materially change the work; do not require exact filenames or a formal task specification.

## Shared working rules

- Establish the relevant feature, files, and revision. For change-based tasks, identify the commit range, branch comparison, or scoped uncommitted changes. Do not assume every uncommitted file belongs to one feature.
- Inspect before concluding. Begin at likely entry points, trace references and integrations, and expand where evidence warrants it. Do not read the whole repository by default.
- Separate observed implementation, inference, intended behavior, and proposals. Code is evidence of what exists, not proof of what ought to happen. Documentation and tests can also be stale.
- Support consequential claims with repository-relative paths and important symbols, plus line references when useful. Verify usages before declaring code unused or isolated. Do not invent historical rationale.
- Preserve other work. Do not revert unrelated edits. If the inspected scope changes during the task, recheck affected conclusions or state the limitation. Concurrent editing tasks should use separate checkouts when necessary.
- Work autonomously within the requested scope. Do not implement product or architecture decisions merely because an investigation or review exposes them.
- Do not commit, push, deploy, or modify production code unless the user requests that work. Documentation mode may edit the relevant documentation; review and investigation may write their specified artifacts.
- Follow the repository's explicit-permission requirement for browser verification, screenshots, Playwright, and local previews. Without visual verification, label visual observations as code-based hypotheses.
- Use proportionate code-only verification. Discover current commands from package files. Available checks include root build, lint, and tests, and `npm --prefix multiplayer-server run check`. Run only relevant checks; report failures and verification limits accurately. Documentation-only work normally needs reference and content checks rather than an application build.
- Write clear English for internal guides and reports. Preserve Brazilian Portuguese and UTF-8 accents in application text and quoted examples.

## Finding project documentation

The existing documentation has not been migrated by this workflow. Start with the context index in `AGENTS.md`, then discover relevant documents, including ones absent from that index. If paths move later, locate their replacements rather than recreating stale locations.

| Current location | Role |
|---|---|
| `.agents/rules/game_*.md` | Game and lesson references; some combine current implementation, educational context, and future ideas |
| `.agents/rules/docs_general.md`, `docs_games_overview.md`, `docs_teacher_manual.md` | Project positioning, catalog, and pedagogical context |
| `.agents/rules/docs_multiplayer_backend.md`, `docs_classroom_system.md`, `docs_calculation_system.md`, `googleanalytics.md` | Shared-system implementation and extension references |
| `.agents/rules/multiplayer_private_rooms.md` | Original multiplayer plan; not the current implementation specification |
| `docs/` | Focused technical documentation, currently including the Rubik's cube component |
| `multiplayer-server/README.md`, `src/GameTemplate/README.md` | Operational and contributor instructions |

Treat each document according to its stated purpose and status. Product goals, accepted designs, and classroom validation cannot be established solely from source code. Reports are intermediate evidence, not permanent specifications.

## Artifact conventions

- [Documentation log](documentation-log.md): append one short entry per documentation task, including reviews with no edits.
- [Recommended changes](recommended-changes.md): editable list of pending review recommendations and unresolved behavior questions; not a historical log.
- `reviews/review<N>.md`: one report per code review.
- `investigations/investigation<N>.md`: one report per future-implementation investigation.

Each report series starts at 1 and increments independently: choose the highest existing number plus one. Check immediately before creating the file and never overwrite another report. Keep report files when recommendations are removed. Use a descriptive title inside each report, and record the date, task scope, and inspected revision/working-tree state. Keep content concise but explain each consequential point fully; omit empty template sections and routine search narration.

## Example prompts

- Use Repo Support to update the classroom documentation against the current implementation.
- Use Repo Support to review whether the game catalog and game documents agree. Report in chat.
- Use Repo Support to review the recent Bomb Game navigation changes, including architecture and usability.
- Use Repo Support to explain how classroom expiry works.
- Use Repo Support to investigate adding reconnection to online games. Identify integration points and decisions we need to make.
