#!/bin/bash

# 🚨 SOLUCIÓN ESPECÍFICA - PROPAGACIÓN DNS www.umbot.com.ar
# Problema: DNS configurado en CiberPanel pero no propagado
# Fecha: 17 de Junio 2025

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🔧 SOLUCIÓN ESPECÍFICA: PROPAGACIÓN DNS${NC}"
echo "=============================================="

SERVER_IP="23.105.176.45"
DOMAIN="umbot.com.ar"
WWW_DOMAIN="www.umbot.com.ar"

echo -e "${YELLOW}📋 DIAGNÓSTICO ACTUAL:${NC}"
echo "✅ SSL funcionando: https://umbot.com.ar/ (HTTP/2 200)"
echo "✅ Configuración DNS en CiberPanel: Visible en panel"
echo "❌ Propagación DNS: www.umbot.com.ar no resuelve públicamente"
echo ""

echo -e "${RED}🎯 PROBLEMA IDENTIFICADO:${NC}"
echo "El registro DNS está configurado en CiberPanel pero NO está"
echo "siendo servido por los nameservers públicos de umbot.com.ar."
echo ""

echo -e "${BLUE}🔧 SOLUCIÓN PASO A PASO:${NC}"
echo ""

echo -e "${YELLOW}OPCIÓN 1: REINICIAR SERVICIOS DNS EN CYBERPANEL${NC}"
echo "1. Accede a CiberPanel: https://$SERVER_IP:8090"
echo "2. Ve a: DNS → DNS"
echo "3. Selecciona: umbot.com.ar"
echo "4. Presiona botón: 'Restart DNS'"
echo "5. Espera 2-3 minutos"
echo "6. Ve a: Actions → Restart All Services"
echo ""

echo -e "${YELLOW}OPCIÓN 2: RECONFIGURAR NAMESERVERS${NC}"
echo "7. Ve a: DNS → Manage DNS → umbot.com.ar"
echo "8. Verifica que los nameservers sean:"
echo "   - ns1.umbot.com.ar"
echo "   - ns2.umbot.com.ar"
echo "9. Si no están, agregarlos:"
echo "   Tipo: NS"
echo "   Nombre: @"
echo "   Valor: ns1.umbot.com.ar"
echo "   (Repetir para ns2.umbot.com.ar)"
echo ""

echo -e "${YELLOW}OPCIÓN 3: FORZAR ACTUALIZACIÓN DE ZONA DNS${NC}"
echo "10. Ve a: DNS → Create DNS Zone"
echo "11. Selecciona: umbot.com.ar"
echo "12. Presiona: 'Update Zone'"
echo "13. Confirma la actualización"
echo ""

echo -e "${YELLOW}OPCIÓN 4: USAR DNS EXTERNAL (MÁS RÁPIDO)${NC}"
echo "Si CiberPanel DNS sigue fallando:"
echo "14. Ve al registrar de umbot.com.ar (donde compraste el dominio)"
echo "15. Cambia los nameservers a:"
echo "    - Cloudflare: elena.ns.cloudflare.com, harvey.ns.cloudflare.com"
echo "    - O Google: ns-cloud-a1.googledomains.com, ns-cloud-a2.googledomains.com"
echo "16. Agrega estos registros en el DNS externo:"
echo "    A    umbot.com.ar      $SERVER_IP"
echo "    A    www               $SERVER_IP"
echo "    CNAME www              umbot.com.ar"
echo ""

echo -e "${BLUE}🔍 VERIFICACIÓN POST-CORRECCIÓN:${NC}"
echo ""
echo "Después de aplicar cualquier opción, espera 10-15 minutos y ejecuta:"
echo ""
echo -e "${GREEN}# Verificar propagación DNS:${NC}"
echo "nslookup www.umbot.com.ar"
echo "dig www.umbot.com.ar @8.8.8.8"
echo ""
echo -e "${GREEN}# Verificar funcionamiento completo:${NC}"
echo "curl -I -k https://www.umbot.com.ar/"
echo "curl -I http://www.umbot.com.ar/"
echo ""

echo -e "${YELLOW}⏰ TIEMPOS DE PROPAGACIÓN:${NC}"
echo "- Reinicio servicios CiberPanel: 2-5 minutos"
echo "- Actualización zona DNS: 5-10 minutos"
echo "- Cambio nameservers externos: 30 minutos - 2 horas"
echo ""

echo -e "${GREEN}🎉 RESULTADO ESPERADO DESPUÉS DE LA CORRECCIÓN:${NC}"
echo ""
echo "✅ http://umbot.com.ar/ → Funcionando (ya funciona)"
echo "✅ https://umbot.com.ar/ → Funcionando (ya funciona)"
echo "✅ http://www.umbot.com.ar/ → Funcionará"
echo "✅ https://www.umbot.com.ar/ → Funcionará"
echo ""

echo -e "${BLUE}📞 CONTACTOS DE SOPORTE:${NC}"
echo "- CiberPanel: https://community.cyberpanel.net/"
echo "- DNS Checker: https://dnschecker.org/"
echo "- Whois umbot.com.ar: whois umbot.com.ar"
echo ""

echo "=============================================="
echo -e "${GREEN}✅ GUÍA DE CORRECCIÓN DNS GENERADA${NC}" 