#!/bin/bash
echo "🚨 INICIANDO RESTAURACIÓN DE EMERGENCIA"
echo "======================================"
cd /root/fumbling-field

echo "📋 Paso 1: Parando todos los contenedores..."
docker stop $(docker ps -q) 2>/dev/null || echo "No hay contenedores corriendo"

echo "🧹 Paso 2: Limpiando contenedores..."
docker container prune -f

echo "🔄 Paso 3: Restaurando stack estático funcional..."
docker-compose -f docker-compose.static.yml up -d

echo "⏳ Paso 4: Esperando inicialización..."
sleep 15

echo "✅ Paso 5: Verificando restauración..."
docker-compose -f docker-compose.static.yml ps
curl -I http://localhost/ 2>/dev/null | head -1 || echo "❌ Aún no disponible"

echo "🎯 RESTAURACIÓN COMPLETADA"
echo "Sitio debería estar disponible en: https://www.ultimamilla.com.ar/"
