#!/bin/bash

echo "🔧 Configurando variables de entorno para Directus..."

# Crear archivo .env con las variables necesarias
cat << EOF > .env
DB_CLIENT=pg
DB_HOST=database
DB_PORT=5432
DB_DATABASE=mydatabase
DB_USER=myuser
DB_PASSWORD=mypassword123
KEY=255d861b-5ea1-5996-9aa3-922530ec40b1
SECRET=6116487b-cda1-52c2-b5b5-c8022c45e263
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=d1r3ctu5
PUBLIC_URL=http://23.105.176.45:8055
CORS_ENABLED=true
CORS_ORIGIN=*
DIRECTUS_STATIC_TOKEN=k6P8LAY8_x_y1miB_KTlWnysCnx2Abky
EOF

echo "✅ Archivo .env creado"

# Reiniciar los contenedores para aplicar los cambios
echo "🔄 Reiniciando contenedores..."
docker-compose down
docker-compose up -d

# Esperar a que la base de datos esté lista
echo "⏳ Esperando a que la base de datos esté lista..."
sleep 15

# Verificar conexión a la base de datos
echo "🔍 Verificando conexión a la base de datos..."
if docker exec database pg_isready -U myuser; then
    echo "✅ Base de datos lista"
else
    echo "❌ Error al conectar con la base de datos"
    exit 1
fi

echo "✨ Configuración completada" 