import os
import sys
from rembg import remove, new_session
from pathlib import Path
from PIL import Image

def process_images(input_dir, output_dir):
    input_path = Path(input_dir)
    output_path = Path(output_dir)
    
    # Crear directorio de salida si no existe
    output_path.mkdir(parents=True, exist_ok=True)
    
    # Extensiones soportadas
    extensions = {'.png', '.jpg', '.jpeg', '.webp'}
    
    # Obtener lista de archivos
    files = [f for f in input_path.iterdir() if f.suffix.lower() in extensions]
    
    if not files:
        print(f"No se encontraron imágenes en {input_dir}")
        return

    print("Iniciando sesión de rembg...")
    # Usar el modelo u2net que es el default pero explícito para mayor claridad
    session = new_session("u2net")
    
    print(f"Procesando {len(files)} imágenes...")
    
    for file_path in files:
        try:
            print(f"-> Procesando: {file_path.name}")
            
            # Leer imagen
            with open(file_path, 'rb') as i:
                input_data = i.read()
                
            # Remover fondo con alpha matting para mejor calidad en bordes
            subject = remove(
                input_data,
                session=session,
                alpha_matting=True,
                alpha_matting_foreground_threshold=240,
                alpha_matting_background_threshold=10,
                alpha_matting_erode_size=10
            )
            
            # Guardar resultado (siempre como PNG para transparencia)
            output_filename = f"{file_path.stem}.png"
            output_file = output_path / output_filename
            
            with open(output_file, 'wb') as o:
                o.write(subject)
                
        except Exception as e:
            print(f"Error procesando {file_path.name}: {e}")

    print("\n✅ Proceso completado. Imágenes guardadas en:", output_dir)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Uso: python3 limpiar_imagenes.py <directorio_entrada> <directorio_salida>")
        sys.exit(1)
        
    input_directory = sys.argv[1]
    output_directory = sys.argv[2]
    
    process_images(input_directory, output_directory)
