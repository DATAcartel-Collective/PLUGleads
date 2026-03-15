param(
  [string]$Branch = "main",
  [int]$IntervalSec = 8
)

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$stateDir = Join-Path $repoRoot ".autopush"
$pidPath = Join-Path $stateDir "watcher.pid"
$outLog = Join-Path $stateDir "watcher.out.log"
$errLog = Join-Path $stateDir "watcher.err.log"

New-Item -ItemType Directory -Path $stateDir -Force | Out-Null

if (Test-Path $pidPath) {
  $existingPid = Get-Content $pidPath -ErrorAction SilentlyContinue
  if ($existingPid) {
    $existingProcess = Get-Process -Id $existingPid -ErrorAction SilentlyContinue
    if ($existingProcess) {
      Write-Output "Auto-push already running (PID $existingPid)."
      exit 0
    }
  }
}

$scriptPath = Join-Path $PSScriptRoot "auto-push.ps1"
$args = "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`" -Branch `"$Branch`" -IntervalSec $IntervalSec"

$proc = Start-Process `
  -FilePath "powershell" `
  -ArgumentList $args `
  -PassThru `
  -WindowStyle Hidden `
  -RedirectStandardOutput $outLog `
  -RedirectStandardError $errLog

Set-Content -Path $pidPath -Value $proc.Id

Write-Output "Auto-push started (PID $($proc.Id))."
Write-Output "Logs: $outLog"
