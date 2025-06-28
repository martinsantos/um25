#!/bin/bash

# Verificar que inkscape esté instalado
if ! command -v inkscape &> /dev/null; then
    echo "Error: Inkscape no está instalado"
    echo "Instálalo con: brew install inkscape"
    exit 1
fi

# Verificar que el archivo icon.svg existe
if [ ! -f "icon.svg" ]; then
    echo "Error: icon.svg no encontrado"
    exit 1
fi

# Generar iconos PNG
sizes=(96 192 512)

for size in "${sizes[@]}"; do
    inkscape -w $size -h $size icon.svg -o icon-$size.png
    echo "✅ Generado icon-$size.png"
done

echo "✨ Iconos generados correctamente" 