import json
import torch
from diffusers import AutoPipelineForText2Image
from PIL import Image
import os

def main():
    archivo_json = input("Ingrese el nombre del archivo JSON (debe estar en el mismo directorio): ")

    try:
        with open(archivo_json, 'r', encoding='utf-8') as f:
            proyectos = json.load(f)
    except Exception as e:
        print(f"Error cargando el archivo JSON: {str(e)}")
        return

    # Configuración corregida para CPU
    pipe = AutoPipelineForText2Image.from_pretrained(
        "stabilityai/sdxl-turbo",
        torch_dtype=torch.float32,
        use_safetensors=True
    ).to("cpu")
    
    pipe.enable_attention_slicing()

    def acortar_prompt(texto, max_tokens=60):
        return ' '.join(texto.split()[:max_tokens])

    os.makedirs('imagenes_ultrarealistas', exist_ok=True)

    for proyecto in proyectos:
        try:
            base_prompt = f"Fotografía profesional detallada: {proyecto['Descripcion']}. " \
                        f"Elementos clave: {proyecto['Palabras_clave']}. " \
                        "Estilo realista, 4k, iluminación profesional"
            
            prompt_final = acortar_prompt(base_prompt)

            image = pipe(
                prompt=prompt_final,
                num_inference_steps=4,
                guidance_scale=2.0,
                width=512,
                height=512,
                num_images_per_prompt=1
            ).images[0]
            
            nombre_base = proyecto['Titulo'][:30].replace(' ', '_').strip('_')
            nombre_archivo = f"imagenes_ultrarealistas/{nombre_base}_HD.png"
            
            image.save(nombre_archivo, format='PNG', quality=95)
            print(f"Imagen generada: {nombre_archivo}")
                
        except Exception as e:
            print(f"Error en {proyecto.get('Titulo', 'Proyecto desconocido')}: {str(e)}")

if __name__ == "__main__":
    print("=== Generador de imágenes optimizado para CPU ===")
    main()
    print("\nProceso completado. Revisa el directorio 'imagenes_ultrarealistas'")