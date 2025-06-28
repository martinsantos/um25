#!/bin/bash

# Crear directorio de uploads si no existe
mkdir -p local-uploads/uploads

# Copiar todas las imágenes
cp imagenes_antecedentes_versionproduccion/* local-uploads/uploads/

# Verificar la copia
echo "Total de imágenes copiadas:"
ls -l local-uploads/uploads/ | wc -l

# Dar permisos
chmod -R 777 local-uploads/uploads/

echo "Imágenes copiadas y permisos configurados" 