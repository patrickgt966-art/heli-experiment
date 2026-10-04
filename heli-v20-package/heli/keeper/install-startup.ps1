# Default: print a plan only. -Install registers one current-user logon task,
# after a read-only Devnet preflight. It does not deploy, fund or start a task.
param([Parameter(Mandatory=$true)][string]$ConfigPath,[switch]$Install)
$ErrorActionPreference = 'Stop'
$heliKeeperConfigPath = (Resolve-Path -LiteralPath $ConfigPath).Path
$heliKeeperNodePath = (Get-Command node).Source
$heliKeeperRunnerPath = Join-Path $PSScriptRoot 'run.mjs'
$heliKeeperServicePath = Join-Path $PSScriptRoot 'windows-service.ps1'
$heliKeeperConfig = Get-Content -LiteralPath $heliKeeperConfigPath -Raw | ConvertFrom-Json
if ($heliKeeperConfig.program -ne 'HkScyzYb2nyhw9X8o31ShQTEFgbuKQj2ThBTBErBJAWv') { throw 'V20 config required' }
if ($heliKeeperConfig.rpcUrl -notlike 'https://*') { throw 'HTTPS RPC required' }
if (-not (Test-Path -LiteralPath $heliKeeperConfig.keeperKeyFile -PathType Leaf)) { throw 'Dedicated fee key file missing' }
if ($heliKeeperConfig.trust.admin -like 'SET_*' -or $heliKeeperConfig.trust.verifier -like 'SET_*') { throw 'Verify trust pins first' }
$heliKeeperTaskName = 'HELI Devnet Keeper'
$heliKeeperArguments = '-NoProfile -NonInteractive -WindowStyle Hidden -File "' + $heliKeeperServicePath + '" -ConfigPath "' + $heliKeeperConfigPath + '" -NodePath "' + $heliKeeperNodePath + '" -Execute'
if (-not $Install) {
  [pscustomobject]@{Task=$heliKeeperTaskName;Trigger='Current user logon';Runner=$heliKeeperRunnerPath;Installed=$false}
  return
}
if (Get-ScheduledTask -TaskName $heliKeeperTaskName -ErrorAction SilentlyContinue) { throw 'Existing HELI task found; inspect it instead of overwriting' }
& $heliKeeperNodePath $heliKeeperRunnerPath $heliKeeperConfigPath --once
if ($LASTEXITCODE -ne 0) { throw 'Read-only Devnet preflight failed; task not registered' }
$heliKeeperUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
$heliKeeperAction = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument $heliKeeperArguments -WorkingDirectory $PSScriptRoot
$heliKeeperTrigger = New-ScheduledTaskTrigger -AtLogOn -User $heliKeeperUser
$heliKeeperPrincipal = New-ScheduledTaskPrincipal -UserId $heliKeeperUser -LogonType Interactive -RunLevel Limited
$heliKeeperSettings = New-ScheduledTaskSettingsSet -MultipleInstances IgnoreNew -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit ([TimeSpan]::Zero)
Register-ScheduledTask -TaskName $heliKeeperTaskName -Action $heliKeeperAction -Trigger $heliKeeperTrigger -Principal $heliKeeperPrincipal -Settings $heliKeeperSettings -Description 'Reviewed Devnet-only HELI maintenance; dedicated fee wallet and expense caps.' | Select-Object TaskName,State
