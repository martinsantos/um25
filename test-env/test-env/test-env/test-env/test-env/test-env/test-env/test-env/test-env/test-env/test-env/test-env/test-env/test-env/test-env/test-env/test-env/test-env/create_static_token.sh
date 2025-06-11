#!/bin/bash

# Obtener un token de autenticación para el administrador
TOKEN=$(curl -s -X POST http://23.105.176.45:8055/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"adminpassword"}' | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

echo "Token de autenticación: $TOKEN"

# Crear un token estático
STATIC_TOKEN=$(curl -s -X POST http://23.105.176.45:8055/users/me/tokens \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"static_token"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

echo "Token estático creado: $STATIC_TOKEN"

# Actualizar el archivo .env con el nuevo token
ssh root@23.105.176.45 "cd /root/um25 && sed -i 's/DIRECTUS_STATIC_TOKEN=.*/DIRECTUS_STATIC_TOKEN=$STATIC_TOKEN/' .env"

# Reiniciar los contenedores
ssh root@23.105.176.45 "cd /root/um25 && docker-compose -f docker-compose.server.yml down && docker-compose -f docker-compose.server.yml up -d"

echo "Configuración actualizada y contenedores reiniciados"
