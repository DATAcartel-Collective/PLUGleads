param(
  [string]$Branch = "main",
  [int]$IntervalSec = 8
)

$ErrorActionPreference = "Continue"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $repoRoot

Write-Output "Auto-push watcher started in $repoRoot on branch '$Branch' (interval ${IntervalSec}s)."

while ($true) {
  try {
    $status = git status --porcelain
    if ($LASTEXITCODE -ne 0) {
      Start-Sleep -Seconds $IntervalSec
      continue
    }

    if ([string]::IsNullOrWhiteSpace($status)) {
      Start-Sleep -Seconds $IntervalSec
      continue
    }

    git add -A | Out-Null
    $staged = git diff --cached --name-only
    if ([string]::IsNullOrWhiteSpace($staged)) {
      Start-Sleep -Seconds $IntervalSec
      continue
    }

    $stamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    git commit --no-verify -m "chore: auto-sync $stamp" | Out-Null

    if ($LASTEXITCODE -eq 0) {
      Write-Output "[$stamp] Commit created. Pushing to origin/$Branch..."
      git push origin $Branch | Out-Null
      if ($LASTEXITCODE -eq 0) {
        Write-Output "[$stamp] Push complete."
      } else {
        Write-Output "[$stamp] Push failed. Will retry on next change."
      }
    }
  } catch {
    Write-Output "Watcher error: $($_.Exception.Message)"
  }

  Start-Sleep -Seconds $IntervalSec
}
