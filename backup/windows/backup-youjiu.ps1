# YOUJIU Windows backup runner
[CmdletBinding()]
param([switch]$SetupSecrets)
$ErrorActionPreference='Stop'
$Root=Join-Path $env:USERPROFILE 'YOUJIU_BACKUP';$ConfigDir=Join-Path $Root 'config';$LogsDir=Join-Path $Root 'logs';$RunDir=Join-Path $Root ('runs\'+(Get-Date -Format 'yyyy-MM-dd_HHmmss'))
foreach($d in @($Root,$ConfigDir,$LogsDir,$RunDir)){New-Item -ItemType Directory -Path $d -Force|Out-Null}
$Log=Join-Path $LogsDir ('backup-'+(Get-Date -Format 'yyyy-MM-dd')+'.log');Start-Transcript -Path $Log -Append|Out-Null
function FindExe($n,$fallback){$c=Get-Command $n -ErrorAction SilentlyContinue;if($c){return $c.Source};if(Test-Path $fallback){return $fallback};throw ('Missing '+$n+'. Install prerequisite.')}
$PgDump=FindExe 'pg_dump' 'C:\Program Files\PostgreSQL\17\bin\pg_dump.exe';$Rclone=FindExe 'rclone' ($env:ProgramFiles+'\rclone\rclone.exe');$SecretsFile=Join-Path $ConfigDir 'db-password.dpapi'
if($SetupSecrets){(Read-Host 'Supabase database password' -AsSecureString)|ConvertFrom-SecureString|Set-Content $SecretsFile -Encoding ASCII;Write-Host 'Encrypted password saved for this Windows user.';Stop-Transcript|Out-Null;exit 0}
if(!(Test-Path $SecretsFile)){throw 'Run once with -SetupSecrets'};if(!(Test-Path ($env:APPDATA+'\rclone\rclone.conf'))){throw 'rclone config missing'}
$DbHost='db.fsqpeuulaglnnwfyxndj.supabase.co';$DbUser='postgres.fsqpeuulaglnnwfyxndj';$DbName='postgres';$DbPort='5432';$Secure=Get-Content $SecretsFile -Raw|ConvertTo-SecureString;$Ptr=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($Secure)
try{$DbPassword=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($Ptr)}finally{[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($Ptr)}
$PgPass=Join-Path $RunDir 'pgpass.tmp';$escaped=$DbPassword.Replace('\','\\').Replace(':','\:');($DbHost+':'+$DbPort+':'+$DbName+':'+$DbUser+':'+$escaped)|Set-Content $PgPass -Encoding ASCII;$env:PGPASSFILE=$PgPass;$env:PGSSLMODE='require'
try{$Dump=Join-Path $RunDir 'database.sql';& $PgDump --host=$DbHost --port=$DbPort --username=$DbUser --dbname=$DbName --format=plain --no-owner --no-privileges --file=$Dump;if($LASTEXITCODE -ne 0 -or !(Test-Path $Dump) -or (Get-Item $Dump).Length -lt 1024){throw 'pg_dump failed or dump is suspiciously small'}}finally{Remove-Item $PgPass -Force -ErrorAction SilentlyContinue;Remove-Item Env:PGPASSFILE -ErrorAction SilentlyContinue;Remove-Item Env:PGSSLMODE -ErrorAction SilentlyContinue;$DbPassword=$null}
foreach($Bucket in @('products','blog-images','crm-branding')){$Dest=Join-Path $RunDir ('storage\'+$Bucket);New-Item -ItemType Directory -Path $Dest -Force|Out-Null;& $Rclone copy ('youjiu-s3:'+$Bucket) $Dest --transfers 4 --checkers 8 --retries 3;if($LASTEXITCODE -ne 0){throw ('Storage backup failed for '+$Bucket)}}
Get-ChildItem $RunDir -File -Recurse|Get-FileHash -Algorithm SHA256|ForEach-Object{($_.Hash+'  '+$_.Path)}|Set-Content (Join-Path $RunDir 'SHA256SUMS.txt') -Encoding UTF8
& $Rclone copy $RunDir ('youjiu-backup:youjiu-backups/YOUJIU_BACKUP/runs/'+(Split-Path $RunDir -Leaf)) --transfers 4 --retries 3;if($LASTEXITCODE -ne 0){throw 'Offsite copy failed'}
Get-ChildItem (Join-Path $Root 'runs') -Directory|Where-Object{$_.LastWriteTime -lt (Get-Date).AddMonths(-12)}|Remove-Item -Recurse -Force
Write-Host ('Backup complete: '+$RunDir);Stop-Transcript|Out-Null