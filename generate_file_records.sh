#!/bin/bash

# Conectarse al contenedor de Docker y ejecutar el siguiente script
ssh root@23.105.176.45 "cd /root/um25 && docker run --rm -v um25_directus_uploads:/directus/uploads alpine find /directus/uploads -type f -not -path \"*/\\.*\" -not -name \"*__*\" | sort > /tmp/files_list.txt && docker cp /tmp/files_list.txt database:/tmp/ && docker exec database bash -c 'cat > /tmp/generate_records.sql << EOL
-- Limpiar la tabla directus_files
DELETE FROM directus_files;

-- Crear una función para generar registros de archivos
CREATE OR REPLACE FUNCTION generate_file_records() RETURNS void AS \\\$\\\$
DECLARE
    file_path text;
    file_name text;
    file_id uuid;
    file_type text;
BEGIN
    -- Leer la lista de archivos
    FOR file_path IN EXECUTE 'SELECT unnest(string_to_array(pg_read_file(''/tmp/files_list.txt''), E''\\n'')) WHERE length(trim(unnest)) > 0'
    LOOP
        -- Extraer el nombre del archivo
        file_name := substring(file_path from '/([^/]+)$');
        
        -- Solo procesar archivos que no son derivados (no contienen __)
        IF file_name NOT LIKE '%__%' THEN
            -- Extraer el ID del archivo (los primeros 36 caracteres)
            file_id := substring(file_name from 1 for 36)::uuid;
            
            -- Determinar el tipo de archivo basado en la extensión
            IF file_name LIKE '%.png' THEN
                file_type := 'image/png';
            ELSIF file_name LIKE '%.jpg' OR file_name LIKE '%.jpeg' THEN
                file_type := 'image/jpeg';
            ELSIF file_name LIKE '%.gif' THEN
                file_type := 'image/gif';
            ELSIF file_name LIKE '%.pdf' THEN
                file_type := 'application/pdf';
            ELSE
                file_type := 'application/octet-stream';
            END IF;
            
            -- Insertar el registro
            INSERT INTO directus_files (
                id, storage, filename_disk, filename_download, title, type,
                created_on, modified_on
            )
            VALUES (
                file_id, 'local', file_name, file_name, file_name, file_type,
                NOW(), NOW()
            );
        END IF;
    END LOOP;
END;
\\\$\\\$ LANGUAGE plpgsql;

-- Ejecutar la función
SELECT generate_file_records();
EOL
' && docker exec database psql -U myuser -d mydatabase -f /tmp/generate_records.sql"
