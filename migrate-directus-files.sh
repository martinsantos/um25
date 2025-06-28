#!/bin/bash

echo "🔧 Iniciando migración de archivos a Directus..."

# Verificar directorios de origen
IMAGENES_DIR="imagenes_antecedentes_versionproduccion"
if [ ! -d "$IMAGENES_DIR" ]; then
    echo "❌ Directorio de imágenes no encontrado: $IMAGENES_DIR"
    exit 1
fi

# Crear directorio de uploads si no existe
mkdir -p uploads

# Contar archivos en el directorio de origen
TOTAL_FILES=$(find "$IMAGENES_DIR" -type f | wc -l)
echo "📊 Total de archivos a migrar: $TOTAL_FILES"

# Copiar archivos al directorio de uploads
echo "📦 Copiando archivos..."
cp -r "$IMAGENES_DIR"/* uploads/

# Verificar permisos
echo "🔒 Ajustando permisos..."
chmod -R 755 uploads

# Verificar la migración
MIGRATED_FILES=$(find uploads -type f | wc -l)
echo "✅ Archivos migrados: $MIGRATED_FILES de $TOTAL_FILES"

# Reiniciar Directus para que reconozca los nuevos archivos
echo "🔄 Reiniciando Directus..."
docker restart directus-app

echo "✨ Migración completada" 