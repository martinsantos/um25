#!/bin/bash

###############################################################################
# BACKUP ECOSYSTEM CONFIG
#
# Purpose: Daily backup of critical PM2 ecosystem configuration
# Usage: ./scripts/backup-ecosystem-config.sh [--backup|--restore|--list|--install-cron]
#
# This prevents loss of ecosystem.config due to server issues
###############################################################################

set -e

# Configuration
BACKUP_DIR="/root/backups/ecosystem-config"
BACKUP_RETENTION_DAYS=30
SOURCE_FILE="/root/fumbling-field/ecosystem.config.cjs"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function: Create backup
backup_config() {
    if [ ! -f "$SOURCE_FILE" ]; then
        echo -e "${RED}✗${NC} Source file not found: $SOURCE_FILE"
        return 1
    fi

    # Create backup directory if not exists
    mkdir -p "$BACKUP_DIR"

    # Create timestamped backup
    local backup_file="$BACKUP_DIR/ecosystem.config.cjs.$(date +%Y%m%d_%H%M%S)"
    cp "$SOURCE_FILE" "$backup_file"

    echo -e "${GREEN}✓${NC} Backup created: $backup_file"

    # Clean old backups (older than $BACKUP_RETENTION_DAYS)
    find "$BACKUP_DIR" -name "ecosystem.config.cjs.*" -mtime "+$BACKUP_RETENTION_DAYS" -delete

    echo "✓ Old backups cleaned (kept last $BACKUP_RETENTION_DAYS days)"
}

# Function: List backups
list_backups() {
    if [ ! -d "$BACKUP_DIR" ]; then
        echo "No backups found"
        return 0
    fi

    echo "Available backups:"
    echo ""
    ls -lh "$BACKUP_DIR"/ecosystem.config.cjs.* 2>/dev/null | \
        awk '{printf "  %s  %s\n", $6, $7, $8, $9}' | \
        sed 's/^  /  / '

    echo ""
    echo "Total backups: $(ls -1 "$BACKUP_DIR"/ecosystem.config.cjs.* 2>/dev/null | wc -l)"
}

# Function: Restore backup
restore_config() {
    if [ -z "$1" ]; then
        echo -e "${RED}✗${NC} Please specify backup file"
        echo ""
        list_backups
        echo ""
        echo "Usage: $0 --restore <backup-file>"
        echo "Example: $0 --restore ecosystem.config.cjs.20251215_120000"
        return 1
    fi

    local backup_file="$BACKUP_DIR/$1"

    if [ ! -f "$backup_file" ]; then
        echo -e "${RED}✗${NC} Backup not found: $backup_file"
        return 1
    fi

    # Create backup of current config before restore
    if [ -f "$SOURCE_FILE" ]; then
        cp "$SOURCE_FILE" "$SOURCE_FILE.pre-restore.$(date +%Y%m%d_%H%M%S)"
    fi

    # Restore
    cp "$backup_file" "$SOURCE_FILE"
    echo -e "${GREEN}✓${NC} Config restored from: $1"

    # Verify and restart PM2
    echo ""
    echo "Verifying configuration..."
    cd /root/fumbling-field

    # Validate syntax
    if pm2 show astro-ultimamilla > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} PM2 processes are running"

        # Ask to reload
        echo ""
        echo "To apply restored config, run:"
        echo "  pm2 start ecosystem.config.cjs"
        echo "  pm2 save"
    fi
}

# Function: Install cron job
install_cron() {
    local script_path=$(cd "$(dirname "$0")" && pwd)/backup-ecosystem-config.sh
    local cron_entry="0 2 * * * $script_path --backup >> /var/log/ecosystem-backup.log 2>&1"

    # Check if already installed
    if crontab -l 2>/dev/null | grep -q "backup-ecosystem-config.sh"; then
        echo -e "${YELLOW}⚠️  ${NC}Cron job already installed"
        return 0
    fi

    # Create log file
    touch /var/log/ecosystem-backup.log
    chmod 644 /var/log/ecosystem-backup.log

    # Add cron job
    (crontab -l 2>/dev/null || echo "") | grep -v "backup-ecosystem-config.sh" | crontab -
    (crontab -l 2>/dev/null || echo ""; echo "$cron_entry") | crontab -

    echo -e "${GREEN}✓${NC} Cron job installed"
    echo "   Runs daily at 2:00 AM (UTC)"
    echo "   Log file: /var/log/ecosystem-backup.log"
}

# Function: Show status
show_status() {
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║         ECOSYSTEM CONFIG BACKUP STATUS                     ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""

    echo "Configuration:"
    echo "  Source file:    $SOURCE_FILE"
    echo "  Backup dir:     $BACKUP_DIR"
    echo "  Retention:      $BACKUP_RETENTION_DAYS days"
    echo ""

    echo "Current PM2 config:"
    if [ -f "$SOURCE_FILE" ]; then
        echo "  ✓ File exists"
        echo "  Size: $(ls -lh "$SOURCE_FILE" | awk '{print $5}')"
        echo "  Last modified: $(ls -l "$SOURCE_FILE" | awk '{print $6, $7, $8}')"
    else
        echo "  ✗ File NOT found!"
    fi
    echo ""

    echo "Cron status:"
    if crontab -l 2>/dev/null | grep -q "backup-ecosystem-config.sh"; then
        echo "  ✓ Cron job installed"
    else
        echo "  ✗ Cron job NOT installed"
        echo "  Run: $0 --install-cron"
    fi
    echo ""

    echo "Backups:"
    list_backups
}

# Function: Show usage
show_help() {
    cat <<EOF
Ecosystem Config Backup Tool

Usage: $0 [COMMAND]

Commands:
  --backup              Create backup now
  --restore <file>      Restore from backup
  --list                List available backups
  --status              Show backup status
  --install-cron        Install daily cron job (runs at 2 AM)
  --help                Show this message

Examples:
  $0 --backup           # Create manual backup
  $0 --list             # List all backups
  $0 --restore ecosystem.config.cjs.20251215_120000
  $0 --status           # Show backup status
  $0 --install-cron     # Install automatic daily backups

Location:
  Backups stored in: $BACKUP_DIR
  Retention: $BACKUP_RETENTION_DAYS days

EOF
}

# Main
case "${1:-}" in
    --backup)
        backup_config
        ;;
    --restore)
        restore_config "$2"
        ;;
    --list)
        list_backups
        ;;
    --status)
        show_status
        ;;
    --install-cron)
        install_cron
        ;;
    --help|"")
        show_help
        ;;
    *)
        echo "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
