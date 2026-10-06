$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'Sync-Core.ps1')
. (Join-Path $PSScriptRoot 'Test-CodexOpen.ps1')
$git = (Get-Command git).Source
$root = Join-Path ([IO.Path]::GetTempPath()) ('JogandoGitSyncTest-l' + [char]0xF3 + 'gica-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $root | Out-Null
$remote = Join-Path $root 'remote.git'
$local = Join-Path $root 'local'
$other = Join-Path $root 'other'
function Git-Test([string]$Directory, [string[]]$Arguments) {
    $ErrorActionPreference = 'Continue'
    $output = & $git -C $Directory @Arguments 2>&1
    if ($LASTEXITCODE -ne 0) { throw ($output -join "`n") }
    return ($output -join "`n")
}
function Check([bool]$Condition, [string]$Name) {
    if (-not $Condition) { throw "FAILED: $Name" }
    Write-Host "PASS: $Name"
}
function Sync-Test([scriptblock]$Busy = { $false }) {
    Invoke-RepositorySync -Repository $local -GitExecutable $git -LogDirectory (Join-Path $root 'logs') -IsBusy $Busy
}
Check (-not (Test-CodexOpen -Processes @(
    [pscustomobject]@{ ProcessName = 'codex-windows-sandbox-service'; MainWindowHandle = 0; Path = $null },
    [pscustomobject]@{ ProcessName = 'codex'; MainWindowHandle = 0; Path = 'C:\Users\test\AppData\Local\OpenAI\Codex\bin\version\codex.exe' }
))) 'Background service and helpers do not block sync'
Check (Test-CodexOpen -Processes @(
    [pscustomobject]@{ ProcessName = 'ChatGPT'; MainWindowHandle = 123; Path = 'C:\Program Files\WindowsApps\OpenAI.Codex_1_x64\app\ChatGPT.exe' }
)) 'Codex app window blocks sync'
Check (Test-CodexOpen -Processes @(
    [pscustomobject]@{ ProcessName = 'codex'; MainWindowHandle = 123; Path = 'C:\Apps\Codex.exe' }
)) 'Codex-named app window blocks sync'
Check (-not (Test-CodexOpen -Processes @())) 'Closed app permits sync'
# Native Git writes ordinary progress to stderr; do not treat that as a PowerShell error.
$ErrorActionPreference = 'Continue'
[void](Git-Test $root @('init', '--bare', $remote))
[void](Git-Test $root @('clone', $remote, $local))
$ErrorActionPreference = 'Stop'
[void](Git-Test $local @('config', 'user.name', 'SyncTest'))
[void](Git-Test $local @('config', 'user.email', 'sync-test@example.invalid'))
[void](Git-Test $local @('checkout', '-b', 'dev'))
Set-Content -LiteralPath (Join-Path $local 'file.txt') -Value 'initial'
Set-Content -LiteralPath (Join-Path $local '.gitignore') -Value 'ignored.txt'
[void](Git-Test $local @('add', '--all'))
[void](Git-Test $local @('commit', '-m', 'initial'))
[void](Git-Test $local @('push', '-u', 'origin', 'dev'))
[void](Git-Test $root @('clone', '--branch', 'dev', $remote, $other))
[void](Git-Test $other @('config', 'user.name', 'SyncTest'))
[void](Git-Test $other @('config', 'user.email', 'sync-test@example.invalid'))
Check ((Sync-Test) -eq 0) 'No changes'
Set-Content -LiteralPath (Join-Path $local 'new.txt') -Value 'unfinished'
Set-Content -LiteralPath (Join-Path $local 'ignored.txt') -Value 'ignored'
Check ((Sync-Test) -eq 0) 'Auto commit and push'
Check ((Git-Test $local @('rev-parse', 'HEAD')) -eq (Git-Test $remote @('rev-parse', 'dev'))) 'Remote has checkpoint'
Check (-not (Git-Test $local @('ls-files', 'ignored.txt'))) 'Ignore rules respected'
[void](Git-Test $other @('pull', '--ff-only'))
Set-Content -LiteralPath (Join-Path $other 'remote.txt') -Value 'remote update'
[void](Git-Test $other @('add', '--all'))
[void](Git-Test $other @('commit', '-m', 'remote_update'))
[void](Git-Test $other @('push'))
Check ((Sync-Test) -eq 0) 'Clean fast-forward pull'
Check (Test-Path -LiteralPath (Join-Path $local 'remote.txt')) 'Remote file received'
Set-Content -LiteralPath (Join-Path $local 'new.txt') -Value 'busy change'
$before = Git-Test $local @('rev-parse', 'HEAD')
Check ((Sync-Test { $true }) -eq 0) 'Codex skip'
Check ((Git-Test $local @('rev-parse', 'HEAD')) -eq $before) 'Busy run did not commit'
[void](Git-Test $local @('checkout', '-b', 'different'))
Check ((Sync-Test) -eq 0) 'Wrong branch skip'
Check ((Git-Test $local @('rev-parse', 'HEAD')) -eq $before) 'Wrong branch unchanged'
[void](Git-Test $local @('checkout', 'dev'))
$indexLock = Join-Path $local '.git\index.lock'
Set-Content -LiteralPath $indexLock -Value 'test lock'
Check ((Sync-Test) -eq 0) 'Git lock skip'
Remove-Item -LiteralPath $indexLock
Set-Content -LiteralPath (Join-Path $other 'remote.txt') -Value 'another remote update'
[void](Git-Test $other @('add', '--all'))
[void](Git-Test $other @('commit', '-m', 'remote_again'))
[void](Git-Test $other @('push'))
Check ((Sync-Test) -eq 0) 'Dirty and behind skip'
Check ((Git-Test $local @('rev-parse', 'HEAD')) -eq $before) 'Dirty behind leaves HEAD unchanged'
Check ((Get-Content -LiteralPath (Join-Path $local 'new.txt')) -eq 'busy change') 'Dirty contents preserved'
[void](Git-Test $local @('add', '--all'))
[void](Git-Test $local @('commit', '-m', 'local_divergence'))
$before = Git-Test $local @('rev-parse', 'HEAD')
Check ((Sync-Test) -eq 0) 'Divergence skip'
Check ((Git-Test $local @('rev-parse', 'HEAD')) -eq $before) 'Divergence leaves HEAD unchanged'
Write-Host "Test repositories retained at $root"
