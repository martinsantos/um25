#!/bin/sh
# Check if Directus is responding
if wget -qO- http://localhost:8055/server/ping > /dev/null 2>&1; then
    exit 0
fi

# If not, try a simple port check as fallback
if nc -z localhost 8055; then
    exit 0
fi

exit 1
