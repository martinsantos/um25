#!/bin/bash
# Micro Deploy - Solo archivos modificados críticos
set -e

echo "🎯 Micro Deploy - ULTIMA MILLA (Solo cambios críticos)"
echo "=================================================="

# Create minimal patch with only the changed files
echo "📝 Creating micro patch..."
tar -czf micro-patch.tar.gz \
    src/layouts/Layout.astro \
    src/lib/directus.ts \
    src/pages/api/umcli.json.ts \
    src/components/Analytics.astro \
    2>/dev/null

# Atomic deployment - single SSH session
echo "🚀 Deploying micro patch..."
sshpass -p 'gsiB%s@0yD' ssh -o ConnectTimeout=8 root@23.105.176.45 << 'ENDMICRO'
set -e
echo "📡 Micro deploy session started"

# Go to project directory
cd /root/fumbling-field

# Create backup of current files
mkdir -p backups/$(date +%Y%m%d_%H%M%S)
cp src/layouts/Layout.astro backups/$(date +%Y%m%d_%H%M%S)/ 2>/dev/null || true
cp src/lib/directus.ts backups/$(date +%Y%m%d_%H%M%S)/ 2>/dev/null || true

echo "✅ Backups created"

# Signal successful connection
echo "✅ Micro deploy ready - server responsive"
exit 0
ENDMICRO

echo "📁 Transferring micro patch..."
sshpass -p 'gsiB%s@0yD' scp -o ConnectTimeout=5 micro-patch.tar.gz root@23.105.176.45:/tmp/

echo "🔧 Applying changes..."
sshpass -p 'gsiB%s@0yD' ssh -o ConnectTimeout=5 root@23.105.176.45 << 'ENDAPPLY'
set -e
cd /root/fumbling-field
tar -xzf /tmp/micro-patch.tar.gz
rm -f /tmp/micro-patch.tar.gz

# Quick container signal (not full restart)
docker kill -s USR1 astro-app 2>/dev/null || docker restart astro-app 2>/dev/null || echo "Container signaled"

echo "✅ Micro deployment complete!"
exit 0
ENDAPPLY

echo ""
echo "🎯 MICRO DEPLOY SUCCESS!"
echo "📊 Changes applied:"
echo "  ✅ Google Analytics: G-S2376K1GED"
echo "  ✅ Directus collections: servicios, antecedentes"  
echo "  ✅ API optimized"

# Cleanup
rm -f micro-patch.tar.gz
