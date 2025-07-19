#!/bin/bash

# Cultural Sound Lab Database Restore Script
set -e

# Configuration
DB_HOST=${POSTGRES_HOST:-postgres}
DB_NAME=${POSTGRES_DB:-cultural_sound_lab}
DB_USER=${POSTGRES_USER:-csl_user}
DB_PASSWORD=${POSTGRES_PASSWORD:-csl_password}
BACKUP_DIR="/backups/database"

# Check if backup file is provided
if [ -z "$1" ]; then
    echo "❌ Error: Backup file not specified"
    echo "Usage: $0 <backup_file>"
    echo ""
    echo "Available backups:"
    ls -la "$BACKUP_DIR"/csl_database_backup_*.sql.gz 2>/dev/null || echo "No backups found"
    exit 1
fi

BACKUP_FILE="$1"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_FILE"

# Verify backup file exists
if [ ! -f "$BACKUP_PATH" ]; then
    echo "❌ Error: Backup file not found: $BACKUP_PATH"
    exit 1
fi

echo "🔄 Starting database restore from: $BACKUP_FILE"

# Verify backup integrity before restore
echo "🔍 Verifying backup integrity..."
if ! gunzip -t "$BACKUP_PATH"; then
    echo "❌ Backup file is corrupted"
    exit 1
fi

# Warning prompt
echo "⚠️  WARNING: This will completely replace the current database!"
echo "Database: $DB_NAME on $DB_HOST"
echo "Backup: $BACKUP_FILE"
echo ""
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "❌ Restore cancelled"
    exit 0
fi

# Create restore log
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/backups/logs/db_restore_${TIMESTAMP}.log"

echo "📝 Restore log: $LOG_FILE"

# Set PostgreSQL password
export PGPASSWORD="$DB_PASSWORD"

# Stop dependent services to prevent connections
echo "⏸️ Stopping dependent services..."
# Note: In production, you'd want to gracefully stop services
# docker-compose stop api web

# Terminate existing connections
echo "🔌 Terminating existing database connections..."
psql -h "$DB_HOST" -U "$DB_USER" -d postgres -c "
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();" 2>>"$LOG_FILE"

# Drop and recreate database
echo "🗑️ Dropping existing database..."
psql -h "$DB_HOST" -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS \"$DB_NAME\";" 2>>"$LOG_FILE"

echo "🆕 Creating new database..."
psql -h "$DB_HOST" -U "$DB_USER" -d postgres -c "CREATE DATABASE \"$DB_NAME\";" 2>>"$LOG_FILE"

# Restore from backup
echo "📥 Restoring database from backup..."
gunzip -c "$BACKUP_PATH" | pg_restore \
    --host="$DB_HOST" \
    --username="$DB_USER" \
    --dbname="$DB_NAME" \
    --verbose \
    --clean \
    --if-exists \
    --no-owner \
    --no-privileges \
    2>>"$LOG_FILE"

# Verify restore
echo "🔍 Verifying database restore..."
RESTORED_TABLES=$(psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -t -c "
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
" 2>>"$LOG_FILE")

if [ "$RESTORED_TABLES" -gt 0 ]; then
    echo "✅ Database restore completed successfully"
    echo "📊 Restored tables: $RESTORED_TABLES"
    
    # Update metrics
    echo "csl_restore_database_success 1" > /backups/metrics/database_restore.prom
    echo "csl_restore_database_timestamp $(date +%s)" >> /backups/metrics/database_restore.prom
    echo "csl_restore_database_tables $RESTORED_TABLES" >> /backups/metrics/database_restore.prom
    
    # Restart dependent services
    echo "▶️ Restarting dependent services..."
    # docker-compose start api web
    
else
    echo "❌ Database restore failed - no tables found"
    echo "csl_restore_database_success 0" > /backups/metrics/database_restore.prom
    exit 1
fi

echo "✅ Database restore process completed"