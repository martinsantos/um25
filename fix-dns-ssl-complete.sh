#!/bin/bash

# 🚨 SCRIPT DE SOLUCIÓN COMPLETA DNS + SSL - UM25-0.4
# Soluciona problemas de www.ultimamilla.com.ar y HTTPS
# Fecha: 17 de Junio 2025

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🔧 SOLUCIÓN COMPLETA DNS + SSL para ultimamilla.com.ar${NC}"
echo "=================================================================="

# Variables
SERVER_IP="23.105.176.45"
DOMAIN="ultimamilla.com.ar"
WWW_DOMAIN="www.ultimamilla.com.ar"
CYBERPANEL_PORT="8090"

echo -e "${YELLOW}📋 PASO 1: VERIFICAR PROBLEMAS ACTUALES${NC}"
echo "1. Verificando DNS de $DOMAIN..."
if nslookup $DOMAIN | grep -q "$SERVER_IP"; then
    echo -e "${GREEN}✅ $DOMAIN → $SERVER_IP${NC}"
else
    echo -e "${RED}❌ $DOMAIN no resuelve correctamente${NC}"
fi

echo "2. Verificando DNS de $WWW_DOMAIN..."
if nslookup $WWW_DOMAIN | grep -q "$SERVER_IP"; then
    echo -e "${GREEN}✅ $WWW_DOMAIN → $SERVER_IP${NC}"
else
    echo -e "${RED}❌ $WWW_DOMAIN NO RESUELVE - PROBLEMA CRÍTICO${NC}"
fi

echo "3. Verificando SSL (puerto 443)..."
if timeout 3 bash -c "echo >/dev/tcp/$DOMAIN/443" 2>/dev/null; then
    echo -e "${GREEN}✅ Puerto 443 abierto${NC}"
else
    echo -e "${RED}❌ Puerto 443 CERRADO - SSL NO CONFIGURADO${NC}"
fi

echo ""
echo -e "${YELLOW}📋 PASO 2: INSTRUCCIONES PARA CIBERPANEL${NC}"
echo "=================================================================="
echo -e "${BLUE}🌐 CORRECCIÓN DNS:${NC}"
echo ""
echo "1. Accede a CiberPanel: https://$SERVER_IP:$CYBERPANEL_PORT"
echo "   Usuario: admin"
echo "   Password: gsiB%s@0yD"
echo ""
echo "2. Ve a: DNS → Manage DNS → ultimamilla.com.ar"
echo ""
echo "3. VERIFICA/AGREGA estos registros DNS:"
echo "   ┌─────────────────────────────────────────────────────────┐"
echo "   │ Tipo │ Nombre        │ Valor        │ TTL  │ Prioridad │"
echo "   ├─────────────────────────────────────────────────────────┤"
echo "   │  A   │ ultimamilla.com.ar  │ $SERVER_IP   │ 3600 │     -     │"
echo "   │  A   │ www           │ $SERVER_IP   │ 3600 │     -     │"
echo "   │ CNAME│ www           │ ultimamilla.com.ar │ 3600 │     -     │"
echo "   └─────────────────────────────────────────────────────────┘"
echo ""
echo -e "${RED}⚠️  IMPORTANTE: Si ya existe 'www', EDITARLO, no crear duplicado${NC}"
echo ""

echo -e "${BLUE}🔒 CONFIGURACIÓN SSL:${NC}"
echo ""
echo "4. Ve a: SSL → Manage SSL"
echo ""
echo "5. Selecciona dominio: ultimamilla.com.ar"
echo ""
echo "6. Selecciona: 'Issue SSL Certificate'"
echo ""
echo "7. Marca ambos dominios:"
echo "   ✅ ultimamilla.com.ar"
echo "   ✅ www.ultimamilla.com.ar"
echo ""
echo "8. Método: Let's Encrypt (Free)"
echo ""
echo "9. Presiona: 'Issue Now'"
echo ""

echo -e "${YELLOW}📋 PASO 3: CONFIGURACIÓN AVANZADA${NC}"
echo "=================================================================="
echo -e "${BLUE}🔧 CONFIGURACIÓN DE VIRTUAL HOST:${NC}"
echo ""
echo "10. Ve a: Websites → List Websites"
echo ""
echo "11. Busca: ultimamilla.com.ar → Manage"
echo ""
echo "12. Ve a pestaña: 'Configurations'"
echo ""
echo "13. Edita 'OpenLiteSpeed Virtual Host Configurations'"
echo ""
echo "14. AGREGAR estas líneas en la sección de SSL:"
cat << 'VHOST_CONFIG'

# Configuración SSL para ultimamilla.com.ar
map                     *:443
secure                  Yes
keyFile                 /etc/letsencrypt/live/ultimamilla.com.ar/privkey.pem
certFile                /etc/letsencrypt/live/ultimamilla.com.ar/fullchain.pem
certChain               1
sslProtocol             24
renegProtection         1
sslSessionCache         1
sslSessionTickets       1
enableSpdy              15
enableQuic              1

# Alias para www
vhAliases               www.ultimamilla.com.ar

VHOST_CONFIG

echo ""
echo "15. Guarda los cambios"
echo ""
echo "16. Ve a: Actions → Graceful Restart"
echo ""

echo -e "${YELLOW}📋 PASO 4: VERIFICACIÓN POST-CONFIGURACIÓN${NC}"
echo "=================================================================="
echo ""
echo "Después de aplicar los cambios, ejecuta estos comandos para verificar:"
echo ""
echo -e "${BLUE}# Verificar DNS (esperar 5-10 minutos para propagación):${NC}"
echo "nslookup www.ultimamilla.com.ar"
echo "dig www.ultimamilla.com.ar @8.8.8.8"
echo ""
echo -e "${BLUE}# Verificar SSL:${NC}"
echo "curl -I https://ultimamilla.com.ar/"
echo "curl -I https://www.ultimamilla.com.ar/"
echo ""
echo -e "${BLUE}# Verificar redirecciones:${NC}"
echo "curl -I http://ultimamilla.com.ar/"
echo "curl -I http://www.ultimamilla.com.ar/"
echo ""

echo -e "${YELLOW}📋 PASO 5: CONFIGURACIÓN DOCKER (OPCIONAL)${NC}"
echo "=================================================================="
echo ""
echo "Si también quieres usar la configuración Docker con SSL:"
echo ""
echo "1. SSH al servidor:"
echo "   ssh root@$SERVER_IP"
echo ""
echo "2. Ve al directorio del proyecto:"
echo "   cd /root/fumbling-field"
echo ""
echo "3. Actualiza docker-compose.static.yml para SSL:"
echo ""
cat << 'DOCKER_CONFIG'
# Agregar a nginx service en docker-compose.static.yml:
ports:
  - "80:80"
  - "443:443"
volumes:
  - ./nginx.prod.conf:/etc/nginx/nginx.conf:ro
  - /etc/letsencrypt:/etc/letsencrypt:ro

DOCKER_CONFIG

echo ""
echo -e "${GREEN}🎉 DESPUÉS DE APLICAR TODOS LOS CAMBIOS:${NC}"
echo ""
echo "✅ http://ultimamilla.com.ar/ → Funcionará (ya funciona)"
echo "✅ http://www.ultimamilla.com.ar/ → Funcionará"
echo "✅ https://ultimamilla.com.ar/ → Funcionará con SSL"
echo "✅ https://www.ultimamilla.com.ar/ → Funcionará con SSL"
echo ""
echo -e "${BLUE}📞 Si necesitas ayuda:${NC}"
echo "- CiberPanel Docs: https://docs.cyberpanel.net/ssl"
echo "- Let's Encrypt: https://letsencrypt.org/getting-started/"
echo ""
echo "=================================================================="
echo -e "${GREEN}✅ SCRIPT DE SOLUCIÓN COMPLETO GENERADO${NC}" 