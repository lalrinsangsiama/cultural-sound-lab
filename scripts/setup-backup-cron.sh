#!/bin/bash

# Cultural Sound Lab - Setup Automated Backup Cron Job

set -e

# Configuration
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
BACKUP_SCRIPT="$PROJECT_ROOT/scripts/backup-supabase.sh"
CRON_LOG_DIR="$PROJECT_ROOT/logs/cron"
CRON_LOG_FILE="$CRON_LOG_DIR/backup.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Cultural Sound Lab - Backup Cron Setup${NC}"
echo "============================================"

# Create log directory
if [ ! -d "$CRON_LOG_DIR" ]; then
    echo -e "${YELLOW}📁 Creating log directory...${NC}"
    mkdir -p "$CRON_LOG_DIR"
fi

# Check if backup script exists
if [ ! -f "$BACKUP_SCRIPT" ]; then
    echo -e "${RED}❌ Error: Backup script not found at $BACKUP_SCRIPT${NC}"
    exit 1
fi

# Function to add cron job
add_cron_job() {
    local schedule="$1"
    local job="cd $PROJECT_ROOT && $BACKUP_SCRIPT >> $CRON_LOG_FILE 2>&1"
    
    # Check if cron job already exists
    if crontab -l 2>/dev/null | grep -q "$BACKUP_SCRIPT"; then
        echo -e "${YELLOW}⚠️  A backup cron job already exists. Updating...${NC}"
        # Remove existing job
        crontab -l 2>/dev/null | grep -v "$BACKUP_SCRIPT" | crontab -
    fi
    
    # Add new cron job
    (crontab -l 2>/dev/null; echo "$schedule $job") | crontab -
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Cron job added successfully${NC}"
    else
        echo -e "${RED}❌ Failed to add cron job${NC}"
        exit 1
    fi
}

# Display schedule options
echo -e "\n${BLUE}📅 Select backup schedule:${NC}"
echo "   1. Daily at 2:00 AM"
echo "   2. Daily at custom time"
echo "   3. Weekly (Sundays at 2:00 AM)"
echo "   4. Weekly at custom time"
echo "   5. Custom cron expression"
echo "   6. Remove existing cron job"
echo

read -p "Enter your choice (1-6): " choice

case $choice in
    1)
        add_cron_job "0 2 * * *"
        echo -e "${GREEN}✅ Daily backup scheduled at 2:00 AM${NC}"
        ;;
    2)
        read -p "Enter hour (0-23): " hour
        read -p "Enter minute (0-59): " minute
        add_cron_job "$minute $hour * * *"
        echo -e "${GREEN}✅ Daily backup scheduled at $hour:$minute${NC}"
        ;;
    3)
        add_cron_job "0 2 * * 0"
        echo -e "${GREEN}✅ Weekly backup scheduled for Sundays at 2:00 AM${NC}"
        ;;
    4)
        echo "Days: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday"
        read -p "Enter day (0-6): " day
        read -p "Enter hour (0-23): " hour
        read -p "Enter minute (0-59): " minute
        add_cron_job "$minute $hour * * $day"
        echo -e "${GREEN}✅ Weekly backup scheduled for day $day at $hour:$minute${NC}"
        ;;
    5)
        echo -e "${YELLOW}Cron expression format: minute hour day month day-of-week${NC}"
        echo "Examples:"
        echo "  0 2 * * *     - Daily at 2:00 AM"
        echo "  0 */6 * * *   - Every 6 hours"
        echo "  0 2 * * 1,5   - Mondays and Fridays at 2:00 AM"
        read -p "Enter cron expression: " cron_expr
        add_cron_job "$cron_expr"
        echo -e "${GREEN}✅ Custom backup schedule added${NC}"
        ;;
    6)
        if crontab -l 2>/dev/null | grep -q "$BACKUP_SCRIPT"; then
            crontab -l 2>/dev/null | grep -v "$BACKUP_SCRIPT" | crontab -
            echo -e "${GREEN}✅ Backup cron job removed${NC}"
        else
            echo -e "${YELLOW}No existing backup cron job found${NC}"
        fi
        exit 0
        ;;
    *)
        echo -e "${RED}❌ Invalid choice${NC}"
        exit 1
        ;;
esac

# Create log rotation configuration
echo -e "\n${YELLOW}📋 Setting up log rotation...${NC}"
cat > "$PROJECT_ROOT/scripts/logrotate-backup.conf" << EOF
$CRON_LOG_FILE {
    weekly
    rotate 4
    compress
    missingok
    notifempty
    create 0644 $(whoami) $(id -gn)
}
EOF

echo -e "${GREEN}✅ Log rotation configured${NC}"

# Show current crontab
echo -e "\n${BLUE}📋 Current backup cron jobs:${NC}"
crontab -l 2>/dev/null | grep "$BACKUP_SCRIPT" || echo "   No backup jobs found"

# Instructions
echo -e "\n${GREEN}📌 Setup complete!${NC}"
echo -e "\n${YELLOW}Next steps:${NC}"
echo "   1. Ensure your .env file contains DATABASE_URL"
echo "   2. Test the backup manually: $BACKUP_SCRIPT"
echo "   3. Check logs at: $CRON_LOG_FILE"
echo "   4. View all cron jobs: crontab -l"
echo "   5. Edit cron jobs manually: crontab -e"
echo
echo -e "${YELLOW}To setup log rotation (optional):${NC}"
echo "   sudo cp $PROJECT_ROOT/scripts/logrotate-backup.conf /etc/logrotate.d/cultural-sound-lab-backup"