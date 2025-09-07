#!/bin/bash

echo "🚀 APLICANDO CORRECCIÓN REMOTA DIRECTUS"
echo "======================================="

# Función para mostrar el estado actual
show_current_status() {
    echo "📊 Estado actual del servidor:"
    echo "Base href:"
    curl -s https://www.ultimamilla.com.ar/admin | grep -o 'base href="[^"]*"' || echo "No encontrado"
    echo "Login status:"
    curl -I https://www.ultimamilla.com.ar/admin/login 2>/dev/null | head -1
    echo ""
}

echo "🔍 Verificando estado actual..."
show_current_status

# Crear el script de corrección remota
cat > remote-fix-script.sh << 'EOF'
#!/bin/bash
echo "🔧 Aplicando corrección en servidor..."

# Detener servicios actuales
echo "⏹️  Deteniendo servicios..."
docker-compose -f docker-compose.hybrid.yml down 2>/dev/null || true
docker-compose -f docker-compose.simple.yml down 2>/dev/null || true
docker-compose -f docker-compose.admin-fix.yml down 2>/dev/null || true
docker-compose -f docker-compose.login.yml down 2>/dev/null || true
docker-compose -f docker-compose.spa.yml down 2>/dev/null || true

# Limpiar sistema
echo "🧹 Limpiando sistema..."
docker system prune -f

# Iniciar configuración corregida
echo "🚀 Iniciando configuración corregida..."
docker-compose -f docker-compose.fixed.yml up -d

# Esperar servicios
echo "⏳ Esperando servicios (30s)..."
sleep 30

# Verificar estado
echo "📊 Estado de contenedores:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Verificar corrección
echo ""
echo "🔍 Verificando corrección:"
echo "Base href:"
curl -s https://www.ultimamilla.com.ar/admin | grep -o 'base href="[^"]*"' 2>/dev/null || echo "No encontrado"
echo "Login status:"
curl -I https://www.ultimamilla.com.ar/admin/login 2>/dev/null | head -1

echo ""
echo "✅ Corrección aplicada"
EOF

chmod +x remote-fix-script.sh

echo "📦 Preparando archivos para transferencia..."

# Lista de archivos a transferir
FILES_TO_TRANSFER=(
    "nginx.fixed.conf"
    "docker-compose.fixed.yml" 
    "deploy-fixed.sh"
    "remote-fix-script.sh"
)

# Verificar que todos los archivos existen
echo "✅ Verificando archivos:"
for file in "${FILES_TO_TRANSFER[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✓ $file"
    else
        echo "  ❌ $file - FALTA"
        exit 1
    fi
done

echo ""
echo "🔧 INSTRUCCIONES PARA APLICAR LA CORRECCIÓN:"
echo "==========================================="
echo ""
echo "1. 📤 Transferir archivos al servidor:"
echo "   scp nginx.fixed.conf docker-compose.fixed.yml deploy-fixed.sh remote-fix-script.sh root@www.ultimamilla.com.ar:~/"
echo ""
echo "2. 🔐 Conectar al servidor:"
echo "   ssh root@www.ultimamilla.com.ar"
echo ""
echo "3. 🚀 Aplicar corrección:"
echo "   chmod +x remote-fix-script.sh"
echo "   ./remote-fix-script.sh"
echo ""
echo "4. 🔍 Verificar resultado:"
echo "   curl -s https://www.ultimamilla.com.ar/admin | grep 'base href'"
echo "   curl -I https://www.ultimamilla.com.ar/admin/login"
echo ""
echo "📋 RESULTADO ESPERADO:"
echo "- Base href: base href=\"/\" (sin doble /admin)"
echo "- Login: HTTP/2 200 (en lugar de 404)"
echo "- Panel admin funcionando en https://www.ultimamilla.com.ar/admin"
echo ""
echo "🎯 PROBLEMA QUE RESUELVE:"
echo "- Error 404 en /admin/login"
echo "- Doble /admin en rutas"
echo "- Base href incorrecto" 