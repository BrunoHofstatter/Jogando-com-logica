# Playable Tutorial System - Overall Plan

## Status

Planning only. The playable tutorial system described here is not implemented yet.

## Purpose

Replace the current explanation-first tutorials with short guided scenarios in which the child learns the minimum necessary rules by performing real game actions.

The intended experience is:

> The child enters a controlled version of the game, tries meaningful actions, receives feedback from mistakes, and finishes knowing enough to begin a normal match.

This plan covers the order in which the shared system and individual game tutorials should be designed and implemented. Detailed game storyboards will live beside this document as they are created.

## Settled Product Direction

- Tutorials teach only the minimum needed to start playing.
- There is one introductory tutorial rather than multiple tutorial difficulties.
- The tutorial should use predetermined, pedagogically chosen situations.
- Important state changes should usually feel continuous. Games may use short scripted bridges or time lapses instead of abruptly replacing a state.
- Meaningful wrong actions are allowed. The game shows the attempt, explains the relevant mistake, restores the tutorial situation when necessary, and lets the child try again.
- Each game owns its exact visuals, messages, hints, hint escalation, scenarios, mistake behavior, and transitions.
- A small shared system owns tutorial lifecycle and other genuinely reusable behavior.
- Stages may advance after a player action, a Next button, a timer, an animation, or custom game logic.
- Important reading should not disappear automatically by default. Timed advancement is mainly useful for brief feedback, transitions, and animations, but each game decides.
- Tutorials appear automatically on first entry and remain available through a replay button.
- Games with multiple modes have separately tracked core and mode introductions.
- The design must leave room for future contextual lessons such as `Por que isso aconteceu?` or `Ajuda`, without designing those lessons now.

## Documentation Structure

The tutorial documentation belongs in `.agents/rules/tutorial_system/`.

- `overall_plan.md`: roadmap and order of work.
- `core_system_plan.md`: shared system responsibilities and technical direction.
- Future game documents: complete storyboards and implementation notes for each game.

Suggested future names:

- `game_crown_chase.md`
- `game_caca_soma.md`
- `game_stop.md`
- Additional game files as work begins on them.

Each game document should clearly separate:

1. Settled tutorial behavior.
2. Open design decisions.
3. Current implementation reality.
4. Planned implementation changes.

## Work Sequence

### Phase 1 - Core System V0 Plan

Define the shared system at the responsibility and capability level.

This phase decides:

- What belongs to the shared system.
- What always belongs to the game.
- Tutorial lifecycle and advancement methods.
- Completion, replay, skip, mode, and version concepts.
- How custom game logic communicates with the shared runner.
- How future contextual lessons remain possible.

This phase must not finalize a large TypeScript API before a complete game storyboard exists.

**Exit condition:** `core_system_plan.md` is detailed enough to guide the first game design, while explicitly marking decisions that require a real game scenario.

### Phase 2 - Complete Crown Chase Tutorial Design

Create a complete stage-by-stage storyboard for Crown Chase before implementing the shared system.

For every stage, specify:

- Learning objective.
- Starting game state.
- Visible instruction and visual treatment.
- Available meaningful actions.
- Required action.
- Relevant wrong attempts and feedback.
- Canonical state restoration behavior.
- Advancement condition.
- Scripted bridge or time lapse, when needed.
- Resulting state.

Crown Chase is the first full design because it is small, visually clear, and uses the shared board-game architecture.

**Exit condition:** the entire tutorial can be followed from entry to completion without inventing behavior during implementation.

### Phase 3 - Caça Soma Pressure Test

Create a short structural outline for Caça Soma before implementing the core. This is not yet the full Caça Soma storyboard.

The outline should verify that the proposed core can support:

- A non-board game with fully custom logic.
- Selecting numbers and confirming an answer.
- A core tutorial followed by the selected mode introduction.
- Separately stored core and mode completion.
- Visuals that may not resemble Crown Chase tooltips or highlights.

**Exit condition:** there is no obvious board-game-only assumption in the Core V0 plan.

### Phase 4 - Revise and Define the First Technical Contract

Revise the core plan using the complete Crown Chase storyboard and Caça Soma pressure test.

Define only the contract needed for the first vertical slice:

- Session state and lifecycle commands.
- Stage advancement signals.
- Cancellation and cleanup behavior.
- Persistence identifiers.
- Optional shared presentation primitives.
- The boundary between the runner and Crown Chase integration.

Avoid a universal step schema that attempts to encode every possible game animation, hint, or mistake.

**Exit condition:** the first implementation contract is small, concrete, and directly justified by storyboard requirements.

### Phase 5 - Crown Chase Vertical Slice

Implement the minimum shared core and the complete Crown Chase tutorial together.

Likely work includes:

- A new tutorial runner/session controller.
- Completion and version storage.
- Automatic first-entry launch and replay.
- Skip and exit cleanup.
- Required advancement methods.
- Crown Chase tutorial-mode state setup.
- Action interception or classification.
- Correct and incorrect attempt handling.
- Scripted bridges using the game visuals.
- Optional reuse of positioning or spotlight logic from the existing `DynamicTutorial`.

Do not add generic capabilities merely because another game might hypothetically need them.

**Exit condition:** Crown Chase has a complete playable tutorial, and the shared code contains only behavior that is plausibly reusable.

### Phase 6 - Review the Vertical Slice

Evaluate the implementation before expanding it.

Review:

- Whether the tutorial truly teaches only the minimum.
- Whether mistakes feel understandable instead of punitive.
- Whether state restoration is reliable.
- Whether scripted bridges communicate continuity.
- Whether the shared/game ownership boundary remained clean.
- Whether timers, animations, and interrupted sessions clean up safely.
- Whether replay and completion versioning behave correctly.

Revise the storyboard and core where the real implementation exposed incorrect assumptions.

### Phase 7 - Full Caça Soma Design and Implementation

Create the complete Caça Soma core tutorial and one full mode introduction, likely Levels first.

Implement the flow:

- First mode entered: core tutorial, then that mode's introduction.
- A different mode entered later: only that mode's introduction.
- Replay: replay the relevant tutorial or introduction intentionally selected by the player.

Caça Soma is the second implementation because it tests the shared system against a structurally different game.

**Exit condition:** the same core supports both a shared-engine board game and a custom-logic math game without forcing either into the other's architecture.

### Phase 8 - Stabilize Core V1

Only after Crown Chase and Caça Soma work should the shared contract be considered Core V1.

At this point:

- Rename or reorganize provisional APIs where necessary.
- Document the stable integration pattern.
- Add tests for reusable lifecycle and persistence behavior.
- Remove Crown-Chase-specific assumptions from shared code.
- Record patterns for board-game and custom-game integrations without requiring one implementation style.

### Phase 9 - Roll Out One Game at a Time

For each remaining game:

1. Identify the minimum knowledge required to begin.
2. Design the complete game-specific storyboard.
3. Check whether a real missing core capability exists.
4. Implement the game tutorial.
5. Add behavior to the shared core only when it is genuinely reusable.
6. Keep game-specific pedagogy inside the game.

Mode-specific introductions should be added only when entering a mode without them would leave the child unable to play.

## Why This Order

Implementing the core before a complete game design would turn assumptions into architecture. Planning every game before writing code would delay useful feedback and overdesign the system.

One complete game reveals real requirements. The short Caça Soma pressure test prevents the first design from becoming board-game-specific. The second full implementation then validates the shared boundary before it is stabilized.

## Out of Scope for the Current Planning Stage

- Final Crown Chase stage content.
- Final Caça Soma stage content.
- Tutorial artwork and exact UI styling.
- Analytics event definitions.
- Contextual `Por que isso aconteceu?` lessons.
- A migration plan for every existing tutorial.
- Final TypeScript names and interfaces.

