# Investigation guide

Use with [Repo Support](overview.md). Investigate existing repository evidence, either to explain something or to prepare a future implementation. No external research guide is part of this workflow.

## Shared procedure

1. Identify the user's question or goal and select the mode below. Inputs may be a specific question, broad improvement idea, rough draft, or conceptual design with no technical details.
2. Locate the relevant implementation and documentation. Trace entry points, state ownership, data flow, callers, configuration, and tests as needed to answer the question.
3. Expand into shared systems and integrations when evidence makes them relevant. Do not assume a game uses the shared board engine or that similar game flows have identical requirements.
4. Separate observed implementation, inferred constraints, possible approaches, and decisions the user has already made. Verify consequential claims and acknowledge meaningful unknowns.
5. Produce the mode's output. Do not modify implementation, permanent documentation, or the review recommendations list unless requested.

## Mode 1: Understand something

Use when the user wants to understand current behavior, trace a bug, locate a calculation or dependency, or learn what would be affected by a change.

- Answer the specific question directly in the chat thread by default. No Markdown report file is required unless requested.
- Explain the relevant flow and responsibilities at the level the user needs. Include paths and symbols where they help verify or continue the investigation.
- Distinguish what the system does from why it was historically designed that way. Use history only when relevant and available; do not invent motivation.
- For bug investigation, separate a reproduced or proven cause from a plausible hypothesis and describe what would settle the remaining uncertainty.
- Stop when the question is reliably answered; do not turn an explanation into a general feature review or redesign.

## Mode 2: Prepare a future implementation

Use when the user wants to understand how an idea could fit the current code before planning or implementation.

### What to investigate

- Restate the goal briefly and identify supplied requirements versus assumptions. Do not require a complete design before doing useful investigation.
- Map the relevant current behavior, source entry points, responsibilities, interfaces, state, persistence, and integrations.
- Identify reusable pieces, likely extension points, and existing behavior that would need to change.
- Explain constraints and risks supported by the repository. In this project these may include server authority, room/classroom lifecycle, shared browser storage, game-specific modes, lesson flows, analytics, deployment boundaries, and school-device performance. Include only relevant subjects.
- Describe plausible approaches and their tradeoffs where useful. Recommendations are allowed, but mark unapproved choices clearly; do not silently settle product or architecture decisions.
- Surface missing decisions with their consequences. For example, whether returning players recover their role may determine how identity and room state survive a disconnect.
- Separate decisions that block implementation from details that can reasonably be settled while coding. Prioritize consequential questions rather than producing an exhaustive questionnaire.
- Identify important uncertainties and a practical way to resolve them, such as a focused code check, user decision, or later permitted experiment. Do not implement a prototype by default.

### Output

Create `investigations/investigation<N>.md` following the independent numbering rules in the overview. Use a descriptive title and record date, scope, inspected revision, and relevant working-tree state.

Organize the report around what the next reader needs, adapting or omitting sections as appropriate:

1. **Assessment:** how the idea fits and the most important implications.
2. **Current system:** a focused map with source paths and symbols, enough to locate and verify the key behavior.
3. **Possible approaches:** reuse, likely changes, integrations, and meaningful tradeoffs.
4. **Decisions needed:** consequential open questions, why they matter, and which block implementation.
5. **Uncertainties and next steps:** remaining evidence gaps, relevant checks already performed, and how to proceed.

Keep the report concise but explain each substantial point fully. Do not create a speculative file-by-file implementation plan unless requested. The report prepares later discussion and planning; it is not an approved specification. Finish in chat with the main implications and the report path. A later implementing agent should verify consequential findings against the then-current source.
