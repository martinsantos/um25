#!/bin/bash
# Script para subir imágenes AI y asignar a antecedentes por sector

TOKEN="k6P8LAY8_x_y1miB_KTlWnysCnx2Abky"
DIRECTUS_URL="http://localhost:8055"

# Mapeo de sector a imagen
declare -A SECTOR_IMAGES
SECTOR_IMAGES["salud_hospital_it"]="Salud"
SECTOR_IMAGES["hospital_cabling"]="Salud"
SECTOR_IMAGES["nuclear_medicine_it"]="Salud"
SECTOR_IMAGES["gobierno_datacenter"]="Gobierno"
SECTOR_IMAGES["municipalidad_redes"]="Gobierno"
SECTOR_IMAGES["fire_detection_system"]="Incendios"
SECTOR_IMAGES["cctv_surveillance"]="Video"
SECTOR_IMAGES["corporate_it_services"]="Servicios"
SECTOR_IMAGES["security_installation"]="Seguridad"
SECTOR_IMAGES["fiber_optic_install"]="Fibra"
SECTOR_IMAGES["winery_it_system"]="Bodega"
SECTOR_IMAGES["mining_network"]="Mineria"
SECTOR_IMAGES["telecom_tower"]="Telecom"
SECTOR_IMAGES["server_room_modern"]="Tecnologicas"
SECTOR_IMAGES["electrical_panel"]="Electrico"
SECTOR_IMAGES["ups_backup_power"]="UPS"
SECTOR_IMAGES["access_control"]="Acceso"

IMAGES_DIR="/tmp/ai_images"

echo "=== SUBIDA DE IMAGENES AI A DIRECTUS ==="
echo ""

UPLOADED=0
for IMG in "$IMAGES_DIR"/*.png; do
    [ -f "$IMG" ] || continue
    BASENAME=$(basename "$IMG" .png | sed 's/_[0-9]*$//')
    
    echo -n "Subiendo: $BASENAME... "
    
    RESULT=$(curl -s -X POST "$DIRECTUS_URL/files" \
        -H "Authorization: Bearer $TOKEN" \
        -F "file=@$IMG")
    
    NEW_ID=$(echo "$RESULT" | grep -oP '"id"\s*:\s*"\K[^"]+' | head -1)
    
    if [ -z "$NEW_ID" ]; then
        echo "ERROR"
        continue
    fi
    
    echo "OK ($NEW_ID)"
    echo "$BASENAME|$NEW_ID" >> /tmp/uploaded_ai_images.txt
    ((UPLOADED++))
done

echo ""
echo "=== IMAGENES SUBIDAS: $UPLOADED ==="
echo ""
echo "Archivo de IDs: /tmp/uploaded_ai_images.txt"
