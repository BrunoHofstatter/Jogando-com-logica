---
trigger: model_decision
description: SPTTT (Super Jogo da Velha / Super Tic-Tac-Toe) documentation.
---

# Super Jogo da Velha (SPTTT)

## Current Reality

- The game is implemented and playable.
- Online multiplayer is implemented with server-authoritative private rooms.
- Temporary classroom room browsing is implemented.
- Classroom-visible rooms use the same simple two-seat waiting-room model as Caça Coroa.
- The online namespace is `/spttt`.

## Classroom Notes

Super Jogo da Velha is a 1v1 turn-based game, so the classroom behavior intentionally stays minimal:

- the teacher creates a Super Jogo da Velha classroom from `/turmas`;
- students enter the classroom code from the Super Jogo da Velha online lobby;
- students can create a classroom-visible room;
- other students in the same classroom see `Sala de {nome}` and join with one click;
- private room code creation and joining remains available.

No extra room settings are currently needed for the classroom room card.
