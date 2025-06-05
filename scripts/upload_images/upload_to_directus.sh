#!/bin/bash

# Configuración
DIRECTUS_URL="http://localhost:8055"
TOKEN="k6P8LAY8_x_y1miB_KTlWnysCnx2Abky"
UPLOADS_DIR="./local-uploads/uploads"
TEMP_DIR="./temp_uploads"

# Crear directorio temporal
mkdir -p "$TEMP_DIR"

# Función para subir un archivo a Directus
upload_file() {
    local file_path="$1"
    local file_name=$(basename "$file_path")
    
    # Verificar si el archivo ya existe en Directus
    local existing_file=$(curl -s -X GET "$DIRECTUS_URL/files?filter[filename_download][_eq]=$file_name" \
        -H "Authorization: Bearer $TOKEN" | jq -r '.data[0]')
    
    if [ "$existing_file" != "null" ]; then
        echo "El archivo $file_name ya existe en Directus, omitiendo..."
        echo "$existing_file" | jq -r '.id'
        return 0
    fi
    
    # Subir el archivo
    echo "Subiendo archivo: $file_name"
    local response=$(curl -s -X POST "$DIRECTUS_URL/files/import" \
        -H "Authorization: Bearer $TOKEN" \
        -F "file=@$file_path")
    
    local file_id=$(echo "$response" | jq -r '.data.id')
    
    if [ "$file_id" == "null" ] || [ -z "$file_id" ]; then
        echo "Error al subir el archivo $file_name: $response"
        return 1
    fi
    
    echo "Archivo subido correctamente con ID: $file_id"
    echo "$file_id"
}

# Función para vincular una imagen a un post
link_image_to_post() {
    local collection="$1"
    local post_id="$2"
    local file_id="$3"
    
    echo "Vinculando imagen $file_id a $collection con ID $post_id"
    
    # Actualizar el campo de imagen en el post
    curl -s -X PATCH "$DIRECTUS_URL/items/$collection/$post_id" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"imagen\": \"$file_id\"}" | jq .
}

# Procesar archivos
for file_path in "$UPLOADS_DIR"/*.{jpg,jpeg,png}; do
    if [ -f "$file_path" ]; then
        echo "Procesando: $file_path"
        file_id=$(upload_file "$file_path")
        
        if [ $? -eq 0 ] && [ -n "$file_id" ]; then
            # Extraer el ID del post del nombre del archivo (asumiendo formato: postid_uuid.extension)
            post_id=$(basename "$file_path" | cut -d '_' -f 1)
            
            # Determinar la colección basada en el directorio o nombre de archivo
            # Esto es un ejemplo, ajusta según tu estructura
            if [[ "$file_path" == *"antecedentes"* ]] || [[ "$file_path" == *"ant_"* ]]; then
                collection="Antecedentes"
            else
                collection="Servicios"
            fi
            
            # Vincular la imagen al post
            link_image_to_post "$collection" "$post_id" "$file_id"
        fi
    fi
done

echo "Proceso completado."
