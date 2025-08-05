#!/bin/bash

# Script para verificar las correcciones aplicadas al sitio umbot.com.ar
# Ejecutar cuando el servidor 23.105.176.45 esté disponible
# Fecha: 21 Julio 2025

echo "🔍 VERIFICANDO CORRECCIONES APLICADAS AL SITIO UMBOT.COM.AR"
echo "========================================================="
echo ""

# Variables
SERVER_IP="23.105.176.45"
SERVER_USER="root"
SERVER_PASS="gsiB%s@0yD"
DOMAIN="umbot.com.ar"

# Función para verificar URL
check_url() {
  local url=$1
  local description=$2
  
  echo "🌐 Verificando: $description"
  echo "   URL: $url"
  
  local response=$(curl -s -I "$url" | head -1)
  echo "   Respuesta: $response"
  
  if echo "$response" | grep -q "200 OK"; then
    echo "   ✅ OK - Funcionando correctamente"
    return 0
  elif echo "$response" | grep -q "302 Found"; then
    local location=$(curl -s -I "$url" | grep -i "location:" | cut -d' ' -f2 | tr -d '\r')
    echo "   ⚠️ REDIRECT - Redirige a: $location"
    return 1
  else
    echo "   ❌ ERROR - No responde correctamente"
    return 1
  fi
  echo ""
}

# Función para ejecutar comandos SSH
execute_ssh() {
  local command=$1
  local description=$2
  echo "🔧 $description"
  sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP "$command"
  local status=$?
  if [ $status -eq 0 ]; then
    echo "✅ OK"
  else
    echo "❌ ERROR (código: $status)"
  fi
  echo ""
}

echo "📡 PASO 1: VERIFICANDO CONECTIVIDAD DEL SERVIDOR"
echo "==============================================="

# Verificar ping
echo "🔍 Verificando conectividad básica..."
if ping -c 3 $SERVER_IP > /dev/null 2>&1; then
  echo "✅ Servidor responde a ping"
else
  echo "❌ Servidor no responde a ping"
  echo "⚠️ No se pueden ejecutar verificaciones remotas"
  echo "🔄 Continuando con verificaciones públicas..."
fi

echo ""
echo "🌐 PASO 2: VERIFICANDO SITIO WEB PÚBLICO"
echo "========================================"

# Verificar sitio principal
check_url "https://$DOMAIN" "Página principal"
check_url "https://$DOMAIN/servicios" "Página de servicios"
check_url "https://$DOMAIN/antecedentes" "Página de antecedentes"

echo ""
echo "🔗 PASO 3: VERIFICANDO PÁGINAS INDIVIDUALES DE SERVICIOS"
echo "======================================================="

# Verificar páginas individuales (las que estaban fallando)
check_url "https://$DOMAIN/servicios/1/servicios-it" "Servicios IT"
check_url "https://$DOMAIN/servicios/2/redes-de-datos" "Redes de datos"
check_url "https://$DOMAIN/servicios/3/seguridad-informatica" "Seguridad Informática"
check_url "https://$DOMAIN/servicios/4/telefonia-y-citoina" "Telefonía y Citofonía"
check_url "https://$DOMAIN/servicios/6/servicios-web" "Servicios Web"

echo ""
echo "🖼️ PASO 4: VERIFICANDO IMÁGENES DE SERVICIOS"
echo "==========================================="

# Verificar imágenes (que estaban mostrando iconos genéricos)
check_url "https://$DOMAIN/images/services/servicios-it.jpg" "Imagen Servicios IT"
check_url "https://$DOMAIN/images/services/redes-comunicaciones.jpg" "Imagen Redes"
check_url "https://$DOMAIN/images/services/ciberseguridad.jpg" "Imagen Seguridad"
check_url "https://$DOMAIN/images/services/telefonia.jpg" "Imagen Telefonía"
check_url "https://$DOMAIN/images/services/servicios-web.jpg" "Imagen Servicios Web"

echo ""
echo "🐳 PASO 5: VERIFICANDO CONTENEDORES (SI SSH DISPONIBLE)"
echo "====================================================="

# Solo si el servidor responde
if ping -c 1 $SERVER_IP > /dev/null 2>&1; then
  execute_ssh "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | grep -E '(nginx|astro|directus)'" "Estado de contenedores principales"
  execute_ssh "docker logs astro-app --tail 5" "Últimos logs de Astro"
  execute_ssh "curl -s http://localhost:8055/items/Servicios?limit=1 | head -50" "API de Directus"
else
  echo "⚠️ Servidor no accesible vía SSH - Saltando verificaciones remotas"
fi

echo ""
echo "📊 PASO 6: VERIFICANDO DIRECTUS CMS INDEPENDIENTE"
echo "==============================================="

# Verificar que Directus siga funcionando independientemente
if ping -c 1 $SERVER_IP > /dev/null 2>&1; then
  execute_ssh "curl -s -I http://localhost:8055/admin | head -1" "Panel de administración Directus"
  execute_ssh "curl -s http://localhost:8055/items/Servicios | grep -o '\"Titulo\":\"[^\"]*' | head -3" "Datos de servicios en Directus"
else
  echo "⚠️ No se puede verificar Directus - Servidor no accesible"
fi

echo ""
echo "✅ VERIFICACIÓN COMPLETADA"
echo "========================="
echo ""
echo "📊 RESUMEN DE VERIFICACIÓN:"
echo "• Sitio principal: Verificado"
echo "• Páginas de servicios: Verificadas"
echo "• Páginas individuales: Estado verificado"
echo "• Imágenes: Disponibilidad verificada"
echo "• Contenedores: Estado verificado (si accesible)"
echo "• Directus CMS: Funcionamiento verificado (si accesible)"
echo ""
echo "🎯 PRÓXIMOS PASOS SI HAY PROBLEMAS:"
echo "1. Revisar logs de Astro para errores de conectividad"
echo "2. Verificar configuración de nginx"
echo "3. Comprobar que Directus esté respondiendo"
echo "4. Corregir datos en Directus si es necesario"
echo ""
echo "📝 DOCUMENTAR RESULTADOS EN solucionfinal.md"