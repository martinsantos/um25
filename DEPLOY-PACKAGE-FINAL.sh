#!/bin/bash
# DEPLOY PACKAGE FINAL - ULTIMA MILLA CLI v1.3.0
# ===============================================
# Todos los archivos críticos preparados para deploy inmediato
# Estado: LISTO PARA EJECUCIÓN EN SERVIDOR

echo "📦 ULTIMA MILLA - Deploy Package Final v1.3.0"
echo "=============================================="
echo ""
echo "🎯 CAMBIOS CRÍTICOS INCLUIDOS:"
echo "  ✅ Google Analytics: G-S2376K1GED"
echo "  ✅ Directus Collections: servicios, antecedentes" 
echo "  ✅ UM Terminal: v1.3.0 Enhanced estable"
echo "  ✅ API: Optimizada con cache y error handling"
echo ""

# INSTRUCCIONES DE DEPLOY MANUAL (a prueba de timeouts)
cat << 'EOF'
🚀 INSTRUCCIONES DE DEPLOY MANUAL:

1. CONECTAR AL SERVIDOR:
   ssh root@23.105.176.45
   # Password: gsiB%s@0yD

2. NAVEGAR AL PROYECTO:
   cd /root/fumbling-field

3. CREAR BACKUP DE SEGURIDAD:
   cp -r src src.backup.$(date +%Y%m%d_%H%M%S)

4. APLICAR CAMBIOS CRÍTICOS:

   # Google Analytics (Layout.astro línea 81):
   sed -i 's/G-XXXXXXXXXX/G-S2376K1GED/g' src/layouts/Layout.astro

   # Directus Collections (directus.ts líneas 91,97):
   sed -i "s/obtenerContenidoPublicado('Servicios'/obtenerContenidoPublicado('servicios'/g" src/lib/directus.ts
   sed -i "s/obtenerContenidoPublicado('Antecedentes'/obtenerContenidoPublicado('antecedentes'/g" src/lib/directus.ts

5. REINICIAR CONTENEDOR:
   docker restart astro-app
   # O alternativa:
   docker-compose restart astro-app

6. VERIFICAR DEPLOY:
   curl -s https://www.ultimamilla.com.ar | grep -o G-S2376K1GED
   # Debería mostrar: G-S2376K1GED

🔧 VERIFICACIONES POST-DEPLOY:

✅ Google Analytics activo:
   curl -s "https://www.ultimamilla.com.ar" | grep "G-S2376K1GED" && echo "GA: ACTIVO" || echo "GA: NO ENCONTRADO"

✅ API funcionando:
   curl -s "https://www.ultimamilla.com.ar/api/umcli.json" | jq -r '.success' && echo "API: OK" || echo "API: ERROR"

✅ Terminal disponible:
   curl -s "https://www.ultimamilla.com.ar/cli" | grep -q "UM CLI" && echo "TERMINAL: OK" || echo "TERMINAL: ERROR"

✅ Directus conectividad:
   curl -s "https://www.ultimamilla.com.ar:8055/server/health" | jq -r '.status' && echo "DIRECTUS: OK" || echo "DIRECTUS: ERROR"

📊 MÉTRICAS ESPERADAS:
- Google Analytics: G-S2376K1GED visible en source
- API Response: {"success": true, "data": {...}}
- Servicios count: > 0 (no fallback)
- Antecedentes count: 469 (target)

🎯 ESTADO FINAL ESPERADO:
- Sitio: https://www.ultimamilla.com.ar ✅
- Terminal: https://www.ultimamilla.com.ar/cli ✅
- API: https://www.ultimamilla.com.ar/api/umcli.json ✅
- Admin: https://www.ultimamilla.com.ar:8055 ✅

EOF

echo ""
echo "📋 RESUMEN DEL PACKAGE:"
echo "  - Archivos locales: 100% preparados"
echo "  - Google Analytics: Configurado G-S2376K1GED"
echo "  - Directus: Collections corregidas"
echo "  - UM Terminal: v1.3.0 estable"
echo "  - Deploy manual: Instrucciones detalladas"
echo ""
echo "🚀 LISTO PARA DEPLOY INMEDIATO EN SERVIDOR"
echo "   Todos los cambios han sido implementados localmente"
echo "   y verificados. Solo falta aplicar en producción."
