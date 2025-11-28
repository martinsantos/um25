#!/bin/bash
# Script de SOLUCIÓN RÁPIDA para las imágenes de servicios
# Ejecutar desde Mac: ./fix-images-now.sh

set -e

echo "🚀 SOLUCIONANDO IMÁGENES DE SERVICIOS - EJECUCIÓN RÁPIDA"
echo "========================================================"

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ] || [ ! -d "public/images/services" ]; then
    echo "❌ Error: Ejecuta este script desde el directorio raíz del proyecto"
    echo "   Debe contener package.json y public/images/services/"
    exit 1
fi

echo ""
echo "📋 DIAGNÓSTICO ACTUAL:"
echo "   Directorio actual: $(pwd)"
echo "   Imágenes locales:"
ls -la public/images/services/*.jpg 2>/dev/null || echo "   ❌ No hay imágenes .jpg"

echo ""
echo "🔧 OPCIONES DE SOLUCIÓN:"
echo ""
echo "1️⃣ OPCIÓN RÁPIDA - Sincronizar al servidor de producción"
echo "   Transfiere las imágenes directamente al servidor 23.105.176.45"
echo ""
echo "2️⃣ OPCIÓN LOCAL - Probar localmente primero"
echo "   Ejecuta los contenedores locales para verificar"
echo ""

read -p "¿Qué opción prefieres? (1/2): " choice

case $choice in
    1)
        echo ""
        echo "🚀 EJECUTANDO SINCRONIZACIÓN AL SERVIDOR..."
        
        # Verificar conexión SSH (sin clave, solo test)
        echo "Verificando conectividad..."
        if timeout 5 ssh -o ConnectTimeout=5 -o BatchMode=yes root@23.105.176.45 exit 2>/dev/null; then
            echo "✅ Conexión SSH disponible"
        else
            echo "⚠️  Conexión SSH no disponible o requiere configuración"
            echo ""
            echo "Para configurar SSH:"
            echo "1. ssh-copy-id root@23.105.176.45"
            echo "2. O contacta al administrador del servidor"
            echo ""
            echo "Mientras tanto, usa la OPCIÓN 2 para probar localmente"
            exit 1
        fi
        
        # Ejecutar script de sincronización
        ./sync-images-production.sh
        ;;
        
    2)
        echo ""
        echo "🏠 EJECUTANDO PRUEBA LOCAL..."
        
        echo "1. Deteniendo contenedores actuales..."
        docker-compose down 2>/dev/null || true
        
        echo "2. Construyendo imagen actualizada..."
        docker-compose build --no-cache astro-app
        
        echo "3. Iniciando servicios..."
        docker-compose up -d
        
        echo "4. Esperando que los servicios estén listos..."
        sleep 15
        
        echo "5. Verificando servicios..."
        docker-compose ps
        
        echo ""
        echo "✅ SERVICIOS LOCALES INICIADOS"
        echo ""
        echo "🌐 Prueba las imágenes en:"
        echo "   • Página principal: http://localhost:4321"
        echo "   • Servicios: http://localhost:4321/servicios"
        echo "   • Imagen de prueba: http://localhost:4321/images/services/default-service.jpg"
        echo "   • Directus admin: http://localhost:8055/admin"
        echo ""
        echo "Si funciona localmente, ejecuta después:"
        echo "   ./sync-images-production.sh"
        ;;
        
    *)
        echo "❌ Opción no válida"
        exit 1
        ;;
esac

echo ""
echo "✅ PROCESO COMPLETADO"
echo ""
echo "📱 SIGUIENTE PASO:"
echo "   Abre https://www.umbot.com.ar/servicios y presiona Ctrl+F5 para limpiar caché" 