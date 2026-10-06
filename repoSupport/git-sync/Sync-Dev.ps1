$ErrorActionPreference = 'Stop'
# Resolve the repository from this file, avoiding Windows path/encoding issues.
$repository = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..'))
$gitExecutable = 'C:\Program Files\Git\cmd\git.exe'
$logDirectory = Join-Path $env:LOCALAPPDATA 'JogandoGitSync'
. (Join-Path $PSScriptRoot 'Sync-Core.ps1')
. (Join-Path $PSScriptRoot 'Test-CodexOpen.ps1')
$result = Invoke-RepositorySync -Repository $repository -GitExecutable $gitExecutable -LogDirectory $logDirectory -IsBusy {
    Test-CodexOpen
}
exit $result
