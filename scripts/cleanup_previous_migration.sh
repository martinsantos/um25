#!/bin/bash

# Script para limpiar archivos subidos incorrectamente
# Este script eliminará todos los archivos de la tabla directus_files

# Configuración
DIRECTUS_URL="http://localhost:8055"
TOKEN="k6P8LAY8_x_y1miB_KTlWnysCnx2Abky"

# Obtener la lista de IDs de archivos
echo "Obteniendo lista de archivos existentes..."
FILE_IDS=$(curl -s -X GET "$DIRECTUS_URL/files?limit=-1" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.data[].id' | tr '\n' ' ')

if [ -z "$FILE_IDS" ]; then
  echo "No se encontraron archivos para eliminar."
  exit 0
fi

# Convertir la lista de IDs en un array
IFS=' ' read -r -a ID_ARRAY <<< "$FILE_IDS"
TOTAL_FILES=${#ID_ARRAY[@]}

echo "Se eliminarán $TOTAL_FILES archivos..."

# Eliminar cada archivo
for ((i=0; i<${#ID_ARRAY[@]}; i++)); do
  FILE_ID=${ID_ARRAY[$i]}
  echo -ne "Eliminando archivo $((i+1))/$TOTAL_FILES... "
  
  # Eliminar el archivo
  RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$DIRECTUS_URL/files/$FILE_ID" \
    -H "Authorization: Bearer $TOKEN")
  
  if [ "$RESPONSE" -eq 204 ]; then
    echo "OK"
  else
    echo "Error (Código: $RESPONSE)"
  fi
  
  # Pequeña pausa para no sobrecargar el servidor
  sleep 0.1
done

echo "Limpieza completada."
