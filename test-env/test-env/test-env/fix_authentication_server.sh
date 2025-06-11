#!/bin/bash

# Script para corregir problemas de autenticación en el servidor de producción
# Este script debe ejecutarse en el servidor: root@23.105.176.45

# Colores para mensajes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== INICIANDO CORRECCIÓN DE PROBLEMAS DE AUTENTICACIÓN ===${NC}"
echo -e "${YELLOW}Este script implementará la solución para los errores 401 en el sitio Astro + Directus${NC}"

# 1. Verificar la estructura del proyecto
echo -e "\n${YELLOW}[1/10] Verificando estructura del proyecto...${NC}"
PROJECT_DIR="/root/um25"
if [ ! -d "$PROJECT_DIR" ]; then
  # Intentar encontrar el directorio del proyecto
  POSSIBLE_DIR=$(find /root -maxdepth 2 -type d -name "*um*" | head -n 1)
  if [ -n "$POSSIBLE_DIR" ]; then
    PROJECT_DIR=$POSSIBLE_DIR
    echo -e "${GREEN}Directorio del proyecto encontrado en: $PROJECT_DIR${NC}"
  else
    echo -e "${RED}No se pudo encontrar el directorio del proyecto.${NC}"
    echo -e "${YELLOW}Por favor, especifique manualmente el directorio del proyecto:${NC}"
    read -p "Directorio: " PROJECT_DIR
  fi
fi

# Cambiar al directorio del proyecto
cd $PROJECT_DIR
echo -e "${GREEN}Trabajando en directorio: $(pwd)${NC}"

# 2. Respaldar archivos de configuración
echo -e "\n${YELLOW}[2/10] Respaldando archivos de configuración...${NC}"
if [ -f ".env.prod" ]; then
  cp .env.prod .env.prod.backup.$(date +%Y%m%d%H%M%S)
  echo -e "${GREEN}Respaldo de .env.prod creado${NC}"
else
  echo -e "${RED}Archivo .env.prod no encontrado. Se creará uno nuevo.${NC}"
fi

if [ -f "docker-compose.production.yml" ]; then
  cp docker-compose.production.yml docker-compose.production.yml.backup.$(date +%Y%m%d%H%M%S)
  echo -e "${GREEN}Respaldo de docker-compose.production.yml creado${NC}"
else
  echo -e "${RED}Archivo docker-compose.production.yml no encontrado. Se creará uno nuevo.${NC}"
fi

# 3. Actualizar archivo .env.prod
echo -e "\n${YELLOW}[3/10] Actualizando archivo .env.prod...${NC}"
cat > .env.prod << 'EOF'
# Directus Configuration
PUBLIC_DIRECTUS_URL=http://23.105.176.45:8055
PUBLIC_DIRECTUS_TOKEN="k6P8LAY8_x_y1miB_KTlWnysCnx2Abky"
DIRECTUS_STATIC_TOKEN="k6P8LAY8_x_y1miB_KTlWnysCnx2Abky"
DIRECTUS_KEY="pzdIoGXgfJODqy8lLFxwi2NOK/K7j7Qii7W26rHS9Tk="
DIRECTUS_SECRET="d/QUPftXXNdfnAmN5SSmWPrYLzHqWF9rixk6XrwchR4="

# Site Configuration
SITE_URL=http://23.105.176.45:8080
NODE_ENV=production

# Database Configuration
DB_CLIENT=pg
DB_HOST=database
DB_PORT=5432
DB_USER=myuser
DB_PASSWORD=mypassword
DB_DATABASE=mydatabase

# Admin User (only used on first run)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=adminpassword

# CORS Configuration
CORS_ENABLED=true
CORS_ORIGIN=http://23.105.176.45:8080,http://23.105.176.45:8055

# Public URLs
PUBLIC_URL=http://23.105.176.45:8055
PUBLIC_ASSETS=true
ASSETS_TRANSFORM_TOKEN_OPTIONAL=true

# Public Role ID
PUBLIC_ROLE=74e3b05e-0f14-422e-9ad3-759d426db60a

# Security Settings
RATE_LIMITER_ENABLED=true
RATE_LIMITER_STORE=memory
RATE_LIMITER_POINTS=50
RATE_LIMITER_DURATION=1

# Cache Settings
ASSETS_CACHE_TTL=0
CACHE_ENABLED=false
EOF
echo -e "${GREEN}Archivo .env.prod actualizado correctamente${NC}"

# 4. Actualizar docker-compose.production.yml
echo -e "\n${YELLOW}[4/10] Actualizando archivo docker-compose.production.yml...${NC}"
cat > docker-compose.production.yml << 'EOF'
version: '3.8'

services:
  astro-app:
    image: santosma/um25:astro-latest
    container_name: astro-app
    restart: always
    ports:
      - "8080:4321"
    env_file:
      - .env.prod
    environment:
      - NODE_ENV=production
      - DIRECTUS_URL=http://directus-app:8055
      - PUBLIC_DIRECTUS_TOKEN=k6P8LAY8_x_y1miB_KTlWnysCnx2Abky
    depends_on:
      - directus-app
    networks:
      - um25_network
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:4321"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    deploy:
      resources:
        limits:
          memory: 1G
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  database:
    image: postgres:15-alpine
    container_name: database
    restart: always
    environment:
      POSTGRES_USER: ${DB_USER:-myuser}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-mypassword}
      POSTGRES_DB: ${DB_DATABASE:-mydatabase}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - um25_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-myuser} -d ${DB_DATABASE:-mydatabase}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s
    deploy:
      resources:
        limits:
          memory: 1G
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  directus-app:
    image: santosma/um25:directus-latest
    container_name: directus-app
    restart: always
    ports:
      - "8055:8055"
    depends_on:
      - database
    env_file:
      - .env.prod
    environment:
      KEY: ${DIRECTUS_KEY:-pzdIoGXgfJODqy8lLFxwi2NOK/K7j7Qii7W26rHS9Tk=}
      SECRET: ${DIRECTUS_SECRET:-d/QUPftXXNdfnAmN5SSmWPrYLzHqWF9rixk6XrwchR4=}
      DB_CLIENT: pg
      DB_HOST: database
      DB_PORT: 5432
      DB_USER: ${DB_USER:-myuser}
      DB_PASSWORD: ${DB_PASSWORD:-mypassword}
      DB_DATABASE: ${DB_DATABASE:-mydatabase}
      ADMIN_EMAIL: ${ADMIN_EMAIL:-admin@example.com}
      ADMIN_PASSWORD: ${ADMIN_PASSWORD:-adminpassword}
      PUBLIC_URL: ${PUBLIC_URL:-http://23.105.176.45:8055}
      CORS_ENABLED: ${CORS_ENABLED:-true}
      CORS_ORIGIN: ${CORS_ORIGIN:-http://23.105.176.45:8080,http://23.105.176.45:8055}
      PUBLIC_ASSETS: ${PUBLIC_ASSETS:-true}
      ASSETS_CACHE_TTL: "0"
      ASSETS_TRANSFORM_TOKEN_OPTIONAL: "true"
      PUBLIC_ROLE: ${PUBLIC_ROLE:-74e3b05e-0f14-422e-9ad3-759d426db60a}
      RATE_LIMITER_ENABLED: "true"
      RATE_LIMITER_STORE: "memory"
      RATE_LIMITER_POINTS: "50"
      RATE_LIMITER_DURATION: "1"
    volumes:
      - directus_uploads:/directus/uploads
      - directus_extensions:/directus/extensions
    networks:
      - um25_network
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:8055/server/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    deploy:
      resources:
        limits:
          memory: 1G
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

volumes:
  postgres_data:
    name: um25_postgres_data
  directus_uploads:
    name: um25_directus_uploads
  directus_extensions:
    name: um25_directus_extensions

networks:
  um25_network:
    name: um25_network
EOF
echo -e "${GREEN}Archivo docker-compose.production.yml actualizado correctamente${NC}"

# 5. Verificar que los contenedores estén en ejecución
echo -e "\n${YELLOW}[5/10] Verificando estado de los contenedores...${NC}"
if docker ps | grep -q "database"; then
  echo -e "${GREEN}Contenedor database está en ejecución${NC}"
else
  echo -e "${RED}Contenedor database no está en ejecución.${NC}"
  echo -e "${YELLOW}Intentando iniciar los contenedores...${NC}"
  docker-compose -f docker-compose.production.yml up -d database
  sleep 10
  if ! docker ps | grep -q "database"; then
    echo -e "${RED}No se pudo iniciar el contenedor database. Continuando de todos modos...${NC}"
  fi
fi

# 6. Actualizar token en la base de datos
echo -e "\n${YELLOW}[6/10] Actualizando token en la base de datos...${NC}"
CORRECT_TOKEN="k6P8LAY8_x_y1miB_KTlWnysCnx2Abky"
if docker ps | grep -q "database"; then
  echo -e "${YELLOW}Ejecutando actualización del token...${NC}"
  docker exec database psql -U myuser -d mydatabase -c "UPDATE directus_users SET token = '$CORRECT_TOKEN' WHERE admin_access = true;"
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}Token actualizado correctamente en la base de datos${NC}"
  else
    echo -e "${RED}Error al actualizar el token en la base de datos${NC}"
  fi
else
  echo -e "${RED}No se puede actualizar el token porque el contenedor database no está en ejecución${NC}"
fi

# 7. Configurar permisos en Directus
echo -e "\n${YELLOW}[7/10] Configurando permisos en Directus...${NC}"
cat > update_permissions.sql << 'EOF'
-- Asegurar que el rol público tenga acceso a los recursos necesarios
INSERT INTO directus_permissions 
(id, role_id, collection, action, permissions, validation, presets, fields) 
VALUES 
(uuid_generate_v4(), '74e3b05e-0f14-422e-9ad3-759d426db60a', 'directus_files', 'read', '{}', '{}', NULL, '*'),
(uuid_generate_v4(), '74e3b05e-0f14-422e-9ad3-759d426db60a', 'Antecedentes', 'read', '{}', '{}', NULL, '*'),
(uuid_generate_v4(), '74e3b05e-0f14-422e-9ad3-759d426db60a', 'Antecedentes_files', 'read', '{}', '{}', NULL, '*'),
(uuid_generate_v4(), '74e3b05e-0f14-422e-9ad3-759d426db60a', 'Servicios', 'read', '{}', '{}', NULL, '*'),
(uuid_generate_v4(), '74e3b05e-0f14-422e-9ad3-759d426db60a', 'Servicios_files', 'read', '{}', '{}', NULL, '*')
ON CONFLICT DO NOTHING;
EOF

if docker ps | grep -q "database"; then
  echo -e "${YELLOW}Ejecutando script de permisos...${NC}"
  docker exec -i database psql -U myuser -d mydatabase < update_permissions.sql
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}Permisos configurados correctamente${NC}"
  else
    echo -e "${RED}Error al configurar permisos${NC}"
  fi
else
  echo -e "${RED}No se pueden configurar permisos porque el contenedor database no está en ejecución${NC}"
fi

# 8. Actualizar código compilado de Astro (si es necesario)
echo -e "\n${YELLOW}[8/10] Actualizando código compilado de Astro...${NC}"
cat > fix_astro_compiled.sh << 'EOF'
#!/bin/bash
# Script para actualizar el token en los archivos compilados de Astro

OLD_TOKEN="eqGR2YD4QrMIsftG6V2FR5MuNu0Ope6-"
NEW_TOKEN="k6P8LAY8_x_y1miB_KTlWnysCnx2Abky"

# Ejecutar dentro del contenedor de Astro
if docker ps | grep -q "astro-app"; then
  echo "Buscando archivos que contengan el token antiguo..."
  docker exec astro-app bash -c "cd /app/dist && grep -r '$OLD_TOKEN' --include='*.js' . | cut -d: -f1" > token_files.txt
  
  if [ -s token_files.txt ]; then
    echo "Archivos encontrados, actualizando token..."
    cat token_files.txt | while read file; do
      docker exec astro-app bash -c "cd /app/dist && sed -i 's/$OLD_TOKEN/$NEW_TOKEN/g' $file"
      echo "Actualizado: $file"
    done
    echo "Token actualizado en todos los archivos"
  else
    echo "No se encontraron archivos con el token antiguo"
  fi
else
  echo "El contenedor astro-app no está en ejecución"
fi
EOF

chmod +x fix_astro_compiled.sh
./fix_astro_compiled.sh

# 9. Reiniciar servicios
echo -e "\n${YELLOW}[9/10] Reiniciando servicios...${NC}"
echo -e "${YELLOW}Deteniendo contenedores...${NC}"
docker-compose -f docker-compose.production.yml down
echo -e "${YELLOW}Iniciando contenedores con la nueva configuración...${NC}"
docker-compose -f docker-compose.production.yml up -d
echo -e "${GREEN}Servicios reiniciados correctamente${NC}"

# 10. Verificar solución
echo -e "\n${YELLOW}[10/10] Verificando solución...${NC}"
echo -e "${YELLOW}Esperando 30 segundos para que los servicios estén disponibles...${NC}"
sleep 30

echo -e "${YELLOW}Verificando que los contenedores estén en ejecución...${NC}"
docker ps

echo -e "${YELLOW}Verificando que el token funciona correctamente...${NC}"
curl -s -o token_check.json -w "%{http_code}" -X GET http://23.105.176.45:8055/users/me -H "Authorization: Bearer $CORRECT_TOKEN"
HTTP_CODE=$(cat token_check.json | tail -n 1)
if [[ "$HTTP_CODE" == "200" ]]; then
  echo -e "${GREEN}Token verificado correctamente (Código HTTP: $HTTP_CODE)${NC}"
else
  echo -e "${RED}Error al verificar el token. Código HTTP: $HTTP_CODE${NC}"
  echo -e "${YELLOW}Respuesta:${NC}"
  cat token_check.json
fi

echo -e "${YELLOW}Verificando acceso a las colecciones...${NC}"
curl -s -o antecedentes_check.json -w "%{http_code}" -X GET http://23.105.176.45:8055/items/Antecedentes -H "Authorization: Bearer $CORRECT_TOKEN"
HTTP_CODE=$(cat antecedentes_check.json | tail -n 1)
if [[ "$HTTP_CODE" == "200" ]]; then
  echo -e "${GREEN}Acceso a colección Antecedentes verificado correctamente (Código HTTP: $HTTP_CODE)${NC}"
else
  echo -e "${RED}Error al verificar acceso a colección Antecedentes. Código HTTP: $HTTP_CODE${NC}"
fi

echo -e "\n${GREEN}=== PROCESO COMPLETADO ===${NC}"
echo -e "${GREEN}Ahora verifica manualmente que las siguientes URLs funcionen correctamente:${NC}"
echo -e "${YELLOW}- http://23.105.176.45:8080/ (página principal)${NC}"
echo -e "${YELLOW}- http://23.105.176.45:8080/antecedentes (lista de antecedentes)${NC}"
echo -e "${YELLOW}- http://23.105.176.45:8080/servicios (lista de servicios)${NC}"

echo -e "\n${YELLOW}Si persisten los problemas, verifica los logs de los contenedores:${NC}"
echo -e "${YELLOW}docker logs astro-app${NC}"
echo -e "${YELLOW}docker logs directus-app${NC}"
