# Personal model evaluation plan

Status: updated October 3, 2026. Class3Summary-v4 and Kahoot-v1 are prepared and
frozen locally; the tutorial and Bomb Game exercises remain planned. No model
evaluation has been run. These are
evaluation exercises, not implementation instructions for the production project.

## Prepared Class 3 test

Local suite: `C:/Users/bruno/ModelTests/`.

- Current frozen template: `Templates/Class3Summary-v4/` and its ZIP/SHA-256 backup.
- Repeat-run helper: `New-Class3SummaryRun.ps1 -Name <new-run-name>` (defaults to v4).
- Run instructions: the run's README.md contains the task; no separate PROMPT.md.
- Fixed opening: `Read README.md and complete the task described there.`
- Evaluator checklist/verification: `Evaluation/Class3Summary-v4/`.
- Local browser verification, screenshots, previews, and Playwright checks are
  explicitly authorized in the test README and AGENTS.md. Stage 8 is included.

v2 includes the latest 4/4/2 rocking/sweeping/spinning progression, top-first
adjacent colored masks, constrained distractors, and compact practice instruction.
v3 retains v2's design and consolidates the task instructions into README.md.
v4 adds explicit local browser verification and visual tuning permission without
changing the plan or starting code.
The executable starting files are identical to v1; only requirements and benchmark
documentation changed. Existing archives and ready runs remain intact. Create a
new v4 run for the current workflow; `-Version v1`/`-Version v2`/`-Version v3` explicitly
select older templates.

The final summary-game plan is supplied byte-for-byte. Class 3 and ClassMenu come
from commit `eb47905f053272ca746ee12065cb008aff635d89`, before the uncommitted
summary implementation. Current Class 1/2 examples and shared dependencies are
included as explicit prerequisites. Each file's provenance and hash are recorded
in BASELINE.json; this is a prepared baseline, not one historical whole-repo commit.

The unchanged reduced app builds and all 161 tests in 20 files passed during v1
verification; those code checks were not repeated for v2/v3/v4's prose-only changes.
Six pre-existing lint
errors and one warning remain in legacy files and are documented in the template.
No finished Class 3 summary source, tests, artwork, or original Git history is
included. No browser verification or deployment was performed.

## Prepared Kahoot discussion test

- Frozen template: `Templates/Kahoot-v1/` and its ZIP/SHA-256 backup.
- Ready reusable project: `C:/Users/bruno/ModelTests/Discussion/Kahoot-v1/`.
- Fixed opening: `Read README.md and start the discussion described there.`
- Integrity check: `Test-KahootSnapshot.ps1` in the local suite.
- Fresh recovery copy: `New-KahootDiscussion.ps1 -Name <new-folder-name>`.
- Evaluator checklist and source-capture record: `Evaluation/Kahoot-v1/`.

The snapshot captures the current `dev` working tree at HEAD
`eb47905f053272ca746ee12065cb008aff635d89`, including uncommitted and untracked
project files, at 2026-10-03T21:55:37.555Z. It retains frontend/backend source,
shipped assets, configuration, lockfiles, and documentation. Dependencies,
builds, generated output/screenshots, local secrets, Git history, and evaluator
notes are excluded. Test instructions replace README.md and add discussion scope
to AGENTS.md; the original README is preserved at docs/project-readme.md.
The complete product concept is supplied without evaluator prompts. All initial
files have hashes and provenance. Later production changes do not alter it.

Use one project and a fresh chat for each model. No files may be created or
changed, including notes/plans. No implementation, installs, servers, builds,
tests, or deployment belong to this exercise. Read-only inspection is allowed.
Verify the snapshot before reuse and recover into a new folder if needed.

## Purpose

Compare models on real Jogando com Lógica work, including independent decisions,
faithful execution, discussion quality, and implementation after discussion.
Keep each exercise independently runnable. About 20 minutes was an initial size
estimate, not a hard cutoff; longer tasks are acceptable. Choose coherent tasks
and record elapsed time and usage where available rather than forcing every
exercise into the same duration.

## Agreed exercise directions

| Exercise | Proposed task | Readiness condition |
| --- | --- | --- |
| Broad single prompt | Design and implement a playable tutorial for another game, using two finished game tutorials as references | Two reference tutorials are polished; target game and manageable scope are selected |
| Specific single prompt | Implement the Class 3 summary game from an explicit plan | Game design and plan are settled; a matching pre-feature baseline is retained |
| Pure discussion | Discuss the teacher-led classroom tournament described in `classroom-tournament-discussion-context.md` | Initial context is captured; fixed opening can be piloted |
| Discussion and implementation | Discuss, agree on, and implement a small new Bomb Game level within a supplied theme/family | Shared Bomb Game effects and behavior are polished; theme and feasible scope are selected |

The previous Caça Soma hint task and historical Class 3 learning-section plan
are not the selected exercises.

## Broad tutorial exercise

The model should infer the preferred teaching and interaction patterns from two
finished examples, make game-specific instructional decisions, and implement
them using the shared tutorial system. The user intends to finish Crown Chase
and a second reference game before freezing this baseline.

The target game's full tutorial storyboard must remain an exercise for the model.
Provide its actual rules, the established tutorial constraints, and the reference
implementations. A detailed target storyboard would turn this into the specific
plan exercise.

Choose a coherent scope after checking the target game. A complete tutorial may
be appropriate even if it takes longer than 20 minutes. Define which mode
introductions belong to the task before freezing it.

## Specific Class 3 summary-game exercise

Create a new explicit plan for the summary game. The existing learning-section
plan is not a substitute. Preserve a baseline before the summary game is added.
That baseline must include prerequisites the final plan assumes.

Refine the plan during the real implementation and polishing process. Keep the
final plan self-contained: rewrite superseded requirements rather than leaving
contradictory corrections scattered through the document.

Record changes to mechanics, learning sequence, interactions, state transitions,
feedback, timing that affects usability, and important interface composition.
Small decorative adjustments can remain implementation choices unless matching
their appearance is part of the evaluation. Never score an unspecified detail as
a hidden requirement.

Before freezing, verify that the final plan can be executed against the saved
pre-feature baseline. Include any newly required infrastructure work explicitly
or use an updated baseline that contains that infrastructure but not the solution.

Once runs begin, keep the prompt, plan, baseline, and acceptance checklist fixed.
A later material change creates a new benchmark version. Compare attempts only
within the same version, or rerun the models being compared.

## Bomb Game discussion and implementation

The user will supply the level theme/family. The model proposes a mechanic within
that family; discussion develops one proposal before implementation is authorized.
Evaluate whether the implementation preserves the agreed design.

Freeze the baseline after shared effects and behavior (including horns and
explosion presentation) are polished. Reuse the existing shell, rooms, timer,
lives, and role separation. Select the level scope after the theme is chosen.
A single module is an option, not a settled restriction; longer implementations
are acceptable.

Use comparable discussion time and checkpoints across models, while allowing
different ideas and natural follow-ups. Record the conversation and final agreed
requirements. Decision quality includes choosing an interesting, feasible mechanic.

## Repeatable runs

The suite can live entirely on the user's PC, in a separate folder outside the
active production checkout. No remote repository or hosting is required.

### Files supplied for each exercise

| Exercise | Starting files |
| --- | --- |
| Class 3 summary game | All RubiksClass files, imported shared dependencies, necessary assets, relevant documentation, and runnable project configuration |
| Bomb Game level | BombGame frontend and authoritative backend code, imported shared dependencies, required assets, relevant documentation, and runnable frontend/server configuration |
| Classroom-system discussion | A frozen snapshot of the whole repository plus the concept brief |
| Playable tutorial | A frozen snapshot of the whole repository including both finished reference tutorials |

For the smaller packages, preserve familiar paths and include a minimal runnable
app/server setup. Prepare and verify these packages once, before model attempts.
Do not make each tested model repair missing imports or reconstruct the test app.

"Whole repository" means project source, assets, relevant documentation, lockfiles,
and configuration. Generated output, dependency installation folders, local
secrets, and later solution-bearing Git history are not necessary context.

### Local folder workflow

Keep one frozen template per exercise, preferably backed by a ZIP archive for
recovery. The archive is optional; ordinary folders and copying are sufficient.
Templates can be frozen at different dates.

For discussion only, use one working snapshot folder registered as a Codex
project. Start a fresh task for each model using the same context and opening
prompt. Make no files during discussion, including notes or plans. Check that the
snapshot is unchanged before reusing it; recover it from the template if needed.

For each exercise that creates files, duplicate its frozen template into a new,
uniquely named run folder and register that folder as a Codex project. Keep the
result there for review. Always copy the template, never a previous attempt.
Projects pointing at different run folders provide separate working files.

Task separation is not a guarantee that agents cannot retrieve other tasks.
The current app exposes tools for listing and reading other task histories.
Use a benchmark instruction to rely only on the supplied workspace and current
conversation, and not retrieve other tasks, earlier attempts, or external local
project copies. Apply the same tool configuration and instructions to every run.
For comparison runs, disable both using local memories and contributing to future
memories where the client provides those controls. Official documentation
describes `/memories` for per-chat controls and Settings > Personalization for
feature management: https://learn.chatgpt.com/docs/customization/memories.
A separate project alone is not a technical access restriction.

Each exercise can have a different source snapshot because prerequisites become
ready at different times. Record the exact source revision, included files, prompt,
plan/context version, and acceptance checklist for each exercise.

Keep baseline templates outside the model's run folder. Copy each run from the
same template. Optionally initialize a fresh Git repository for reviewing changes. Avoid
including later Git history containing the finished implementation. Include
required assets, configuration, dependencies, and relevant project instructions;
verify that the baseline builds before using it.

Start each exercise in a fresh task with the same tools and instructions. Record
model, reasoning setting, elapsed time, available usage, outcome, and any user
intervention. Keep previous solutions and evaluator notes outside its workspace.

The production repository prohibits browser verification unless authorized for
the task. The user has authorized local browser verification for the Class 3 v4
test; its template instructions record that exception. The production policy is
unchanged. Kahoot-v1 is read-only discussion and needs no browser verification.
Code checks are allowed in implementation exercises.
The user can inspect interfaces manually; unresolved visual quality should not
be presented as verified by code checks.

## Evaluation

Keep four judgments separate: independent decision quality, execution accuracy,
discussion quality, and collaboration through implementation. Also record scope
completion, time, usage, and effort required to steer or repair the result.

Define observable acceptance criteria before comparison runs. Use one pilot to
check scope and instructions, then freeze a version. Repeat close or surprising
results if useful; a single run is a limited sample of model behavior.
