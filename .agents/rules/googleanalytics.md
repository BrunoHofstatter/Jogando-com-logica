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

## Current implementation: Phases 1 and 2

Phase 1 provides the collection foundation. Phase 2 connects that foundation
to the solo Caça Soma level lifecycle as the pilot. Other games, classrooms,
teacher actions, and multiplayer reliability are not instrumented yet.

### Code structure

```text
src/analytics/
├── analytics.ts          # host/build guard, one GA initializer, safe sender
├── events.ts             # typed public event functions and stable game IDs
├── PageViewTracker.tsx   # manual React Router page views
├── ActivityTimer.ts      # foreground timer with one guarded finalization
├── LevelAttemptTracker.ts # framework-independent level attempt lifecycle
├── useLevelAttemptAnalytics.ts # React visibility/page-exit integration
├── LevelAttemptTracker.test.ts # completion, retry, exit, and timing tests
└── analytics.test.ts     # collection, privacy, URL, ID, and timer tests
```

Components must call functions from `events.ts`. They must not import
`react-ga4` directly or invent event payloads.

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
| `select_content` | One of the six game cards is selected in `/jogos` | `content_type: "game"`, `content_id`, `entry_point: "game_catalog"` |
| `level_start` | A solo Caça Soma level first becomes playable after the Magic Number finishes rolling; retries start a new attempt | `game_id`, `level_id`, `game_mode`, `usage_context`, `participant_count` |
| `level_end` | A started Caça Soma level reaches its result or is abandoned by route exit/browser `pagehide` | start context, active `duration_seconds`, `end_reason`, aggregate round counts; completion outcome and stars when known |
| `tutorial_begin` | The Caça Soma levels tutorial overlay mounts | `game_id`, `tutorial_id` |
| `tutorial_complete` | The final tutorial step is completed | `game_id`, `tutorial_id` |
| `tutorial_skip` | The tutorial is explicitly skipped or closed with Escape | `game_id`, `tutorial_id`, `step_id` |

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

### Removed legacy behavior

Phase 1 removed:

- `Game_Selection` / `Click_Game` category-action-label events;
- `Game_Engagement` / `Time_Spent_In_Game` events;
- the `activeGameSession` value in `localStorage`;
- timing from game-card selection until tab hide, unload, or a navigation
  button.

That timer mixed rules/menu reading with gameplay, ended on the first tab
switch, missed direct links, and could carry state between different people on
one device. Phase 2 replaces it only for Caça Soma levels with an in-memory,
foreground-only attempt timer.

### Payload safeguards

The shared sender removes undefined values, malformed parameter names, and
forbidden fields. The current forbidden list includes:

```text
answer, answer_text, attempt_id, classroom_code, client_id, error,
error_message, free_text, host_name, message, name, player_name, raw_error,
room_code, school, school_name, student_name, user_id
```

Never send:

- player/student/teacher names;
- classroom, lobby, or room codes;
- school names;
- answers or free text;
- client IDs, user IDs, fingerprints, or attempt UUIDs;
- raw error messages or stack traces;
- values read from local progress storage.

For failures, a later phase may send a controlled low-cardinality code such as
`room_not_found`; it must never send the raw server or UI message.

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
    payloads.

For Phase 2 Explorations, register only the parameters that will be used. A
reasonable initial set is:

| Type | Parameters |
| --- | --- |
| Event-scoped dimensions | `game_id`, `level_id`, `game_mode`, `usage_context`, `end_reason`, `outcome`, `success`, `tutorial_id`, `step_id`, `entry_point` |
| Event-scoped custom metrics | `duration_seconds`, `participant_count`, `completed_round_count`, `correct_count`, `incorrect_count`, `stars_earned` |

Do not register browser/client IDs, attempt IDs, timestamps, room codes, or any
other high-cardinality or identifying value.

References:

- [Google: manual page views and disabling automatic measurement](https://developers.google.com/analytics/devguides/collection/ga4/views)
- [Google: tag privacy settings](https://developers.google.com/tag-platform/security/guides/privacy)

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

## Remaining planned event contract

The following events remain targets for later phases. The Caça Soma
`level_start`, `level_end`, and tutorial events described above are already
implemented and are not merely planned.

| Event | Intended fire point | Important parameters |
| --- | --- | --- |
| `game_start` | Board/round becomes playable | `game_id`, `game_mode`, `entry_point`, `usage_context`; difficulty/participants when known |
| `game_end` | Completion, route abandonment, error, or disconnect | start context, `duration_seconds`, `end_reason`, optional `outcome` and `success` |
| `classroom_create_result` | Server confirms creation result | `success`, controlled `error_code` on failure |
| `multiplayer_join_result` | Server confirms join result | game/mode, `success`, `wait_ms`, controlled failure code |
| `feedback_open` | Teacher opens feedback form | `entry_point` |
| `local_progress_reset` | Shared-device reset is confirmed | `reason: "player_switch"` |

Suggested shared parameters:

```text
game_id, game_mode, entry_point, level_id, difficulty, participant_count,
usage_context, duration_seconds, success, outcome, end_reason,
incorrect_count, hint_count, error_code, wait_ms
```

Use controlled enums such as:

```text
game_mode: solo | local_multiplayer | ai | online_private | classroom
usage_context: standard | classroom
end_reason: completed | abandoned | error | disconnected
```

`ActivityTimer` now powers the Caça Soma level pilot. Later game integrations
should reuse the guarded lifecycle pattern while choosing their own true start
and end points.

## Rollout status

| Phase | Status | Scope |
| --- | --- | --- |
| 1 | Implemented in code; GA admin/DebugView validation pending | Reliable initialization, manual page views, typed selection event, privacy guard, timer removal |
| 2 | Implemented in code; deployed DebugView validation pending | Pilot Caça Soma level lifecycle, active timing, aggregate outcomes, and tutorial events |
| 3 | Planned | Remaining public games |
| 4 | Planned | Teacher, classroom, outreach, and local shared-device reset |
| 5 | Planned | Multiplayer reliability and GA4 reports/explorations |

### Phase 2 pilot verification status

- Automated tests cover one start/end, completion, retry, route cleanup,
  pagehide, hidden/resumed timing, and direct starts without selection state.
- Production build and relevant lint must pass before publication.
- Deployed DebugView validation is still required because localhost collection
  is intentionally disabled.
- Reports must use event-count ratios, not GA user counts as student counts.
