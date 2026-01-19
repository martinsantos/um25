"""
Script mejorado para eliminar el patrón checkerboard de cualquier color
y reemplazarlo con blanco puro (#FFFFFF).

El patrón checkerboard típico tiene cuadros de ~10-20 píxeles alternando
entre dos tonos. Detectamos esto analizando la periodicidad y los colores
en las esquinas/bordes de la imagen.
"""
from PIL import Image
import os

def get_checkerboard_colors(img):
    """
    Detecta los dos colores del checkerboard analizando las esquinas.
    En imágenes con checkerboard, las esquinas típicamente muestran el patrón.
    """
    width, height = img.size
    
    # Muestrear píxeles en las esquinas y bordes
    sample_points = [
        (0, 0), (1, 0), (0, 1), (1, 1),  # Esquina superior izquierda
        (width-2, 0), (width-1, 0), (width-2, 1), (width-1, 1),  # Superior derecha
        (0, height-2), (1, height-2), (0, height-1), (1, height-1),  # Inferior izquierda
        (width-2, height-2), (width-1, height-2), (width-2, height-1), (width-1, height-1),  # Inferior derecha
    ]
    
    colors = set()
    for x, y in sample_points:
        if 0 <= x < width and 0 <= y < height:
            colors.add(img.getpixel((x, y))[:3])  # Solo RGB
    
    # Filtrar colores que parecen ser del checkerboard
    # El checkerboard típicamente tiene colores grises o cercanos
    checkerboard_colors = []
    for c in colors:
        r, g, b = c
        # Detectar si es gris (incluso tintado) - la varianza entre r,g,b es baja
        # o si es uno de los colores típicos del checkerboard
        avg = (r + g + b) / 3
        variance = ((r - avg)**2 + (g - avg)**2 + (b - avg)**2) / 3
        
        # Colores del checkerboard suelen ser grises o cercanos a gris
        if variance < 500 or (100 < avg < 220):  # Rango típico de checkerboard
            checkerboard_colors.append(c)
    
    return checkerboard_colors

def process_to_white_bg(input_path, output_path):
    """
    Procesa una imagen reemplazando cualquier patrón de checkerboard con blanco.
    Analiza los bordes para detectar colores del checkerboard.
    """
    img = Image.open(input_path).convert("RGBA")
    pixels = img.load()
    width, height = img.size
    
    # Detectar colores del checkerboard
    checker_colors = get_checkerboard_colors(img)
    print(f"  Colores de checkerboard detectados: {checker_colors}")
    
    replaced = 0
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            
            # Verificar si este píxel coincide con algún color del checkerboard
            for cr, cg, cb in checker_colors:
                # Tolerancia para variaciones menores
                if abs(r - cr) < 15 and abs(g - cg) < 15 and abs(b - cb) < 15:
                    pixels[x, y] = (255, 255, 255, 255)
                    replaced += 1
                    break
    
    img.save(output_path, "PNG")
    print(f"  Píxeles reemplazados: {replaced} de {width * height}")

def main():
    input_dir = "serviciosimg"
    output_dir = "public/images/services"
    
    file_mapping = {
        "redes.png": "infraestructura-redes-volumetric.png",
        "software.png": "desarrollo-software-volumetric.png",
        "seguridadcctv.png": "ciberseguridad-volumetric.png",
        "serviciosit.png": "consultoria-it-volumetric.png",
        "deteccioncontrol.png": "soporte-tecnico-volumetric.png",
    }
    
    for src_name, dst_name in file_mapping.items():
        src_path = os.path.join(input_dir, src_name)
        dst_path = os.path.join(output_dir, dst_name)
        
        print(f"Procesando: {src_name}")
        if os.path.exists(src_path):
            process_to_white_bg(src_path, dst_path)
        else:
            print(f"  No encontrado: {src_path}")

if __name__ == "__main__":
    main()
