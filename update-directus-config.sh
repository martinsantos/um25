#!/bin/bash

echo "🔧 Actualizando configuración de Directus..."

# Verificar si existe el archivo .env
if [ ! -f .env ]; then
    echo "❌ Archivo .env no encontrado. Creándolo..."
    touch .env
fi

# Actualizar PUBLIC_URL en .env
if grep -q "PUBLIC_URL=" .env; then
    sed -i '' 's|PUBLIC_URL=.*|PUBLIC_URL=http://23.105.176.45:8055|g' .env
else
    echo "PUBLIC_URL=http://23.105.176.45:8055" >> .env
fi

# Verificar variables de entorno críticas
echo "📝 Verificando variables de entorno críticas..."
cat << EOF > verify-env.sh
#!/bin/bash
required_vars=(
    "DB_CLIENT"
    "DB_HOST"
    "DB_PORT"
    "DB_DATABASE"
    "DB_USER"
    "DB_PASSWORD"
    "KEY"
    "SECRET"
    "ADMIN_EMAIL"
    "ADMIN_PASSWORD"
    "PUBLIC_URL"
)

missing_vars=()
for var in "\${required_vars[@]}"; do
    if ! grep -q "^\$var=" .env; then
        missing_vars+=("\$var")
    fi
done

if [ \${#missing_vars[@]} -ne 0 ]; then
    echo "❌ Variables faltantes:"
    printf '%s\n' "\${missing_vars[@]}"
    exit 1
else
    echo "✅ Todas las variables críticas están presentes"
fi
EOF

chmod +x verify-env.sh
./verify-env.sh

# Reiniciar Directus para aplicar cambios
echo "🔄 Reiniciando Directus..."
docker restart directus-app

echo "✨ Configuración actualizada" 