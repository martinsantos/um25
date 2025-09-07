#!/bin/bash

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🚨 Iniciando recuperación de emergencia...${NC}"

# Directorio base
BASE_DIR="/root/fumbling-field"
cd $BASE_DIR

# Función para verificar servicio
check_service() {
    local service=$1
    local port=$2
    nc -z localhost $port > /dev/null 2>&1
    return $?
}

# Función para mostrar estado
show_status() {
    local message=$1
    local status=$2
    if [ $status -eq 0 ]; then
        echo -e "${GREEN}✓ $message${NC}"
    else
        echo -e "${RED}✗ $message${NC}"
    fi
}

# 1. Verificar espacio en disco
echo -e "\n${YELLOW}Verificando espacio en disco...${NC}"
df -h / | awk 'NR==2 {print $5}' | cut -d'%' -f1 | read DISK_USAGE
if [ $DISK_USAGE -gt 90 ]; then
    echo -e "${RED}⚠️ Espacio en disco crítico ($DISK_USAGE%)${NC}"
    # Limpiar logs antiguos
    find /var/log -type f -name "*.log.*" -mtime +7 -exec rm {} \;
    docker system prune -f
fi

# 2. Verificar y reiniciar servicios
echo -e "\n${YELLOW}Verificando servicios...${NC}"

# Detener servicios
docker-compose down

# Limpiar cache
rm -rf data/port-3000/cache/*

# Reiniciar servicios
docker-compose up -d

# Esperar a que los servicios estén disponibles
echo -e "\n${YELLOW}Esperando que los servicios estén disponibles...${NC}"
sleep 10

# Verificar servicios
check_service "Directus" 8055
show_status "Directus" $?

check_service "Nginx" 80
show_status "Nginx" $?

check_service "Prometheus" 9090
show_status "Prometheus" $?

check_service "Grafana" 3000
show_status "Grafana" $?

# 3. Verificar y reparar permisos
echo -e "\n${YELLOW}Reparando permisos...${NC}"
chown -R root:root $BASE_DIR
chmod -R 755 $BASE_DIR
chmod -R 777 $BASE_DIR/data/port-3000/uploads

# 4. Verificar conexión a la base de datos
echo -e "\n${YELLOW}Verificando base de datos...${NC}"
if docker-compose exec -T directus-admin npx directus database migrate:latest; then
    show_status "Base de datos" 0
else
    show_status "Base de datos" 1
fi

# 5. Limpiar cache de Nginx
echo -e "\n${YELLOW}Limpiando cache de Nginx...${NC}"
docker-compose exec -T nginx nginx -s reload
show_status "Limpieza de cache" $?

# 6. Verificar certificados SSL
echo -e "\n${YELLOW}Verificando certificados SSL...${NC}"
if [ -f "/etc/letsencrypt/live/ultimamilla.com.ar/fullchain.pem" ]; then
    CERT_EXPIRY=$(openssl x509 -enddate -noout -in "/etc/letsencrypt/live/ultimamilla.com.ar/fullchain.pem" | cut -d= -f2)
    echo -e "${GREEN}Certificado válido hasta: $CERT_EXPIRY${NC}"
else
    echo -e "${RED}Certificado no encontrado${NC}"
fi

# 7. Resumen final
echo -e "\n${YELLOW}Resumen de recuperación:${NC}"
echo "----------------------------------------"
docker-compose ps
echo "----------------------------------------"

echo -e "\n${GREEN}✅ Recuperación completada${NC}"
echo -e "Accede a https://ultimamilla.com.ar para verificar" 