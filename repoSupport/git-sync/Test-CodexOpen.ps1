function Test-CodexOpen {
    param([object[]]$Processes = @(Get-Process -ErrorAction Stop))
    foreach ($process in $Processes) {
        # Services and app-server/helper processes do not have a main window.
        # Minimized app windows still have a nonzero handle.
        if ($process.MainWindowHandle -eq 0) { continue }
        if ($process.ProcessName -ieq 'codex') { return $true }
        if ($process.ProcessName -ieq 'ChatGPT') {
            $path = $null
            try { $path = $process.Path } catch { }
            # The Windows Codex package currently hosts its UI in ChatGPT.exe.
            # If Windows denies the path, conservatively treat that window as busy.
            if (-not $path -or $path -match '(?i)[\\/]OpenAI\.Codex[^\\/]*[\\/]' -or $path -match '(?i)[\\/]OpenAI[\\/]Codex[\\/]') {
                return $true
            }
        }
    }
    return $false
}
