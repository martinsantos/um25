#!/bin/bash

# Script para construir y subir imágenes a Docker Hub
# Uso: ./scripts/docker-hub-push.sh [version]

set -e

# Verificar si el usuario está autenticado en Docker Hub
if ! docker info 2>/dev/null | grep -q "Username"; then
  echo "Error: No estás autenticado en Docker Hub. Ejecuta 'docker login' primero."
  exit 1
fi

# Establecer versión
VERSION=${1:-latest}
REPO="santosma/um25"

echo "🔨 Construyendo imágenes con versión: $VERSION"

# Construir imagen de Astro
echo "Construyendo imagen de Astro..."
docker build -t $REPO:astro-$VERSION -f dockerfile .

# Etiquetar imagen de Directus
echo "Etiquetando imagen de Directus..."
docker tag directus/directus:11.7.2 $REPO:directus-$VERSION

# Subir imágenes a Docker Hub
echo "Subiendo imágenes a Docker Hub..."
docker push $REPO:astro-$VERSION
docker push $REPO:directus-$VERSION

# Etiquetar como latest si no se especificó una versión
if [ "$VERSION" != "latest" ]; then
  echo "Etiquetando y subiendo imágenes como 'latest'..."
  docker tag $REPO:astro-$VERSION $REPO:astro-latest
  docker tag $REPO:directus-$VERSION $REPO:directus-latest
  docker push $REPO:astro-latest
  docker push $REPO:directus-latest
fi

echo "✅ Proceso completado exitosamente!"
echo "Imágenes disponibles en:"
echo "- $REPO:astro-$VERSION"
echo "- $REPO:directus-$VERSION"
if [ "$VERSION" != "latest" ]; then
  echo "- $REPO:astro-latest"
  echo "- $REPO:directus-latest"
fi
