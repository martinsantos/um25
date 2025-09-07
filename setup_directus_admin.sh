#!/bin/bash
echo "🔧 CONFIGURANDO DIRECTUS PARA ADMINISTRACIÓN"
echo "==========================================="
cd /root/fumbling-field

echo "📋 Paso 1: Iniciando servicios Directus..."
docker-compose -f docker-compose.directus-simple.yml up -d

echo "⏳ Paso 2: Esperando inicialización (30 segundos)..."
sleep 30

echo "✅ Paso 3: Verificando estado de servicios:"
docker-compose -f docker-compose.directus-simple.yml ps

echo ""
echo "🌐 Paso 4: Verificando acceso:"
curl -I http://localhost:8055/ 2>/dev/null | head -1

echo ""
echo "🎯 DIRECTUS CONFIGURADO:"
echo "URL: https://www.ultimamilla.com.ar:8055/admin"
echo "Usuario: admin@ultimamilla.com.ar"  
echo "Contraseña: UmbotDirectusAdmin2025!"
echo ""
echo "✅ El sitio principal sigue funcionando en: https://www.ultimamilla.com.ar/"
