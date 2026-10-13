# Games overview

Repository reference checked October 12, 2026. This distinguishes the main catalog from other implemented content and placeholders. Implementation does not establish deployment of the latest changes, sustained school adoption, or classroom validation.

## Main catalog

`src/Main/Pages/Jogos.tsx` currently exposes these six entries:

| Activity | Core experience | Current modes and scope |
|---|---|---|
| [Caça Coroa](../games/crown-chase.md) | Short strategy game on a 5×5 board. Capture the stationary opposing king. Ninja moves one square in any direction and captures any enemy; Saltador steps/jumps orthogonally and captures only the king. | Local two-player, AI, online private rooms and classroom rooms. |
| [Guerra Matemática](../games/math-war.md) | Strategy on an 8×8 board. Piece value plus shared dice total supplies energy for movement/capture; capture the opposing Captain. | Local two-player, four AI difficulties, online private rooms and classroom rooms. |
| [Super Jogo da Velha](../games/spttt.md) | Ultimate Tic-Tac-Toe: nine small boards form a larger board, and a move directs the opponent's next board. | Local two-player, AI, online private rooms and classroom rooms. |
| [Stop Matemático](../games/stop.md) | Mental arithmetic from a Magic Number, with single operations or two sequential operations per answer box. | Solo random play and 10 levels; online 2–8 player rooms with host settings, multiple rounds, rematches, and classroom discovery. |
| [Caça Soma](../games/caca-soma.md) | Select numbers adding to a Magic Number; correct cells become unavailable in later rounds. | 30 solo levels, legacy local versus, online 1v1 and cooperative 2v2 points races, private and classroom rooms. |
| [Cubo Mágico](../games/rubiks.md) | Interactive lessons and review activities using cubes to explore dimensions and multiplication. | Three lessons: Dimensões, Multiplicação no Cubo, Multiplicação nas Faces. Each offers Aprender/Jogar; Class 3's review currently requires a mouse. |

Grade recommendations and expected educational benefits belong in [teacher-manual.md](teacher-manual.md). They are recommendations, not measured outcomes.

## Additional implemented content

[Bomb Game](../games/bomb.md) has role-specific online cooperative content for Level 1 (Números) and Level 3 (Navegação), with server-owned rooms, timing, lives, and results. One player sees the puzzle and the other sees the manual. It supports temporary classroom discovery but is not in the six-entry main catalog. Level 2 is reserved for planned Language content; the final public name is not settled.

## Planned content and legacy routes

- Houses and Puzzle Wire have routes and placeholder gameplay pages; their presence is not a finished game. Houses is definitely intended; Puzzle Wire is tentative and lower priority. See [the overview](overview.md).
- The teacher-led tournament system is planned before Houses. Existing classroom codes/monitoring are not a tournament, automatic pairing, or cumulative leaderboard.
- Damas and base-game/test routes use legacy `AA_baseGame` content and are not main catalog entries. There is no separate current `src/Damas/` folder.
- Later cube modules have documented concepts and placeholders, not completed lessons.

## Implementation boundaries

Caça Coroa, Guerra Matemática, and Super Jogo da Velha use game-specific pure rules in their `Logic/v2/` folders for current local/AI/online behavior. They do not all execute through the legacy `AA_baseGame` engine. Renderers and page orchestration remain game-specific.

Stop, Caça Soma, cube lessons, and Bomb Game have their own interaction and rule structures. Online rules are shared with the authoritative backend where applicable. Read [multiplayer.md](../systems/multiplayer.md) and [classrooms.md](../systems/classrooms.md) for those systems; do not force non-board activities into a board engine.
