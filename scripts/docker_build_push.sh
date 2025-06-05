#!/bin/bash

# Script para construir y subir imágenes a Docker Hub
# Uso: ./docker_build_push.sh [astro|directus] [version]

# Colores para mensajes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Agregar manejo de errores
trap 'echo -e "${RED}Error en línea $LINENO${NC}"; exit 1' ERR

# Verificar argumentos
if [ "$#" -ne 2 ]; then
    echo -e "${RED}Error: Argumentos incorrectos${NC}"
    echo -e "Uso: ./docker_build_push.sh [astro|directus] [version]"
    exit 1
fi

SERVICE=$1
VERSION=$2
DOCKER_USER="santosma"  # Reemplazar con tu usuario de Docker Hub
REPO_NAME="um25"

# Validar servicio
if [ "$SERVICE" != "astro" ] && [ "$SERVICE" != "directus" ]; then
    echo -e "${RED}Error: Servicio no válido. Use 'astro' o 'directus'${NC}"
    exit 1
fi

# Construir y etiquetar la imagen
echo -e "${YELLOW}Construyendo imagen para ${SERVICE}...${NC}"

if [ "$SERVICE" == "astro" ]; then
    docker buildx build --platform linux/amd64,linux/arm64 -f Dockerfile.production -t ${DOCKER_USER}/${REPO_NAME}:${SERVICE}-${VERSION} --push .
    docker tag ${DOCKER_USER}/${REPO_NAME}:${SERVICE}-${VERSION} ${DOCKER_USER}/${REPO_NAME}:${SERVICE}-latest
else
    docker buildx build --platform linux/amd64,linux/arm64 -f Dockerfile.directus -t ${DOCKER_USER}/${REPO_NAME}:${SERVICE}-${VERSION} --push .
    docker tag ${DOCKER_USER}/${REPO_NAME}:${SERVICE}-${VERSION} ${DOCKER_USER}/${REPO_NAME}:${SERVICE}-latest
fi

# Verificar que el token está presente
if ! grep -q "DIRECTUS_STATIC_TOKEN=k6P8LAY8_x_y1miB_KTlWnysCnx2Abky" .env.production; then
    echo -e "${RED}Error: Token de autenticación no encontrado en .env.production${NC}"
    exit 1
fi

# Subir imágenes a Docker Hub
echo -e "${YELLOW}Subiendo imágenes a Docker Hub...${NC}"
docker push ${DOCKER_USER}/${REPO_NAME}:${SERVICE}-latest

echo -e "${GREEN}¡Imágenes subidas correctamente!${NC}"
echo -e "${YELLOW}Tags disponibles:"
echo -e "- ${DOCKER_USER}/${REPO_NAME}:${SERVICE}-${VERSION}"
echo -e "- ${DOCKER_USER}/${REPO_NAME}:${SERVICE}-latest${NC}"

exit 0
