# YOUJIU Windows weekly backup (database + Storage + offsite)

Backs up the Supabase PostgreSQL database and the three currently verified Storage buckets (`products`, `blog-images`, `crm-branding`) to the Windows PC and then copies the run to a separate offsite destination using rclone. Credentials are not stored in this repository.

## Scope and limits
- PostgreSQL logical dump with `pg_dump`.
- Storage buckets copied using Supabase S3-compatible endpoint.
- SHA256 checksums generated.
- Local retention: 12 months; remote copies are not auto-deleted.
- Not point-in-time recovery. Restore testing is required.
- The SQL dump does not include object files, so Storage is backed up separately. Some platform configuration, auth metadata, secrets, Edge Functions and project settings may need separate export.

## 1. Install prerequisites
Install PostgreSQL client tools (pg_dump; version 17 client recommended) and rclone on Windows. Verify `pg_dump --version` and `rclone version`.

## 2. Configure rclone remotes
Run `rclone config` and create two remotes:
- `youjiu-s3`: S3 provider = Other; endpoint `https://fsqpeuulaglnnwfyxndj.supabase.co/storage/v1/s3`; region `ap-southeast-1`; credentials from Supabase Storage S3 connection settings. Configure path-style addressing if required by the rclone/provider version.
- `youjiu-backup`: a separate private S3-compatible bucket/account for backup. Prefer versioning/retention and MFA on the account. Do not use the same Supabase project as the offsite destination.

Test `rclone lsd youjiu-s3:` and `rclone lsd youjiu-backup:`.

## 3. Save database password encrypted with Windows DPAPI
Open PowerShell in `backup/windows` and run:
`powershell -ExecutionPolicy Bypass -File .\backup-youjiu.ps1 -SetupSecrets`
Enter the database password at the prompt. The encrypted secret is tied to this Windows user and computer. The script's connection values are preset for this project (host `db.fsqpeuulaglnnwfyxndj.supabase.co`, user `postgres.fsqpeuulaglnnwfyxndj`, database `postgres`, port `5432`). If direct connectivity is unavailable, use the project's pooler details and adjust settings; do not paste passwords into chat.

## 4. Run manually first
Run `powershell -ExecutionPolicy Bypass -File .\backup-youjiu.ps1`. Inspect `%USERPROFILE%\YOUJIU_BACKUP\runs\` for database.sql, storage folders and SHA256SUMS.txt, and check logs. Verify the run is copied to the offsite remote.

## 5. Schedule weekly
Run `powershell -ExecutionPolicy Bypass -File .\install-weekly-task.ps1`. Registers a Sunday 03:00 scheduled task under the current Windows account. The PC must be powered on. For unattended runs while logged out, configure task credentials in Task Scheduler UI.

## 6. Quarterly restore test
Restore the SQL dump into a disposable database, never directly into production; download an offsite run and validate the files/checksums. Document recovery results.

## Security
Never commit passwords, S3 keys, rclone configuration, or backup files. Encrypt the Windows disk, restrict account access, and protect the offsite account with MFA. DPAPI encrypted secret is tied to the user/machine.