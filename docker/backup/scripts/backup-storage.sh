#!/bin/bash

# Cultural Sound Lab Storage Backup Script
set -e

# Configuration
MINIO_ENDPOINT=${MINIO_ENDPOINT:-minio:9000}
MINIO_ACCESS_KEY=${MINIO_ACCESS_KEY:-minioadmin}
MINIO_SECRET_KEY=${MINIO_SECRET_KEY:-minioadmin123}
BACKUP_DIR="/backups/storage"
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="csl_storage_backup_${TIMESTAMP}.tar.gz"

echo "📁 Starting storage backup: $BACKUP_FILE"

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR" /backups/logs /backups/metrics

# Configure MinIO client
mc alias set csl-minio "http://$MINIO_ENDPOINT" "$MINIO_ACCESS_KEY" "$MINIO_SECRET_KEY"

# Create temporary directory for backup
TEMP_DIR="/tmp/csl_storage_backup_$TIMESTAMP"
mkdir -p "$TEMP_DIR"

# Mirror MinIO buckets to local directory
echo "📥 Downloading storage data..."
mc mirror csl-minio/cultural-audio "$TEMP_DIR/cultural-audio" 2>/backups/logs/storage_backup_${TIMESTAMP}.log

# Create compressed archive
echo "📦 Creating compressed backup..."
cd "$TEMP_DIR"
tar -czf "$BACKUP_DIR/$BACKUP_FILE" . 2>>/backups/logs/storage_backup_${TIMESTAMP}.log

# Verify backup
echo "🔍 Verifying backup integrity..."
if tar -tzf "$BACKUP_DIR/$BACKUP_FILE" >/dev/null 2>&1; then
    echo "✅ Backup verification successful"
    
    # Log backup details
    BACKUP_SIZE=$(stat -c%s "$BACKUP_DIR/$BACKUP_FILE")
    FILE_COUNT=$(tar -tzf "$BACKUP_DIR/$BACKUP_FILE" | wc -l)
    echo "📊 Backup completed: $BACKUP_FILE ($(($BACKUP_SIZE / 1024 / 1024))MB, $FILE_COUNT files)"
    
    # Update metrics
    echo "csl_backup_storage_size_bytes $BACKUP_SIZE" > /backups/metrics/storage_backup.prom
    echo "csl_backup_storage_file_count $FILE_COUNT" >> /backups/metrics/storage_backup.prom
    echo "csl_backup_storage_timestamp $(date +%s)" >> /backups/metrics/storage_backup.prom
    echo "csl_backup_storage_success 1" >> /backups/metrics/storage_backup.prom
    
else
    echo "❌ Backup verification failed"
    echo "csl_backup_storage_success 0" > /backups/metrics/storage_backup.prom
    rm -f "$BACKUP_DIR/$BACKUP_FILE"
    exit 1
fi

# Clean up temporary directory
rm -rf "$TEMP_DIR"

# Clean up old backups
echo "🧹 Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "csl_storage_backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete

# Upload to external storage (if configured)
if [ -n "$BACKUP_S3_BUCKET" ]; then
    echo "☁️ Uploading backup to S3..."
    aws s3 cp "$BACKUP_DIR/$BACKUP_FILE" "s3://$BACKUP_S3_BUCKET/storage/$BACKUP_FILE"
fi

echo "✅ Storage backup completed successfully"