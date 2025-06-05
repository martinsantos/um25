#!/bin/bash

# Script para inicializar entorno de desarrollo o producción
# Uso: ./init_environment.sh [dev|prod]

# Colores para mensajes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar argumentos
if [ "$#" -ne 1 ]; then
    echo -e "${RED}Error: Se requiere especificar el entorno [dev|prod]${NC}"
    echo -e "Uso: ./init_environment.sh [dev|prod]"
    exit 1
fi

ENV=$1
PROJECT_ROOT=$(pwd)

# Validar entorno
if [ "$ENV" != "dev" ] && [ "$ENV" != "prod" ]; then
    echo -e "${RED}Error: Entorno no válido. Use 'dev' o 'prod'${NC}"
    exit 1
fi

echo -e "${YELLOW}Inicializando entorno de ${ENV}...${NC}"

# Configurar variables según el entorno
if [ "$ENV" == "dev" ]; then
    ENV_FILE=".env.development"
    COMPOSE_FILE="docker-compose.development.yml"
    NGINX_CONF="nginx.development.conf"
else
    ENV_FILE=".env.production"
    COMPOSE_FILE="docker-compose.production.yml"
    NGINX_CONF="nginx.production.conf"
fi

# Verificar que los archivos necesarios existan
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}Error: Archivo $ENV_FILE no encontrado${NC}"
    exit 1
fi

if [ ! -f "$COMPOSE_FILE" ]; then
    echo -e "${RED}Error: Archivo $COMPOSE_FILE no encontrado${NC}"
    exit 1
fi

# Detener contenedores existentes si los hay
echo -e "${YELLOW}Deteniendo contenedores existentes...${NC}"
docker-compose -f $COMPOSE_FILE down

# Limpiar recursos no utilizados
echo -e "${YELLOW}Limpiando recursos no utilizados...${NC}"
docker system prune -f

# Iniciar contenedores
echo -e "${YELLOW}Iniciando contenedores de $ENV...${NC}"
docker-compose -f $COMPOSE_FILE up -d

# Verificar estado de los contenedores
echo -e "${YELLOW}Verificando estado de los contenedores...${NC}"
docker-compose -f $COMPOSE_FILE ps

# Verificar logs por errores
echo -e "${YELLOW}Verificando logs por errores...${NC}"
docker-compose -f $COMPOSE_FILE logs --tail=20

echo -e "${GREEN}¡Entorno de $ENV inicializado correctamente!${NC}"
echo -e "${YELLOW}Para verificar los logs completos: docker-compose -f $COMPOSE_FILE logs -f${NC}"

# Verificar el token de Directus
echo -e "${YELLOW}Verificando token de Directus...${NC}"

# Extraer token y URL de Directus del archivo .env
DIRECTUS_TOKEN=$(grep "DIRECTUS_STATIC_TOKEN" $ENV_FILE | cut -d'=' -f2 | tr -d '"' | tr -d "'")
DIRECTUS_URL=$(grep "PUBLIC_DIRECTUS_URL" $ENV_FILE | cut -d'=' -f2 | tr -d '"' | tr -d "'")

# Esperar a que Directus esté listo
echo -e "${YELLOW}Esperando a que Directus esté listo...${NC}"
sleep 10

# Verificar que el token funciona
echo -e "${YELLOW}Verificando que el token funciona correctamente...${NC}"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$DIRECTUS_URL/users/me" -H "Authorization: Bearer $DIRECTUS_TOKEN")

if [ "$RESPONSE" -eq 200 ]; then
    echo -e "${GREEN}¡Token verificado correctamente! (Código HTTP: $RESPONSE)${NC}"
else
    echo -e "${RED}Error al verificar el token. Código HTTP: $RESPONSE${NC}"
    echo -e "${YELLOW}Puede ser necesario ejecutar el script fix_directus_token.sh${NC}"
fi

exit 0
