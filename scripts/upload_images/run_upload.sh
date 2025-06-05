#!/bin/bash

# Copiar las imágenes al contenedor de directus
docker cp local-uploads/uploads directus-app:/directus/uploads/local

# Ejecutar el script de carga dentro del contenedor
docker-compose exec -T directus-app /bin/bash -c "
  # Instalar jq si no está instalado
  if ! command -v jq &> /dev/null; then
    apt-get update && apt-get install -y jq
  fi
  
  # Crear directorio para el script
  mkdir -p /scripts
  
  # Crear el script de carga
  cat > /scripts/upload_images_directus.sh << 'EOL'
  #!/bin/bash
  
  # Configuración
  DIRECTUS_URL="http://localhost:8055"
  TOKEN="k6P8LAY8_x_y1miB_KTlWnysCnx2Abky"
  UPLOADS_DIR="/directus/uploads/local"
  
  # Obtener el ID del usuario administrador
  ADMIN_ID=$(curl -s -X GET "$DIRECTUS_URL/users?filter[email][_eq]=admin@example.com" \
    -H "Authorization: Bearer $TOKEN" | jq -r '.data[0].id')
  
  if [ -z "$ADMIN_ID" ] || [ "$ADMIN_ID" == "null" ]; then
    echo "Error: No se pudo obtener el ID del usuario administrador"
    exit 1
  fi
  
  # Función para subir un archivo a Directus
  upload_file() {
      local file_path="$1"
      local file_name=$(basename "$file_path")
      
      # Verificar si el archivo ya existe en Directus
      local existing_file=$(curl -s -X GET "$DIRECTUS_URL/files?filter[filename_download][_eq]=$file_name" \
          -H "Authorization: Bearer $TOKEN" | jq -r '.data[0]')
      
      if [ "$existing_file" != "null" ] && [ -n "$existing_file" ]; then
          echo "El archivo $file_name ya existe en Directus, omitiendo..."
          echo "$existing_file" | jq -r '.id'
          return 0
      fi
      
      # Subir el archivo
      echo "Subiendo archivo: $file_name"
      
      # Subir el archivo con metadatos
      local response=$(curl -s -X POST "$DIRECTUS_URL/files/import" \
          -H "Authorization: Bearer $TOKEN" \
          -F "file=@$file_path" \
          -F "data={\"title\":\"$file_name\",\"filename_download\":\"$file_name\",\"storage\":\"local\",\"uploaded_by\":\"$ADMIN_ID\"}")
      
      local file_id=$(echo "$response" | jq -r '.data.id')
      
      if [ "$file_id" == "null" ] || [ -z "$file_id" ]; then
          echo "Error al subir el archivo $file_name: $response"
          return 1
      fi
      
      echo "Archivo subido correctamente con ID: $file_id"
      echo "$file_id"
  }
  
  # Procesar archivos
  for file_path in "$UPLOADS_DIR"/*.{jpg,jpeg,png}; do
      if [ -f "$file_path" ]; then
          echo "Procesando: $file_path"
          file_id=$(upload_file "$file_path")
          
          if [ $? -eq 0 ] && [ -n "$file_id" ]; then
              # Extraer el ID del post del nombre del archivo
              file_name=$(basename "$file_path")
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
                      echo "Vinculando imagen $file_id a $collection con ID $post_id"
                      response=$(curl -s -X PATCH "$DIRECTUS_URL/items/$collection/$post_id" \
                          -H "Authorization: Bearer $TOKEN" \
                          -H "Content-Type: application/json" \
                          -d "{\"Imagen\": \"$file_id\"}")
                      echo "Respuesta de vinculación: $response"
                  else
                      echo "El post con ID $post_id no existe en la colección $collection"
                  fi
              else
                  echo "No se pudo extraer un ID de post válido de: $file_name"
              fi
          fi
      fi
  done
  
  echo "Proceso completado."
  EOL
  
  # Hacer el script ejecutable
  chmod +x /scripts/upload_images_directus.sh
  
  # Ejecutar el script
  /scripts/upload_images_directus.sh
"
