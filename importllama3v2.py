import json
import requests
from tqdm import tqdm
import re

# Configuración
MODEL = "llama3"  # Modelo Llama3
OLLAMA_URL = "http://localhost:11434/api/generate"
INPUT_FILE = "antecedentes_ampliados_llama3.json"
OUTPUT_FILE = "antecedentes_ampliados_v2.json"

# Plantillas de prompts optimizadas
TITULO_PROMPT = """[INST]
<<SYS>>
Eres un experto en SEO y redacción profesional. Genera un título atractivo y preciso para un proyecto técnico con estas características:
- Máximo 10 palabras
- Incluye palabras clave relevantes
- Usa un formato "Servicio de [acción] para [cliente/área]"
- Evita términos genéricos como "Proyecto" o "Solución"
- Mantén un tono profesional pero directo

Datos del proyecto:
Área: {area}
Cliente: {cliente}
Descripción breve: {descripcion}

Genera ÚNICAMENTE el título sin comillas ni puntos finales:[/INST]"""

DESCRIPCION_PROMPT = """[INST]
<<SYS>>
Eres un redactor técnico profesional. Amplía la descripción del proyecto con:
- Mínimo 30 palabras (obligatorio)
- Detalles técnicos relevantes (sin inventar)
- Tecnologías/sistemas utilizados (solo si se mencionan)
- Alcance exacto del trabajo
- Resultados concretos obtenidos
- Contexto del cliente y sus necesidades

Reglas estrictas:
1) NO inventes información no presente en los datos
2) Mantén un tono profesional y objetivo
3) Evita redundancias y repeticiones
4) Usa español técnico correcto

Datos del proyecto:
Título: {titulo}
Área: {area}
Cliente: {cliente}
Descripción breve: {descripcion}
Descripción actual: {desc_actual}

Genera ÚNICAMENTE la descripción ampliada sin encabezados:[/INST]"""

CORRECCION_PROMPT = """[INST]
<<SYS>>
Eres un editor experto en español técnico. Corrige este texto:
- Traduce al español cualquier parte en inglés
- Elimina redundancias
- Asegura coherencia técnica
- Mantén el tono profesional
- Conserva los términos técnicos válidos

Texto a corregir: {texto}

Genera ÚNICAMENTE el texto corregido sin comentarios:[/INST]"""

NORMALIZACION_PROMPT = """[INST]
<<SYS>>
Eres un especialista en normalización de datos. Analiza este valor y devuelve la versión estandarizada según estas reglas:

Clientes:
- "HOSPITAL TEODORO SCHESTAKOW" → "Hospital Teodoro Schestakov"
- Usa formato "Nombre Institución" sin siglas innecesarias

Áreas:
- "Telefonía" → "Telecomunicaciones"
- "IT" → "Tecnología de la Información"
- Usa nombres de áreas consistentes

Unidades de Negocio:
- "ITO" → "Servicios TI"
- Usa nombres oficiales de unidades

Valor a normalizar: {valor}
Categoría: {categoria}

Genera ÚNICAMENTE el valor normalizado:[/INST]"""

def llamar_llama(prompt, max_palabras=100):
    payload = {
        "model": MODEL,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.7,
            "num_ctx": 4096,
            "num_predict": max_palabras * 2  # Estimación palabras
        }
    }
    
    try:
        response = requests.post(OLLAMA_URL, json=payload, timeout=90)
        if response.status_code == 200:
            return response.json()["response"].strip()
    except Exception as e:
        print(f"\nError en API: {str(e)}")
    
    return None

def normalizar_dato(valor, categoria):
    if not valor or str(valor).strip() == "":
        return valor
    
    prompt = NORMALIZACION_PROMPT.format(valor=valor, categoria=categoria)
    resultado = llamar_llama(prompt, 10)
    return resultado if resultado else valor

def corregir_texto(texto):
    if not texto or not isinstance(texto, str):
        return texto
    
    # Detección simple de inglés
    if re.search(r'\b(the|and|of|to|in|for|on|that|with)\b', texto, re.I):
        prompt = CORRECCION_PROMPT.format(texto=texto)
        corregido = llamar_llama(prompt, len(texto.split()))
        return corregido if corregido else texto
    return texto

def generar_titulo(item):
    prompt = TITULO_PROMPT.format(
        area=item.get('Área', ''),
        cliente=item.get('Cliente', ''),
        descripcion=item.get('Descripción', '')
    )
    titulo = llamar_llama(prompt, 10)
    return titulo if titulo else item.get('Título', '')

def ampliar_descripcion(item):
    desc_actual = item.get('Descripción_Ampliada', '')
    
    prompt = DESCRIPCION_PROMPT.format(
        titulo=item.get('Título', ''),
        area=item.get('Área', ''),
        cliente=item.get('Cliente', ''),
        descripcion=item.get('Descripción', ''),
        desc_actual=desc_actual
    )
    
    desc_ampliada = llamar_llama(prompt, 150)
    return desc_ampliada if desc_ampliada else desc_actual

def verificar_calidad(texto, minimo=30):
    if not texto:
        return False, 0
    palabras = len(texto.split())
    return palabras >= minimo, palabras

def procesar_antecedentes():
    # Cargar datos
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        datos = json.load(f)
    
    # Procesar cada item
    for item in tqdm(datos, desc="Optimizando antecedentes"):
        # 1. Corregir textos en inglés
        for key in item:
            if isinstance(item[key], str):
                item[key] = corregir_texto(item[key])
        
        # 2. Normalizar campos clave
        item['Cliente'] = normalizar_dato(item.get('Cliente', ''), 'cliente')
        item['Área'] = normalizar_dato(item.get('Área', ''), 'área')
        item['Unidad_de_negocio'] = normalizar_dato(
            item.get('Unidad_de_negocio', ''), 'unidad_negocio')
        
        # 3. Mejorar título (SEO)
        item['Título'] = generar_titulo(item)
        
        # 4. Ampliar descripción con control de calidad
        desc_ampliada = ampliar_descripcion(item)
        item['Descripción_Ampliada'] = desc_ampliada
        
        # Verificación estricta
        cumple, palabras = verificar_calidad(desc_ampliada)
        if not cumple:
            print(f"\nReintentando descripción para {item['Título']} (solo {palabras} palabras)")
            item['Descripción_Ampliada'] = ampliar_descripcion(item)
    
    # Guardar resultados
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(datos, f, indent=2, ensure_ascii=False, sort_keys=True)

if __name__ == "__main__":
    print("\n" + "="*60)
    print(" OPTIMIZADOR DE ANTECEDENTES TÉCNICOS")
    print(f" Modelo: {MODEL.upper()} | Archivo entrada: {INPUT_FILE}")
    print("="*60 + "\n")
    
    procesar_antecedentes()
    
    print("\n" + "="*60)
    print(f" Proceso completado. Resultados guardados en: {OUTPUT_FILE}")
    print("="*60)