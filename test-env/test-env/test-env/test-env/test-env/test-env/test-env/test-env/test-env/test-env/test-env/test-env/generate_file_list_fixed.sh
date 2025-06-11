#!/bin/bash

# Este script genera una lista de archivos SQL para insertar en la base de datos

# Conectarse al servidor y generar la lista de archivos
ssh root@23.105.176.45 "cd /root/um25 && docker run --rm -v um25_directus_uploads:/directus/uploads alpine sh -c 'cd /directus/uploads && find . -type f -not -path \"*/\\.*\" -not -name \"*__*\" | sort' > /tmp/files.txt"

# Descargar la lista de archivos
scp root@23.105.176.45:/tmp/files.txt .

# Generar el script SQL
echo "-- Limpiar la tabla directus_files" > restore_all_files.sql
echo "DELETE FROM directus_files;" >> restore_all_files.sql
echo "" >> restore_all_files.sql
echo "-- Insertar registros para cada archivo" >> restore_all_files.sql
echo "INSERT INTO directus_files (id, storage, filename_disk, filename_download, title, type, created_on, modified_on)" >> restore_all_files.sql
echo "VALUES " >> restore_all_files.sql

# Procesar cada archivo
first=true
while read -r file; do
    # Eliminar el ./ del inicio
    file=${file#./}
    
    # Extraer el nombre del archivo sin la ruta
    filename=$(basename "$file")
    
    # Verificar si el nombre del archivo tiene un formato UUID válido (36 caracteres)
    if [[ ${#filename} -lt 36 || "${filename:0:36}" == *[^0-9a-fA-F-]* ]]; then
        echo "Saltando archivo no válido: $filename" >&2
        continue
    fi
    
    # Extraer el ID del archivo (los primeros 36 caracteres)
    id=${filename:0:36}
    
    # Determinar el tipo de archivo basado en la extensión
    if [[ $filename == *.png ]]; then
        type="image/png"
    elif [[ $filename == *.jpg || $filename == *.jpeg ]]; then
        type="image/jpeg"
    elif [[ $filename == *.gif ]]; then
        type="image/gif"
    elif [[ $filename == *.pdf ]]; then
        type="application/pdf"
    else
        type="application/octet-stream"
    fi
    
    # Agregar coma si no es el primer elemento
    if [ "$first" = true ]; then
        first=false
    else
        echo "," >> restore_all_files.sql
    fi
    
    # Agregar la inserción
    echo "('$id', 'local', '$filename', '$filename', '$filename', '$type', NOW(), NOW())" >> restore_all_files.sql
done < files.txt

# Finalizar el script SQL
echo ";" >> restore_all_files.sql

# Subir el script SQL al servidor
scp restore_all_files.sql root@23.105.176.45:/root/um25/

# Ejecutar el script SQL
ssh root@23.105.176.45 "cd /root/um25 && cat restore_all_files.sql | docker exec -i database psql -U myuser -d mydatabase"

echo "Restauración de archivos completada"
