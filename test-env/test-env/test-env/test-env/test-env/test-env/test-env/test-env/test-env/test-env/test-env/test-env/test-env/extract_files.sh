#!/bin/bash

# Extraer datos de directus_files del backup
grep -A 10000 "COPY directus_files" backup.sql | grep -B 10000 "\\\\\\." | grep -v "COPY directus_files" | grep -v "\\\\\\." > directus_files_data.txt

# Crear un nuevo archivo SQL con los datos extraídos
cat > restore_files_complete.sql << EOL
-- Crear una tabla temporal para los archivos
CREATE TABLE temp_directus_files (
    id uuid NOT NULL,
    storage character varying(255) NOT NULL,
    filename_disk character varying(255),
    filename_download character varying(255) NOT NULL,
    title character varying(255),
    type character varying(255),
    folder uuid,
    uploaded_by uuid,
    created_on timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by uuid,
    modified_on timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    charset character varying(50),
    filesize bigint,
    width integer,
    height integer,
    duration integer,
    embed character varying(200),
    description text,
    location text,
    tags text,
    metadata json,
    focal_point_x integer,
    focal_point_y integer,
    tus_id character varying(64),
    tus_data json,
    uploaded_on timestamp with time zone
);

-- Copiar datos del backup
COPY temp_directus_files (id, storage, filename_disk, filename_download, title, type, folder, uploaded_by, created_on, modified_by, modified_on, charset, filesize, width, height, duration, embed, description, location, tags, metadata, focal_point_x, focal_point_y, tus_id, tus_data, uploaded_on) FROM stdin;
EOL

# Agregar los datos extraídos
cat directus_files_data.txt >> restore_files_complete.sql

# Agregar el resto del script
cat >> restore_files_complete.sql << EOL
\\.

-- Insertar datos en la tabla directus_files
INSERT INTO directus_files (
    id, storage, filename_disk, filename_download, title, type, folder,
    created_on, modified_on, charset, filesize, width, height,
    duration, embed, description, location, tags, metadata,
    focal_point_x, focal_point_y, tus_id, tus_data, uploaded_on
)
SELECT
    id, storage, filename_disk, filename_download, title, type, folder,
    created_on, modified_on, charset, filesize, width, height,
    duration, embed, description, location, tags, metadata,
    focal_point_x, focal_point_y, tus_id, tus_data, uploaded_on
FROM temp_directus_files;

-- Eliminar la tabla temporal
DROP TABLE temp_directus_files;
EOL

echo "Script de restauración creado: restore_files_complete.sql"
