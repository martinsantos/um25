#!/bin/bash
# verify-seo.sh
# Script to verify SEO and Analytics implementation on ultimamilla.com.ar

DOMAIN="https://ultimamilla.com.ar"
RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
NC="\033[0m" # No Color

echo "🔍 Starting SEO & Analytics Verification for $DOMAIN..."
echo "==================================================="

# 1. Check Robots.txt
echo -n "Checking robots.txt... "
ROBOTS=$(curl -s "$DOMAIN/robots.txt")
if [[ $ROBOTS == *"Sitemap: https://ultimamilla.com.ar/sitemap-index.xml"* ]]; then
  echo -e "${GREEN}OK${NC} (Correct Sitemap Index)"
elif [[ $ROBOTS == *"Sitemap: https://ultimamilla.com.ar/sitemap.xml"* ]]; then
  echo -e "${RED}FAIL${NC} (Legacy Sitemap found - Deploy NOT active)"
elif [[ $ROBOTS == *"Sitemap: https://ultimamilla.com/sitemap.xml"* ]]; then
  echo -e "${RED}FAIL${NC} (Incorrect Domain: .com instead of .com.ar)"
else
  echo -e "${YELLOW}WARNING${NC} (Check content manually)"
fi

# 2. Check Sitemaps
echo -n "Checking sitemap-index... "
STATUS=$(curl -o /dev/null -s -w "%{http_code}\n" "$DOMAIN/sitemap-index.xml")
if [[ $STATUS == "200" ]]; then
  echo -e "${GREEN}OK${NC} (200 OK)"
else
  echo -e "${RED}FAIL${NC} (Status: $STATUS)"
fi

# 3. Check Analytics Tag
echo -n "Checking Google Analytics Tag... "
# Note: This checks the live site. If changes are not deployed, this will fail.
CONTENT=$(curl -s "$DOMAIN")
if [[ $CONTENT == *"G-S2376K1GED"* ]]; then
  echo -e "${GREEN}OK${NC} (Tag Found)"
else
  echo -e "${RED}FAIL${NC} (Tag NOT found in homepage source)"
  echo "Observation: Check if changes are deployed."
fi

# 4. Check Meta Descriptions (random check)
echo -n "Checking Meta Description... "
DESC_COUNT=$(echo "$CONTENT" | grep -o '<meta name="description"' | wc -l)
if [[ $DESC_COUNT -gt 0 ]]; then
  echo -e "${GREEN}OK${NC} ($DESC_COUNT found)"
else
  echo -e "${RED}FAIL${NC} (Missing)"
fi

echo "==================================================="
echo "Verification Complete."
