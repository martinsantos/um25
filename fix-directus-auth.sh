#!/bin/bash

# Script para corregir autenticación de Directus
echo "🔧 Corrigiendo autenticación de Directus..."

# Nuevo token generado
NEW_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjBhOGMzODdmLTczOWUtNDA5Ni1hNjA1LThkODg4YTYyMDVjOSIsInJvbGUiOiIyMWQ3YWU5Zi0zNzFlLTQzNGMtYjVkNi1hZDVmNzZiZTk2OTkiLCJhcHBfYWNjZXNzIjp0cnVlLCJhZG1pbl9hY2Nlc3MiOnRydWUsImlhdCI6MTc1MDAyOTY1NywiZXhwIjoxNzUwMDMwNTU3LCJpc3MiOiJkaXJlY3R1cyJ9.DyH7Hx6xxj_GE69sB9YCwf6J6VlkVuvwsD1SGWo4SVU"

# Actualizar archivo .env
echo "📝 Actualizando variables de entorno..."
cat > .env.local << EOF
# Configuración de Directus - Token actualizado $(date)
PUBLIC_DIRECTUS_URL=http://localhost:8055
DIRECTUS_STATIC_TOKEN=$NEW_TOKEN

# Base de datos
DATABASE_URL=postgresql://myuser:mypassword@localhost:5432/mydatabase
EOF

# Exportar variables para la sesión actual
export PUBLIC_DIRECTUS_URL=http://localhost:8055
export DIRECTUS_STATIC_TOKEN=$NEW_TOKEN

echo "✅ Variables de entorno actualizadas"

# Probar conexión
echo "🧪 Probando conexión a Directus..."
curl -H "Authorization: Bearer $NEW_TOKEN" "http://localhost:8055/server/health"

echo ""
echo "🔄 Reinicia el servidor de desarrollo con: npm run dev"
echo "📋 Token actualizado y listo para usar" 