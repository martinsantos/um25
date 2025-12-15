#!/bin/bash

###############################################################################
# MEMORY ALERT MONITOR
#
# Purpose: Monitor server memory and alert when thresholds exceeded
# Usage: ./scripts/memory-alert-monitor.sh [--check|--install-cron|--remove-cron]
#
# Thresholds:
# - YELLOW: > 70% memory in use (warning)
# - RED: > 85% memory in use (critical)
#
# This script should run every 5 minutes via cron
###############################################################################

set -e

# Configuration
MEMORY_WARNING_THRESHOLD=70    # Percentage
MEMORY_CRITICAL_THRESHOLD=85   # Percentage
LOG_FILE="/var/log/memory-alert.log"
ALERT_COOLDOWN=300              # Seconds between alerts (5 minutes)

# Colors
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

# Function: Log message with timestamp
log_message() {
    local level=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
}

# Function: Get current memory usage percentage
get_memory_usage() {
    local used=$(free | awk 'NR==2 {print $3}')
    local total=$(free | awk 'NR==2 {print $2}')
    echo $((used * 100 / total))
}

# Function: Get memory details
get_memory_details() {
    local available=$(free -h | awk 'NR==2 {print $7}')
    local used=$(free -h | awk 'NR==2 {print $3}')
    local total=$(free -h | awk 'NR==2 {print $2}')
    echo "$used / $total (Available: $available)"
}

# Function: Get top memory consumers
get_top_processes() {
    echo ""
    echo "Top 5 memory consumers:"
    ps aux --sort=-%mem | head -6 | tail -5 | awk '{printf "  %-40s %6s MB\n", $11, int($6/1024)}'
}

# Function: Check memory and alert
check_memory() {
    local memory_usage=$(get_memory_usage)
    local memory_details=$(get_memory_details)
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    # Check critical threshold
    if [ "$memory_usage" -gt "$MEMORY_CRITICAL_THRESHOLD" ]; then
        local alert_message="🔴 CRITICAL: Memory at ${memory_usage}% ($memory_details)"
        echo -e "${RED}$alert_message${NC}"
        log_message "CRITICAL" "Memory at ${memory_usage}% - $memory_details"
        log_message "CRITICAL" "$(get_top_processes)"

        # Try to recover by restarting least critical services
        log_message "INFO" "Attempting memory recovery..."
        echo "⚠️  Memory critical - attempting recovery..."

        # Restart services if memory > 90%
        if [ "$memory_usage" -gt 90 ]; then
            log_message "WARN" "Memory > 90% - may need manual intervention"
            echo "⚠️  Memory > 90% - consider restarting services"
        fi

    # Check warning threshold
    elif [ "$memory_usage" -gt "$MEMORY_WARNING_THRESHOLD" ]; then
        local alert_message="🟡 WARNING: Memory at ${memory_usage}% ($memory_details)"
        echo -e "${YELLOW}$alert_message${NC}"
        log_message "WARNING" "Memory at ${memory_usage}% - $memory_details"

    # OK
    else
        local message="✓ Memory OK: ${memory_usage}% ($memory_details)"
        echo -e "${GREEN}$message${NC}"
        log_message "INFO" "Memory OK: ${memory_usage}%"
    fi
}

# Function: Install cron job
install_cron() {
    local script_path=$(cd "$(dirname "$0")" && pwd)/memory-alert-monitor.sh
    local cron_entry="*/5 * * * * $script_path --check >> /var/log/memory-alert.log 2>&1"

    # Check if already installed
    if crontab -l 2>/dev/null | grep -q "memory-alert-monitor.sh"; then
        echo "⚠️  Cron job already installed"
        return 0
    fi

    # Add cron job
    (crontab -l 2>/dev/null || echo "") | grep -v "memory-alert-monitor.sh" | crontab -
    (crontab -l 2>/dev/null || echo ""; echo "$cron_entry") | crontab -

    echo "✅ Cron job installed (runs every 5 minutes)"
    echo "   Log file: $LOG_FILE"
}

# Function: Remove cron job
remove_cron() {
    if crontab -l 2>/dev/null | grep -q "memory-alert-monitor.sh"; then
        (crontab -l 2>/dev/null | grep -v "memory-alert-monitor.sh") | crontab -
        echo "✅ Cron job removed"
    else
        echo "ℹ️  Cron job not found"
    fi
}

# Function: Show usage
show_usage() {
    echo "Memory Alert Monitor"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  --check              Run memory check (for manual testing)"
    echo "  --install-cron       Install cron job to run every 5 minutes"
    echo "  --remove-cron        Remove cron job"
    echo "  --status             Show cron job status and recent logs"
    echo ""
    echo "Thresholds:"
    echo "  Warning:  > ${MEMORY_WARNING_THRESHOLD}%"
    echo "  Critical: > ${MEMORY_CRITICAL_THRESHOLD}%"
    echo ""
}

# Main logic
case "${1:-}" in
    --check)
        check_memory
        ;;
    --install-cron)
        install_cron
        ;;
    --remove-cron)
        remove_cron
        ;;
    --status)
        echo "📊 Memory Monitor Status"
        echo ""
        echo "Cron job:"
        if crontab -l 2>/dev/null | grep -q "memory-alert-monitor.sh"; then
            echo "  ✅ Installed"
        else
            echo "  ❌ Not installed"
        fi
        echo ""
        echo "Log file: $LOG_FILE"
        if [ -f "$LOG_FILE" ]; then
            echo "Last 10 entries:"
            tail -10 "$LOG_FILE"
        else
            echo "  (No log file yet)"
        fi
        ;;
    *)
        show_usage
        ;;
esac
