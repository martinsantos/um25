# -*- coding: utf-8 -*-
"""
Script para enriquecer antecedentes de proyectos utilizando Ollama (Gemma).
Versión 4: Incorpora mejoras en prompts, manejo de datos y clasificación de áreas.
"""

import json
import requests
import re
import unicodedata
import time
import logging
from tqdm import tqdm
from datetime import datetime
from typing import Dict, Any, List, Optional, Set

# --- Configuración de Logging ---
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - [%(funcName)s] %(message)s',
    handlers=[
        logging.FileHandler('procesamiento_v4.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)

# --- Configuración Script ---
MODEL = "gemma"  # Asegúrate de que este modelo esté disponible en tu Ollama
OLLAMA_URL = "http://localhost:11434/api/generate"
INPUT_FILE = "output.json" # Archivo JSON de entrada
OUTPUT_FILE = "antecedentes_STUDIOAI_gemma_v2.json" # Archivo JSON de salida
TEST_MODE = False  # Poner en False para procesar todo el archivo
MAX_TEST_RECORDS = 100 # Número de registros a procesar en modo TEST
REQUEST_TIMEOUT = 240 # Aumentado por si Gemma tarda más en tareas complejas
RETRY_DELAY = 10 # Tiempo de espera entre reintentos de API

# --- Áreas Definitivas para Clasificación ---
AREAS_DEFINITIVAS = [
    "Comunicaciones y Telecomunicaciones",
    "Redes Informáticas",
    "Redes de Cableado Estructurado",
    "Redes de Fibra Óptica",
    "Desarrollo de Software",
    "Desarrollo Personalizado",
    "Integración de Software Técnico",
    "Tecnologías de Información y Comunicación (TIC)",
    "Seguridad Informática",
    "Seguridad Digital",
    "Videovigilancia en Circuito Cerrado",
    "Monitoreo de Circuitos Cerrados",
    "Soporte Técnico",
    "Soporte TIC",
    "Servicios de Telecomunicaciones",
    "Electrónica y Comunicaciones",
    "Sistema de Distribución de Información (SDI)",
    "Sistema de Operación y Mantenimiento Integral",
    "Tecnología de Datos",
    "Corrientes Débiles"
]

# --- Prompts Optimizados v4 ---

PROMPT_TITULO_SEO = """
Eres un copywriter experto en SEO B2B para una empresa de tecnología e integración.
Tu tarea es crear un título atractivo y profesional (máximo 100 caracteres) para un caso de éxito, usando el formato EXACTO:

[Nombre Cliente] - [Servicio Principal Realizado] - [Detalle Clave o Tecnología]

Instrucciones:
1.  Usa el nombre del cliente tal como se proporciona.
2.  Identifica el servicio MÁS relevante o central del proyecto. Sé conciso.
3.  El detalle clave debe resaltar una tecnología específica, un lugar, o un beneficio importante.
4.  Usa lenguaje técnico apropiado pero comprensible.
5.  Prioriza términos buscables en Google por potenciales clientes B2B.
6.  Evita redundancias y palabras vacías.

Ejemplos Válidos:
"Aeropuertos Argentina 2000 - Red de Incendio Aeropuerto Mendoza - Cableado Estructurado y Proyecto"
"Hospital Central - Sistema de Información Hospitalaria - Integración con Red Existente"
"Bodega Rutini - Red WiFi Corporativa de Alta Densidad - Tecnología Cisco Meraki"
"Banco Galicia - Actualización Data Center Principal - Fibra Óptica Multimodo OM4"

Datos del Proyecto:
Cliente: {cliente}
Área Original: {area_original}
Servicios Detallados: {servicios}

Genera SOLAMENTE el título, sin explicaciones adicionales.

Título SEO:
"""

PROMPT_DESCRIPCION_NARRATIVA = """
Eres un redactor de marketing técnico B2B. Escribe una descripción concisa (entre 90 y 140 palabras) para un caso de éxito, con una estructura narrativa clara:

1.  **Cliente y Contexto:** Presenta brevemente al cliente y su sector o necesidad general. Usa el nombre exacto del cliente.
2.  **Desafío:** Describe el problema específico que enfrentaba el cliente o la necesidad concreta que motivó el proyecto. Si no está explícito, infiérelo del servicio realizado.
3.  **Solución:** Detalla el servicio principal proporcionado y menciona tecnologías clave utilizadas o aspectos relevantes de la implementación.
4.  **Resultado/Beneficio:** Menciona el impacto positivo del proyecto (mejora de eficiencia, seguridad, cumplimiento, etc.). Si hay datos de fecha o presupuesto, puedes integrarlos sutilmente para dar contexto temporal o de escala, pero no es obligatorio.

Instrucciones Adicionales:
- Mantén un tono profesional, técnico pero persuasivo.
- Evita jerga excesiva si no aporta valor.
- Sé factual y evita hipérboles no sustentadas.
- Si falta información específica para algún punto, básate en el contexto general del proyecto (cliente, área, servicio) para crear una narrativa coherente y plausible.
- NO inventes resultados cuantificados si no hay base para ello. Enfócate en beneficios cualitativos.

Datos del Proyecto:
Cliente: {cliente}
Área Original: {area_original}
Servicios Detallados: {servicios}
Presupuesto (Referencial): {monto}
Fecha (Referencial): {fecha}
Unidad de Negocio: {unidad_negocio}

Genera SOLAMENTE el párrafo de descripción, sin títulos ni introducciones.

Descripción del Caso de Éxito:
"""

PROMPT_SELECCIONAR_AREA = """
Eres un clasificador experto en servicios tecnológicos B2B. Tu tarea es seleccionar la categoría MÁS adecuada de la siguiente lista para el proyecto descrito. Analiza el área original y los servicios detallados para tomar la mejor decisión.

Lista de Áreas Definitivas:
{lista_areas}

Datos del Proyecto:
Área Original: {area_original}
Servicios Detallados: {servicios}

Instrucciones:
1. Lee cuidadosamente el Área Original y los Servicios Detallados.
2. Compara esa información con las opciones en la Lista de Áreas Definitivas.
3. Elige UNA SOLA categoría de la lista que mejor represente el núcleo del proyecto.
4. Si hay múltiples servicios, enfócate en el más relevante o el que engloba a los demás.
5. Responde únicamente con el nombre EXACTO de la categoría seleccionada de la lista. Sin explicaciones, sin formato adicional, solo el texto de la categoría.

Categoría Seleccionada:
"""

PROMPT_PALABRAS_CLAVE = """
Eres un especialista en SEO B2B para tecnología. Genera entre 5 y 8 palabras clave o frases clave relevantes para este caso de éxito.

Considera los siguientes aspectos para generar las palabras clave:
-   Servicio principal y tecnologías específicas mencionadas.
-   Tipo de cliente o sector industrial.
-   Problema solucionado o beneficio obtenido.
-   Área tecnológica general.
-   Ubicación geográfica si es relevante (aunque no se provee explícitamente, puedes inferirla si el cliente es muy local).

Instrucciones:
-   Usa términos técnicos precisos y relevantes para búsquedas B2B.
-   Incluye una mezcla de términos generales y específicos (long-tail).
-   Separa las palabras clave con comas.
-   Evita palabras clave demasiado genéricas si no aportan valor específico.

Datos del Proyecto:
Título SEO: {titulo}
Descripción: {descripcion}
Área Clasificada: {area_clasificada}
Cliente: {cliente}
Unidad de Negocio: {unidad_negocio}
Presupuesto (Referencial): {monto} # Úsalo para inferir escala si aplica

Genera SOLAMENTE la lista de palabras clave separadas por comas.

Palabras Clave:
"""

class AntecedenteEnriquecido:
    """Clase para procesar y enriquecer antecedentes usando Ollama."""

    def __init__(self):
        self.modelo = MODEL
        self.url_api = OLLAMA_URL
        self.timeout = REQUEST_TIMEOUT
        self.areas_definitivas_str = "\n".join([f"- {a}" for a in AREAS_DEFINITIVAS])

    def limpiar_texto(self, texto: Any) -> str:
        """Limpia y normaliza texto eliminando caracteres extraños y espacios."""
        if texto is None:
            return ""
        try:
            texto = str(texto)
            # Normalización Unicode para manejar tildes y caracteres especiales
            texto = unicodedata.normalize('NFKC', texto)
            # Eliminar caracteres de control excepto saltos de línea comunes
            texto = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', texto)
            # Reemplazar múltiples espacios/saltos de línea con un solo espacio
            texto = re.sub(r'\s+', ' ', texto).strip()
            # Eliminar comillas al inicio/final que a veces añade el LLM
            texto = re.sub(r'^["\'](.*)["\']$', r'\1', texto).strip()
            return texto
        except Exception as e:
            logging.warning(f"Error al limpiar texto '{texto}': {e}")
            return str(texto) # Devolver el texto original si falla la limpieza

    def llamar_api(self, prompt: str, temperature: float = 0.3) -> Optional[str]:
        """Llama a la API de Ollama con manejo de errores y reintentos."""
        payload = {
            "model": self.modelo,
            "prompt": prompt,
            "stream": False,
            "options": {"temperature": temperature} # Temperatura baja para respuestas más factuales
        }
        retries = 3
        for attempt in range(retries):
            try:
                response = requests.post(self.url_api, json=payload, timeout=self.timeout)
                response.raise_for_status() # Lanza excepción para errores HTTP 4xx/5xx
                
                data = response.json()
                respuesta_bruta = data.get("response", "")
                
                if not respuesta_bruta:
                     logging.warning(f"API devolvió respuesta vacía para el prompt. Intento {attempt + 1}/{retries}")
                     if attempt < retries -1:
                         time.sleep(RETRY_DELAY)
                         continue
                     else:
                         return None # Devolver None tras último intento fallido

                respuesta_limpia = self.limpiar_texto(respuesta_bruta)
                
                # Verificación adicional anti-alucinaciones comunes
                if "no puedo" in respuesta_limpia.lower() or \
                   "como modelo de lenguaje" in respuesta_limpia.lower() or \
                   respuesta_limpia.startswith("Respuesta:") or \
                   len(respuesta_limpia) < 5 : # Respuesta sospechosamente corta
                    logging.warning(f"Respuesta sospechosa de la API: '{respuesta_limpia}'. Prompt: {prompt[:100]}...")
                    # Podríamos intentar de nuevo o devolver None
                    if attempt < retries -1:
                         time.sleep(RETRY_DELAY)
                         continue
                    else:
                         return None

                return respuesta_limpia

            except requests.exceptions.RequestException as e:
                logging.error(f"Error de conexión/timeout llamando a la API (intento {attempt + 1}/{retries}): {e}")
            except json.JSONDecodeError as e:
                 logging.error(f"Error decodificando JSON de la API (intento {attempt + 1}/{retries}): {e}. Respuesta: {response.text[:200]}")
            except Exception as e:
                logging.error(f"Error inesperado en llamada API (intento {attempt + 1}/{retries}): {e}")

            if attempt < retries - 1:
                logging.info(f"Reintentando en {RETRY_DELAY} segundos...")
                time.sleep(RETRY_DELAY)
            else:
                logging.error(f"Fallaron todos los {retries} intentos para llamar a la API.")
                return None
        return None # En caso de que algo salga mal en el bucle

    def formatear_presupuesto(self, monto_input: Any) -> str:
        """Formatea el monto, manejando números, USD y ARS."""
        if monto_input is None or str(monto_input).strip() == "":
            return "No especificado"

        monto_str = self.limpiar_texto(str(monto_input)).upper()
        monto_str = monto_str.replace("PESOS", "ARS").replace("$", "ARS") # Normalizar a ARS
        
        # Buscar números (puede tener puntos o comas como separadores)
        numeros = re.findall(r'[\d.,]+', monto_str)
        
        valor_num = 0
        moneda = "ARS" # Default a ARS
        
        if numeros:
            try:
                # Intentar convertir el número más plausible
                # Asumir que el último número encontrado es el relevante si hay varios
                num_str = numeros[-1].replace('.', '').replace(',', '.') # Formato para float
                valor_num = float(num_str)
            except ValueError:
                logging.warning(f"No se pudo convertir el número del monto: {numeros}")
                # Si falla la conversión numérica, devolver el texto original limpio
                return self.limpiar_texto(str(monto_input))

        # Detectar moneda explícita
        if "USD" in monto_str or "DOLAR" in monto_str or "DÓLAR" in monto_str:
            moneda = "USD"
            # Si también menciona ARS, priorizamos ARS según la solicitud
            if "ARS" in monto_str:
                 moneda = "ARS"
                 logging.info(f"Monto detectado con USD y ARS, priorizando ARS: {monto_str}")
        elif "ARS" not in monto_str: 
            # Si no hay USD ni ARS explícito, pero hay número, asumimos ARS
            if valor_num > 0:
                 moneda = "ARS"
            else: # Si no hay número ni moneda clara, devolver original limpio
                 return self.limpiar_texto(str(monto_input))


        # Formatear salida
        if valor_num > 0:
            if moneda == "ARS":
                # Formato moneda argentina: $ 1.234,56
                return f"$ {valor_num:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.') + f" {moneda}"
            else: # USD u otra
                # Formato USD: USD 1,234.56
                return f"{moneda} {valor_num:,.2f}"
        else:
            # Si no pudimos extraer un número válido, devolvemos el texto original limpiado
            return self.limpiar_texto(str(monto_input))


    def generar_titulo(self, cliente: str, area_original: str, servicios: str) -> str:
        """Genera título SEO usando LLM y aplica formato."""
        prompt = PROMPT_TITULO_SEO.format(
            cliente=cliente,
            area_original=area_original,
            servicios=servicios[:500] # Limitar longitud para el prompt
        )
        titulo_llm = self.llamar_api(prompt, temperature=0.4)

        # Fallback y validación de formato
        if not titulo_llm:
            logging.warning(f"LLM no generó título para {cliente}. Usando fallback.")
            servicio_corto = area_original.split()[0] if area_original else "Servicios"
            titulo_fallback = f"{cliente} - {servicio_corto} - Solución Tecnológica Implementada"
            return titulo_fallback[:100] # Asegurar límite

        titulo_limpio = self.limpiar_texto(titulo_llm)

        # Forzar el formato si el LLM no lo respetó del todo
        if not titulo_limpio.startswith(cliente):
             # Intentar extraer partes si el LLM usó otro formato
             partes = titulo_limpio.split('-')
             if len(partes) > 1:
                 titulo_formateado = f"{cliente} - {partes[1].strip()}"
                 if len(partes) > 2:
                     titulo_formateado += f" - {'-'.join(partes[2:]).strip()}"
                 titulo_limpio = titulo_formateado
             else: # Si no se puede formatear, prefijar cliente
                 titulo_limpio = f"{cliente} - {titulo_limpio}"

        return titulo_limpio[:100] # Asegurar límite de caracteres final


    def generar_descripcion(self, cliente: str, area_original: str, servicios: str, monto: str, fecha: str, unidad_negocio: str) -> str:
        """Genera descripción narrativa usando LLM."""
        prompt = PROMPT_DESCRIPCION_NARRATIVA.format(
            cliente=cliente,
            area_original=area_original,
            servicios=servicios,
            monto=monto,
            fecha=fecha,
            unidad_negocio=unidad_negocio
        )
        descripcion = self.llamar_api(prompt, temperature=0.5)

        # Fallback simple si LLM falla
        if not descripcion:
            logging.warning(f"LLM no generó descripción para {cliente}. Usando fallback.")
            descripcion = (
                f"Para el cliente {cliente}, se realizó un proyecto clave en el área de {area_original}. "
                f"Los servicios incluyeron: {servicios[:150]}... "
                f"Este proyecto, gestionado por la unidad de negocio {unidad_negocio} y completado alrededor de {fecha}, "
                f"representó una importante mejora en sus operaciones."
            )
        
        # Asegurar que mencione al cliente (a veces el LLM lo omite)
        if cliente not in descripcion and cliente != "Cliente no especificado":
             descripcion = f"Para {cliente}, {descripcion[0].lower()}{descripcion[1:]}"

        return self.limpiar_texto(descripcion)


    def seleccionar_area_clasificada(self, area_original: str, servicios: str) -> str:
        """Selecciona el área más adecuada de la lista definida usando LLM."""
        if not area_original and not servicios:
             logging.warning("No hay 'area_original' ni 'servicios' para clasificar. Devolviendo 'Tecnologías de Información y Comunicación (TIC)'.")
             return "Tecnologías de Información y Comunicación (TIC)"

        prompt = PROMPT_SELECCIONAR_AREA.format(
            lista_areas=self.areas_definitivas_str,
            area_original=area_original,
            servicios=servicios[:500] # Limitar longitud
        )
        area_seleccionada = self.llamar_api(prompt, temperature=0.2) # Baja temperatura para clasificación precisa

        # Validación y Fallback
        if not area_seleccionada or area_seleccionada not in AREAS_DEFINITIVAS:
            logging.warning(f"LLM no clasificó área o devolvió inválida ('{area_seleccionada}'). Intentando fallback por palabras clave.")
            # Fallback simple: buscar la primera área de la lista en el texto original
            texto_busqueda = (area_original + " " + servicios).lower()
            for area_def in AREAS_DEFINITIVAS:
                if area_def.lower() in texto_busqueda:
                    logging.info(f"Fallback encontró área: {area_def}")
                    return area_def
            # Fallback final si no hay coincidencia
            logging.warning("Fallback por palabras clave falló. Asignando área genérica 'Tecnologías de Información y Comunicación (TIC)'.")
            return "Tecnologías de Información y Comunicación (TIC)"

        return area_seleccionada # Ya está limpia por llamar_api


    def generar_keywords(self, titulo: str, descripcion: str, area_clasificada: str, cliente: str, unidad_negocio: str, monto: str) -> str:
        """Genera palabras clave relevantes usando LLM."""
        prompt = PROMPT_PALABRAS_CLAVE.format(
            titulo=titulo,
            descripcion=descripcion[:500], # Limitar longitud
            area_clasificada=area_clasificada,
            cliente=cliente,
            unidad_negocio=unidad_negocio,
            monto=monto
        )
        keywords = self.llamar_api(prompt, temperature=0.6)

        # Fallback simple
        if not keywords:
             logging.warning(f"LLM no generó keywords para '{titulo}'. Usando fallback.")
             kw_set = set()
             # Extraer palabras clave básicas del título, área y cliente
             kw_set.update(re.findall(r'\b\w{4,}\b', titulo)) # Palabras de 4+ letras
             kw_set.update(re.findall(r'\b\w{4,}\b', area_clasificada))
             kw_set.add(cliente)
             kw_set.add(unidad_negocio)
             # Limitar a 7-8 keywords, priorizando las más largas
             keywords_list = sorted(list(kw_set), key=len, reverse=True)[:8]
             keywords = ", ".join(keywords_list)

        return self.limpiar_texto(keywords)


    def procesar_item(self, item_original: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Procesa un item individual del JSON, enriquece y devuelve el nuevo formato."""
        try:
            # --- 1. Extracción y Limpieza de Datos Originales ---
            # Ser flexible con los nombres de claves (mayús/minús, tildes)
            item = {k.lower().replace(' ', '_').replace('á', 'a').replace('é', 'e').replace('í', 'i').replace('ó', 'o').replace('ú', 'u'): v for k, v in item_original.items()}

            cliente = self.limpiar_texto(item.get('cliente') or item.get('client'))
            area_original = self.limpiar_texto(item.get('area') or item.get('área') or item.get('area_original'))
            servicios = self.limpiar_texto(item.get('servicios') or item.get('descripcion_del_servicio') or item.get('detalle'))
            
            # Fecha: Tomar la más probable y limpiarla, sin cambiar formato
            fecha_original = item.get('fecha_de_final') or item.get('fecha_finalizacion') or item.get('fecha')
            fecha = self.limpiar_texto(fecha_original) if fecha_original else "No especificada"

            # Presupuesto: Usar la nueva función de formateo
            monto_original = item.get('monto_contratado') or item.get('presupuesto') or item.get('monto')
            monto_formateado = self.formatear_presupuesto(monto_original)

            unidad_negocio = self.limpiar_texto(item.get('unidad_de_negocio_id') or item.get('unidad_de_negocio') or item.get('un'))
            
            # Obtener Imagen y Archivo originales (si existen)
            imagen_original = item.get('imagen') or item.get('adjunto_imagen')
            archivo_original = item.get('archivo') or item.get('adjunto_archivo')


            # --- Validación de Datos Mínimos ---
            if not cliente or cliente == "Cliente no especificado":
                logging.warning(f"Item omitido por falta de nombre de cliente. Datos: {item_original}")
                return None
            if not area_original and not servicios:
                 logging.warning(f"Item para cliente '{cliente}' tiene 'area' y 'servicios' vacíos. Difícil procesar.")
                 # Podríamos decidir omitirlo o intentar con datos mínimos
                 # Por ahora, intentaremos seguir

            logging.info(f"Procesando item para cliente: {cliente}")

            # --- 2. Enriquecimiento con LLM ---
            
            # 2.1. Seleccionar Área Clasificada
            logging.info("Clasificando área...")
            area_clasificada = self.seleccionar_area_clasificada(area_original, servicios)
            logging.info(f"Área clasificada como: {area_clasificada}")

            # 2.2. Generar Título SEO
            logging.info("Generando título...")
            titulo = self.generar_titulo(cliente, area_original or area_clasificada, servicios) # Usar area_original o clasificada como fallback
            logging.info(f"Título generado: {titulo}")
            
            # 2.3. Generar Descripción Narrativa
            logging.info("Generando descripción...")
            descripcion = self.generar_descripcion(cliente, area_original or area_clasificada, servicios, monto_formateado, fecha, unidad_negocio or "No especificada")
            logging.info(f"Descripción generada (primeras palabras): {descripcion[:80]}...")

            # 2.4. Generar Palabras Clave
            logging.info("Generando palabras clave...")
            keywords = self.generar_keywords(titulo, descripcion, area_clasificada, cliente, unidad_negocio or "No especificada", monto_formateado)
            logging.info(f"Keywords generadas: {keywords}")

            # --- 3. Construcción del Resultado Final ---
            resultado_enriquecido = {
                "status": "published", # Requerimiento 1
                "Titulo": titulo, # Requerimiento 2
                "Descripcion": descripcion, # Requerimiento 3
                "Imagen": imagen_original, # Requerimiento 4 (conserva original)
                "Archivo": archivo_original, # Requerimiento 5 (conserva original)
                "Fecha": fecha, # Requerimiento 6 (conserva original)
                "Cliente": cliente, # Requerimiento 7 (conserva original)
                "Unidad_de_negocio": unidad_negocio or "No especificada", # Requerimiento 8 (conserva original)
                "Presupuesto": monto_formateado, # Requerimiento 9 (formateado)
                "Area": area_clasificada, # Requerimiento 10 (clasificada)
                "Palabras_clave": keywords # Requerimiento 11 (enriquecidas)
            }

            logging.info(f"Item procesado con éxito para cliente: {cliente}")
            return resultado_enriquecido

        except Exception as e:
            logging.exception(f"Error GRANDE procesando item: {item_original}. Error: {e}", exc_info=True)
            return None # Omitir este item si hay un error grave

# --- Función Principal ---
def main():
    """Función principal para cargar datos, procesar y guardar."""
    print("\n" + "="*70)
    print(" SCRIPT DE ENRIQUECIMIENTO DE ANTECEDENTES CON GEMMA (v4)")
    print("="*70 + "\n")

    # --- Carga de Datos ---
    try:
        with open(INPUT_FILE, 'r', encoding='utf-8') as f:
            datos_originales = json.load(f)
        logging.info(f"Archivo '{INPUT_FILE}' cargado con {len(datos_originales)} registros.")
    except FileNotFoundError:
        logging.error(f"Error Crítico: No se encontró el archivo de entrada '{INPUT_FILE}'. Abortando.")
        return
    except json.JSONDecodeError as e:
        logging.error(f"Error Crítico: El archivo '{INPUT_FILE}' no es un JSON válido. Error: {e}. Abortando.")
        return
    except Exception as e:
        logging.error(f"Error Crítico al cargar '{INPUT_FILE}': {e}. Abortando.")
        return

    if not isinstance(datos_originales, list) or not datos_originales:
        logging.error(f"Error Crítico: El archivo '{INPUT_FILE}' no contiene una lista de registros válida o está vacío. Abortando.")
        return

    # --- Procesamiento ---
    processor = AntecedenteEnriquecido()
    resultados_finales = []
    items_fallidos = 0
    items_omitidos = 0

    items_a_procesar = datos_originales[:MAX_TEST_RECORDS] if TEST_MODE else datos_originales
    
    if TEST_MODE:
         logging.warning(f"MODO TEST ACTIVADO: Se procesarán solo los primeros {MAX_TEST_RECORDS} registros.")

    print(f"Iniciando procesamiento de {len(items_a_procesar)} registros...")
    start_time = time.time()

    for item in tqdm(items_a_procesar, desc="Procesando Antecedentes"):
        resultado = processor.procesar_item(item)
        if resultado:
            resultados_finales.append(resultado)
        else:
            # Contamos como fallido si procesar_item devuelve None activamente
            # (puede ser por falta de cliente o error grave)
            items_fallidos += 1
            logging.warning(f"Item omitido o fallido durante el procesamiento.")
        
        # Pequeña pausa opcional para no sobrecargar Ollama, especialmente útil si no es GPU
        # time.sleep(0.1) 

    end_time = time.time()
    processing_time = end_time - start_time
    print(f"\nProcesamiento completado en {processing_time:.2f} segundos.")

    # --- Guardado de Resultados ---
    if resultados_finales:
        try:
            with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
                json.dump(resultados_finales, f, indent=4, ensure_ascii=False) # Indent=4 para mejor legibilidad
            
            print(f"\n✅ ¡Éxito! Resultados guardados en '{OUTPUT_FILE}'")
            print(f"   - Registros procesados exitosamente: {len(resultados_finales)}")
            print(f"   - Registros omitidos o con errores: {items_fallidos}")
            total_procesados_intento = len(items_a_procesar)
            print(f"   - Total de registros intentados: {total_procesados_intento}")

            # Mostrar ejemplo del primer resultado
            if resultados_finales:
                 print("\n🔍 Ejemplo del primer resultado:")
                 print("-" * 40)
                 print(json.dumps(resultados_finales[0], indent=2, ensure_ascii=False))
                 print("-" * 40)

        except Exception as e:
            logging.error(f"Error Crítico al guardar los resultados en '{OUTPUT_FILE}': {e}")
            print(f"\n❌ Error al guardar el archivo de resultados '{OUTPUT_FILE}'. Revisa el log.")

    else:
        print("\n❌ No se generaron resultados válidos.")
        print(f"   - Total de registros intentados: {len(items_a_procesar)}")
        print(f"   - Registros omitidos o con errores: {items_fallidos}")
        print("   - Revisa el archivo de log ('procesamiento_v4.log') para más detalles.")
        if datos_originales:
             print("\n   Asegúrate de que los items en el JSON de entrada tengan al menos el campo 'Cliente'.")
             print(f"   Campos encontrados en el primer item original: {list(datos_originales[0].keys())}")


if __name__ == "__main__":
    main()