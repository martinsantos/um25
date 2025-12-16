#!/bin/bash

# 🚀 SCRIPT DE VERIFICACIÓN POST-RESTAURACIÓN DIRECTUS
# Ejecutar cuando se restaure conectividad con el servidor

set -e

SERVER="23.105.176.45"
PASSWORD="gsiB%s@0yD"
PROJECT_DIR="/root/fumbling-field"

echo "🔄 INICIANDO VERIFICACIÓN COMPLETA DE RESTAURACIÓN DIRECTUS"
echo "=========================================================="

# Función para ejecutar comandos SSH
ssh_exec() {
    sshpass -p "$PASSWORD" ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no "root@$SERVER" "$1"
}

# 1. Verificar estado del servidor
echo "📊 1. VERIFICANDO ESTADO DEL SERVIDOR..."
ssh_exec "
echo '=== PROCESOS ASTRO ACTIVOS ==='
ps aux | grep -E 'node|npm|astro' | grep -v grep | head -5

echo -e '\n=== PUERTO 4321 ==='
lsof -i :4321 2>/dev/null || echo 'Puerto libre'

echo -e '\n=== CONTENEDORES DOCKER ==='
docker ps | grep -E 'directus|database' | head -3
"

# 2. Reiniciar servidor Astro si es necesario
echo "🔄 2. REINICIANDO SERVIDOR ASTRO..."
ssh_exec "
cd $PROJECT_DIR
pkill -f 'astro dev' || true
pkill -f npm || true
sleep 3

echo 'Iniciando servidor Astro...'
nohup npm run dev -- --host 0.0.0.0 --port 4321 > astro-dev.log 2>&1 &
sleep 10

echo 'Verificando estado:'
curl -s -o /dev/null -w 'HTTP Status: %{http_code}\n' http://localhost:4321 || echo 'Sin respuesta aún'
"

# 3. Probar API Directus directamente
echo "🗄️ 3. PROBANDO DIRECTUS API DIRECTAMENTE..."
ssh_exec "
echo '=== DIRECTUS SERVICIOS ==='
curl -s 'http://localhost:8055/items/Servicios?limit=2' | head -c 200

echo -e '\n\n=== DIRECTUS ANTECEDENTES ==='
curl -s 'http://localhost:8055/items/Antecedentes?limit=2' | head -c 200
"

# 4. Probar API UM CLI
echo "⚡ 4. PROBANDO API UM CLI SIN FALLBACK..."
ssh_exec "
echo '=== API UMCLI RESPONSE ==='
curl -s 'http://localhost:4321/api/umcli.json' | head -c 300
echo -e '\n\nVerificando que no contenga \"modo\": \"fallback\"...'
curl -s 'http://localhost:4321/api/umcli.json' | grep -o '\"modo\"' || echo 'Sin modo fallback (correcto)'
"

# 5. Verificar desde exterior (sitio público)
echo "🌐 5. VERIFICANDO DESDE EXTERIOR..."
echo "=== SITIO PRINCIPAL ==="
curl -s -o /dev/null -w "Status: %{http_code} | Tiempo: %{time_total}s\n" "https://www.ultimamilla.com.ar"

echo "=== API PÚBLICA UMCLI ==="
curl -s "https://www.ultimamilla.com.ar/api/umcli.json" | head -c 300

# 6. Probar comandos específicos del CLI
echo "🖥️ 6. PROBANDO COMANDOS CLI ESPECÍFICOS..."
ssh_exec "
echo '=== SIMULANDO COMANDOS CLI ==='
echo 'Datos que debería mostrar el comando \"stats\":'
curl -s 'http://localhost:4321/api/umcli.json' | grep -o '\"estadisticas\":[^}]*}' || echo 'Estadísticas no encontradas'
"

echo "✅ VERIFICACIÓN COMPLETA FINALIZADA"
echo "==================================="

echo "📋 RESUMEN:"
echo "- Si todos los pasos anteriores funcionaron, Directus está restaurado sin fallback"  
echo "- Si hay errores, revisar logs en astro-dev.log"
echo "- El UM CLI debería mostrar datos reales desde Directus"

echo ""
echo "🔍 COMANDOS DE DIAGNÓSTICO ADICIONALES:"
echo "ssh root@$SERVER 'tail -20 $PROJECT_DIR/astro-dev.log'"
echo "ssh root@$SERVER 'docker logs directus-app --tail 10'"
echo "curl -s 'https://www.ultimamilla.com.ar/cli' | grep -o 'UM CLI' | wc -l"
