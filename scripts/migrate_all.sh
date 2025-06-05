#!/bin/bash

# Script principal para la migración completa
# Este script coordina la limpieza, restauración de la base de datos y migración de archivos

# Colores para mensajes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Iniciando proceso de migración corregido ===${NC}"

# Hacer ejecutables los scripts
chmod +x scripts/*.sh

# 1. Limpiar migración anterior
echo -e "\n${YELLOW}1. Limpiando migración anterior...${NC}"
./scripts/cleanup_previous_migration.sh

if [ $? -ne 0 ]; then
  echo -e "${RED}Error al limpiar la migración anterior.${NC}"
  exit 1
fi

# 2. Restaurar la base de datos
echo -e "\n${YELLOW}2. Restaurando base de datos...${NC}"
./scripts/restore_database.sh

if [ $? -ne 0 ]; then
  echo -e "${RED}Error al restaurar la base de datos.${NC}"
  exit 1
fi

# 3. Migrar archivos desde el directorio correcto
echo -e "\n${YELLOW}3. Migrando archivos desde /directus-admin/uploads...${NC}"
./scripts/migrate_correct_files.sh

if [ $? -ne 0 ]; then
  echo -e "${RED}Error al migrar los archivos.${NC}"
  exit 1
fi

echo -e "\n${GREEN}=== ¡Migración completada con éxito! ===${NC}"
echo "Se han restaurado la base de datos y migrado los archivos correctamente."
