#!/bin/bash

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para verificar el estado del comando
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1${NC}"
    else
        echo -e "${RED}✗ $1${NC}"
        exit 1
    fi
}

echo -e "${YELLOW}=== Iniciando migración de Directus ===${NC}"

# 1. Instalar dependencias de Python
echo -e "\n${YELLOW}1. Instalando dependencias...${NC}"
python3 -m pip install requests urllib3
check_status "Instalación de dependencias"

# 2. Detener y limpiar contenedores existentes
echo -e "\n${YELLOW}2. Limpiando ambiente...${NC}"
docker-compose down -v
check_status "Limpieza de contenedores"

# 3. Iniciar servicios
echo -e "\n${YELLOW}3. Iniciando servicios...${NC}"
docker-compose -f docker-compose.migration.yml up -d
check_status "Inicio de servicios"

# 4. Esperar a que los servicios estén listos
echo -e "\n${YELLOW}4. Esperando a que los servicios estén listos...${NC}"
sleep 30

# 5. Ejecutar migración
echo -e "\n${YELLOW}5. Ejecutando migración...${NC}"
python3 migrate_antecedentes.py
check_status "Migración de datos"

# 6. Verificar logs
echo -e "\n${YELLOW}6. Verificando logs...${NC}"
echo "=== Logs de Directus ==="
docker-compose -f docker-compose.migration.yml logs directus
echo "=== Logs de migración ==="
cat migration.log

echo -e "\n${GREEN}=== Migración completada ===${NC}" 