# Scheduled dev synchronization (Windows)

`Sync-Dev.ps1` targets the repository containing this directory, only while `dev`
is checked out and tracks `origin/dev`. It uses the installed Git at
`C:\Program Files\Git\cmd\git.exe` and your existing Git credentials.

It skips while a Codex app window exists, including idle or minimized windows.
The Windows package may host that window in `ChatGPT.exe`. Background sandbox
services and helper processes without app windows do not block synchronization.
Close Codex to allow synchronization. A Codex process starting just after a check
can still overlap; these checks reduce that risk but are not a shared editor lock.

Saved changes (including additions and deletions) are committed and pushed,
respecting `.gitignore`. Ignored files and unsaved editor buffers are not backed up.
The script does not validate game code before creating a checkpoint.

Remote updates are applied only as a fast-forward to a clean working tree.
Divergence, a dirty working tree with remote updates, existing Git operations,
and Git locks cause a skip requiring manual attention. Nothing is force-pushed,
stashed, reset, or automatically conflict-resolved. If pushing fails after a
commit, that commit remains local for the next run. Authentication never prompts.
Each Git command has a two-minute timeout; interrupted operations may need manual
inspection. The script never deletes Git locks.

Logs: `%LOCALAPPDATA%\JogandoGitSync\yyyy-MM.log`.
Exit code 0 means success or a deliberate skip; 1 means a Git failure.
Read the log to distinguish a successful sync from a skipped run.

## Task Scheduler setup

1. Open **Task Scheduler** from Start (`Agendador de Tarefas`). Select **Create
   Task** (`Criar Tarefa`), not Create Basic Task.
2. **General**: name `Jogando - dev sync`. Select your Windows account and
   **Run only when user is logged on**. Leave **Run with highest privileges** off.
3. **Triggers**: create an **At log on** trigger for your user. In its advanced
   settings, enable **Repeat task every: 1 hour**, **for a duration of:
   Indefinitely**. Leave the trigger enabled. This single trigger covers sign-in
   and hourly repetition after sign-in.
4. **Actions**: choose **Start a program**.
   - Program: `C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe`
   - Arguments (one line):

     ```text
     -NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File "C:\Users\bruno\Projeto Jogando com lógica\Jogando-com-logica\repoSupport\git-sync\Sync-Dev.ps1"
     ```

   - Leave **Start in** empty. The script resolves its repository automatically.
   - ExecutionPolicy Bypass applies only to this invocation, not a system setting.
5. **Conditions**: leave idle requirements and **Wake the computer** off. If you
   want it to run on battery too, uncheck both AC-power restrictions.
6. **Settings**: enable **Allow task to be run on demand**. Select **Do not start
   a new instance** if it is already running. Uncheck **Stop the task if it runs
   longer than** (the script has its own command timeouts). No automatic restart
   on failure is necessary; the next hourly run retries.
7. Save with **OK**. Right-click the task and choose **Run**. While Codex is open,
   the log should say `SKIP: Codex is open.`
8. Close Codex, run the task again, wait for it to finish, and read the log. This
   run can commit and push your saved changes. If authentication fails, use a
   normal terminal to authenticate Git, then retry the task.

Open the log folder by pressing Win+R and entering `%LOCALAPPDATA%\JogandoGitSync`.
To pause synchronization, right-click the task and select **Disable**. Delete the
task to remove the schedule; repository files remain.

## Verification

`Test-Sync.ps1` creates isolated local repositories and a local bare remote under
the Windows temporary directory. It never accesses this repository's remote.
It checks checkpoint commits/pushes, ignored files, fast-forward updates,
busy-process gating, wrong branches, Git locks, dirty-behind state, and divergence.
It retains its test repositories and prints their path.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\repoSupport\git-sync\Test-Sync.ps1
```

Task scheduling reference:
https://learn.microsoft.com/en-us/windows/win32/taskschd/logontrigger
