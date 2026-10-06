# Shared implementation; the scheduled entry point fixes the repository and branch.
function Invoke-RepositorySync {
    param(
        [Parameter(Mandatory)][string]$Repository,
        [Parameter(Mandatory)][string]$GitExecutable,
        [Parameter(Mandatory)][string]$LogDirectory,
        [Parameter(Mandatory)][scriptblock]$IsBusy
    )
    $ErrorActionPreference = 'Stop'
    New-Item -ItemType Directory -Path $LogDirectory -Force | Out-Null
    $logFile = Join-Path $LogDirectory ((Get-Date -Format 'yyyy-MM') + '.log')
    function Write-SyncLog([string]$Message) {
        $line = '{0} {1}' -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Message
        Add-Content -LiteralPath $logFile -Value $line -Encoding UTF8
        Write-Host $line
    }
    function Invoke-SyncGit([string[]]$Arguments) {
        $info = New-Object System.Diagnostics.ProcessStartInfo
        $info.FileName = $GitExecutable
        $info.WorkingDirectory = $Repository
        # All arguments used below are fixed tokens or a whitespace-free timestamp.
        $info.Arguments = $Arguments -join ' '
        $info.UseShellExecute = $false
        $info.CreateNoWindow = $true
        $info.RedirectStandardOutput = $true
        $info.RedirectStandardError = $true
        # Git emits UTF-8 paths. Scheduled Windows PowerShell can otherwise
        # decode them using a legacy code page, corrupting accented paths.
        $info.StandardOutputEncoding = [Text.Encoding]::UTF8
        $info.StandardErrorEncoding = [Text.Encoding]::UTF8
        $info.EnvironmentVariables['GIT_TERMINAL_PROMPT'] = '0'
        $info.EnvironmentVariables['GCM_INTERACTIVE'] = 'Never'
        $process = New-Object System.Diagnostics.Process
        $process.StartInfo = $info
        try {
            [void]$process.Start()
            $stdout = $process.StandardOutput.ReadToEndAsync()
            $stderr = $process.StandardError.ReadToEndAsync()
            if (-not $process.WaitForExit(120000)) {
                $process.Kill()
                $process.WaitForExit()
                throw 'Git timed out. Inspect Git state before retrying; no locks are removed automatically.'
            }
            $output = $stdout.GetAwaiter().GetResult().Trim()
            $errorOutput = $stderr.GetAwaiter().GetResult().Trim()
            if ($process.ExitCode -ne 0) {
                throw ('git {0} failed: {1}' -f ($Arguments -join ' '), $errorOutput)
            }
            return $output
        } finally { $process.Dispose() }
    }
    function Assert-SyncReady {
        if (& $IsBusy) { throw 'SKIP: Codex is open.' }
        if ((Invoke-SyncGit @('branch', '--show-current')) -ne 'dev') {
            throw 'SKIP: The checked-out branch is not dev.'
        }
        foreach ($marker in @('index.lock', 'HEAD.lock', 'MERGE_HEAD', 'CHERRY_PICK_HEAD', 'REVERT_HEAD', 'rebase-merge', 'rebase-apply', 'sequencer', 'BISECT_LOG')) {
            $path = Invoke-SyncGit @('rev-parse', '--git-path', $marker)
            if (-not [IO.Path]::IsPathRooted($path)) { $path = Join-Path $Repository $path }
            if (Test-Path -LiteralPath $path) { throw "SKIP: Git operation or lock detected: $marker" }
        }
        if (Invoke-SyncGit @('ls-files', '--unmerged')) { throw 'SKIP: Unresolved conflicts exist.' }
    }
    $lock = $null
    try {
        if (& $IsBusy) { Write-SyncLog 'SKIP: Codex is open.'; return 0 }
        $gitDirectory = Invoke-SyncGit @('rev-parse', '--absolute-git-dir')
        $lockPath = Join-Path $gitDirectory 'scheduled-sync.lock'
        try {
            $lock = [IO.File]::Open($lockPath, [IO.FileMode]::OpenOrCreate, [IO.FileAccess]::ReadWrite, [IO.FileShare]::None)
        } catch {
            $cause = $_.Exception.GetBaseException()
            $errorCode = $cause.HResult -band 0xFFFF
            if ($errorCode -eq 32 -or $errorCode -eq 33) {
                Write-SyncLog 'SKIP: Another process holds the sync lock.'
                return 0
            }
            throw "Cannot open sync lock '$lockPath': $($cause.Message)"
        }
        Assert-SyncReady
        $upstream = Invoke-SyncGit @('rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}')
        if ($upstream -ne 'origin/dev') { throw 'SKIP: dev must track origin/dev.' }
        [void](Invoke-SyncGit @('fetch', '--no-tags', 'origin', 'refs/heads/dev:refs/remotes/origin/dev'))
        Assert-SyncReady
        $counts = (Invoke-SyncGit @('rev-list', '--left-right', '--count', 'HEAD...refs/remotes/origin/dev')) -split '\s+'
        $ahead = [int]$counts[0]
        $behind = [int]$counts[1]
        if ($ahead -gt 0 -and $behind -gt 0) { throw 'SKIP: Local and remote commits diverged; manual synchronization is needed.' }
        $dirty = Invoke-SyncGit @('status', '--porcelain', '--untracked-files=all')
        if ($behind -gt 0) {
            if ($dirty) { throw 'SKIP: Remote updates and uncommitted changes coexist; synchronize manually.' }
            Assert-SyncReady
            [void](Invoke-SyncGit @('-c', 'merge.autoStash=false', 'merge', '--ff-only', 'refs/remotes/origin/dev'))
            Write-SyncLog 'Pulled remote updates using fast-forward.'
        }
        Assert-SyncReady
        if (Invoke-SyncGit @('status', '--porcelain', '--untracked-files=all')) {
            [void](Invoke-SyncGit @('add', '--all'))
            Assert-SyncReady
            if (Invoke-SyncGit @('diff', '--cached', '--name-only')) {
                $message = 'Automatic_checkpoint_' + (Get-Date -Format 'yyyy-MM-dd_HH-mm-ss')
                [void](Invoke-SyncGit @('commit', '-m', $message))
                Write-SyncLog 'Committed saved changes.'
            }
        }
        Assert-SyncReady
        $ahead = [int](Invoke-SyncGit @('rev-list', '--count', 'refs/remotes/origin/dev..HEAD'))
        if ($ahead -gt 0) {
            [void](Invoke-SyncGit @('push', 'origin', 'refs/heads/dev:refs/heads/dev'))
            Write-SyncLog 'Pushed dev successfully.'
        } else { Write-SyncLog 'Already synchronized.' }
        return 0
    } catch {
        Write-SyncLog $_.Exception.Message
        if ($_.Exception.Message.StartsWith('SKIP:')) { return 0 }
        return 1
    } finally { if ($null -ne $lock) { $lock.Dispose() } }
}
