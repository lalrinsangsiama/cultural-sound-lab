# GitHub Secrets Setup for Automated Backups

This guide will help you configure GitHub Secrets for the automated database backup workflow.

## Required Secret

You need to add the following secret to your GitHub repository:

### DATABASE_URL

This is your Supabase PostgreSQL connection string. Based on your project configuration, use the direct connection URL:

```
postgresql://postgres:[PASSWORD]@db.jzzjsjyfsmopbtefxwme.supabase.co:5432/postgres
```

**Note**: Replace `[PASSWORD]` with your actual database password.

## Step-by-Step Setup

### 1. Navigate to Repository Settings

1. Go to your GitHub repository: `https://github.com/[your-username]/cultural-sound-lab`
2. Click on **Settings** tab
3. In the left sidebar, under **Security**, click **Secrets and variables**
4. Click **Actions**

### 2. Add the DATABASE_URL Secret

1. Click **New repository secret**
2. Fill in the details:
   - **Name**: `DATABASE_URL`
   - **Secret**: `postgresql://postgres:[YOUR_PASSWORD]@db.jzzjsjyfsmopbtefxwme.supabase.co:5432/postgres`
3. Click **Add secret**

### 3. Optional Secrets for Enhanced Features

#### For S3 Backup Storage (Optional)
If you want to store backups in AWS S3:

- **BACKUP_S3_BUCKET**: Your S3 bucket name (e.g., `csl-backups`)
- **AWS_ACCESS_KEY_ID**: Your AWS access key
- **AWS_SECRET_ACCESS_KEY**: Your AWS secret key
- **AWS_DEFAULT_REGION**: AWS region (e.g., `us-east-1`)

#### For Monitoring Notifications (Optional)
If you want to receive backup notifications:

- **SLACK_WEBHOOK_URL**: Your Slack webhook URL
- **DISCORD_WEBHOOK_URL**: Your Discord webhook URL

## Verifying the Setup

### 1. Manual Workflow Run

After adding the secrets:

1. Go to **Actions** tab in your repository
2. Select **Database Backup** workflow
3. Click **Run workflow**
4. Select branch and click **Run workflow**

### 2. Check Workflow Status

- Green checkmark ✅ = Success
- Red X ❌ = Failed (check logs for details)

### 3. Download Test Backup

If successful:
1. Click on the completed workflow run
2. Scroll to **Artifacts** section
3. Download `database-backup-[run-id]`

## Security Best Practices

1. **Never commit secrets to code**
   - Always use GitHub Secrets or environment variables
   - Never hardcode passwords in files

2. **Limit access**
   - Only repository admins can view/modify secrets
   - Use branch protection rules

3. **Rotate credentials regularly**
   - Update database passwords periodically
   - Update the GitHub Secret when you do

4. **Use read-only credentials when possible**
   - For backups, consider creating a read-only database user
   - This limits potential damage if credentials are compromised

## Troubleshooting

### Common Issues

1. **"pg_dump: error: connection to server failed"**
   - Verify DATABASE_URL is correct
   - Check if IP needs to be whitelisted in Supabase

2. **"Authentication failed"**
   - Double-check the password in DATABASE_URL
   - Ensure no special characters need escaping

3. **"Workflow not found"**
   - Ensure `.github/workflows/database-backup.yml` exists
   - Check if workflow is disabled in Actions settings

### Getting Your Database Password

If you've forgotten your database password:

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **Database**
4. Click **Reset database password** if needed

## Next Steps

Once configured:

1. **Monitor first automated run** (daily at 2 AM UTC)
2. **Set up notifications** (optional)
3. **Test restore procedure** with a backup
4. **Document** your backup strategy

## Support

For issues:
1. Check GitHub Actions logs
2. Review this documentation
3. Consult the [Database Backup Guide](./DATABASE_BACKUP_GUIDE.md)
4. Create an issue in the repository