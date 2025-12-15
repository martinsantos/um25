#!/bin/bash

# Test status page functionality

echo "╔════════════════════════════════════════════╗"
echo "║     STATUS PAGE DIAGNOSTIC TEST          ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Test 1: API endpoint
echo "Test 1: Testing API endpoint /api/status.json"
echo "→ curl http://localhost:4321/api/status.json"
API_RESPONSE=$(curl -s -w "\n%{http_code}" http://localhost:4321/api/status.json 2>&1)
HTTP_CODE=$(echo "$API_RESPONSE" | tail -1)
API_BODY=$(echo "$API_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ HTTP $HTTP_CODE - Success"
  echo "   Memory: $(echo "$API_BODY" | grep -o '"usagePercent":[0-9]*' | cut -d':' -f2)%"
  echo "   Health: $(echo "$API_BODY" | grep -o '"health":"[^"]*"' | cut -d'"' -f4)"
else
  echo "❌ HTTP $HTTP_CODE - Error"
fi
echo ""

# Test 2: Status page
echo "Test 2: Testing Status page /status"
echo "→ curl http://localhost:4321/status"
PAGE_RESPONSE=$(curl -s -w "\n%{http_code}" http://localhost:4321/status 2>&1)
PAGE_HTTP=$(echo "$PAGE_RESPONSE" | tail -1)
PAGE_BODY=$(echo "$PAGE_RESPONSE" | sed '$d')

if [ "$PAGE_HTTP" = "200" ]; then
  echo "✅ HTTP $PAGE_HTTP - Success"
  if echo "$PAGE_BODY" | grep -q "System Status"; then
    echo "   ✅ Page title found"
  fi
  if echo "$PAGE_BODY" | grep -q "Memory"; then
    echo "   ✅ Memory section found"
  fi
  SIZE=$(echo "$PAGE_BODY" | wc -c)
  echo "   📄 Response size: $SIZE bytes"
else
  echo "❌ HTTP $PAGE_HTTP - Error"
fi
echo ""

# Test 3: HTTPS via Nginx
echo "Test 3: Testing via Nginx HTTPS"
echo "→ curl -s https://ultimamilla.com.ar/status (first 200 chars)"
HTTPS_RESPONSE=$(timeout 10 curl -s -w "\n%{http_code}" https://ultimamilla.com.ar/status 2>&1)
HTTPS_CODE=$(echo "$HTTPS_RESPONSE" | tail -1)
HTTPS_BODY=$(echo "$HTTPS_RESPONSE" | sed '$d')

if [ "$HTTPS_CODE" = "200" ]; then
  echo "✅ HTTP $HTTPS_CODE - Success"
  SIZE=$(echo "$HTTPS_BODY" | wc -c)
  echo "   📄 Response size: $SIZE bytes"
  if [ "$SIZE" -lt 100 ]; then
    echo "   ⚠️  Response is very small - might be empty/error"
  fi
else
  echo "❌ HTTP $HTTPS_CODE - Error"
  echo "   Response size: $(echo "$HTTPS_BODY" | wc -c) bytes"
fi
echo ""

# Test 4: Process status
echo "Test 4: Checking Astro process"
pm2 list | grep astro-ultimamilla
echo ""

# Test 5: Port listening
echo "Test 5: Port listening check"
echo "→ netstat/ss for port 4321"
netstat -tlnp 2>/dev/null | grep 4321 || ss -tlnp 2>/dev/null | grep 4321
echo ""

echo "╔════════════════════════════════════════════╗"
echo "║         DIAGNOSTIC COMPLETE               ║"
echo "╚════════════════════════════════════════════╝"
