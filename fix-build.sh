#!/bin/bash

# Script para resolver el problema del compilador WASM de Astro
# Uso: bash fix-build.sh

set -e

echo "🔧 Iniciando solución para el problema del compilador WASM..."
echo ""

# Verificar si estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json no encontrado"
    echo "Por favor ejecuta este script desde la raíz del proyecto"
    exit 1
fi

# Opción 1: Usar Node.js 18
echo "📦 Opción 1: Usando Node.js 18 (RECOMENDADO)"
echo ""

if command -v nvm &> /dev/null; then
    echo "✅ NVM encontrado"
    source ~/.nvm/nvm.sh
    nvm install 18
    nvm use 18
    echo "✅ Node.js 18 activado"
else
    echo "⚠️  NVM no encontrado. Instalando..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    source ~/.nvm/nvm.sh
    nvm install 18
    nvm use 18
    echo "✅ NVM instalado y Node.js 18 activado"
fi

echo ""
echo "🧹 Limpiando dependencias..."
rm -rf node_modules package-lock.json .astro dist

echo "📥 Reinstalando dependencias..."
npm install

echo ""
echo "🔨 Intentando build..."
npm run build

if [ -f "dist/server/entry.mjs" ]; then
    echo ""
    echo "✅ ¡BUILD EXITOSO!"
    echo ""
    echo "🚀 Reiniciando PM2..."
    pm2 restart astro-app
    echo ""
    echo "✅ Aplicación reiniciada"
    echo ""
    echo "Verifica las URLs:"
    echo "  - https://www.ultimamilla.com.ar/constructoras"
    echo "  - https://www.ultimamilla.com.ar/salud"
    echo "  - https://www.ultimamilla.com.ar/aeropuertos"
else
    echo ""
    echo "❌ Build falló"
    echo ""
    echo "Intentando Opción 2: Downgrade de Astro..."
    npm install astro@4.15.0 @astrojs/node@9.4.3 --save
    npm run build
    
    if [ -f "dist/server/entry.mjs" ]; then
        echo "✅ ¡BUILD EXITOSO con Astro 4.15.0!"
        pm2 restart astro-app
    else
        echo "❌ Ambas opciones fallaron"
        echo "Por favor contacta al equipo de soporte"
        exit 1
    fi
fi
