import json
import requests
from tqdm import tqdm
from datetime import datetime
import re

# Configuración
MODEL = "llama3"  # Modelo Llama3
OLLAMA_URL = "http://localhost:11434/api/generate"
INPUT_FILE = "antecedentes_ampliados_v2.json"
OUTPUT_FILE = "antecedentes_enriquecidos_v4.json"

# Prompts optimizados con directrices de alta precisión
PROMPT_TITULO_SEO = """[INST]
<<SYS>>
🎯 Generación de Título SEO para Proyecto Tecnológico

Directrices Críticas:
- Máximo 70 caracteres
- Estructura: [Solución Tecnológica] + [Beneficio Clave] + [Sector]
- Usar verbos de acción estratégicos
- Palabras clave de alto impacto
- Orientado a audiencia B2B de tecnología

Palabras Clave Estratégicas:
- Transformación digital
- Infraestructura tecnológica
- Optimización
- Solución integral
- Innovación

Contexto del Proyecto:
Área: {area}
Cliente: {cliente}
Descripción Base: {descripcion}

Ejemplo Transformación:
- Genérico: "Proyecto de Telefonía"
- Optimizado: "Infraestructura VoIP: Transformación Comunicacional en Sector Salud"

Genera ÚNICAMENTE título SEO ultra-optimizado:[/INST]"""

PROMPT_DESCRIPCION_TECNICA = """[INST]
<<SYS>>
🔬 Síntesis de Descripción Técnica Estratégica

Parámetros Críticos:
- Extensión: 30-50 palabras
- Estructura Obligatoria:
  1. Tecnología implementada
  2. Problema técnico resuelto
  3. Impacto mensurable

Directrices Técnicas:
- Verbos de acción: implementar, optimizar, transformar
- Métricas y beneficios cuantitativos
- Precisión técnica absoluta
- Lenguaje profesional B2B
- Zero tolerancia a contenido genérico

Contexto:
Título Original: {titulo}
Área: {area}
Cliente: {cliente}
Descripción Base: {descripcion}

Ejemplo Transformación:
- Genérico: "Instalamos teléfonos"
- Optimizado: "Implementación de infraestructura VoIP Cisco que optimizó comunicaciones hospitalarias, reduciendo tiempos de respuesta en 40% y mejorando coordinación asistencial"

Genera ÚNICAMENTE descripción técnica estratégica:[/INST]"""

PROMPT_TRADUCCION_TECNICA = """[INST]
<<SYS>>
🌐 Traducción Técnica Profesional

Criterios de Traducción:
- Mantener terminología técnica precisa
- Conservar tono profesional
- Preservar estructura técnica original
- Traducir al español respetando contexto tecnológico

Niveles de Precisión:
- Traducción literal
- Adaptación semántica
- Consistencia terminológica

Texto a Traducir: {texto}

Genera ÚNICAMENTE traducción técnica profesional:[/INST]"""

PROMPT_NORMALIZACION_CAMPOS = """[INST]
<<SYS>>
🔧 Normalización Profesional de Campos Técnicos

Criterios de Normalización:
- Mayúsculas iniciales estratégicas
- Eliminación de redundancias
- Consistencia para indexación
- Optimización para búsquedas B2B
- Precisión terminológica

Contexto de Normalización:
Campo: {campo}
Valor Actual: {valor}
Área Tecnológica: {area}

Genera ÚNICAMENTE valor normalizado:[/INST]"""

def procesar_con_llama(prompt, temperatura=0.7, max_intentos=3):
    """Procesamiento robusto con Ollama"""
    for intento in range(max_intentos):
        try:
            payload = {
                "model": MODEL,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": temperatura,
                    "num_ctx": 4096,
                    "num_predict": 250
                }
            }
            
            response = requests.post(OLLAMA_URL, json=payload, timeout=90)
            
            if response.status_code == 200:
                respuesta = response.json()["response"].strip()
                respuesta = re.sub(r'\[(/)?INST\]', '', respuesta).strip()
                return respuesta
            
        except Exception as e:
            print(f"Intento {intento + 1} fallido: {e}")
    
    return None

def es_texto_ingles(texto):
    """Detectar si el texto está predominantemente en inglés"""
    if not texto or len(texto) < 10:
        return False
    
    palabras_ingles = set(['the', 'and', 'of', 'to', 'in', 'for', 'a', 'an', 'is', 'was'])
    palabras = texto.lower().split()
    ingles_ratio = sum(1 for palabra in palabras if palabra in palabras_ingles) / len(palabras)
    
    return ingles_ratio > 0.2

def traducir_texto_tecnico(texto):
    """Traducción técnica inteligente"""
    if not texto or not es_texto_ingles(texto):
        return texto
    
    prompt = PROMPT_TRADUCCION_TECNICA.format(texto=texto)
    return procesar_con_llama(prompt, temperatura=0.6) or texto

def generar_titulo_seo(item):
    """Generación de título SEO optimizado"""
    prompt = PROMPT_TITULO_SEO.format(
        area=item.get('Área', ''),
        cliente=item.get('Cliente', ''),
        descripcion=item.get('Descripción', '')
    )
    return procesar_con_llama(prompt, temperatura=0.8) or item.get('Título', '')

def sintetizar_descripcion_tecnica(item):
    """Síntesis de descripción técnica estratégica"""
    prompt = PROMPT_DESCRIPCION_TECNICA.format(
        titulo=item.get('Título', ''),
        area=item.get('Área', ''),
        cliente=item.get('Cliente', ''),
        descripcion=item.get('Descripción', '')
    )
    return procesar_con_llama(prompt, temperatura=0.7) or item.get('Descripción_Ampliada', '')

def normalizar_campo(campo, valor, contexto):
    """Normalización estratégica de campos"""
    prompt = PROMPT_NORMALIZACION_CAMPOS.format(
        campo=campo,
        valor=str(valor),
        area=contexto.get('Área', '')
    )
    return procesar_con_llama(prompt, temperatura=0.4) or valor

def normalizar_fecha(fecha):
    """Normalización robusta de fechas"""
    try:
        # Manejar formatos extraños
        fecha = str(fecha).replace('+', '').strip()
        
        # Formatos posibles
        formatos = ['%Y-%m-%d', '%d-%m-%Y', '%m/%d/%Y', '%Y/%m/%d']
        
        for fmt in formatos:
            try:
                fecha_obj = datetime.strptime(fecha, fmt)
                return fecha_obj.strftime('%Y-%m-%d')
            except ValueError:
                continue
        
        return datetime.now().strftime('%Y-%m-%d')
    
    except Exception:
        return datetime.now().strftime('%Y-%m-%d')

def procesar_antecedentes():
    """Procesamiento principal de antecedentes técnicos"""
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        datos = json.load(f)
    
    datos_procesados = []
    
    for item in tqdm(datos, desc="🚀 Enriqueciendo Antecedentes Técnicos"):
        # Traducción de contenido técnico
        for campo, valor in list(item.items()):
            if isinstance(valor, str):
                item[campo] = traducir_texto_tecnico(valor)
        
        # Generación de título SEO
        item['Título'] = generar_titulo_seo(item)
        
        # Síntesis de descripción técnica
        item['Descripción_Ampliada'] = sintetizar_descripcion_tecnica(item)
        
        # Normalización de campos estratégicos
        campos_normalizables = {
            'Cliente': 'Cliente',
            'Área': 'Área Tecnológica',
            'Unidad_de_negocio': 'Unidad de Negocio',
            'Monto_contratado': 'Monto Contratado'
        }
        
        for campo_orig, campo_tipo in campos_normalizables.items():
            if campo_orig in item:
                item[campo_orig] = normalizar_campo(campo_tipo, item[campo_orig], item)
        
        # Normalización de fecha
        item['Fecha'] = normalizar_fecha(item.get('Fecha', ''))
        
        # Conversión de monto
        try:
            item['Monto_contratado'] = float(str(item.get('Monto_contratado', 0)).replace(',', '.'))
        except ValueError:
            item['Monto_contratado'] = 0.0
        
        datos_procesados.append(item)
    
    # Guardar resultados enriquecidos
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(datos_procesados, f, indent=2, ensure_ascii=False)
    
    return datos_procesados

def main():
    print("\n" + "="*70)
    print(" 🌐 ENRIQUECEDOR ESTRATÉGICO DE ANTECEDENTES TÉCNICOS")
    print(f" 🤖 Modelo: {MODEL.upper()} | Archivo: {INPUT_FILE}")
    print("="*70 + "\n")
    
    resultados = procesar_antecedentes()
    
    print("\n" + "="*70)
    print(f" ✅ Proceso completado. Registros procesados: {len(resultados)}")
    print(f" 📄 Resultados guardados en: {OUTPUT_FILE}")
    print("="*70)

if __name__ == "__main__":
    main()