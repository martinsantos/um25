#!/bin/bash

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Iniciando validación de base de datos...${NC}\n"

# 1. Verificar estructura de tablas
echo -e "${YELLOW}1. Verificando estructura de tablas...${NC}"
docker exec -it database psql -U postgres -d directus -c "
SELECT table_name, 
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
ORDER BY table_name;"

# 2. Verificar relaciones
echo -e "\n${YELLOW}2. Verificando relaciones...${NC}"
docker exec -it database psql -U postgres -d directus -c "
SELECT
    tc.table_schema, 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY';"

# 3. Verificar índices
echo -e "\n${YELLOW}3. Verificando índices...${NC}"
docker exec -it database psql -U postgres -d directus -c "
SELECT
    tablename,
    indexname,
    indexdef
FROM
    pg_indexes
WHERE
    schemaname = 'public'
ORDER BY
    tablename,
    indexname;"

# 4. Verificar conteo de registros
echo -e "\n${YELLOW}4. Verificando conteo de registros...${NC}"
docker exec -it database psql -U postgres -d directus -c "
SELECT 
    table_name,
    (SELECT COUNT(*) FROM public.\"${table_name}\") as record_count
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;"

# 5. Verificar integridad de datos
echo -e "\n${YELLOW}5. Verificando integridad de datos...${NC}"
docker exec -it database psql -U postgres -d directus -c "
SELECT 
    'antecedentes' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN titulo IS NULL THEN 1 END) as null_titulos,
    COUNT(CASE WHEN descripcion IS NULL THEN 1 END) as null_descripciones,
    COUNT(CASE WHEN imagen IS NULL THEN 1 END) as null_imagenes
FROM antecedentes;"

# 6. Verificar registros huérfanos
echo -e "\n${YELLOW}6. Verificando registros huérfanos...${NC}"
docker exec -it database psql -U postgres -d directus -c "
SELECT COUNT(*) as orphaned_records 
FROM antecedentes a 
LEFT JOIN directus_files i ON a.imagen = i.id 
WHERE a.imagen IS NOT NULL AND i.id IS NULL;"

echo -e "\n${GREEN}Validación de base de datos completada${NC}" 