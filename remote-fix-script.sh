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
