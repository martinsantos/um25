#!/bin/bash

# Ruta local
LOCAL_PATH="/fumbling-field"

# Nombre de la imagen Docker
IMAGE_NAME="fumbling-field-astro"

# Ruta dentro del contenedor
CONTAINER_PATH="/fumbling-field"

# Verificar si la imagen Docker existe
if ! docker image inspect "$IMAGE_NAME" > /dev/null 2>&1; then
    echo "Error: La imagen Docker \"$IMAGE_NAME\" no existe."
    exit 1
fi

# Verificar si la ruta local existe
if [ ! -d "$LOCAL_PATH" ]; then
    echo "Error: La ruta local \"$LOCAL_PATH\" no existe."
    exit 1
fi

# Crear un contenedor temporal
echo "Creando un contenedor temporal basado en la imagen $IMAGE_NAME..."
CONTAINER_ID=$(docker create "$IMAGE_NAME")
if [ -z "$CONTAINER_ID" ]; then
    echo "Error: No se pudo crear el contenedor temporal."
    exit 1
fi

# Asegurar la eliminación del contenedor temporal en caso de error
cleanup() {
    echo "Eliminando el contenedor temporal..."
    docker rm -f "$CONTAINER_ID" > /dev/null 2>&1
}
trap cleanup EXIT

# Listar contenido local
echo "Listando contenido local en \"$LOCAL_PATH\"..."
local_files=$(find "$LOCAL_PATH" -type f | sort)

# Listar contenido en el contenedor temporal
echo "Listando contenido en el contenedor temporal en \"$CONTAINER_PATH\"..."
container_files=$(docker start "$CONTAINER_ID" > /dev/null && docker exec "$CONTAINER_ID" find "$CONTAINER_PATH" -type f | sort)

# Comparar contenido
echo "Comparando contenido..."
diff <(echo "$local_files") <(echo "$container_files")

# Resultado
if [ $? -eq 0 ]; then
    echo "El contenido local y el contenido del contenedor coinciden."
else
    echo "Hay diferencias entre el contenido local y el contenido del contenedor."
fi

# Eliminar el contenedor temporal
echo "Eliminando el contenedor temporal..."
docker rm -f "$CONTAINER_ID" > /dev/null
