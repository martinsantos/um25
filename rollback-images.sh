#!/bin/bash
# ROLLBACK SCRIPT - Service Images Update
# Created: 2026-01-16
# Use this if deployment fails

set -e

echo "🔄 INICIANDO ROLLBACK DE IMÁGENES DE SERVICIOS"

# 1. Revert Git local
echo "📌 Step 1: Reverting local git..."
git revert HEAD --no-edit
git push origin master

# 2. Remove images from server
echo "📌 Step 2: Removing new images from server..."
sshpass -p 'gsiB%s@0yD' ssh -o StrictHostKeyChecking=no root@23.105.176.45 \
  "rm -f /root/fumbling-field/public/images/services/*fondoblanco.png"

# 3. Pull revert to server
echo "📌 Step 3: Pulling revert to server..."
sshpass -p 'gsiB%s@0yD' ssh -o StrictHostKeyChecking=no root@23.105.176.45 \
  "cd /root/fumbling-field && git pull origin master"

# 4. Rebuild
echo "📌 Step 4: Rebuilding..."
sshpass -p 'gsiB%s@0yD' ssh -o StrictHostKeyChecking=no root@23.105.176.45 \
  "cd /root/fumbling-field && npm run build"

# 5. Restart PM2
echo "📌 Step 5: Restarting PM2..."
sshpass -p 'gsiB%s@0yD' ssh -o StrictHostKeyChecking=no root@23.105.176.45 \
  "pm2 restart astro-ultimamilla"

# 6. Verify
echo "📌 Step 6: Verifying..."
sleep 5
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://ultimamilla.com.ar/servicios")
if [ "$STATUS" = "200" ]; then
  echo "✅ ROLLBACK EXITOSO - Sitio funcional (HTTP $STATUS)"
else
  echo "❌ ROLLBACK FALLÓ - HTTP $STATUS"
  echo "⚠️  Ejecutar recuperación manual"
fi

echo "🏁 Rollback completado"
