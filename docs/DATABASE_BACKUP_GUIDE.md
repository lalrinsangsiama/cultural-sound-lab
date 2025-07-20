# Database Backup Guide

This guide covers the automated database backup system for Cultural Sound Lab's Supabase PostgreSQL database.

## Overview

The backup system provides:
- **Automated daily backups** via GitHub Actions or local cron
- **Manual backup capability** for on-demand backups
- **Point-in-time restore** functionality
- **Backup monitoring** with notifications
- **30-day retention** policy (configurable)
- **Optional cloud storage** (S3/GCS) integration

## Prerequisites

### Local Environment
- PostgreSQL client tools (`pg_dump`, `psql`)
  - macOS: `brew install postgresql`
  - Ubuntu: `sudo apt-get install postgresql-client`
- Environment variables configured in `.env` or GitHub Secrets

### Required Environment Variables
```bash
# Database connection (required)
DATABASE_URL=postgres://user:password@host:port/database

# Optional cloud storage
BACKUP_S3_BUCKET=your-s3-bucket-name
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Optional monitoring notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
ALERT_EMAIL=admin@example.com
```

## Backup Methods

### 1. GitHub Actions (Recommended for Production)

The automated backup runs daily at 2:00 AM UTC via GitHub Actions.

#### Setup
1. Add required secrets to your GitHub repository:
   - `DATABASE_URL` - Your Supabase database connection string
   - (Optional) `BACKUP_S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`

2. The workflow is already configured at `.github/workflows/database-backup.yml`

#### Manual Trigger
Run a backup manually from GitHub:
1. Go to Actions → Database Backup
2. Click "Run workflow"
3. Optionally adjust retention days or enable S3 upload

#### Download Backups
Backups are stored as GitHub artifacts:
1. Go to Actions → Select a workflow run
2. Download the backup artifact from the bottom of the page

### 2. Local Cron (For Self-Hosted/Development)

#### Setup Automated Backups
```bash
# Run the setup script
./scripts/setup-backup-cron.sh

# Select your preferred schedule:
# 1. Daily at 2:00 AM
# 2. Daily at custom time
# 3. Weekly (Sundays at 2:00 AM)
# 4. Weekly at custom time
# 5. Custom cron expression
```

#### View/Edit Cron Jobs
```bash
# List current cron jobs
crontab -l

# Edit cron jobs manually
crontab -e

# Remove backup cron job
./scripts/setup-backup-cron.sh
# Select option 6
```

### 3. Manual Backup

Run a backup manually at any time:

```bash
# Basic backup
./scripts/backup-supabase.sh

# With custom retention
BACKUP_RETENTION_DAYS=60 ./scripts/backup-supabase.sh

# With S3 upload
BACKUP_S3_BUCKET=my-bucket ./scripts/backup-supabase.sh
```

## Restore Procedures

### Interactive Restore

The restore script provides an interactive interface:

```bash
# Run the restore script
./scripts/restore-supabase.sh

# You'll see:
# 1. List of available backups
# 2. Select backup to restore
# 3. Confirm the restore operation
# 4. Monitor restore progress
```

### Manual Restore

For manual restore using a specific backup file:

```bash
# 1. Decompress the backup
gunzip backups/database/csl_database_backup_20240115_020000.sql.gz

# 2. Restore using psql
psql $DATABASE_URL < backups/database/csl_database_backup_20240115_020000.sql
```

## Monitoring

### Automated Monitoring

Run the monitoring script to check backup health:

```bash
# Check backup status
./scripts/monitor-backups.sh

# Add to cron for regular monitoring
# Run every 6 hours
0 */6 * * * cd /path/to/project && ./scripts/monitor-backups.sh
```

### Monitoring Checks
- **Backup Age**: Alerts if no backup in 48 hours (configurable)
- **Backup Integrity**: Verifies backups can be decompressed
- **Disk Space**: Warns when disk usage exceeds 80%
- **Environment**: Checks required tools and variables

### Notification Channels

Configure notifications by setting environment variables:

1. **Slack**: Set `SLACK_WEBHOOK_URL`
2. **Discord**: Set `DISCORD_WEBHOOK_URL`
3. **Email**: Set `ALERT_EMAIL` (requires mail command)

## Backup Storage

### Local Storage
- Default location: `./backups/database/`
- Format: `csl_database_backup_YYYYMMDD_HHMMSS.sql.gz`
- Automatic cleanup of backups older than retention period

### Cloud Storage (Optional)

#### AWS S3
```bash
# Set environment variables
export BACKUP_S3_BUCKET=my-backup-bucket
export AWS_ACCESS_KEY_ID=your-key
export AWS_SECRET_ACCESS_KEY=your-secret
export AWS_DEFAULT_REGION=us-east-1

# Backups will be uploaded to:
# s3://my-backup-bucket/database/csl_database_backup_*.sql.gz
```

#### Google Cloud Storage
```bash
# Install gsutil
# Set up authentication
gcloud auth login

# Set environment variable
export BACKUP_GCS_BUCKET=my-backup-bucket

# Backups will be uploaded to:
# gs://my-backup-bucket/database/csl_database_backup_*.sql.gz
```

## Best Practices

### 1. Regular Testing
- Test restore procedures monthly
- Verify backup integrity regularly
- Document any schema changes

### 2. Security
- Keep `DATABASE_URL` secure (use secrets management)
- Restrict access to backup files
- Encrypt backups for sensitive data
- Use separate credentials for backup operations

### 3. Retention Policy
- Default: 30 days of daily backups
- Adjust based on:
  - Compliance requirements
  - Storage costs
  - Recovery time objectives (RTO)

### 4. Monitoring
- Set up notifications for backup failures
- Monitor backup sizes for anomalies
- Track backup/restore times

## Troubleshooting

### Common Issues

1. **pg_dump not found**
   ```bash
   # Install PostgreSQL client tools
   brew install postgresql  # macOS
   sudo apt-get install postgresql-client  # Ubuntu
   ```

2. **Permission denied**
   ```bash
   # Make scripts executable
   chmod +x ./scripts/*.sh
   ```

3. **DATABASE_URL not set**
   ```bash
   # Check .env file
   cat .env | grep DATABASE_URL
   
   # Or set manually
   export DATABASE_URL="postgres://..."
   ```

4. **Backup verification fails**
   - Check disk space
   - Verify gzip is installed
   - Check file permissions

### Logs

- **Backup logs**: `./backups/database/backup_*.log`
- **Restore logs**: `./backups/database/restore_*.log`
- **Cron logs**: `./logs/cron/backup.log`
- **Monitoring logs**: `./logs/backup-monitoring.log`

## Recovery Scenarios

### 1. Accidental Data Deletion
```bash
# 1. Identify when data was deleted
# 2. Find backup from before deletion
./scripts/restore-supabase.sh
# 3. Select appropriate backup
# 4. Confirm restore
```

### 2. Database Corruption
```bash
# 1. Stop application to prevent further damage
# 2. Create current backup if possible
./scripts/backup-supabase.sh
# 3. Restore from last known good backup
./scripts/restore-supabase.sh
```

### 3. Disaster Recovery
```bash
# 1. Provision new database instance
# 2. Update DATABASE_URL
# 3. Restore latest backup
./scripts/restore-supabase.sh
# 4. Verify application functionality
```

## Maintenance

### Weekly Tasks
- Verify latest backup exists
- Check monitoring alerts
- Review backup sizes

### Monthly Tasks
- Test restore procedure
- Review retention policy
- Check disk usage trends
- Update documentation

### Quarterly Tasks
- Full disaster recovery drill
- Review and update backup strategy
- Audit access permissions
- Update notification contacts

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review logs for error messages
3. Create an issue in the repository
4. Contact the development team

Remember: **A backup is only as good as its last successful restore test!**