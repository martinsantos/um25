#!/bin/bash

# Script para configurar la base de datos de Directus con los permisos correctos y el token estático

echo "=== CONFIGURACIÓN DE LA BASE DE DATOS DIRECTUS ==="
echo ""

# Verificar que las variables de entorno estén configuradas
if [ -z "$DIRECTUS_STATIC_TOKEN" ]; then
    echo "ERROR: La variable de entorno DIRECTUS_STATIC_TOKEN no está configurada."
    echo "Por favor, configúrela antes de ejecutar este script."
    exit 1
fi

# Función para ejecutar comandos SQL en la base de datos
execute_sql() {
    local sql_command="$1"
    docker-compose exec -T database psql -U postgres -d directus -c "$sql_command"
}

# Obtener el ID del rol de administrador
ADMIN_ROLE_ID=$(docker-compose exec -T database psql -U postgres -d directus -t -c "SELECT id FROM directus_roles WHERE name = 'Administrator' LIMIT 1;" | tr -d '[:space:]')

if [ -z "$ADMIN_ROLE_ID" ]; then
    echo "ERROR: No se pudo encontrar el rol de Administrador en la base de datos."
    exit 1
fi

echo "ID del rol de Administrador: $ADMIN_ROLE_ID"

# Actualizar el token estático en la tabla directus_users
echo "Actualizando token estático..."
execute_sql "UPDATE directus_users SET token = '$DIRECTUS_STATIC_TOKEN' WHERE email = 'admin@example.com';"

# Configuración básica de la aplicación Directus
echo "Configurando la aplicación Directus..."

# Actualizar configuración básica
execute_sql "
UPDATE directus_settings 
SET 
    project_name = 'Ultima Milla',
    project_url = 'http://localhost:8055',
    project_color = '#4CAF50',
    public_note = 'Sistema de gestión de contenido',
    auth_login_attempts = 10,
    storage_asset_transform = 'all';
"

# Configurar permisos para las colecciones
echo "Configurando permisos para las colecciones..."

# Crear política para permisos públicos
POLICY_UUID=$(uuidgen | tr '[:upper:]' '[:lower:]')

echo "Creando política de permisos..."
execute_sql "
INSERT INTO directus_policies (id, name, icon, description, ip_access, enforce_tfa, admin_access, app_access)
VALUES 
('$POLICY_UUID', 'Acceso Público', 'public', 'Permite acceso de solo lectura a colecciones públicas', NULL, false, false, true);
"
# Configurar permisos para las colecciones
COLLECTIONS=("directus_files" "Antecedentes" "Antecedentes_files" "Servicios" "Servicios_files")

for collection in "${COLLECTIONS[@]}"; do
    echo "Configurando permisos para: $collection"
    execute_sql "
    INSERT INTO directus_permissions 
    (collection, action, permissions, validation, fields, policy) 
    VALUES 
    ('$collection', 'read', '{}', '{}', '*', '$POLICY_UUID');"
done

# Configurar acceso público a los archivos
echo "Configurando acceso público a los archivos..."
execute_sql "
UPDATE directus_files 
SET uploaded_by = (SELECT id FROM directus_users WHERE email = 'admin@example.com' LIMIT 1)
WHERE uploaded_by IS NULL;
"

echo ""
echo "¡Configuración de la base de datos completada con éxito!"
echo ""
echo "=== CONFIGURACIÓN COMPLETADA ==="
echo ""
echo "Por favor, verifique que puede acceder a:"
echo "- Directus: http://localhost:8055"
echo "  - Token estático: $DIRECTUS_STATIC_TOKEN"
echo "  - Usuario: admin@example.com"
echo "  - Contraseña: adminpassword"
echo "- Aplicación Astro: http://localhost:4321"
echo ""
echo "Si es necesario, reinicie los contenedores con:"
echo "docker-compose down && docker-compose up -d"
echo ""
