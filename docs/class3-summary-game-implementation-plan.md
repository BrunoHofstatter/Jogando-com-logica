# Class 3 summary game: design contract and staged implementation

Date: 2026-10-03.
Latest design revision: 2026-10-03, including the recognition/movement progression.
Status: desktop implementation and follow-up edits are present; the latest focused
tests pass. Browser verification was authorized but stopped by the browser tool,
so Stage 8 (visual playtest/tuning) remains incomplete.
Mobile controls and dedicated reduced motion remain deferred. This document
is a standalone implementation contract: sections 1–16 describe the latest design
to build even from a checkout that has no Class 3 summary game. Do not implement
an older version first. Section 2 describes that pre-game baseline; sections 17–18
separately record implementation/check status and historical verification.
Deployment is not part of this task.

## 1. Scope and decision status

Build a desktop review game for `Multiplicação nas Faces`. The player aims a toy
cannon at approaching educational cubes. Current ammunition describes:

`number of target-colored faces × quadradinhos per face`

The main review contains ten rounds. Each round owns three mathematical cubes,
exactly one correct target, and one ammunition expression. A later trio can appear
and approach while the current round is still unresolved.

The cannon ALWAYS carries the ammunition of the oldest unresolved round. Aiming
never changes ammunition. There is no manual ammunition switching. Shooting a
later trio is wrong, even if the player recognizes its own future correct target.

Decisions explicitly requested/agreed in the discussion:

- Large Class 2-style introduction with an animated gameplay example and a small
  explanation of the two ammunition factors.
- One protected shooting practice with two different centered cubes, arriving
  sequentially. Both must be shot; no ammo, ammo icon, or mathematical choice is
  shown during practice. No standalone one-face warm-up or `3×3 = 9` transition.
- Ten main rounds, replacing the proposed survival countdown.
- Two simultaneously visible/approaching trios, with no non-shootable depth zone.
- Next-trio appearance triggered by a correct current hit or a travel threshold.
- Three cubes per initial trio; their positions are slightly staggered.
- Random target color chosen before the introduction and retained for that game.
- Gray excluded faces, matching Class 3's teaching appearance.
- Top-first coloring and adjacent colored side faces for every gameplay cube;
  prefer clearer face-count discrepancies in distractors, with no equal-product strategy.
- Four gently rocking rounds with three inspectable faces, then four continuously
  sweeping back-and-forth rounds with four inspectable faces and no back view,
  then two full-rotation rounds. No held views, inspection stops, or pause sequence.
- Frosted gray corridor, wide upper entrance and narrower destination, curved
  approach paths, repeatedly inspectable faces.
- Blue clock cube every two groups, providing five seconds of stopped approach
  while mathematical cubes continue rotating.
- Clock/success cubes are solid blue/green 3D cubes with white icons, no grids,
  dark face outlines, or Rubik-style gaps. Subtle same-hue face shading shows depth.
- Correct target becomes the green checkmark cube after a short response delay;
  its distractors disappear at the same time. Shooting itself responds immediately.
- New trio requests have an approximately one-second appearance delay, in addition
  to spacing/cap/freeze rules. Already visible trios stay visible.
- Removed distractors leave a clearly visible, larger gray/white smoke/dust burst;
  it remains inexpensive rather than becoming a particle simulation.
- Wrong current distractor recoils/jumps, flashes red, shakes, then disappears.
- Three large fragmented hearts on the right; nine total health points. Wrong
  cube costs one point; required target escaping costs three; distractor escape
  costs nothing.
- All completed round circles are green/check, including escaped rounds. Hearts
  communicate damage; the round indicator communicates progression only.
- Larger, detailed playful SVG cannon; purple ammo box to its left with a small
  matching energy-ammo icon beside the box, without labels or overlap.
- Readable light practice/result text with controlled outlines and contrasting
  panels. Results display the actual remaining fragmented hearts.
- Desktop crosshair and generous aiming assistance. Crosshair is interpreted as
  red from the latest transcribed message, with a contrasting edge.
- Asset work comes first. Mobile joystick/fire controls and dedicated reduced
  motion adaptation are deferred to separate stages.

**D1, resolved by the user: shooting a later trio.** All later-trio cubes cost one
health point and flash/recoil/shake but remain. Wrong cubes in the current round
disappear. This preserves the later correct target until its ammo becomes current.
There is no restoration/replacement rule and no non-shootable area.

The remaining choices below are concrete proposed defaults. They are not claims
that the user explicitly chose every number or detail. Timing, visual proportions,
damage, and round count remain tuning parameters rather than validated balance.

## 2. Repository baseline before this implementation

The following describes the baseline at planning time, not the newly implemented
review. See sections 18 and the class context for current behavior.

- Class 3 has the learning sequence and a lesson-completion screen. It has no
  summary game and ClassMenu currently sets `hasGame={false}` for it.
- Class 3 route remains `ROUTES.CLASS_3`, `/aulas/3-cubo-inteiro`.
- Classes 1 and 2 support direct game entry with navigation state `mode: "game"`.
  Class 2 also recognizes `?mode=game`.
- The current Class 2 review has an animated introduction, foreground-aware
  movement, replay, and a shared completion dialog. Its source has evolved since
  the first September discussion; consult current code at implementation time.
- `RubiksCube.tsx` implements six CSS 3D faces and one element per sticker, plus
  lesson-specific rotation, hints, and interaction. A 6×6 has 216 stickers.
- The repo has substantial existing uncommitted changes, including Class 1–3,
  shared review components, routes, analytics-related docs, and App. Preserve and
  re-read them before integration; do not restore, rewrite, or discard them.
- Package versions in package.json are newer than the broad stack summary in
  AGENTS.md. Implement against the actual installed React/TypeScript/Vite setup.

Relevant existing files:

| Concern | Source |
| --- | --- |
| Rubik's class context | `.agents/rules/game_rubiks.md` |
| Implemented Class 3 teaching | `docs/class3-equal-faces-implementation-plan.md` |
| Cube API and face mapping | `docs/rubiks-cube-component.md` |
| Class 3 page and lesson hook | `src/RubiksClass/Classes/Class3_totalSquares/Class3TotalSquares.tsx`, `useClass3.ts` |
| Class 2 review example | `src/RubiksClass/Classes/Class2_faceArea/Class2SummaryView.tsx`, corresponding CSS and `class2Review.ts` |
| Shared completion conventions | `src/RubiksClass/Components/ReviewCompletion.tsx` |
| Entry and checkpoints | `src/RubiksClass/Testing/LessonEntry.tsx`, `entryContext.ts`, `checkpoints.ts` |
| Menu entry | `src/RubiksClass/Classes/ClassMenu.tsx`, `ClassIcon.tsx` |
| Existing navigation chrome | `src/App.tsx`, `src/routes.ts` |
| Analytics contract | `.agents/rules/googleanalytics.md`, `src/analytics/useGameAttemptAnalytics.ts` |

## 3. Full player flow

### Entry and introduction

Direct `Jogar` opens the review introduction. Proposed lesson flow: preserve the
learning completion and offer a `Jogar` action leading into the same introduction.
Do not force the timed game on a learner who wants to return to Aulas.

At introduction creation, choose the session color from blue, red, green, orange,
and yellow. The introduction, practice, and main game share that color. White is
excluded. Replay chooses a new session color; repeating the same color by chance
is valid. Do not reroll color on React rendering, screen resizing, or intro loops.

The introduction itself has no real health damage, round progression, spawning,
or game-attempt start. Only its demonstration timeline runs. `Jogar` begins the
interactive practice.

### Protected shooting practice

- Two cubes of different sizes: first 3×3, then 4×4. Each arrives alone on the
  center lane (no stagger); both are valid targets and both must be shot.
- Use the shared gray/selected-face style and session color, with gentle rocking
  around the same three-face view as rounds 1–4. Color the top alone on the 3×3
  and top plus one visible side on the 4×4; these are not quiz conditions.
- Hide the ammo box and its icon completely. There are no distractors or size
  selection task. This practice teaches aiming and firing only.
- The same cannon, crosshair, aim assistance, projectile, and success effect as
  the main game.
- Brief instruction: `Mire no cubo e clique para atirar!`, with no `1 de 2` /
  `2 de 2` counter. Use a smaller, content-sized blue panel on the left with light
  outlined text, left-aligned; leave the centered cube path unobstructed. Initial
  placement: left 3%, top 14dvh, max-width 32%, modest padding and font size.
- Practice is separate from circles 1–10. Hearts show nine health and all main
  round circles remain upcoming/inactive. Empty shots have no penalty or statistics.
- Each cube approaches but stops at normalized progress 0.76 if the player
  needs more time. Rotation continues. Practice has no deadline or escape loss.
- A hit reserves the cube, pauses its approach, and uses the same 0.55-second
  shot-to-green delay as main play. Keep it visible until replacement; repeated
  clicks cannot count it twice. Show its green cube for about 0.8 seconds.
- After resolution, wait one foreground second before starting the next practice
  cube at the entrance. Only that second cube is then visible/hittable; do not
  overlap practice targets or show the next one early.
- After the second hit resolves, use the same one-second transition before round
  one. No per-face calculation explanation is inserted.
- Main health is reset to nine and rounds start at one after practice.

### Main game and end

- Ten planned rounds, with current ammunition determined by the oldest
  unresolved round.
- Correct current target enters `resolving`; after the short feedback delay it
  becomes `hit`, replaces its cube with green, removes distractors, and advances ammo.
- Required current target escaping resolves it as `escaped`, costs three health,
  and advances the ammo if health remains.
- Reaching zero health loses immediately, including when the tenth target
  escapes. Loss takes priority over finishing the round list.
- Resolve all ten with health greater than zero to finish successfully. This is
  survival through ten rounds, not a claim that every expression was answered
  correctly. The result distinguishes hits and escapes.
- On the tenth successful resolution, hold the green feedback for about 0.8
  seconds before the result overlay. On a surviving final escape, allow its dust
  about 0.9 seconds before the result. Block further gameplay input during this
  final feedback hold; no eleventh trio or global survival timer exists.
- Freeze gameplay input and movement at the result. Retain the scene beneath a
  focused result overlay.
- Success text: `Você chegou ao fim das 10 rodadas!`; loss text: `Vamos tentar de novo?`.
- Show three fragmented hearts with the exact surviving health, including partial
  hearts (or empty hearts on loss), near the outcome text. Do not reset health for
  this display. Keep actual hits, escapes, and wrong-shot totals as secondary text.
- Result headings/body use light text with a restrained dark-blue outline/shadow
  on a contrasting blue panel. Explicitly override inherited global paragraph/
  heading stroke styles; do not rely on setting only the text fill color.
- Actions: `Jogar novamente` and `Aulas`. Do not add a Class 4 button while its
  lesson remains unavailable.
- Replay returns to a fresh introduction/practice and independent game attempt.

## 4. Ammunition, rounds, and trio lifecycle

Use stable round IDs 1–10. A round's semantic state is `unspawned`, `approaching`,
`resolving`, `hit`, or `escaped`. Current means the oldest round not yet hit/escaped,
including its resolving interval or pending appearance. At most two unresolved
visible trios exist; resolving counts toward that cap. A resolving trio remains
visible but its mathematical cubes accept no further hits. Effects from resolved
rounds do not count as live trios and accept no hits.

Only current ammo is shown, in a purple box to the left of the center-bottom
cannon, with a small energy-ammo icon outside/beside the box. Reserve enough space
for the larger cannon, including its aiming sweep. Main ammo is a bare expression
such as `3 × 9`; no factor labels, caption, or per-trio ammo badges are added.
Practice hides the entire ammo dock. The introduction preview does show it.

Spawning contract:

1. Spawn round one when main play becomes usable.
2. Each round can request its immediate successor once, either when correctly
   hit or upon crossing its normalized approach threshold, whichever comes first.
3. Escape also requests the successor if it was not already requested, preventing
   an empty game when an unusual scheduling order occurs.
4. A request is idempotent; threshold and shot on the same frame cannot spawn two.
5. Store a one-second earliest-appearance deadline on the approach clock when a
   request is first made. The clock pauses during time stop. Also respect the
   1.2-second minimum spawn interval and two-live-trio cap; a pending request is
   fulfilled only after all conditions allow. Repeated triggers never reset the
   deadline or create another request. Round one's entry after practice is exempt
   from successor-request delay because practice already has its transition hold.
6. If the successor already exists, advance to it without spawning it again. Its
   own successor is governed by its own trigger, not by blindly spawning on every
   ammo change.
7. After round ten, no successor exists.
8. During time stop, record requests but defer actual new-trio spawning until
   approach resumes. An already visible newer trio may become current after the
   old trio's resolution delay, including during freeze; do not hide, delay its
   visibility again, reset its travel, or respawn it on an ammo change.

If a current round resolves before its successor can appear, briefly show the
incoming expression but accept no mathematical cube hits until that round exists.
Do not allow shots against discarded effects or stale targets. Keep transition
gaps short, with no additional explanatory modal.

Newer trios must not pass older unresolved trios. Use group depth with only small
within-group offsets; stable front-to-back ordering is part of path validation.
Queued cubes cannot incur an escape penalty before becoming current. If geometry
would violate this, slow that group's approach smoothly rather than jumping it
backward or silently marking it resolved.

Round indicator replaces the previously proposed timer beneath the hearts:

- Ten numbered circles, in two rows of five beneath the hearts, retaining a
  comfortably readable circle size rather than squeezing ten into the old row.
- Current: warm yellow/amber fill and strong outline.
- Not yet current: neutral gray, including a round already visible in the distance.
- Completed: green with a small check, both for `hit` and `escaped`. Do not add a
  red/cross outcome variant; hearts already communicate mistakes and survival.
- While `resolving`, retain the current highlight and old ammo until resolution.
- Show `Rodadas` as an accessible name; a visible text label is optional and should
  not crowd the interface. Preserve the numbers and use symbols as well as color.

## 5. Challenge generation

Generate a ten-round deck in advance using an injectable random source/seed.
The seed is an implementation/testing tool, not a persistent player identifier.

A cube specification contains size, session color, selected named faces, stable
cube ID, round ID, slot/trajectory offsets, motion style, and starting Y angle. Matching uses
the two semantic factors, not the numerical product:

`faceCount === ammo.faces && size * size === ammo.squaresPerFace`

Normal gameplay sizes: 2, 3, 4, 5, and 6. Initial coverage: two correct targets of
each size across ten rounds. Choose the first size from 2 or 3, shuffle the other
four, then use that five-size order twice; regenerate face counts/masks/distractors
for each round. This is an initial deck rule, not an assessed
difficulty system. Colored-face count ranges are 1–3 for rounds 1–4, 1–4 for
rounds 5–8, and 1–5 for rounds 9–10. Apply these limits to targets AND distractors.

Movement determines the permitted face masks (see section 8 for angles):

- Rocking: top, front, and the one side exposed by its fixed central angle. A
  negative central Y angle exposes right; the mirrored positive angle exposes left.
- Wider sweep: top, front, left, and right across the smooth movement. Back is
  never revealed. Four inspectable faces does not mean four visible simultaneously.
- Full spin: top, front, right, back, and left across rotation.
- Faces outside that movement's inspectable set stay gray. The bottom always
  stays gray. Never generate hidden colored faces then rely on an easier motion
  style that prevents the child from seeing them.
- Top is always colored first, including on every distractor. Additional colored
  side faces form one contiguous run, rather than scattered sides separated by gray.
  For rocking, choose from front and its exposed side; for sweep, choose a contiguous
  slice of left/front/right; for full spin, choose a contiguous cyclic slice of
  front/right/back/left. Vary valid starts and lengths, but never remove the top.
- All three cubes in a trio share its motion style and rocking/sweeping pose;
  individual random 360° starting angles are allowed only for full-spin rounds.
  Presentation must not single out the target.

Six-face content remains in the lesson and the explicitly requested fully colored
intro distractor; that demo cube is an exception to the gameplay face-mask rules,
not a normal six-face challenge. Its visible multiple faces already reject `1 × 9`.

Distractor strategies:

- Same size, different face count, with larger or smaller differences.
- Same face count, different size, with adjacent or more distant sizes.
- Different size and different face count.

Pick two nonidentical strategies/configurations with constrained randomness.
When a strategy changes the face count, first choose from valid candidates with
an absolute difference of at least two colored faces. If none remain after the
motion limits and previous-ammo exclusion, fall back to a one-face difference.
For example, a two-face target in the three-face rocking set cannot have a two-face
count discrepancy; do not introduce a hidden fourth face to force that difference.
Avoid always using one-less-face or one-next-size. Require exactly one target,
avoid duplicate distractors, shuffle target placement, and vary face placement
within the top-first/adjacent/movement constraints. All colored faces use the same
session color. No wrong-color distractors, partial faces, extra arithmetic, or
dedicated equal-product distractors. An incidental equal product is not special:
it is still judged by the factors.

Across the ten rounds, include challenges requiring face-count discrimination
and challenges requiring size discrimination, without displaying a fixed pattern
of distractor roles. Do not let the correct target be predictable from its screen
position, starting angle, glow, or unique scale.

Since later cubes are always wrong under current ammo, avoid displaying a later
cube that semantically matches the preceding round's ammo. Otherwise a visually
valid match would be rejected only because of hidden ownership. Also avoid
identical adjacent ammo. Implement bounded candidate selection with a valid
fallback pool, not unbounded random retries.

## 6. Shooting, penalties, and effect ordering

The mouse controls the crosshair and cannon barrel continuously within the game
surface. One primary pointer press fires one shot; holding does not auto-fire.
Ignore pointer events originating from Aulas, navigation chrome, intro actions,
or result controls. Restore the normal pointer when leaving the gameplay surface.

Use enlarged projected cube hit regions with modest padding and a minimum useful
size. Never expand regions so broadly that adjacent choices become indistinguishable.
Where regions overlap, first prefer a cube whose visible silhouette contains the
pointer; then use the nearest eligible candidate within assistance distance,
breaking ties by frontmost depth. Test this resolver independently of artwork.

Lock round ID, current ammo, and target cube ID at fire time. The fast projectile
animates that decision; do not re-evaluate it against different ammo on arrival.
Reserve a hit cube immediately so repeated clicks cannot apply repeated damage
or multiple round completions during the reaction.

| Shot/result | Health | Round effect | Cube effect |
| --- | --- | --- | --- |
| Current correct cube | None | Reserve immediately; resolve hit and advance ammo after delay | Keep target visible until green replacement; then other current cubes blink out with visible dust |
| Current wrong cube | -1 | Current remains unresolved | Short jump, red flash, shake, then remove with dust |
| Later-trio cube | -1 | No round resolves | Flash/recoil/shake, then remain available (D1) |
| Clock cube | None | No round resolves | Collect; activate time stop |
| Empty space | None | None | Pellet dissipates; no hit feedback |
| Current required target escapes | -3 | Resolve escaped, advance | Clear that trio; short damage feedback |
| Distractor or clock escapes | None | None | Remove without a health event |

Successful shot timeline (foreground inspection/effect time):

1. At fire time, show the cannon's immediate recoil/muzzle response and start the
   roughly 0.15-second pellet flight. Snapshot ownership, expression, and hit point.
2. Reserve a correct target immediately and mark its trio `resolving`; keep its
   educational cube visible, allow a subtle brightness/hit cue, and stop that
   trio's approach. It cannot leak or be completed twice. Rotation continues.
3. At about 0.55 seconds after firing (0.15 flight plus 0.4 response hold), replace
   the target with the solid green check cube and remove its remaining distractors
   with dust simultaneously. Only now advance ammo, round marker, and hit count.
4. Hold the success cube for about 0.8 seconds, noninteractive. Main play can move
   to the already visible next trio during this hold. For a new trio, its independent
   one-second spawn deadline plus spacing/cap/freeze rules still apply; the deadline
   starts at the original request, not again when green replacement occurs.
5. On the last round, let this feedback finish before opening results. Practice
   instead waits one second after resolution before showing its next cube/main play.

Only the resolving trio's approach stops for feedback; this is not a global time
stop. A visible later trio continues approaching/rotating and retains the usual
wrong-shot penalty until its ammo becomes current. If a wrong shot elsewhere
reduces health to zero during the delay, immediate loss cancels pending resolution.

Smoke/dust must be visible against the pale corridor: use a fuller burst of
overlapping white and medium cool-gray puffs with darker gray backing, expanding
from roughly 1.15 to 2.1 times the cube footprint and drifting upward slightly.
Hold strong opacity early, then fade over about 0.9 seconds. A few SVG circles and
small flecks suffice; no heavy particle system or animated blur. Wrong current
hits start this dust only after their approximately 0.35-second jump/flash/shake.

Wrong-current-cube removal reduces its trio below three; three is the spawn count,
not a rule to keep replenishing guesses. Never remove the correct current target
on a wrong shot. With D1's agreed rule, every later cube behaves identically
when hit: do not reveal which is its future target through different reactions.

Health is an integer 0–9, clamped at zero. Three hearts have three irregular SVG
shards each, with a faint empty silhouette. One point damages one shard; three
points always remove three shards, even across heart boundaries. A broken shard
may move/fade briefly; keep the HUD still rather than shaking the entire screen.

Resolve events deterministically: an accepted shot is committed at its firing
timestamp; a target whose escape was already committed is no longer hittable.
Once a correct hit is accepted it cannot subsequently leak. Terminal health loss
prevents any later gameplay actions, spawns, or queued success callbacks.

## 7. Clock power-up

- One collectible with every second trio: rounds 2, 4, 6, 8, and 10. No other
  power-up type is added.
- This is an extra special cube alongside a trio, not one of its three choices.
- Solid blue faces and a large white clock icon; no mathematical sticker grid,
  dark face outline, rounded gaps, or Rubik-style borders. Keep the face edges
  joined, with subtle same-hue shading to make the shape read as an actual cube.
- Icons remain visible while approaching. Mathematical session color may also be
  blue; the ungridded surface and icon distinguish the collectible.
- Proposed speed: twice the mathematical approach speed on a separate slightly
  offset path, avoiding placement over a mathematical cube.
- Skipping it is harmless. It clears with its associated group if still uncollected;
  do not leave an orphan collectible blocking a later path.
- A hit freezes approach, escape progression, and timed spawning for five visible
  foreground seconds. Cube Y rotation, aiming, shooting, projectiles, and brief
  feedback continue. Successful shots can change current ammo during the freeze.
- Show a subtle icy outline/glow and a small clock near the cannon during the
  effect. No global countdown returns to the interface.
- If another clock is collected during a freeze, refresh to five seconds rather
  than accumulate duration. This is a proposed default for an uncommon overlap.
- Hidden-tab time does not consume the power-up. At resume, there is no movement
  jump. No spawning backlog fires in a burst after the freeze.

## 8. Scene geometry, readable motion, and layout

The intended composition is a wide distant entrance immediately below the home
control, with the foreground route narrowing toward a central cannon. It is a
stylized frosted corridor, not a requirement for literal camera geometry.

Starting layout targets (fluid units; tune against actual artwork):

- Entrance: approximately 90% viewport width, upper edge below existing chrome.
- Destination: approximately 30% width, above the cannon; widen if three large
  cubes would collide or their hit regions overlap excessively.
- Three curved lanes preserve left/center/right order throughout travel.
- World depth controls position, growth, drawing order, and shadow together.
- Small stable vertical/depth offsets create a natural stagger. Do not randomize
  each frame, cross lanes, introduce bobbing that makes aiming difficult, or let
  stagger change a trio's escape/round order.
- Cubes have the same world-scale dimensions regardless of grid size. Grid size
  is read from stickers, not an artificially bigger 6×6 silhouette.
- Scale grows clearly during approach; lateral motion alone is insufficient.
- Initial projected width fraction can use `0.056 + 0.025p + 0.039p²`, where `p`
  is normalized approach, so distant grids stay readable and growth strengthens
  near the player. Use this equally for all mathematical sizes, not just targets.
- Keep the wide spawn entrance and inward curved lanes, but do not treat the
  wide opening itself as a literal vanishing point. Add environmental perspective
  cues within it: compressed floor-band spacing in the distance, increasingly
  separated bands nearby, central converging guide lines, visible side-panel
  structure/curbs, and stronger cube grounding shadows.
- The path must visibly differ from the background. Use cool slate/blue-gray floor
  shading (lighter far away, darker nearby), frosted side panels, readable pale
  edge highlights and darker edge rails. Preserve the restrained gray/glass feel;
  color accents remain mainly at the entrance. Avoid a nearly transparent white
  path on an equally pale screen or costly animated full-screen blur.
- Mathematical cube tilt stays shallow and downward, approximately 20–25 degrees,
  so top and lateral grids remain readable. Apply the round's motion style below.
- Define a readable-size threshold based on projected sticker size. Rocking keeps
  its same three faces readable throughout; sweeping/spinning must offer each
  permitted lateral face at a useful angle at least twice between that threshold
  and escape. Validate actual movement/travel, not turns while cubes are tiny.
- Never rely on a time-stop pickup to satisfy ordinary face visibility.

### Recognition progression and continuous motion

| Rounds | Motion | Initial angular tuning | Inspectable faces / maximum colored count |
| --- | --- | --- | --- |
| 1–4 | Gentle rocking, never completely still or exposing another side | Common center −30° or +30°, sinusoidal ±8°, 6-second cycle | Top + front + one side / 3 |
| 5–8 | Continuous wider back-and-forth sweep; no back view | Sinusoidal ±55° around front-facing 0°, 10-second cycle | Top + front + left + right across the movement / 4 |
| 9–10 | Continuous full Y rotation | One turn per 10 seconds; varied initial angles | Top + all four lateral faces / 5 |

Rocking is a small smooth sway about the same three-face angle, not a stationary
cube and not an inspection tour. Wider sweeping reverses smoothly without held
views, stepped angle changes, or programmed pauses: children compare three cubes
at once, so a stop-and-inspect sequence is specifically excluded. Keep its range
well below a quarter-turn in either direction so the back cannot become visible.
Sinusoidal turning naturally slows at reversals but has no dwell interval.

Use one inspection clock for these motions, including during time stop. A shared
rocking angle/sweep phase within each trio makes comparison consistent. Freeze
stops approach and spawning, not rocking/sweeping/spinning. Practice and the intro
use the gentle rocking style; all three intro cubes share its pose. Only gameplay
rounds 9–10 use full spin. Do not change motion mid-round when it becomes current.

HUD:

- Cannon at center-bottom, enlarged to about 30% of scene height (versus the old
  22% prototype), with its SVG's aspect ratio preserved and room to aim/recoil.
- Current bare ammo dock to the left of the cannon, approximately right edge 61%
  from the scene's left and top 84%; small matching ammo icon beside the purple
  box. These are starting anchors, not permission to overlap the cannon or Aulas.
- Three large red fragmented hearts at lower/middle-right.
- Ten numbered round circles in two rows of five directly below the hearts;
  all completed circles use green/check. No `X:xx` timer.
- Red crosshair with a pale outer edge for legibility on gray/red/orange.
- Aulas bottom-left, existing home/navigation control retained.
- No score, combo meter, persistent factor labels, per-trio expression tags,
  additional power-ups, or new controls in this first version.

## 9. Artwork and assets first

Prepare assets as an independent stage before implementing the game loop. Use
local SVG, CSS, and existing icon paths for these simple assets; no external
requests, 3D engine, particle library, or runtime image generation.

| Asset | Concrete brief | Required separation/variants |
| --- | --- | --- |
| Toy cannon | Larger, detailed playful SVG: rounded purple housing, pale-blue barrel, thick muzzle ring, barrel bands, beveled highlights, bolts, layered base/wheels, mechanical pivot, glowing energy chamber; toy-like rather than realistic weapon | Stationary base and rotatable/recoiling barrel; documented pivot/muzzle; small details remain legible at actual scene scale |
| Pellet | Small rounded pale-blue/white energy pellet with short tapered trail, visually belonging to the cannon | Transparent surround; travel direction can rotate; tiny muzzle puff separately |
| Ammo icon | Small energy-charge/cartridge illustration in the cannon/projectile's pale-blue/white and purple family | Beside, not inside/over, the purple expression box; no added label; hidden with ammo during practice |
| Corridor | Clearly readable cool gray/blue-gray frosted panels, darker edge rails, pale highlights, depth-graded floor and perspective bands; color mainly at entrance glow | Stretchable layers; compressed distant details and larger foreground cues; all five entrance colors; no baked cubes/HUD |
| Clock cube | Solid blue six-face cube with prominent white clock, joined edges and subtle face shading | No grid, dark outlines, or Rubik-style gaps; icon visible on presented faces; shared active-freeze symbol |
| Success cube | Solid green cube with prominent white checkmark, same family as clock cube | No grid, dark outlines, or gaps; icon visible from actual success view; noninteractive |
| Heart | Large red silhouette broken into three uneven interlocking shards, visibly fragmented rather than three uniform bars | Three independently addressable shards, empty silhouette, full and broken-state mockups |
| Dust | Fuller overlapping white/cool-gray puffs with darker backing and a few flecks, expanding beyond cube footprint; clearly visible on the scene | About 0.9 seconds; strong initial opacity then fade/slight upward drift; reusable bounded SVG effect, no continuous simulation |
| Crosshair | Red ring/marks with contrasting pale edge | Neutral and aim-assisted state; no hint about mathematical correctness |
| Round circles | Numerals 1–10 with gray, current amber, completed green/check states | Two rows of five; fixed geometry, preserve numerals; no red/cross outcome variant |

The blue/green special cubes must share the same 3D face proportions as targets,
but have no sticker texture, dark inset face borders, or edge gaps. Use six actual
3D planes with same-hue shading rather than a flat icon or outlined Rubik cube.
Mathematical cubes remain visually consistent with
the teaching cubes; their rendering mechanism may be simpler.

Build the cannon as repository-native SVG; more detail does not require a bitmap
or new renderer. A useful shared artboard is 100×110 with barrel pivot `(50,70)`
and muzzle `(50,19)`. Match projectile/muzzle-flash origins to the actual rendered
SVG bounds, scaling and aiming angle, including the intro preview; do not keep
anchors from the smaller cannon. Separate barrel/recoil groups allow transforms
without regenerating paths. Do not substitute a static isometric image for cubes
that must reveal their actual selected faces.

Deliverable for this stage: local artwork, a small asset specification with pivot,
muzzle, colors, and state examples, plus an asset sheet/component fixture. A visual
preview is optional and follows the repository's permission rule. The asset stage
must not depend on implemented scoring, routing, or challenge scheduling.

## 10. Introductory demonstration

Follow the current Class 2 review's large centered card, outlined playful typography,
clear Jogar action, solid demonstration pointer, and looping activity preview.
Starting card height: around 85dvh; gameplay/explanation split approximately 65/35.

Title: `Acerte o cubo que combina com sua munição!`
Optional bottom line: `Observe as faces coloridas e mire no cubo certo.`

Preview contains the detailed cannon, left-side ammo box/icon, crosshair, hearts,
ten-circle progress HUD, projectile,
path, three incoming cubes, success cube, and dust assets. It uses a separate
deterministic demo state, never the live reducer's damage or completion actions.

Demo ammo: `1 × 9`.

- Correct: 3×3, only top colored in the session color.
- Distractor: 3×3, every face colored (as requested; its visible multiple faces
  already prove it wrong, so no inference about the hidden bottom is required).
- Distractor: 4×4, three observable faces colored in the same session color.
- Place the target in an unprivileged slot; do not teach that middle is correct.

Proposed loop, approximately ten seconds:

1. Trio approaches; cannon points loosely around the playfield.
2. Pointer/crosshair moves around slightly, then settles on the correct target.
3. Cannon aims, recoils, and fires the pellet.
4. Keep the hit cube visible through the same short feedback delay as main play;
   then it becomes the solid green check cube and distractors blink out together
   with the same larger, contrasting dust burst. Do not clear them at fire time.
5. Brief successful hold, then reset the full demo for another loop.

All three demo cubes use the early-round gentle rocking pose. The fully colored
3×3 remains the requested demo exception; its visible multiple faces make it wrong.
The explanation side retains the original correct 3×3 rather than turning into
the check cube. Show `1 × 9` beneath it. An outline/leader connects its single
colored top face to `1` and `1 face azul/vermelha/verde/laranja/amarela`. A bracket
around the complete top sticker grid connects to `9` and `quadradinhos por face`.
Use the natural singular adjective for the chosen color. Do not count nine
individual stickers or show another multiplication result.

The Jogar button is usable immediately; there is no compulsory loop completion.
Background live gameplay has not started. Focus stays inside the introduction;
on play, move focus to the game surface. Replaying the demo must not select a new
color or affect analytics.

## 11. Rendering and performance contract

Make the game cube simpler without removing teaching capabilities from the
existing shared RubiksCube. Prefer a focused game renderer using six faces and
one cached SVG grid texture per face appearance/size. Keep the silhouette, sticker
grid, gray exclusion appearance, and face mapping consistent with the lesson.

Proposed `SummaryCube` responsibilities: size, selected face mask, target color,
visual state, and orientation. No dragging, inertia, hint counting, automatic
return, or lesson tours. Ownership of approach/rotation belongs to the game scene.

- SVG face textures retain exact n×n grids. Cache by size, color, and excluded
  state. Do not create thousands of new data strings each frame.
- Reuse the established face-index/named-face convention; inspect existing CSS
  before implementing orientation and gray coloring.
- Draw fewer per-sticker shadows; use simple face/core shading.
- Distant cubes can use simpler shading, but never a different grid dimension or
  missing colored face. Optional later detail switching must preserve orientation,
  color, position, and size without a visible jump.
- Animate transforms on stable elements. Keep React state updates for semantic
  actions rather than rebuilding all face textures at animation frequency.
- Use one coordinated scene clock; avoid an independent animation timer for each
  cube, particle, projectile, and HUD element.
- Bound live mathematical cubes at six, normal special collectibles at two, and
  transient effects by short lifetimes. Remove expired nodes and listeners.
- Avoid animated full-screen blur, numerous per-sticker filters, and unbounded
  will-change/layer creation. Frosted-glass appearance is mostly static artwork.
- Use no new heavy dependency. Assets referenced by URL use import.meta.env.BASE_URL;
  source imports may use Vite's asset handling.

Actual frame-rate sufficiency remains unverified until permitted visual testing
on representative equipment. Small projected size alone is not a performance
solution for the existing element-per-sticker renderer.

## 12. State, clocks, and proposed file boundaries

Keep the new review inside Class3_totalSquares; it is a custom game, not an
AA_baseGame board-engine integration.

Suggested files (implementation may adjust names):

| File | Responsibility |
| --- | --- |
| `class3ReviewTypes.ts` | Phase, round/cube specs, health, effects, shot actions |
| `class3ReviewConfig.ts` | Central tuning constants and initial content defaults |
| `class3ReviewGeneration.ts` | Seeded deck generation, masks, distractor constraints |
| `class3Review.ts` | Pure semantic reducer, ownership, damage, spawns, end conditions |
| `class3ReviewGeometry.ts` | Curves, projection, readable-size bounds, hit assistance |
| `class3ReviewMotion.ts` | Round motion progression, inspectable sets, top-first adjacent masks |
| `useClass3Review.ts` | Coordinated clock, visibility handling, scene refs, lifecycle |
| `Class3SummaryView.tsx` and CSS Module | Composition, input, hearts, rounds, result |
| `Class3ReviewIntro.tsx` | Isolated demo timeline and factor explanation |
| `SummaryCube.tsx` and CSS Module | Lightweight educational/special cube rendering |
| `assets/` within the feature | Cannon artwork, vector shapes, face textures/helpers |

Top-level phases: `intro`, `practice`, `playing`, `won`, `lost`.
Track health, active round ID, rounds, pending spawn requests, last spawn time,
current shot cooldown, freeze remaining time, wrong-shot count, escape count,
correct-hit count, and transient effects. Avoid storing duplicate independently
editable ammo; derive it from the current round.

Include each round's resolving state, reserved target ID/shot-time projection,
inspection-clock resolution deadline, and approach-clock earliest successor
appearance deadline. Track practice hits (0–2), which centered cube is active,
the practice transition deadline, and the final feedback/result deadline. Use
the same clock/update loop for these deadlines instead of unguarded timeouts;
hidden tabs, freeze, loss, replay, and unmount must preserve/cancel them correctly.

Clock domains:

- Approach clock: foreground time only, pauses during freeze; drives travel,
  escape, minimum spawn interval, and new-group timing.
- Inspection/effect clock: foreground time, continues during freeze; drives Y
  rotation, five-second freeze duration, shot feedback, and projectile effects.
- No gameplay clocks run during intro, results, hidden tabs, or unmount.
- Intro has its own foreground demonstration clock.
- Resume resets the animation timestamp so hidden elapsed time never becomes a
  large catch-up step. Subdivide reasonable active deltas for deterministic events.

Resize recomputes projections from stable normalized progress; it does not reset
rounds, move cubes backward, reroll randomness, or change ammunition. Cancel all
timers/frames/listeners on unmount/replay. Guard callbacks by attempt/generation ID
so a delayed old effect cannot act on a new game.

## 13. Initial tuning values

These values make the first implementation reproducible and remain adjustable:

| Parameter | Starting value |
| --- | --- |
| Main round count | 10 |
| Protected practice | Two sequential centered rocking cubes, 3×3 then 4×4; no ammo/icon/counter; small left-side instruction |
| Practice approach limit | normalized progress 0.76; no deadline/penalty |
| Practice next-cube/main transition | 1 foreground second after hit resolution |
| Initial health | 9, three hearts of three shards |
| Wrong cube / target escape damage | 1 / 3 |
| Mathematical spawn-to-escape duration | approximately 28 seconds |
| Readable portion | at least 22 seconds before escape |
| Motion progression | 4 rocking + 4 wider continuous sweep + 2 full-spin rounds |
| Rocking | center ±30°, amplitude 8°, 6-second cycle; same three faces |
| Wider sweep | center 0°, amplitude 55°, 10-second cycle; never reveals back |
| Full Y-turn duration (rounds 9–10 only) | approximately 10 seconds |
| Successor travel trigger | normalized approach progress 0.55 |
| Minimum interval between trio appearances | 1.2 seconds |
| Successor request-to-appearance delay | 1 approach-clock second, also subject to interval/cap/freeze |
| Minimum remaining readable time when a later trio becomes current | 12 seconds; slow approach smoothly if necessary |
| Shot cooldown | 0.45 seconds; primary-press firing only |
| Visible pellet flight | approximately 0.15 seconds |
| Successful shot-to-green/distractor removal | 0.55 seconds total: 0.15 flight + approximately 0.4 response hold |
| Wrong recoil/flash/shake | approximately 0.35 seconds |
| Dust lifetime / expansion | approximately 0.9 seconds / 1.15–2.1× cube footprint |
| Success cube hold / final-hit result delay | approximately 0.8 seconds after green replacement, noninteractive |
| Surviving final-escape result delay | approximately 0.9 seconds of dust; zero health still loses immediately |
| Clock freeze | 5 foreground seconds |
| Clock approach speed | approximately 2× mathematical approach speed |
| Clock appearances | rounds 2, 4, 6, 8, and 10 |
| Cannon height | approximately 30% of scene height; preserve SVG aspect ratio |
| Ammo position | Left of cannon; icon beside purple box; hidden during practice |
| Round display | 1–10 in two rows of five; all completed rounds green/check |
| Intro height / preview split | 85dvh / 65% gameplay, 35% explanation |

Validate that rocking preserves its three readable faces and sweep/spin satisfy
repeated views of the permitted sides after the readable threshold. Change timing
before making motion excessively fast. The 12-second activation floor allows
pre-inspection of later trios; it is not a promise of two new cycles after every
ammo switch. No hidden colored face or full rotation is allowed in an easier mode.

## 14. Repository integration and analytics

Preserve the existing lesson and its checkpoint entry points. Resolve game mode
before mounting/starting a lesson attempt on direct review entry. Use the existing
route/navigation convention instead of inventing an unregistered path.

Proposed integration:

- ClassMenu enables Class 3 Jogar once the game is available for its supported
  desktop input. Do not create a lesson-unlock/progress-storage system here.
- Class 3 complete screen offers Jogar; Aulas remains available.
- Both direct state-based entry and `?mode=game` lead to the review introduction.
- Checkpoint mode remains a lesson testing entry, not an accidental review start.
- Review replay resets review state without importing prior attempt mistakes.
- Reuse completion styling/interaction conventions, but do not pass a fictional
  next-class route into the current shared ReviewCompletion component. A local
  result component is acceptable; extend shared APIs only if necessary.

Analytics uses existing typed hooks/fields and stable `cubo_magico`, `class_03`,
`solo`, `standard`, one player slot. Review variant is `review`. Direct review
starts when practice becomes playable after Jogar, not when intro mounts. Retain
the established lesson attempt semantics for learning entry; explicitly determine
whether that attempt finishes at lesson completion and starts a separate review,
or follows the Classes 1/2 combined pattern. Proposed choice: retain Class 3's
current completed lesson attempt, then start a separate review on Jogar. Do not
double-complete it when the game ends.

Game completion is exactly once for won/lost. Use supported controlled outcomes
and success false for loss; verify actual tracker enum before wiring. Aggregate
main wrong hits and escapes separately in local result state. Send only already
supported aggregate fields unless a separately reviewed analytics extension is
needed. Do not send every shot, expression, color, seed, face mask, or player identity.
Warm-up errors are excluded from main incorrect counts. Escape is one failed
challenge, not three mistakes because its health cost is three. Hide-time is
excluded from duration. Route exit uses the existing abandoned finalizer.

Update documentation only after corresponding behavior ships. Keep this plan and
unimplemented mobile/reduced-motion stages explicitly marked planned.

## 15. Implementation stages and exit conditions

### Stage 0 — Resolve the design contract

The user has resolved D1. Other concrete defaults can change during review
without reopening the entire design. Record changes here before coding so later
stages do not inherit contradictory rules. No unresolved gameplay choice blocks
the asset stage; numeric balance and visual refinements remain adjustable.

Exit: current-ammo ownership, wrong-later-shot handling, round outcomes, five-face
visibility limit, and stage scope are unambiguous.

### Stage 1 — Build the assets

Create the cannon base/barrel, projectile/trail, corridor layers, clock/check icons,
ammo icon, three-shard heart, larger contrasting dust burst, crosshair, and ten
round-circle variants. Build the detailed larger SVG cannon and solid borderless
special cubes from the outset, not the earlier simple/outlined versions. Document
pivots, muzzle position, proportions, palette, and file usage. Build a static asset fixture
without gameplay logic, if useful. Do not start a browser preview without task
authorization.

Exit: artwork can be reused by intro/game; cannon aims/recoils without regenerating
paths and its muzzle follows the enlarged SVG; solid blue/green cubes have no dark
outline/gaps; dust contrasts against the corridor; health shards are addressable.

### Stage 2 — Lightweight cubes, projection, and motion

Build the simpler renderer and educational masks. Implement the curved lanes,
natural bounded stagger, growth, stable depth ordering, shadows, and Y rotation.
Implement 4 rocking / 4 continuously sweeping / 2 spinning rounds. Constrain
generation to each mode's inspectable faces, with top-first adjacent masks;
mirror the rocking angle only for the whole trio. Never add inspection pauses.
Build visible edge rails, frosted side panels, depth-shaded floor and perspective
bands, preserving the wide entrance/curved paths while making approach read as depth.
Use a fixed scene fixture with two trios and special cubes to examine worst-case
composition when visual testing becomes authorized. Keep motion settings centralized.

Exit: sizes/masks remain exact and no selected face is hidden by its motion mode;
three/four/five-face recognition progresses as specified; later
trios do not overtake; all paths avoid HUD and keep aimable cubes distinguishable.

### Stage 3 — Pure review rules and content

Implement ten-round generation, one-target guarantee, varied distractors, current
ammo derivation, idempotent successor requests, two-trio cap, health, escapes,
progress-only round markers, two-cube sequential practice, resolving reservations,
one-second spawn deadlines, final-feedback hold, D1, and terminal results. No visual polish is needed
to establish these rules.
Enforce target AND distractor count limits of 3/4/5 by motion stage. Prefer
face-count differences of at least two when valid; retain a bounded fallback.

Exit: deterministic tests demonstrate every transition and no round becomes
unsolvable through a wrong shot, duplicated spawn, or stale callback.

### Stage 4 — Cannon input and shot reactions

Connect pointer aiming, crosshair assistance, fire-time hit resolution, cooldown,
projectile/muzzle/recoil, wrong reaction/removal, success replacement, and dust.
Resolve ownership before expression matching: later cubes are always wrong.
Keep shooting immediate, then use the 0.55-second resolution delay before green
replacement, simultaneous distractor dust/removal, and ammo/progress advancement.
Already visible successors stay visible; do not turn spawn delay into respawning.

Exit: aiming at empty space is harmless, nav clicks do not fire, accepted shots
cannot double-damage/double-complete, and moving targets do not invalidate a shot.
Reserved targets cannot leak during feedback; the last green cue precedes results.

### Stage 5 — Clocks, health HUD, and round HUD

Add round-2/4/6/8/10 collectibles, independent inspection/approach clocks, five-second
freeze, hidden-tab pause, three-shard damage, and ten numbered progress circles
in two rows of five. Hits and escapes both become green/check. Place bare ammo
with its icon to the left of the larger cannon, not on top of it; hide both in practice.
Verify successful shots and ammo changes while freeze is active.

Exit: rotation continues during freeze, approach/spawns do not, health clamps at
zero, and loss wins the tie with final-round resolution.

### Stage 6 — Introduction, protected practice, and results

Build the 65/35 intro with the real visual assets and requested 1×9 example. Add
dynamic factor leaders, shared session color, immediate Jogar, protected shooting
practice (3×3 then 4×4, alone/centered, both required, no ammo), and focused
result/replay actions. The demo uses the same delayed replacement and visible dust.
Practice and demo rock gently. Keep practice's instruction small and left-aligned
on the left, with no visible first/second-cube counter.
Use readable light practice/result lettering with explicitly controlled stroke/
shadow and contrasting panels; show exact remaining full/partial hearts in results.
Keep demo state separate from live gameplay.

Exit: the game is understandable from the demonstration; no extra face-total
lesson appears; both practice targets are required sequentially; last-hit feedback
is not covered by immediate results; result hearts match health; intro loops cannot
affect live progress; replay is independent.

### Stage 7 — Class 3 integration and code verification

Wire lesson-to-review and direct game entry, menu exposure, supported result
analytics, preservation of checkpoint semantics, and current-reality docs. Re-read
dirty source immediately before changing it and make narrow integration patches.

Exit: focused tests, production build, and relevant lint pass; Portuguese is valid
UTF-8; existing lessons and route behavior remain intact. Record any unrelated
repository failures instead of silently editing them.

### Stage 8 — Authorized visual playtest and tuning

This stage requires explicit browser/visual-check authorization under AGENTS.md;
authorization was granted for the current edit task, but attempted verification
was stopped by the browser tool and no successful visual validation is recorded.
An agent rebuilding from this document must follow its own task's permission rules;
this historical permission is not blanket authorization for unrelated future tasks.
Once authorized and available, test desktop input, all session colors, two
overlapping trios, HUD placement, repeated visible faces, incorrect hits, early/
later targets, freezing, replay, hidden-tab resume, resizing, and the mixed-size
worst-case renderer on representative hardware. Specifically verify both centered
practice arrivals with no ammo; joined solid special faces; visible smoke; perceived
response/spawn pacing; cannon aim/muzzle alignment and ammo/icon separation; ten
readable circles with green checks for escapes too; light practice/result text;
remaining partial hearts; and the stronger corridor's approaching-depth impression.
Also check early rocking keeps only its original three faces visible, the next
four rounds sweep continuously without showing the back or pausing, and only the
last two rounds fully spin. All gameplay tops are colored; masks remain adjacent,
including distractors. Check the compact left-side practice box does not overlap
the centered targets and contains no progress counter.

Tune ten-round length, approach/rotation, successor threshold, assistance margin,
health, and effect durations together. Do not claim balance or low-end performance
is validated from code-only checks.

Exit: a documented desktop prototype with observed usability/performance and
updated tuning values. No deployment is part of these stages.

### Later work — Mobile controls and reduced motion

Separate mobile joystick/fire-button design, responsive HUD/intro, touch assistance,
and mobile playtesting. The first desktop prototype does not advertise mobile
readiness. Preserve mobile learning pages; avoid a global route block or changes
to unrelated rotate-device behavior. If public exposure happens before mobile
support, use a local Portuguese notice and Aulas action on unsupported review
input rather than starting an unusable game.

Dedicated reduced-motion adaptation follows the baseline motion design. Preserve
the ability to inspect all relevant faces; do not simply turn off educational
rotation. No implementation of these deferred modes is implied by the desktop plan.

## 16. Required code verification

Use focused Vitest tests for meaningful rules and boundary cases:

- Generation has three distinct cubes and exactly one correct target per round;
  correct area equals size squared, masks use allowed faces, colors exclude white,
  and adjacent visible rounds do not offer a contradictory current-ammo match.
  Exactly ten rounds exist, each size 2–6 supplies two targets, and clocks occur
  only on rounds 2/4/6/8/10.
- Movement is 4 rocking / 4 wider sweep / 2 full spin, shared within each trio;
  inspectable mask limits are 3/4/5 for targets and distractors, all tops are colored,
  lateral masks are contiguous, and easier modes never require a hidden back face.
  Test mirrored rocking limits, continuous sweep reversals without dwell, full
  turns only in the final stage, and the inspectable face union over motion samples.
- Count-changing distractors use a gap of at least two wherever valid candidates
  exist; motion limits/previous-ammo exclusions can safely fall back to a smaller gap.
- Current ammo never changes on pointer movement; a later target cannot complete
  its round; D1 cannot remove the only valid target permanently.
- Threshold plus correct shot schedules one successor; cap/minimum interval/freeze
  and one-second appearance deadline defer without dropping or duplicating
  requests; round ten schedules none. An already visible successor is not hidden
  or respawned when ammo advances.
- Correct hits reserve immediately, remain current during resolution, and cannot
  leak/double-complete. Before the resolution deadline the original cube remains;
  afterward green replacement, distractor dust/removal, ammo and progress advance
  together. Resolving counts toward the two-trio cap. Zero health cancels callbacks.
- Wrong current cube costs one once and is removed; empty/distractor escape costs
  zero; required escape costs three once and advances ownership.
- Health-zero terminal loss overrides a last-round finish; surviving all ten
  enters results only after final green/dust feedback. No gameplay input changes
  the final hold, terminal phase, or replaced attempt.
- Freeze lasts five foreground seconds; rotation advances while approach/spawns
  stay fixed; hidden time advances neither; no backlog jump on resume.
- Hit resolver is forgiving but deterministic in overlapping regions; shot-time
  snapshot survives ammo advancement and target movement.
- Practice has no health loss/escape/end-round effect: exactly one centered target
  is visible/hittable at a time, sizes differ, ammo/icon are absent, and first hit
  alone cannot start main play. Verify both hits, response and transition deadlines,
  no duplicate practice completion, and full main health/progress afterward.
  Practice targets rock gently and its visible instruction has no `1 de 2` / `2 de 2`.
- Every completed round uses green/check, including escapes; remaining fragmented
  result hearts represent actual health rather than full/reset health. Integration
  covers a complete ten-round pointer game, completion once, and fresh replay.
- Direct review does not mount a lesson attempt; checkpoint behavior, lesson end,
  review start/end, replay, and abandonment are each accounted for once.
- Texture generation retains exact grids/colors and fixed named-face orientation.

Run `npm run build`, relevant tests, and lint for changed files. Run repository lint
when required and distinguish pre-existing failures. Inspect diff and UTF-8 copy.
Do not add tests that only snapshot every cosmetic shape or mirror constants;
test the learning/gameplay invariants and integration risks above.

## 17. Completion checklist

- [x] D1 is answered and this plan updated.
- [x] Asset stage is complete and independently usable, including a static fixture.
- [x] Simplified cubes preserve named faces and exact grids, verified by code checks.
- [x] Current-round-only ammo works with two approaching trios.
- [x] Wrong shots cannot make a later round unsolvable.
- [x] Ten-round result/health behavior is covered by focused tests; completed
  markers use green/check for hits and escapes in the implementation.
- [x] Rock/sweep/spin bounds and repeated cycles are covered by code tests; masks
  always include the top and only inspectable adjacent sides.
- [ ] Confirm perceived grid/face readability during an authorized visual playtest.
- [x] Clock pickups freeze approach without freezing inspection.
- [x] Updated rocking intro/practice and compact left-side instruction without a
  visible practice counter are implemented.
- [x] Solid special cubes, larger dust, detailed cannon, ammo icon/left-side dock,
  stronger corridor, light text and remaining result hearts are implemented.
- [x] Delayed resolution/spawn and final-feedback hold are covered by focused tests.
- [x] Direct game, lesson handoff, replay, checkpoints, and analytics are wired.
- [x] Original build/lint and latest focused tests are recorded separately below;
  unrelated edits are preserved.
- [x] Latest production build, Class 3 lint, and Rubik's Class regression suite pass.
- [ ] Complete authorized visual playtesting; no usability/performance claim yet.
- [x] Visual-verification authorization and the tool's stop reason are recorded;
  successful browser verification remains incomplete.
- [x] Mobile/reduced-motion work remains marked deferred until implemented.

## 18. Implementation and verification record (2026-10-03)

### Original implementation (historical; not the latest design contract)

The original five-round/size-choice-practice prototype was subsequently revised.
The record below describes checks performed at that original milestone, not a
requirement to rebuild its superseded behavior or proof of every follow-up edit.

Assets live in `assets/ReviewArtwork.tsx`, with their independent specification
and static `ReviewAssetSheet` fixture. `SummaryCube` uses six projected faces;
cached exact-grid data-URI textures are generated in `class3ReviewTextures.ts`.
The existing interactive lesson renderer was not simplified or replaced.

Review logic is split into config/types, generation, pure reducer, geometry, and
imperative scene painting (`class3ReviewPaint.ts`). A single foreground frame
loop updates semantic state and paints positions/rotation; React re-renders on
semantic revisions rather than every motion frame. Hidden-tab transitions reset
the frame baseline; delayed foreground frames still count their actual elapsed
time, subdivided by the reducer for ordered boundary events.

The Class 3 entry wrapper lazily loads the review, before mounting lesson hooks
on direct game entry. The lesson still completes its own analytics attempt and
offers optional Jogar. Review starts on playable practice, completes once on
won/lost, and replay remounts a fresh attempt. No new dependency, endpoint,
storage/unlock system, public asset-fixture route, or deployment was introduced.

Code verification covers deterministic generation across 200 seeds, current and
later shot ownership, health/escape/terminal ordering, spawn spacing/cap, freeze,
practice, textures, geometry, a complete five-round pointer game, replay,
checkpoint precedence, coarse-pointer notice, hidden-tab behavior, and slow
foreground frames. Existing Rubik's lessons/reviews, calculation components,
checkpoint tests, shared cube tests, and attempt tracker regressions are included
in the final targeted test run: 18 test files, 144 passing tests.

`npm run build` passes. ESLint for the affected Class 3 files and ClassMenu passes
without warnings. Repository-wide `npm run lint` reports 61 errors and 7 warnings
outside this implementation. The production review is its own small lazy-loaded
chunk; Vite's existing large-main-chunk warning remains. UTF-8/diff checks found
no new text corruption or whitespace errors.

At that milestone browser verification had been requested separately under
AGENTS.md and was pending. No browser playtest or hardware frame-rate claim was
part of those code-only checks.

### First follow-up edits (historical milestone)

Implemented ten main rounds, two sequential centered practice cubes without ammo,
solid blue/green special faces, larger contrasting dust, delayed success and new
appearance timing, detailed larger SVG cannon, left-side ammo dock/icon, stronger
corridor cues, lighter readable practice/result styling, remaining result hearts,
and green/check markers for every completed round. Even-round clock appearances
extend through rounds 6, 8, and 10. The existing lesson renderer remains unchanged.

At that milestone, focused verification: `class3Review.test.ts` and
`Class3ReviewInteractions.test.tsx`, 21 passing tests. These include the two-target
practice, ten-round game and completion/replay, and delayed response/final feedback.
The earlier 144-test/build/lint record above must not be treated as a fresh full
verification of all final follow-up edits.

The user explicitly authorized browser checks for these edits. The in-app browser
could not open the local preview; the local Chrome verification tool then stopped
because it could not determine the current browser URL confidently enough to
enforce its policy. No successful visual verification or hardware-performance
claim is recorded. Stage 8 remains incomplete; ten rounds, health and timing are
current build defaults, not validated classroom balance.

### Recognition progression and compact practice instruction (latest revision)

Implemented the 4/4/2 sequence: gentle ±8° rocking about a shared ±30° three-face
pose for rounds 1–4, smooth ±55° back-and-forth movement without pauses/back view
for rounds 5–8, and full rotation only for rounds 9–10. New `class3ReviewMotion.ts`
defines inspectable sets and top-first adjacent masks for targets and distractors.
Count-changing distractors prefer a gap of at least two, with a finite fallback.
Practice and intro rock gently; practice retains both required centered shots but
its instruction is compact, left-positioned/left-aligned, with no `1 de 2` / `2 de 2`.

Code verification for this revision: 23 focused review tests pass; the complete
Rubik's Class suite passes 116 tests across 13 files. `npm run build` passes, and
ESLint for `src/RubiksClass/Classes/Class3_totalSquares` passes without warnings.
The existing large-main-chunk Vite warning remains. Geometry tests sample the
face-normal visibility sets and motion bounds; generation is checked across 200
seeds, including top/adjacency/count-gap rules and no preceding-ammo matches.
These are code checks, not browser-observed readability. No browser verification
was performed for this recognition revision; the earlier tool limitation and
Stage 8's remaining visual checks still apply.
