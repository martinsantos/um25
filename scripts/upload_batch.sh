#!/bin/bash
TOKEN="k6P8LAY8_x_y1miB_KTlWnysCnx2Abky"
DIRECTUS_URL="http://localhost:8055"
IMAGES_PATH="/var/www/ultimamilla.com.ar/public/imagenes_antecedentes_versionproduccion"

SUCCESS=0
ERRORS=0

# Extraer datos a archivo temporal
python3 -c '
import json
with open("/tmp/matches.json") as f:
    data = json.load(f)
with open("/tmp/matches_list.txt", "w") as out:
    for item in data:
        out.write(str(item["id"]) + "|" + item["nuevaImagen"] + "\n")
'

TOTAL=$(wc -l < /tmp/matches_list.txt)
echo "Procesando $TOTAL items..."

while IFS="|" read -r ANT_ID IMAGE_FILE; do
    FULL_PATH="$IMAGES_PATH/$IMAGE_FILE"
    
    if [ ! -f "$FULL_PATH" ]; then
        echo "X [$ANT_ID] Imagen no existe"
        ((ERRORS++))
        continue
    fi
    
    echo -n "[$ANT_ID] Subiendo... "
    
    # Subir imagen
    UPLOAD_RESULT=$(curl -s -X POST "$DIRECTUS_URL/files" \
        -H "Authorization: Bearer $TOKEN" \
        -F "file=@$FULL_PATH" 2>/dev/null)
    
    NEW_ID=$(echo "$UPLOAD_RESULT" | grep -oP '"id"\s*:\s*"\K[^"]+' | head -1)
    
    if [ -z "$NEW_ID" ]; then
        echo "X Error al subir"
        ((ERRORS++))
        continue
    fi
    
    # Actualizar antecedente
    curl -s -X PATCH "$DIRECTUS_URL/items/Antecedentes/$ANT_ID" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"Imagen\": \"$NEW_ID\"}" > /dev/null
    
    echo "OK ($NEW_ID)"
    ((SUCCESS++))
    
    sleep 0.3
done < /tmp/matches_list.txt

echo ""
echo "=== COMPLETADO ==="
echo "Exitosos: $SUCCESS"
echo "Errores: $ERRORS"
