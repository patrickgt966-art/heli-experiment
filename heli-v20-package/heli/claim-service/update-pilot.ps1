# Updates the local identity pilot to the reviewed claim-service code from GitHub.
# Usage (PowerShell, inside your local "heli" folder that contains claim-service and mobile):
#   powershell -ExecutionPolicy Bypass -File claim-service\update-pilot.ps1
# Only code files are replaced. .private (keys) and .state (applications) are not touched.
# The replaced files are kept in claim-service\backup-<time>.
$ErrorActionPreference = 'Stop'
$heli = Split-Path -Parent $PSScriptRoot
$base = 'https://raw.githubusercontent.com/patrickgt966-art/heli-experiment/claude/heli-v20-token-review-6gocpn/heli-v20-package/heli'
$files = @(
  'claim-service/server.mjs','claim-service/admission.mjs','claim-service/didit.mjs',
  'claim-service/app.js','claim-service/browser-handoff.js','claim-service/manual-review.mjs',
  'claim-service/storage.mjs','claim-service/webhook-queue.mjs','mobile/solana.mjs'
)
$backup = Join-Path $heli ('claim-service/backup-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
New-Item -ItemType Directory -Force -Path $backup | Out-Null
foreach ($f in $files) {
  $target = Join-Path $heli $f
  if (Test-Path $target) { Copy-Item $target (Join-Path $backup ($f -replace '/','_')) }
  Invoke-WebRequest -UseBasicParsing -Uri "$base/$f" -OutFile $target
  Write-Host "updated $f"
}
Write-Host "Backup of previous files: $backup"
Write-Host 'Next: start the tunnel, then: node claim-service\start-identity.mjs https://<your-tunnel>.trycloudflare.com'
