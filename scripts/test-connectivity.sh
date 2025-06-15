#!/bin/bash

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Iniciando validación de conectividad...${NC}\n"

# 1. Obtener token de autenticación
echo -e "${YELLOW}1. Obteniendo token de autenticación...${NC}"
TOKEN=$(curl -s -X POST http://localhost:8055/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@example.com","password":"d1r3ctu5"}' | jq -r '.data.access_token')

if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Error al obtener token${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Token obtenido correctamente${NC}"
fi

# 2. Verificar endpoints principales
echo -e "\n${YELLOW}2. Verificando endpoints principales...${NC}"
ENDPOINTS=(
    "/items/antecedentes"
    "/files"
    "/users/me"
    "/collections"
)

for endpoint in "${ENDPOINTS[@]}"; do
    response=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $TOKEN" "http://localhost:8055$endpoint")
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$status_code" -eq 200 ]; then
        echo -e "${GREEN}✅ $endpoint: OK (${status_code})${NC}"
    else
        echo -e "${RED}❌ $endpoint: Error (${status_code})${NC}"
        echo "$body" | jq '.'
    fi
done

# 3. Verificar permisos
echo -e "\n${YELLOW}3. Verificando permisos...${NC}"
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:8055/permissions" | jq '.data[] | {collection, action, permissions}'

# 4. Verificar rate limiting
echo -e "\n${YELLOW}4. Verificando rate limiting...${NC}"
for i in {1..5}; do
    response=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $TOKEN" "http://localhost:8055/items/antecedentes")
    status_code=$(echo "$response" | tail -n1)
    if [ "$status_code" -eq 200 ]; then
        echo -e "${GREEN}✅ Request $i: OK${NC}"
    else
        echo -e "${RED}❌ Request $i: Error (${status_code})${NC}"
    fi
    sleep 1
done

# 5. Verificar consultas complejas
echo -e "\n${YELLOW}5. Verificando consultas complejas...${NC}"
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:8055/items/antecedentes?filter[status][_eq]=published&fields=id,titulo,descripcion,imagen&sort=-created_at" | jq '.'

# 6. Verificar paginación
echo -e "\n${YELLOW}6. Verificando paginación...${NC}"
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:8055/items/antecedentes?page=1&limit=10" | jq '.'

echo -e "\n${GREEN}Validación de conectividad completada${NC}" 