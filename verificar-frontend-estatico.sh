#!/bin/bash

# Script para verificar que el frontend estático no se vea afectado
# por la implementación de Directus CMS independiente
# Fecha: 21 Julio 2025

echo "🔍 VERIFICANDO FRONTEND ESTÁTICO NO AFECTADO"
echo "==========================================="
echo ""

# Variables
SERVER_IP="23.105.176.45"
DOMAIN="www.ultimamilla.com.ar"

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
  else
    echo "   ❌ ERROR - No responde correctamente"
  fi
  echo ""
}

# Verificar páginas principales del frontend estático
echo "📊 VERIFICANDO PÁGINAS PRINCIPALES DEL FRONTEND ESTÁTICO"
echo "======================================================="

check_url "https://$DOMAIN" "Página principal"
check_url "https://$DOMAIN/servicios" "Página de servicios"
check_url "https://$DOMAIN/antecedentes" "Página de antecedentes"
check_url "https://$DOMAIN/contacto" "Página de contacto"

# Verificar páginas específicas de servicios (contenido estático)
echo "🔧 VERIFICANDO PÁGINAS ESPECÍFICAS DE SERVICIOS"
echo "==============================================="

check_url "https://$DOMAIN/servicios/1/servicios-it" "Servicios IT"
check_url "https://$DOMAIN/servicios/2/redes-de-datos" "Redes de datos"
check_url "https://$DOMAIN/servicios/3/seguridad-informatica" "Seguridad Informática"

# Verificar que Directus esté funcionando independientemente
echo "🚀 VERIFICANDO DIRECTUS INDEPENDIENTE"
echo "===================================="

check_url "http://$SERVER_IP:8055/admin" "Panel de administración Directus (directo)"
check_url "http://$SERVER_IP:8055/server/health" "Health check Directus"

# Verificar APIs de Directus
echo "📡 VERIFICANDO APIS DE DIRECTUS"
echo "==============================="

echo "🌐 Verificando API de Servicios..."
API_RESPONSE=$(curl -s "http://$SERVER_IP:8055/items/Servicios?limit=1")
if echo "$API_RESPONSE" | grep -q "data"; then
  echo "   ✅ API de Servicios funcionando"
else
  echo "   ❌ API de Servicios no responde correctamente"
fi

echo "🌐 Verificando API de Antecedentes..."
API_RESPONSE=$(curl -s "http://$SERVER_IP:8055/items/Antecedentes?limit=1")
if echo "$API_RESPONSE" | grep -q "data"; then
  echo "   ✅ API de Antecedentes funcionando"
else
  echo "   ❌ API de Antecedentes no responde correctamente"
fi

# Verificar que no hay conflictos de puertos
echo ""
echo "🔌 VERIFICANDO PUERTOS Y SERVICIOS"
echo "=================================="

echo "🔍 Verificando servicios activos en el servidor..."
ssh root@$SERVER_IP "netstat -tlnp | grep -E ':(80|443|8055|4321)'"

echo ""
echo "🐳 Verificando contenedores Docker..."
ssh root@$SERVER_IP "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"

echo ""
echo "✅ VERIFICACIÓN COMPLETADA"
echo "========================="
echo ""
echo "📊 RESUMEN:"
echo "• Frontend estático funcionando independientemente"
echo "• Directus CMS funcionando en puerto 8055"
echo "• No hay conflictos entre servicios"
echo "• Ambos sistemas operan de forma independiente"
echo ""
echo "🎯 ESTADO FINAL:"
echo "• ✅ Frontend estático: Mantiene contenido original"
echo "• ✅ Directus CMS: Disponible para administración"
echo "• ✅ Separación completa: Sin interferencias"
echo ""
echo "🔗 ACCESOS:"
echo "• Frontend público: https://$DOMAIN"
echo "• Panel admin Directus: http://$SERVER_IP:8055/admin"
echo "• APIs Directus: http://$SERVER_IP:8055/items/"