# Playable tutorial system: implemented contract

Current implementation reference, consolidated October 6, 2026. The contract remains provisional until a second game integration. See [overview.md](overview.md) for teaching philosophy and [crown-chase.md](crown-chase.md) for the first complete integration.

## Responsibility boundary

| Layer | Implemented responsibilities |
|---|---|
| Shared session | Current activation, stage/phase metadata, guarded transitions, cancellable waits, pause/resume, and completion/dismissal recording when an identity is supplied. |
| Shared history | Identity/version keys, independent completion/dismissal flags, storage fallback, and filtering a caller-ordered list for unseen lessons. |
| Game integration | Lesson state, rules, intent classification, input locking, feedback, restoration, guidance, advancement conditions, visuals, and React cleanup. |
| Game navigation | Safe automatic entry, replay entry, validated return context, and isolation from active matches or rooms. Crown Chase implements this locally. |

The core does not infer whether an action is correct, advance a stage by itself, roll back game state, or render a tutorial. A dedicated page, external-store controller, or board adapter is a Crown Chase choice, not a shared requirement.

## Session API

Source: `src/Shared/Tutorial/TutorialSession.ts`.

`new TutorialSession(identity?)` accepts an optional `TutorialIdentity`. With no identity, finishing does not persist history.

| Member | Actual behavior |
|---|---|
| `start(stage): object` | Cancels the previous activation and waits, starts a new session, stores the stage and `active` phase, and returns a fresh activation token. |
| `current(token): boolean` | True only while this instance is running with exactly that token. |
| `enter(token, stage, phase = "active"): object \| null` | Rejects a stale token. Otherwise invalidates it and all pending waits, stores new metadata, and returns the replacement token. |
| `wait(token, milliseconds, callback): void` | Registers a wait only for a current token. Its callback runs only while that activation is still current. Negative durations are clamped to zero. |
| `setPaused(paused): void` | Suspends waits, preserving remaining duration. Waits created while paused stay unscheduled until resume. |
| `finish(token, outcome): boolean` | Rejects stale tokens; otherwise cancels the activation and records completion or dismissal if an identity exists. Cancellation records neither. |
| `cancel(): void` | Idempotently stops the session and invalidates all tokens/waits without history writes. |
| `stage`, `phase` | Metadata owned by the session. Phase values are `active`, `resolving`, and `transitioning`. |

Tokens are opaque and belong to one instance and activation. Save the replacement token after a successful `enter`; callbacks from previous stages must not transition with an obsolete token. Multiple waits can belong to one activation, but entering another activation invalidates all of them.

The session has no public terminal-state snapshot or subscription API. A game exposes any richer UI state, including completed screens and feedback phases. Crown Chase does this through its controller's `subscribe/getSnapshot`.

Pause state is retained across `start` and cancellation. The game chooses when to pause and owns its visibility listener. Crown Chase synchronizes visibility before starting and on `visibilitychange`. The shared pause affects all session waits; reduced-motion policy is also game-owned.

No `next`, `enterStage`, animation-promise runner, or automatic queue API exists. Those names from the old plan were conceptual.

## History API

Source: `src/Shared/Tutorial/tutorialHistory.ts`.

`TutorialIdentity` contains `game: string`, `scope: "core" | "mode" | "contextual"`, `version: number`, and optional `mode: string`. Supporting a scope tag does not implement the corresponding lesson flow.

| Export | Actual behavior |
|---|---|
| `tutorialKey(id)` | Generates `playable-tutorial:<game>:<scope>:<mode-or-empty>:v<version>`. |
| `readTutorialHistory(id)` | Returns independent `completed` and `dismissed` flags, combining valid stored history with the module's memory fallback. |
| `recordTutorialHistory(id, outcome)` | Sets the selected flag while retaining existing history; updates memory and attempts local storage. |
| `unseenLessons(lessons)` | Returns entries with neither flag set, preserving caller order. Does not launch, mount, chain, or navigate lessons. |

Unavailable or malformed storage does not block use of this API. Memory fallback lasts for the loaded app session; it is not durable across reloads. Callers should use these exports rather than assemble keys themselves.

Completion and dismissal can both be true, such as after a completed tutorial is skipped during replay. Replay does not clear earlier history. A materially new version has a distinct key; minor copy changes need not create a new version. Crown Chase currently uses `{ game: "crown-chase", scope: "core", version: 2 }`, stored as `playable-tutorial:crown-chase:core::v2`.

## Input, asynchronous work, and cleanup

A game distinguishes accepted actions, illegal attempts, legal alternatives, and neutral selections. The normal game rules remain the authority for legality. A UI that drops invalid targets before reporting them cannot give useful game-specific mistake feedback without an interception point.

Token guards protect delayed work, but do not replace synchronous input locking. A controller should not accept a second action while the first is resolving. Crown Chase updates its phase before scheduling any delayed work; its Board also receives the interaction lock.

Session-owned waits are invalidated by stage replacement, replay, finish, skip, or unmount cleanup. Listeners, non-session async work, and normal-game side effects remain the integration's responsibility. Progress should remain possible when motion is reduced or an animation event never arrives.

These are reliability requirements; the core does not prescribe whether a game retains an alternate move, previews it, or restores a fixture.

## React, routes, and normal-game isolation

The shared session is a plain TypeScript object. Crown Chase's controller publishes game-specific immutable snapshots to React's `useSyncExternalStore`. The page handles effect setup/cleanup, including StrictMode, visibility, navigation, and focus.

Crown Chase's `TutorialGate.tsx` is a game-owned wrapper in `App.tsx`, outside local/AI/lobby pages. It checks unseen history before their gameplay and room-participation logic mounts. Active Crown Chase online sessions bypass automatic onboarding; direct tutorial visits with an active room redirect to its lobby.

Crown Chase's `navigation.ts` validates intended destinations and AI difficulty. Router history carries return context through refresh. Session storage is a backup tied to that history entry, not a global return destination. Invalid/direct context falls back to the rules menu. Refresh restarts the lesson rather than restoring a partial practice board.

The shared core contains none of these route names or difficulty rules. Another game can use a different safe integration.

Practice should not trigger normal AI, room actions, rewards/unlocks, or normal-match victory analytics. Crown Chase isolates these by not mounting those gameplay components. The global page-view tracker still runs; isolation does not mean the whole page emits no analytics.

## Source map and verification evidence

Shared source and tests:

- `src/Shared/Tutorial/TutorialSession.ts` and `TutorialSession.test.ts`: activation, waits, pause/resume, cancellation, and history outcomes.
- `src/Shared/Tutorial/tutorialHistory.ts`: identity and storage behavior; history/lifecycle checks live in `TutorialSession.test.ts`.
- `src/Shared/Tutorial/tutorialEntryStorage.test.tsx`: blocked-storage entry dependencies and return validation.

Game-specific tests are indexed in the Crown Chase reference. The October 5 implementation checks recorded 52 passing tests across seven shared tutorial/Crown Chase suites, build, and targeted lint. The later visual refinement reran 14 rendered interaction checks and five orientation regressions. These are dated verification records, not a promise that every future edit has passed those checks.

Browser verification requires permission under `AGENTS.md`; it was explicitly authorized for Crown Chase. This documentation consolidation was checked against source and links; it does not claim new runtime or classroom validation.

## Current limits

There is no implemented Caça Soma tutorial, lesson-queue UI, shared tooltip/pointer library, contextual-help flow, lifecycle analytics API, or universal stage schema. The legacy `src/Shared/Components/DynamicTutorial.tsx` remains a separate explanation-overlay component used elsewhere.

Separate identities and unseen filtering provide useful building blocks for future modes or contextual lessons. Planned behavior is described in [roadmap.md](../plans/tutorials/roadmap.md).
