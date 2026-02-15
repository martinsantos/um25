#!/bin/bash

# Script para reemplazar todas las referencias de ultimamilla.com.ar por ultimamilla.com.ar
# Fecha: 2025-09-06

echo "🔄 Iniciando corrección de dominio en todos los archivos..."

# Lista de archivos críticos que necesitan corrección inmediata
critical_files=(
    "docker-compose.prod.yml"
    "docker-compose.development.yml"
    "docker-compose.hybrid.yml"
    "docker-compose.production.yml"
    "nginx.prod.conf"
    "nginx.hybrid.conf"
    "nginx.production.conf"
    "astro.config.mjs"
    ".env.example"
    "scripts/deploy-production.sh"
    "README.md"
    "WARP.md"
    "solucionfinal.md"
    "Makefile"
)

# Función para reemplazar en un archivo específico
replace_in_file() {
    local file="$1"
    if [ -f "$file" ]; then
        echo "✅ Corrigiendo: $file"
        # Reemplazar www.ultimamilla.com.ar con www.ultimamilla.com.ar
        sed -i '' 's/www\.umbot\.com\.ar/www.ultimamilla.com.ar/g' "$file"
        # Reemplazar ultimamilla.com.ar con ultimamilla.com.ar (sin www)
        sed -i '' 's/umbot\.com\.ar/ultimamilla.com.ar/g' "$file"
        # Reemplazar UltimaMillaAdmin con UltimaMillaAdmin
        sed -i '' 's/UltimaMillaAdmin/UltimaMillaAdmin/g' "$file"
        # Reemplazar admin@ultimamilla con admin@ultimamilla
        sed -i '' 's/admin@ultimamilla/admin@ultimamilla/g' "$file"
        echo "   ✓ Completado: $file"
    else
        echo "   ⚠️  No encontrado: $file"
    fi
}

# Reemplazar en archivos críticos primero
echo "📋 Corrigiendo archivos críticos..."
for file in "${critical_files[@]}"; do
    replace_in_file "$file"
done

# Reemplazar en todos los archivos .yml y .yaml
echo "📋 Corrigiendo archivos Docker Compose..."
find . -name "*.yml" -o -name "*.yaml" | while read -r file; do
    replace_in_file "$file"
done

# Reemplazar en todos los archivos de configuración nginx
echo "📋 Corrigiendo archivos Nginx..."
find . -name "nginx*.conf" -o -name "*.nginx.conf" | while read -r file; do
    replace_in_file "$file"
done

# Reemplazar en archivos de configuración
echo "📋 Corrigiendo archivos de configuración..."
find . -name "*.conf" | while read -r file; do
    replace_in_file "$file"
done

# Reemplazar en scripts de shell
echo "📋 Corrigiendo scripts..."
find . -name "*.sh" | while read -r file; do
    replace_in_file "$file"
done

# Reemplazar en archivos de documentación
echo "📋 Corrigiendo documentación..."
find . -name "*.md" | while read -r file; do
    replace_in_file "$file"
done

# Reemplazar en archivos JavaScript y Python
echo "📋 Corrigiendo archivos de código..."
find . -name "*.js" -o -name "*.mjs" -o -name "*.py" | while read -r file; do
    replace_in_file "$file"
done

# Reemplazar en archivos de configuración específicos
echo "📋 Corrigiendo archivos específicos..."
specific_files=(
    "astro.config.mjs"
    "astro.config.static.mjs"
    "package.json"
    ".env.example"
    "Dockerfile.prod"
    "Dockerfile.astro.prod"
)

for file in "${specific_files[@]}"; do
    replace_in_file "$file"
done

echo ""
echo "✅ ¡Corrección de dominio completada!"
echo ""
echo "📊 Resumen de cambios realizados:"
echo "   • www.ultimamilla.com.ar → www.ultimamilla.com.ar"
echo "   • ultimamilla.com.ar → ultimamilla.com.ar"
echo "   • UltimaMillaAdmin → UltimaMillaAdmin"
echo "   • admin@ultimamilla → admin@ultimamilla"
echo ""
echo "🔍 Para verificar los cambios:"
echo "   grep -r 'ultimamilla.com.ar' . --include='*.yml' --include='*.conf'"
echo ""
echo "⚠️  IMPORTANTE: Revisa manualmente los archivos críticos antes del despliegue"
