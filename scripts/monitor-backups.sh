#!/bin/bash

# Cultural Sound Lab - Backup Monitoring Script
# This script monitors backup status and sends notifications

set -e

# Load environment variables
if [ -f ".env" ]; then
    export $(grep -E '^[A-Z]' .env | xargs)
fi

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups/database}"
LOG_DIR="${LOG_DIR:-./logs}"
ALERT_THRESHOLD_HOURS="${ALERT_THRESHOLD_HOURS:-48}" # Alert if no backup in 48 hours
MONITORING_LOG="$LOG_DIR/backup-monitoring.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create directories if needed
mkdir -p "$LOG_DIR"

# Function to log messages
log() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "$message" | tee -a "$MONITORING_LOG"
    echo "[$timestamp] $(echo "$message" | sed 's/\x1b\[[0-9;]*m//g')" >> "$MONITORING_LOG"
}

# Function to send notification
send_notification() {
    local level="$1"
    local subject="$2"
    local message="$3"
    
    # Console output
    case $level in
        "error")
            log "${RED}❌ ERROR: $subject${NC}"
            ;;
        "warning")
            log "${YELLOW}⚠️  WARNING: $subject${NC}"
            ;;
        "info")
            log "${GREEN}✅ INFO: $subject${NC}"
            ;;
    esac
    log "   $message"
    
    # Send to various notification channels based on configuration
    
    # Slack webhook (if configured)
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        local color="#36a64f"
        [ "$level" = "error" ] && color="#ff0000"
        [ "$level" = "warning" ] && color="#ffaa00"
        
        curl -s -X POST "$SLACK_WEBHOOK_URL" \
            -H 'Content-Type: application/json' \
            -d "{
                \"attachments\": [{
                    \"color\": \"$color\",
                    \"title\": \"CSL Backup Monitor: $subject\",
                    \"text\": \"$message\",
                    \"footer\": \"Cultural Sound Lab\",
                    \"ts\": $(date +%s)
                }]
            }" > /dev/null
    fi
    
    # Discord webhook (if configured)
    if [ -n "$DISCORD_WEBHOOK_URL" ]; then
        local emoji="✅"
        [ "$level" = "error" ] && emoji="❌"
        [ "$level" = "warning" ] && emoji="⚠️"
        
        curl -s -X POST "$DISCORD_WEBHOOK_URL" \
            -H 'Content-Type: application/json' \
            -d "{
                \"content\": \"$emoji **CSL Backup Monitor**\",
                \"embeds\": [{
                    \"title\": \"$subject\",
                    \"description\": \"$message\",
                    \"color\": $([ "$level" = "error" ] && echo "16711680" || [ "$level" = "warning" ] && echo "16776960" || echo "3066993")
                }]
            }" > /dev/null
    fi
    
    # Email (if configured - requires mail/sendmail)
    if [ -n "$ALERT_EMAIL" ] && command -v mail &> /dev/null; then
        echo -e "Subject: [CSL Backup] $subject\n\n$message" | mail -s "[CSL Backup] $subject" "$ALERT_EMAIL"
    fi
}

# Function to check backup status
check_backup_status() {
    log "${BLUE}🔍 Checking backup status...${NC}"
    
    if [ ! -d "$BACKUP_DIR" ]; then
        send_notification "error" "Backup directory missing" "Backup directory does not exist: $BACKUP_DIR"
        return 1
    fi
    
    # Find latest backup
    LATEST_BACKUP=$(ls -1t "$BACKUP_DIR"/csl_database_backup_*.sql.gz 2>/dev/null | head -1)
    
    if [ -z "$LATEST_BACKUP" ]; then
        send_notification "error" "No backups found" "No backup files found in $BACKUP_DIR"
        return 1
    fi
    
    # Check backup age
    BACKUP_AGE_SECONDS=$(( $(date +%s) - $(stat -f %m "$LATEST_BACKUP" 2>/dev/null || stat -c %Y "$LATEST_BACKUP") ))
    BACKUP_AGE_HOURS=$(( BACKUP_AGE_SECONDS / 3600 ))
    BACKUP_AGE_DAYS=$(( BACKUP_AGE_HOURS / 24 ))
    
    # Get backup info
    BACKUP_NAME=$(basename "$LATEST_BACKUP")
    BACKUP_SIZE=$(du -h "$LATEST_BACKUP" | cut -f1)
    
    log "${BLUE}📊 Latest backup:${NC}"
    log "   File: $BACKUP_NAME"
    log "   Size: $BACKUP_SIZE"
    log "   Age: $BACKUP_AGE_HOURS hours ($BACKUP_AGE_DAYS days)"
    
    # Check if backup is too old
    if [ $BACKUP_AGE_HOURS -gt $ALERT_THRESHOLD_HOURS ]; then
        send_notification "warning" "Backup is stale" "Latest backup is $BACKUP_AGE_HOURS hours old (threshold: $ALERT_THRESHOLD_HOURS hours). File: $BACKUP_NAME"
        return 2
    else
        send_notification "info" "Backup status healthy" "Latest backup: $BACKUP_NAME (Size: $BACKUP_SIZE, Age: $BACKUP_AGE_HOURS hours)"
    fi
    
    return 0
}

# Function to check backup integrity
check_backup_integrity() {
    log "\n${BLUE}🔍 Checking backup integrity...${NC}"
    
    local failed_count=0
    local checked_count=0
    local max_check=5  # Check only the 5 most recent backups
    
    for backup in $(ls -1t "$BACKUP_DIR"/csl_database_backup_*.sql.gz 2>/dev/null | head -$max_check); do
        checked_count=$((checked_count + 1))
        if ! gunzip -t "$backup" 2>/dev/null; then
            failed_count=$((failed_count + 1))
            send_notification "error" "Corrupted backup found" "Backup file is corrupted: $(basename "$backup")"
        fi
    done
    
    if [ $checked_count -gt 0 ]; then
        log "   Checked $checked_count recent backups"
        if [ $failed_count -eq 0 ]; then
            log "${GREEN}   ✅ All backups are valid${NC}"
        else
            log "${RED}   ❌ Found $failed_count corrupted backup(s)${NC}"
        fi
    fi
}

# Function to check disk space
check_disk_space() {
    log "\n${BLUE}🔍 Checking disk space...${NC}"
    
    # Get disk usage for backup directory
    DISK_USAGE=$(df -h "$BACKUP_DIR" | tail -1 | awk '{print $5}' | sed 's/%//')
    DISK_FREE=$(df -h "$BACKUP_DIR" | tail -1 | awk '{print $4}')
    
    log "   Disk usage: $DISK_USAGE%"
    log "   Free space: $DISK_FREE"
    
    if [ $DISK_USAGE -gt 90 ]; then
        send_notification "error" "Low disk space" "Disk usage is at $DISK_USAGE% (Free: $DISK_FREE)"
    elif [ $DISK_USAGE -gt 80 ]; then
        send_notification "warning" "Disk space warning" "Disk usage is at $DISK_USAGE% (Free: $DISK_FREE)"
    else
        log "${GREEN}   ✅ Disk space is adequate${NC}"
    fi
}

# Function to generate report
generate_report() {
    log "\n${BLUE}📈 Backup Statistics:${NC}"
    
    if [ -d "$BACKUP_DIR" ]; then
        local total_backups=$(ls -1 "$BACKUP_DIR"/csl_database_backup_*.sql.gz 2>/dev/null | wc -l)
        local total_size=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
        local oldest_backup=$(ls -1t "$BACKUP_DIR"/csl_database_backup_*.sql.gz 2>/dev/null | tail -1)
        local newest_backup=$(ls -1t "$BACKUP_DIR"/csl_database_backup_*.sql.gz 2>/dev/null | head -1)
        
        log "   Total backups: $total_backups"
        log "   Total size: $total_size"
        [ -n "$oldest_backup" ] && log "   Oldest: $(basename "$oldest_backup")"
        [ -n "$newest_backup" ] && log "   Newest: $(basename "$newest_backup")"
    fi
}

# Function to check environment
check_environment() {
    log "\n${BLUE}🔍 Checking environment...${NC}"
    
    # Check if DATABASE_URL is set
    if [ -z "$DATABASE_URL" ]; then
        log "${YELLOW}   ⚠️  DATABASE_URL not set in environment${NC}"
    else
        log "${GREEN}   ✅ DATABASE_URL is configured${NC}"
    fi
    
    # Check if pg_dump is available
    if command -v pg_dump &> /dev/null; then
        log "${GREEN}   ✅ pg_dump is installed ($(pg_dump --version | head -1))${NC}"
    else
        log "${RED}   ❌ pg_dump is not installed${NC}"
    fi
}

# Main execution
main() {
    log "\n${GREEN}🚀 Cultural Sound Lab - Backup Monitor${NC}"
    log "========================================"
    log "Started at: $(date)"
    
    # Run all checks
    check_backup_status
    local backup_status=$?
    
    check_backup_integrity
    check_disk_space
    check_environment
    generate_report
    
    log "\n${GREEN}✅ Monitoring complete${NC}"
    
    # Exit with appropriate code
    exit $backup_status
}

# Run the script
main