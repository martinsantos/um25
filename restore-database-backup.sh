#!/bin/bash

echo "🔄 RESTAURANDO BASE DE DATOS DESDE BACKUP"
echo "========================================"

# Conectar al servidor y restaurar
ssh root@23.105.176.45 << 'EOF'
cd /root/fumbling-field

echo "1. Verificando archivo de backup..."
ls -la restore_directus_files.sql

echo "2. Restaurando base de datos..."
cat restore_directus_files.sql | docker-compose exec -T database psql -U myuser -d mydatabase

echo "3. Verificando datos restaurados..."
docker-compose exec -T database psql -U myuser -d mydatabase -c "SELECT COUNT(*) FROM directus_files;"

echo "4. Verificando antecedentes..."
docker-compose exec -T database psql -U myuser -d mydatabase -c "SELECT COUNT(*) FROM antecedentes WHERE \"Imagen\" IS NOT NULL;"

echo "✅ RESTAURACIÓN COMPLETADA"
EOF 