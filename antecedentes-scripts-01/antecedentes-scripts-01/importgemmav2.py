# -*- coding: utf-8 -*-
import json
import requests
import re
import unicodedata
import time
from tqdm import tqdm
from datetime import datetime
from typing import Dict, Any, List, Optional, Set
import logging

# --- Configuración de Logging ---
# Configura el logging para ver detalles, especialmente errores
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- Configuración Script ---
MODEL = "gemma"
OLLAMA_URL = "http://localhost:11434/api/generate"
# ¡¡¡ ASEGÚRATE QUE ESTE ES EL ARCHIVO CON DATOS ORIGINALES Y LIMPIOS !!!
INPUT_FILE = "output.json" # <-- PON AQUÍ EL NOMBRE DE TU ARCHIVO BUENO
OUTPUT_FILE = "antecedentes_gemma_v6.json" # Nuevo nombre de salida
TEST_MODE = True # ¡¡¡ MUY RECOMENDADO MANTENER EN True PARA PRUEBAS !!!
MAX_TEST_RECORDS = 30
REQUEST_TIMEOUT = 180
RETRY_DELAY = 5

# --- Áreas Predefinidas (Sin cambios) ---
AREAS_PREDEFINIDAS = [
    "Comunicaciones y Telecomunicaciones", "Redes Informáticas", "Redes de Cableado Estructurado",
    "Redes de Fibra Óptica", "Desarrollo de Software", "Desarrollo Personalizado",
    "Integración de Software Técnico", "Tecnologías de Información y Comunicación (TIC)",
    "Seguridad Informática", "Seguridad Digital", "Videovigilancia en Circuito Cerrado",
    "Monitoreo de Circuitos Cerrados", "Soporte Técnico", "Soporte TIC",
    "Servicios de Telecomunicaciones", "Electrónica y Comunicaciones",
    "Sistema de Distribución de Información (SDI)", "Sistema de Operación y Mantenimiento Integral",
    "Tecnología de Datos", "Corrientes Débiles"
]

# --- Prompts Optimizados v4 (Pequeños ajustes para claridad) ---

PROMPT_TRADUCCION = """Traduce el siguiente texto del inglés al español de forma profesional y natural. Si es un nombre propio, marca, o ya está en español, devuélvelo sin cambios. Evita añadir comentarios o explicaciones.
Texto: "{texto}"

Traducción Directa:""" # Instrucción más directa

# PROMPT_TITULO_SEO V4 - Aún más directivo
PROMPT_TITULO_SEO = """Eres un copywriter experto en SEO B2B para tecnología. Crea un título **atractivo, claro y orientado a resultados** (50-70 caracteres) para un caso de éxito.

**Objetivo Principal:** Generar interés y destacar el valor entregado al cliente.

**Formato Ideal:** [Verbo de Acción Concreto / Solución Específica] + [Beneficio Principal / Resultado Cuantificable] + para [Sector / Cliente Relevante]

**Reglas ESTRICTAS:**
1.  **Claridad y Concisión:** Describe el servicio o solución principal sin ambigüedades.
2.  **Enfoque en el Logro:** Usa verbos fuertes y resalta el beneficio más impactante.
3.  **Profesional y Persuasivo:** Tono B2B, pero que invite a saber más.
4.  **Unicidad de Primera Palabra:** La PRIMERA palabra debe ser DIFERENTE a la de los otros títulos generados en esta ejecución.
5.  **Lista Negra (Primera Palabra):** NO USAR: Implementación, Optimización, Despliegue, Mejora, Solución, Sistema, Eficiencia, Coordinación, Normalización, Cableado, Acceso, Reducción, De, Un, Una, El, La, Los, Las, Para, Con, Basado, Aquí, Respuesta, Genera, Valor, Después, Como.
6.  **Sin Contaminación:** El título final NO debe contener explicaciones, metadatos, ni frases como "Aquí tienes...".
7.  **Palabras Clave Naturales:** Integra términos técnicos relevantes sin forzar.

**Contexto:**
Área Técnica: {area}
Cliente: {cliente}
Descripción: {descripcion}

**Ejemplos EXCELENTES:**
"Agilizando Operaciones: Implementando Red de Fibra Óptica para Logística Moderna"
"Seguridad Reforzada: Modernizando Sistemas CCTV con IA para Centros Comerciales"
"Desarrollo Estratégico: Creando Plataforma Web a Medida para Sector Financiero"
"Soporte Integral 24/7: Asegurando Continuidad Operativa para Industria Pesada"

Genera **ÚNICAMENTE** el título final limpio:"""

PROMPT_DESCRIPCION_UNIFICADA = """Eres un redactor técnico B2B. Sintetiza la siguiente información en un párrafo único, profesional y conciso (30-100 palabras) para un caso de éxito. Debe incluir el desafío del cliente, la solución técnica implementada (y tecnologías clave si se mencionan) y el resultado o beneficio principal (idealmente cuantificable). Evita repetir frases del título. No añadas comentarios.

Contexto:
Título Generado: {titulo}
Área Técnica: {area}
Cliente: {cliente}
Descripción Breve Original: {desc_breve}
Descripción Ampliada Original: {desc_ampliada}

Párrafo Sintetizado:""" # Instrucción más directa

PROMPT_CLASIFICAR_AREA = """Clasifica el siguiente proyecto tecnológico estrictamente en UNA de las áreas predefinidas listadas abajo. Elige la que mejor represente el núcleo técnico del trabajo. Responde SOLO con el nombre exacto del área.

Proyecto:
Título: {titulo}
Descripción: {descripcion}
Área Sugerida Originalmente: {area_original}

Áreas Válidas (elige UNA):
{lista_areas}

Área Clasificada:""" # Instrucción más directa

PROMPT_PALABRAS_CLAVE = """Extrae 5-7 palabras clave (keywords) o frases cortas en español, relevantes para SEO B2B, basadas en este caso de éxito. Enfócate en servicios, tecnologías y sector. Sepáralas por comas. Responde únicamente con las keywords separadas por comas.

Caso de Éxito:
Título: {titulo}
Descripción: {descripcion}
Área: {area}

Palabras Clave:""" # Instrucción más directa


class AntecedenteProcessor:
    def __init__(self):
        self.modelo = MODEL
        self.url_api = OLLAMA_URL
        self.timeout = REQUEST_TIMEOUT
        self.primeras_palabras_titulos_usadas: Set[str] = set()
        self.palabras_prohibidas_inicio = {
            "implementación", "optimización", "despliegue", "mejora", "solución", "sistema",
            "eficiencia", "coordinación", "normalización", "cableado", "acceso", "reducción",
            "de", "un", "una", "el", "la", "los", "las", "para", "con", "basado", "aquí",
            "respuesta", "genera", "valor", "después", "como", "en", "resultado", "cliente",
            "descripción", "área", "presupuesto", "unidad", "fecha", "titulo", "keywords",
             "traducción", "clasificación" # Añadir palabras comunes de prompts/metadatos
        }

    def limpiar_respuesta_avanzada(self, texto: str, prompt_type: str = "general") -> str:
        """Limpieza MUY Agresiva para eliminar contaminación de Gemma."""
        if not texto: return ""
        
        texto_limpio = texto.strip()

        # 1. Eliminar bloques <<SYS>> completos (si aparecen)
        texto_limpio = re.sub(r'<<SYS>>.*?<<SYS>>', '', texto_limpio, flags=re.DOTALL)
        texto_limpio = re.sub(r'<<SYS>>.*', '', texto_limpio, flags=re.DOTALL) # Si no tiene cierre

        # 2. Eliminar frases introductorias/conclusivas comunes y metadatos
        patrones_eliminar = [
            r"^(aquí\s*tienes|aquí\s*está|el\s*resultado\s*es|la\s*respuesta\s*es|el\s*valor\s*es|la\s*traducción\s*es|el\s*área\s*es|las\s*keywords\s*son|el\s*título\s*es)[:\s]*",
            r"^(basado\s*en|según\s*el\s*contexto|en\s*las\s*directrices|después\s*de\s*analizar)[:\s]*",
            r"^(traducción\s*directa|párrafo\s*sintetizado|área\s*clasificada|palabras\s*clave|título\s*final\s*limpio)[:\s]*",
            r"^(cliente|unidad_de_negocio|presupuesto|area)[:\s]*", # Campos literales
            r"^\W+", # Caracteres no alfanuméricos al inicio (puntuación, etc.)
            r"^\*+\s*", # Asteriscos al inicio
            r"\*+$", # Asteriscos al final
            r"Nota:.*", # Notas explicativas
            r"Ejemplo:.*",
            r"\[.*?\]", # Contenido entre corchetes (a menudo explicaciones)
            r"\(.*?\)$" # Paréntesis al final (a menudo explicaciones)
        ]
        for patron in patrones_eliminar:
            texto_limpio = re.sub(patron, '', texto_limpio, flags=re.IGNORECASE | re.MULTILINE).strip()

        # 3. Eliminar emojis comunes
        try:
            # Amplio rango Unicode para emojis comunes
            emoji_pattern = re.compile(
                "["
                "\U0001F600-\U0001F64F"  # Emoticons
                "\U0001F300-\U0001F5FF"  # Symbols & Pictographs
                "\U0001F680-\U0001F6FF"  # Transport & Map Symbols
                "\U0001F700-\U0001F77F"  # Alchemical Symbols
                "\U0001F780-\U0001F7FF"  # Geometric Shapes Extended
                "\U0001F800-\U0001F8FF"  # Supplemental Arrows-C
                "\U0001F900-\U0001F9FF"  # Supplemental Symbols and Pictographs
                "\U0001FA70-\U0001FAFF"  # Symbols and Pictographs Extended-A
                "\U00002702-\U000027B0"  # Dingbats
                "\U000024C2-\U0001F251" 
                "\U0001F1E6-\U0001F1FF"  # Regional indicator symbols
                "\U00002600-\U000026FF"  # Miscellaneous Symbols
                "\U00002B50" # Star
                "\U00002300-\U000023FF" # Miscellaneous Technical
                "\U000025A0-\U000025FF" # Geometric Shapes
                "\U00002190-\U000021FF" # Arrows
                "\U0000FE0F" # Variation selector
                "\U0000200D" # Zero width joiner
                 "🔧" # Emoji específico visto
                 "😄"
                 "😊"
                "]+", flags=re.UNICODE)
            texto_limpio = emoji_pattern.sub('', texto_limpio).strip()
        except re.error:
             logging.warning("Error compilando regex de emojis, limpieza de emojis limitada.")


        # 4. Eliminar comillas si rodean *toda* la respuesta restante
        if texto_limpio.startswith('"') and texto_limpio.endswith('"') and texto_limpio.count('"') == 2:
            texto_limpio = texto_limpio[1:-1]
        if texto_limpio.startswith("'") and texto_limpio.endswith("'") and texto_limpio.count("'") == 2:
             texto_limpio = texto_limpio[1:-1]
             
        # 5. Normalización final de espacios y unicode
        texto_limpio = unicodedata.normalize('NFKC', texto_limpio)
        texto_limpio = ' '.join(texto_limpio.split()) # Asegura espacios simples

        # 6. Última verificación: ¿La respuesta parece razonable para el tipo de prompt?
        if prompt_type == "titulo" and (len(texto_limpio.split()) > 15 or len(texto_limpio.split()) < 3):
            logging.warning(f"Limpieza avanzada: Título sospechoso '{texto_limpio}'. Se descarta.")
            return "" # Descartar si parece una frase larga o muy corta para ser título
        if prompt_type == "keywords" and (' ' not in texto_limpio and len(texto_limpio)>50): # Si no hay espacios y es largo, probablemente sea basura
             logging.warning(f"Limpieza avanzada: Keywords sospechosas '{texto_limpio}'. Se descartan.")
             return ""

        return texto_limpio

    def _llamar_api_gemma(self, prompt: str, temperature: float = 0.4, max_retries: int = 3, prompt_type:str="general") -> Optional[str]:
        """Llama a la API y aplica limpieza AVANZADA."""
        payload = {
            "model": self.modelo,
            "prompt": prompt,
            "stream": False,
            "options": { "temperature": temperature, "num_ctx": 4096,
                         "stop": ["\n\n", "```", "---", "<<SYS>>", "Usuario:", "Ejemplo:", "Nota:"] }
        }
        last_error = None
        for attempt in range(max_retries):
            try:
                response = requests.post(self.url_api, json=payload, timeout=self.timeout)
                response.raise_for_status()
                respuesta_json = response.json()
                respuesta_texto = respuesta_json.get("response", "")

                # >>> Aplicar limpieza AVANZADA aquí <<<
                respuesta_limpia = self.limpiar_respuesta_avanzada(respuesta_texto, prompt_type)

                if respuesta_limpia:
                    # logging.debug(f"[API RAW]: {respuesta_texto[:150]}...")
                    # logging.debug(f"[API CLEANED]: {respuesta_limpia[:150]}...")
                    return respuesta_limpia
                else:
                    logging.warning(f"Respuesta vacía o descartada tras limpieza avanzada (Intento {attempt + 1}). Prompt type: {prompt_type}")
                    last_error = "Respuesta vacía o descartada tras limpieza avanzada."
                    # Reintentar una vez más si la respuesta es vacía, podría ser un fallo temporal
                    if attempt < max_retries - 1:
                        time.sleep(RETRY_DELAY / 2) # Espera corta antes de reintentar
                        continue
                    else:
                        return None # Falló después de reintentos

            except requests.exceptions.Timeout:
                last_error = f"Timeout (Intento {attempt + 1}/{max_retries})"
                logging.error(last_error)
            except requests.exceptions.RequestException as e:
                 last_error = f"Error API (Intento {attempt + 1}/{max_retries}): {e}"
                 logging.error(last_error)
            except Exception as e:
                 last_error = f"Error inesperado procesando respuesta API: {e}"
                 logging.error(last_error)
                 return None # No reintentar en errores inesperados

            if attempt < max_retries - 1:
                logging.info(f"Reintentando API en {RETRY_DELAY} segundos...")
                time.sleep(RETRY_DELAY)
            else:
                logging.error(f"API call falló tras {max_retries} intentos. Último error: {last_error}")
                return None
        return None

    # Las funciones traducir_texto, generar_titulo_optimizado, etc., ahora usarán la
    # limpieza avanzada automáticamente a través de _llamar_api_gemma.
    # Añadimos el parámetro 'prompt_type' a la llamada.

    def traducir_texto(self, texto: Any) -> str:
        """Traduce texto a español usando Gemma, si es necesario."""
        if not isinstance(texto, str) or not texto.strip():
            return str(texto) # No limpiar si no es string o está vacío

        # Heurística simple (puede requerir ajuste)
        if not re.search(r'[a-zA-Z]', texto): return texto # Si no hay letras, no traducir
        # Podríamos añadir una heurística más compleja si es necesario

        prompt = PROMPT_TRADUCCION.format(texto=texto)
        traduccion = self._llamar_api_gemma(prompt, temperature=0.1, prompt_type="traduccion")

        return traduccion if traduccion else texto # Devolver original si falla traducción/limpieza

    def generar_titulo_optimizado(self, item: Dict[str, Any]) -> str:
        """Genera un título SEO único, atractivo y limpio."""
        original_title_traducido = self.traducir_texto(item.get('Título', ''))
        max_intentos = 6

        for i in range(max_intentos):
            logging.info(f"Intento {i+1}/{max_intentos} para generar título...")
            prompt = PROMPT_TITULO_SEO.format(
                area=self.traducir_texto(item.get('Área', 'Tecnología')),
                cliente=self.limpiar_cliente(item.get('Cliente', 'Empresa')),
                descripcion=f"{self.traducir_texto(item.get('Descripción', ''))} {self.traducir_texto(item.get('Descripción_Ampliada', ''))}".strip() # Combinar descripciones para contexto
            )

            # Llamada con tipo de prompt para limpieza específica si fuera necesario
            titulo_generado = self._llamar_api_gemma(prompt, temperature=0.65, prompt_type="titulo")

            if not titulo_generado:
                logging.warning(f"Intento {i+1} de título fallido (sin respuesta válida de Gemma).")
                continue

            # Validación rigurosa (la limpieza avanzada ya se aplicó)
            palabras = titulo_generado.split()
            if not palabras:
                logging.warning(f"Intento {i+1} de título fallido (vacío tras split).")
                continue

            primera_palabra = palabras[0].lower()

            if primera_palabra in self.palabras_prohibidas_inicio:
                logging.warning(f"Intento {i+1}: Título '{titulo_generado}' RECHAZADO (primera palabra '{primera_palabra}' prohibida).")
                continue

            if primera_palabra in self.primeras_palabras_titulos_usadas:
                logging.warning(f"Intento {i+1}: Título '{titulo_generado}' RECHAZADO (primera palabra '{primera_palabra}' ya usada).")
                continue

            # ¡Éxito!
            self.primeras_palabras_titulos_usadas.add(primera_palabra)
            logging.info(f"Título generado OK: '{titulo_generado}'")
            return titulo_generado

        # --- Fallback si todos los intentos fallan ---
        logging.error(f"FALLBACK TÍTULO: No se pudo generar título válido tras {max_intentos} intentos.")
        fallback_title = self.traducir_texto(item.get('Descripción', 'Proyecto Tecnológico Destacado')) # Usar descripción como fallback
        fallback_words = fallback_title.split()
        if fallback_words:
             primera_fallback = fallback_words[0].lower()
             # Si la primera palabra es mala o repetida, quitarla si es posible
             if primera_fallback in self.palabras_prohibidas_inicio or primera_fallback in self.primeras_palabras_titulos_usadas:
                 if len(fallback_words) > 1: fallback_title = ' '.join(fallback_words[1:])
                 else: fallback_title = "Caso de Éxito Relevante" # Último recurso
             else:
                  self.primeras_palabras_titulos_usadas.add(primera_fallback) # Añadirla si es válida
        else:
             fallback_title = "Proyecto Clave Realizado"

        logging.info(f"Usando título de fallback: '{fallback_title}'")
        return fallback_title.strip()[:150] # Limitar longitud del fallback


    def crear_descripcion_unificada(self, item: Dict[str, Any], titulo_generado: str) -> str:
        """Combina descripciones asegurando longitud mínima y limpieza."""
        desc_breve = self.traducir_texto(item.get('Descripción', ''))
        desc_ampliada = self.traducir_texto(item.get('Descripción_Ampliada', ''))
        cliente_limpio = self.limpiar_cliente(item.get('Cliente'))
        area_traducida = self.traducir_texto(item.get('Área', ''))

        prompt = PROMPT_DESCRIPCION_UNIFICADA.format(
            titulo=titulo_generado,
            area=area_traducida,
            cliente=cliente_limpio,
            desc_breve=desc_breve,
            desc_ampliada=desc_ampliada
        )

        descripcion_unificada = self._llamar_api_gemma(prompt, temperature=0.5, prompt_type="descripcion")

        # Validación simple de longitud
        if descripcion_unificada and len(descripcion_unificada.split()) >= 20:
             logging.info("Descripción unificada generada OK.")
             return descripcion_unificada
        else:
            logging.warning("Descripción generada por Gemma muy corta o fallida. Combinando originales.")
            # Fallback: combinar textos originales ya traducidos/limpios
            combinada = f"{desc_breve} {desc_ampliada}".strip()
            # Si la combinación sigue siendo corta, usar una genérica
            if len(combinada.split()) < 15:
                 logging.warning("Fallback: Generando descripción básica.")
                 return f"Proyecto de {area_traducida or 'tecnología'} para {cliente_limpio or 'cliente'}. Se implementaron soluciones para {desc_breve or 'mejorar sus operaciones'}."[:250] # Limitar longitud
            else:
                 logging.info("Fallback: Usando combinación de descripciones originales.")
                 return ' '.join(combinada.split())[:400] # Limitar longitud

    def normalizar_fecha(self, fecha_str: Any, item_id: Any = "N/A") -> str:
        """Normaliza fechas a DD-MM-YYYY, preserva original si falla."""
        default_fecha = "Fecha No Especificada"
        if fecha_str is None or str(fecha_str).strip() == '':
            logging.warning(f"Item {item_id}: Input de fecha vacío -> {default_fecha}")
            return default_fecha

        fecha_original_str = str(fecha_str).strip()
        logging.debug(f"Item {item_id}: Normalizando fecha - Input Original: '{fecha_original_str}'")

        # Formatos comunes a intentar
        formatos_entrada = [
            '%Y-%m-%d', '%Y/%m/%d', '%d-%m-%Y', '%d/%m/%Y', '%m-%d-%Y', '%m/%d/%Y',
            '%Y-%m-%dT%H:%M:%S.%fZ', '%Y-%m-%d %H:%M:%S',
             # Añadir formatos con nombre de mes si es necesario (requiere más lógica)
            # '%d %b %Y', '%d %B %Y', '%b %d, %Y', '%B %d, %Y'
        ]

        for fmt in formatos_entrada:
            try:
                fecha_parte = fecha_original_str.split('T')[0].split(' ')[0]
                fecha_dt = datetime.strptime(fecha_parte, fmt)
                fecha_formateada = fecha_dt.strftime('%d-%m-%Y')
                logging.debug(f"Item {item_id}: Parseado OK con formato '{fmt}' -> {fecha_formateada}")
                return fecha_formateada
            except ValueError:
                continue
            except Exception as e:
                logging.debug(f"Item {item_id}: Error parseando con {fmt}: {e}")
                continue

        # Si NINGÚN formato funcionó:
        logging.warning(f"Item {item_id}: No se pudo parsear la fecha '{fecha_original_str}' a DD-MM-YYYY. Se conservará el valor original limpio.")
        # Devolver el string original limpio
        return ' '.join(fecha_original_str.split()) # Limpieza básica de espacios

    def normalizar_presupuesto(self, monto: Any, item_id: Any = "N/A") -> str:
        """Normaliza y formatea el monto del presupuesto a XXX.XXX,XX USD."""
        default_presupuesto = "0,00 USD"
        if monto is None or str(monto).strip() == '':
            logging.debug(f"Item {item_id}: Monto vacío -> {default_presupuesto}")
            return default_presupuesto

        monto_str_original = str(monto)
        logging.debug(f"Item {item_id}: Normalizando presupuesto - Input Original: '{monto_str_original}'")
        monto_str = re.sub(r'[^\d,.-]', '', monto_str_original).strip()
        monto_str = monto_str.replace(',', '.') # Coma decimal a punto

        try:
            if monto_str.count('.') > 1:
                 parts = monto_str.split('.')
                 monto_str = "".join(parts[:-1]) + "." + parts[-1]

            monto_float = float(monto_str)
            formateado = "{:,.2f}".format(monto_float).replace(",", "X").replace(".", ",").replace("X", ".") + " USD"
            logging.debug(f"Item {item_id}: Presupuesto normalizado OK -> {formateado}")
            return formateado
        except (ValueError, TypeError) as e:
            logging.warning(f"Item {item_id}: No se pudo convertir el monto '{monto_str_original}' a número. Error: {e}. Usando default.")
            return default_presupuesto

    def limpiar_cliente(self, cliente_str: Any) -> str:
        """Limpia el nombre del cliente."""
        if not isinstance(cliente_str, str): cliente_str = str(cliente_str)
        cliente_limpio = cliente_str.strip()
        terminos_a_eliminar = [
            r"Client$", r"Cliente$", r"Customer$", r"- Case Study$", r" Case Study$",
            r"^Client\s", r"^Cliente\s", r"^Customer\s"
        ]
        for patron in terminos_a_eliminar:
            cliente_limpio = re.sub(patron, '', cliente_limpio, flags=re.IGNORECASE).strip()
        cliente_limpio = re.sub(r'^[\s_-]+|[\s_-]+$', '', cliente_limpio)
        # Eliminar cualquier resto de <<SYS>> o similar que pudiera quedar
        cliente_limpio = re.sub(r'<<SYS>>.*', '', cliente_limpio).strip()
        cliente_limpio = self.limpiar_respuesta_avanzada(cliente_limpio, "general") # Aplicar limpieza fuerte
        
        return cliente_limpio if cliente_limpio else "Cliente Confidencial"

    def clasificar_area(self, item: Dict[str, Any], titulo: str, descripcion: str) -> str:
        """Clasifica el proyecto en una de las áreas predefinidas."""
        area_original = self.traducir_texto(item.get('Área', ''))
        lista_areas_formateada = "\n".join([f"- {area}" for area in AREAS_PREDEFINIDAS])

        prompt = PROMPT_CLASIFICAR_AREA.format(
            titulo=titulo, descripcion=descripcion, area_original=area_original, lista_areas=lista_areas_formateada
        )

        area_clasificada = self._llamar_api_gemma(prompt, temperature=0.2, prompt_type="clasificacion")

        if area_clasificada and area_clasificada in AREAS_PREDEFINIDAS:
            logging.info(f"Área clasificada OK: '{area_clasificada}'")
            return area_clasificada
        else:
            logging.warning(f"Área clasificada por Gemma ('{area_clasificada}') no válida o falló. Intentando fallback.")
            # Fallbacks (igual que antes)
            if area_clasificada: # Intentar match insensible si Gemma devolvió algo
                 for area_pred in AREAS_PREDEFINIDAS:
                     if area_clasificada.lower() == area_pred.lower():
                         logging.info(f"Fallback 1: Match insensible a mayúsculas: '{area_pred}'")
                         return area_pred
            if area_original: # Usar original si existe
                for area_pred in AREAS_PREDEFINIDAS:
                    if area_original.lower() in area_pred.lower() or area_pred.lower() in area_original.lower():
                        logging.info(f"Fallback 2: Coincidencia parcial con original: '{area_pred}'")
                        return area_pred
            default_area = "Tecnologías de Información y Comunicación (TIC)"
            logging.warning(f"Fallback 3: Usando área por defecto '{default_area}'")
            return default_area

    def generar_palabras_clave(self, titulo: str, descripcion: str, area: str) -> List[str]:
        """Genera palabras clave relevantes y limpias."""
        prompt = PROMPT_PALABRAS_CLAVE.format(titulo=titulo, descripcion=descripcion, area=area)
        keywords_str = self._llamar_api_gemma(prompt, temperature=0.5, prompt_type="keywords")
        keywords_limpias = []

        if keywords_str:
            keywords_raw = keywords_str.split(',')
            for kw in keywords_raw:
                # Aplicar limpieza avanzada a cada keyword individualmente
                kw_limpia = self.limpiar_respuesta_avanzada(kw, "general")
                if kw_limpia and len(kw_limpia) > 2:
                    keywords_limpias.append(kw_limpia)

        if keywords_limpias:
             logging.info(f"Palabras clave generadas OK ({len(keywords_limpias)}): {', '.join(keywords_limpias)}")
             return keywords_limpias[:7] # Limitar a 7 máximo
        else:
            logging.warning("No se pudieron generar palabras clave válidas. Usando fallback.")
            # Fallback simple (palabras de título y área)
            kws = set(re.findall(r'\b[A-Z][a-z]{2,}\b', titulo)) # Palabras capitalizadas
            kws.update(area.split())
            kws_list = [kw for kw in list(kws) if len(kw)>3]
            logging.info(f"Fallback Keywords: {kws_list[:5]}")
            return kws_list[:5]

    def procesar_item(self, item: Dict[str, Any], item_index: int) -> Optional[Dict[str, Any]]:
        """Procesa un único antecedente completo con limpieza agresiva."""
        item_id_log = f"Index {item_index} / Cliente Orig: {item.get('Cliente', 'N/A')[:30]}"
        logging.info(f"--- Iniciando Procesamiento Item {item_id_log} ---")
        try:
            # 1. Limpieza PREVIA de campos críticos del input (por si acaso)
            # Esto es una medida defensiva contra input corrupto.
            cliente_orig_limpio = self.limpiar_cliente(item.get('Cliente'))
            titulo_orig_limpio = self.limpiar_respuesta_avanzada(self.traducir_texto(item.get('Título','')))
            desc_orig_limpia = self.limpiar_respuesta_avanzada(self.traducir_texto(item.get('Descripción','')))
            desc_amp_orig_limpia = self.limpiar_respuesta_avanzada(self.traducir_texto(item.get('Descripción_Ampliada','')))
            area_orig_limpia = self.limpiar_respuesta_avanzada(self.traducir_texto(item.get('Área','')))
            unidad_neg_orig_limpia = self.limpiar_respuesta_avanzada(self.traducir_texto(item.get('Unidad_de_negocio','')))

            # Crear un 'item limpio' temporal para pasar a las funciones generadoras
            item_limpio_temp = {
                'Cliente': cliente_orig_limpio,
                'Título': titulo_orig_limpio,
                'Descripción': desc_orig_limpia,
                'Descripción_Ampliada': desc_amp_orig_limpia,
                'Área': area_orig_limpia,
                'Unidad_de_negocio': unidad_neg_orig_limpia,
                'Fecha': item.get('Fecha'), # La fecha se normaliza después
                'Monto_contratado': item.get('Monto_contratado') # El monto se normaliza después
            }

            # 2. Generar Título (usa item_limpio_temp)
            titulo = self.generar_titulo_optimizado(item_limpio_temp)

            # 3. Crear Descripción Unificada (usa item_limpio_temp y titulo generado)
            descripcion = self.crear_descripcion_unificada(item_limpio_temp, titulo)

            # 4. Clasificar Área (usa datos limpios/generados)
            area = self.clasificar_area(item_limpio_temp, titulo, descripcion)

            # 5. Normalizar Fecha (usa fecha original del 'item')
            fecha = self.normalizar_fecha(item.get('Fecha'), item_id_log)

            # 6. Normalizar Presupuesto (usa monto original del 'item')
            presupuesto = self.normalizar_presupuesto(item.get('Monto_contratado'), item_id_log)

            # 7. Obtener Cliente y Unidad de Negocio finales (ya limpiados antes)
            cliente_final = cliente_orig_limpio if cliente_orig_limpio else "Cliente Confidencial"
            unidad_negocio_final = unidad_neg_orig_limpia if unidad_neg_orig_limpia else "Servicios TI" # Default si queda vacío

            # 8. Generar Palabras Clave
            palabras_clave_list = self.generar_palabras_clave(titulo, descripcion, area)
            palabras_clave_str = ", ".join(palabras_clave_list)

            # 9. Ensamblar resultado final para Directus
            antecedente_directus = {
                "status": "published",
                "Titulo": titulo,
                "Descripcion": descripcion,
                "Imagen": None,
                "Archivo": None,
                "Fecha": fecha,
                "Cliente": cliente_final,
                "Unidad_de_negocio": unidad_negocio_final,
                "Presupuesto": presupuesto,
                "Area": area,
                "Palabras_clave": palabras_clave_str
            }

            logging.info(f"--- Item {item_id_log} Procesado OK ---")
            return antecedente_directus

        except Exception as e:
            logging.critical(f"!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!", exc_info=True)
            logging.critical(f"ERROR FATAL procesando item {item_id_log}")
            logging.critical(f"!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
            return None

# --- Función Principal ---
def procesar_antecedentes():
    """Carga, valida input, procesa y guarda los antecedentes."""
    processor = AntecedenteProcessor()

    logging.info(f"Cargando datos desde: {INPUT_FILE}")
    try:
        with open(INPUT_FILE, 'r', encoding='utf-8') as f:
            datos_originales = json.load(f)
        if not isinstance(datos_originales, list) or not datos_originales:
            logging.error("ERROR: El JSON de entrada no contiene una lista válida de antecedentes o está vacío.")
            return
        logging.info(f"Se cargaron {len(datos_originales)} registros.")
    except FileNotFoundError:
        logging.error(f"ERROR: Archivo de entrada '{INPUT_FILE}' no encontrado.")
        return
    except json.JSONDecodeError as e:
        logging.error(f"ERROR: '{INPUT_FILE}' no es un JSON válido. Error: {e}")
        return
    except Exception as e:
        logging.error(f"ERROR inesperado al cargar '{INPUT_FILE}': {e}", exc_info=True)
        return

    # --- Validación Crítica del Input (Fechas) ---
    fechas_sospechosas = 0
    fecha_muestra = None
    if len(datos_originales) > 1:
         fecha_muestra = str(datos_originales[0].get('Fecha', '')).strip()
         if fecha_muestra:
             for i, item in enumerate(datos_originales[:min(len(datos_originales), 20)]): # Revisar las primeras 20
                 if str(item.get('Fecha', '')).strip() == fecha_muestra:
                     fechas_sospechosas += 1
                 else:
                     # Si encontramos una fecha diferente temprano, probablemente esté bien
                     if i > 0: fechas_sospechosas = 0
                     break

    if fechas_sospechosas > 5: # Si más de 5 de las primeras 20 tienen la misma fecha
         logging.critical("!!!!!!!!!!!!!!!!!!!!!!!!!!!!! ALERTA DE INPUT !!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
         logging.critical(f"Se detectó que muchos de los primeros registros en '{INPUT_FILE}'")
         logging.critical(f"tienen la misma fecha ('{fecha_muestra}'). Esto sugiere fuertemente que el")
         logging.critical("archivo de ENTRADA está CORRUPTO o no es el archivo original.")
         logging.critical("El script probablemente producirá resultados INCORRECTOS.")
         logging.critical("POR FAVOR, VERIFICA Y USA EL ARCHIVO JSON CON LOS DATOS ORIGINALES.")
         logging.critical("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
         confirm = input("¿Deseas continuar BAJO TU PROPIO RIESGO? (s/N): ")
         if confirm.lower() != 's':
             logging.info("Ejecución cancelada por el usuario debido a posible input corrupto.")
             return

    if TEST_MODE:
        logging.info(f"--- MODO DE PRUEBA ACTIVO --- Procesando {MAX_TEST_RECORDS} registros.")
        datos_a_procesar = datos_originales[:MAX_TEST_RECORDS]
    else:
        logging.info("--- MODO DE PROCESAMIENTO COMPLETO ---")
        if fechas_sospechosas <= 5: # Solo pedir confirmación si no se advirtió antes
             confirm = input(f"Se procesarán {len(datos_originales)} registros. ¿Continuar? (s/N): ")
             if confirm.lower() != 's':
                 logging.info("Ejecución cancelada.")
                 return
        datos_a_procesar = datos_originales

    resultados_procesados = []
    items_fallidos = 0
    for i, item in enumerate(tqdm(datos_a_procesar, desc="Procesando Antecedentes")):
        resultado = processor.procesar_item(item, i) # Pasar índice para logging
        if resultado:
            resultados_procesados.append(resultado)
        else:
            items_fallidos += 1

    logging.info(f"Procesamiento completado.")
    logging.info(f" - Registros procesados con éxito: {len(resultados_procesados)}")
    logging.info(f" - Registros omitidos por error grave: {items_fallidos}")

    if not resultados_procesados:
        logging.warning("No se generaron resultados válidos. No se guardará el archivo.")
        return

    logging.info(f"Guardando {len(resultados_procesados)} resultados en: {OUTPUT_FILE}")
    try:
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(resultados_procesados, f, indent=2, ensure_ascii=False)
        logging.info(f"Archivo '{OUTPUT_FILE}' guardado exitosamente.")
    except Exception as e:
        logging.error(f"ERROR al guardar el archivo de salida '{OUTPUT_FILE}': {e}", exc_info=True)

    # Imprimir muestra en modo test
    if TEST_MODE and resultados_procesados:
        logging.info("\n--- Muestra del primer resultado procesado (Modo Prueba) ---")
        print(json.dumps(resultados_procesados[0], indent=2, ensure_ascii=False))
        if len(resultados_procesados) > 1:
             logging.info("\n--- Muestra del último resultado procesado (Modo Prueba) ---")
             print(json.dumps(resultados_procesados[-1], indent=2, ensure_ascii=False))
        logging.info("------------------------------------------------------------")


if __name__ == "__main__":
    print("\n" + "="*60)
    print(f" SCRIPT ENRIQUECEDOR DE ANTECEDENTES v4 CON {MODEL.upper()}")
    print("(Limpieza Agresiva + Validación Input)")
    print("="*60 + "\n")

    # Asegurarse que TEST_MODE está en True para la primera ejecución
    if not TEST_MODE:
         logging.warning("ADVERTENCIA: TEST_MODE está en False.")
         # La confirmación ahora se pide dentro de procesar_antecedentes

    procesar_antecedentes()

    print("\n" + "="*60)
    print(" Ejecución Finalizada ")
    print("="*60 + "\n")