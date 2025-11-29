import json
import requests
from tqdm import tqdm

# Configuración
MODEL = "llama3"  # Modelo Llama3
OLLAMA_URL = "http://localhost:11434/api/generate"
INPUT_FILE = "ANTECEDENTES_NUEVOS.json"
OUTPUT_FILE = "antecedentes_ampliados_llama3.json"

# Plantilla del prompt optimizada para Llama3
PROMPT_TEMPLATE = """[INST]
<<SYS>>
Eres un experto en redacción técnica profesional. Amplía la descripción del proyecto con:
- Mínimo 80 palabras (obligatorio)
- Detalles técnicos relevantes
- Tecnologías/sistemas utilizados
- Alcance exacto del trabajo
- Resultados concretos obtenidos
- Contexto del cliente y sus necesidades
<</SYS>>

Datos del proyecto:
Título: {titulo}
Área: {area}
Cliente: {cliente}
Descripción breve: {descripcion}

Genera ÚNICAMENTE la descripción ampliada sin encabezados:[/INST]"""

def ampliar_descripcion(item):
    prompt = PROMPT_TEMPLATE.format(
        titulo=item.get('Título', 'Sin título'),
        area=item.get('Área', 'Área no especificada'),
        cliente=item.get('Cliente', 'Cliente no especificado'),
        descripcion=item.get('Descripción', 'Descripción inicial no disponible')
    )
    
    payload = {
        "model": MODEL,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.8,  # Más creatividad
            "num_ctx": 4096,     # Mayor contexto para Llama3
            "num_predict": 500   # Más palabras de salida
        }
    }
    
    try:
        response = requests.post(OLLAMA_URL, json=payload, timeout=120)
        if response.status_code == 200:
            respuesta = response.json()["response"].strip()
            # Limpieza de la respuesta
            respuesta = respuesta.replace("[/INST]", "").replace("[INST]", "").strip()
            return respuesta
        else:
            print(f"\nError API: {response.status_code}")
    except Exception as e:
        print(f"\nError de conexión: {str(e)}")
    
    return item.get('Descripción', '')

def verificar_longitud(texto, minimo=80):
    palabras = len(texto.split())
    return palabras >= minimo, palabras

def procesar_antecedentes():
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        datos = json.load(f)
    
    for idx, item in enumerate(tqdm(datos, desc="Ampliando descripciones")):
        if 'Descripción' in item:
            desc_ampliada = ampliar_descripcion(item)
            item['Descripción_Ampliada'] = desc_ampliada
            
            # Verificación estricta
            cumple_longitud, num_palabras = verificar_longitud(desc_ampliada)
            if not cumple_longitud:
                print(f"\n¡Atención! Item {idx+1} ({item.get('Título','')} solo tiene {num_palabras} palabras")
                # Reintentar automáticamente
                desc_ampliada = ampliar_descripcion(item)
                item['Descripción_Ampliada'] = desc_ampliada
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(datos, f, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    print("\n" + "="*60)
    print(" SISTEMA DE AMPLIACIÓN DE ANTECEDENTES TÉCNICOS")
    print(f" Modelo: {MODEL.upper()} | Archivo: {INPUT_FILE}")
    print("="*60 + "\n")
    
    procesar_antecedentes()
    
    print("\n" + "="*60)
    print(f" Proceso completado. Resultados guardados en: {OUTPUT_FILE}")
    print("="*60)