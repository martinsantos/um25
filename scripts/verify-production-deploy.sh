#!/bin/bash

# Production Deployment Verification Script
# Purpose: Verify that mobile-optimized components deployment was successful
# Usage: ./scripts/verify-production-deploy.sh

set -e

echo "🔍 Production Deployment Verification"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASS=0
FAIL=0

# Test function
test_endpoint() {
    local name=$1
    local url=$2
    local expected_code=$3

    echo -n "Testing $name... "

    http_code=$(curl -s -o /dev/null -w "%{http_code}" "$url")

    if [ "$http_code" = "$expected_code" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
        ((PASS++))
    else
        echo -e "${RED}✗ FAIL${NC} (Expected: $expected_code, Got: $http_code)"
        ((FAIL++))
    fi
}

# 1. Main Site Health
echo "📌 MAIN WEBSITE HEALTH"
test_endpoint "www.ultimamilla.com.ar" "https://www.ultimamilla.com.ar" "200"
test_endpoint "Homepage" "https://www.ultimamilla.com.ar/" "200"
test_endpoint "Servicios" "https://www.ultimamilla.com.ar/servicios" "200"
test_endpoint "Antecedentes" "https://www.ultimamilla.com.ar/antecedentes" "200"
test_endpoint "Contacto" "https://www.ultimamilla.com.ar/contacto" "200"
echo ""

# 2. Critical Services
echo "📌 CRITICAL SERVICES (Must NOT be affected)"
test_endpoint "www.sgi.ultimamilla.com.ar" "https://www.sgi.ultimamilla.com.ar" "200"
test_endpoint "Directus Admin" "https://admin.ultimamilla.com.ar" "200"
echo ""

# 3. SEO Health
echo "📌 SEO HEALTH"
test_endpoint "robots.txt" "https://www.ultimamilla.com.ar/robots.txt" "200"
test_endpoint "Sitemap Index" "https://www.ultimamilla.com.ar/sitemap-index.xml" "200"
echo ""

# 4. Process Health (local only)
if command -v pm2 &> /dev/null; then
    echo "📌 PROCESS HEALTH"
    echo -n "PM2 Process Status... "
    if pm2 list | grep -q "astro-ultimamilla"; then
        if pm2 list | grep "astro-ultimamilla" | grep -q "online"; then
            echo -e "${GREEN}✓ PASS${NC} (Online)"
            ((PASS++))
        else
            echo -e "${RED}✗ FAIL${NC} (Not online)"
            ((FAIL++))
        fi
    else
        echo -e "${RED}✗ FAIL${NC} (Process not found)"
        ((FAIL++))
    fi
    echo ""
fi

# 5. Memory Health (local only)
if command -v free &> /dev/null; then
    echo "📌 SERVER HEALTH"
    memory_usage=$(free | grep Mem | awk '{printf("%.0f", $3/$2 * 100)}')
    echo -n "Memory Usage... "
    if [ "$memory_usage" -lt 85 ]; then
        echo -e "${GREEN}✓ PASS${NC} ($memory_usage%)"
        ((PASS++))
    else
        echo -e "${YELLOW}⚠ WARNING${NC} ($memory_usage% - High)"
        ((FAIL++))
    fi
    echo ""
fi

# 6. Git Status (local only)
if [ -d ".git" ]; then
    echo "📌 GIT STATUS"
    echo -n "Latest Commit... "
    commit=$(git log --oneline -1 | grep "mobile-optimized")
    if [ ! -z "$commit" ]; then
        echo -e "${GREEN}✓ PASS${NC} (Mobile components deployed)"
        ((PASS++))
    else
        echo -e "${YELLOW}⚠ INFO${NC} (Commit not found, but may be okay)"
    fi
    echo ""
fi

# Summary
echo "======================================"
echo "SUMMARY"
echo "======================================"
echo -e "Passed: ${GREEN}$PASS${NC}"
echo -e "Failed: ${RED}$FAIL${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✓ ALL CHECKS PASSED${NC}"
    echo "Production deployment successful!"
    exit 0
else
    echo -e "${RED}✗ SOME CHECKS FAILED${NC}"
    echo "Please review the failures above"
    exit 1
fi
