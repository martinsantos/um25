#!/bin/bash

echo "🔍 VERIFICACIÓN MIGRACIÓN ULTIMAMILLA.COM.AR"
echo "=============================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo "📡 1. VERIFICANDO DNS..."
nslookup ultimamilla.com.ar | grep -A2 "Non-authoritative answer:"

echo ""
echo "🐳 2. VERIFICANDO CONTENEDORES DOCKER..."
docker-compose -f docker-compose.production.yml ps

echo ""
echo "🌐 3. VERIFICANDO SERVIDOR ASTRO DIRECTO..."
ASTRO_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://23.105.176.45:4321)
if [ "$ASTRO_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Servidor Astro: HTTP $ASTRO_STATUS${NC}"
else
    echo -e "${RED}❌ Servidor Astro: HTTP $ASTRO_STATUS${NC}"
fi

echo ""
echo "🔐 4. VERIFICANDO DOMINIO CON SSL..."
DOMAIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://ultimamilla.com.ar)
if [ "$DOMAIN_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Dominio ultimamilla.com.ar: HTTP $DOMAIN_STATUS${NC}"
elif [ "$DOMAIN_STATUS" = "403" ]; then
    echo -e "${YELLOW}⚠️  Dominio ultimamilla.com.ar: HTTP $DOMAIN_STATUS (Problema proxy reverso)${NC}"
else
    echo -e "${RED}❌ Dominio ultimamilla.com.ar: HTTP $DOMAIN_STATUS${NC}"
fi

echo ""
echo "📋 5. VERIFICANDO DIRECTUS..."
DIRECTUS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://23.105.176.45:8055)
if [ "$DIRECTUS_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Directus: HTTP $DIRECTUS_STATUS${NC}"
else
    echo -e "${RED}❌ Directus: HTTP $DIRECTUS_STATUS${NC}"
fi

echo ""
echo "🔧 DIAGNÓSTICO Y ACCIONES REQUERIDAS:"
echo "======================================"

if [ "$ASTRO_STATUS" = "200" ] && [ "$DOMAIN_STATUS" = "403" ]; then
    echo -e "${YELLOW}🔍 PROBLEMA IDENTIFICADO: Proxy Reverso${NC}"
    echo ""
    echo "✅ Servidor Astro funcionando correctamente"
    echo "❌ Proxy reverso en CyberPanel no configurado correctamente"
    echo ""
    echo "📝 ACCIONES REQUERIDAS EN CYBERPANEL:"
    echo "1. Ir a 'Websites' → 'ultimamilla.com.ar'"
    echo "2. Verificar 'Proxy Rule':"
    echo "   - Source: /"
    echo "   - Destination: http://127.0.0.1:4321/"
    echo "   - Check 'Pass Headers': ✓"
    echo "3. Verificar que el certificado SSL esté activo"
    echo "4. Reiniciar OpenLiteSpeed si es necesario"
    
elif [ "$ASTRO_STATUS" != "200" ]; then
    echo -e "${RED}🔍 PROBLEMA: Servidor Astro no responde${NC}"
    echo "Ejecutar: docker-compose -f docker-compose.production.yml restart astro-app"
    
elif [ "$DOMAIN_STATUS" = "200" ]; then
    echo -e "${GREEN}🎉 MIGRACIÓN COMPLETADA EXITOSAMENTE${NC}"
    echo "El sitio ultimamilla.com.ar está funcionando correctamente"
    
else
    echo -e "${RED}🔍 PROBLEMA: Error no identificado${NC}"
    echo "Revisar logs de CyberPanel y OpenLiteSpeed"
fi

echo ""
echo "🏁 Verificación completada $(date)"
