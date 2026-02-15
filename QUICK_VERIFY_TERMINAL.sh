#!/bin/bash

# VERIFICACIÓN RÁPIDA DEL TERMINAL ACTUAL
echo "🔍 VERIFICACIÓN RÁPIDA DEL TERMINAL"
echo "=================================="

export SSHPASS='gsiB%s@0yD'

sshpass -e ssh -o StrictHostKeyChecking=no root@23.105.176.45 << 'REMOTE_COMMANDS'

# Encontrar contenedor
ASTRO_CONTAINER=$(docker ps | grep astro | awk '{print $1}' | head -1)
echo "📦 Contenedor: $ASTRO_CONTAINER"

# Test directo del contenedor
echo ""
echo "🔍 Respuesta directa del contenedor:"
DIRECT_RESPONSE=$(curl -s http://localhost:4321 | grep -o "sudo ultimamilla\|deploy_solutions" | head -1)
echo "Comando detectado: $DIRECT_RESPONSE"

if [ "$DIRECT_RESPONSE" = "sudo ultimamilla" ]; then
    echo "✅ El contenedor YA tiene la versión correcta!"
else
    echo "❌ El contenedor necesita actualización"
fi

# Test del sitio web
echo ""
echo "🌐 Respuesta del sitio web:"
SITE_RESPONSE=$(curl -s https://ultimamilla.com.ar | grep -o "sudo ultimamilla\|deploy_solutions" | head -1)
echo "Comando en sitio: $SITE_RESPONSE"

REMOTE_COMMANDS

echo ""
echo "Si el contenedor está correcto pero el sitio no:"
echo "- Es problema de cache de Cloudflare"
echo "- Usa Ctrl+F5 o ventana incógnito"
