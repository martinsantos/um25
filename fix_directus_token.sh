#!/bin/bash

# Script para actualizar el token estático en la base de datos de Directus
# Este script debe ejecutarse en el servidor de producción

# Colores para mensajes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Iniciando actualización del token estático de Directus...${NC}"

# Token correcto que funciona en entorno local
CORRECT_TOKEN="k6P8LAY8_x_y1miB_KTlWnysCnx2Abky"

# Verificar si los contenedores están en ejecución
if ! docker ps | grep -q "directus-app"; then
  echo -e "${RED}Error: El contenedor directus-app no está en ejecución.${NC}"
  echo -e "Inicie los contenedores con: docker-compose -f docker-compose.production.yml up -d"
  exit 1
fi

# Verificar la conexión a la base de datos
echo -e "${YELLOW}Verificando conexión a la base de datos...${NC}"
if ! docker exec database pg_isready -U myuser -d mydatabase; then
  echo -e "${RED}Error: No se puede conectar a la base de datos.${NC}"
  exit 1
fi

# Actualizar el token en la base de datos
echo -e "${YELLOW}Actualizando token en la base de datos...${NC}"
docker exec database psql -U myuser -d mydatabase -c "UPDATE directus_users SET token = '$CORRECT_TOKEN' WHERE admin_access = true;"

if [ $? -eq 0 ]; then
  echo -e "${GREEN}Token actualizado correctamente en la base de datos.${NC}"
else
  echo -e "${RED}Error al actualizar el token en la base de datos.${NC}"
  exit 1
fi

# Verificar que el token funciona
echo -e "${YELLOW}Verificando que el token funciona correctamente...${NC}"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X GET http://23.105.176.45:8055/users/me -H "Authorization: Bearer $CORRECT_TOKEN")

if [ "$RESPONSE" -eq 200 ]; then
  echo -e "${GREEN}¡Token verificado correctamente! (Código HTTP: $RESPONSE)${NC}"
else
  echo -e "${RED}Error al verificar el token. Código HTTP: $RESPONSE${NC}"
  echo -e "${YELLOW}Puede ser necesario reiniciar el contenedor de Directus.${NC}"
fi

# Instrucciones para reiniciar los servicios
echo -e "\n${YELLOW}Para aplicar los cambios, reinicie los servicios con:${NC}"
echo -e "docker-compose -f docker-compose.production.yml down"
echo -e "docker-compose -f docker-compose.production.yml up -d"

echo -e "\n${GREEN}Proceso completado.${NC}"
