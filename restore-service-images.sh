#!/bin/bash

# Directorio de origen y destino
SOURCE_DIR="imagenes_antecedentes_versionproduccion"
DEST_DIR="public/images/services"

# Crear directorio de destino si no existe
mkdir -p "$DEST_DIR"

# Procesar imágenes específicas
echo "Procesando imagen de redes y comunicaciones..."
if [ -f "$SOURCE_DIR/ultimamilla_procon_srl_-_redes_de_cableado_estructurado_20250416_070108_s2699366589.png" ]; then
    magick "$SOURCE_DIR/ultimamilla_procon_srl_-_redes_de_cableado_estructurado_20250416_070108_s2699366589.png" \
        -resize "960x480^" \
        -gravity center \
        -extent 960x480 \
        -quality 85 \
        "$DEST_DIR/redes-comunicaciones.jpg"
    echo "✅ Imagen de redes y comunicaciones procesada exitosamente"
else
    echo "❌ No se encontró la imagen de redes y comunicaciones"
fi

echo "Procesando imagen de servicios web..."
if [ -f "$SOURCE_DIR/ultimamilla_conicet_-_software_a_medida_20250415_204209_s1055203128.png" ]; then
    magick "$SOURCE_DIR/ultimamilla_conicet_-_software_a_medida_20250415_204209_s1055203128.png" \
        -resize "960x480^" \
        -gravity center \
        -extent 960x480 \
        -quality 85 \
        "$DEST_DIR/servicios-web.jpg"
    echo "✅ Imagen de servicios web procesada exitosamente"
else
    echo "❌ No se encontró la imagen de servicios web"
fi

# Verificar los resultados
echo -e "\n📝 Resumen de imágenes en $DEST_DIR:"
ls -lh "$DEST_DIR" 