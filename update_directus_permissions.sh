#!/bin/bash

# Crear un script SQL para actualizar los permisos
ssh root@23.105.176.45 "cd /root/um25 && cat > update_permissions.sql << EOL
-- Crear un rol público si no existe
INSERT INTO directus_roles (id, name, admin_access, app_access)
SELECT '07c6b0c7-8907-4c8c-8e3f-93b0e190b02c', 'Public', false, false
WHERE NOT EXISTS (SELECT * FROM directus_roles WHERE name = 'Public');

-- Otorgar permisos de lectura a directus_files para el rol público
INSERT INTO directus_permissions (role, collection, action, permissions, validation)
SELECT '07c6b0c7-8907-4c8c-8e3f-93b0e190b02c', 'directus_files', 'read', '{}', '{}'
WHERE NOT EXISTS (
    SELECT * FROM directus_permissions 
    WHERE role = '07c6b0c7-8907-4c8c-8e3f-93b0e190b02c' 
    AND collection = 'directus_files' 
    AND action = 'read'
);

-- Otorgar permisos de lectura a Antecedentes para el rol público
INSERT INTO directus_permissions (role, collection, action, permissions, validation)
SELECT '07c6b0c7-8907-4c8c-8e3f-93b0e190b02c', 'Antecedentes', 'read', '{}', '{}'
WHERE NOT EXISTS (
    SELECT * FROM directus_permissions 
    WHERE role = '07c6b0c7-8907-4c8c-8e3f-93b0e190b02c' 
    AND collection = 'Antecedentes' 
    AND action = 'read'
);

-- Otorgar permisos de lectura a Antecedentes_files para el rol público
INSERT INTO directus_permissions (role, collection, action, permissions, validation)
SELECT '07c6b0c7-8907-4c8c-8e3f-93b0e190b02c', 'Antecedentes_files', 'read', '{}', '{}'
WHERE NOT EXISTS (
    SELECT * FROM directus_permissions 
    WHERE role = '07c6b0c7-8907-4c8c-8e3f-93b0e190b02c' 
    AND collection = 'Antecedentes_files' 
    AND action = 'read'
);
EOL"

# Ejecutar el script SQL
ssh root@23.105.176.45 "cd /root/um25 && cat update_permissions.sql | docker exec -i database psql -U myuser -d mydatabase"

# Actualizar la configuración de Directus
ssh root@23.105.176.45 "cd /root/um25 && sed -i 's/PUBLIC_ASSETS=.*/PUBLIC_ASSETS=true/' .env"
ssh root@23.105.176.45 "cd /root/um25 && sed -i 's/ASSETS_TRANSFORM_TOKEN_OPTIONAL=.*/ASSETS_TRANSFORM_TOKEN_OPTIONAL=true/' .env"

# Reiniciar los contenedores
ssh root@23.105.176.45 "cd /root/um25 && docker-compose -f docker-compose.server.yml down && docker-compose -f docker-compose.server.yml up -d"

echo "Permisos de Directus actualizados y contenedores reiniciados"
