#!/bin/bash

# Configuración
DIRECTUS_URL="http://localhost:8055"
TOKEN="k6P8LAY8_x_y1miB_KTlWnysCnx2Abky"
UPLOADS_DIR="./local-uploads/uploads"
LOG_FILE="./upload_log.txt"

# Obtener el ID del usuario administrador
ADMIN_ID=$(curl -s -X GET "$DIRECTUS_URL/users/me" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.data.id')

if [ -z "$ADMIN_ID" ] || [ "$ADMIN_ID" == "null" ]; then
  echo "Error: No se pudo obtener el ID del usuario administrador" | tee -a "$LOG_FILE"
  exit 1
fi

echo "Iniciando carga de archivos..." | tee -a "$LOG_FILE"
echo "ID del administrador: $ADMIN_ID" | tee -a "$LOG_FILE"

# Procesar archivos
for file_path in "$UPLOADS_DIR"/*.{jpg,jpeg,png}; do
    if [ -f "$file_path" ]; then
        file_name=$(basename "$file_path")
        echo "\nProcesando: $file_name" | tee -a "$LOG_FILE"
        
        # Verificar si el archivo ya existe en Directus
        existing_file=$(curl -s -X GET "$DIRECTUS_URL/files?filter[filename_download][_eq]=$file_name" \
            -H "Authorization: Bearer $TOKEN" | jq -r '.data[0]')
        
        if [ "$existing_file" != "null" ] && [ -n "$existing_file" ]; then
            file_id=$(echo "$existing_file" | jq -r '.id')
            echo "El archivo ya existe en Directus con ID: $file_id" | tee -a "$LOG_FILE"
        else
            # Subir el archivo
            echo "Subiendo archivo: $file_name" | tee -a "$LOG_FILE"
            
            # Crear un archivo temporal con los metadatos
            temp_meta=$(mktemp)
            cat > "$temp_meta" <<- EOM
{
  "title": "$file_name",
  "filename_download": "$file_name",
  "storage": "local",
  "uploaded_by": "$ADMIN_ID"
}
EOM
            
            # Subir el archivo con metadatos
            response=$(curl -s -X POST "$DIRECTUS_URL/files/import" \
                -H "Authorization: Bearer $TOKEN" \
                -F "file=@$file_path" \
                -F "data=@$temp_meta")
            
            # Limpiar archivo temporal
            rm -f "$temp_meta"
            
            file_id=$(echo "$response" | jq -r '.data.id')
            
            if [ "$file_id" == "null" ] || [ -z "$file_id" ]; then
                echo "Error al subir el archivo $file_name: $response" | tee -a "$LOG_FILE"
                continue
            fi
            
            echo "Archivo subido correctamente con ID: $file_id" | tee -a "$LOG_FILE"
        fi
        
        # Extraer el ID del post del nombre del archivo (asumiendo formato: postid_uuid.extension)
        post_id=$(echo "$file_name" | cut -d '_' -f 1)
        
        # Verificar si el ID del post es un número
        if [[ $post_id =~ ^[0-9]+$ ]]; then
            # Determinar la colección basada en el nombre del archivo
            if [[ "$file_name" == *"ant_"* ]] || [[ "$file_name" =~ ^[0-9]+_ant_ ]]; then
                collection="Antecedentes"
            else
                collection="Servicios"
            fi
            
            # Verificar si el post existe
            post_exists=$(curl -s -X GET "$DIRECTUS_URL/items/$collection/$post_id" \
                -H "Authorization: Bearer $TOKEN" | jq -r '.data.id')
            
            if [ "$post_exists" != "null" ] && [ -n "$post_exists" ]; then
                # Actualizar el campo de imagen en el post
                echo "Vinculando imagen $file_id a $collection con ID $post_id" | tee -a "$LOG_FILE"
                response=$(curl -s -X PATCH "$DIRECTUS_URL/items/$collection/$post_id" \
                    -H "Authorization: Bearer $TOKEN" \
                    -H "Content-Type: application/json" \
                    -d "{\"Imagen\": \"$file_id\"}")
                echo "Respuesta de vinculación: $response" | tee -a "$LOG_FILE"
            else
                echo "El post con ID $post_id no existe en la colección $collection" | tee -a "$LOG_FILE"
            fi
        else
            echo "No se pudo extraer un ID de post válido de: $file_name" | tee -a "$LOG_FILE"
        fi
    fi
done

echo "\nProceso completado. Ver el archivo $LOG_FILE para más detalles." | tee -a "$LOG_FILE"
