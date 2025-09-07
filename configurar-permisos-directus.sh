#!/bin/bash

# Script para configurar permisos públicos en Directus
# Parte de la implementación de Directus como administrador de contenido para ultimamilla.com.ar
# Fecha: 21 Julio 2025

echo "🔒 CONFIGURANDO PERMISOS PÚBLICOS EN DIRECTUS"
echo "==========================================="
echo ""

# Variables
SERVER_IP="23.105.176.45"
DIRECTUS_PORT="8055"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="d1r3ctu5"

# Obtener token de acceso
echo "🔑 Obteniendo token de acceso..."
TOKEN_RESPONSE=$(curl -s -X POST "http://$SERVER_IP:$DIRECTUS_PORT/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

# Extraer token
TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Error obteniendo token de acceso"
  echo "Respuesta: $TOKEN_RESPONSE"
  exit 1
fi

echo "✅ Token obtenido exitosamente"

# Obtener ID del rol público
echo "🔍 Obteniendo ID del rol público..."
PUBLIC_ROLE_RESPONSE=$(curl -s "http://$SERVER_IP:$DIRECTUS_PORT/roles" \
  -H "Authorization: Bearer $TOKEN")

PUBLIC_ROLE_ID=$(echo $PUBLIC_ROLE_RESPONSE | grep -o '"id":"public"' | cut -d'"' -f4)

if [ -z "$PUBLIC_ROLE_ID" ]; then
  echo "❌ Error obteniendo ID del rol público"
  echo "Respuesta: $PUBLIC_ROLE_RESPONSE"
  exit 1
fi

echo "✅ ID del rol público: $PUBLIC_ROLE_ID"

# Configurar permisos para Servicios
echo "🔒 Configurando permisos para colección Servicios..."
curl -s -X POST "http://$SERVER_IP:$DIRECTUS_PORT/permissions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"role\": \"$PUBLIC_ROLE_ID\",
    \"collection\": \"Servicios\",
    \"action\": \"read\",
    \"fields\": [\"*\"]
  }"

# Configurar permisos para Antecedentes
echo "🔒 Configurando permisos para colección Antecedentes..."
curl -s -X POST "http://$SERVER_IP:$DIRECTUS_PORT/permissions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"role\": \"$PUBLIC_ROLE_ID\",
    \"collection\": \"Antecedentes\",
    \"action\": \"read\",
    \"fields\": [\"*\"]
  }"

# Verificar permisos configurados
echo "🔍 Verificando permisos configurados..."
PERMISSIONS_RESPONSE=$(curl -s "http://$SERVER_IP:$DIRECTUS_PORT/permissions" \
  -H "Authorization: Bearer $TOKEN")

echo "✅ Permisos configurados exitosamente"
echo ""
echo "🌐 Probando acceso público a APIs..."
curl -s "http://$SERVER_IP:$DIRECTUS_PORT/items/Servicios?limit=1"
curl -s "http://$SERVER_IP:$DIRECTUS_PORT/items/Antecedentes?limit=1"

echo ""
echo "✅ CONFIGURACIÓN DE PERMISOS COMPLETADA"
echo "======================================"
echo ""
echo "🎯 PRÓXIMOS PASOS:"
echo "1. Verificar que el frontend pueda acceder a los datos sin autenticación"
echo "2. Probar la integración completa con el frontend"