#!/bin/bash

# Script para actualizar el token de Directus - Nuevo token
# UM25-0.3 - Actualización de token (Fix imágenes)

echo "🔄 ACTUALIZANDO TOKEN DE DIRECTUS (FIX IMÁGENES)"
echo "==============================================="

NEW_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjAzOTdkNzkwLWVkOWItNDkxMC1iOWIxLWI4NjJiODZiODUyNiIsInJvbGUiOiI4NWMxZTZiZi1kZWI1LTRjMGYtYWI5Ny1lYjJkZTA0NGYzODUiLCJhcHBfYWNjZXNzIjp0cnVlLCJhZG1pbl9hY2Nlc3MiOnRydWUsImlhdCI6MTc1MDAzODYyNiwiZXhwIjoxNzUwMDM5NTI2LCJpc3MiOiJkaXJlY3R1cyJ9.hf8qW8xqtHi0GWwS60S4czQ5KUUOsNSDRzGveJNaim4"

# Hacer backup del .env actual
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# Actualizar el token
sed -i "s|PUBLIC_DIRECTUS_TOKEN=.*|PUBLIC_DIRECTUS_TOKEN=$NEW_TOKEN|" .env

echo "✅ Token actualizado en .env"

# Mostrar el token actualizado
echo "🔍 Verificando token en .env:"
grep "PUBLIC_DIRECTUS_TOKEN" .env

# Reiniciar Astro para que tome el nuevo token
echo "🔄 Reiniciando Astro..."
docker compose restart astro-app

echo "✅ Astro reiniciado"

# Verificar que el token funciona
echo "🧪 Probando nuevo token con API de Antecedentes..."
curl -s "http://localhost:8055/items/Antecedentes?access_token=$NEW_TOKEN&limit=2&fields=id,Titulo,Imagen" | head -200

echo ""
echo "🧪 Probando acceso a imagen específica..."
curl -I "http://localhost:8055/assets/6f535377-5177-4fcd-8c8d-8f41f32ece7c?access_token=$NEW_TOKEN" 