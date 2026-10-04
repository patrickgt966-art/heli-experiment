# Restart a reviewed keeper process after crashes. No task registration, network
# deployment, funding, or authority change occurs in this script.
param([Parameter(Mandatory=$true)][string]$ConfigPath,[switch]$Execute,[string]$NodePath)
$ErrorActionPreference = 'Stop'
$heliKeeperNode = if ($NodePath) { (Resolve-Path -LiteralPath $NodePath).Path } else { (Get-Command node).Source }
$heliKeeperScript = Join-Path $PSScriptRoot 'run.mjs'
$heliKeeperConfig = (Resolve-Path -LiteralPath $ConfigPath).Path
$heliKeeperWait = 5
while ($true) {
  if ($Execute) { & $heliKeeperNode $heliKeeperScript $heliKeeperConfig --execute }
  else { & $heliKeeperNode $heliKeeperScript $heliKeeperConfig --once; break }
  Start-Sleep -Seconds $heliKeeperWait
  $heliKeeperWait = [Math]::Min(60, $heliKeeperWait * 2)
}
