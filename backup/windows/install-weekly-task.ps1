# Creates a weekly Sunday 03:00 Task Scheduler job
$Script=Join-Path $PSScriptRoot 'backup-youjiu.ps1';if(!(Test-Path $Script)){throw 'Backup script missing'}
$Action=New-ScheduledTaskAction -Execute 'powershell.exe' -Argument ('-NoProfile -ExecutionPolicy Bypass -File "'+$Script+'"')
$Trigger=New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At 3:00AM
$Settings=New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopOnBatteries -ExecutionTimeLimit (New-TimeSpan -Hours 4)
Register-ScheduledTask -TaskName 'YOUJIU Weekly Backup' -Action $Action -Trigger $Trigger -Settings $Settings -Description 'Weekly backup of YOUJIU Supabase database and Storage' -Force
Write-Host 'Task registered. The computer must be powered on. Configure run-when-logged-off credentials in Task Scheduler if desired.'