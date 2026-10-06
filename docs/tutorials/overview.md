# Playable tutorials: overview and philosophy

Current reference for the playable tutorial system. Consolidated October 6, 2026.

## Reading this folder

| Document | Purpose |
|---|---|
| [technical-contract.md](technical-contract.md) | Implemented shared APIs, ownership, lifecycle, history, and technical limits. |
| [crown-chase.md](crown-chase.md) | Crown Chase's implemented lesson, its decisions, and the relevant source files. |
| [next-tutorials.md](../plans/tutorials/next-tutorials.md) | Flexible considerations and lessons useful when designing other games' tutorials. |
| [roadmap.md](../plans/tutorials/roadmap.md) | Future possibilities, explicitly separated from current capabilities. |
| [caca-soma-outline.md](../plans/tutorials/caca-soma-outline.md) | A tentative non-board compatibility example, not an implemented or approved lesson. |

This overview and the first three linked documents are the four main references. They replace the old overall/core planning documents. Source code remains authoritative for implemented behavior. Future proposals belong in the roadmap or a clearly marked game proposal.

## What exists today

The shared foundation in `src/Shared/Tutorial/` provides a small session lifecycle and local completion/dismissal history. Crown Chase is the first complete playable integration, with an isolated tutorial route, automatic first-entry launch, explicit replay, real gameplay actions, guidance, and safe return to play.

The shared foundation has not yet been validated through a second game's implementation. It has no universal stage schema, automatic lesson queue, or shared visual theme. Its provisional contract is documented separately.

Session execution and history stay local and require no tutorial service or login. Keeping the shared layer small and the scenarios lightweight helps the existing offline platform remain usable on school computers.

Other games' existing explanation overlays are not automatically converted by this system. Caça Soma's outline is future design material, not a shipped integration.

## Purpose and audience

Jogando com Lógica serves children ages 8-13, including Brazilian public-school students using shared devices and slower computers. A playable introduction should help a child begin a real game with confidence through a few understandable actions. All child-facing copy is Brazilian Portuguese.

The tutorial is an introduction, not a complete rulebook. Detailed rules and later help can explain exceptions, strategy, and secondary systems when they become relevant.

These are product principles and design intentions. Learning effectiveness, reading durations, and age suitability have not been validated in classroom use.

## Learn through actions

A useful teaching moment connects an instruction to something the child can immediately do or observe. Performing a move or submitting an answer gives concrete meaning to the rule. Success should follow the relevant action rather than a button that merely claims the child understood.

A stage can also be an observation or explanation. A stationary king, for example, is clearer when the child sees it in context. The learning need determines whether to advance by action, acknowledgement, a brief timer, or another game-specific condition.

## Keep the initial load small

Focus on the minimum knowledge needed to start. Short copy and a small number of visible objects help the child connect attention to the current concept. Use emphasis on meaningful words and point to the relevant object when that helps.

Short text should still explain what the child needs to act. The goal is clarity, not removing necessary guidance. Introduce concepts at an understandable pace rather than combining every rule into the first screen.

Crown Chase begins with one selected piece and adds a capture opportunity after movement. This is one application of the principle, not a required structure for every game.

## Preserve familiarity with the real game

Reuse actual rules, controls, assets, and visual proportions wherever appropriate. The child should recognize what was learned when normal play begins. A simplified scenario can contain fewer pieces or a chosen target while retaining the real meaning of a move or answer.

Reusing a renderer alone does not guarantee visual equivalence: sizing parents, grid tracks, margins, borders, and animation wrappers can change its proportions. Crown Chase exposed this problem, and its tutorial now inherits the normal board and token geometry.

## Let attempts teach

A move can be legal yet miss the exercise objective. Explain or respond to that difference without teaching a false rule. Neutral input, such as deselecting a piece, is also different from a meaningful unsuccessful attempt.

An alternate action might remain on the board, lead to a reconstructed opportunity, or be previewed and restored. The choice depends on what the scenario teaches. Feedback should make the next useful action understandable and keep the objective achievable.

Additional guidance can draw attention to a destination or explain the next action. It should support the child's attempt. Repeated mistakes should not silently count as completing an action the child has not performed.

## Make feedback easy to notice and easy to recover from

Keep the ordinary instruction close to its subject. A temporary correction can have stronger visual hierarchy when the child needs to notice it immediately. Avoid making every minor mistake require extra confirmation if automatic recovery communicates the result clearly.

Reading speeds vary. Important instructions generally stay available while the child acts. Timed observations or feedback need a considered duration and should not disappear while the page is hidden. Manual acknowledgement remains useful where the material needs it.

Crown Chase's two-second correction and three-second observation are specific design choices. They are not universal reading deadlines for other games.

## Use controlled situations honestly

A deterministic scenario makes the teaching opportunity dependable and easier to verify. Supporting objects can be positioned to preserve that opportunity after different player actions.

Separate practice exercises and continuous miniature matches are both possible. A continuous match needs a legal sequence and believable continuity. New fixtures should read as new exercises rather than imply opponent moves that never happened.

A small lesson does not inherently need competitive AI. Crown Chase uses deterministic support placement because the purpose is to offer a capture or jump opportunity.

## Keep the child in control of entry and exit

Introductory tutorials should be discoverable, skippable, and replayable. Automatic launch can help on first entry, but local history describes this browser, not the identity or knowledge of the child now using it.

Completion and dismissal have different meanings. Replay should preserve earlier completion history. Normal gameplay should begin cleanly, without tutorial positions, simulated rewards, pending moves, or network participation carrying over.

An active online game is a poor place to interrupt play for local onboarding. A game needs an entry point that preserves existing room participation.

## Consistency without forcing identical lessons

The shared system coordinates activation, cancellation, delayed work, and history. Each game owns its rules, teaching sequence, state, input interpretation, feedback, guidance, and presentation.

Reliable lifecycle behavior is common across games; Crown Chase's colors, pointers, preselection, stage count, and thresholds belong to Crown Chase. A number-selection game can teach through its own interaction instead of adopting a board-game structure.

Useful new shared behavior should follow a concrete need. The next integration may reveal changes worth making to the provisional contract; it should not require a large generic architecture in advance.
