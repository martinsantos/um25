#!/bin/bash
set -e

echo "🔧 UM CLI Quick Deploy Script v1.0"
echo "=================================="

# Build local
echo "📦 Building project..."
timeout 120 npm run build || echo "Build timeout, continuing..."

# Create tar
echo "📦 Creating deployment package..."
tar -czf um-deploy.tar.gz dist/ --exclude=node_modules

# Quick deploy
echo "🚀 Deploying to production..."
sshpass -p 'gsiB%s@0yD' scp -o ConnectTimeout=10 um-deploy.tar.gz root@23.105.176.45:/root/

echo "📁 Extracting on server..."
sshpass -p 'gsiB%s@0yD' ssh -o ConnectTimeout=10 root@23.105.176.45 '
cd /root/fumbling-field
tar -xzf /root/um-deploy.tar.gz
docker-compose restart astro-app || docker restart astro-app
echo "✅ Deploy complete"
'

echo "✅ Quick deploy finished!"
