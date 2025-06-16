#!/bin/bash

# Script para actualizar el token de Directus
# UM25-0.3 - Actualización de token

echo "🔄 ACTUALIZANDO TOKEN DE DIRECTUS"
echo "================================="

NEW_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjAzOTdkNzkwLWVkOWItNDkxMC1iOWIxLWI4NjJiODZiODUyNiIsInJvbGUiOiI4NWMxZTZiZi1kZWI1LTRjMGYtYWI5Ny1lYjJkZTA0NGYzODUiLCJhcHBfYWNjZXNzIjp0cnVlLCJhZG1pbl9hY2Nlc3MiOnRydWUsImlhdCI6MTc1MDAzODIzMSwiZXhwIjoxNzUwMDM5MTMxLCJpc3MiOiJkaXJlY3R1cyJ9.Uqz178tspqmfLF0p9Uz2fDoOwGEbjbI93BU2-UEJu8k"

# Hacer backup del .env actual
cp .env .env.backup

# Actualizar el token
sed -i "s|PUBLIC_DIRECTUS_TOKEN=.*|PUBLIC_DIRECTUS_TOKEN=$NEW_TOKEN|" .env

echo "✅ Token actualizado en .env"

# Reiniciar Astro para que tome el nuevo token
echo "🔄 Reiniciando Astro..."
docker compose restart astro-app

echo "✅ Astro reiniciado"

# Verificar que el token funciona
echo "🧪 Probando nuevo token..."
curl -s "http://localhost:8055/items/Antecedentes?access_token=$NEW_TOKEN&limit=1" | head -100 