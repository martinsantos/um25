import json
import requests
from tqdm import tqdm

# Configuración
MODEL = "mistral"  # o el modelo que hayas elegido
OLLAMA_URL = "http://localhost:11434/api/generate"
INPUT_FILE = "ANTECEDENTES_NUEVOS.json"
OUTPUT_FILE = "antecedentes_ampliados.json"

# Plantilla del prompt
PROMPT_TEMPLATE = """
Amplía la descripción del siguiente antecedente profesional basándote en su título y áreas de trabajo.
Sé técnico pero claro, usando entre 50-100 palabras. Mantén un tono profesional.

Título: {titulo}
Áreas: {areas}
Descripción actual: {descripcion}

Nueva descripción ampliada:
"""

def ampliar_descripcion(titulo, areas, descripcion):
    prompt = PROMPT_TEMPLATE.format(
        titulo=titulo,
        areas=", ".join(areas),
        descripcion=descripcion
    )
    
    payload = {
        "model": MODEL,
        "prompt": prompt,
        "stream": False
    }
    
    response = requests.post(OLLAMA_URL, json=payload)
    if response.status_code == 200:
        return response.json()["response"].strip()
    else:
        print(f"Error: {response.text}")
        return descripcion  # Mantener la original si hay error

def procesar_antecedentes():
    with open(INPUT_FILE, 'r') as f:
        datos = json.load(f)
    
    for item in tqdm(datos, desc="Procesando antecedentes"):
        if 'descripcion' in item and 'titulo' in item and 'areas' in item:
            item['descripcion_ampliada'] = ampliar_descripcion(
                item['titulo'],
                item['areas'],
                item.get('descripcion', '')
            )
    
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(datos, f, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    procesar_antecedentes()
    print(f"Proceso completado. Resultados guardados en {OUTPUT_FILE}")