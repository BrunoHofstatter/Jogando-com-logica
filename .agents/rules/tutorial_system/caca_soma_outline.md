# Caça Soma compatibility outline

September 28, 2026. Structural pressure test only; no Caça Soma tutorial implementation.

The core lesson can start with a fixed number board and target 7. The child selects 3 and 4, using the chosen mode's actual confirmation control. Selection, deselection, number-count requirements, sum feedback, and consumed-cell visuals belong to Caça Soma. A wrong sum retains the lesson and restores its authored selection/board after acknowledgement. A correct submission signals stage advancement; selecting one cell alone does not.

The selected mode then receives its own introduction: Levels explains rounds and unavailable cells using a second solvable authored target; online would teach its explicit Pronto control and readiness before entering a room. Do not assume the legacy local submission flow matches online. No timers, stars, unlocks, or network actions from practice reach normal play.

Core and mode histories use separate identities, for example caca-soma/core/v1 and caca-soma/mode/levels/v1. The caller orders unseen lessons, completes or dismisses each independently, and cancels the remaining flow on navigation. Replay requests an explicit lesson without erasing completion.

The proposed runner only accepts string stage identifiers, guarded transitions, and cancellable waits. It contains no board, move, CSS-selector, selection, or arithmetic concepts. Thus this outline introduces no additional core requirement. Actual queue UI and Caça Soma integration remain deferred until its full design.
