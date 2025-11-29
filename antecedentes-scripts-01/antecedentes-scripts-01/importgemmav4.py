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
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('procesamiento.log'),
        logging.StreamHandler()
    ]
)

# --- Configuración Script ---
MODEL = "gemma"
OLLAMA_URL = "http://localhost:11434/api/generate"
INPUT_FILE = "ante2025v3_output_20250409.json"
OUTPUT_FILE = "antecedentes2025_gemma_v3_20250409.json"
TEST_MODE = False
MAX_TEST_RECORDS = 20
REQUEST_TIMEOUT = 180
RETRY_DELAY = 5
MAX_RETRIES = 3

# --- Configuración de Generación ---
GENERATION_CONFIG = {
    "temperature": 0.7,  # Menor creatividad para más precisión
    "top_p": 0.9,
    "max_length": 300,
    "repetition_penalty": 1.2
}

# --- Áreas Predefinidas ---
AREAS_PREDEFINIDAS = [
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

# --- Prompts Optimizados Anti-Alucinaciones ---
PROMPT_PALABRAS_CLAVE = """Extrae EXCLUSIVAMENTE de los datos proporcionados entre 5-7 palabras clave TÉCNICAS relevantes.

Reglas estrictas:
1. Usa SOLO palabras presentes en los datos
2. Prioriza términos técnicos específicos
3. Incluye el sector del cliente si es evidente
4. No inventes tecnologías o beneficios no mencionados

Formato de respuesta: "palabra1, palabra2, palabra3"

Datos:
Título: {titulo}
Descripción: {descripcion}
Área: {area}
Servicios: {servicios}
Cliente: {cliente}

Palabras clave (solo de los datos):"""

PROMPT_SELECCION_AREA = """Selecciona el área técnica MÁS ADECUADA de esta lista, basándote SOLO en los datos proporcionados:

Áreas disponibles:
{areas}

Datos del proyecto:
Cliente: {cliente}
Servicios: {servicios}
Descripción: {descripcion}

Respuesta (SOLO el nombre exacto del área elegida):"""

class AntecedenteEnriquecido:
    def __init__(self):
        self.modelo = MODEL
        self.url_api = OLLAMA_URL
        self.timeout = REQUEST_TIMEOUT
        self.primeras_palabras_titulos = set()

    def limpiar_texto(self, texto: Any) -> str:
        """Limpia texto eliminando caracteres especiales y normaliza espacios"""
        if texto is None:
            return ""
        texto = str(texto)
        texto = unicodedata.normalize('NFKC', texto)
        texto = re.sub(r'[^\w\s.,-]', '', texto)
        texto = re.sub(r'\s+', ' ', texto).strip()
        return texto

    def llamar_api(self, prompt: str, temperature: float = 0.3) -> Optional[str]:
        """Llama a la API con configuración para minimizar alucinaciones"""
        payload = {
            "model": self.modelo,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": temperature,
                "top_p": GENERATION_CONFIG["top_p"],
                "num_ctx": GENERATION_CONFIG["max_length"],
                "repeat_penalty": GENERATION_CONFIG["repetition_penalty"]
            }
        }

        for intento in range(MAX_RETRIES):
            try:
                response = requests.post(self.url_api, json=payload, timeout=self.timeout)
                response.raise_for_status()
                respuesta = response.json().get("response", "").strip()

                # Limpieza conservadora
                respuesta = re.sub(r'^["\']|["\']$', '', respuesta)
                respuesta = re.sub(r'\n+', ' ', respuesta)
                respuesta = re.sub(r'\s+', ' ', respuesta).strip()
                respuesta = respuesta.split('---')[0].split('...')[0].strip()

                return respuesta if respuesta else None

            except requests.exceptions.RequestException as e:
                if intento < MAX_RETRIES - 1:
                    logging.warning(f"Intento {intento + 1} fallido. Reintentando...")
                    time.sleep(RETRY_DELAY * (intento + 1))
                else:
                    logging.error(f"Error en API después de {MAX_RETRIES} intentos: {e}")
                    return None
            except Exception as e:
                logging.error(f"Error inesperado en API: {e}")
                return None

    def validar_descripcion(self, descripcion: str, datos_originales: dict) -> bool:
        """Valida que la descripción no contenga información inventada"""
        palabras_cliente = datos_originales['cliente'].split()
        palabras_servicios = datos_originales['servicios'].lower().split()

        # Verificar que el nombre del cliente esté presente
        if not any(palabra in descripcion for palabra in palabras_cliente):
            return False

        # Verificar que al menos 3 palabras clave del servicio estén presentes
        palabras_comunes = sum(1 for palabra in palabras_servicios
                              if len(palabra) > 3 and palabra in descripcion.lower())

        return palabras_comunes >= 3

    def formatear_monto(self, monto: Any) -> str:
        """Formatea el monto manteniendo la moneda original."""
        if monto is None:
            return "Monto no disponible"

        try:
            # Convertir a string si no lo es
            monto_str = str(monto).strip().upper()
            
            # Si está vacío o solo contiene caracteres especiales
            if not monto_str or monto_str.isspace():
                return "Monto no disponible"

            # Detectar la moneda
            moneda = "USD" if "USD" in monto_str or "U$S" in monto_str or "U$D" in monto_str else "ARS"
            
            # Limpiar el string de caracteres no numéricos pero preservar el punto decimal
            num_str = re.sub(r'[^\d.,]', '', monto_str)
            
            # Manejar diferentes formatos de decimales
            if ',' in num_str and '.' in num_str:
                if num_str.find(',') > num_str.find('.'):
                    num_str = num_str.replace('.', '')  # formato 1.234,56
                else:
                    num_str = num_str.replace(',', '')  # formato 1,234.56
            elif ',' in num_str:
                num_str = num_str.replace(',', '.')  # formato 1234,56

            # Convertir a float
            monto_num = float(num_str)

            # Formatear según la moneda
            if moneda == "USD":
                if monto_num.is_integer():
                    formatted = f"USD {int(monto_num):,d}"
                else:
                    formatted = f"USD {monto_num:,.2f}"
            else:
                if monto_num.is_integer():
                    formatted = f"${int(monto_num):,d} ARS"
                else:
                    formatted = f"${monto_num:,.2f} ARS"

            # Ajustar al formato argentino
            return formatted.replace(',', 'X').replace('.', ',').replace('X', '.')

        except Exception as e:
            logging.warning(f"Error en formatear_monto: {e}, tipo: {type(monto)}, valor: {monto}")
            return str(monto)  # Devolver el valor original si no se puede formatear

    def seleccionar_area(self, cliente: str, servicios: str, descripcion: str) -> str:
        """Selecciona el área más adecuada de las predefinidas con validación estricta"""
        prompt = PROMPT_SELECCION_AREA.format(
            areas="\n".join(AREAS_PREDEFINIDAS),
            cliente=cliente,
            servicios=servicios,
            descripcion=descripcion
        )

        area_seleccionada = self.llamar_api(prompt, temperature=0.2)  # Temperatura muy baja para selección

        # Validación estricta
        if area_seleccionada and area_seleccionada in AREAS_PREDEFINIDAS:
            return area_seleccionada

        # Fallback conservador: buscar coincidencia parcial en servicios
        primera_palabra = servicios.split()[0] if servicios else "Servicios"
        for area in AREAS_PREDEFINIDAS:
            if primera_palabra.lower() in area.lower():
                return area

        return AREAS_PREDEFINIDAS[0]  # Default seguro

    def generar_keywords(self, titulo: str, descripcion: str, area: str, servicios: str, cliente: str) -> str:
        """Genera palabras clave estrictamente basadas en datos"""
        # Primera pasada: extraer palabras clave directamente de los datos
        palabras_datos = set()

        # Del área (eliminar paréntesis y split)
        palabras_datos.update(re.sub(r'[\(\)]', '', area).split())

        # De los servicios (palabras de 4+ letras, no preposiciones)
        stopwords = {'para', 'con', 'los', 'las', 'del', 'por', 'para', 'sus'}
        palabras_datos.update(
            palabra.lower() for palabra in servicios.split()
            if len(palabra) >= 4 and palabra.lower() not in stopwords
        )

        # Del cliente (primera palabra si es significativa)
        primera_palabra = cliente.split()[0]
        if len(primera_palabra) > 3 and primera_palabra.lower() not in {'municipalidad', 'bodega', 'hospital'}:
            palabras_datos.add(primera_palabra)

        # Segunda pasada: pedir al modelo que seleccione de estas
        palabras_base = ", ".join(sorted(palabras_datos, key=lambda x: -len(x))[:15])

        prompt = f"""Selecciona las 5-7 palabras clave MÁS relevantes de esta lista:
        {palabras_base}

        Reglas:
        1. Usa SOLO palabras de la lista
        2. Prioriza términos técnicos
        3. Máximo 7 palabras

        Palabras clave seleccionadas:"""

        keywords = self.llamar_api(prompt, temperature=0.1)  # Temperatura muy baja

        # Fallback seguro
        if not keywords or len(keywords.split(',')) < 3:
            keywords = palabras_base

        # Limpieza final
        keywords = self.limpiar_texto(keywords)
        keywords = re.sub(r'\b(y|e|o|de|en|con|por)\b', '', keywords)  # Eliminar conectores
        keywords = re.sub(r',\s*,', ',', keywords)  # Limpiar comas múltiples

        return keywords[:150]  # Longitud controlada

    def procesar_item(self, item: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Procesa un item individual con validación estricta de datos"""
        try:
            # Obtener datos con manejo robusto de campos
            cliente = self.limpiar_texto(item.get('Cliente') or "Cliente no especificado")
            titulo = self.limpiar_texto(item.get('Titulo') or f"{cliente} - Servicios técnicos")
            descripcion = self.limpiar_texto(item.get('Descripcion') or "Implementación técnica especializada")
            servicios = self.limpiar_texto(item.get('servicios') or item.get('Servicios') or "")  # Buscar en ambos campos
            fecha = self.limpiar_texto(item.get('Fecha') or "Fecha no disponible")
            # Cambio: búsqueda insensible al caso para "Presupuesto"
            presupuesto_val = next((v for k, v in item.items() if k.lower().strip() == "presupuesto"), None)
            print(f"DEBUG - Presupuesto encontrado: {presupuesto_val}, tipo: {type(presupuesto_val)}")
            monto = self.formatear_monto(presupuesto_val)
            area_original = self.limpiar_texto(item.get('Area') or "Servicios técnicos")
            unidad_negocio = self.limpiar_texto(item.get('Unidad_de_negocio') or "No especificado")
            imagen = item.get('Imagen')
            archivo = item.get('Archivo')

            # Validar datos mínimos
            if cliente == "Cliente no especificado":
                logging.warning(f"Item omitido: falta nombre de cliente. Datos: {str(item)[:200]}...")
                return None

            # Seleccionar área usando el valor de 'servicios'
            area = self.seleccionar_area(cliente, servicios, descripcion)

            # Generar palabras clave usando el valor de 'servicios'
            keywords = self.generar_keywords(titulo, descripcion, area, servicios, cliente)

            # Estructura final ordenada
            return {
                "status": "published",
                "Titulo": titulo[:120],
                "Descripcion": descripcion[:350],
                "Imagen": imagen,
                "Archivo": archivo,
                "Fecha": fecha,
                "Cliente": cliente,
                "Unidad_de_negocio": unidad_negocio,
                "Presupuesto": monto,
                "Presupuesto_original": str(presupuesto_val) if presupuesto_val is not None else "No disponible",
                "Area": area,
                "Palabras_clave": keywords
            }
        except Exception as e:
            logging.error(f"Error procesando item: {str(e)}. Datos: {str(item)[:200]}...")
            return None

def verificar_estructura_archivo(datos: List[Dict[str, Any]]) -> bool:
    """Verifica que el archivo tenga datos básicos con tolerancia"""
    if not datos or not isinstance(datos, list):
        logging.error("El archivo no contiene datos o no es una lista válida")
        return False

    if not datos[0]:
        logging.error("El primer item está vacío")
        return False

    # Verificación flexible de campos
    campos_encontrados = set(k.lower() for k in datos[0].keys())
    campos_deseados = {'cliente', 'titulo', 'descripcion', 'fecha', 'presupuesto', 'area'}

    if not campos_deseados.intersection(campos_encontrados):
        logging.warning(f"Estructura inesperada. Campos encontrados: {list(datos[0].keys())}")
        return False

    return True

def post_procesar_resultado(resultado: Dict[str, Any]) -> Dict[str, Any]:
    """Reemplaza respuestas genéricas con valores más informativos y limpia datos."""
    # Reemplazo de valores genéricos
    reemplazos = {
        "Monto no disponible": "Presupuesto no disponible",  # modificado
        "Fecha no especificada": "Fecha no disponible",
        "No especificado": "Información no disponible",
        "None": "Información no disponible"
    }

    for clave, valor in resultado.items():
        if isinstance(valor, str) and valor in reemplazos:
            resultado[clave] = reemplazos[valor]

    # Limpieza adicional de palabras clave
    if 'Palabras_clave' in resultado:
        palabras = resultado['Palabras_clave'].split(',')
        palabras_limpias = [
            p.strip() for p in palabras
            if len(p.strip()) > 3 and not p.strip().isdigit()
        ]
        resultado['Palabras_clave'] = ', '.join(palabras_limpias[:7])  # Limitar a 7 palabras clave

    return resultado

def main():
    print("\n" + "="*60)
    print(" ENRIQUECEDOR DE ANTECEDENTES - VERSIÓN PRECISA")
    print("="*60 + "\n")

    try:
        with open(INPUT_FILE, 'r', encoding='utf-8') as f:
            datos = json.load(f)
    except Exception as e:
        logging.error(f"No se pudo cargar el archivo {INPUT_FILE}: {str(e)}")
        return

    if not verificar_estructura_archivo(datos):
        logging.warning("El archivo no tiene la estructura esperada. Procesando con ajustes...")

    processor = AntecedenteEnriquecido()
    resultados = []
    items_fallidos = 0

    items_a_procesar = datos[:MAX_TEST_RECORDS] if TEST_MODE else datos

    for item in tqdm(items_a_procesar, desc="Procesando antecedentes"):
        resultado = processor.procesar_item(item)
        if resultado:
            resultado_post_procesado = post_procesar_resultado(resultado)
            resultados.append(resultado_post_procesado)
        else:
            items_fallidos += 1

    if resultados:
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(resultados, f, indent=2, ensure_ascii=False)

        print(f"\n✅ Proceso completado. Resultados guardados en {OUTPUT_FILE}")
        print(f"   - Registros procesados: {len(resultados)}")
        print(f"   - Registros fallidos: {items_fallidos}")

        print("\n🔍 Ejemplo de resultado:")
        print(json.dumps(resultados[0], indent=2, ensure_ascii=False))
    else:
        print("\n❌ No se generaron resultados válidos. Revise el archivo de entrada.")
        print("   Campos mínimos esperados: Cliente, Descripción/Título, Área")
        print(f"   Campos encontrados en el primer item: {list(datos[0].keys())}")

if __name__ == "__main__":
    main()