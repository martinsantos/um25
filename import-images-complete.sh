#!/bin/bash

echo "=== IMPORTACIÓN COMPLETA DE IMÁGENES ==="
echo "1. Importando datos de archivos a directus_files..."

# Importar datos de archivos
ssh root@23.105.176.45 "cd /root/fumbling-field && docker compose exec -T database psql -U myuser -d mydatabase < /root/fumbling-field/restore_directus_files.sql"

if [ $? -eq 0 ]; then
    echo "✅ Datos de archivos importados correctamente"
else
    echo "❌ Error importando datos de archivos"
    exit 1
fi

echo ""
echo "2. Verificando importación..."
ssh root@23.105.176.45 "cd /root/fumbling-field && docker compose exec -T database psql -U myuser -d mydatabase -c 'SELECT COUNT(*) FROM directus_files;'"

echo ""
echo "3. Creando directorio uploads en el servidor..."
ssh root@23.105.176.45 "mkdir -p /root/fumbling-field/uploads"

echo ""
echo "4. Transfiriendo imágenes al servidor..."
scp -r imagenes_antecedentes_versionproduccion/* root@23.105.176.45:/root/fumbling-field/uploads/

if [ $? -eq 0 ]; then
    echo "✅ Imágenes transferidas correctamente"
else
    echo "❌ Error transfiriendo imágenes"
    exit 1
fi

echo ""
echo "5. Verificando archivos en el servidor..."
ssh root@23.105.176.45 "ls -la /root/fumbling-field/uploads/ | wc -l"

echo ""
echo "6. Configurando permisos..."
ssh root@23.105.176.45 "chmod -R 755 /root/fumbling-field/uploads/"

echo ""
echo "7. Reiniciando Directus para que reconozca los archivos..."
ssh root@23.105.176.45 "cd /root/fumbling-field && docker compose restart directus-app"

echo ""
echo "✅ IMPORTACIÓN COMPLETA FINALIZADA"
echo "Las imágenes deberían estar disponibles en:"
echo "- Base de datos: directus_files"
echo "- Archivos físicos: /root/fumbling-field/uploads/"
echo "- Directus Admin: http://23.105.176.45:8055/admin/files/all" 