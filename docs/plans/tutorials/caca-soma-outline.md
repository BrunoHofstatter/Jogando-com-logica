# Caça Soma: tentative compatibility outline

Future design material. Originally drafted September 28, 2026; clarified during the October 6 documentation consolidation. No Caça Soma playable tutorial is implemented, and this is not an approved storyboard.

The purpose of this example is to consider a custom number-selection game alongside Crown Chase. It does not establish that every proposed interaction matches current Caça Soma rules or modes.

## Illustrative teaching situation

A fixed number board and a solvable target can offer a clear selection/submission exercise. For example, target 7 with 3 and 4 illustrates the relationship between a selected sum and a target. This is illustrative only: the allowed number of selected cells and other current rules need to determine the actual future fixture.

Selection, deselection, submission controls, sum feedback, consumed cells, and restoration belong to Caça Soma. A correct submission could signal completion of the relevant objective; selecting one cell alone would not necessarily demonstrate it. An incorrect sum could retain the selection or restore a controlled situation, with recovery and reading behavior chosen for that lesson.

## Possible mode differences

A Levels introduction could explain its actual round and unavailable-cell behavior through another solvable situation. An online introduction could explain the relevant readiness/confirmation controls before room participation. The final design must check current controls rather than assume local and online submission are identical.

Practice should remain isolated from real timers, stars, unlocks, progression, and room actions. The way to achieve this belongs to the eventual integration.

## Compatibility with the current foundation

The shared session accepts string stage identifiers, activation-guarded transitions, cancellable waits, and pause/resume. It has no move, board, arithmetic, selection, or CSS-selector requirement.

Separate core/mode identities and caller-ordered unseen filtering already exist. A caller would still need to implement any lesson sequence, presentation, return navigation, and cleanup. Replay can request an explicit lesson without clearing its history.

This suggests the current foundation can be useful to a non-board integration. Only an actual implementation can validate that boundary or reveal missing capabilities. See [next-tutorials.md](next-tutorials.md) for flexible considerations and [roadmap.md](roadmap.md) for future scope.
