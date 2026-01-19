"""
Script para remover el fondo de las imágenes usando AI y crear versiones
con fondo blanco puro para integración perfecta en el sitio.
"""
from rembg import remove
from PIL import Image
import os

def create_white_background_image(input_path, output_path):
    """
    Remueve el fondo usando AI y crea una imagen con fondo blanco puro.
    """
    print(f"Procesando: {input_path}")
    
    # Leer imagen original
    with open(input_path, 'rb') as input_file:
        input_data = input_file.read()
    
    # Remover fondo usando AI
    output_data = remove(input_data)
    
    # Convertir a imagen PIL
    img_no_bg = Image.open(io.BytesIO(output_data)).convert("RGBA")
    
    # Crear imagen con fondo blanco
    white_bg = Image.new("RGBA", img_no_bg.size, (255, 255, 255, 255))
    
    # Compositar imagen sin fondo sobre fondo blanco
    final_img = Image.alpha_composite(white_bg, img_no_bg)
    
    # Convertir a RGB (sin canal alfa) para optimización
    final_rgb = final_img.convert("RGB")
    
    # Guardar
    final_rgb.save(output_path, "PNG", optimize=True)
    print(f"  ✓ Guardado: {output_path}")

import io

def main():
    input_dir = "serviciosimg"
    output_dir = "public/images/services"
    
    # Asegurar que el directorio de salida existe
    os.makedirs(output_dir, exist_ok=True)
    
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
        
        if os.path.exists(src_path):
            try:
                create_white_background_image(src_path, dst_path)
            except Exception as e:
                print(f"  ✗ Error procesando {src_name}: {e}")
        else:
            print(f"  ✗ No encontrado: {src_path}")

if __name__ == "__main__":
    main()
