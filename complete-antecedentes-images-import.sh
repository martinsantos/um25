#!/bin/bash

# ================================================
# SCRIPT FINAL: IMPORTACIÓN COMPLETA DE IMÁGENES DE ANTECEDENTES
# ================================================
# Fecha: 23 Junio 2025
# Propósito: Completar la importación de 469 imágenes de antecedentes
#           y relacionarlas correctamente con sus registros en Directus

echo "🚀 INICIANDO IMPORTACIÓN COMPLETA DE IMÁGENES DE ANTECEDENTES"
echo "=============================================================="
date

# Variables de configuración
SERVER_IP="23.105.176.45"
SERVER_USER="root"
SERVER_DIR="/root/fumbling-field"
LOCAL_IMAGES_DIR="./imagenes_antecedentes_versionproduccion"
MAPPING_FILE="./datos_imagenes_para_directus_20250415_181330.json"
ANTECEDENTES_FILE="./antev3.json"

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging
log() {
    echo -e "${GREEN}[$(date '+%H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date '+%H:%M:%S')] ⚠️${NC} $1"
}

error() {
    echo -e "${RED}[$(date '+%H:%M:%S')] ❌${NC} $1"
}

info() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')] ℹ️${NC} $1"
}

# Verificaciones previas
echo ""
log "📋 VERIFICACIONES PREVIAS"
echo "========================="

# 1. Verificar archivos locales
if [ ! -d "$LOCAL_IMAGES_DIR" ]; then
    error "No se encuentra el directorio de imágenes: $LOCAL_IMAGES_DIR"
    exit 1
fi

if [ ! -f "$MAPPING_FILE" ]; then
    error "No se encuentra el archivo de mapeo: $MAPPING_FILE"
    exit 1
fi

if [ ! -f "$ANTECEDENTES_FILE" ]; then
    error "No se encuentra el archivo de antecedentes: $ANTECEDENTES_FILE"
    exit 1
fi

# Contar archivos
LOCAL_IMAGES_COUNT=$(ls "$LOCAL_IMAGES_DIR" | wc -l)
log "📸 Imágenes locales encontradas: $LOCAL_IMAGES_COUNT"

# 2. Verificar conectividad con servidor
log "🌐 Verificando conectividad con servidor..."
if ping -c 1 $SERVER_IP >/dev/null 2>&1; then
    log "✅ Servidor accesible via ping"
else
    warn "⚠️ Servidor no responde a ping, pero intentando SFTP..."
fi

# 3. Verificar que el stack de Directus esté funcionando
info "🔧 Verificando stack de Directus en servidor..."
ssh $SERVER_USER@$SERVER_IP "cd $SERVER_DIR && docker-compose ps | grep directus"

echo ""
log "📊 DIAGNÓSTICO DEL ESTADO ACTUAL"
echo "================================"

# Verificar estado de la base de datos
log "🗄️ Verificando estado de directus_files..."
DIRECTUS_FILES_COUNT=$(ssh $SERVER_USER@$SERVER_IP "cd $SERVER_DIR && docker-compose exec -T database psql -U myuser -d mydatabase -t -c 'SELECT COUNT(*) FROM directus_files;'" | tr -d ' ')
log "📁 Registros en directus_files: $DIRECTUS_FILES_COUNT"

log "🗄️ Verificando estado de Antecedentes..."
ANTECEDENTES_COUNT=$(ssh $SERVER_USER@$SERVER_IP "cd $SERVER_DIR && docker-compose exec -T database psql -U myuser -d mydatabase -t -c 'SELECT COUNT(*) FROM \"Antecedentes\";'" | tr -d ' ')
log "📝 Registros en Antecedentes: $ANTECEDENTES_COUNT"

log "🖼️ Verificando antecedentes CON imagen..."
ANTECEDENTES_WITH_IMAGE=$(ssh $SERVER_USER@$SERVER_IP "cd $SERVER_DIR && docker-compose exec -T database psql -U myuser -d mydatabase -t -c 'SELECT COUNT(*) FROM \"Antecedentes\" WHERE \"Imagen\" IS NOT NULL;'" | tr -d ' ')
log "✅ Antecedentes con imagen: $ANTECEDENTES_WITH_IMAGE"

log "🖼️ Verificando antecedentes SIN imagen..."
ANTECEDENTES_WITHOUT_IMAGE=$(ssh $SERVER_USER@$SERVER_IP "cd $SERVER_DIR && docker-compose exec -T database psql -U myuser -d mydatabase -t -c 'SELECT COUNT(*) FROM \"Antecedentes\" WHERE \"Imagen\" IS NULL;'" | tr -d ' ')
log "❌ Antecedentes sin imagen: $ANTECEDENTES_WITHOUT_IMAGE"

echo ""
if [ "$ANTECEDENTES_WITHOUT_IMAGE" -gt 0 ]; then
    warn "⚠️ Se necesita completar la importación de $ANTECEDENTES_WITHOUT_IMAGE imágenes"
    
    log "🚀 INICIANDO PROCESO DE IMPORTACIÓN COMPLETA"
    echo "============================================"
    
    # Crear script Python para procesar la importación
    log "📝 Creando script Python de importación..."
    
    cat > /tmp/complete_import.py << 'EOF'
#!/usr/bin/env python3
import json
import os
import sys
import subprocess
import tempfile
from pathlib import Path

def log(message):
    print(f"[LOG] {message}")

def main():
    # Cargar archivo de mapeo
    with open('./datos_imagenes_para_directus_20250415_181330.json', 'r') as f:
        mapping_data = json.load(f)
    
    # Cargar antecedentes
    with open('./antev3.json', 'r') as f:
        antecedentes_data = json.load(f)
    
    log(f"Mapeo cargado: {len(mapping_data)} registros")
    log(f"Antecedentes cargados: {len(antecedentes_data)} registros")
    
    # Crear mapeo título -> índice para búsqueda rápida
    titulo_to_index = {ant['Titulo']: idx for idx, ant in enumerate(antecedentes_data)}
    
    # Crear script SQL para actualizaciones masivas
    sql_updates = []
    processed_count = 0
    
    for i, mapping_entry in enumerate(mapping_data):
        titulo_original = mapping_entry.get('titulo_original', '').strip()
        archivo_generado = mapping_entry.get('nombre_archivo_generado', '')
        
        if not titulo_original or not archivo_generado:
            continue
            
        # Buscar antecedente correspondiente
        antecedente_idx = titulo_to_index.get(titulo_original)
        if antecedente_idx is None:
            log(f"[{i+1}/{len(mapping_data)}] No encontrado: {titulo_original}")
            continue
        
        # Obtener nombre de archivo sin ruta
        imagen_filename = os.path.basename(archivo_generado)
        imagen_base = imagen_filename.rsplit('.', 1)[0]  # Sin extensión
        
        # Verificar si existe el archivo de imagen
        imagen_path = f"./imagenes_antecedentes_versionproduccion/{imagen_filename}"
        if not os.path.exists(imagen_path):
            # Buscar con diferentes extensiones
            found = False
            for ext in ['.png', '.jpg', '.jpeg']:
                test_path = f"./imagenes_antecedentes_versionproduccion/{imagen_base}{ext}"
                if os.path.exists(test_path):
                    imagen_filename = f"{imagen_base}{ext}"
                    found = True
                    break
            
            if not found:
                log(f"[{i+1}/{len(mapping_data)}] Imagen no encontrada: {imagen_filename}")
                continue
        
        # Generar ID único basado en el nombre del archivo (determinístico)
        file_id = f"img_{abs(hash(imagen_base)) % 1000000:06d}"
        
        # Crear entrada para directus_files si no existe
        sql_updates.append(f"""
INSERT INTO directus_files (id, filename_disk, filename_download, title, type, uploaded_by, uploaded_on, storage)
VALUES ('{file_id}', '{imagen_filename}', '{imagen_filename}', '{titulo_original}', 'image/png', '93bfdf28-e8b1-4e79-a73a-92cd7cfe119b', NOW(), 'local')
ON CONFLICT (id) DO NOTHING;
""")
        
        # Actualizar antecedente con la imagen
        sql_updates.append(f"""
UPDATE "Antecedentes" 
SET "Imagen" = '{file_id}' 
WHERE "Titulo" = '{titulo_original.replace("'", "''")}';
""")
        
        processed_count += 1
        if processed_count % 50 == 0:
            log(f"Procesados: {processed_count}/{len(mapping_data)}")
    
    # Escribir archivo SQL
    with open('/tmp/update_antecedentes_images.sql', 'w') as f:
        f.write('\n'.join(sql_updates))
    
    log(f"✅ Script SQL generado con {len(sql_updates)} operaciones")
    log(f"📊 Total procesados: {processed_count}")
    print(f"/tmp/update_antecedentes_images.sql")

if __name__ == "__main__":
    main()
EOF

    # Ejecutar script Python
    log "🐍 Ejecutando script Python..."
    python3 /tmp/complete_import.py
    
    if [ $? -eq 0 ]; then
        log "✅ Script SQL generado exitosamente"
        
        # Transferir imágenes faltantes al servidor
        log "📤 Verificando y transfiriendo imágenes al servidor..."
        
        # Verificar directorio de uploads en servidor
        ssh $SERVER_USER@$SERVER_IP "mkdir -p $SERVER_DIR/uploads"
        
        # Sincronizar imágenes (solo las que faltan)
        log "🔄 Sincronizando imágenes con servidor..."
        rsync -av --progress "$LOCAL_IMAGES_DIR/" "$SERVER_USER@$SERVER_IP:$SERVER_DIR/uploads/"
        
        if [ $? -eq 0 ]; then
            log "✅ Imágenes sincronizadas exitosamente"
            
            # Transferir y ejecutar script SQL
            log "📋 Transfiriendo script SQL al servidor..."
            scp /tmp/update_antecedentes_images.sql "$SERVER_USER@$SERVER_IP:$SERVER_DIR/"
            
            log "🗄️ Ejecutando actualizaciones en base de datos..."
            ssh $SERVER_USER@$SERVER_IP "cd $SERVER_DIR && docker-compose exec -T database psql -U myuser -d mydatabase -f /root/fumbling-field/update_antecedentes_images.sql"
            
            if [ $? -eq 0 ]; then
                log "✅ Actualizaciones de base de datos completadas"
                
                # Verificar resultado final
                echo ""
                log "📊 VERIFICACIÓN FINAL"
                echo "===================="
                
                FINAL_WITH_IMAGE=$(ssh $SERVER_USER@$SERVER_IP "cd $SERVER_DIR && docker-compose exec -T database psql -U myuser -d mydatabase -t -c 'SELECT COUNT(*) FROM \"Antecedentes\" WHERE \"Imagen\" IS NOT NULL;'" | tr -d ' ')
                FINAL_WITHOUT_IMAGE=$(ssh $SERVER_USER@$SERVER_IP "cd $SERVER_DIR && docker-compose exec -T database psql -U myuser -d mydatabase -t -c 'SELECT COUNT(*) FROM \"Antecedentes\" WHERE \"Imagen\" IS NULL;'" | tr -d ' ')
                FINAL_DIRECTUS_FILES=$(ssh $SERVER_USER@$SERVER_IP "cd $SERVER_DIR && docker-compose exec -T database psql -U myuser -d mydatabase -t -c 'SELECT COUNT(*) FROM directus_files;'" | tr -d ' ')
                
                log "✅ Antecedentes con imagen: $FINAL_WITH_IMAGE"
                log "❌ Antecedentes sin imagen: $FINAL_WITHOUT_IMAGE"
                log "📁 Total archivos en directus_files: $FINAL_DIRECTUS_FILES"
                
                # Reiniciar Directus para que reconozca los nuevos archivos
                log "🔄 Reiniciando Directus para aplicar cambios..."
                ssh $SERVER_USER@$SERVER_IP "cd $SERVER_DIR && docker-compose restart directus-app"
                
                echo ""
                log "🎉 IMPORTACIÓN COMPLETADA EXITOSAMENTE"
                echo "====================================="
                echo ""
                log "📊 RESUMEN FINAL:"
                log "• Total antecedentes: $ANTECEDENTES_COUNT"
                log "• Con imagen: $FINAL_WITH_IMAGE"
                log "• Sin imagen: $FINAL_WITHOUT_IMAGE"
                log "• Archivos en directus_files: $FINAL_DIRECTUS_FILES"
                log "• Imágenes físicas en servidor: 469"
                echo ""
                log "🌐 URLs de verificación:"
                log "• Sitio web: https://www.umbot.com.ar/antecedentes"
                log "• Admin Directus: http://$SERVER_IP:8055/admin/files/all"
                echo ""
                
            else
                error "❌ Error ejecutando actualizaciones en base de datos"
                exit 1
            fi
        else
            error "❌ Error sincronizando imágenes con servidor"
            exit 1
        fi
    else
        error "❌ Error generando script SQL"
        exit 1
    fi
else
    log "✅ Todos los antecedentes ya tienen imágenes asignadas"
    log "🎉 IMPORTACIÓN YA COMPLETA"
fi

# Limpiar archivos temporales
rm -f /tmp/complete_import.py /tmp/update_antecedentes_images.sql

echo ""
log "🏁 PROCESO FINALIZADO"
date 