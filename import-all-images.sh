#!/bin/bash

# ================================================================
# 🖼️ IMPORTACIÓN COMPLETA DE IMÁGENES - ULTIMA MILLA
# ================================================================
# Importa todas las imágenes de antecedentes según solucionfinal.md
# Mapea UUIDs correctamente y crea registros en directus_files

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # Sin color

# Variables de configuración
DB_USER="myuser"
DB_PASSWORD="mypassword123"
DB_NAME="mydatabase"
UPLOADS_DIR="./uploads"
IMAGES_SOURCE_DIR="./imagenes_antecedentes_versionproduccion"
PUBLIC_IMAGES_DIR="./public/imagenes_antecedentes_versionproduccion"

log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# ================================================================
# FASE 1: VERIFICACIÓN DEL ENTORNO
# ================================================================
log "🔍 FASE 1: VERIFICANDO ENTORNO"
echo "==============================="

# Verificar que Docker esté funcionando
if ! docker-compose ps | grep -q "Up"; then
    error "Los contenedores no están corriendo. Ejecuta primero: ./setup-complete-stack.sh"
fi

# Verificar directorios de imágenes
if [ ! -d "$IMAGES_SOURCE_DIR" ] && [ ! -d "$PUBLIC_IMAGES_DIR" ]; then
    warning "No se encuentran directorios de imágenes. Buscando imágenes..."
    
    # Buscar imágenes en ubicaciones alternativas
    for dir in "public/imagenes_antecedentes_versionproduccion" "imagenes_antecedentes_versionproduccion" "public/images" "assets/images"; do
        if [ -d "$dir" ]; then
            info "✅ Encontrado directorio de imágenes: $dir"
            IMAGES_SOURCE_DIR="$dir"
            break
        fi
    done
    
    if [ ! -d "$IMAGES_SOURCE_DIR" ]; then
        error "No se encontró ningún directorio de imágenes. Verifica que las imágenes estén disponibles."
    fi
fi

# Crear directorios necesarios
mkdir -p "$UPLOADS_DIR"
chmod 755 "$UPLOADS_DIR"

log "✅ Entorno verificado"

# ================================================================
# FASE 2: ANÁLISIS DE IMÁGENES DISPONIBLES
# ================================================================
log "📊 FASE 2: ANALIZANDO IMÁGENES DISPONIBLES"
echo "==========================================="

# Contar imágenes disponibles
if [ -d "$IMAGES_SOURCE_DIR" ]; then
    image_count=$(find "$IMAGES_SOURCE_DIR" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.gif" -o -iname "*.webp" \) | wc -l)
    info "📁 Imágenes encontradas en $IMAGES_SOURCE_DIR: $image_count"
fi

if [ -d "$PUBLIC_IMAGES_DIR" ]; then
    public_image_count=$(find "$PUBLIC_IMAGES_DIR" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.gif" -o -iname "*.webp" \) | wc -l)
    info "📁 Imágenes encontradas en $PUBLIC_IMAGES_DIR: $public_image_count"
fi

# ================================================================
# FASE 3: EXTRAER MAPEO DE IMÁGENES DESDE ANTECEDENTES
# ================================================================
log "🗺️ FASE 3: EXTRAYENDO MAPEO DE IMÁGENES"
echo "======================================="

info "Analizando archivos de datos para extraer UUIDs de imágenes..."

# Crear script Node.js para extraer mapeo
cat > /tmp/extract_image_mapping.js << 'EOF'
const fs = require('fs');
const path = require('path');

// Leer archivos de datos
const antecedentesFile = fs.readFileSync('./src/data/antecedentes_completos.js', 'utf8');
const serviciosFile = fs.readFileSync('./src/data/servicios_completos.js', 'utf8');

// Extraer datos
const antecedentesMatch = antecedentesFile.match(/export const antecedentesReales = (\[[\s\S]*?\]);/);
const serviciosMatch = serviciosFile.match(/export const serviciosReales = (\[[\s\S]*?\]);/);

let imageMapping = {};
let totalImages = 0;

if (antecedentesMatch) {
    const antecedentesData = eval(antecedentesMatch[1]);
    antecedentesData.forEach(item => {
        if (item.Imagen && item.Imagen !== 'NULL') {
            imageMapping[item.Imagen] = {
                type: 'antecedente',
                id: item.id,
                title: item.Titulo,
                client: item.Cliente
            };
            totalImages++;
        }
    });
    console.log(`✅ Procesados ${antecedentesData.length} antecedentes`);
}

if (serviciosMatch) {
    const serviciosData = eval(serviciosMatch[1]);
    serviciosData.forEach(item => {
        if (item.Imagen && item.Imagen !== 'NULL') {
            if (!imageMapping[item.Imagen]) {
                imageMapping[item.Imagen] = {
                    type: 'servicio',
                    id: item.id,
                    title: item.Titulo,
                    client: item.Cliente
                };
                totalImages++;
            }
        }
    });
    console.log(`✅ Procesados ${serviciosData.length} servicios`);
}

// Guardar mapeo
fs.writeFileSync('/tmp/image_mapping.json', JSON.stringify(imageMapping, null, 2));
console.log(`🖼️ Total de imágenes únicas mapeadas: ${totalImages}`);

// Crear lista de UUIDs
const uuids = Object.keys(imageMapping);
fs.writeFileSync('/tmp/image_uuids.txt', uuids.join('\n'));
console.log(`📝 Lista de UUIDs guardada: ${uuids.length} UUIDs`);
EOF

# Ejecutar el script
node /tmp/extract_image_mapping.js

if [ ! -f "/tmp/image_mapping.json" ]; then
    error "No se pudo generar el mapeo de imágenes"
fi

mapped_images=$(wc -l < /tmp/image_uuids.txt)
log "✅ Mapeo extraído: $mapped_images imágenes únicas"

# ================================================================
# FASE 4: BUSCAR Y COPIAR IMÁGENES
# ================================================================
log "📂 FASE 4: BUSCANDO Y COPIANDO IMÁGENES"
echo "========================================"

info "Buscando archivos de imagen por UUID..."

found_images=0
missing_images=0

# Crear directorio temporal para mapeo
mkdir -p /tmp/found_images

# Función para buscar imagen por UUID
find_image_by_uuid() {
    local uuid=$1
    local found_file=""
    
    # Buscar en directorios de imágenes
    for dir in "$IMAGES_SOURCE_DIR" "$PUBLIC_IMAGES_DIR"; do
        if [ -d "$dir" ]; then
            # Buscar archivos que contengan el UUID
            found_file=$(find "$dir" -type f \( -iname "*${uuid}*" -o -iname "${uuid}.*" \) | head -1)
            if [ -n "$found_file" ]; then
                break
            fi
        fi
    done
    
    echo "$found_file"
}

# Procesar cada UUID
while IFS= read -r uuid; do
    if [ -n "$uuid" ]; then
        found_file=$(find_image_by_uuid "$uuid")
        
        if [ -n "$found_file" ]; then
            # Determinar extensión
            extension="${found_file##*.}"
            target_file="$UPLOADS_DIR/${uuid}.${extension}"
            
            # Copiar archivo
            cp "$found_file" "$target_file"
            echo "${uuid}.${extension}" >> /tmp/found_images/list.txt
            
            info "✅ Copiado: $(basename "$found_file") -> ${uuid}.${extension}"
            found_images=$((found_images + 1))
        else
            echo "$uuid" >> /tmp/found_images/missing.txt
            warning "❌ No encontrado: $uuid"
            missing_images=$((missing_images + 1))
        fi
    fi
done < /tmp/image_uuids.txt

log "📊 Resultados de copia:"
echo "   • Imágenes encontradas: $found_images"
echo "   • Imágenes faltantes: $missing_images"

# ================================================================
# FASE 5: IMPORTAR METADATOS A DIRECTUS_FILES
# ================================================================
log "🗄️ FASE 5: IMPORTANDO METADATOS A DIRECTUS"
echo "==========================================="

info "Generando script SQL para directus_files..."

# Crear script SQL de importación
cat > /tmp/import_files.sql << 'SQL'
-- Limpiar tabla de archivos si existe data previa
DELETE FROM directus_files WHERE storage = 'local';

-- Importar metadatos de archivos
SQL

# Generar registros para cada imagen encontrada
if [ -f "/tmp/found_images/list.txt" ]; then
    while IFS= read -r filename; do
        if [ -n "$filename" ]; then
            uuid="${filename%.*}"
            extension="${filename##*.}"
            
            # Obtener información del archivo
            filepath="$UPLOADS_DIR/$filename"
            if [ -f "$filepath" ]; then
                filesize=$(stat -f%z "$filepath" 2>/dev/null || stat -c%s "$filepath" 2>/dev/null || echo "0")
                
                # Obtener dimensiones si es imagen
                width="NULL"
                height="NULL"
                if command -v identify &> /dev/null; then
                    dimensions=$(identify -format "%wx%h" "$filepath" 2>/dev/null || echo "0x0")
                    width=$(echo "$dimensions" | cut -d'x' -f1)
                    height=$(echo "$dimensions" | cut -d'x' -f2)
                    if [ "$width" = "0" ] || [ "$height" = "0" ]; then
                        width="NULL"
                        height="NULL"
                    fi
                fi
                
                # Determinar tipo MIME
                mime_type="image/jpeg"
                case "$extension" in
                    png) mime_type="image/png" ;;
                    gif) mime_type="image/gif" ;;
                    webp) mime_type="image/webp" ;;
                esac
                
                # Generar título desde mapeo
                title="Imagen $uuid"
                if [ -f "/tmp/image_mapping.json" ]; then
                    title=$(node -e "
                        const mapping = JSON.parse(require('fs').readFileSync('/tmp/image_mapping.json'));
                        const info = mapping['$uuid'];
                        if (info) {
                            console.log(info.title.substring(0, 200));
                        } else {
                            console.log('Imagen $uuid');
                        }
                    " 2>/dev/null || echo "Imagen $uuid")
                fi
                
                # Sanitizar título para SQL
                title=$(echo "$title" | sed "s/'/''/g")
                
                cat >> /tmp/import_files.sql << SQL
INSERT INTO directus_files (
    id, storage, filename_disk, filename_download, title, type, 
    filesize, width, height, uploaded_on, created_on, modified_on
) VALUES (
    '$uuid', 'local', '$filename', '$filename', '$title', '$mime_type',
    $filesize, $width, $height, NOW(), NOW(), NOW()
);

SQL
            fi
        fi
    done < /tmp/found_images/list.txt
fi

info "Ejecutando importación en la base de datos..."
docker cp /tmp/import_files.sql $(docker-compose ps -q database):/tmp/import_files.sql
docker-compose exec -T database psql -U ${DB_USER} -d ${DB_NAME} -f /tmp/import_files.sql

# Verificar importación
files_count=$(docker-compose exec -T database psql -U ${DB_USER} -d ${DB_NAME} -t -c "SELECT COUNT(*) FROM directus_files WHERE storage = 'local';" | tr -d ' ')
log "✅ Importados $files_count archivos a directus_files"

# ================================================================
# FASE 6: CONFIGURAR PERMISOS DE ARCHIVOS
# ================================================================
log "🔐 FASE 6: CONFIGURANDO PERMISOS DE ARCHIVOS"
echo "============================================"

info "Configurando permisos públicos para directus_files..."

# Obtener token de administrador
admin_token=$(curl -s -X POST http://localhost:8055/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"d1r3ctu5"}' | \
  grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -n "$admin_token" ]; then
    # Configurar permisos de lectura pública para directus_files
    curl -s -X POST http://localhost:8055/permissions \
      -H "Authorization: Bearer $admin_token" \
      -H "Content-Type: application/json" \
      -d '{
        "collection": "directus_files",
        "action": "read",
        "role": null,
        "permissions": {},
        "fields": ["*"]
      }' > /dev/null
    
    info "✅ Permisos públicos configurados para archivos"
else
    warning "No se pudo obtener token de administrador para configurar permisos"
fi

# ================================================================
# FASE 7: REINICIAR SERVICIOS Y VERIFICAR
# ================================================================
log "🔄 FASE 7: REINICIANDO SERVICIOS"
echo "================================="

info "Reiniciando Directus para aplicar cambios..."
docker-compose restart directus-app

info "Esperando que Directus se reinicie..."
sleep 15

# Verificar que Directus esté respondiendo
timeout=30
counter=0
while ! curl -s http://localhost:8055/server/health | grep -q "ok" 2>/dev/null; do
    if [ $counter -ge $timeout ]; then
        warning "Directus puede estar iniciándose aún"
        break
    fi
    sleep 2
    counter=$((counter + 2))
    echo -n "."
done
echo ""

log "✅ Servicios reiniciados"

# ================================================================
# FASE 8: VERIFICACIÓN FINAL
# ================================================================
log "✅ FASE 8: VERIFICACIÓN FINAL"
echo "=============================="

info "Verificando importación completa..."

# Estadísticas finales
echo "📊 Estadísticas finales:"
echo "   • Archivos en directus_files: $(docker-compose exec -T database psql -U ${DB_USER} -d ${DB_NAME} -t -c 'SELECT COUNT(*) FROM directus_files;' | tr -d ' ')"
echo "   • Antecedentes con imagen: $(docker-compose exec -T database psql -U ${DB_USER} -d ${DB_NAME} -t -c 'SELECT COUNT(*) FROM antecedentes WHERE "Imagen" IS NOT NULL;' | tr -d ' ')"
echo "   • Servicios con imagen: $(docker-compose exec -T database psql -U ${DB_USER} -d ${DB_NAME} -t -c 'SELECT COUNT(*) FROM "Servicios" WHERE "Imagen" IS NOT NULL;' | tr -d ' ')"
echo "   • Archivos físicos en uploads: $(ls -1 "$UPLOADS_DIR" | wc -l)"

# Probar acceso a una imagen
if [ -f "/tmp/found_images/list.txt" ]; then
    first_image=$(head -1 /tmp/found_images/list.txt)
    if [ -n "$first_image" ]; then
        uuid="${first_image%.*}"
        info "🧪 Probando acceso a imagen: $uuid"
        if curl -s "http://localhost:8055/assets/$uuid" | head -c 10 | grep -q "." 2>/dev/null; then
            info "✅ Acceso a imágenes funcionando"
        else
            warning "⚠️ Problema accediendo a imágenes vía Directus"
        fi
    fi
fi

echo ""
log "🎉 IMPORTACIÓN DE IMÁGENES COMPLETADA"
echo "====================================="
echo ""
echo -e "${GREEN}✅ Importación exitosa${NC}"
echo ""
echo -e "${BLUE}📊 Resumen:${NC}"
echo "   • Imágenes encontradas y copiadas: $found_images"
echo "   • Imágenes faltantes: $missing_images"
echo "   • Archivos en directus_files: $files_count"
echo ""
echo -e "${BLUE}🔗 URLs de prueba:${NC}"
echo "   • Directus Files: http://localhost:8055/admin/files/all"
echo "   • Sitio web: http://localhost:4321"
echo ""
echo -e "${YELLOW}📋 Archivos generados:${NC}"
echo "   • Mapeo de imágenes: /tmp/image_mapping.json"
echo "   • Imágenes faltantes: /tmp/found_images/missing.txt"
echo ""

# Limpiar archivos temporales
rm -f /tmp/extract_image_mapping.js /tmp/import_files.sql

log "🏁 Importación de imágenes finalizada en $(date)" 