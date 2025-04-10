import json
import requests
from tqdm import tqdm
from datetime import datetime
import re
import unicodedata

# Configuración
MODEL = "llama3"
OLLAMA_URL = "http://localhost:11434/api/generate"
INPUT_FILE = "antecedentes_enriquecidos_v5.json"
OUTPUT_FILE = "antecedentes_enriquecidos_v6.json"  # Nueva versión mejorada

# Prompts optimizados para enriquecimiento
PROMPT_TITULO_SEO = """[INST]
<<SYS>>
Genera un título SEO optimizado en ESPAÑOL para proyecto tecnológico con:
- Exactamente 50-70 caracteres
- Estructura: [Solución] + [Beneficio] + [Sector]
- Verbos de acción: Optimización, Implementación, Modernización
- Palabras clave relevantes para posicionamiento web
- Enfoque B2B tecnológico profesional
- Todo el texto DEBE estar en español

Contexto:
Área: {area}
Cliente: {cliente}
Descripción: {descripcion}

Ejemplo: "Modernización de Redes: Reducción de 30% en Latencia para Sector Bancario"

Genera SOLO el título optimizado en español sin comentarios:[/INST]"""

PROMPT_DESCRIPCION_AMPLIADA = """[INST]
<<SYS>>
Amplía esta descripción técnica en ESPAÑOL con:
- Mínimo 40 palabras, máximo 60
- Tecnología específica utilizada
- Problema resuelto concreto
- Impacto cuantificable (tiempo, costo, eficiencia)
- Beneficios para el cliente
- Estilo profesional B2B
- Evita redundancias y repeticiones
- Todo el texto DEBE estar en español

Contexto:
Título: {titulo}
Área: {area}
Cliente: {cliente}
Descripción actual: {descripcion}

Ejemplo: "Implementación de solución VoIP basada en Cisco Call Manager que redujo en 40% los tiempos de respuesta en el soporte técnico, mejorando la coordinación entre equipos y disminuyendo costos operativos para la empresa."

Genera SOLO la descripción ampliada en español sin comentarios:[/INST]"""

PROMPT_TRADUCCION = """[INST]
<<SYS>>
Traduce este texto técnico profesional del inglés al español (de España):
- Mantén terminología técnica adecuada
- Conserva nombres propios y marcas
- Asegura fluidez y naturalidad
- Adapta formatos (ej: "25%" → "25 %")
- Todo el resultado DEBE estar en español

Texto a traducir: {texto}

Genera SOLO la traducción al español sin comentarios:[/INST]"""

PROMPT_NORMALIZACION = """[INST]
<<SYS>>
Normaliza este valor de campo para un sistema técnico profesional:
- Todo en español
- Mayúsculas iniciales correctas
- Sin redundancias
- Terminología precisa
- Formato consistente para SEO
- Optimizado para filtros y búsquedas

Campo: {campo}
Valor Actual: {valor}
Contexto: Área: {area}

Ejemplos:
- "Closed-Circuit Television" → "Videovigilancia IP"
- "941376.0" → "941.376,00 USD"
- "2025-03-28" → "Marzo 2025"

Genera SOLO el valor normalizado en español sin comentarios:[/INST]"""

def procesar_con_llama(prompt, temperatura=0.6):
    """Procesamiento mejorado con manejo robusto de errores"""
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
        
        response = requests.post(OLLAMA_URL, json=payload, timeout=90)
        response.raise_for_status()
        
        respuesta = response.json()["response"].strip()
        return limpiar_texto(respuesta)
        
    except Exception as e:
        print(f"\nError en API: {str(e)}")
        return None

def limpiar_texto(texto):
    """Limpieza exhaustiva de texto"""
    if not texto or not isinstance(texto, str):
        return ""
    
    # Eliminar patrones no deseados
    patrones = [
        r'<<SYS>>.*?<</SYS>>',
        r'\[/?INST\]',
        r'\*\*',
        r'\[.*?\]',
        r'http\S+',
        r'[�]',
        r'[\x00-\x1F\x7F]'  # Caracteres de control
    ]
    
    for patron in patrones:
        texto = re.sub(patron, '', texto, flags=re.DOTALL)
    
    # Normalización Unicode
    texto = unicodedata.normalize('NFKC', texto)
    
    # Reemplazar comillas problemáticas
    texto = texto.replace('"', "'").replace('“', "'").replace('”', "'")
    
    # Normalizar espacios y saltos
    texto = ' '.join(texto.split())
    return texto.strip()

def traducir_texto(texto):
    """Traduce texto inglés->español con manejo de errores"""
    if not texto or not isinstance(texto, str):
        return ""
    
    # Si no parece contener inglés, devolver original
    if not re.search(r'[a-zA-Z]', texto):
        return texto
    
    try:
        prompt = PROMPT_TRADUCCION.format(texto=texto)
        resultado = procesar_con_llama(prompt, temperatura=0.3)
        return resultado if resultado else texto
    except Exception as e:
        print(f"Error traduciendo: {str(e)}")
        return texto

def normalizar_campo(campo, valor, area):
    """Normalización avanzada de campos"""
    if not valor:
        return valor
    
    # Tipos especiales de campos
    if campo.lower() == 'monto_contratado':
        try:
            monto = float(valor)
            return f"{monto:,.2f} USD"
        except:
            return valor
    
    if campo.lower() == 'fecha':
        return normalizar_fecha(valor)
    
    try:
        prompt = PROMPT_NORMALIZACION.format(
            campo=campo,
            valor=valor,
            area=area
        )
        resultado = procesar_con_llama(prompt, temperatura=0.2)
        return resultado if resultado else valor
    except Exception as e:
        print(f"Error normalizando {campo}: {str(e)}")
        return valor

def normalizar_fecha(fecha):
    """Normalización robusta de fechas con formato español"""
    try:
        if not fecha:
            return "Actual"
        
        fecha = str(fecha).strip()
        formatos = [
            '%Y-%m-%d', '%d-%m-%Y', '%m/%d/%Y', 
            '%Y/%m/%d', '%d/%m/%Y', '%b %d, %Y'
        ]
        
        for fmt in formatos:
            try:
                dt = datetime.strptime(fecha, fmt)
                return dt.strftime('%B %Y').capitalize()  # "Marzo 2025"
            except ValueError:
                continue
                
        # Intento con solo año
        if re.match(r'^\d{4}$', fecha):
            return f"Anual {fecha}"
            
        return "Actual"
    except Exception:
        return "Actual"

def enriquecer_antecedente(item):
    """Procesamiento completo de un antecedente"""
    try:
        # Limpieza inicial y traducción
        item = {k: traducir_texto(limpiar_texto(v)) if isinstance(v, str) else v 
               for k, v in item.items()}
        
        # Generar título SEO mejorado
        titulo_actual = item.get('Título', '')
        nuevo_titulo = procesar_con_llama(
            PROMPT_TITULO_SEO.format(
                area=item.get('Área', ''),
                cliente=item.get('Cliente', ''),
                descripcion=item.get('Descripción', '')
            )
        )
        item['Título'] = nuevo_titulo if nuevo_titulo else titulo_actual
        
        # Ampliar descripción técnica
        desc_actual = item.get('Descripción_Ampliada', item.get('Descripción', ''))
        nueva_desc = procesar_con_llama(
            PROMPT_DESCRIPCION_AMPLIADA.format(
                titulo=item.get('Título', ''),
                area=item.get('Área', ''),
                cliente=item.get('Cliente', ''),
                descripcion=desc_actual
            )
        )
        item['Descripción_Ampliada'] = nueva_desc if nueva_desc else desc_actual
        
        # Normalización de campos clave
        campos_normalizar = [
            'Cliente', 'Área', 'Unidad_de_negocio',
            'Monto_contratado', 'Fecha'
        ]
        
        for campo in campos_normalizar:
            if campo in item:
                item[campo] = normalizar_campo(
                    campo,
                    str(item[campo]),
                    item.get('Área', '')
                )
        
        # Campo adicional para SEO
        item['Palabras_Clave'] = generar_palabras_clave(item)
        
        return item
    
    except Exception as e:
        print(f"\nError procesando item: {str(e)}")
        return item

def generar_palabras_clave(item):
    """Genera palabras clave para SEO basadas en el contenido"""
    try:
        texto = f"{item.get('Título', '')} {item.get('Descripción_Ampliada', '')} {item.get('Área', '')}"
        palabras = re.findall(r'\b[\w+]+\b', texto.lower())
        frecuencias = {}
        
        for palabra in palabras:
            if len(palabra) > 3 and palabra not in ['para', 'con', 'los']:
                frecuencias[palabra] = frecuencias.get(palabra, 0) + 1
        
        # Ordenar por frecuencia y tomar las top 5
        top_palabras = sorted(frecuencias.items(), key=lambda x: x[1], reverse=True)[:5]
        return ', '.join([p[0] for p in top_palabras])
    
    except Exception:
        return ""

def verificar_calidad(item):
    """Verificación exhaustiva de calidad del item procesado"""
    problemas = []
    
    # Verificar campos requeridos
    campos_requeridos = ['Título', 'Descripción_Ampliada', 'Cliente', 'Área']
    for campo in campos_requeridos:
        if not item.get(campo):
            problemas.append(f"Campo vacío: {campo}")
    
    # Verificar longitud mínima
    if len(item.get('Descripción_Ampliada', '').split()) < 30:
        problemas.append("Descripción demasiado corta")
    
    # Verificar caracteres inválidos
    for k, v in item.items():
        if isinstance(v, str) and re.search(r'[\x00-\x1F\x7F]', v):
            problemas.append(f"Caracteres inválidos en {k}")
    
    # Verificar inglés residual
    for k, v in item.items():
        if isinstance(v, str) and re.search(r'\b[a-zA-Z]{4,}\b', v) and not re.search(r'(IBM|Cisco|VoIP)', v):
            problemas.append(f"Texto en inglés detectado en {k}")
    
    return problemas if problemas else None

def procesar_antecedentes():
    """Procesamiento principal mejorado"""
    try:
        with open(INPUT_FILE, 'r', encoding='utf-8') as f:
            datos = json.load(f)
    except Exception as e:
        print(f"\nError cargando archivo: {str(e)}")
        return []
    
    resultados = []
    problemas_totales = 0
    
    for item in tqdm(datos, desc="Enriqueciendo antecedentes"):
        try:
            item_procesado = enriquecer_antecedente(item)
            problemas = verificar_calidad(item_procesado)
            
            if problemas:
                problemas_totales += len(problemas)
                print(f"\nProblemas en item: {item.get('Título', '')}")
                for p in problemas:
                    print(f" - {p}")
            
            resultados.append(item_procesado)
        except Exception as e:
            print(f"\nError crítico procesando item: {str(e)}")
            continue
    
    # Guardar resultados
    try:
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(resultados, f, indent=2, ensure_ascii=False)
        
        print(f"\nProceso completado con {problemas_totales} advertencias de calidad")
        return resultados
    
    except Exception as e:
        print(f"\nError guardando resultados: {str(e)}")
        return []

def main():
    print("\n" + "="*60)
    print(" ENRIQUECEDOR DE ANTECEDENTES TÉCNICOS AVANZADO")
    print(f" Modelo: {MODEL} | Entrada: {INPUT_FILE}")
    print("="*60 + "\n")
    
    resultados = procesar_antecedentes()
    
    if resultados:
        print("\n" + "="*60)
        print(f" Proceso completado. Registros procesados: {len(resultados)}")
        print(f" Archivo de salida generado: {OUTPUT_FILE}")
        print("="*60)
    else:
        print("\nError: No se generaron resultados válidos")

if __name__ == "__main__":
    main()