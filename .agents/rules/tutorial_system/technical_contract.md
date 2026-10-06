# Playable tutorial technical contract - V0

Updated October 5, 2026 for the Crown Chase redesign. V0 remains provisional until a second game integration. The shared API coordinates lifecycle; game integrations own their pedagogy and rendering.

## Shared Layer

`src/Shared/Tutorial/tutorialHistory.ts`: identity is game/scope/version, with optional mode id. Completion and dismissal are independent, corrupt/unavailable storage falls back to memory, and replay preserves history. `unseenLessons` filters a caller-ordered list for future core/mode chaining; it does not mount games or navigate.

`src/Shared/Tutorial/TutorialSession.ts`: a small non-React lifecycle object. `start(stage)` creates an activation; `enter(token, stage, phase)` consumes the previous activation; `finish(token, outcome)` records completion/dismissal or cancels without persistence. Every accepted transition invalidates pending waits and old callbacks. `wait(token, milliseconds, callback)` invokes only while its activation is current. `cancel()` is idempotent and clears waits.

`setPaused(boolean)` suspends pending waits, retaining each wait's remaining duration. New waits created while paused remain unscheduled until resume. Games connect this to visibility when required. Pause never grants stale callbacks a new activation or persists completion.

The shared core does not classify moves, choose feedback durations, restore boards, prescribe acknowledgement buttons, or render pop-ups.

## Crown Chase Integration

`src/CrownChase/Tutorial/lesson.ts` owns deterministic practice fixtures, support placement, objective discovery, and illegal-attempt explanations. It validates/applies player moves with the existing v2 engine. Internal `killer` is retained while UI names it `Ninja`.

`CrownChaseTutorialController` owns canonical/preview board state, synchronous locking, attempt counts, guidance, movement/spawn visuals, timed observation, automatic retry, and seven-stage ordering. Its immutable external-store snapshot exposes stage, phase, board, feedback, guidance, attempts, revision, movement, and spawned position. All delays belong to a shared-session activation; disposal cancels them.

The stages are separate exercises, not a simulated competitive match:
1. Any Ninja move from center.
2. Capture a deterministically placed adjacent red Ninja.
3. Any Saltador step from center.
4. Jump over adjacent support, followed by three visible seconds observing that it remains.
5. Stationary kings with manual Continue.
6. Jump over Ninja to capture red king; a second pop-up explains losing one's own king.
7. Complete original starting board, replay/play controls.

Alternate legal moves in stages 2/4 remain visible and support is repositioned to keep the objective possible. Stage 6 previews alternate legal moves, shows centered feedback for two visible seconds, and automatically returns to its fixture. Illegal moves do not mutate state. After two meaningful failed attempts, mark the legal objective gold; after three, add a move arrow and short guidance. No objective is auto-skipped.

The existing Crown Chase Board has an optional practice adapter for raw intent interception, selection feedback, automatic selection, gold targets, movement/spawn visuals, and a board-local overlay. It inherits all original board/tile/token geometry without grid-size/aspect-ratio overrides. Animation wrappers use `display: contents`; token motion uses original cell pitch. Normal mode behavior remains the default. Purple pop-ups use the game's white/purple-outlined lettering with softer red emphasis, while centered retry feedback retains plain text. Tutorial/skip controls occupy top-left; a lightbulb hint button occupies top-right below Home. Buttons support hover, press, and keyboard focus.

The page owns routing, React/StrictMode lifecycle, keyboard focus, and visibility subscription. `TutorialPointers.tsx` measures actual rendered pop-ups/cells and observes resize to position SVG pointers. Short pointing pop-ups replace the persistent panel; centered feedback has stronger hierarchy. Reduced motion removes cosmetic waits/animations while keeping observation/feedback reading durations.

## Entry, History, and Exit

The route gate wraps local, AI, and online lobby pages before they mount. Active online sessions bypass onboarding. Dedicated tutorial navigation uses validated return context in router history state; session storage is a backup scoped to that history entry. Invalid context returns to the rules menu. AI difficulty is checked against unlocked levels.

Crown Chase identity is `crown-chase.core.v2`. Completion persists after the final successful legal king-capture visual, then the complete normal starting board is shown. Skip persists dismissal and navigates. Navigation/unmount cancels without persistence. Replay retains previous history. No normal AI, progression, match analytics, or multiplayer hooks mount for the lesson; normal play initializes its own state.

## Verification Boundary

The targeted suite contains 52 passing tests across seven files, including existing Crown Chase regressions. Tests cover all initial move branches, every-square support legality, timed observation/feedback, automatic rollback, hint escalation, paused waits, stale/double inputs, cancellation/replay, route gates/return validation, blocked storage, and rendered keyboard interactions in jsdom. Production build and targeted lint pass.

The user authorized browser verification for this redesign. Responsive rendering and interactions are checked separately from code tests. Classroom learning effectiveness remains unvalidated.
