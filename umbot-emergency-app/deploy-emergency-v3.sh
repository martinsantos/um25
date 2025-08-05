#!/bin/bash

echo "🚨 UMBot Emergency Dashboard v3.0 - Deployment Script"
echo "===================================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Variables según solucionfinal.md
SERVER_IP="23.105.176.45"
SERVER_USER="root"
SERVER_PASS="gsiB%s@0yD"
EMERGENCY_PORT="8091"
REMOTE_DIR="/var/www/emergency"

echo -e "${YELLOW}📋 Configuración del despliegue:${NC}"
echo "   - Servidor: $SERVER_IP"
echo "   - Puerto: $EMERGENCY_PORT"
echo "   - Directorio: $REMOTE_DIR"

# Función para ejecutar comandos en el servidor
remote_exec() {
    sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" "$1"
}

# Paso 1: Verificar conectividad
echo -e "\n${YELLOW}1️⃣ Verificando conectividad con el servidor...${NC}"
if ! ping -c 1 "$SERVER_IP" > /dev/null 2>&1; then
    echo -e "${RED}❌ No se puede conectar al servidor${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Servidor accesible${NC}"

# Paso 2: Crear directorio en el servidor
echo -e "\n${YELLOW}2️⃣ Preparando directorio en el servidor...${NC}"
remote_exec "mkdir -p $REMOTE_DIR"
echo -e "${GREEN}✅ Directorio preparado${NC}"

# Paso 3: Copiar archivos al servidor
echo -e "\n${YELLOW}3️⃣ Copiando archivos al servidor...${NC}"
sshpass -p "$SERVER_PASS" scp -o StrictHostKeyChecking=no \
    index-new.html \
    emergency-app.js \
    manifest.json \
    service-worker.js \
    "$SERVER_USER@$SERVER_IP:$REMOTE_DIR/"

# Renombrar index-new.html a index.html
remote_exec "cd $REMOTE_DIR && mv index-new.html index.html"
echo -e "${GREEN}✅ Archivos copiados${NC}"

# Paso 4: Detener servicio anterior si existe
echo -e "\n${YELLOW}4️⃣ Deteniendo servicio anterior...${NC}"
remote_exec "pkill -f 'python3.*8091' || true"
sleep 2

# Paso 5: Iniciar el nuevo servicio
echo -e "\n${YELLOW}5️⃣ Iniciando UMBot Emergency Dashboard v3.0...${NC}"
remote_exec "cd $REMOTE_DIR && nohup python3 -m http.server $EMERGENCY_PORT > /tmp/emergency-server.log 2>&1 &"
sleep 3

# Paso 6: Verificar que el servicio esté funcionando
echo -e "\n${YELLOW}6️⃣ Verificando el servicio...${NC}"
if curl -s -o /dev/null -w "%{http_code}" "http://$SERVER_IP:$EMERGENCY_PORT" | grep -q "200"; then
    echo -e "${GREEN}✅ UMBot Emergency Dashboard v3.0 está funcionando!${NC}"
    echo -e "${GREEN}🌐 Acceder en: http://$SERVER_IP:$EMERGENCY_PORT${NC}"
else
    echo -e "${RED}❌ El servicio no responde correctamente${NC}"
    echo "Verificando logs..."
    remote_exec "tail -20 /tmp/emergency-server.log"
fi

# Paso 7: Configurar Nginx para proxy (según solucionfinal.md)
echo -e "\n${YELLOW}7️⃣ Configurando proxy Nginx...${NC}"
NGINX_CONFIG="
location /emergency {
    proxy_pass http://localhost:$EMERGENCY_PORT;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
}
"

echo "$NGINX_CONFIG" > /tmp/emergency-nginx.conf
sshpass -p "$SERVER_PASS" scp -o StrictHostKeyChecking=no \
    /tmp/emergency-nginx.conf \
    "$SERVER_USER@$SERVER_IP:/tmp/"

echo -e "${YELLOW}📝 Agregar esta configuración a Nginx manualmente${NC}"

# Paso 8: Mostrar información de monitoreo
echo -e "\n${GREEN}✅ Despliegue completado!${NC}"
echo -e "\n📊 Servicios monitoreados según solucionfinal.md:"
echo "   - Directus (puerto 8055)"
echo "   - Nginx (puerto 80)"
echo "   - PostgreSQL (puerto 5432)"
echo "   - Prometheus (puerto 9090)"
echo "   - Grafana (puerto 3000)"
echo "   - Node Exporter (puerto 9100)"

echo -e "\n🔧 Comandos útiles:"
echo "   - Ver logs: ssh $SERVER_USER@$SERVER_IP 'tail -f /tmp/emergency-server.log'"
echo "   - Reiniciar: ssh $SERVER_USER@$SERVER_IP 'cd $REMOTE_DIR && pkill -f python3.*8091 && python3 -m http.server $EMERGENCY_PORT &'"

echo -e "\n${YELLOW}⚠️  Recuerda ejecutar la solución de Docker Cache si hay problemas:${NC}"
echo "docker-compose down -v --remove-orphans"
echo "docker system prune -af --volumes"
echo "docker-compose up -d --build --force-recreate" 