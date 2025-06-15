#!/bin/bash

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuración
SERVER_IP="23.105.176.45"
REMOTE_DIR="/root/fumbling-field"

echo -e "${YELLOW}Iniciando despliegue al servidor...${NC}"

# 1. Limpiar completamente el directorio en el servidor
echo -e "${YELLOW}Limpiando directorio en el servidor...${NC}"
ssh root@$SERVER_IP "rm -rf $REMOTE_DIR && mkdir -p $REMOTE_DIR"

# 2. Copiar archivos al servidor (excluyendo archivos innecesarios)
echo -e "${YELLOW}Copiando archivos al servidor...${NC}"
rsync -avz \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude 'dist' \
    --exclude 'test-env' \
    --exclude '*.log' \
    --exclude '.DS_Store' \
    --exclude '*.zip' \
    --exclude '*.sql' \
    --exclude '*.bak' \
    --exclude '*.backup' \
    --exclude '*.test.js' \
    --exclude '*.test.mjs' \
    --exclude '*.config.test.js' \
    --exclude '*.config.test.mjs' \
    --exclude 'jest.config.mjs' \
    --exclude 'babel.config.js' \
    --exclude 'babel.config.mjs' \
    --exclude 'babel.config.cjs' \
    --exclude 'babel.config.cjs.bak' \
    --exclude 'babel.config.js.backup' \
    --exclude 'babel.config.test.js' \
    --exclude 'babel.test.config.js' \
    --exclude 'babel-jest.config.cjs' \
    --exclude 'babel-test.config.js' \
    --exclude '.env.development' \
    --exclude '.env.example' \
    --exclude '.env.prod' \
    --exclude '.env.production' \
    --exclude '.stylelintrc.json' \
    --exclude '.windsurfrules' \
    --exclude 'DELETE - .env' \
    --exclude 'OLD - DOCKERCOMPOSE.YML' \
    --exclude 'SCCRIPTS - output.json' \
    --exclude 'INSTRUCCIONES_SOLUCION_AUTENTICACION.md' \
    --exclude 'SOLUCION_AUTENTICACION.md' \
    --exclude 'SOLUCION_IMPLEMENTADA.md' \
    --exclude 'antecedentes-single.zip' \
    --exclude 'antecedentes.html' \
    --exclude 'antev3.json' \
    --exclude 'asociar_imagenes_directus_existentes.js' \
    ./ root@$SERVER_IP:$REMOTE_DIR/

# 3. Ejecutar el despliegue en el servidor
echo -e "${YELLOW}Ejecutando despliegue en el servidor...${NC}"
ssh root@$SERVER_IP "cd $REMOTE_DIR && \
    docker-compose -f docker-compose.prod.yml down && \
    docker system prune -f && \
    docker-compose -f docker-compose.prod.yml build --no-cache && \
    docker-compose -f docker-compose.prod.yml up -d"

# 4. Verificar el estado de los contenedores
echo -e "${YELLOW}Verificando estado de los contenedores...${NC}"
ssh root@$SERVER_IP "cd $REMOTE_DIR && docker-compose -f docker-compose.prod.yml ps"

# 5. Verificar logs
echo -e "${YELLOW}Verificando logs...${NC}"
ssh root@$SERVER_IP "cd $REMOTE_DIR && docker-compose -f docker-compose.prod.yml logs --tail=50"

echo -e "${GREEN}¡Despliegue al servidor completado!${NC}"
echo -e "${YELLOW}La aplicación está disponible en:${NC}"
echo -e "Frontend: http://$SERVER_IP"
echo -e "Directus: http://$SERVER_IP:8055" 