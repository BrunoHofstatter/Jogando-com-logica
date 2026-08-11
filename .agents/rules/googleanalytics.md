---
trigger: model_decision
description: When creating, reviewing, or modifying Google Analytics tracking.
---

# Google Analytics (GA4)

Last code update: 2026-08-11
Measurement ID: `G-BXWR3NBDQL`

This document separates the analytics that the repository currently sends from
the events planned for later phases. Do not describe a planned event as
implemented until its real gameplay fire point and tests exist.

## Measurement principle

Jogando com Lógica is used on shared school and family devices. A GA4 "user"
therefore represents a browser/device identifier, not a student. One device may
contain activity from several people, while one person may use several devices.

Required reporting rules:

- Never label GA users, new users, returning users, or sessions as students.
- Do not set GA `user_id` or create a persistent analytics identifier for a
  student.
- Use activity counts and ratios: selections, game attempts, level attempts,
  completions, active duration, and participant counts when known.
- Do not build the main catalog-to-completion report as a user-scoped funnel.
  Different students on one device could contribute different stages.
- GA4 cannot establish learning outcomes. Use teacher feedback or a structured
  educational evaluation for that question.

## Current implementation: Phases 1 through 5

Phase 1 provides the collection foundation. Phase 2 connects that foundation
to the solo Caça Soma level lifecycle as the pilot. Phase 3 extends guarded,
foreground-only activity attempts to Stop, Rubik's activities, and the local
and AI modes of the three public board games. Phase 4 adds teacher-manual
selections, feedback opening, confirmed classroom-creation results, outreach
guidance, and a shared-device player progress reset. Phase 5 adds
participant-side multiplayer join reliability and unexpected disconnect
measurement across every shipped online game. Online match start/end
lifecycles remain deferred because one match can involve several client
devices.

### Code structure

```text
src/analytics/
├── analytics.ts          # host/build guard, one GA initializer, safe sender
├── events.ts             # typed public event functions and stable game IDs
├── PageViewTracker.tsx   # manual React Router page views
├── ActivityTimer.ts      # foreground timer with one guarded finalization
├── GameAttemptTracker.ts # reusable game/activity start/end lifecycle
├── ClassroomCreationTracker.ts # pending request/result correlation
├── MultiplayerReliabilityTracker.ts # join/result and disconnect correlation
├── useGameAttemptAnalytics.ts # React visibility/page-exit integration
├── useBoardGameAnalytics.ts # shared local/AI board-game lifecycle
├── LevelAttemptTracker.ts # framework-independent level attempt lifecycle
├── useLevelAttemptAnalytics.ts # React visibility/page-exit integration
├── LevelAttemptTracker.test.ts # completion, retry, exit, and timing tests
└── analytics.test.ts     # collection, privacy, URL, ID, and timer tests
```

Components must call functions from `events.ts`. They must not import
`react-ga4` directly or invent event payloads.

The shared-device reset lives in
`src/Shared/PlayerProgress/localPlayerProgress.ts`; its tests define the exact
player-key inventory and the classroom/unrelated keys that must be preserved.

### Initialization and collection guard

- `react-ga4` is the only tag integration.
- `index.html` contains no raw Google tag.
- `main.tsx` calls the centralized `initializeAnalytics()` once.
- Collection is enabled only when both conditions are true:
  - Vite built the production bundle (`import.meta.env.PROD`).
  - The hostname is `jogandocomlogica.com` or
    `www.jogandocomlogica.com`.
- Localhost, tests, GitHub Pages, and preview deployments are no-ops for the
  production property.
- Initialization sets:

```text
send_page_view: false
allow_google_signals: false
allow_ad_personalization_signals: false
```

The first setting prevents the tag's initial automatic page view. The other two
disable advertising signals and personalization eligibility in the tag. These
code settings do not replace a review of consent, retention, Google Signals,
and advertising settings in the GA4 administration console.

### Events currently sent

All event names, parameter names, IDs, and controlled values use lowercase
`snake_case`.

| Event | Fire point | Parameters |
| --- | --- | --- |
| `page_view` | Initial React route and each pathname/query change | `page_title`, sanitized `page_location` |
| `select_content` | A game is selected in `/jogos` or through a manual game section's “Ver regras completas” button | `content_type: "game"`, `content_id`, `entry_point: "game_catalog"` or `"teacher_manual"` |
| `game_start` | A Phase 3 Stop round, Rubik's activity, or local/AI board match becomes usable | `game_id`, `game_mode`, `usage_context`, `participant_count`; applicable `level_id`, `difficulty`, `activity_variant` |
| `game_end` | A started Phase 3 activity completes or is abandoned by route exit/browser `pagehide` | start context, active `duration_seconds`, `end_reason`; controlled outcome and aggregates when known |
| `level_start` | A solo Caça Soma level first becomes playable after the Magic Number finishes rolling; retries start a new attempt | `game_id`, `level_id`, `game_mode`, `usage_context`, `participant_count` |
| `level_end` | A started Caça Soma level reaches its result or is abandoned by route exit/browser `pagehide` | start context, active `duration_seconds`, `end_reason`, aggregate round counts; completion outcome and stars when known |
| `tutorial_begin` | The Caça Soma levels tutorial overlay mounts | `game_id`, `tutorial_id` |
| `tutorial_complete` | The final tutorial step is completed | `game_id`, `tutorial_id` |
| `tutorial_skip` | The tutorial is explicitly skipped or closed with Escape | `game_id`, `tutorial_id`, `step_id` |
| `classroom_create_result` | A pending teacher create request receives `classroom_created` or `classroom_create_failed` | `success`; controlled `error_code` on failure only |
| `feedback_open` | The external teacher feedback form is opened from the manual or contact page | `entry_point: "teacher_manual"` or `"contact_page"` |
| `local_progress_reset` | The confirmed “Trocar jogador” action finishes clearing allowlisted local player state | `reason: "player_switch"` |
| `multiplayer_join_result` | An explicit, locally valid room-join request receives `room_joined`, a controlled server failure, or a connection failure | `game_id`, `game_mode`, `usage_context`, `join_type`, `success`, `wait_ms`; controlled `error_code` on failure |
| `multiplayer_disconnect` | A participant in a server-confirmed waiting/playing room loses the socket unexpectedly | `game_id`, `game_mode`, `usage_context`, `connection_stage`, controlled `error_code` |

`page_location` keeps the origin and pathname. It drops fragments and every
query parameter except these campaign fields:

```text
utm_source
utm_medium
utm_campaign
utm_content
utm_term
```

Do not put teacher names, student names, schools, classroom codes, or other
identifying information in UTM values.

### Stable game IDs

```text
stop_matematico
caca_soma
cubo_magico
caca_coroa
super_jogo_da_velha
guerra_matematica
```

Reserved before future catalog exposure:

```text
bomb_game
puzzle_wire
houses
```

Reserved IDs do not mean those games emit lifecycle events. Bomb Game is
online-only and remains deferred with the online measurement design. Puzzle
Wire and Houses have empty gameplay pages, so sending a start from those
routes would be false telemetry. None of the three is ready to be added to the
public catalog on analytics coverage alone.

Game IDs are permanent analytics identifiers. Portuguese display labels may
change without changing the IDs.

### Phase 2 Caça Soma level lifecycle

Phase 2 instruments only the solo levels reached through
`/caca-soma/niveis/:levelId`. It does not instrument the legacy local versus
mode or online mode.

Stable values:

```text
game_id: caca_soma
level_id: level_01 ... level_10
game_mode: solo
usage_context: standard
participant_count: 1
tutorial_id: caca_soma_levels_v1
```

The lifecycle is:

1. Loading a route, opening the tutorial, or clicking `Começar` does not start
   an attempt.
2. The first transition to a playable board sends one `level_start`. A direct
   route works without a preceding catalog event.
3. Each submitted round updates in-memory correct/incorrect aggregates. Magic
   Numbers, selected numbers, sums, and answers are never sent.
4. A normal result sends one `level_end` with `end_reason: "completed"`.
   `success` means the existing pass rule of at least two stars, and `outcome`
   is `passed` or `failed`.
5. Route unmount or `pagehide` sends one guarded `level_end` with
   `end_reason: "abandoned"` if the attempt had started. No success, outcome,
   or stars are attached to abandonment.
6. A retry starts a new independent attempt. No analytics attempt state or
   identifier is stored in `localStorage` or `sessionStorage`.

`duration_seconds` is whole active foreground time from the playable start to
the end. `visibilitychange` pauses/resumes it, so switching tabs does not end
the attempt and hidden time is excluded. Route cleanup and `pagehide` share the
same finalizer, preventing a duplicate end. Delivery during a hard refresh is
still best-effort browser telemetry and must be checked after deployment.

Current `level_end` aggregate parameters:

```text
completed_round_count
correct_count
incorrect_count
duration_seconds
end_reason
success          # completed attempts only
outcome          # completed attempts only
stars_earned     # completed attempts only
```

No `game_start` or `game_end` is sent for the levels menu. There is currently
no distinct multi-level activity boundary, so adding those events would count
the same lifecycle twice without providing a clear new unit.

### Phase 3 activity lifecycle

Phase 3 reuses one `GameAttemptTracker` for different activity shapes. Attempt
state stays in memory. Route cleanup and `pagehide` share one finalizer, and
`visibilitychange` pauses active time without ending the attempt. Completion,
abandonment, and retry therefore follow the same exactly-once rule as the Caça
Soma pilot.

True start points:

- Stop starts after the Magic Number reveal, once the board is visible and any
  tutorial overlay has been dismissed.
- A Rubik's activity starts when the selected lesson or review activity is
  mounted and interactive.
- Caça Coroa and Super Jogo da Velha start when the local/AI board is usable
  after the tutorial.
- Guerra Matemática also waits for the opening dice animation to finish.

True completion points:

- Stop completes when the round is evaluated by `STOP` or the final Enter
  action. It sends aggregate correct/incorrect counts only.
- Rubik's classes complete only at the final lesson/review result, not when the
  class route opens.
- Board games complete only when their rules state changes to `ended`.

#### Phase 3 controlled values

Stop:

```text
game_id: stop_matematico
game_mode: solo
participant_count: 1
activity_variant: level | random | tutorial
level_id: level_01 ... level_10     # level variant only
difficulty: d1 ... d6               # non-level variants when known
```

Level-mode `success` uses Stop's shipped rule: at least one star passes the
level. `outcome` is `passed` or `failed`. Random/tutorial rounds use
`outcome: completed` and do not invent a pass/fail result.

Rubik's activities:

```text
game_id: cubo_magico
game_mode: solo
participant_count: 1
level_id: class_01 | class_02 | class_03
activity_variant: lesson | review
```

Class 3 currently supports `lesson` only. `assistance_count` preserves the
meaning of each module's existing aggregate help/flag counter; it is not a
count of students or a standardized learning score. Summary mistakes are sent
only as an aggregate `incorrect_count`.

Board games:

```text
game_mode: local_multiplayer | ai
participant_count: 2                # local two-person match
participant_count: 1                # one person versus AI
difficulty: very_easy | easy | medium | hard   # AI only
```

For local matches, `outcome` is `completed` or `draw`; no individual winner is
identified. For AI matches, `outcome` is `win`, `loss`, or `draw` from the
human side and `success` is present only for a win/loss result.

#### Instrumentation matrix

| Activity | Start/end coverage | Current event unit | Notes |
| --- | --- | --- | --- |
| Caça Soma solo levels | Yes | `level_start` / `level_end` | Phase 2 pilot |
| Caça Soma legacy local-versus | No | — | Needs a separate local lifecycle design |
| Caça Soma online | No | `multiplayer_join_result` / `multiplayer_disconnect` | Reliability covered; match lifecycle deferred |
| Stop level, random, tutorial-fixed | Yes | `game_start` / `game_end` | One event pair per round |
| Stop online | No | `multiplayer_join_result` / `multiplayer_disconnect` | Reliability covered; round/match lifecycle deferred |
| Cubo Mágico classes 1–2 learn/review | Yes | `game_start` / `game_end` | `activity_variant` separates lesson/review |
| Cubo Mágico class 3 lesson | Yes | `game_start` / `game_end` | No review mode currently exposed |
| Caça Coroa local/AI | Yes | `game_start` / `game_end` | Shared board integration |
| Super Jogo da Velha local/AI | Yes | `game_start` / `game_end` | Shared board integration |
| Guerra Matemática local/AI | Yes | `game_start` / `game_end` | Starts after opening dice animation |
| Board-game online modes | No | `multiplayer_join_result` / `multiplayer_disconnect` | Reliability covered; avoid counting one match once per client/device |
| Bomb Game | No | `multiplayer_join_result` / `multiplayer_disconnect` | Online reliability covered; match lifecycle deferred; not catalog-ready |
| Puzzle Wire / Houses | No | — | Gameplay pages are empty; reserved IDs only |
| Damas and test/base routes | No | — | Intentionally excluded from product reports |

Online match events are deliberately deferred. Sending a client event from
both players would make one match look like two attempts. Phase 5 explicitly
uses participant-side joins and connection losses only; it does not redefine
them as matches. A future match lifecycle still needs one canonical emitter
or a separately named participant-activity unit. Room codes, names, and
persistent identifiers remain forbidden in every option.

### Phase 4 teacher, outreach, classroom, and shared-device actions

#### Teacher manual and feedback

The existing manual route is measured through the normal `page_view`. Clicking
“Ver regras completas” in a game section also sends `select_content` with
`entry_point: "teacher_manual"` before opening the rules route. Scrolling to a
game's details does not claim a selection.

Opening the external Google feedback form sends `feedback_open`. The manual and
contact page use distinct controlled entry points. The repository does not
claim a feedback submission from this event; form completion occurs outside
the application and is not reliably confirmed by this integration.

#### Confirmed classroom creation

Clicking “Criar Nova Turma” starts only an in-memory pending request. No event
is sent for the click. `classroom_create_result` is sent once when that request
receives either:

- `classroom_created`, with `success: true`; or
- `classroom_create_failed`, with `success: false` and the controlled
  `error_code: "server_error"`.

Restoring a managed classroom list does not look like a new creation. Socket
disconnect or component cleanup cancels the pending tracker without inventing
a server result. Classroom codes, management tokens, teacher names, server
messages, and raw errors are never included.

#### Shared-device player reset

The home page exposes “Trocar jogador.” After a Portuguese confirmation, it
clears only this player-specific local state:

```text
active_player_name_v1
cacasoma_level_progress
hasSeenRubiksClass1
tutorial_*_completed
game_progress_*
stop_level_stars_*
```

The reset deliberately preserves `active_classroom_session_v1`,
`managed_classroom_tokens_v1`, analytics/browser identifiers, and unrelated
browser data. It uses an allowlisted reset function and never calls
`localStorage.clear()`. The event reports only `reason: "player_switch"`; it
does not report the removed keys or use the action as a count of students.

Progress is device-local convenience state. Even after adding this reset, GA4
cannot show an individual student's longitudinal history or learning outcome.

#### Outreach attribution

Outreach links should land directly on the manual with standardized,
non-identifying UTMs, for example:

```text
https://jogandocomlogica.com/manual?utm_source=direct_email&utm_medium=email&utm_campaign=school_outreach_2026_s2&utm_content=teacher_manual
```

Campaign values describe a channel or outreach batch, never a teacher,
student, school, classroom, or recipient. The safe page-location function
keeps only `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, and
`utm_term`; GA4 session campaign dimensions should be used to compare manual
views, selections, classroom creation results, and feedback opens.

### Phase 5 multiplayer reliability

Phase 5 measures participant-side connection attempts. It does not claim to
count matches, rooms, devices, or students. A two-device match can legitimately
produce two participant-side operational records, for example one successful
join for the guest and one unexpected disconnect for either participant.

Current coverage:

```text
caca_coroa
super_jogo_da_velha
guerra_matematica
caca_soma
stop_matematico
bomb_game
```

#### Join result lifecycle

1. An invalid name or room-code length is rejected locally and sends no event.
2. A valid explicit join begins one in-memory timer. No room code, player name,
   socket ID, or attempt ID is stored in analytics state or sent.
3. Joining through a classroom room card uses `join_type: "classroom_room"`,
   `game_mode: "classroom"`, and `usage_context: "classroom"`. Typing a private
   room code uses `join_type: "private_code"`, `game_mode: "online_private"`,
   and `usage_context: "standard"`.
4. The server's `room_joined` response sends one successful
   `multiplayer_join_result`. Creating/hosting a room does not count as a join.
5. A join-related `multiplayer_error`, missing server configuration,
   `connect_error`, or socket disconnect while the join is pending sends one
   failed result.
6. `wait_ms` is elapsed request-to-result wall-clock time. It includes backend
   cold-start/network wait because that delay is part of the participant's
   lobby experience.
7. Restored `sessionStorage` state, automatic classroom validation, room state
   updates, rematches, and gameplay errors do not create join results.

Controlled join failure codes:

```text
room_not_found
room_not_joinable
room_full
invalid_name
classroom_not_found
network_error
server_unavailable
server_error
```

An unrecognized server code is reduced to `server_error`. A
`classroom_not_found` response from automatic classroom validation is ignored
when a private-code join or private-room creation is pending, so it cannot be
misattributed to that room operation.

#### Unexpected disconnect lifecycle

Room creation and room joining establish in-memory connection context only
after the server sends `room_created` or `room_joined`. An unexpected Socket.IO
disconnect from that confirmed room sends one `multiplayer_disconnect` while
the participant is waiting or playing.

The tracker ignores:

- `io client disconnect`, used by the intentional leave/reset functions;
- disconnects after the local game status is already `ended`;
- connection failures before a room is confirmed (these are join failures when
  a join is pending, not post-join disconnects);
- raw Socket.IO descriptions.

Controlled disconnect error codes:

```text
server_disconnect
timeout
transport_error
network_error
```

`connection_stage` is only `waiting` or `playing`. This is operational client
telemetry and is best effort: closing a tab or losing a device connection may
prevent the affected browser from delivering its final event. It is not a
replacement for backend observability.

Online `game_start` and `game_end` are still deferred. Phase 5 deliberately
does not turn one server match into multiple client-side match attempts. A
future match-lifecycle integration must choose a canonical server emitter or
explicitly define a participant-activity unit before adding those events.

### Removed legacy behavior

Phase 1 removed:

- `Game_Selection` / `Click_Game` category-action-label events;
- `Game_Engagement` / `Time_Spent_In_Game` events;
- the `activeGameSession` value in `localStorage`;
- timing from game-card selection until tab hide, unload, or a navigation
  button.

That timer mixed rules/menu reading with gameplay, ended on the first tab
switch, missed direct links, and could carry state between different people on
one device. Phases 2–3 replace it for covered activities with in-memory,
foreground-only attempt timers.

### Payload safeguards

The shared sender removes undefined values, malformed parameter names, and
forbidden fields. The current forbidden list includes:

```text
answer, answer_text, attempt_id, classroom_code, classroom_management_token,
client_id, error, error_message, free_text, host_name, management_token,
message, name, player_name, raw_error, room_code, room_id, school, school_name,
socket_id, student_name, teacher_name, user_id
```

Never send:

- player/student/teacher names;
- classroom, lobby, or room codes;
- school names;
- answers or free text;
- client IDs, user IDs, fingerprints, or attempt UUIDs;
- raw error messages or stack traces;
- values read from local progress storage.

Failures may send a controlled low-cardinality code such as `server_error` or
`room_not_found`. They must never send the raw server, Socket.IO, or UI
message.

## Required GA4 administration action

The repository disables the page view sent by the GA `config` command. GA4
Enhanced Measurement can separately listen to browser history changes. In the
web data stream, disable:

```text
Enhanced Measurement → Page views →
Page changes based on browser history events
```

Without that property-level change, the manual React Router tracker and
Enhanced Measurement may both record a route change. The repository cannot
inspect or enforce this setting.

After deployment, use DebugView/Tag Assistant to verify:

1. one `page_view` on the initial route;
2. one `page_view` for each client-side route change;
3. one `select_content` for each catalog selection;
4. one `level_start` when a Caça Soma level becomes playable;
5. one completed or abandoned `level_end`, including across retry and route
   exit;
6. a tab switch does not end the attempt and does not add hidden duration;
7. tutorial begin, complete, and skip each fire at the documented point;
8. refresh/pagehide abandonment reaches GA when the browser allows delivery;
9. no events from localhost or preview hosts;
10. no classroom codes, names, answers, selected numbers, or raw errors in
    payloads;
11. Stop starts only after reveal/tutorial gating and sends one aggregate end
    for completion, retry, or route exit;
12. Rubik's `activity_variant` distinguishes lesson/review and completion does
    not fire merely on route entry;
13. local board matches use `participant_count: 2`, AI uses `1`, and AI outcome
    is relative to the human;
14. online routes, Bomb Game, Puzzle Wire, Houses, Damas, and test routes send
    no lifecycle events while the matrix marks them uncovered;
15. manual rules links send `select_content` with `teacher_manual`, while
    scrolling to details sends nothing;
16. feedback buttons send one `feedback_open` with the correct entry point and
    do not claim a form submission;
17. a classroom create button click sends nothing until the server result,
    restored classroom lists send nothing, and success/failure includes no
    code, token, name, or raw message;
18. “Trocar jogador” requires confirmation, clears the documented player keys,
    and preserves both classroom keys and unrelated storage;
19. a direct manual URL with the standard UTM convention retains only safe
    campaign parameters in `page_location`;
20. invalid name/code input sends no multiplayer event, while a valid join
    sends exactly one result after success, controlled server failure, or
    connection failure;
21. private-code and classroom-room joins use the documented mode/context and
    never include the entered room code, classroom code, name, or socket ID;
22. room hosting sends no join result, but both a confirmed host room and a
    confirmed joined room can report an unexpected waiting/playing disconnect;
23. intentional leave and post-completion disconnects send no
    `multiplayer_disconnect`;
24. all six online games listed in Phase 5 send the same controlled reliability
    payload shape.

For Explorations, register only the parameters that will be used. A
reasonable initial set is:

| Type | Parameters |
| --- | --- |
| Event-scoped dimensions | `game_id`, `level_id`, `game_mode`, `activity_variant`, `difficulty`, `usage_context`, `end_reason`, `outcome`, `success`, `tutorial_id`, `step_id`, `entry_point`, `error_code`, `reason`, `join_type`, `connection_stage` |
| Event-scoped custom metrics | `duration_seconds`, `participant_count`, `completed_round_count`, `completed_step_count`, `correct_count`, `incorrect_count`, `assistance_count`, `stars_earned`, `wait_ms` |

Do not register browser/client IDs, attempt IDs, timestamps, room codes, or any
other high-cardinality or identifying value.

Custom definitions affect reporting after they are created; they do not make
earlier unregistered parameters retroactively available as custom dimensions
or metrics. Confirm collection in Realtime/DebugView first, create the
definitions, and allow GA processing time before treating a blank Exploration
as an implementation failure.

### GA4 Exploration definitions

These are manual GA4 property configurations. The repository defines the
events and the report contract but cannot create or verify Explorations inside
the property.

Every Exploration must use **Event count** as the activity count. Do not use
Users, Active users, New users, Returning users, or user-scoped funnel steps as
student measures.

#### 1. Game engagement

Create a free-form table:

| Setting | Value |
| --- | --- |
| Rows | `game_id`, then `game_mode` |
| Columns | Event name |
| Values | Event count; `duration_seconds` where applicable |
| Filter | Event name matches `select_content`, `game_start`, `game_end`, `level_start`, or `level_end` |

Use a second tab filtered to `game_end`/`level_end` with `end_reason` and
`outcome` as nested rows. Compute start/completion ratios from event counts for
the same game, mode, and date range. Do not join selection and completion by
GA user.

#### 2. Level difficulty

Create a free-form table filtered to `level_end`:

| Setting | Value |
| --- | --- |
| Rows | `game_id`, `level_id` |
| Columns | `success` or `outcome` |
| Values | Event count, `duration_seconds`, `incorrect_count`, `assistance_count`, `stars_earned` |

Interpret averages and totals as activity-level signals. They are not
longitudinal student progress, even when a browser repeats a level.

#### 3. Teacher and classroom activity

Create a free-form table using Event name as rows and session campaign/source
dimensions as columns. Include `/manual` page views, teacher-manual
`select_content`, `classroom_create_result`, and `feedback_open`. Keep success
as a breakdown for classroom creation. Report actions and campaigns, not
teachers or schools.

#### 4. Multiplayer reliability

Create two free-form tabs:

| Tab | Rows | Columns | Values | Filter |
| --- | --- | --- | --- | --- |
| Join results | `game_id`, `join_type`, `error_code` | `success` | Event count, `wait_ms` | Event name exactly `multiplayer_join_result` |
| Disconnects | `game_id`, `game_mode`, `connection_stage`, `error_code` | — | Event count | Event name exactly `multiplayer_disconnect` |

For each game/join type/date range:

```text
join success rate = successful multiplayer_join_result event count
                    / all multiplayer_join_result event count
```

Use `wait_ms` to compare the same join path and hosting period. Free-tier cold
starts can make private and classroom attempts slow; do not compare tiny
samples or treat one outlier as a trend. Disconnect counts are affected-client
events and best effort, not canonical server room failures.

GA4 calculated metrics may combine existing metrics, but a filtered numerator
and denominator are not automatically created by this repository. If the
property UI cannot express the filtered rate safely, export the two event
counts and calculate the ratio outside GA rather than substituting a
user-based conversion rate.

References:

- [Google: manual page views and disabling automatic measurement](https://developers.google.com/analytics/devguides/collection/ga4/views)
- [Google: tag privacy settings](https://developers.google.com/tag-platform/security/guides/privacy)
- [Google: event-scoped custom dimensions](https://support.google.com/analytics/answer/14239696)
- [Google: custom metrics](https://support.google.com/analytics/answer/14239619)
- [Google: free-form Explorations](https://support.google.com/analytics/answer/9327972)
- [Google: calculated metrics](https://support.google.com/analytics/answer/14166471)

## Rules for extending analytics

When adding an event:

1. Start with the decision the data will support.
2. Choose a real lifecycle fire point. A route mount or card click is not a
   gameplay start.
3. Add the event name to `AnalyticsEventName` in `analytics.ts`.
4. Add a typed domain function to `events.ts`.
5. Use stable, controlled values; never use translated UI labels as IDs.
6. Add tests for the sender and any lifecycle finalizer.
7. Update the **current implementation** section of this document.
8. Validate the deployed event in DebugView before trusting reports.

Do not send every move, click, or incorrect answer. Prefer aggregate counts on
the end event for an attempt or level.

## Remaining planned lifecycle contract

All named Phase 1–5 events above are implemented in code. No additional event
name is committed for the next phase.

Suggested shared parameters:

```text
game_id, game_mode, entry_point, level_id, difficulty, participant_count,
usage_context, duration_seconds, success, outcome, end_reason,
incorrect_count, hint_count, assistance_count, error_code, wait_ms,
join_type, connection_stage
```

Use controlled enums such as:

```text
game_mode: solo | local_multiplayer | ai | online_private | classroom
usage_context: standard | classroom
end_reason: completed | abandoned | error | disconnected
```

`game_start` and `game_end` are now implemented for the Phase 3 matrix rows
marked Yes. They remain planned for online and not-yet-playable activities.
Later integrations must reuse the guarded lifecycle pattern while choosing
their own true start and end points.

## Rollout status

| Phase | Status | Scope |
| --- | --- | --- |
| 1 | Implemented in code; GA admin/DebugView validation pending | Reliable initialization, manual page views, typed selection event, privacy guard, timer removal |
| 2 | Implemented in code; deployed DebugView validation pending | Pilot Caça Soma level lifecycle, active timing, aggregate outcomes, and tutorial events |
| 3 | Implemented in code; deployed DebugView validation pending | Stop, Rubik's activities, and local/AI board-game coverage; explicit online/reserved-route exclusions |
| 4 | Implemented in code; deployed DebugView validation pending | Teacher-manual selections, feedback opening, confirmed classroom creation results, outreach convention, and allowlisted local player reset |
| 5 | Implemented in code; GA admin/DebugView validation pending | Participant-side multiplayer join results and unexpected disconnects across six games; GA4 custom-definition and Exploration contract |

### Phase 2–5 verification status

- Automated tests cover one start/end, completion, retry, route cleanup,
  pagehide, hidden/resumed timing, and direct starts without selection state.
- Production build and relevant lint must pass before publication.
- Deployed DebugView validation is still required because localhost collection
  is intentionally disabled.
- Reports must use event-count ratios, not GA user counts as student counts.
- Automated Phase 3 tests cover the reusable attempt timer, exactly-once end,
  retry, `pagehide`, cleanup, and hidden/resumed duration.
- The instrumentation matrix is the source of truth for which routes may be
  included in lifecycle reports.
- Automated Phase 4 tests cover typed payloads, guarded classroom results, the
  complete player-progress key inventory, and preservation of classroom and
  unrelated local state.
- Automated Phase 5 tests cover exactly-once join results, controlled failure
  reduction, automatic-classroom-error isolation, confirmed-room disconnects,
  intentional leave/completed-room exclusions, and connection loss during a
  pending join.
