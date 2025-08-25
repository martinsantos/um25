#!/bin/bash

echo "🚀 DEPLOYING TO ULTIMAMILLA.COM.AR"
echo "=================================="

# Build optimizado para producción
echo "📦 Building optimized version..."
npm run build

# Rebuild Docker containers
echo "🐳 Rebuilding Docker containers..."
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d --build

# Verificar servicios
echo "✅ Verificando servicios..."
sleep 10
curl -f http://localhost:4321 || echo "⚠️ Astro app no responde"
curl -f http://localhost:8055 || echo "⚠️ Directus no responde"

echo "✅ Deploy completado para ultimamilla.com.ar"
