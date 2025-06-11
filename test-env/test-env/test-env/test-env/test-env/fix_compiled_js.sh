#!/bin/bash

# Este script busca y modifica directamente los archivos JavaScript compilados que contienen la lógica de autenticación

echo "Buscando archivos JavaScript compilados relacionados con autenticación..."
ssh root@23.105.176.45 "find /root/um25/dist -type f -name '*.js' -o -name '*.mjs' | xargs grep -l 'authenticate' | head -n 10"

echo "Creando un script SQL para actualizar los permisos en la base de datos..."
ssh root@23.105.176.45 "cd /root/um25 && cat > update_permissions.sql << EOL
-- Asegurar que el rol público tenga acceso a los recursos necesarios
INSERT INTO directus_permissions 
(id, role, collection, action, permissions, validation, presets, fields) 
VALUES 
(uuid_generate_v4(), '74e3b05e-0f14-422e-9ad3-759d426db60a', 'directus_files', 'read', '{}', '{}', NULL, '*'),
(uuid_generate_v4(), '74e3b05e-0f14-422e-9ad3-759d426db60a', 'Antecedentes', 'read', '{}', '{}', NULL, '*'),
(uuid_generate_v4(), '74e3b05e-0f14-422e-9ad3-759d426db60a', 'Antecedentes_files', 'read', '{}', '{}', NULL, '*')
ON CONFLICT DO NOTHING;
EOL"

echo "Ejecutando el script SQL para actualizar los permisos..."
ssh root@23.105.176.45 "cd /root/um25 && docker exec -i database psql -U myuser -d mydatabase < update_permissions.sql"

echo "Actualizando la configuración de Directus para permitir acceso público..."
ssh root@23.105.176.45 "cd /root/um25 && docker exec -i directus-app sh -c 'echo \"PUBLIC_ROLE=74e3b05e-0f14-422e-9ad3-759d426db60a\" >> /directus/.env'"
ssh root@23.105.176.45 "cd /root/um25 && docker exec -i directus-app sh -c 'echo \"PUBLIC_ASSETS=true\" >> /directus/.env'"
ssh root@23.105.176.45 "cd /root/um25 && docker exec -i directus-app sh -c 'echo \"ASSETS_TRANSFORM_TOKEN_OPTIONAL=true\" >> /directus/.env'"

echo "Reiniciando los contenedores..."
ssh root@23.105.176.45 "cd /root/um25 && docker restart directus-app && docker restart astro-app"

echo "Verificando la configuración actualizada..."
ssh root@23.105.176.45 "cd /root/um25 && docker exec -i directus-app sh -c 'cat /directus/.env | grep -E \"PUBLIC_ROLE|PUBLIC_ASSETS|ASSETS_TRANSFORM\"'"

echo "Operación completada. Espere unos segundos y luego verifique http://23.105.176.45:8080/antecedentes"
