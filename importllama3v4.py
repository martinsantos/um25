import json
import requests
from tqdm import tqdm
from datetime import datetime
import re

# Configuración mejorada
MODEL = "llama3"
OLLAMA_URL = "http://localhost:11434/api/generate"
INPUT_FILE = "antecedentes_enriquecidos_v5.json"
OUTPUT_FILE = "antecedentes_enriquecidos_v6.json"  # Versión actualizada

# Prompts optimizados y más limpios
PROMPT_TITULO_SEO = """[INST]
<<SYS>>
Genera un título SEO optimizado para proyecto tecnológico con estas características:
- Máximo 70 caracteres
- Estructura: [Solución Tecnológica] + [Beneficio Clave] + [Sector]
- Usa verbos de acción como Optimización, Implementación, Transformación
- Incluye palabras clave relevantes
- Enfoque B2B tecnológico

Contexto:
Área: {area}
Cliente: {cliente}
Descripción: {descripcion}

Ejemplo: "Infraestructura VoIP: Reducción de 40% en Tiempos de Respuesta para Sector Telecomunicaciones"

Genera SOLO el título optimizado sin comentarios:[/INST]"""

PROMPT_DESCRIPCION_TECNICA = """[INST]
<<SYS>>
Crea una descripción técnica concisa (30-50 palabras) con:
1. Tecnología implementada
2. Problema resuelto
3. Impacto cuantificable

Contexto:
Título: {titulo}
Área: {area}
Cliente: {cliente}
Descripción: {descripcion}

Ejemplo: "Implementación de infraestructura VoIP Cisco que optimizó soporte técnico SDI, reduciendo tiempos de respuesta en 40% y mejorando coordinación para CelSA."

Genera SOLO la descripción técnica sin comentarios:[/INST]"""

PROMPT_NORMALIZACION_CAMPOS = """[INST]
<<SYS>>
Normaliza este valor de campo técnico:
- Mayúsculas iniciales
- Sin redundancias
- Precisión terminológica
- Consistente para B2B

Campo: {campo}
Valor Actual: {valor}
Área: {area}

Genera SOLO el valor normalizado sin comentarios:[/INST]"""

def procesar_con_llama(prompt, temperatura=0.7):
    """Procesamiento mejorado con manejo de errores"""
    try:
        payload = {
            "model": MODEL,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": temperatura,
                "num_ctx": 4096
            }
        }
        
        response = requests.post(OLLAMA_URL, json=payload, timeout=60)
        
        if response.status_code == 200:
            respuesta = response.json()["response"].strip()
            # Limpieza más agresiva de formatos no deseados
            respuesta = re.sub(r'[\*\n]|(\[\/?INST\])', '', respuesta).strip()
            return respuesta
        
    except Exception as e:
        print(f"Error en procesamiento: {e}")
        return None

def limpiar_texto(texto):
    """Limpieza profunda de texto"""
    if not texto:
        return ""
    
    # Eliminar patrones no deseados
    patrones = [
        r'<<SYS>>.*?<</SYS>>',
        r'\[INST\].*?\[\/INST\]',
        r'\*\*',
        r'\[.*?\]',
        r'http\S+',
        r'🔧|🎯|🌐|🔥|🔬'  # Emojis
    ]
    
    for patron in patrones:
        texto = re.sub(patron, '', texto, flags=re.DOTALL)
    
    # Normalizar espacios
    texto = ' '.join(texto.split())
    return texto.strip()

def generar_contenido(item, campo, prompt_template):
    """Generación de contenido limpio"""
    prompt = prompt_template.format(
        titulo=limpiar_texto(item.get('Título', '')),
        area=limpiar_texto(item.get('Área', '')),
        cliente=limpiar_texto(item.get('Cliente', '')),
        descripcion=limpiar_texto(item.get('Descripción', '')),
        campo=campo,
        valor=limpiar_texto(item.get(campo, ''))
    )
    
    resultado = procesar_con_llama(prompt)
    return limpiar_texto(resultado) if resultado else ""

def normalizar_campos(item):
    """Normalización consistente de campos"""
    campos = {
        'Cliente': 'Cliente',
        'Área': 'Área Tecnológica',
        'Unidad_de_negocio': 'Unidad de Negocio'
    }
    
    for campo_orig, campo_tipo in campos.items():
        if campo_orig in item:
            prompt = PROMPT_NORMALIZACION_CAMPOS.format(
                campo=campo_tipo,
                valor=limpiar_texto(item[campo_orig]),
                area=limpiar_texto(item.get('Área', '')))
            
            resultado = procesar_con_llama(prompt, temperatura=0.5)
            item[campo_orig] = limpiar_texto(resultado) if resultado else item[campo_orig]
    
    return item

def normalizar_fecha(fecha):
    """Normalización robusta de fechas"""
    try:
        fecha = str(fecha).strip()
        formatos = ['%Y-%m-%d', '%d-%m-%Y', '%m/%d/%Y', '%Y/%m/%d']
        
        for fmt in formatos:
            try:
                return datetime.strptime(fecha, fmt).strftime('%Y-%m-%d')
            except ValueError:
                continue
                
        return datetime.now().strftime('%Y-%m-%d')
    except Exception:
        return datetime.now().strftime('%Y-%m-%d')

def procesar_antecedentes():
    """Procesamiento principal mejorado"""
    try:
        with open(INPUT_FILE, 'r', encoding='utf-8') as f:
            datos = json.load(f)
    except Exception as e:
        print(f"Error cargando archivo: {e}")
        return []
    
    resultados = []
    
    for item in tqdm(datos, desc="Procesando antecedentes"):
        try:
            # Limpieza inicial
            item = {k: limpiar_texto(v) if isinstance(v, str) else v for k, v in item.items()}
            
            # Generación de contenido
            item['Título'] = generar_contenido(item, 'Título', PROMPT_TITULO_SEO) or item.get('Título', '')
            item['Descripción_Ampliada'] = generar_contenido(item, 'Descripción', PROMPT_DESCRIPCION_TECNICA) or item.get('Descripción', '')
            
            # Normalización
            item = normalizar_campos(item)
            
            # Normalización de fecha y monto
            item['Fecha'] = normalizar_fecha(item.get('Fecha', ''))
            item['Monto_contratado'] = float(item.get('Monto_contratado', 0))
            
            resultados.append(item)
        except Exception as e:
            print(f"Error procesando item: {e}")
            continue
    
    # Guardar resultados
    try:
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(resultados, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Error guardando resultados: {e}")
    
    return resultados

def main():
    print("\n" + "="*50)
    print(" PROCESADOR DE ANTECEDENTES TÉCNICOS MEJORADO")
    print(f" Modelo: {MODEL} | Entrada: {INPUT_FILE}")
    print("="*50 + "\n")
    
    resultados = procesar_antecedentes()
    
    print("\n" + "="*50)
    print(f" Proceso completado. Registros: {len(resultados)}")
    print(f" Salida guardada en: {OUTPUT_FILE}")
    print("="*50)

if __name__ == "__main__":
    main()