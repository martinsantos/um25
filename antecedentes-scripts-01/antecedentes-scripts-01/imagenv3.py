import json
import ollama
import torch
from diffusers import AutoPipelineForText2Image, AutoPipelineForImage2Image
from PIL import Image
import os
import time
import random
import re
import sys
import datetime

# --- CONFIGURACIÓN PRINCIPAL ---
JSON_FILE = input("Ingrese el nombre del archivo JSON de entrada (en el mismo directorio): ")
IMAGE_OUTPUT_DIR = 'imagenes_ollama_mps_refinadas'
JSON_OUTPUT_FILENAME = f"datos_imagenes_para_directus_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.json"

# --- Configuración Ollama ---
LLM_FOR_PROMPTING = "llama3"
OLLAMA_API_URL = "http://localhost:11434"

# --- Configuración Diffusers ---
BASE_MODEL_ID = "stabilityai/stable-diffusion-xl-base-1.0" # Modelo base para fotorrealismo (ejemplo)
REFINER_MODEL_ID = "stabilityai/stable-diffusion-xl-refiner-1.0" # Refinador para fotorrealismo (ejemplo)

# --- Configuración de Generación (Ajustado para MPS) ---
RESOLUTION = 768 # Resolución inicial recomendada
NUM_INFERENCE_STEPS_BASE = 10 # Aumento de los pasos para mayor detalle
NUM_INFERENCE_STEPS_REFINER = 10
GUIDANCE_SCALE = 7.0
USE_REFINER = True

# Semilla para reproducibilidad (-1 para aleatoria)
SEED = -1

# Prompt Negativo Mejorado para evitar elementos no deseados y mejorar el realismo
NEGATIVE_PROMPT = (
    "ugly, deformed, noisy, blurry, low quality, poor quality, worst quality, duplicate, clones, "
    "text, watermark, signature, username, words, letters, labels, fonts, writing, captions, titles, "
    "multiple limbs, extra limbs, extra fingers, fused fingers, bad fingers, bad hands, malformed hands, "
    "bad anatomy, distorted face, mutation, mutated, disfigured, morbid, gross, disgusting, unrealistic, "
    "tiling, poorly drawn, out of frame, cropped, lowres, jpeg artifacts, illustration, cartoon, sketch, "
    "cgi, 3d render, plastic look, smooth shading, blurry details, low detail, abstract" # Añadidos para enfoque técnico
)
# --- FIN DE CONFIGURACIÓN ---

def check_mps_device():
    if not torch.backends.mps.is_available():
        if not torch.backends.mps.is_built():
            print("MPS no está disponible porque la versión actual de PyTorch no se compiló con soporte MPS.")
            print("Instala la versión correcta de PyTorch para tu Mac M-series.")
        else:
            print("MPS no está disponible en este dispositivo Mac.")
        sys.exit("Error: Se requiere soporte MPS (GPU Apple Silicon).")

    print("Dispositivo MPS (Apple Silicon GPU) detectado.")
    return torch.device("mps")

def sanitize_filename(name):
    name = name.lower()
    name = re.sub(r'\s+', '_', name)
    name = re.sub(r'[^\w\-]+', '', name)
    name = name.strip('_')
    return name[:60]

def generate_detailed_prompt(client, llm_model, project_data):
    """
    Genera un prompt detallado para la creación de imágenes relacionadas con Última Milla,
    enfocándose en telecomunicaciones e infraestructura técnica.
    """
    print(f"  Generando prompt detallado con Ollama ({llm_model})...")
    t_start = time.time()
    
    # Enriquecemos el prompt con información específica de Última Milla
    company_info = """
    Última Milla (www.ultimamilla.com.ar) es una empresa argentina especializada en:
    - Instalación profesional de redes LAN/WAN/WLAN
    - Cableado estructurado y fibra óptica
    - Sistemas de detección de incendios
    - Soluciones de telecomunicaciones empresariales
    
    Los ambientes típicos incluyen oficinas corporativas, salas de servidores, instalaciones
    industriales y entornos de telecomunicaciones profesionales. La estética es moderna,
    limpia, profesional y técnicamente sofisticada.
    """
    
    meta_prompt = f"""Eres un ingeniero de prompts experto especializado en crear descripciones visuales vívidas y detalladas para modelos de generación de imágenes text-to-image como Stable Diffusion XL. Tu objetivo es transformar la siguiente información de proyecto en un único párrafo de prompt altamente descriptivo y optimizado para generar una imagen fotorrealista y profesional, enfocándose en los aspectos materiales concretos de la infraestructura técnica de la empresa Última Milla.

    Considera los siguientes aspectos al crear el prompt:
    - **Sujeto Principal:** Claramente definido basado en el Título y Descripción.
    - **Composición:** Describe la disposición de los elementos, el ángulo de cámara, el encuadre.
    - **Iluminación:** Especifica el tipo de luz, dirección y ambiente general (ej. profesional, técnico, corporativo).
    - **Estilo Visual:** Apunta a 'ultra realistic photo', 'professional corporate photography', 'technical documentation', 'high detail', 'sharp focus', '8k resolution'. Describe los materiales de los objetos con precisión técnica.
    - **Atmósfera/Emoción:** Transmite el 'mood' propio de instalaciones técnicas profesionales (ej. entorno controlado, eficiente, tecnológicamente avanzado).
    - **Detalles Clave:** Incorpora las 'Palabras_clave' y añade términos específicos de forma natural en la descripción visual.
    - **Materiales:** Describe los materiales con precisión técnica.
    - **Formato:** Produce solo el párrafo del prompt final, sin explicaciones, saludos ni comentarios adicionales. Debe ser un texto continuo.

    Información sobre la empresa:
    {company_info}

    Información del Proyecto:
    - Titulo: {project_data.get('Titulo', 'Sin título')}
    - Descripcion: {project_data.get('Descripcion', 'Sin descripción')}
    - Palabras_clave: {project_data.get('Palabras_clave', 'Sin palabras clave')}

    Genera el prompt AHORA:"""
    
    try:
        response = client.generate(model=llm_model,
                                  prompt=meta_prompt,
                                  stream=False,
                                  options={"temperature": 0.7})
        generated_prompt = response['response'].strip()
        print(f"    Prompt generado por Ollama en {time.time() - t_start:.2f}s")
        # Limpieza adicional para mejorar compatibilidad con modelos de difusión
        generated_prompt = generated_prompt.replace('"', '').replace("Prompt:", "").strip()
        generated_prompt = generated_prompt.replace("\n", " ").replace("  ", " ")
        
        # Asegurar que el prompt incluya el nombre de la empresa
        if "Última Milla" not in generated_prompt and "Ultima Milla" not in generated_prompt:
            generated_prompt += ", servicio profesional de Última Milla Argentina"
            
        return generated_prompt
    except Exception as e:
        print(f"    ERROR al contactar Ollama o generar prompt: {e}")
        print("    Usando descripción de fallback específica para Última Milla.")
        return (f"ultra realistic photo, professional corporate photography of: "
                f"{project_data.get('Titulo', 'instalación técnica')} de Última Milla. "
                f"{project_data.get('Descripcion', 'Infraestructura de comunicaciones profesional')}. "
                f"Key elements: {project_data.get('Palabras_clave', 'redes, servidores, cableado estructurado')}, "
                f"including enterprise-grade networking equipment, precision cable management, server racks, "
                f"professional telecommunications infrastructure. "
                f"Style: photorealistic, 8k, technical documentation quality, sharp focus.")

def load_diffusion_pipelines(base_model_id, refiner_model_id, device, use_refiner):
    """
    Carga los modelos de difusión optimizados para imágenes técnicas de infraestructura.
    """
    pipe_base = None
    pipe_refiner = None
    
    # Usar half precision para optimizar memoria en GPU si está disponible
    if device == "cuda" and torch.cuda.is_available():
        dtype = torch.float16
    else:
        dtype = torch.float32
        
    print(f"\nCargando pipeline BASE: {base_model_id} en {device} (dtype: {dtype})...")
    t_start = time.time()
    
    try:
        pipe_base = AutoPipelineForText2Image.from_pretrained(
            base_model_id, 
            torch_dtype=dtype, 
            use_safetensors=True,
            variant="fp16" if dtype == torch.float16 else None
        ).to(device)
        
        # Optimizaciones de memoria y rendimiento
        pipe_base.enable_attention_slicing()
        if device == "cuda":
            pipe_base.enable_model_cpu_offload()
            
        print(f"  Pipeline BASE cargada en {time.time() - t_start:.2f}s")
    except Exception as e:
        print(f"  ERROR cargando pipeline BASE: {e}")
        sys.exit(f"No se pudo cargar el modelo base de Diffusers: {str(e)}")

    if use_refiner:
        print(f"Cargando pipeline REFINER: {refiner_model_id} en {device} (dtype: {dtype})...")
        t_start = time.time()
        try:
            pipe_refiner = AutoPipelineForImage2Image.from_pretrained(
                refiner_model_id,
                text_encoder_2=pipe_base.text_encoder_2, 
                vae=pipe_base.vae,
                torch_dtype=dtype, 
                use_safetensors=True,
                variant="fp16" if dtype == torch.float16 else None
            ).to(device)
            
            # Optimizaciones de memoria y rendimiento
            pipe_refiner.enable_attention_slicing()
            if device == "cuda":
                pipe_refiner.enable_model_cpu_offload()
                
            print(f"  Pipeline REFINER cargada en {time.time() - t_start:.2f}s")
        except Exception as e:
            print(f"  ERROR cargando pipeline REFINER: {e}")
            print("  Continuando sin refinador.")
            use_refiner = False
    
    return pipe_base, pipe_refiner, use_refiner

def generate_ultima_milla_image(pipe_base, pipe_refiner, prompt, project_data, output_dir, use_refiner=True, num_steps=30, guidance_scale=7.5):
    """
    Genera una imagen de alta calidad para Última Milla con los parámetros optimizados.
    """
    print(f"\nGenerando imagen para proyecto: {project_data.get('Titulo', 'Sin título')}")
    print(f"Usando prompt:\n{prompt[:150]}..." if len(prompt) > 150 else f"{prompt}")
    
    # Asegurar que existe el directorio de salida
    os.makedirs(output_dir, exist_ok=True)
    
    # Mejores parámetros para imágenes técnicas/profesionales
    negative_prompt = "poor quality, low resolution, bad anatomy, worst quality, low quality, blurry, distorted, deformed, amateur, unprofessional, text overlay, watermark, poor lighting"
    
    t_start = time.time()
    
    # Generar imagen base
    image = pipe_base(
        prompt=prompt,
        negative_prompt=negative_prompt,
        num_inference_steps=num_steps,
        guidance_scale=guidance_scale,
        height=1024,
        width=1024,
    ).images[0]
    
    # Refinar la imagen si está habilitado
    if use_refiner and pipe_refiner:
        print("  Aplicando refinamiento para mayor detalle técnico...")
        image = pipe_refiner(
            prompt=prompt,
            negative_prompt=negative_prompt,
            image=image,
            num_inference_steps=25,
            guidance_scale=guidance_scale,
        ).images[0]
    
    # Generar nombre de archivo basado en el proyecto
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_title = ''.join(c if c.isalnum() else '_' for c in project_data.get('Titulo', 'imagen'))
    filename = f"{output_dir}/ultimamilla_{safe_title}_{timestamp}.png"
    
    # Guardar imagen
    image.save(filename)
    print(f"  Imagen generada en {time.time() - t_start:.2f}s y guardada como: {filename}")
    
    return {
        "filename": filename,
        "prompt": prompt,
        "negative_prompt": negative_prompt,
        "project": project_data,
        "timestamp": timestamp,
        "generation_time": f"{time.time() - t_start:.2f}s"
    }

def save_results_to_json(data, filename):
    """
    Guarda los metadatos de la imagen generada para su posterior referencia.
    """
    try:
        # Asegurar que existe el directorio donde se guardará el archivo
        os.makedirs(os.path.dirname(filename), exist_ok=True)
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
        print(f"\nMetadatos guardados exitosamente en: {filename}")
    except Exception as e:
        print(f"\nError al guardar el archivo JSON '{filename}': {e}")

# ====================
#      MAIN SCRIPT
# ====================
def main():
    print("=== Generador de Imágenes y Datos para Directus (Ollama + Diffusers MPS) ===")
    print(f"Usando JSON de entrada: {JSON_FILE}")
    print(f"Guardando imágenes en: {IMAGE_OUTPUT_DIR}")
    print(f"Guardando datos para Directus en: {JSON_OUTPUT_FILENAME}")
    print(f"Fecha y Hora Actual: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    # --- Verificaciones Iniciales ---
    mps_device = check_mps_device()
    try:
        ollama_client = ollama.Client(host=OLLAMA_API_URL)
        ollama_client.list()
        print(f"Conexión con Ollama en {OLLAMA_API_URL} exitosa.")
    except Exception as e:
        print(f"Error conectando con Ollama en {OLLAMA_API_URL}: {e}")
        print("Asegúrate de que la aplicación Ollama esté corriendo.")
        sys.exit(1)

    # --- Cargar JSON de Entrada ---
    try:
        with open(JSON_FILE, 'r', encoding='utf-8') as f:
            proyectos = json.load(f)
        print(f"Archivo JSON '{JSON_FILE}' cargado con {len(proyectos)} proyectos.")
    except Exception as e:
        print(f"Error fatal cargando el archivo JSON '{JSON_FILE}': {str(e)}")
        return

    # --- Cargar Modelos Diffusers ---
    pipe_base, pipe_refiner, use_refiner = load_diffusion_pipelines(
        BASE_MODEL_ID, REFINER_MODEL_ID, mps_device, USE_REFINER
    )

    # --- Preparar Salida ---
    os.makedirs(IMAGE_OUTPUT_DIR, exist_ok=True)
    resultados_para_directus = []# Inicialización correcta de la lista

    # --- Configurar Semilla ---
    if SEED == -1:
        current_seed = random.randint(0, 2**32 - 1)
    else:
        current_seed = SEED
    print(f"Semilla base: {current_seed if SEED!= -1 else 'Aleatoria por imagen'}")

    # --- Loop Principal de Generación ---
    print("\n--- Iniciando generación de imágenes y datos ---")
    total_start_time = time.time()
    proyectos_exitosos = 0
    proyectos_fallidos = 0

    for i, proyecto in enumerate(proyectos):
        item_start_time = time.time()
        print(f"\n[{i+1}/{len(proyectos)}] Procesando: {proyecto.get('Titulo', 'Desconocido')}")

        img_seed = current_seed if SEED!= -1 else random.randint(0, 2**32 - 1)
        generator = torch.Generator(device='cpu').manual_seed(img_seed)
        print(f"  Usando Semilla para esta imagen: {img_seed}")

        generated_prompt = None
        final_image_path = None
        final_image = None

        try:
            # 1. Generar Prompt Detallado con Ollama
            generated_prompt = generate_detailed_prompt(ollama_client, LLM_FOR_PROMPTING, proyecto)
            print(f"  Prompt Final (Ollama): {generated_prompt}")

            # 2. Generación Base con Diffusers (MPS)
            print(f"  Generando imagen base ({RESOLUTION}x{RESOLUTION}, {NUM_INFERENCE_STEPS_BASE} pasos)...")
            base_gen_start = time.time()
            output_type = "latent" if use_refiner and pipe_refiner else "pil"
            denoising_end_val = 0.85 if use_refiner and pipe_refiner else 1.0

            with torch.inference_mode():
                base_output = pipe_base(
                    prompt=generated_prompt, negative_prompt=NEGATIVE_PROMPT,
                    width=RESOLUTION, height=RESOLUTION, guidance_scale=GUIDANCE_SCALE,
                    num_inference_steps=NUM_INFERENCE_STEPS_BASE, generator=generator,
                    output_type=output_type, denoising_end=denoising_end_val
                ).images
            print(f"    Imagen base generada en {time.time() - base_gen_start:.2f}s")

            # 3. Refinamiento (Opcional) con Diffusers (MPS)
            if use_refiner and pipe_refiner:
                print(f"  Refinando imagen ({NUM_INFERENCE_STEPS_REFINER} pasos)...")
                refiner_gen_start = time.time()
                with torch.inference_mode():
                    refined_output = pipe_refiner(
                        prompt=generated_prompt, negative_prompt=NEGATIVE_PROMPT,
                        image=base_output, guidance_scale=GUIDANCE_SCALE,
                        num_inference_steps=NUM_INFERENCE_STEPS_REFINER,
                        denoising_start=denoising_end_val, generator=generator
                    )
                final_image = refined_output.images
                print(f"    Refinamiento completado en {time.time() - refiner_gen_start:.2f}s")

            elif output_type == "pil":
                 final_image = base_output
            else:
                 print("    Decodificando latentes del modelo base...")
                 with torch.inference_mode():
                      latents = base_output / pipe_base.vae.config.scaling_factor
                      image_decoded = pipe_base.vae.decode(latents, return_dict=False)
                      final_image = pipe_base.image_processor.postprocess(image_decoded, output_type='pil')

            # 4. Guardar Imagen Final y Preparar Datos JSON
            if final_image:
                nombre_base = sanitize_filename(proyecto.get('Titulo', f'proyecto_{i+1}'))
                refiner_tag = "_refined" if use_refiner and pipe_refiner else ""
                filename_only = f"{nombre_base}_{RESOLUTION}px{refiner_tag}_s{img_seed}.png"
                final_image_path = os.path.join(IMAGE_OUTPUT_DIR, filename_only)

                final_image[0].save(final_image_path, format='PNG')
                print(f"  Imagen guardada: {final_image_path}")

                registro_directus = {
                    "titulo_original": proyecto.get('Titulo', None),
                    "descripcion_original": proyecto.get('Descripcion', None),
                    "palabras_clave_originales": proyecto.get('Palabras_clave', None),
                    "prompt_detallado_ollama": generated_prompt,
                    "nombre_archivo_generado": final_image_path
                }
                resultados_para_directus.append(registro_directus)
                proyectos_exitosos += 1

            else:
                 print("  ERROR: No se pudo obtener la imagen final para este item.")
                 proyectos_fallidos += 1

            item_end_time = time.time()
            print(f"  Tiempo total para este item: {item_end_time - item_start_time:.2f} segundos")

        except Exception as e:
            item_end_time = time.time()
            print(f"  ERROR FATAL procesando '{proyecto.get('Titulo', 'Desconocido')}': {str(e)}")
            import traceback
            traceback.print_exc()
            print(f"  (Tiempo transcurrido: {item_end_time - item_start_time:.2f} segundos)")
            proyectos_fallidos += 1
        except KeyboardInterrupt:
             print("\nGeneración interrumpida por el usuario.")
             if resultados_para_directus:
                 save_results_to_json(resultados_para_directus, JSON_OUTPUT_FILENAME)
             else:
                 print("No se generaron resultados para guardar.")
             sys.exit(0)

    # --- Finalización ---
    total_end_time = time.time()
    print(f"\n--- Proceso completado en {total_end_time - total_start_time:.2f} segundos ---")
    print(f"Resultados: {proyectos_exitosos} imágenes generadas exitosamente, {proyectos_fallidos} fallidos.")
    print(f"Imágenes guardadas en: '{IMAGE_OUTPUT_DIR}'")

    if resultados_para_directus:
        save_results_to_json(resultados_para_directus, JSON_OUTPUT_FILENAME)
    else:
        print("No se generaron datos para el archivo JSON de Directus.")

if __name__ == "__main__":
    main()