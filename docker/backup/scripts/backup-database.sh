#!/bin/bash

# Cultural Sound Lab Database Backup Script
set -e

# Configuration
DB_HOST=${POSTGRES_HOST:-postgres}
DB_NAME=${POSTGRES_DB:-cultural_sound_lab}
DB_USER=${POSTGRES_USER:-csl_user}
DB_PASSWORD=${POSTGRES_PASSWORD:-csl_password}
BACKUP_DIR="/backups/database"
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="csl_database_backup_${TIMESTAMP}.sql.gz"

echo "🗄️ Starting database backup: $BACKUP_FILE"

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

# Create database backup
export PGPASSWORD="$DB_PASSWORD"
pg_dump \
    --host="$DB_HOST" \
    --username="$DB_USER" \
    --dbname="$DB_NAME" \
    --verbose \
    --clean \
    --if-exists \
    --create \
    --format=custom \
    --compress=9 \
    --file="$BACKUP_DIR/${BACKUP_FILE%.gz}" \
    2>/backups/logs/db_backup_${TIMESTAMP}.log

# Compress the backup
gzip "$BACKUP_DIR/${BACKUP_FILE%.gz}"

# Verify backup integrity
echo "🔍 Verifying backup integrity..."
if gunzip -t "$BACKUP_DIR/$BACKUP_FILE"; then
    echo "✅ Backup verification successful"
    
    # Log backup details
    BACKUP_SIZE=$(stat -c%s "$BACKUP_DIR/$BACKUP_FILE")
    echo "📊 Backup completed: $BACKUP_FILE ($(($BACKUP_SIZE / 1024 / 1024))MB)"
    
    # Update metrics
    echo "csl_backup_database_size_bytes $BACKUP_SIZE" > /backups/metrics/database_backup.prom
    echo "csl_backup_database_timestamp $(date +%s)" >> /backups/metrics/database_backup.prom
    echo "csl_backup_database_success 1" >> /backups/metrics/database_backup.prom
    
else
    echo "❌ Backup verification failed"
    echo "csl_backup_database_success 0" > /backups/metrics/database_backup.prom
    exit 1
fi

# Clean up old backups
echo "🧹 Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "csl_database_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

# Upload to external storage (if configured)
if [ -n "$BACKUP_S3_BUCKET" ]; then
    echo "☁️ Uploading backup to S3..."
    aws s3 cp "$BACKUP_DIR/$BACKUP_FILE" "s3://$BACKUP_S3_BUCKET/database/$BACKUP_FILE"
fi

echo "✅ Database backup completed successfully"