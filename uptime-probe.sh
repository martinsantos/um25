#!/bin/bash

# UMBot Uptime Probe Script
# This script checks if the website is responding and logs the results

LOG_FILE="/var/log/umbot-uptime.log"
URL="https://ultimamilla.com.ar"
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")

# Check if site is responding
RESPONSE_SIZE=$(curl -fs "$URL" | wc -c)

if [ "$RESPONSE_SIZE" -gt 0 ]; then
    echo "[$TIMESTAMP] OK - Site responding, size: $RESPONSE_SIZE bytes" >> "$LOG_FILE"
    exit 0
else
    echo "[$TIMESTAMP] ERROR - Site not responding or empty response" >> "$LOG_FILE"
    exit 1
fi
