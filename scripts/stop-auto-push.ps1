$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$pidPath = Join-Path $repoRoot ".autopush\\watcher.pid"

if (-not (Test-Path $pidPath)) {
  Write-Output "Auto-push is not running."
  exit 0
}

$pid = Get-Content $pidPath -ErrorAction SilentlyContinue
if (-not $pid) {
  Remove-Item $pidPath -Force -ErrorAction SilentlyContinue
  Write-Output "Auto-push state reset."
  exit 0
}

$proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
if ($proc) {
  Stop-Process -Id $pid -Force
  Write-Output "Stopped auto-push (PID $pid)."
} else {
  Write-Output "Auto-push process not found; cleaning up state."
}

Remove-Item $pidPath -Force -ErrorAction SilentlyContinue
