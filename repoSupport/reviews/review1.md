# Review 1: Bomb Game Level 1 — Numbers

Date: 2026-09-26. Scope: current Level 1, from rules and level selection through private/classroom joining, role assignment, all three modules, feedback, results, replay, and exit. Reviewed on `dev` at `cd6b504f32dd30d3cc9cb865cf3782513559f933`. Bomb Game implementation had no scoped uncommitted changes at the initial and final checks. Unrelated Rubik's cube, calculation, and documentation edits were present and preserved; Repo Support itself was untracked.

Followed `repoSupport/overview.md` and `repoSupport/review.md`. This is a feature review, not a commit comparison. No production code or tests were changed.

## R1-1 — Validate socket payloads before destructuring and string operations

**Type:** bug. **Impact:** high. **Confidence:** confirmed by static control flow; process crash was not executed.

Bomb Game socket handlers trust their outer payload shape. For example, `create_room` with `{}` reaches `normalizeName(undefined)` and `.trim()` throws; `join_room` with a non-string code likewise throws. A null payload can fail during parameter destructuring before any validation. TypeScript event interfaces do not validate network input. These exceptions escape the handlers; the server entry point has no exception containment. A malformed packet can therefore terminate the shared multiplayer process and interrupt other games, not just the offending room.

Evidence: `multiplayer-server/src/sockets/registerBombGameRoomHandlers.ts:90`, `:131`, `:184`, and helpers at `:330–333`; `multiplayer-server/src/index.ts`. The inner intent validator in `src/BombGame/Logic/levels.ts` is useful but does not protect the envelope.

Direction: accept unknown payloads at the boundary, check object/string/boolean fields before use, then normalize and authorize. Return controlled errors or ignore malformed requests. Add malformed-envelope coverage without swallowing unexpected programming errors. This is a bounded handler change, not a reason to redesign the multiplayer engine.

## R1-2 — Make disconnection visible and stop accepting local input

**Type:** bug. **Impact:** medium. **Confidence:** confirmed by static control flow.

During an active match, a partner disconnect sets `opponentDisconnected`, but only `RoomBar` displays that warning, and `RoomBar` is hidden during play. `MatchBar` ignores it. The following `state_updated` also clears the stored error message. The remaining player keeps seeing an apparently active partner until room closure, while time continues running.

On the disconnected player's side, the page says controls are unavailable, but Level 1 does not receive the disconnected flag that Navigation receives. Ordering buttons remain enabled and equation timers continue. The hook silently drops submissions while the socket is disconnected, leaving local answers with no authoritative confirmation. Automatic transport reconnection does not restore the room: the server authorizes by the old socket ID, and the connect handler retains the disconnected room snapshot.

Evidence: `src/BombGame/Pages/BombGamePage.tsx:31–45`, `:48–56`, `:92–119`; `src/BombGame/Hooks/useBombGameMultiplayer.ts:83–93`, `:122–139`, `:228`; server disconnect handler at `multiplayer-server/src/sockets/registerBombGameRoomHandlers.ts:220`.

Direction: show partner status in the active header; disable Level 1 inputs and cancel pending timers on local disconnection. Provide a clear route back to the lobby when the session cannot resume. True reconnection is explicitly deferred in the project documentation and is not required to fix this feedback problem; avoid promising that a partner can return when no rejoin path exists.

## R1-3 — Base displayed time on a synchronized server clock

**Type:** bug. **Impact:** medium. **Confidence:** confirmed by arithmetic and static control flow.

The server sends absolute timestamps from its `Date.now()`, while `useCountdown` subtracts the student's local `Date.now()` without estimating the offset. A computer five minutes ahead displays zero throughout a three-minute round; a computer behind displays extra time before the server ends the match. Countdown announcements are affected too. Server validation remains authoritative, but the visible deadline can mislead both players.

Evidence: `src/BombGame/Pages/BombGamePage.tsx:189–192`; `multiplayer-server/src/sockets/registerBombGameRoomHandlers.ts:236–245`; timestamp fields in `src/BombGame/Logic/multiplayer/protocol.ts`.

Direction: include server time in snapshots and estimate clock offset, or anchor received remaining duration to a monotonic local clock. Account for network delay and resynchronize on later snapshots. Keep the server deadline check. Cover positive/negative clock skew and local clock changes.

## R1-4 — Disabling hints still highlights the manual's answer calculations

**Type:** bug. **Impact:** low. **Confidence:** confirmed by static control flow.

With “Dicas ativadas” unchecked, an incorrect numeric/operator answer still highlights its relevant letter calculations. `ManualPanel` always calls `getHintLetters`, which checks the mistake but not `hintsEnabled`. Only the explanatory hint box is gated. This defeats part of the host's difficulty setting.

Evidence: `src/BombGame/Pages/BombGamePage.tsx:159–165`, `:195–199`; highlight styling in `src/BombGame/styles/GamePage.module.css:67`; `.agents/rules/game_bomb.md`, “Hints Setting.”

Direction: gate educational highlighting with `hintsEnabled`, while keeping ordinary incorrect-answer feedback. Verify the same mistake in both settings.

## R1-5 — Improve keyboard focus and accessible feedback

**Type:** product/usability suggestion. **Impact:** medium. **Confidence:** confirmed markup/style omissions; practical assistive-technology impact not browser-tested.

Numeric fields remove their outline and have no local focus replacement. The exit overlay has no dialog semantics, focus transfer/trap, Escape handling, or focus restoration. Keyboard focus can remain behind an apparently modal screen. Incorrect answers clear after validation, but the heart-loss message and hint are not live regions, and fields do not expose invalid status. A screen-reader user may miss why an answer disappeared.

Evidence: `src/BombGame/styles/GamePage.module.css:47`; `src/BombGame/Pages/BombGamePage.tsx`, `NumericEquation`, `ActiveMatch`, `ManualPanel`, and `ConfirmOverlay` (`:185–186`). The inspected global CSS does not provide a Bomb Game input focus replacement.

Direction: add visible focus styling, a properly managed dialog, and concise Portuguese status/error announcements linked to the affected control. Preserve existing useful input labels, pressed-number states, and module completion labels. This needs focused interaction work, not a visual redesign. Browser/keyboard verification should follow only with explicit permission.

## R1-6 — Add Level 1 coverage at the actual failure boundaries

**Type:** architecture improvement (verification). **Impact:** medium. **Confidence:** confirmed by test inspection.

The four Level 1 tests cover partial generation constraints, preserved ordering progress, fixed operators, and positive manual operands. They do not exercise a complete win, all module orders, numeric-answer acceptance, completed-control locking, or role projections. The existing socket lifecycle test creates a default Level 1 room and closes it; its played rounds are Navigation. There is no Level 1 UI coverage for two-second timers, cancellation, disconnection, or mistake targeting.

Evidence: `src/BombGame/Logic/level1.test.ts`; `src/BombGame/Logic/navigation.test.ts:150–168` (some Level 1 role/type rejection coverage does exist); `multiplayer-server/src/sockets/registerBombGameRoomHandlers.test.ts`.

Direction: add a focused Level 1 socket lifecycle test for win/loss/replay, wrong role, stale/duplicate actions and deadline enforcement; strengthen generation invariants to check evaluated calculations and unique ordering numbers; test UI timers and hints with fake time. Include rapid repeated incorrect ordering clicks: the hook creates a different action ID per click, so transport deduplication alone does not prevent multiple heart losses before feedback. Decide the desired handling of that interaction before encoding it as a test. Do not merely mirror implementation constants.

## R1-7 — Decide whether fixed operator answers meet the cooperation goal

**Type:** behavior question. **Impact:** medium. **Confidence:** confirmed behavior; whether to change it is a product decision.

The operator answers are always `+`, `−`, `−`, regardless of the generated manual. Returning players can complete that module from memory. Once those operators are known, the displayed equation results also reveal A, C, and D by simple arithmetic. B remains manual-only, so this is not a claim that the entire level is independently solvable. The ordering rule is also fixed. The partner therefore becomes less necessary for substantial portions of replayed rounds.

Evidence: `src/BombGame/Logic/level1.ts:104–110`; `src/BombGame/Logic/levelViews.ts:31–37`; the fixed solutions are explicitly documented in `.agents/rules/game_bomb.md`, “Implemented Level 1,” and asserted in tests.

Decision: is Level 1 intentionally a predictable introduction, or should repeated play require renewed communication? Keep the current pattern if predictable onboarding is the goal. Otherwise generate varied, unambiguous operators and corresponding role-separated clues. That changes the accepted design and needs coordinated generator, projection, instructions, and test changes; it is not a corrective refactor.

## R1-8 — Decide whether two seconds without typing should commit a life-costing answer

**Type:** behavior question. **Impact:** medium. **Confidence:** confirmed behavior; classroom impact is an unvalidated usability concern.

Every integer-looking numeric draft is treated as complete after two seconds. A student entering a two-digit answer can pause after the first digit to think or speak and lose a heart. Reopening the operator selector does not pause its timer: the previous choice can be submitted while the student is choosing a replacement. The rules page does not explain automatic submission, and the controls expose a pending visual treatment but no clear confirmation instruction.

Evidence: `src/BombGame/Pages/BombGamePage.tsx:123–156`; `src/BombGame/Pages/RegrasPage.tsx`; `.agents/rules/game_bomb.md`, “Level 1 Interface Details,” explicitly specifies this delay.

Decision: retain automatic commitment or use an explicit confirmation action? If retained, explain it in Portuguese, make pending status understandable, and define whether opening the selector pauses submission. Explicit confirmation adds an interaction but separates thinking time from a committed answer. No classroom validation was found or inferred.

## What is working and scope boundaries

- Level generation and validators agree on ordering, letter ranges, numeric targets, and operator solutions. B − C can equal zero; positive manual operands do not imply positive final answers. Zero is accepted by both input parsing and validation.
- Server authority is retained: role/intent checks, deadline checks, lives, completion, and replay are server-owned. Correct ordering progress survives mistakes, solved rows reject further edits, and sections can be completed independently.
- Role payloads whitelist fields rather than spreading the authoritative puzzle. The bomb does not receive the manual calculations or raw letter-value record. The manual receives shared progress/mistake metadata by design, including a mistaken ordering value; it does not receive the full live board.
- Current clients send round IDs and unique action IDs. Level 1 deliberately accepts an omitted round ID for legacy clients; this is a compatibility exception, not full stale-round protection for every sender. Navigation requires the token.
- Role preferences, cancellable replay votes, regenerated puzzles, lobby routing, classroom namespace integration, cached names, BASE_URL artwork references, and application route-exit cleanup are present. No broad engine refactor is warranted for this custom game.
- Next-level voting and local unlock progression are not implemented. The document mixes a target flow with current behavior, and later-level progression is explicitly deferred; this review does not classify that roadmap gap as a regression. Level 2 is reserved and Level 3 can be selected separately.
- The level's online-only architecture and provisional English game name are explicit game-specific decisions. They were not mistaken for accidental violations of the broader offline/Portuguese platform defaults. Instructional UI text inspected is Brazilian Portuguese.
- Responsive artwork, portrait stacking, and reduced-motion styling exist. Actual fit, clipping, touch-target usability, and low-end-device performance were not visually or empirically verified. No layout defect is asserted from appearance alone.

## Checks and limitations

- `npm run test -- src/BombGame multiplayer-server/src/sockets/registerBombGameRoomHandlers.test.ts`: **18 tests passed across 4 files**, including the existing real Socket.IO Navigation lifecycle test. This is not a full Level 1 end-to-end test.
- `npm run build`: **passed**. Vite reported the existing large-chunk condition (main JS about 808 kB, gzip 243 kB). The application eagerly imports many games; this review does not attribute that whole payload to Level 1 or propose an unscoped bundle rewrite.
- `npm --prefix multiplayer-server run check`: **passed**.
- `npx eslint src/BombGame multiplayer-server/src/sockets/registerBombGameRoomHandlers.ts multiplayer-server/src/sockets/registerBombGameRoomHandlers.test.ts`: **passed**. Whole-repository lint was not run.
- No browser, screenshots, Playwright, local website previews, deployment, new tests, or production changes. Defect triggers above are source-based conclusions, not claims of browser reproduction. No destructive malformed-packet experiment was performed.
