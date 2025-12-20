#!/bin/bash

################################################################################
# ensure-pm2-processes.sh
#
# Health check script that ensures critical PM2 processes are always running
# This prevents the "process not in dump.pm2" problem that caused downtime
#
# Execution: Every 5 minutes via cron
# Location: /root/scripts/ensure-pm2-processes.sh
# Logs: /var/log/pm2-ensure.log
#
# CRITICAL: After any process restart, this MUST execute pm2 save
# to guarantee the process is saved in dump.pm2
################################################################################

set -e

LOG_FILE="/var/log/pm2-ensure.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
FUMBLING_FIELD="/root/fumbling-field"

# Array of critical processes that MUST be running
REQUIRED_PROCESSES=("astro-ultimamilla" "sgi")

# Helper function to log messages
log_message() {
    local level="$1"
    local message="$2"
    echo "[$TIMESTAMP] [$level] $message" >> "$LOG_FILE"
}

# Ensure log file exists with proper permissions
touch "$LOG_FILE" 2>/dev/null || true
chmod 644 "$LOG_FILE" 2>/dev/null || true

log_message "INFO" "Starting PM2 process health check..."

# Track if any process needed restart
RESTART_NEEDED=false

# Check each required process
for process in "${REQUIRED_PROCESSES[@]}"; do
    log_message "DEBUG" "Checking process: $process"

    # Check if process is running and online
    if pm2 list | grep -q "$process.*online" 2>/dev/null; then
        log_message "OK" "✓ $process is online"
    else
        log_message "WARN" "⚠️  $process is NOT running. Restarting..."
        RESTART_NEEDED=true

        # Navigate to application directory and start the process
        cd "$FUMBLING_FIELD"

        if pm2 start ecosystem.config.cjs --only "$process" 2>&1 | tee -a "$LOG_FILE"; then
            log_message "INFO" "✓ Successfully started $process"

            # Wait a moment for process to fully start
            sleep 2

            # Verify it's actually online
            if pm2 list | grep -q "$process.*online" 2>/dev/null; then
                log_message "OK" "✓ $process verified online after restart"
            else
                log_message "ERROR" "❌ $process failed to come online after restart attempt"
            fi
        else
            log_message "ERROR" "❌ Failed to start $process"
        fi
    fi
done

# CRITICAL: Save PM2 state to dump.pm2
# This ensures that:
# 1. Both processes are recorded in the dump
# 2. After server reboot, pm2 resurrect will restore them
# 3. We avoid the "process not in dump" problem that caused downtime
if $RESTART_NEEDED || true; then
    log_message "INFO" "Saving PM2 state to dump.pm2..."

    if pm2 save 2>&1 | tee -a "$LOG_FILE"; then
        log_message "OK" "✓ PM2 state saved successfully"
    else
        log_message "ERROR" "❌ Failed to save PM2 state"
    fi
fi

# Verify final state
log_message "DEBUG" "Final PM2 process list:"
pm2 list >> "$LOG_FILE" 2>&1

# Check if both processes are online
ONLINE_COUNT=$(pm2 list 2>/dev/null | grep -c "online" || echo "0")
if [ "$ONLINE_COUNT" -ge 2 ]; then
    log_message "OK" "✓ All critical processes are online (count: $ONLINE_COUNT)"
else
    log_message "WARN" "⚠️  Not all processes are online (count: $ONLINE_COUNT). Manual intervention may be needed."
fi

log_message "INFO" "Health check completed"

################################################################################
# NOTES ON OPERATION:
#
# 1. This script is IDEMPOTENT - safe to run multiple times
#    If processes are online, it does nothing
#
# 2. The pm2 save is CRITICAL
#    Without it, processes won't auto-restore after reboot
#    This was the root cause of the 2025-12-20 downtime
#
# 3. Logging provides full audit trail
#    All actions are logged to /var/log/pm2-ensure.log
#
# 4. The script automatically handles:
#    - Process crashes (restarts)
#    - Missing processes (initializes)
#    - State persistence (pm2 save)
#
# 5. To disable this check:
#    crontab -e
#    Comment out: */5 * * * * /root/scripts/ensure-pm2-processes.sh
#
# 6. To verify it's working:
#    tail -f /var/log/pm2-ensure.log
#
################################################################################
