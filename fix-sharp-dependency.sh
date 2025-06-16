#!/bin/bash

# Script de corrección rápida para instalar Sharp en producción
# UM25-0.3 - Fix Sharp Dependency

echo "🔧 CORRIGIENDO DEPENDENCIA SHARP EN PRODUCCIÓN"
echo "=============================================="

# Verificar si estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ ERROR: No se encuentra package.json"
    echo "📍 Ejecuta este script desde el directorio del proyecto"
    exit 1
fi

echo "📦 Instalando sharp como dependencia de producción..."
npm install sharp --save

if [ $? -eq 0 ]; then
    echo "✅ Sharp instalado exitosamente"
else
    echo "❌ Error instalando sharp"
    exit 1
fi

echo "🔨 Intentando construir nuevamente..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ BUILD EXITOSO!"
    echo "🚀 Reiniciando contenedores Docker..."
    docker compose down
    docker compose up -d
    echo "✨ DESPLIEGUE COMPLETADO"
else
    echo "❌ ERROR EN BUILD"
    echo "📝 Revisar logs arriba para más detalles"
    exit 1
fi

echo ""
echo "🌐 URLs de acceso:"
echo "   Sitio web: http://23.105.176.45"
echo "   Directus:  http://23.105.176.45:8055"
echo ""
echo "🔍 Para monitorear:"
echo "   docker compose logs -f" 