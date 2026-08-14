# Playable Tutorial Core System - V0 Plan

## Status

Planning only. This document defines the intended responsibilities and design direction for Core V0. It is not a description of existing code, and its provisional technical names are not a finalized API.

The current `src/Shared/Components/DynamicTutorial.tsx` is an explanation overlay with step navigation, target positioning, spotlight visuals, and local completion storage. The new playable system is a separate architectural concept. Useful presentation logic may be reused, but the existing component should not be expanded into a universal game engine.

## Goal

Provide a small shared foundation that coordinates tutorial sessions while allowing each game to create a highly customized, playable lesson.

The core should make recurring lifecycle behavior reliable. It should not decide how a specific game teaches.

## Core Principle

> Shared lifecycle and capabilities; game-owned pedagogy and gameplay.

Consistency across games comes from predictable entry, exit, replay, completion, and progression behavior. It does not require identical tooltips, hint systems, animations, or scenario structures.

## Goals

- Support tutorials in which the player performs real game actions.
- Support meaningful wrong attempts without automatically progressing.
- Allow the game to provide specific feedback and restore its canonical tutorial state.
- Support manual, action-based, timed, animation-based, and custom advancement.
- Support scripted bridges and time lapses without placing game-state simulation in the core.
- Track core tutorials and mode introductions separately.
- Launch automatically once and remain replayable.
- Keep the system usable by both shared-engine board games and fully custom games.
- Allow future short contextual lessons to use the same session foundation.
- Work offline, remain lightweight, and behave safely on slower school computers.

## Non-Goals

- A universal schema describing every game's actions, hints, animations, or mistakes.
- Moving non-board games into `AA_baseGame`.
- Generating tutorial scenarios automatically.
- Randomized introductory tutorials.
- Multiple tutorial difficulty levels.
- Teaching every rule, scoring detail, strategy, or edge case.
- Designing the future `Por que isso aconteceu?` feature now.
- Making all games use the same visual presentation.

## Responsibility Boundary

### Shared Core Owns

- Tutorial identity, scope, and version.
- Session status and current stage identity.
- Starting, completing, skipping, cancelling, and replaying a session.
- Moving between stages when the game signals that progression is appropriate.
- Cancellable timers or waits used by tutorial flow.
- Waiting for a game-owned animation or scripted bridge to finish.
- Completion/dismissal persistence.
- Chaining a core tutorial into a selected mode introduction.
- Safe cleanup of shared timers and subscriptions.
- Optional shared presentation primitives.
- General lifecycle events that may later support analytics.

### Individual Game Owns

- What the child must learn.
- Tutorial game state and scenario configuration.
- Which actions are meaningful during each stage.
- Correct, incorrect, and irrelevant attempt classification.
- Whether an incorrect attempt is fully performed, previewed, or rejected.
- Mistake animation, explanation, and state restoration.
- Canonical state snapshots or reconstruction.
- Exact text, visuals, highlighting, pointers, sounds, and hints.
- Hint escalation and hesitation behavior.
- Scripted moves and time-lapse presentation.
- Game rules, win behavior, timers, AI, and normal-mode isolation.
- When a custom stage is ready to advance.

### Optional Shared Presentation Owns

Reusable presentation should be available without being mandatory.

Possible primitives:

- Message or tooltip container.
- Spotlight or target highlight.
- Backdrop.
- Next and Skip controls.
- Short transition message container.
- Progress indication, only if later shown to be useful.

Games may style, compose, replace, or bypass these primitives. The shared core must not require CSS selectors or a tooltip for every stage.

## Conceptual Architecture

The system should have four conceptual layers.

### 1. Tutorial Definition

Identifies a tutorial and its ordered stages at a high level.

Minimum concepts:

- Game identifier.
- Tutorial scope: `core`, `mode`, or later `contextual`.
- Scope identifier, such as a mode name.
- Version.
- Ordered stage identifiers.
- Optional next tutorial to launch after completion.

It should not become a large object containing every possible game behavior.

### 2. Tutorial Session Controller

Owns the active session lifecycle and exposes a small set of commands.

Provisional capabilities:

- `start`
- `enterStage`
- `next`
- `complete`
- `skip`
- `cancel`
- `wait`
- `waitForTransition`

Exact names will be decided after the Crown Chase storyboard. The important direction is that games explicitly signal progression instead of the core trying to infer gameplay meaning.

### 3. Game Integration

Connects the session controller to a specific game's state and UI.

The integration is responsible for:

- Entering a clean tutorial mode.
- Preparing the stage state.
- Receiving gameplay attempts.
- Showing the attempt and classifying its result.
- Calling `next` only after the teaching requirement is satisfied.
- Running transitions and resolving them when finished.
- Restoring or reconstructing state after mistakes.
- Exiting without leaving tutorial state, timers, AI actions, or selections behind.

This may be a hook, adapter, controller, or page-level integration depending on the game's architecture. All games do not need the same internal implementation shape.

### 4. Persistence

Stores whether a tutorial version has been completed or dismissed on the current device.

Persistence must remain local and offline-compatible. Core tutorials and mode introductions use separate identities.

Conceptual identities:

- `caca-soma.core.v1`
- `caca-soma.levels.v1`
- `caca-soma.versus.v1`
- `crown-chase.core.v1`

The exact storage key format is an implementation decision. Callers should not manually assemble localStorage keys throughout game pages.

## Session Lifecycle

Provisional session states:

1. `idle`: no active lesson.
2. `entering`: the game is preparing tutorial mode or a stage state.
3. `active`: the player can read or make an attempt.
4. `resolving-attempt`: the game is showing feedback or restoring state.
5. `transitioning`: a scripted bridge, time lapse, or other non-interactive transition is running.
6. `completed`: all required teaching stages finished.
7. `skipped` or `cancelled`: the session ended without completion.

These states are conceptual. Some may be combined during implementation if that keeps the API smaller without losing safe behavior.

### Lifecycle Requirements

- Only one tutorial session should control a game screen at a time.
- Normal AI, online events, turn timers, and other autonomous behavior must not interfere with tutorial mode.
- Shared waits and timers must be cancellable when the player skips, navigates away, or restarts.
- A late animation or timer callback must not advance an inactive session.
- Starting replay begins from a clean tutorial state.
- Refreshing or leaving mid-tutorial should not mark it completed.
- Game cleanup runs on completion, skip, cancellation, navigation, and unexpected unmount.

## Stage Advancement

The core should support several ways to finish a stage without forcing every stage into a separate rigid type.

### Manual Advancement

Used when the child only needs to read an important explanation, such as a scoreboard or objective.

- Normally waits for `Próximo`.
- May enforce a short minimum display time if a game needs to prevent accidental double taps.
- Important text should not automatically disappear by default because reading speeds vary.

### Player-Action Advancement

Used when the child must perform an action.

- The game receives and evaluates the attempt.
- A correct attempt may advance after its success feedback or animation.
- An incorrect attempt keeps the same stage active.
- The core does not decide what counts as correct.

### Timed Advancement

Used mainly for brief success feedback or transitional messages.

- The game chooses the duration.
- The wait must be cancellable.
- Timers should not be the default for essential instructions.

### Animation or Scripted-Bridge Advancement

Used when the game needs to communicate that play continued between teaching situations.

- The game owns the moves, visuals, duration, and resulting state.
- The core marks the session as transitioning and waits for completion.
- Player interaction is normally disabled during the bridge.
- Long sequences may compress unimportant moves; continuity matters more than displaying every intermediate turn.
- Reduced-motion or instant fallback behavior should be considered during implementation.

### Custom Advancement

Allows a game to signal completion from any game-specific condition not covered above.

This escape hatch is required. It should not require adding a new shared stage type for every unusual mechanic.

## Attempts and Mistakes

Meaningful mistakes are part of the teaching experience.

The intended flow is:

1. The player makes a meaningful attempt.
2. The game visibly acknowledges or performs it.
3. The game gives short, specific feedback relevant to that mistake.
4. The tutorial restores or reconstructs the canonical stage state when needed.
5. The same teaching objective remains active.

The shared core only prevents stage progression and coordinates session status. It does not own rollback or feedback content.

For board games, the safest approach may be to intercept an attempt before permanent engine mutation, or execute it against a cloned tutorial state and control the visible restoration. The correct integration will be decided during the Crown Chase design and vertical slice rather than added generically to `GameEngine` in advance.

Irrelevant actions that would leave or break the tutorial scenario may be blocked or ignored. The requirement to allow mistakes applies to meaningful gameplay attempts, not unrelated navigation or mode changes.

## Predetermined States and Scripted Bridges

- Introductory scenarios should be deterministic.
- Games choose pedagogically useful states rather than relying on normal random generation.
- The tutorial may feel like one miniature match even when the game internally prepares controlled states.
- A scripted bridge should explain continuity, for example with a brief `Algumas jogadas depois...` transition.
- The game may animate only the important changes when showing every intermediate move would be slow or confusing.
- State preparation and scripted move legality belong to the game integration, not the shared runner.

## Core and Mode Tutorials

A game's introductory material can be divided into independently tracked lessons.

### Core Tutorial

Teaches the universal action loop required in every mode.

### Mode Introduction

Teaches only what changes in a selected mode.

Expected first-entry behavior:

1. The player enters a mode.
2. If the core tutorial is unseen, run it.
3. If that mode introduction is unseen, run it immediately afterward.
4. Enter or return to the mode the player originally selected.

When another mode is entered later, only its unseen mode introduction runs.

The runner should support lesson chaining, but each game decides which tutorials exist and their order.

## Completion, Skip, and Replay

Required concepts:

- `completed`: the player performed all essential actions.
- `dismissed` or `skipped`: the player intentionally left without completing.
- `unseen`: the tutorial has not been completed or dismissed for automatic-launch purposes.

Recommended behavior:

- Completion and dismissal are stored separately.
- Skipping prevents the tutorial from automatically reopening on every visit, but does not count as pedagogical completion.
- The replay button remains available regardless of stored status.
- Replaying does not need to erase the stored completion before starting.
- A version change can make a materially redesigned tutorial eligible for automatic launch again.

The exact behavior after a version change remains a product decision: some revisions may justify relaunching automatically, while minor text changes should not.

## Future Contextual Lessons

The core must not assume that every session is linear, first-entry-only, or completion-persistent.

Future `Por que isso aconteceu?` or `Ajuda` lessons may:

- Start from the current normal-game context.
- Demonstrate one secondary rule.
- Use custom state snapshots or a temporary reproduction.
- Return the player to the interrupted game.
- Run without a permanent completion key.

No contextual lesson behavior needs to be implemented in Core V0. The only current requirement is to avoid architectural assumptions that would make it impossible later.

## Relationship to the Existing DynamicTutorial

Potentially reusable behavior:

- Tooltip positioning.
- Spotlight and secondary target geometry.
- Responsive placement.
- Basic shared controls and presentation styling.

Behavior that should not define the new architecture:

- A blocking overlay over all gameplay.
- Arrow-button-only progression.
- A fixed array of explanatory steps.
- Direct localStorage writes inside the visual component.
- CSS selector targets as a requirement for every lesson.
- One component owning lifecycle, presentation, and persistence together.

The likely direction is to separate session logic from presentation, then either reuse selected visual code or replace it with smaller primitives.

## Performance and Reliability Constraints

- No external service is required for tutorial execution or persistence.
- Keep the shared bundle lean.
- Avoid loading large tutorial assets before they are needed.
- All tutorial UI must work on mobile and slower school computers.
- Timers, event listeners, promises, and animations need cancellation or stale-session protection.
- Normal game state must remain isolated from temporary tutorial state.
- Missing optional visual targets should degrade safely instead of deadlocking progression.
- All user-facing text remains Brazilian Portuguese.

## Verification Direction

Reusable core behavior should eventually be covered by code-level tests where practical:

- Lifecycle transitions.
- Completion and dismissal persistence.
- Version isolation.
- Lesson chaining.
- Timer and cancellation cleanup.
- Protection against stale callbacks.

Each game integration should verify:

- Correct actions advance exactly once.
- Wrong actions do not advance.
- State restoration is accurate.
- Replay begins from a clean state.
- Skip and navigation leave normal gameplay clean.
- Scripted bridges finish in the expected state.

Exact visual verification requires separate permission under the repository's verification rules.

## Decisions Deferred Until the Crown Chase Storyboard

- Final TypeScript interfaces and file layout.
- Whether stages are represented as data, components, callbacks, or a small combination.
- Whether Back exists at all in interactive tutorials, and which stages could safely support it.
- Exact board-game action interception and rollback strategy.
- Whether tutorial mode uses the normal game route or a dedicated route/state.
- Exact transition and reduced-motion behavior.
- Whether a progress indicator helps children or adds unnecessary UI.
- Exact behavior when the browser refreshes mid-session; restarting from the beginning is the current simplest assumption.
- Which pieces of `DynamicTutorial` should be reused.

## Core V0 Exit Criteria

Core V0 planning is ready for the next phase when:

- Shared and game-owned responsibilities are unambiguous.
- Crown Chase can be storyboarded without assuming a final API.
- The Caça Soma outline does not expose an obvious board-game-only dependency.
- Completion, mode, replay, skip, version, timer, and cleanup concepts are accounted for.
- Remaining uncertainties are explicitly delegated to the Crown Chase storyboard or first implementation rather than silently guessed.

