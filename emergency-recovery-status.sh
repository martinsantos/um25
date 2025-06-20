#!/bin/bash

# 🚨 DIAGNÓSTICO DE EMERGENCIA - STATUS CRÍTICO
# Problema: DNS y servidor completamente caídos después de configuraciones
# Fecha: 17 de Junio 2025

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${RED}🚨 DIAGNÓSTICO DE EMERGENCIA - STATUS CRÍTICO${NC}"
echo "==============================================="

SERVER_IP="23.105.176.45"
DOMAIN="umbot.com.ar"
WWW_DOMAIN="www.umbot.com.ar"

echo -e "${YELLOW}📊 COMPARACIÓN ANTES vs AHORA:${NC}"
echo ""
echo -e "${RED}❌ ANTES DE CONFIGURACIONES:${NC}"
echo "✅ http://umbot.com.ar/ = HTTP 200 OK"
echo "✅ DNS umbot.com.ar = 23.105.176.45"
echo "❌ https://umbot.com.ar/ = Puerto 443 cerrado"
echo "❌ www.umbot.com.ar = NXDOMAIN"
echo ""

echo -e "${RED}❌ DESPUÉS DE CONFIGURACIONES:${NC}"
echo "❌ http://umbot.com.ar/ = DNS no resuelve"
echo "❌ DNS umbot.com.ar = 0 ANSWER records"
echo "❌ https://umbot.com.ar/ = DNS no resuelve"
echo "❌ www.umbot.com.ar = NXDOMAIN"
echo "❌ http://23.105.176.45/ = Servidor no responde"
echo ""

echo -e "${RED}🎯 PROBLEMA CRÍTICO IDENTIFICADO:${NC}"
echo "Las configuraciones en CiberPanel han ROTO completamente:"
echo "1. DNS principal del dominio"
echo "2. Servidor web (no responde ni por IP)"
echo "3. Todos los servicios están CAÍDOS"
echo ""

echo -e "${BLUE}🔍 DIAGNÓSTICO TÉCNICO:${NC}"
echo ""
echo "1. DNS Query umbot.com.ar:"
dig umbot.com.ar @8.8.8.8 | grep -E "(ANSWER|AUTHORITY)" -A 2

echo ""
echo "2. Servidor IP $SERVER_IP:"
if timeout 5 bash -c "echo >/dev/tcp/$SERVER_IP/80" 2>/dev/null; then
    echo "✅ Puerto 80 responde"
else
    echo "❌ Puerto 80 NO responde"
fi

if timeout 5 bash -c "echo >/dev/tcp/$SERVER_IP/443" 2>/dev/null; then
    echo "✅ Puerto 443 responde"
else
    echo "❌ Puerto 443 NO responde"
fi

if timeout 5 bash -c "echo >/dev/tcp/$SERVER_IP/8090" 2>/dev/null; then
    echo "✅ CiberPanel (8090) responde"
else
    echo "❌ CiberPanel (8090) NO responde"
fi

echo ""
echo -e "${YELLOW}🚨 ACCIONES DE EMERGENCIA REQUERIDAS:${NC}"
echo ""

echo -e "${RED}OPCIÓN 1: ACCESO DE EMERGENCIA VIA CYBERPANEL${NC}"
echo "1. Intentar acceder: https://$SERVER_IP:8090"
echo "2. Si CiberPanel responde:"
echo "   - Ve a: DNS → Manage DNS → umbot.com.ar"
echo "   - RESTAURAR registro A: umbot.com.ar → $SERVER_IP"
echo "   - Ve a: Websites → List Websites → umbot.com.ar"
echo "   - Verificar que el website esté ACTIVO"
echo "   - Ve a: Actions → Restart All Services"
echo ""

echo -e "${RED}OPCIÓN 2: ACCESO SSH DE EMERGENCIA${NC}"
echo "1. Conectar: ssh root@$SERVER_IP"
echo "2. Verificar servicios:"
echo "   systemctl status lsws"
echo "   systemctl status named"
echo "   docker ps (si usa Docker)"
echo "3. Reiniciar servicios:"
echo "   systemctl restart lsws"
echo "   systemctl restart named"
echo ""

echo -e "${RED}OPCIÓN 3: ROLLBACK COMPLETO${NC}"
echo "1. Acceder a CiberPanel"
echo "2. Ve a: DNS → Create DNS Zone"
echo "3. RECREAR zona DNS desde cero:"
echo "   Dominio: umbot.com.ar"
echo "   IP: $SERVER_IP"
echo "4. Ve a: Websites → Create Website"
echo "5. RECREAR website si está corrupto"
echo ""

echo -e "${BLUE}🔍 VERIFICACIÓN POST-RECUPERACIÓN:${NC}"
echo ""
echo "Después de cualquier acción, verificar:"
echo ""
echo -e "${GREEN}# Verificar DNS:${NC}"
echo "nslookup umbot.com.ar"
echo "dig umbot.com.ar @8.8.8.8"
echo ""
echo -e "${GREEN}# Verificar conectividad:${NC}"
echo "curl -I http://23.105.176.45/"
echo "curl -I http://umbot.com.ar/"
echo ""

echo -e "${YELLOW}⏰ TIEMPO CRÍTICO:${NC}"
echo "- Recuperación de DNS: 5-15 minutos"
echo "- Reinicio de servicios: 2-5 minutos"
echo "- Recreación completa: 15-30 minutos"
echo ""

echo -e "${RED}🎯 OBJETIVO DE RECUPERACIÓN:${NC}"
echo "✅ DNS umbot.com.ar → $SERVER_IP"
echo "✅ http://umbot.com.ar/ → HTTP 200"
echo "✅ http://$SERVER_IP/ → HTTP 200"
echo "✅ CiberPanel accesible"
echo ""

echo "==============================================="
echo -e "${RED}⚠️  SITUACIÓN CRÍTICA - ACCIÓN INMEDIATA REQUERIDA${NC}" 