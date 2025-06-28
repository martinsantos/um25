#!/bin/bash

# Configuración
DIRECTUS_URL="http://localhost:8055"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="adminpassword"

echo "Iniciando proceso de migración completa..."

# 1. Detener y limpiar contenedores existentes
echo "Deteniendo y limpiando contenedores..."
cd directus-admin
docker-compose down -v --remove-orphans
docker system prune -af --volumes
rm -rf dist/ .astro/ node_modules/.cache/

# 2. Recrear los contenedores
echo "Recreando contenedores..."
docker-compose up -d --build --force-recreate

# 3. Esperar a que Directus esté listo
echo "Esperando a que Directus esté listo..."
sleep 30

# 4. Crear las colecciones necesarias
echo "Creando colecciones..."
docker-compose exec -T database psql -U directus -d directus -f setup-production-data.sql
docker-compose exec -T database psql -U directus -d directus -f register-collections-directus.sql
docker-compose exec -T database psql -U directus -d directus -f configure-directus-permissions.sql

# 5. Instalar dependencias de Python
echo "Instalando dependencias de Python..."
cd scripts/upload_antecedentes
python3 -m venv venv
source venv/bin/activate
pip install requests
cd ../upload_servicios
python3 -m venv venv
source venv/bin/activate
pip install requests
cd ../..

# 6. Ejecutar migración de antecedentes
echo "Migrando antecedentes..."
cd scripts/upload_antecedentes
python3 upload_antecedentes.py
cd ../..

# 7. Ejecutar migración de servicios
echo "Migrando servicios..."
cd scripts/upload_servicios
python3 upload_servicios.py
cd ../..

# 8. Verificar la migración
echo "Verificando la migración..."
docker-compose exec -T database psql -U directus -d directus -c "SELECT COUNT(*) FROM antecedentes;"
docker-compose exec -T database psql -U directus -d directus -c "SELECT COUNT(*) FROM \"Servicios\";"

echo "Proceso de migración completado." 