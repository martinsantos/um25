#!/bin/bash

# Script para verificar y configurar los permisos en Directus
# Este script debe ejecutarse en el servidor de producción

# Colores para mensajes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Verificando configuración y permisos de Directus...${NC}"

# Token estático correcto
TOKEN="k6P8LAY8_x_y1miB_KTlWnysCnx2Abky"

# ID del rol público
PUBLIC_ROLE_ID="74e3b05e-0f14-422e-9ad3-759d426db60a"

# Verificar si los contenedores están en ejecución
if ! docker ps | grep -q "directus-app"; then
  echo -e "${RED}Error: El contenedor directus-app no está en ejecución.${NC}"
  echo -e "Inicie los contenedores con: docker-compose -f docker-compose.production.yml up -d"
  exit 1
fi

# Verificar que el token funciona
echo -e "${YELLOW}Verificando autenticación con el token estático...${NC}"
RESPONSE=$(curl -s -X GET http://23.105.176.45:8055/users/me -H "Authorization: Bearer $TOKEN")

if echo "$RESPONSE" | grep -q "id"; then
  echo -e "${GREEN}Autenticación exitosa con el token estático.${NC}"
  USER_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
  echo -e "ID de usuario: $USER_ID"
else
  echo -e "${RED}Error de autenticación con el token estático.${NC}"
  echo -e "Respuesta: $RESPONSE"
  exit 1
fi

# Verificar permisos para las colecciones críticas
echo -e "\n${YELLOW}Verificando permisos para colecciones críticas...${NC}"

# Lista de colecciones a verificar
COLLECTIONS=("directus_files" "Antecedentes" "Antecedentes_files" "Servicios" "Servicios_files")

for COLLECTION in "${COLLECTIONS[@]}"; do
  echo -e "${YELLOW}Verificando permisos para $COLLECTION...${NC}"
  
  # Verificar si la colección existe y es accesible
  RESPONSE=$(curl -s -X GET "http://23.105.176.45:8055/items/$COLLECTION?limit=1" -H "Authorization: Bearer $TOKEN")
  
  if echo "$RESPONSE" | grep -q "data"; then
    echo -e "${GREEN}Colección $COLLECTION es accesible.${NC}"
  else
    echo -e "${RED}Error al acceder a la colección $COLLECTION.${NC}"
    echo -e "Respuesta: $RESPONSE"
    
    # Sugerir cómo configurar los permisos
    echo -e "${YELLOW}Para configurar permisos para esta colección:${NC}"
    echo -e "1. Acceda a Directus: http://23.105.176.45:8055/admin"
    echo -e "2. Vaya a Configuración > Roles y permisos"
    echo -e "3. Seleccione el rol público (ID: $PUBLIC_ROLE_ID)"
    echo -e "4. Habilite permisos de lectura para la colección $COLLECTION"
  fi
done

# Verificar acceso a las páginas principales
echo -e "\n${YELLOW}Verificando acceso a las páginas principales...${NC}"

# Lista de endpoints a verificar
ENDPOINTS=("antecedentes" "servicios")

for ENDPOINT in "${ENDPOINTS[@]}"; do
  echo -e "${YELLOW}Verificando acceso a http://23.105.176.45:8080/$ENDPOINT...${NC}"
  
  # Verificar si la página es accesible
  RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://23.105.176.45:8080/$ENDPOINT")
  
  if [ "$RESPONSE" -eq 200 ]; then
    echo -e "${GREEN}Página /$ENDPOINT es accesible (HTTP $RESPONSE).${NC}"
  else
    echo -e "${RED}Error al acceder a la página /$ENDPOINT (HTTP $RESPONSE).${NC}"
  fi
done

echo -e "\n${GREEN}Verificación completada.${NC}"
echo -e "${YELLOW}Si encontró errores, siga las instrucciones para corregirlos.${NC}"
echo -e "Después de realizar cambios, reinicie los servicios con:"
echo -e "docker-compose -f docker-compose.production.yml down"
echo -e "docker-compose -f docker-compose.production.yml up -d"
