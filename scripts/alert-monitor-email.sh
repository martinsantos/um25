#!/bin/bash

################################################################################
# Alert Monitor with Email Notifications
#
# Purpose: Monitor system health and send grouped email alerts
# - Checks every 10 minutes
# - Sends consolidated email every 6 hours OR when CRITICAL
# - Groups multiple issues into single email
#
# Installation:
#   chmod +x /root/scripts/alert-monitor-email.sh
#
# Cron (every 10 minutes):
#   */10 * * * * /root/scripts/alert-monitor-email.sh
#
# Email Configuration:
#   Set ALERT_EMAIL variable below to destination address
################################################################################

set -e

# Configuration
ALERT_EMAIL="${ALERT_EMAIL:-devops@ultimamilla.com.ar}"
ALERT_LOG="/var/log/alert-monitor.log"
ALERT_STATE="/tmp/alert-state.json"
ALERT_THRESHOLD_MEMORY="85"  # % - Send immediately if > this
ALERT_CONSOLIDATE_HOURS="6"  # Send consolidated email every 6 hours
API_URL="http://localhost:4321/api/status.json"
SMTP_CONFIG="/root/.smtp"

# Colors for logging
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

################################################################################
# Helper Functions
################################################################################

log_alert() {
  local level=$1
  local message=$2
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  echo "[$timestamp] [$level] $message" >> "$ALERT_LOG"
  echo -e "${!level}[$level]${NC} $message"
}

# Get current system status
get_system_status() {
  timeout 10 curl -s "$API_URL" 2>/dev/null || echo '{"error": "API timeout"}'
}

# Parse health status from API response
parse_health() {
  local status_json="$1"
  echo "$status_json" | grep -o '"health":"[^"]*"' | cut -d'"' -f4 || echo "unknown"
}

# Parse memory percentage
parse_memory_percent() {
  local status_json="$1"
  echo "$status_json" | grep -o '"usagePercent":[0-9]*' | cut -d':' -f2 || echo "0"
}

# Parse services status
parse_services() {
  local status_json="$1"
  echo "$status_json" | grep -o '"name":"[^"]*","status":"[^"]*"' || echo ""
}

# Send email alert
send_email_alert() {
  local subject="$1"
  local body="$2"

  # Use mail command if available
  if command -v mail &> /dev/null; then
    echo "$body" | mail -s "$subject" "$ALERT_EMAIL"
    log_alert "GREEN" "Email sent to $ALERT_EMAIL"
    return 0
  fi

  # Fallback: log if mail not available
  log_alert "YELLOW" "mail command not available - alert logged only"
  echo "$body" >> "$ALERT_LOG"
  return 1
}

# Build HTML email body
build_email_body() {
  local status_json="$1"
  local alerts_html="$2"

  local timestamp=$(date '+%Y-%m-%d %H:%M:%S %Z')
  local memory=$(echo "$status_json" | grep -o '"usagePercent":[0-9]*' | cut -d':' -f2)
  local health=$(parse_health "$status_json")

  cat << EOF
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; color: #333; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background: #1a1a1a; color: #fff; padding: 20px; }
    .alert-critical { background: #fee; border-left: 4px solid #f44; padding: 15px; margin: 10px 0; }
    .alert-warning { background: #ffe; border-left: 4px solid #fa0; padding: 15px; margin: 10px 0; }
    .metrics { background: #f9f9f9; padding: 15px; margin: 15px 0; border-radius: 5px; }
    .metric-row { display: flex; justify-content: space-between; padding: 8px 0; }
    .metric-label { font-weight: bold; }
    .footer { color: #999; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>🚨 ULTIMA MILLA System Alert</h2>
      <p>Alert Report - $timestamp</p>
    </div>

    <div class="metrics">
      <div class="metric-row">
        <span class="metric-label">Health Status:</span>
        <span>${health^^}</span>
      </div>
      <div class="metric-row">
        <span class="metric-label">Memory Usage:</span>
        <span>$memory%</span>
      </div>
    </div>

    $alerts_html

    <div class="footer">
      <p>Automated alert from https://ultimamilla.com.ar/status</p>
      <p>Report generated at $timestamp</p>
    </div>
  </div>
</body>
</html>
EOF
}

################################################################################
# Main Monitoring Logic
################################################################################

# Initialize state file if not exists
if [ ! -f "$ALERT_STATE" ]; then
  echo '{"last_email": 0, "last_critical": 0, "alert_count": 0}' > "$ALERT_STATE"
fi

log_alert "GREEN" "Starting alert monitor check"

# Get current status
STATUS_JSON=$(get_system_status)

if echo "$STATUS_JSON" | grep -q "error"; then
  log_alert "RED" "API Error: Cannot fetch system status"
  # Still send alert even on API failure
  send_email_alert \
    "URGENTE: API Error - Cannot fetch system status" \
    "El endpoint /api/status.json no está respondiendo.\nTiempo: $(date)\n\nVerifica si el servidor Astro está corriendo:\npm2 list"
  exit 1
fi

# Extract metrics
HEALTH=$(parse_health "$STATUS_JSON")
MEMORY=$(parse_memory_percent "$STATUS_JSON")
SERVICES=$(parse_services "$STATUS_JSON")

# Check for critical issues
CRITICAL_DETECTED=0
ALERTS_HTML=""

# Critical: Memory too high
if [ "$MEMORY" -gt "$ALERT_THRESHOLD_MEMORY" ]; then
  CRITICAL_DETECTED=1
  ALERTS_HTML="$ALERTS_HTML<div class='alert-critical'><strong>🔴 CRITICAL: Memory Usage $MEMORY%</strong><p>Memory is above $ALERT_THRESHOLD_MEMORY% threshold. System performance may be degraded.</p></div>"
  log_alert "RED" "CRITICAL: Memory usage is $MEMORY%"
fi

# Critical: Service offline
if echo "$SERVICES" | grep -q '"status":"offline"'; then
  CRITICAL_DETECTED=1
  ALERTS_HTML="$ALERTS_HTML<div class='alert-critical'><strong>🔴 CRITICAL: Service Offline</strong><p>One or more services are offline. Check pm2 list immediately.</p></div>"
  log_alert "RED" "CRITICAL: Service offline detected"
fi

# Warning: Health is degraded
if [ "$HEALTH" = "degraded" ]; then
  ALERTS_HTML="$ALERTS_HTML<div class='alert-warning'><strong>⚠️ WARNING: System Degraded</strong><p>System health is degraded. Review recent logs.</p></div>"
  log_alert "YELLOW" "WARNING: System health is degraded"
fi

# Read last alert time
LAST_EMAIL=$(jq -r '.last_email // 0' "$ALERT_STATE" 2>/dev/null || echo 0)
CURRENT_TIME=$(date +%s)
TIME_SINCE_EMAIL=$((CURRENT_TIME - LAST_EMAIL))
CONSOLIDATE_SECONDS=$((ALERT_CONSOLIDATE_HOURS * 3600))

# Decide whether to send email
SEND_EMAIL=0

if [ "$CRITICAL_DETECTED" -eq 1 ]; then
  log_alert "RED" "Critical issue detected - sending immediate alert"
  SEND_EMAIL=1
elif [ -z "$ALERTS_HTML" ]; then
  log_alert "GREEN" "No alerts - system healthy"
  SEND_EMAIL=0
elif [ "$TIME_SINCE_EMAIL" -ge "$CONSOLIDATE_SECONDS" ]; then
  log_alert "YELLOW" "Consolidation period elapsed - sending grouped alert"
  SEND_EMAIL=1
else
  REMAINING=$((CONSOLIDATE_SECONDS - TIME_SINCE_EMAIL))
  REMAINING_HOURS=$((REMAINING / 3600))
  log_alert "YELLOW" "Alert buffered - will send in ~${REMAINING_HOURS} hours or when critical"
  SEND_EMAIL=0
fi

# Send email if needed
if [ "$SEND_EMAIL" -eq 1 ] && [ ! -z "$ALERTS_HTML" ]; then
  EMAIL_BODY=$(build_email_body "$STATUS_JSON" "$ALERTS_HTML")
  SUBJECT="Alert: ULTIMA MILLA System Status $(date '+%Y-%m-%d')"

  if [ "$CRITICAL_DETECTED" -eq 1 ]; then
    SUBJECT="🚨 URGENTE: $SUBJECT"
  fi

  send_email_alert "$SUBJECT" "$EMAIL_BODY"

  # Update state
  echo "{\"last_email\": $CURRENT_TIME, \"last_critical\": $CURRENT_TIME, \"alert_count\": 0}" > "$ALERT_STATE"
fi

log_alert "GREEN" "Alert monitor check completed"

################################################################################
# Rotation: Keep alert logs tidy
################################################################################

# Rotate logs if > 50MB
if [ -f "$ALERT_LOG" ] && [ $(stat -f%z "$ALERT_LOG" 2>/dev/null || stat -c%s "$ALERT_LOG") -gt 52428800 ]; then
  mv "$ALERT_LOG" "$ALERT_LOG.$(date +%Y%m%d)"
  log_alert "GREEN" "Alert log rotated"
fi

exit 0
