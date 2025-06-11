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
OLLAMA_PROMPT_RETRIES = 3  # Número de reintentos para generar el prompt

# --- Configuración Diffusers ---
BASE_MODEL_ID = "stabilityai/stable-diffusion-xl-base-1.0" # Modelo base para fotorrealismo (ejemplo)
REFINER_MODEL_ID = "stabilityai/stable-diffusion-xl-refiner-1.0" # Refinador para fotorrealismo (ejemplo)
DIFFUSERS_RETRIES = 2  # Número de reintentos para generar la imagen

# --- Configuración de Generación (Ajustado para MPS - REDUCIENDO MEMORIA) ---
RESOLUTION = 768  # Reduciendo la resolución para menor consumo de memoria
NUM_INFERENCE_STEPS_BASE = 15  # Reduciendo los pasos para menor consumo de memoria
NUM_INFERENCE_STEPS_REFINER = 10
GUIDANCE_SCALE = 7.5
USE_REFINER = True  # Puedes intentar desactivar esto si sigues teniendo problemas de memoria

# Semilla para reproducibilidad (-1 para aleatoria)
SEED = -1

# Prompt Negativo Mejorado para evitar elementos no deseados y mejorar el realismo
NEGATIVE_PROMPT = (
    "ugly, deformed, noisy, blurry, low quality, poor quality, worst quality, duplicate, clones, "
    "text, watermark, signature, username, words, letters, labels, fonts, writing, captions, titles, "
    "multiple limbs, extra limbs, extra fingers, fused fingers, bad fingers, bad hands, malformed hands, "
    "bad anatomy, distorted face, mutation, mutated, disfigured, morbid, gross, disgusting, unrealistic, "
    "tiling, poorly drawn, out of frame, cropped, lowres, jpeg artifacts, illustration, cartoon, sketch, "
    "cgi, 3d render, plastic look, smooth shading, blurry details, low detail, abstract, anime, cartoonish" # Añadidos para enfoque técnico
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

def generate_detailed_prompt(client, llm_model, project_data, retry=0, max_retries=OLLAMA_PROMPT_RETRIES):
    """
    Genera un prompt detallado y realista para la creación de imágenes relacionadas con Última Milla,
    enfocándose en telecomunicaciones e infraestructura técnica en situaciones del mundo real.
    Se solicita a Ollama que genere un prompt conciso.
    """
    print(f"  Generando prompt detallado con Ollama ({llm_model})... (Intento {retry + 1}/{max_retries + 1})")
    t_start = time.time()

    # Enriquecemos el prompt con información específica de Última Milla y el contexto realista
    company_info = """
    Última Milla (www.ultimamilla.com.ar) es una empresa argentina especializada en:
    - Instalación profesional de redes LAN/WAN/WLAN
    - Cableado estructurado y fibra óptica
    - Sistemas de detección de incendios
    - Soluciones de telecomunicaciones empresariales

    Imagina escenarios del mundo real donde se realizan estas tareas. Los ambientes típicos incluyen:
    - Oficinas corporativas modernas y funcionales con equipos de red visibles.
    - Salas de servidores organizadas con racks, cableado limpio y luces indicadoras.
    - Instalaciones industriales con cableado robusto, paneles de control y equipos de telecomunicaciones.
    - Sitios de telecomunicaciones exteriores o interiores con antenas, torres, y equipos de transmisión.
    - Técnicos profesionales trabajando en estas instalaciones, utilizando herramientas y equipos específicos.

    La estética debe ser moderna, limpia, profesional y técnicamente sofisticada, reflejando situaciones reales de trabajo.
    """

    meta_prompt = f"""Eres un ingeniero de prompts experto especializado en crear descripciones visuales vívidas y detalladas para modelos de generación de imágenes text-to-image como Stable Diffusion XL. Tu objetivo es transformar la siguiente información de proyecto en un único párrafo de prompt conciso (máximo 70 palabras) y altamente descriptivo y optimizado para generar una imagen fotorrealista y profesional, enfocándose en los aspectos materiales concretos de la infraestructura técnica de la empresa Última Milla en un escenario realista.

    Considera los siguientes aspectos al crear el prompt:
    - **Sujeto Principal:** Claramente definido basado en el Título y Descripción, ambientado en un contexto real.
    - **Escenario Realista:** Describe brevemente la situación del mundo real en la que se encuentra el sujeto.
    - **Composición:** Describe la disposición principal de los elementos y el tipo de encuadre.
    - **Iluminación:** Especifica el tipo de luz y ambiente general.
    - **Estilo Visual:** Apunta a 'ultra realistic photo', 'professional corporate photography', 'technical documentation', 'high detail', 'sharp focus', '8k resolution', 'real-world setting'. Describe los materiales principales de forma concisa.
    - **Atmósfera/Emoción:** Transmite brevemente el 'mood' propio de instalaciones técnicas profesionales en funcionamiento.
    - **Detalles Clave:** Incorpora las 'Palabras_clave' de forma natural y concisa en la descripción visual.
    - **Materiales:** Describe los materiales principales con precisión técnica y realista.
    - **Formato:** Produce solo el párrafo del prompt final, sin explicaciones, saludos ni comentarios adicionales. Debe ser un texto continuo y conciso.

    Información sobre la empresa:
    {company_info}

    Información del Proyecto:
    - Titulo: {project_data.get('Titulo', 'Sin título')}
    - Descripcion: {project_data.get('Descripcion', 'Sin descripción')}
    - Palabras_clave: {project_data.get('Palabras_clave', 'Sin palabras clave')}

    Genera el prompt AHORA (máximo 70 palabras):"""

    try:
        response = client.generate(model=llm_model,
                                  prompt=meta_prompt,
                                  stream=False,
                                  options={"temperature": 0.7}) # Manteniendo una temperatura moderada
        generated_prompt = response['response'].strip()
        print(f"    Prompt generado por Ollama en {time.time() - t_start:.2f}s")
        # Limpieza adicional
        generated_prompt = generated_prompt.replace('"', '').replace("Prompt:", "").strip()
        generated_prompt = generated_prompt.replace("\n", " ").replace("  ", " ")

        # Asegurar que el prompt incluya una referencia a la empresa
        if "Última Milla" not in generated_prompt and "Ultima Milla" not in generated_prompt:
            generated_prompt += ", by Última Milla Argentina"

        return generated_prompt
    except Exception as e:
        print(f"    ERROR al contactar Ollama o generar prompt: {e}")
        if retry < max_retries:
            time.sleep(2)
            return generate_detailed_prompt(client, llm_model, project_data, retry + 1, max_retries)
        else:
            print("    Usando descripción de fallback específica para Última Milla.")
            return (f"professional photo of: {project_data.get('Titulo', 'instalación técnica')} by Última Milla. "
                    f"Key elements: {project_data.get('Palabras_clave', 'redes, servidores')}. "
                    f"Style: photorealistic, sharp focus.")

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

def generate_ultima_milla_image(pipe_base, pipe_refiner, prompt, project_data, output_dir, seed, use_refiner=True, num_steps_base=NUM_INFERENCE_STEPS_BASE, num_steps_refiner=NUM_INFERENCE_STEPS_REFINER, guidance_scale=GUIDANCE_SCALE, retry=0, max_retries=DIFFUSERS_RETRIES):
    """
    Genera una imagen de alta calidad para Última Milla con los parámetros optimizados y manejo de reintentos.
    Trunca el prompt si excede la longitud máxima de CLIP.
    """
    title = project_data.get('Titulo', 'Sin título')
    print(f"\nGenerando imagen para proyecto: {title} (Intento {retry + 1}/{max_retries + 1})")
    print(f"Usando prompt (antes de truncar):\n{prompt[:150]}..." if len(prompt) > 150 else f"{prompt}")
    print(f"Usando semilla: {seed}")

    # Truncar el prompt si es demasiado largo para CLIP (aproximadamente 77 tokens)
    max_clip_length = 77
    if len(prompt.split()) > max_clip_length:
        prompt_parts = prompt.split()
        prompt = " ".join(prompt_parts[:max_clip_length])
        print(f"  Prompt truncado a: {prompt}...")

    # Asegurar que existe el directorio de salida
    os.makedirs(output_dir, exist_ok=True)

    # Mejores parámetros para imágenes técnicas/profesionales
    negative_prompt = NEGATIVE_PROMPT

    t_start = time.time()
    generator = torch.Generator(device='cpu').manual_seed(seed)
    image = None

    try:
        # Generar imagen base
        base_output = pipe_base(
            prompt=prompt,
            negative_prompt=negative_prompt,
            num_inference_steps=num_steps_base,
            guidance_scale=guidance_scale,
            height=RESOLUTION,
            width=RESOLUTION,
            generator=generator,
            output_type="latent" if use_refiner and pipe_refiner else "pil",
            denoising_end=0.85 if use_refiner and pipe_refiner else 1.0
        ).images

        if use_refiner and pipe_refiner:
            # Refinar la imagen si está habilitado
            print("  Aplicando refinamiento para mayor detalle técnico...")
            refined_output = pipe_refiner(
                prompt=prompt,
                negative_prompt=negative_prompt,
                image=base_output,
                num_inference_steps=num_steps_refiner,
                guidance_scale=guidance_scale,
                denoising_start=0.85,
                generator=generator
            ).images
            image = refined_output
        elif isinstance(base_output, list):
            image = base_output
        else:
            print("    Decodificando latentes del modelo base...")
            with torch.inference_mode():
                latents = base_output / pipe_base.vae.config.scaling_factor
                image_decoded = pipe_base.vae.decode(latents, return_dict=False)
                image = pipe_base.image_processor.postprocess(image_decoded, output_type='pil')

        if image and isinstance(image, list):
            # Generar nombre de archivo basado en el proyecto
            timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            safe_title = sanitize_filename(title)
            refiner_tag = "_refined" if use_refiner and pipe_refiner else ""
            filename = f"{output_dir}/ultimamilla_{safe_title}_{timestamp}_s{seed}.png"

            # Guardar imagen
            image[0].save(filename)
            print(f"  Imagen generada en {time.time() - t_start:.2f}s y guardada como: {filename}")

            return {
                "status": "success",
                "filename": filename,
                "prompt": prompt,
                "negative_prompt": negative_prompt,
                "project": project_data,
                "timestamp": timestamp,
                "seed": seed,
                "generation_time": f"{time.time() - t_start:.2f}s",
                "error": None
            }
        else:
            raise Exception("No se pudo obtener la imagen final.")

    except Exception as e:
        print(f"  ERROR al generar la imagen: {e}")
        if retry < max_retries:
            time.sleep(5)
            print("  Reintentando generación...")
            return generate_ultima_milla_image(pipe_base, pipe_refiner, prompt, project_data, output_dir, seed, use_refiner, num_steps_base, num_steps_refiner, guidance_scale, retry + 1, max_retries)
        else:
            error_msg = str(e)
            return {
                "status": "error",
                "filename": None,
                "prompt": prompt,
                "negative_prompt": negative_prompt,
                "project": project_data,
                "timestamp": datetime.datetime.now().strftime("%Y%m%d_%H%M%S"),
                "seed": seed,
                "generation_time": f"{time.time() - t_start:.2f}s",
                "error": error_msg
            }

def save_results_to_json(data, filename):
    """
    Guarda los metadatos de la imagen generada para su posterior referencia.
    """
    try:
        # Asegurar que existe el directorio donde se guardará el archivo
        # REMOVIENDO LA CREACIÓN DE DIRECTORIO PARA EL ARCHIVO JSON
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
        print("Semilla configurada en modo aleatorio por imagen.")
    else:
        print(f"Semilla base configurada en: {SEED}")

    # --- Loop Principal de Generación ---
    print("\n--- Iniciando generación de imágenes y datos ---")
    total_start_time = time.time()
    proyectos_procesados = 0
    proyectos_exitosos = 0
    proyectos_fallidos = 0

    for i, proyecto in enumerate(proyectos):
        item_start_time = time.time()
        print(f"\n[{i+1}/{len(proyectos)}] Procesando: {proyecto.get('Titulo', 'Desconocido')}")
        project_number = i + 1 # Para ordenar por número

        img_seed = SEED if SEED != -1 else random.randint(0, 2**32 - 1)
        print(f"  Usando Semilla para esta imagen: {img_seed}")

        generated_prompt = None
        image_generation_result = None

        try:
            # 1. Generar Prompt Detallado con Ollama (con reintentos)
            generated_prompt = generate_detailed_prompt(ollama_client, LLM_FOR_PROMPTING, proyecto)
            print(f"  Prompt Final (Ollama): {generated_prompt}")

            # 2. Generación de Imagen con Diffusers (MPS) (con reintentos)
            image_generation_result = generate_ultima_milla_image(
                pipe_base, pipe_refiner, generated_prompt, proyecto, IMAGE_OUTPUT_DIR, img_seed, USE_REFINER
            )

            if image_generation_result and image_generation_result["status"] == "success":
                resultados_para_directus.append({
                    "numero": project_number,
                    "titulo_original": proyecto.get('Titulo', None),
                    "descripcion_original": proyecto.get('Descripcion', None),
                    "palabras_clave_originales": proyecto.get('Palabras_clave', None),
                    "prompt_detallado_ollama": generated_prompt,
                    "nombre_archivo_generado": image_generation_result["filename"],
                    "seed_utilizada": img_seed,
                    "generation_time": image_generation_result["generation_time"],
                    "status": "success",
                    "error": None
                })
                proyectos_exitosos += 1
            elif image_generation_result and image_generation_result["status"] == "error":
                resultados_para_directus.append({
                    "numero": project_number,
                    "titulo_original": proyecto.get('Titulo', None),
                    "descripcion_original": proyecto.get('Descripcion', None),
                    "palabras_clave_originales": proyecto.get('Palabras_clave', None),
                    "prompt_detallado_ollama": generated_prompt,
                    "nombre_archivo_generado": None,
                    "seed_utilizada": img_seed,
                    "generation_time": image_generation_result["generation_time"],
                    "status": "error",
                    "error": image_generation_result["error"]
                })
                proyectos_fallidos += 1
            else:
                print("  Error desconocido al procesar la imagen.")
                resultados_para_directus.append({
                    "numero": project_number,
                    "titulo_original": proyecto.get('Titulo', None),
                    "descripcion_original": proyecto.get('Descripcion', None),
                    "palabras_clave_originales": proyecto.get('Palabras_clave', None),
                    "prompt_detallado_ollama": generated_prompt,
                    "nombre_archivo_generado": None,
                    "seed_utilizada": img_seed,
                    "generation_time": None,
                    "status": "error",
                    "error": "Error desconocido durante la generación de la imagen."
                })
                proyectos_fallidos += 1

            proyectos_procesados += 1
            item_end_time = time.time()
            print(f"  Tiempo total para este item: {item_end_time - item_start_time:.2f} segundos")

        except Exception as e:
            item_end_time = time.time()
            print(f"  ERROR FATAL procesando '{proyecto.get('Titulo', 'Desconocido')}': {str(e)}")
            import traceback
            traceback.print_exc()
            print(f"  (Tiempo transcurrido: {item_end_time - item_start_time:.2f} segundos)")
            resultados_para_directus.append({
                "numero": project_number,
                "titulo_original": proyecto.get('Titulo', None),
                "descripcion_original": proyecto.get('Descripcion', None),
                "palabras_clave_originales": proyecto.get('Palabras_clave', None),
                "prompt_detallado_ollama": generated_prompt,
                "nombre_archivo_generado": None,
                "seed_utilizada": img_seed,
                "generation_time": None,
                "status": "error",
                "error": f"Error fatal durante el procesamiento: {str(e)}"
            })
            proyectos_fallidos += 1
            proyectos_procesados += 1
        except KeyboardInterrupt:
             print("\nGeneración interrumpida por el usuario.")
             if resultados_para_directus:
                 # Ordenar resultados por número antes de guardar
                 resultados_para_directus.sort(key=lambda x: x.get('numero'))
                 save_results_to_json(resultados_para_directus, JSON_OUTPUT_FILENAME)
             else:
                 print("No se generaron resultados para guardar.")
             sys.exit(0)

    # --- Finalización ---
    total_end_time = time.time()
    print(f"\n--- Proceso completado en {total_end_time - total_start_time:.2f} segundos ---")
    print(f"Resultados: {proyectos_exitosos} imágenes generadas exitosamente, {proyectos_fallidos} fallidos de {proyectos_procesados} proyectos procesados.")
    print(f"Imágenes guardadas en: '{IMAGE_OUTPUT_DIR}'")

    if resultados_para_directus:
        # Ordenar resultados por número antes de guardar
        resultados_para_directus.sort(key=lambda x: x.get('numero'))
        save_results_to_json(resultados_para_directus, JSON_OUTPUT_FILENAME)

        # Revisar el status del mapeo
        errores_encontrados = any(item['status'] == 'error' for item in resultados_para_directus)
        if errores_encontrados:
            print("\n--- SE ENCONTRARON ERRORES DURANTE LA GENERACIÓN. Revisar el archivo JSON para más detalles. ---")
        else:
            print("\n--- El mapeo de imágenes se completó sin errores. ---")
    else:
        print("No se generaron datos para el archivo JSON de Directus.")

if __name__ == "__main__":
    main()