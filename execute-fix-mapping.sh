#!/bin/bash
# SCRIPT DE CORRECCIÓN DE MAPEO DE IMÁGENES
echo "🔧 INICIANDO CORRECCIÓN DE MAPEO DE IMÁGENES..."

# Ejecutar corrección
ssh root@23.105.176.45 "docker exec -i fumbling-field-database-1 psql -U myuser -d mydatabase" < fix-image-mapping.sql

# Verificar resultado
echo "✅ Verificando resultado..."
ssh root@23.105.176.45 "docker exec -i fumbling-field-database-1 psql -U myuser -d mydatabase -c 'SELECT COUNT(*) as total FROM directus_files WHERE storage = \"local\";'"

echo "🎯 Probando API de assets..."
curl -I "http://www.ultimamilla.com.ar:8055/assets/$(head -1 /tmp/sample_uuid.txt 2>/dev/null || echo '6f535377-5177-4fcd-8c8d-8f41f32ece7c')"

echo "✅ CORRECCIÓN COMPLETADA"
