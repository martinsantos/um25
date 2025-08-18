#!/bin/bash

# ULTIMA MILLA - Manual Deploy Instructions
# Para ejecutar manualmente sin sshpass

echo "🚀 ULTIMA MILLA - Deploy Manual a Producción"
echo "============================================"

echo ""
echo "📋 INSTRUCCIONES DE DEPLOY MANUAL:"
echo ""

echo "1️⃣ Conectar al servidor:"
echo "   ssh root@23.105.176.45"
echo "   Password: gsiB%s@0yD"
echo ""

echo "2️⃣ Crear backup:"
echo "   cd /root/fumbling-field"
echo "   mkdir -p /root/backups"
echo "   tar -czf /root/backups/backup-\$(date +%Y%m%d-%H%M%S).tar.gz ."
echo ""

echo "3️⃣ Actualizar componentes SEO (copiar desde local):"
echo "   # En tu máquina local, ejecutar:"
echo "   scp src/layouts/Layout-SEO-Optimized.astro root@23.105.176.45:/root/fumbling-field/src/layouts/"
echo "   scp src/components/SEOHead.astro root@23.105.176.45:/root/fumbling-field/src/components/"
echo "   scp src/components/PerformanceOptimized.astro root@23.105.176.45:/root/fumbling-field/src/components/"
echo "   scp src/components/ServicesList-Optimized.astro root@23.105.176.45:/root/fumbling-field/src/components/"
echo "   scp src/components/FeaturedAntecedentes-Optimized.astro root@23.105.176.45:/root/fumbling-field/src/components/"
echo "   scp src/components/LazyImage.astro root@23.105.176.45:/root/fumbling-field/src/components/"
echo "   scp src/pages/index-optimized.astro root@23.105.176.45:/root/fumbling-field/src/pages/"
echo ""

echo "4️⃣ Copiar scripts de optimización:"
echo "   scp scripts/seo-content-optimizer.js root@23.105.176.45:/root/fumbling-field/scripts/"
echo "   scp scripts/performance-refactor.js root@23.105.176.45:/root/fumbling-field/scripts/"
echo "   scp test-complete.js root@23.105.176.45:/root/fumbling-field/"
echo ""

echo "5️⃣ En el servidor, ejecutar optimizaciones:"
echo "   cd /root/fumbling-field"
echo "   node scripts/seo-content-optimizer.js"
echo ""

echo "6️⃣ Reconstruir aplicación:"
echo "   npm ci"
echo "   npm run build"
echo ""

echo "7️⃣ Reiniciar servicios:"
echo "   docker-compose -f docker-compose.production.yml down"
echo "   docker-compose -f docker-compose.production.yml up -d"
echo ""

echo "8️⃣ Verificar deployment:"
echo "   curl -s https://www.umbot.com.ar | grep 'ULTIMA MILLA'"
echo "   curl -s http://localhost:8055/server/health"
echo ""

echo "9️⃣ Ejecutar tests:"
echo "   node test-complete.js"
echo ""

echo "🔟 Actualizar documentación:"
echo "   echo '# Deploy completado manualmente el \$(date)' >> solucionfinal.md"
echo ""

echo "✅ URLS FINALES:"
echo "   🌐 Sitio: https://www.umbot.com.ar"
echo "   🎛️  Admin: http://23.105.176.45:8055"
echo ""

echo "📱 Para conectar rápidamente:"
echo "   ssh root@23.105.176.45"
echo ""
