#!/bin/bash

# Cultural Sound Lab - Supabase Database Backup Script
# This script creates backups of your Supabase PostgreSQL database
# It can be run manually or scheduled via cron/GitHub Actions

set -e

# Load environment variables
if [ -f ".env" ]; then
    export $(grep -E '^[A-Z]' .env | xargs)
fi

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups/database}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="csl_database_backup_${TIMESTAMP}"
BACKUP_FILE="${BACKUP_NAME}.sql"
COMPRESSED_FILE="${BACKUP_NAME}.sql.gz"
LOG_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to log messages
log() {
    echo -e "$1" | tee -a "$LOG_FILE"
}

# Function to check prerequisites
check_prerequisites() {
    log "${YELLOW}📋 Checking prerequisites...${NC}"
    
    # Check if pg_dump is installed
    if ! command -v pg_dump &> /dev/null; then
        log "${RED}❌ Error: pg_dump is not installed. Please install PostgreSQL client tools.${NC}"
        log "   On macOS: brew install postgresql"
        log "   On Ubuntu: sudo apt-get install postgresql-client"
        exit 1
    fi
    
    # Check if required environment variables are set
    if [ -z "$DATABASE_URL" ]; then
        log "${RED}❌ Error: DATABASE_URL environment variable is not set.${NC}"
        log "   Please ensure your .env file contains the Supabase DATABASE_URL"
        exit 1
    fi
}

# Function to create backup directory
create_backup_directory() {
    if [ ! -d "$BACKUP_DIR" ]; then
        log "${YELLOW}📁 Creating backup directory: $BACKUP_DIR${NC}"
        mkdir -p "$BACKUP_DIR"
    fi
}

# Function to perform database backup
perform_backup() {
    log "${GREEN}🗄️  Starting database backup...${NC}"
    log "   Backup file: $COMPRESSED_FILE"
    
    # Extract connection details from DATABASE_URL
    # Format: postgres://user:password@host:port/database
    if [[ $DATABASE_URL =~ postgres://([^:]+):([^@]+)@([^:]+):([^/]+)/(.+) ]]; then
        DB_USER="${BASH_REMATCH[1]}"
        DB_PASSWORD="${BASH_REMATCH[2]}"
        DB_HOST="${BASH_REMATCH[3]}"
        DB_PORT="${BASH_REMATCH[4]}"
        DB_NAME="${BASH_REMATCH[5]}"
    else
        log "${RED}❌ Error: Unable to parse DATABASE_URL${NC}"
        exit 1
    fi
    
    # Perform the backup
    export PGPASSWORD="$DB_PASSWORD"
    
    log "${YELLOW}⏳ Creating database dump...${NC}"
    pg_dump \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --username="$DB_USER" \
        --dbname="$DB_NAME" \
        --verbose \
        --clean \
        --no-owner \
        --no-privileges \
        --if-exists \
        --format=plain \
        --file="$BACKUP_DIR/$BACKUP_FILE" \
        2>&1 | tee -a "$LOG_FILE"
    
    # Check if backup was successful
    if [ $? -eq 0 ] && [ -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
        log "${GREEN}✅ Database dump created successfully${NC}"
    else
        log "${RED}❌ Database dump failed${NC}"
        exit 1
    fi
}

# Function to compress backup
compress_backup() {
    log "${YELLOW}🗜️  Compressing backup...${NC}"
    
    cd "$BACKUP_DIR"
    gzip -9 "$BACKUP_FILE"
    
    if [ -f "$COMPRESSED_FILE" ]; then
        local SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)
        log "${GREEN}✅ Backup compressed successfully (Size: $SIZE)${NC}"
    else
        log "${RED}❌ Compression failed${NC}"
        exit 1
    fi
    cd - > /dev/null
}

# Function to verify backup
verify_backup() {
    log "${YELLOW}🔍 Verifying backup integrity...${NC}"
    
    cd "$BACKUP_DIR"
    if gunzip -t "$COMPRESSED_FILE" 2>/dev/null; then
        log "${GREEN}✅ Backup verification successful${NC}"
    else
        log "${RED}❌ Backup verification failed${NC}"
        exit 1
    fi
    cd - > /dev/null
}

# Function to clean up old backups
cleanup_old_backups() {
    log "${YELLOW}🧹 Cleaning up backups older than $RETENTION_DAYS days...${NC}"
    
    # Count old backups before deletion
    OLD_BACKUPS=$(find "$BACKUP_DIR" -name "csl_database_backup_*.sql.gz" -mtime +$RETENTION_DAYS | wc -l)
    
    if [ $OLD_BACKUPS -gt 0 ]; then
        find "$BACKUP_DIR" -name "csl_database_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
        log "${GREEN}✅ Removed $OLD_BACKUPS old backup(s)${NC}"
    else
        log "${GREEN}✅ No old backups to remove${NC}"
    fi
}

# Function to upload to cloud storage (optional)
upload_to_cloud() {
    if [ -n "$BACKUP_S3_BUCKET" ] && command -v aws &> /dev/null; then
        log "${YELLOW}☁️  Uploading backup to S3...${NC}"
        
        aws s3 cp "$BACKUP_DIR/$COMPRESSED_FILE" "s3://$BACKUP_S3_BUCKET/database/$COMPRESSED_FILE"
        
        if [ $? -eq 0 ]; then
            log "${GREEN}✅ Backup uploaded to S3 successfully${NC}"
        else
            log "${RED}⚠️  S3 upload failed (backup still available locally)${NC}"
        fi
    fi
    
    if [ -n "$BACKUP_GCS_BUCKET" ] && command -v gsutil &> /dev/null; then
        log "${YELLOW}☁️  Uploading backup to Google Cloud Storage...${NC}"
        
        gsutil cp "$BACKUP_DIR/$COMPRESSED_FILE" "gs://$BACKUP_GCS_BUCKET/database/$COMPRESSED_FILE"
        
        if [ $? -eq 0 ]; then
            log "${GREEN}✅ Backup uploaded to GCS successfully${NC}"
        else
            log "${RED}⚠️  GCS upload failed (backup still available locally)${NC}"
        fi
    fi
}

# Function to create backup summary
create_summary() {
    log "\n${GREEN}📊 Backup Summary:${NC}"
    log "   Timestamp: $(date)"
    log "   Backup file: $BACKUP_DIR/$COMPRESSED_FILE"
    log "   Total backups: $(ls -1 $BACKUP_DIR/*.sql.gz 2>/dev/null | wc -l)"
    log "   Oldest backup: $(ls -1t $BACKUP_DIR/*.sql.gz 2>/dev/null | tail -1)"
    log "   Newest backup: $(ls -1t $BACKUP_DIR/*.sql.gz 2>/dev/null | head -1)"
}

# Main execution
main() {
    log "${GREEN}🚀 Cultural Sound Lab - Database Backup Script${NC}"
    log "================================================"
    
    check_prerequisites
    create_backup_directory
    perform_backup
    compress_backup
    verify_backup
    cleanup_old_backups
    upload_to_cloud
    create_summary
    
    log "\n${GREEN}✅ Backup completed successfully!${NC}"
}

# Run the script
main