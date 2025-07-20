#!/bin/bash

# Cultural Sound Lab - Supabase Database Restore Script
# This script restores backups created by backup-supabase.sh

set -e

# Load environment variables
if [ -f ".env" ]; then
    export $(grep -E '^[A-Z]' .env | xargs)
fi

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups/database}"
LOG_FILE="${BACKUP_DIR}/restore_$(date +%Y%m%d_%H%M%S).log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to log messages
log() {
    echo -e "$1" | tee -a "$LOG_FILE"
}

# Function to check prerequisites
check_prerequisites() {
    log "${YELLOW}📋 Checking prerequisites...${NC}"
    
    # Check if psql is installed
    if ! command -v psql &> /dev/null; then
        log "${RED}❌ Error: psql is not installed. Please install PostgreSQL client tools.${NC}"
        log "   On macOS: brew install postgresql"
        log "   On Ubuntu: sudo apt-get install postgresql-client"
        exit 1
    fi
    
    # Check if required environment variables are set
    if [ -z "$DATABASE_URL" ]; then
        log "${RED}❌ Error: DATABASE_URL environment variable is not set.${NC}"
        exit 1
    fi
}

# Function to list available backups
list_backups() {
    log "${BLUE}📁 Available backups:${NC}"
    
    if [ ! -d "$BACKUP_DIR" ]; then
        log "${RED}❌ Backup directory does not exist: $BACKUP_DIR${NC}"
        exit 1
    fi
    
    BACKUPS=($(ls -1t "$BACKUP_DIR"/csl_database_backup_*.sql.gz 2>/dev/null))
    
    if [ ${#BACKUPS[@]} -eq 0 ]; then
        log "${RED}❌ No backups found in $BACKUP_DIR${NC}"
        exit 1
    fi
    
    for i in "${!BACKUPS[@]}"; do
        BACKUP_FILE=$(basename "${BACKUPS[$i]}")
        SIZE=$(du -h "${BACKUPS[$i]}" | cut -f1)
        DATE=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "${BACKUPS[$i]}" 2>/dev/null || stat -c "%y" "${BACKUPS[$i]}" 2>/dev/null | cut -d' ' -f1,2)
        log "   $((i+1)). $BACKUP_FILE (Size: $SIZE, Date: $DATE)"
    done
}

# Function to select backup
select_backup() {
    echo
    read -p "Select backup number to restore (or 'q' to quit): " selection
    
    if [ "$selection" = "q" ]; then
        log "${YELLOW}Restore cancelled.${NC}"
        exit 0
    fi
    
    if ! [[ "$selection" =~ ^[0-9]+$ ]] || [ "$selection" -lt 1 ] || [ "$selection" -gt ${#BACKUPS[@]} ]; then
        log "${RED}❌ Invalid selection${NC}"
        exit 1
    fi
    
    SELECTED_BACKUP="${BACKUPS[$((selection-1))]}"
    log "${GREEN}✅ Selected: $(basename "$SELECTED_BACKUP")${NC}"
}

# Function to confirm restore
confirm_restore() {
    log "\n${RED}⚠️  WARNING: This will restore the database from the selected backup.${NC}"
    log "${RED}   This operation will OVERWRITE the current database!${NC}"
    log "${YELLOW}   Make sure you have a recent backup of the current state.${NC}\n"
    
    read -p "Are you sure you want to continue? Type 'yes' to confirm: " confirmation
    
    if [ "$confirmation" != "yes" ]; then
        log "${YELLOW}Restore cancelled.${NC}"
        exit 0
    fi
}

# Function to perform restore
perform_restore() {
    log "\n${YELLOW}🔄 Starting database restore...${NC}"
    
    # Extract connection details from DATABASE_URL
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
    
    # Create temporary directory
    TEMP_DIR=$(mktemp -d)
    trap "rm -rf $TEMP_DIR" EXIT
    
    # Decompress the backup
    log "${YELLOW}📦 Decompressing backup...${NC}"
    cp "$SELECTED_BACKUP" "$TEMP_DIR/"
    cd "$TEMP_DIR"
    gunzip "$(basename "$SELECTED_BACKUP")"
    SQL_FILE="${TEMP_DIR}/$(basename "$SELECTED_BACKUP" .gz)"
    
    # Restore the database
    export PGPASSWORD="$DB_PASSWORD"
    
    log "${YELLOW}⏳ Restoring database...${NC}"
    log "   This may take several minutes depending on the backup size."
    
    # First, drop existing connections (optional, requires superuser)
    # psql "postgres://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/postgres" \
    #      -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='$DB_NAME' AND pid <> pg_backend_pid();" \
    #      2>/dev/null || true
    
    # Restore the database
    psql \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --username="$DB_USER" \
        --dbname="$DB_NAME" \
        --file="$SQL_FILE" \
        --echo-errors \
        --verbose \
        2>&1 | tee -a "$LOG_FILE"
    
    if [ ${PIPESTATUS[0]} -eq 0 ]; then
        log "${GREEN}✅ Database restore completed successfully${NC}"
    else
        log "${RED}❌ Database restore failed${NC}"
        log "   Check the log file for details: $LOG_FILE"
        exit 1
    fi
}

# Function to verify restore
verify_restore() {
    log "\n${YELLOW}🔍 Verifying restore...${NC}"
    
    # Test connection and count tables
    export PGPASSWORD="$DB_PASSWORD"
    
    TABLE_COUNT=$(psql \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --username="$DB_USER" \
        --dbname="$DB_NAME" \
        --tuples-only \
        --command="SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" \
        2>/dev/null | tr -d ' ')
    
    if [ -n "$TABLE_COUNT" ] && [ "$TABLE_COUNT" -gt 0 ]; then
        log "${GREEN}✅ Restore verification successful${NC}"
        log "   Found $TABLE_COUNT tables in the database"
    else
        log "${RED}⚠️  Warning: Unable to verify restore${NC}"
    fi
}

# Function to create restore summary
create_summary() {
    log "\n${GREEN}📊 Restore Summary:${NC}"
    log "   Timestamp: $(date)"
    log "   Restored from: $(basename "$SELECTED_BACKUP")"
    log "   Log file: $LOG_FILE"
}

# Main execution
main() {
    log "${GREEN}🚀 Cultural Sound Lab - Database Restore Script${NC}"
    log "================================================"
    
    check_prerequisites
    list_backups
    select_backup
    confirm_restore
    perform_restore
    verify_restore
    create_summary
    
    log "\n${GREEN}✅ Restore completed successfully!${NC}"
    log "\n${YELLOW}📌 Next steps:${NC}"
    log "   1. Test your application to ensure everything works correctly"
    log "   2. Check for any missing data or inconsistencies"
    log "   3. Create a new backup of the restored state if needed"
}

# Run the script
main