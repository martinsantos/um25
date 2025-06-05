#!/bin/bash

# Script para restaurar la base de datos desde un archivo de respaldo

# Colores para mensajes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuración
BACKUP_FILE="backup.sql"
DB_CONTAINER="database"
DB_USER="postgres"
DB_NAME="directus"
SERVICES_TO_STOP="directus-app astro-app"

# Función para verificar si un comando existe
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Verificar que docker y docker-compose estén instalados
if ! command_exists docker; then
  echo -e "${RED}Error: Docker no está instalado. Por favor instala Docker primero.${NC}"
  exit 1
fi

if ! command_exists docker-compose; then
  echo -e "${RED}Error: Docker Compose no está instalado. Por favor instálalo primero.${NC}"
  exit 1
fi

# Verificar que el archivo de respaldo existe
if [ ! -f "$BACKUP_FILE" ]; then
  echo -e "${RED}Error: No se encontró el archivo de respaldo $BACKUP_FILE${NC}"
  exit 1
fi

echo -e "${YELLOW}Iniciando restauración de la base de datos desde $BACKUP_FILE...${NC}"

# Verificar si los contenedores están en ejecución
RUNNING_CONTAINERS=$(docker ps -q)
if [ -n "$RUNNING_CONTAINERS" ]; then
  echo -e "${YELLOW}Deteniendo contenedores en ejecución...${NC}"
  docker-compose stop $SERVICES_TO_STOP 2>/dev/null || true
  sleep 3
fi

# Verificar que el contenedor de la base de datos esté en ejecución
if ! docker ps | grep -q "$DB_CONTAINER"; then
  echo -e "${YELLOW}Iniciando el contenedor de la base de datos...${NC}"
  docker-compose up -d $DB_CONTAINER
  
  # Esperar a que la base de datos esté lista
  echo -e "${YELLOW}Esperando a que la base de datos esté lista...${NC}"
  sleep 10
  
  MAX_RETRIES=10
  RETRY_COUNT=0
  
  while ! docker-compose exec -T $DB_CONTAINER pg_isready -U $DB_USER >/dev/null 2>&1; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
      echo -e "${RED}Error: No se pudo conectar a la base de datos después de $MAX_RETRIES intentos.${NC}"
      exit 1
    fi
    echo "Esperando a que la base de datos esté lista (intento $RETRY_COUNT/$MAX_RETRIES)..."
    sleep 5
  done
fi

# Restaurar la base de datos
echo -e "${YELLOW}Restaurando la base de datos...${NC}"
if docker-compose exec -T $DB_CONTAINER psql -U $DB_USER -d $DB_NAME < "$BACKUP_FILE"; then
  echo -e "${GREEN}¡Base de datos restaurada exitosamente!${NC}
"
  
  # Reconstruir índices después de la restauración
  echo -e "${YELLOW}Reconstruyendo índices...${NC}"
  docker-compose exec -T $DB_CONTAINER psql -U $DB_USER -d $DB_NAME -c "REINDEX DATABASE $DB_NAME;"
  
  # Iniciar los servicios nuevamente
  echo -e "\n${YELLOW}Iniciando servicios...${NC}"
  docker-compose up -d $SERVICES_TO_STOP
  
  echo -e "\n${GREEN}Proceso de restauración completado con éxito.${NC}"
  echo -e "${YELLOW}Nota: Los servicios pueden tardar unos momentos en estar completamente disponibles.${NC}"
else
  echo -e "${RED}Error al restaurar la base de datos.${NC}"
  echo -e "${YELLOW}Verifica que el archivo de respaldo no esté dañado e inténtalo de nuevo.${NC}"
  exit 1
fi
