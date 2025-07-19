#!/bin/bash

# Cultural Sound Lab Disaster Recovery Script
set -e

# Configuration
RECOVERY_MODE=${1:-"full"} # full, database-only, storage-only
BACKUP_SOURCE=${2:-"local"} # local, s3
RECOVERY_POINT=${3:-"latest"} # latest, or specific timestamp

echo "🚨 Starting disaster recovery process..."
echo "Mode: $RECOVERY_MODE"
echo "Source: $BACKUP_SOURCE" 
echo "Recovery Point: $RECOVERY_POINT"

# Create recovery log
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RECOVERY_LOG="/backups/logs/disaster_recovery_${TIMESTAMP}.log"
exec > >(tee -a "$RECOVERY_LOG") 2>&1

echo "📝 Recovery log: $RECOVERY_LOG"

# Pre-recovery checks
echo "🔍 Performing pre-recovery checks..."

# Check disk space
AVAILABLE_SPACE=$(df /backups | tail -1 | awk '{print $4}')
if [ "$AVAILABLE_SPACE" -lt 1048576 ]; then # Less than 1GB
    echo "⚠️ Warning: Low disk space available ($(($AVAILABLE_SPACE / 1024))MB)"
fi

# Check if services are running
echo "📊 Checking service status..."
SERVICES=("postgres" "redis" "minio" "api" "web")
for service in "${SERVICES[@]}"; do
    if docker-compose ps "$service" | grep -q "Up"; then
        echo "✅ $service is running"
    else
        echo "❌ $service is not running"
    fi
done

# Download backups from S3 if needed
if [ "$BACKUP_SOURCE" = "s3" ]; then
    echo "☁️ Downloading backups from S3..."
    if [ -n "$BACKUP_S3_BUCKET" ]; then
        aws s3 sync "s3://$BACKUP_S3_BUCKET/" /backups/external/
    else
        echo "❌ S3 bucket not configured"
        exit 1
    fi
fi

# Determine backup files to use
if [ "$RECOVERY_POINT" = "latest" ]; then
    DB_BACKUP=$(ls -t /backups/database/csl_database_backup_*.sql.gz 2>/dev/null | head -1)
    STORAGE_BACKUP=$(ls -t /backups/storage/csl_storage_backup_*.tar.gz 2>/dev/null | head -1)
else
    DB_BACKUP="/backups/database/csl_database_backup_${RECOVERY_POINT}.sql.gz"
    STORAGE_BACKUP="/backups/storage/csl_storage_backup_${RECOVERY_POINT}.tar.gz"
fi

echo "📂 Selected backups:"
echo "Database: ${DB_BACKUP:-"Not found"}"
echo "Storage: ${STORAGE_BACKUP:-"Not found"}"

# Stop all services for recovery
echo "⏹️ Stopping all services for recovery..."
docker-compose down

# Perform recovery based on mode
case "$RECOVERY_MODE" in
    "full")
        echo "🔄 Performing full system recovery..."
        
        # Start only infrastructure services
        docker-compose up -d postgres redis minio
        sleep 30 # Wait for services to be ready
        
        # Restore database
        if [ -n "$DB_BACKUP" ] && [ -f "$DB_BACKUP" ]; then
            echo "📥 Restoring database..."
            /usr/local/bin/restore-database.sh "$(basename "$DB_BACKUP")"
        else
            echo "❌ Database backup not found"
            exit 1
        fi
        
        # Restore storage
        if [ -n "$STORAGE_BACKUP" ] && [ -f "$STORAGE_BACKUP" ]; then
            echo "📁 Restoring storage..."
            /usr/local/bin/restore-storage.sh "$(basename "$STORAGE_BACKUP")"
        else
            echo "❌ Storage backup not found"
            exit 1
        fi
        ;;
        
    "database-only")
        echo "🗄️ Performing database-only recovery..."
        docker-compose up -d postgres
        sleep 15
        
        if [ -n "$DB_BACKUP" ] && [ -f "$DB_BACKUP" ]; then
            /usr/local/bin/restore-database.sh "$(basename "$DB_BACKUP")"
        else
            echo "❌ Database backup not found"
            exit 1
        fi
        ;;
        
    "storage-only")
        echo "📁 Performing storage-only recovery..."
        docker-compose up -d minio
        sleep 15
        
        if [ -n "$STORAGE_BACKUP" ] && [ -f "$STORAGE_BACKUP" ]; then
            /usr/local/bin/restore-storage.sh "$(basename "$STORAGE_BACKUP")"
        else
            echo "❌ Storage backup not found"
            exit 1
        fi
        ;;
        
    *)
        echo "❌ Invalid recovery mode: $RECOVERY_MODE"
        echo "Valid modes: full, database-only, storage-only"
        exit 1
        ;;
esac

# Start all services
echo "▶️ Starting all services..."
docker-compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
for i in {1..30}; do
    if curl -f http://localhost:3001/api/health >/dev/null 2>&1; then
        echo "✅ API is healthy"
        break
    fi
    sleep 10
    echo "Attempt $i/30: Waiting for API..."
done

# Post-recovery verification
echo "🔍 Performing post-recovery verification..."

# Database verification
echo "Checking database..."
DB_TABLES=$(docker-compose exec -T postgres psql -U csl_user -d cultural_sound_lab -t -c "
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
")
echo "Database tables: $DB_TABLES"

# Storage verification
echo "Checking storage..."
STORAGE_FILES=$(docker-compose exec -T minio mc ls csl-minio/cultural-audio --recursive | wc -l)
echo "Storage files: $STORAGE_FILES"

# Service health checks
echo "Checking service health..."
for service in api web; do
    if curl -f "http://localhost:3001/api/health" >/dev/null 2>&1; then
        echo "✅ $service is healthy"
    else
        echo "❌ $service health check failed"
    fi
done

# Generate recovery report
RECOVERY_REPORT="/backups/reports/disaster_recovery_report_${TIMESTAMP}.json"
mkdir -p /backups/reports

cat > "$RECOVERY_REPORT" << EOF
{
  "recovery_timestamp": "$(date -Iseconds)",
  "recovery_mode": "$RECOVERY_MODE",
  "backup_source": "$BACKUP_SOURCE",
  "recovery_point": "$RECOVERY_POINT",
  "database_backup": "$(basename "${DB_BACKUP:-none}")",
  "storage_backup": "$(basename "${STORAGE_BACKUP:-none}")",
  "verification": {
    "database_tables": $DB_TABLES,
    "storage_files": $STORAGE_FILES,
    "services_healthy": true
  },
  "recovery_log": "$RECOVERY_LOG",
  "status": "completed"
}
EOF

echo "✅ Disaster recovery completed successfully"
echo "📊 Recovery report: $RECOVERY_REPORT"
echo "📝 Detailed log: $RECOVERY_LOG"

# Update metrics
echo "csl_disaster_recovery_success 1" > /backups/metrics/disaster_recovery.prom
echo "csl_disaster_recovery_timestamp $(date +%s)" >> /backups/metrics/disaster_recovery.prom
echo "csl_disaster_recovery_duration $(($(date +%s) - $(date -d "$TIMESTAMP" +%s)))" >> /backups/metrics/disaster_recovery.prom