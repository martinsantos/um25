#!/bin/bash

# Extraer la estructura de la tabla directus_files
docker exec database pg_dump -U myuser -d mydatabase --schema-only -t directus_files > directus_files_schema.sql

# Extraer los datos de directus_files del backup
pg_restore -l backup.dump | grep directus_files > directus_files_list.txt
pg_restore -L directus_files_list.txt backup.dump > directus_files_data.sql

# Restaurar los datos
cat directus_files_schema.sql directus_files_data.sql | docker exec -i database psql -U myuser -d mydatabase

echo "Restauración de archivos completada"
