# Project documentation

Start with the project overview or the reference for the game or system you are working on. These documents explain project context, implemented behavior, and design decisions. Repository working instructions live in [AGENTS.md](../AGENTS.md).

## Reading by subject

| Folder | Purpose |
|---|---|
| `project/` | Platform context, game catalog, and teacher guidance |
| `games/` | Game and lesson references |
| `systems/` | Shared components, implementation contracts, analytics, and multiplayer operations |
| `tutorials/` | Playable tutorial philosophy, shared contract, and implemented lessons |
| `plans/` | Proposals, future work, evaluation exercises, and retained implementation plans |
| `archive/` | Superseded designs preserved for historical context |

Check each document's status and section labels. Game and project references can include clearly labeled future ideas. A retained implementation plan may describe work that has since shipped; use the corresponding game or system reference for current behavior. Grade recommendations and educational benefits are not evidence of classroom validation unless explicitly documented as such.

## Project

- [Platform overview](project/overview.md)
- [Game catalog](project/games-overview.md)
- [Teacher manual context](project/teacher-manual.md)

## Games and lessons

- [Caça Coroa](games/crown-chase.md)
- [Guerra Matemática](games/math-war.md)
- [Super Jogo da Velha](games/spttt.md)
- [Stop Matemático](games/stop.md)
- [Caça Soma](games/caca-soma.md)
- [Bomb Game](games/bomb.md)
- [Cubo Mágico](games/rubiks.md)

## Shared systems

- [Multiplayer architecture, deployment, and extension](systems/multiplayer.md)
- [Classroom codes and room browsers](systems/classrooms.md)
- [Vertical arithmetic components](systems/calculations.md)
- [Google Analytics tracking and reporting](systems/analytics.md)
- [Rubik's cube rendering component](systems/rubiks-cube-component.md)

## Playable tutorials

- [Overview and teaching philosophy](tutorials/overview.md)
- [Implemented technical contract](tutorials/technical-contract.md)
- [Implemented Crown Chase lesson](tutorials/crown-chase.md)

## Plans and retained design context

- [Considerations for future tutorials](plans/tutorials/next-tutorials.md)
- [Tutorial roadmap](plans/tutorials/roadmap.md)
- [Tentative Caça Soma tutorial outline](plans/tutorials/caca-soma-outline.md)
- [Class 3 equal-faces implementation plan](plans/class3-equal-faces-implementation-plan.md) — retained design for implemented work
- [Class 3 summary-game implementation plan](plans/class3-summary-game-implementation-plan.md) — retained design for implemented work
- [Classroom tournament discussion](plans/classroom-tournament-discussion-context.md)
- [Personal model evaluation plan](plans/model-evaluation-plan.md) — evaluation context, not production implementation instructions

## Historical designs

- [Initial multiplayer private-room plan](archive/multiplayer-private-rooms.md) — historical context; the current contract is in the multiplayer system reference

## Related instructions and workflows

- [Repo Support](../repoSupport/overview.md) — on-demand documentation, review, and investigation procedures and reports
- [Multiplayer server README](../multiplayer-server/README.md)
- [Game template README](../src/GameTemplate/README.md)

Keep reusable skills in `.agents/skills/` and component READMEs beside their components. New permanent project documentation belongs in the appropriate `docs/` subfolder. Use descriptive kebab-case filenames, give each subject a primary home, and update this index and incoming references when moving or adding documents.
