#!/bin/bash

# Este script corrige los permisos en la base de datos Directus

echo "Verificando la estructura de la tabla directus_permissions..."
ssh root@23.105.176.45 "cd /root/um25 && docker exec -i database psql -U myuser -d mydatabase -c '\d directus_permissions'"

echo "Creando un script SQL actualizado para los permisos..."
ssh root@23.105.176.45 "cd /root/um25 && cat > update_permissions.sql << EOL
-- Asegurar que el rol público tenga acceso a los recursos necesarios
INSERT INTO directus_permissions 
(id, role_id, collection, action, permissions, validation, presets, fields) 
VALUES 
(uuid_generate_v4(), '74e3b05e-0f14-422e-9ad3-759d426db60a', 'directus_files', 'read', '{}', '{}', NULL, '*'),
(uuid_generate_v4(), '74e3b05e-0f14-422e-9ad3-759d426db60a', 'Antecedentes', 'read', '{}', '{}', NULL, '*'),
(uuid_generate_v4(), '74e3b05e-0f14-422e-9ad3-759d426db60a', 'Antecedentes_files', 'read', '{}', '{}', NULL, '*')
ON CONFLICT DO NOTHING;
EOL"

echo "Ejecutando el script SQL actualizado..."
ssh root@23.105.176.45 "cd /root/um25 && docker exec -i database psql -U myuser -d mydatabase < update_permissions.sql"

echo "Actualizando la configuración de Directus..."
ssh root@23.105.176.45 "cd /root/um25 && cat > .env << EOL
# Directus Configuration
PUBLIC_DIRECTUS_URL=http://23.105.176.45:8055
DIRECTUS_URL=http://directus-app:8055
DIRECTUS_STATIC_TOKEN=dummy-token-not-used
DIRECTUS_KEY=pzdIoGXgfJODqy8lLFxwi2NOK/K7j7Qii7W26rHS9Tk=
DIRECTUS_SECRET=d/QUPftXXNdfnAmN5SSmWPrYLzHqWF9rixk6XrwchR4=

# Database Configuration
DB_USER=myuser
DB_PASSWORD=mypassword
DB_DATABASE=mydatabase

# Admin Configuration
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=adminpassword

# URL Configuration
PUBLIC_URL=http://23.105.176.45:8055
CORS_ENABLED=true
CORS_ORIGIN=*
PUBLIC_ASSETS=true
ASSETS_TRANSFORM_TOKEN_OPTIONAL=true
ASSETS_TRANSFORM_IMAGE_MAX_DIMENSION=10000
FILE_IMPORT_MAX_SIZE=100000000
STORAGE_UPLOAD_MAX_SIZE=100000000
PUBLIC_ROLE=74e3b05e-0f14-422e-9ad3-759d426db60a
EOL"

echo "Reiniciando los contenedores..."
ssh root@23.105.176.45 "cd /root/um25 && docker-compose -f docker-compose.server.yml down && docker-compose -f docker-compose.server.yml up -d"

echo "Operación completada. Espere unos minutos y luego verifique http://23.105.176.45:8080/antecedentes"
