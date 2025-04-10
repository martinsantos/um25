# -*- coding: utf-8 -*-
import json
import requests
import re
import unicodedata
import time
from tqdm import tqdm
from datetime import datetime
import logging

# Configuración de Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('procesamiento.log'),
        logging.StreamHandler()
    ]
)

# Configuración del script
MODEL = "gemma"
OLLAMA_URL = "http://localhost:11434/api/generate"
INPUT_FILE = "output.json"
OUTPUT_FILE = "antecedentes_gemma_openai_v1.json"
TEST_MODE = True
MAX_TEST_RECORDS = 50
REQUEST_TIMEOUT = 180
RETRY_DELAY = 5

# Lista de áreas predefinidas a elegir
AREAS_CANDIDAS = [
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

# Prompts para generación de contenido
PROMPT_TITULO = (
    "Eres un copywriter experto en SEO. Crea un título atractivo combinando el nombre del cliente "
    "y el servicio realizado, con el siguiente formato: \n\n"
    '"{cliente} - {servicio}"\n\n'
    "Asegúrate de que el resultado sea profesional y optimizado para SEO.\n\nTítulo:"
)

PROMPT_DESCRIPCION = (
    "Redacta un párrafo atractivo y profesional que narre el caso de éxito. Menciona el cliente, el desafío, "
    "el servicio ofrecido y el resultado obtenido. Si falta información, utiliza los siguientes datos para construir la narrativa.\n\n"
    "Datos:\n"
    "Cliente: {cliente}\n"
    "Área: {area}\n"
    "Servicio: {servicios}\n"
    "Fecha: {fecha}\n"
    "Presupuesto: {monto}\n\n"
    "Descripción:"
)

PROMPT_KEYWORDS = (
    "Genera 5-7 palabras clave relevantes basadas en la siguiente información:\n\n"
    "Cliente: {cliente}\n"
    "Servicio: {servicios}\n"
    "Unidad de negocio: {unidad_negocio}\n"
    "Monto: {monto}\n"
    "Descripción: {descripcion}\n\n"
    "Palabras clave:"
)

class AntecedenteEnriquecido:
    def __init__(self):
        self.modelo = MODEL
        self.url_api = OLLAMA_URL
        self.timeout = REQUEST_TIMEOUT

    def limpiar_texto(self, texto):
        if texto is None:
            return ""
        texto = str(texto)
        texto = unicodedata.normalize('NFKC', texto)
        texto = re.sub(r'\s+', ' ', texto).strip()
        return texto

    def llamar_api(self, prompt, temperature=0.4):
        payload = {
            "model": self.modelo,
            "prompt": prompt,
            "stream": False,
            "options": {"temperature": temperature}
        }
        try:
            response = requests.post(self.url_api, json=payload, timeout=self.timeout)
            response.raise_for_status()
            respuesta = response.json().get("response", "").strip()
            respuesta = re.sub(r'^["\']|["\']$', '', respuesta)
            respuesta = re.sub(r'\s+', ' ', respuesta).strip()
            return respuesta if respuesta else None
        except Exception as e:
            logging.error(f"Error en API: {e}")
            return None

    def normalizar_fecha(self, fecha_input):
        if fecha_input is None:
            return "Fecha no especificada"
        if isinstance(fecha_input, str):
            fecha_input = self.limpiar_texto(fecha_input)
            if not fecha_input:
                return "Fecha no especificada"
        formatos = ['%Y-%m-%d', '%d-%m-%Y', '%Y/%m/%d', '%d/%m/%Y']
        for fmt in formatos:
            try:
                fecha_dt = datetime.strptime(str(fecha_input), fmt)
                return fecha_dt.strftime(fmt)
            except ValueError:
                continue
        return str(fecha_input)

    def formatear_monto(self, monto):
        if monto is None:
            return "Monto no especificado"
        monto_str = self.limpiar_texto(str(monto))
        # Si detecta USD, lo deja como está
        if "USD" in monto_str.upper():
            return monto_str
        # Si detecta indicador de moneda argentina o ambas, muestra cifra y "PESOS ARGENTINOS"
        elif "ARS" in monto_str.upper() or "PESOS" in monto_str.upper():
            num = re.findall(r"[\d\.,]+", monto_str)
            if num:
                try:
                    monto_num = float(num[0].replace(',', '.'))
                    return f"{monto_num} PESOS ARGENTINOS"
                except Exception:
                    return monto_str
            else:
                return monto_str
        else:
            try:
                monto_num = float(monto_str.replace(',', '.'))
                return f"{monto_num}"
            except Exception:
                return monto_str

    def seleccionar_area(self, area_input):
        area_input = self.limpiar_texto(area_input).lower()
        for area in AREAS_CANDIDAS:
            if area.lower() in area_input or area_input in area.lower():
                return area
        return AREAS_CANDIDAS[0]

    def generar_titulo(self, cliente, servicios):
        prompt = PROMPT_TITULO.format(cliente=cliente, servicio=servicios[:200])
        titulo = self.llamar_api(prompt, temperature=0.5)
        if not titulo:
            titulo = f"{cliente} - {servicios.split()[0] if servicios.split() else 'Servicio'}"
        titulo = self.limpiar_texto(titulo)
        if not titulo.startswith(cliente):
            titulo = f"{cliente} - {titulo}"
        return titulo[:120]

    def generar_descripcion(self, cliente, area, servicios, monto, fecha):
        prompt = PROMPT_DESCRIPCION.format(
            cliente=cliente,
            area=area,
            servicios=servicios,
            fecha=fecha,
            monto=monto
        )
        descripcion = self.llamar_api(prompt, temperature=0.6)
        if not descripcion:
            descripcion = (
                f"{cliente} enfrentó un importante desafío en el área de {area}. Se implementó un servicio de {servicios} "
                f"en la fecha {fecha}, logrando resultados destacados. La inversión realizada fue de {monto}, lo que "
                "permitió optimizar significativamente sus operaciones."
            )
        return self.limpiar_texto(descripcion)

    def generar_keywords(self, cliente, servicios, unidad_negocio, monto, descripcion):
        prompt = PROMPT_KEYWORDS.format(
            cliente=cliente,
            servicios=servicios,
            unidad_negocio=unidad_negocio,
            monto=monto,
            descripcion=descripcion
        )
        keywords = self.llamar_api(prompt, temperature=0.7)
        if not keywords:
            palabras = set()
            palabras.update(cliente.split())
            palabras.update(servicios.split())
            palabras.update(unidad_negocio.split())
            palabras.update(descripcion.split())
            keywords = ", ".join(sorted(palabras, key=len, reverse=True)[:7])
        return self.limpiar_texto(keywords)

    def procesar_item(self, item):
        try:
            cliente = self.limpiar_texto(item.get('Cliente') or item.get('cliente') or "Cliente no especificado")
            area_raw = self.limpiar_texto(item.get('Area') or item.get('área') or "Servicios técnicos")
            servicios = self.limpiar_texto(item.get('Servicios') or item.get('servicios') or "implementación técnica")
            fecha = self.normalizar_fecha(item.get('Fecha de final') or item.get('fecha'))
            monto = self.formatear_monto(item.get('Monto contratado') or item.get('monto'))
            unidad_negocio = self.limpiar_texto(
                item.get('Unidad de Negocio ID') or item.get('unidad_negocio') or "No especificado"
            )
            if not cliente or cliente == "Cliente no especificado":
                logging.warning("Item omitido: falta nombre de cliente")
                return None

            area = self.seleccionar_area(area_raw)
            titulo = self.generar_titulo(cliente, servicios)
            descripcion = self.generar_descripcion(cliente, area, servicios, monto, fecha)
            keywords = self.generar_keywords(cliente, servicios, unidad_negocio, monto, descripcion)

            return {
                "status": "published",
                "Titulo": titulo,
                "Descripcion": descripcion,
                "Imagen": None,
                "Archivo": None,
                "Fecha": fecha,
                "Cliente": cliente,
                "Unidad_de_negocio": unidad_negocio,
                "Presupuesto": monto,
                "Area": area,
                "Palabras_clave": keywords
            }
        except Exception as e:
            logging.error(f"Error procesando item: {str(e)}")
            return None

def verificar_estructura_archivo(datos):
    if not datos or not isinstance(datos, list):
        logging.error("El archivo no contiene datos o no es una lista válida")
        return False
    primer_item = datos[0]
    campos_requeridos = ['Cliente', 'Area', 'Servicios']
    campos_encontrados = [campo for campo in campos_requeridos if any(campo.lower() == k.lower() for k in primer_item.keys())]
    if len(campos_encontrados) < len(campos_requeridos):
        logging.warning(f"Estructura inesperada. Campos encontrados: {list(primer_item.keys())}")
        return False
    return True

def main():
    print("="*60)
    print("ENRIQUECEDOR DE ANTECEDENTES - VERSIÓN FINAL")
    print("="*60+"\n")

    try:
        with open(INPUT_FILE, 'r', encoding='utf-8') as f:
            datos = json.load(f)
    except Exception as e:
        logging.error(f"No se pudo cargar el archivo {INPUT_FILE}: {str(e)}")
        return

    if not verificar_estructura_archivo(datos):
        logging.warning("El archivo no tiene la estructura esperada. Se intentará procesar igualmente.")

    processor = AntecedenteEnriquecido()
    resultados = []
    items_fallidos = 0

    items_a_procesar = datos[:MAX_TEST_RECORDS] if TEST_MODE else datos

    for item in tqdm(items_a_procesar, desc="Procesando"):
        resultado = processor.procesar_item(item)
        if resultado:
            resultados.append(resultado)
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

if __name__ == "__main__":
    main()
```