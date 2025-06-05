#!/bin/bash

# Script para migrar archivos desde /directus-admin/uploads a Directus
# Este script subirá todos los archivos del directorio especificado

# Configuración
DIRECTUS_URL="http://localhost:8055"
TOKEN="k6P8LAY8_x_y1miB_KTlWnysCnx2Abky"
UPLOADS_DIR="directus-admin/uploads"

# Verificar que el directorio de uploads existe
if [ ! -d "$UPLOADS_DIR" ]; then
  echo "Error: No se encontró el directorio $UPLOADS_DIR"
  exit 1
fi

# Función para obtener el tipo MIME
get_mime_type() {
  local file=$1
  file --mime-type -b "$file"
}

# Función para obtener el tamaño del archivo
get_file_size() {
  local file=$1
  stat -f %z "$file" 2>/dev/null || stat -c %s "$file" 2>/dev/null
}

# Función para obtener dimensiones de imagen
get_image_dimensions() {
  local file=$1
  local mime_type=$(get_mime_type "$file")
  
  if [[ $mime_type == image/* ]]; then
    # Intentar diferentes métodos para obtener dimensiones
    if command -v identify >/dev/null 2>&1; then
      # Usando ImageMagick
      identify -format "%w %h" "$file" 2>/dev/null
    elif command -v sips >/dev/null 2>&1; then
      # Usando sips (macOS)
      sips -g pixelWidth -g pixelHeight "$file" | \
        awk '/pixelWidth/{w=$2} /pixelHeight/{h=$2} END{print w " " h}'
    fi
  fi
  echo ""
}

# Contar archivos para mostrar progreso
TOTAL_FILES=$(find "$UPLOADS_DIR" -type f | wc -l)
CURRENT=0

echo "Iniciando migración de $TOTAL_FILES archivos desde $UPLOADS_DIR..."

# Procesar cada archivo en el directorio de uploads
find "$UPLOADS_DIR" -type f | while read -r file; do
  # Omitir archivos ocultos
  if [[ $(basename "$file") == .* ]]; then
    continue
  fi

  CURRENT=$((CURRENT + 1))
  echo -n "[$CURRENT/$TOTAL_FILES] Procesando: $(basename "$file")... "
  
  # Obtener información del archivo
  filename=$(basename "$file")
  mime_type=$(get_mime_type "$file")
  filesize=$(get_file_size "$file")
  
  # Obtener dimensiones si es una imagen
  dimensions=$(get_image_dimensions "$file")
  width=$(echo "$dimensions" | awk '{print $1}')
  height=$(echo "$dimensions" | awk '{print $2}')
  
  # Extraer título del nombre de archivo (eliminar UUID y extensión)
  title=$(echo "$filename" | sed -E 's/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[-_]?//' | sed 's/\.[^.]*$//')
  
  # Subir el archivo a Directus
  response=$(curl -s -X POST "$DIRECTUS_URL/files" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: multipart/form-data" \
    -F "file=@$file" \
    -F "title=$title" \
    -F "type=$mime_type" \
    -F "filesize=$filesize" \
    -F "width=$width" \
    -F "height=$height" 2>/dev/null)
  
  # Verificar si la subida fue exitosa
  if echo "$response" | grep -q '"id":'; then
    file_id=$(echo "$response" | jq -r '.data.id')
    echo "OK (ID: $file_id)"
  else
    echo "ERROR: $response"
  fi
  
  # Pequeña pausa para no sobrecargar el servidor
  sleep 0.2

done

echo "Migración de archivos completada."
