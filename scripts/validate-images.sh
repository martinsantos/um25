#!/bin/bash

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Iniciando validación de imágenes...${NC}\n"

# 1. Verificar imágenes en Directus
echo -e "${YELLOW}1. Verificando imágenes en Directus...${NC}"
curl -s -H "Authorization: Bearer $(curl -s -X POST http://localhost:8055/auth/login -H "Content-Type: application/json" -d '{"email":"admin@example.com","password":"d1r3ctu5"}' | jq -r '.data.access_token')" http://localhost:8055/files | jq '.data[] | {id, title, type, width, height}'

# 2. Verificar imágenes en el sistema de archivos
echo -e "\n${YELLOW}2. Verificando imágenes en el sistema de archivos...${NC}"
for img in public/images/*; do
    if [ -f "$img" ]; then
        echo -e "${GREEN}✅ Encontrada:${NC} $img"
        # Verificar tipo de archivo
        file_type=$(file -b --mime-type "$img")
        echo -e "   Tipo: $file_type"
        # Verificar dimensiones si es una imagen
        if [[ $file_type == image/* ]]; then
            dimensions=$(identify -format "%wx%h" "$img" 2>/dev/null)
            if [ $? -eq 0 ]; then
                echo -e "   Dimensiones: $dimensions"
            else
                echo -e "${RED}❌ No se pudieron obtener dimensiones${NC}"
            fi
        fi
    else
        echo -e "${RED}❌ No encontrada:${NC} $img"
    fi
done

# 3. Verificar referencias en la base de datos
echo -e "\n${YELLOW}3. Verificando referencias en la base de datos...${NC}"
docker exec -it database psql -U postgres -d directus -c "
SELECT 
    a.id as antecedente_id,
    a.titulo,
    i.id as imagen_id,
    i.filename_disk,
    i.type as mime_type,
    i.width,
    i.height
FROM antecedentes a
LEFT JOIN directus_files i ON a.imagen = i.id
WHERE a.imagen IS NOT NULL;"

# 4. Verificar permisos de archivos
echo -e "\n${YELLOW}4. Verificando permisos de archivos...${NC}"
ls -l public/images/

# 5. Verificar optimización de imágenes
echo -e "\n${YELLOW}5. Verificando optimización de imágenes...${NC}"
for img in public/images/*; do
    if [ -f "$img" ]; then
        size=$(du -h "$img" | cut -f1)
        echo -e "${GREEN}✅ Archivo:${NC} $img"
        echo -e "   Tamaño: $size"
        # Verificar si es WebP
        if [[ $img == *.webp ]]; then
            echo -e "   ✅ Formato WebP (optimizado)"
        else
            echo -e "   ⚠️ Considerar convertir a WebP para optimización"
        fi
    fi
done

echo -e "\n${GREEN}Validación de imágenes completada${NC}" 