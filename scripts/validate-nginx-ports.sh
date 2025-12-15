#!/bin/bash

###############################################################################
# NGINX PORT VALIDATION SCRIPT
#
# Purpose: Verify all Nginx upstream servers are listening on correct ports
# Usage: ./scripts/validate-nginx-ports.sh
#
# Checks:
# - Astro (ultimamilla.com.ar) on port 4321
# - SGI (sgi.ultimamilla.com.ar) on port 3000
# - Directus (admin.ultimamilla.com.ar) on port 8055
#
# Exit codes:
#   0 = All ports correct
#   1 = One or more ports incorrect
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     NGINX PORT VALIDATION - $(date +%Y-%m-%d\ %H:%M:%S)     ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Function to check port
check_port() {
    local service=$1
    local expected_port=$2
    local nginx_config=$3
    local hostname=$4

    echo -n "Checking $service... "

    # Check if port is in Nginx config
    if grep -q "$expected_port" "$nginx_config"; then
        echo -e "${GREEN}✓${NC} Nginx config has port $expected_port"
    else
        echo -e "${RED}✗${NC} Nginx config MISSING port $expected_port"

        # Show what port is actually configured
        PORT_FOUND=$(grep -o ":[0-9]*" "$nginx_config" | head -1 || echo "NOT FOUND")
        echo "   Found: $PORT_FOUND"

        ((ERRORS++))
        return 1
    fi

    # Check if service is listening on that port
    if netstat -tlnp 2>/dev/null | grep -q ":$expected_port " || \
       ss -tlnp 2>/dev/null | grep -q ":$expected_port "; then
        echo -n "           Service listening: "
        echo -e "${GREEN}✓${NC}"
    else
        echo -n "           Service listening: "
        echo -e "${YELLOW}?${NC} (may not be running)"
        ((WARNINGS++))
    fi

    echo ""
}

# Check Astro (ultimamilla.com.ar)
echo "📍 Frontend (www.ultimamilla.com.ar)"
echo "   Expected: Astro on port 4321"
check_port "Astro" "4321" "/etc/nginx/nginx.conf"

# Check SGI (sgi.ultimamilla.com.ar)
echo "📍 SGI System (sgi.ultimamilla.com.ar)"
echo "   Expected: SGI on port 3000"
if [ -f "/etc/nginx/sites-available/sgi.ultimamilla.com.ar" ]; then
    check_port "SGI" "3000" "/etc/nginx/sites-available/sgi.ultimamilla.com.ar"
else
    echo -e "${RED}✗${NC} SGI Nginx config not found!"
    ((ERRORS++))
    echo ""
fi

# Check Directus (admin.ultimamilla.com.ar)
echo "📍 Directus Admin (admin.ultimamilla.com.ar)"
echo "   Expected: Directus on port 8055 (Docker)"
check_port "Directus" "8055" "/etc/nginx/nginx.conf"

# Additional checks
echo "════════════════════════════════════════════════════════════"
echo "Additional Checks:"
echo ""

# Check MySQL/MariaDB
echo -n "MySQL/MariaDB (:3306): "
if netstat -tlnp 2>/dev/null | grep -q ":3306 " || \
   ss -tlnp 2>/dev/null | grep -q ":3306 "; then
    echo -e "${GREEN}✓${NC} Listening"
else
    echo -e "${YELLOW}?${NC} Not responding"
fi

# Check PostgreSQL (Docker)
echo -n "PostgreSQL (:5432): "
if netstat -tlnp 2>/dev/null | grep -q ":5432 " || \
   ss -tlnp 2>/dev/null | grep -q ":5432 "; then
    echo -e "${GREEN}✓${NC} Listening"
else
    echo -e "${YELLOW}?${NC} Not responding (Docker may not be running)"
fi

# Check Nginx itself
echo -n "Nginx (:80/:443): "
if netstat -tlnp 2>/dev/null | grep -q ":80 " || \
   ss -tlnp 2>/dev/null | grep -q ":80 "; then
    echo -e "${GREEN}✓${NC} Listening"
else
    echo -e "${RED}✗${NC} NOT LISTENING!"
    ((ERRORS++))
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo ""

# Summary
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ ALL CHECKS PASSED${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠ $WARNINGS warnings found${NC}"
        exit 0
    fi
    echo ""
    exit 0
else
    echo -e "${RED}✗ $ERRORS errors found - CONFIGURATION INVALID${NC}"
    echo ""
    echo "🔧 To fix:"
    echo "   1. Review /etc/nginx/sites-available/*.ultimamilla.com.ar"
    echo "   2. Verify upstream port matches service port"
    echo "   3. Run: sudo nginx -t"
    echo "   4. Run: sudo systemctl reload nginx"
    echo ""
    exit 1
fi
