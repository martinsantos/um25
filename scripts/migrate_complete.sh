#!/bin/bash

# Configuración
DIRECTUS_URL="http://localhost:8055"
TOKEN="k6P8LAY8_x_y1miB_KTlWnysCnx2Abky"

echo "Iniciando migración completa..."

# 1. Crear directorio de migraciones si no existe
mkdir -p migrations

# 2. Copiar archivos necesarios
echo "Copiando archivos necesarios..."
cp -r imagenes_antecedentes_versionproduccion/* uploads/
cp antev3.json data/
cp src/data/servicios.json data/

# 3. Instalar dependencias de Python
echo "Instalando dependencias de Python..."
cd scripts/upload_antecedentes
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ../..

# 4. Ejecutar migración de antecedentes
echo "Migrando antecedentes..."
cd scripts/upload_antecedentes
python3 upload_antecedentes.py
cd ../..

# 5. Ejecutar migración de servicios
echo "Migrando servicios..."
cd scripts/upload_servicios
python3 upload_servicios.py
cd ../..

# 6. Verificar la migración
echo "Verificando migración..."
curl -s -H "Authorization: Bearer $TOKEN" "$DIRECTUS_URL/items/Antecedentes?limit=1" | jq '.meta.total_count'
curl -s -H "Authorization: Bearer $TOKEN" "$DIRECTUS_URL/items/Servicios?limit=1" | jq '.meta.total_count'

echo "Migración completa finalizada." 