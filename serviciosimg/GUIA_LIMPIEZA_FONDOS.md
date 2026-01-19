# 🧹 GUÍA: Limpiar Fondos de Imágenes - Método PIOLA

## La Solución: **REMBG**

Herramienta open-source, 100% gratuita, funciona LOCAL (sin subir nada a internet), y procesa carpetas enteras en segundos.

---

## 🚀 INSTALACIÓN (1 minuto)

### Opción A: Solo CLI (más simple)
```bash
pip install rembg[cli]
```

### Opción B: Con GPU NVIDIA (más rápido)
```bash
pip install rembg[gpu]
```

### Opción C: Versión liviana (43MB vs 176MB)
```bash
pip install rembg[cli]
# Luego usar modelo "silueta" en los comandos
```

---

## ⚡ USO BÁSICO

### Procesar UNA imagen:
```bash
rembg i input.png output.png
```

### Procesar CARPETA ENTERA (el truco piola):
```bash
rembg p carpeta_origen/ carpeta_destino/
```

### Con fondo blanco en vez de transparente:
```bash
rembg i -bgcolor 255 255 255 255 input.png output.png
```

### Mejor calidad (alpha matting para pelos/bordes):
```bash
rembg i -a input.png output.png
```

---

## 🎯 COMANDO DEFINITIVO PARA ULTIMA MILLA

Para procesar TODAS las imágenes de productos con máxima calidad:

```bash
# Crear carpeta de salida
mkdir imagenes_limpias

# Procesar todo con alpha matting (mejor bordes)
rembg p -a ./imagenes_originales/ ./imagenes_limpias/
```

### Si querés fondo blanco puro (#FFFFFF):
```bash
rembg p -bgcolor 255 255 255 255 ./imagenes_originales/ ./imagenes_limpias/
```

---

## 🔧 MODELOS DISPONIBLES

| Modelo | Tamaño | Uso |
|--------|--------|-----|
| `u2net` | 176MB | General (default) |
| `silueta` | 43MB | Liviano, buena calidad |
| `isnet-general-use` | - | Alta precisión |
| `u2net_human_seg` | - | Personas |

### Usar modelo específico:
```bash
rembg i -m silueta input.png output.png
```

---

## 📜 SCRIPT BATCH COMPLETO

Guardá esto como `limpiar_fondos.sh`:

```bash
#!/bin/bash
# Script para limpiar fondos de imágenes ULTIMA MILLA

INPUT_DIR="./imagenes_raw"
OUTPUT_DIR="./imagenes_limpias"
OUTPUT_WHITE="./imagenes_fondo_blanco"

# Crear carpetas
mkdir -p "$OUTPUT_DIR" "$OUTPUT_WHITE"

echo "🔄 Procesando imágenes con fondo transparente..."
rembg p -a "$INPUT_DIR" "$OUTPUT_DIR"

echo "🔄 Procesando imágenes con fondo blanco..."
rembg p -a -bgcolor 255 255 255 255 "$INPUT_DIR" "$OUTPUT_WHITE"

echo "✅ Listo! Imágenes en:"
echo "   - Transparentes: $OUTPUT_DIR"
echo "   - Fondo blanco: $OUTPUT_WHITE"
```

### Ejecutar:
```bash
chmod +x limpiar_fondos.sh
./limpiar_fondos.sh
```

---

## 🐍 SCRIPT PYTHON (más control)

```python
from rembg import remove, new_session
from PIL import Image
from pathlib import Path

# Crear sesión (más eficiente para batch)
session = new_session("u2net")

input_folder = Path("./imagenes_raw")
output_folder = Path("./imagenes_limpias")
output_folder.mkdir(exist_ok=True)

# Procesar todas las imágenes
for img_path in input_folder.glob("*.[pP][nN][gG]"):
    print(f"Procesando: {img_path.name}")

    input_img = Image.open(img_path)
    output_img = remove(input_img, session=session, alpha_matting=True)

    # Guardar con transparencia
    output_img.save(output_folder / img_path.name)

print(f"✅ {len(list(output_folder.glob('*.png')))} imágenes procesadas!")
```

### Con fondo blanco:
```python
from rembg import remove, new_session
from PIL import Image
from pathlib import Path

session = new_session("u2net")

input_folder = Path("./imagenes_raw")
output_folder = Path("./imagenes_blanco")
output_folder.mkdir(exist_ok=True)

for img_path in input_folder.glob("*.*"):
    if img_path.suffix.lower() in ['.png', '.jpg', '.jpeg', '.webp']:
        print(f"Procesando: {img_path.name}")

        input_img = Image.open(img_path)
        output_img = remove(input_img, session=session, alpha_matting=True)

        # Crear fondo blanco
        white_bg = Image.new("RGBA", output_img.size, (255, 255, 255, 255))
        white_bg.paste(output_img, mask=output_img.split()[3])

        # Convertir a RGB y guardar
        final = white_bg.convert("RGB")
        final.save(output_folder / f"{img_path.stem}.png")

print("✅ Listo!")
```

---

## 🖥️ ALTERNATIVA: withoutBG (si rembg falla)

```bash
pip install withoutbg

# Usar localmente
python -c "
from withoutbg import remove_background
remove_background('input.png', 'output.png')
"
```

---

## ⏱️ RENDIMIENTO ESPERADO

- **Sin GPU**: ~3-5 segundos por imagen
- **Con GPU NVIDIA**: ~0.5-1 segundo por imagen
- **38 imágenes de ULTIMA MILLA**: ~2-3 minutos sin GPU

---

## 🎨 POST-PROCESO OPCIONAL (ImageMagick)

Si necesitás ajustes finos después de rembg:

```bash
# Instalar ImageMagick
# Ubuntu: sudo apt install imagemagick
# Mac: brew install imagemagick

# Suavizar bordes
convert input.png -alpha set -channel A -blur 0x1 output.png

# Agregar sombra sutil (si querés)
convert input.png \( +clone -background black -shadow 60x5+0+5 \) +swap -background none -layers merge +repage output.png

# Batch con ImageMagick
for f in *.png; do convert "$f" -trim +repage "trimmed_$f"; done
```

---

## ✅ RESUMEN - LO MÁS PIOLA

```bash
# Instalar (una vez)
pip install rembg[cli]

# Procesar todas las imágenes (cada vez que necesites)
rembg p -a ./originales/ ./limpias/
```

**¡Eso es todo!** Sin cuentas, sin API keys, sin límites, sin subir nada a la nube.

---

## 📚 Referencias

- [Rembg en GitHub](https://github.com/danielgatis/rembg)
- [Rembg en PyPI](https://pypi.org/project/rembg/)
- [withoutBG](https://github.com/withoutbg/withoutbg)
