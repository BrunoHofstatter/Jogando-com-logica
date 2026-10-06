# Classroom tournament: discussion context

Status: proposed concept, captured September 30, 2026. This system is not
implemented. The working description is "Kahoot-like"; no final name is chosen.
This document preserves the user's ideas separately from open questions and
suggested discussion priorities.

## Project context

Jogando com Lógica is a free educational game platform primarily for Brazilian
public school students aged about 8–13. UI text is Brazilian Portuguese. Teacher
and student flows should be simple, without accounts. School devices may be slow.
Grade recommendations and educational fit are not validated classroom findings.

The platform has an authoritative multiplayer backend and temporary classroom
codes. The current classroom system groups discoverable waiting rooms across
games and lets teachers monitor rooms. Students currently create or join game
rooms; automatic tournament assignments and cumulative tournament scoring are
not documented as implemented features.

Relevant implementation context:

- `.agents/rules/docs_classroom_system.md`
- `.agents/rules/docs_multiplayer_backend.md`
- `.agents/rules/docs_games_overview.md`
- Individual game documentation for rules, supported modes, and limitations.

## User's proposed concept

- A teacher creates a room and students enter it.
- Before starting, the teacher selects one game or a set of games. How a selected
  set is distributed across rounds is open for discussion.
- The session has a configured number of rounds. Each round uses a game; the same
  game may be used throughout the session.
- Most games are one versus one. Students would be randomly paired each round.
- Winners earn points that accumulate in a leaderboard. At the end, someone wins
  the session.
- Games should be short enough for this format. Matches lasting 15 minutes or
  more are undesirable. Possible approaches include changing game rules or using
  a timer and deciding the winner at its end. No approach is settled.
- Stop Matemático should probably run in smaller groups rather than one game for
  the whole class. The concern is that only one student would win a whole-class
  game. Twenty students could form four groups of five. Smaller classes should
  also be split into viable groups; exact minimum sizes and grouping rules are
  open. Every student must be accounted for.
- Caça Soma supports one versus one and two versus two; both are possible session
  formats. How teams are assigned and how team results affect individual points
  remain open.
- Some suitable games could optionally be played against the computer instead
  of classmates. Difficulty might increase each round. This is a newly suggested
  option, not a settled requirement.
- The user's current preference is to exclude Bomb Game, while leaving that open
  for discussion.

## Decisions to discuss

- Teacher-selected sequence versus another way of distributing selected games.
- Whether everyone plays the same game in a given round.
- Shared round deadlines, early finishers, and movement to the next round.
- Game-specific short formats and defensible outcomes at a time limit.
- Pairing/grouping with odd counts, team formats, late arrivals, and disconnects.
- Whether to avoid repeat opponents while retaining random assignment.
- Individual leaderboard scoring across pairs, larger groups, teams, and optional
  computer opponents; ties and no-result matches need explicit treatment.
- Teacher controls and the minimum settings needed for an initial version.
- The initial game selection and whether computer opponents belong in the first
  version or a later extension.

## Suggested opening prompt for the pure discussion exercise

> Read the supplied classroom-tournament context and the relevant project
> documentation. I want to develop this idea with you before choosing an
> implementation plan. Start with the design decision you think most affects
> whether it works well in a classroom, explain your recommendation and its main
> tradeoff, and leave room for us to discuss it. Use all my proposed ideas as
> context, distinguish preferences from settled requirements, and make your own
> judgment. Do not implement anything yet.

The context above accompanies the prompt. It should not be replaced by a shorter
brief that silently drops user ideas. This opening is a draft until piloted.

## Suggested discussion checkpoints

These are evaluator prompts to use naturally, not predetermined answers:

1. How should wins in pairs and larger groups contribute to one leaderboard?
2. What happens when matches end at different times or reach the time limit?
3. What is the smallest useful first version, and which proposed options wait?

Assess whether the model notices consequential issues, explains concrete choices,
tracks the user's preferences, responds thoughtfully to pushback, and helps the
user converge. Do not require agreement with an evaluator's preferred design.
