#!/bin/bash

# Script para corregir problemas en la página /antecedentes de umbot.com.ar
# Ejecutar cuando el servidor 23.105.176.45 esté disponible
# Fecha: 21 Enero 2025

# Variables
SERVER="23.105.176.45"
USER="root"
PASS="gsiB%s@0yD"
DOCKER_DIR="/root/fumbling-field"

# Colores
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
NC="\033[0m"

echo -e "${YELLOW}🔧 CORRECCIÓN DE PÁGINA /ANTECEDENTES${NC}"
echo "======================================="

# Verificar conectividad
echo -e "\n${YELLOW}1. Verificando conectividad con el servidor...${NC}"
if ! ping -c 1 -W 3 $SERVER &> /dev/null; then
    echo -e "${RED}❌ ERROR: No se puede conectar al servidor. Intente más tarde.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Servidor accesible${NC}"

# Función para ejecutar comandos SSH
ssh_exec() {
    sshpass -p "$PASS" ssh -o StrictHostKeyChecking=no "$USER@$SERVER" "$1"
}

# Verificar estado de contenedores
echo -e "\n${YELLOW}2. Verificando estado de contenedores...${NC}"
ssh_exec "cd $DOCKER_DIR && docker ps | grep -E '(nginx|astro|directus)'"

# Verificar si existe la ruta /antecedentes en Astro
echo -e "\n${YELLOW}3. Verificando archivos de la página antecedentes...${NC}"
ssh_exec "cd $DOCKER_DIR && docker exec astro-app find /app/src -name '*antecedent*' -o -name '*about*' -o -name '*historia*' 2>/dev/null || echo 'No se encontraron archivos relacionados'"

# Verificar rutas en Astro
echo -e "\n${YELLOW}4. Verificando rutas disponibles en Astro...${NC}"
ssh_exec "cd $DOCKER_DIR && docker exec astro-app find /app/src/pages -name '*.astro' | head -10"

# Corregir URL hardcodeada si existe en archivos relacionados con antecedentes
echo -e "\n${YELLOW}5. Corrigiendo URLs hardcodeadas en archivos...${NC}"
ssh_exec "cd $DOCKER_DIR && docker exec astro-app find /app/src -type f -name '*.astro' -o -name '*.js' -o -name '*.ts' | xargs grep -l 'umbot-directus' 2>/dev/null | head -5"

# Aplicar corrección de URL
ssh_exec "cd $DOCKER_DIR && docker exec astro-app find /app/src -type f -name '*.astro' -o -name '*.js' -o -name '*.ts' | xargs sed -i 's|http://umbot-directus:8055|http://directus-app:8055|g' 2>/dev/null && echo 'URLs corregidas'"

# Verificar si existe contenido de antecedentes en Directus
echo -e "\n${YELLOW}6. Verificando contenido de antecedentes en Directus...${NC}"
TOKEN_CMD="curl -s -X POST http://localhost:8055/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"admin@example.com\",\"password\":\"d1r3ctu5\"}' | grep -o '\"access_token\":\"[^\"]*' | cut -d'\"' -f4"
TOKEN=$(ssh_exec "$TOKEN_CMD")

if [[ -n "$TOKEN" ]]; then
    echo -e "${GREEN}✅ Token obtenido${NC}"
    
    # Buscar colecciones relacionadas con antecedentes
    ssh_exec "curl -s -H \"Authorization: Bearer $TOKEN\" http://localhost:8055/collections | grep -i -E '(antecedent|about|historia|empresa)' || echo 'No se encontraron colecciones relacionadas'"
    
    # Verificar si existe una página o contenido de antecedentes
    ssh_exec "curl -s -H \"Authorization: Bearer $TOKEN\" http://localhost:8055/items/paginas?filter[slug][_eq]=antecedentes 2>/dev/null || echo 'No se encontró página de antecedentes'"
else
    echo -e "${RED}❌ No se pudo obtener token de Directus${NC}"
fi

# Verificar configuración de nginx para la ruta /antecedentes
echo -e "\n${YELLOW}7. Verificando configuración de nginx...${NC}"
ssh_exec "cd $DOCKER_DIR && docker exec nginx-app cat /etc/nginx/conf.d/default.conf | grep -A5 -B5 antecedent || echo 'No hay configuración específica para /antecedentes'"

# Reiniciar contenedores para aplicar cambios
echo -e "\n${YELLOW}8. Reiniciando contenedores...${NC}"
ssh_exec "cd $DOCKER_DIR && docker compose restart astro-app nginx-app"

echo -e "\n${YELLOW}9. Esperando a que los servicios estén disponibles...${NC}"
sleep 20

# Verificar acceso a la página
echo -e "\n${YELLOW}10. Verificando acceso a la página /antecedentes...${NC}"
RESPONSE=$(ssh_exec "curl -s -I https://umbot.com.ar/antecedentes | head -1")
echo "Respuesta: $RESPONSE"

if echo "$RESPONSE" | grep -q "200 OK"; then
    echo -e "${GREEN}✅ Página /antecedentes funcionando correctamente${NC}"
elif echo "$RESPONSE" | grep -q "404"; then
    echo -e "${RED}❌ Página /antecedentes devuelve 404 - Necesita ser creada${NC}"
    
    # Sugerir creación de la página
    echo -e "\n${YELLOW}💡 SUGERENCIA: Crear página de antecedentes${NC}"
    echo "1. Crear archivo /app/src/pages/antecedentes.astro en el contenedor Astro"
    echo "2. O crear contenido en Directus con slug 'antecedentes'"
    echo "3. Verificar que la ruta esté configurada correctamente"
else
    echo -e "${RED}❌ Error inesperado en la respuesta${NC}"
fi

# Verificar logs de nginx y astro
echo -e "\n${YELLOW}11. Verificando logs de errores...${NC}"
ssh_exec "cd $DOCKER_DIR && docker logs nginx-app --tail 5 2>/dev/null"
ssh_exec "cd $DOCKER_DIR && docker logs astro-app --tail 5 2>/dev/null"

echo -e "\n${GREEN}✅ VERIFICACIÓN COMPLETADA${NC}"
echo "=========================="
echo "1. URLs hardcodeadas corregidas"
echo "2. Contenedores reiniciados"
echo "3. Estado de /antecedentes verificado"
echo ""
echo "📝 Si la página devuelve 404, necesita ser creada en:"
echo "   - Astro: /app/src/pages/antecedentes.astro"
echo "   - O en Directus como contenido dinámico"