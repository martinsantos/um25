#!/bin/bash

# Script para corregir problemas de duplicación de tablas

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar que el contenedor de la base de datos esté en ejecución
if ! docker ps | grep -q database; then
  echo -e "${RED}Error: El contenedor de la base de datos no está en ejecución.${NC}"
  exit 1
fi

# Función para ejecutar comandos SQL
exec_sql() {
  docker-compose exec -T database psql -U postgres -d directus -c "$1"
}

echo -e "${YELLOW}Verificando tablas duplicadas...${NC}"

# Verificar si existen las tablas en minúsculas
if exec_sql "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'antecedentes');" | grep -q "t$"; then
  echo -e "${YELLOW}Eliminando tabla duplicada 'antecedentes'...${NC}"
  exec_sql "DROP TABLE IF EXISTS antecedentes CASCADE;"
  exec_sql "DROP TABLE IF EXISTS antecedentes_files CASCADE;"
  
  # Renombrar tablas a minúsculas
  echo -e "${YELLOW}Renombrando tablas a minúsculas...${NC}"
  exec_sql "ALTER TABLE \"Antecedentes\" RENAME TO antecedentes;"
  exec_sql "ALTER TABLE \"Antecedentes_files\" RENAME TO antecedentes_files;"
  
  # Actualizar referencias en directus_collections
  echo -e "${YELLOW}Actualizando referencias en directus_collections...${NC}"
  exec_sql "UPDATE directus_collections SET collection = lower(collection) WHERE collection IN ('Antecedentes', 'Servicios');"
  
  # Actualizar referencias en directus_fields
  echo -e "${YELLOW}Actualizando referencias en directus_fields...${NC}"
  exec_sql "UPDATE directus_fields SET collection = lower(collection) WHERE collection IN ('Antecedentes', 'Servicios');"
  
  # Actualizar referencias en directus_permissions
  echo -e "${YELLOW}Actualizando referencias en directus_permissions...${NC}"
  exec_sql "UPDATE directus_permissions SET collection = lower(collection) WHERE collection IN ('Antecedentes', 'Servicios');"
  
  # Actualizar referencias en directus_presets
  echo -e "${YELLOW}Actualizando referencias en directus_presets...${NC}"
  exec_sql "UPDATE directus_presets SET collection = lower(collection) WHERE collection IN ('Antecedentes', 'Servicios');"
  
  # Actualizar referencias en directus_relations
  echo -e "${YELLOW}Actualizando referencias en directus_relations...${NC}"
  exec_sql "UPDATE directus_relations SET one_collection = lower(one_collection) WHERE one_collection IN ('Antecedentes', 'Servicios');"
  exec_sql "UPDATE directus_relations SET many_collection = lower(many_collection) WHERE many_collection IN ('Antecedentes', 'Servicios');"
  
  echo -e "${GREEN}Tablas corregidas exitosamente.${NC}"
  
  # Verificar si hay datos en las tablas
  echo -e "\n${YELLOW}Verificando datos en las tablas...${NC}"
  echo -e "\n${YELLOW}Antecedentes:${NC}"
  exec_sql "SELECT COUNT(*) as total_antecedentes FROM antecedentes;"
  
  echo -e "\n${YELLOW}Servicios:${NC}"
  exec_sql "SELECT COUNT(*) as total_servicios FROM servicios;"
  
  echo -e "\n${GREEN}Proceso completado. Por favor, verifica en Directus que las colecciones 'antecedentes' y 'servicios' estén visibles y con los datos correctos.${NC}"
  
  # Reiniciar el contenedor de Directus para aplicar los cambios
  echo -e "\n${YELLOW}Reiniciando Directus para aplicar los cambios...${NC}"
  docker-compose restart directus-app
  
  echo -e "\n${GREEN}¡Listo! Puedes acceder a Directus en: http://localhost:8055${NC}"
else
  echo -e "${GREEN}No se encontraron tablas duplicadas.${NC}"
  
  # Verificar si hay datos en las tablas
  echo -e "\n${YELLOW}Verificando datos en las tablas...${NC}"
  echo -e "\n${YELLOW}Antecedentes:${NC}"
  exec_sql "SELECT COUNT(*) as total_antecedentes FROM antecedentes;"
  
  echo -e "\n${YELLOW}Servicios:${NC}"
  exec_sql "SELECT COUNT(*) as total_servicios FROM servicios;"
  
  echo -e "\n${YELLOW}Si no hay datos, podemos intentar restaurar desde el backup.${NC}"
  read -p "¿Deseas restaurar desde el archivo backup.sql? (s/n): " restore_choice
  
  if [[ $restore_choice == "s" || $restore_choice == "S" ]]; then
    echo -e "\n${YELLOW}Restaurando desde backup.sql...${NC}"
    docker-compose exec -T database psql -U postgres -d directus < backup.sql
    
    if [ $? -eq 0 ]; then
      echo -e "\n${GREEN}¡Base de datos restaurada exitosamente!${NC}"
      echo -e "${YELLOW}Reiniciando Directus...${NC}"
      docker-compose restart directus-app
      echo -e "\n${GREEN}¡Listo! Puedes acceder a Directus en: http://localhost:8055${NC}"
    else
      echo -e "\n${RED}Error al restaurar la base de datos.${NC}"
    fi
  fi
fi
