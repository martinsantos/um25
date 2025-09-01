#!/bin/bash
echo "=== RECUPERACIÓN DE EMERGENCIA ULTIMAMILLA.COM.AR ==="
echo "Iniciando diagnóstico del sistema..."

# Verificar carga del sistema
echo "1. Verificando carga del sistema..."
uptime
free -h
df -h

# Verificar servicios Docker
echo "2. Verificando servicios Docker..."
systemctl status docker
docker ps -a

# Intentar reiniciar servicios críticos si están caídos
echo "3. Verificando y reiniciando servicios críticos..."
if ! docker ps | grep -q nginx-proxy-ultimamilla; then
    echo "⚠️ Nginx no está corriendo, reiniciando..."
    cd /root/fumbling-field
    docker-compose -f docker-compose.prod.yml up -d nginx
fi

if ! docker ps | grep -q umbot-astro-prod; then
    echo "⚠️ Astro no está corriendo, reiniciando..."
    cd /root/fumbling-field
    docker-compose -f docker-compose.prod.yml up -d astro-app
fi

if ! docker ps | grep -q umbot-directus-prod; then
    echo "⚠️ Directus no está corriendo, reiniciando..."
    cd /root/fumbling-field
    docker-compose -f docker-compose.prod.yml up -d directus
fi

# Verificar el sitio web
echo "4. Verificando sitio web..."
curl -I http://localhost || echo "❌ Sitio web no responde localmente"

echo "5. Estado final de contenedores:"
docker ps

echo "=== RECUPERACIÓN COMPLETADA ==="
