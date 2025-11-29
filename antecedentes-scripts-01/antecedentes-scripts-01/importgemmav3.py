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
INPUT_FILE = "ante2025_output_v3.json"
OUTPUT_FILE = "antecedentes_gemma_segunda_gen_v5.json"
TEST_MODE = True
MAX_TEST_RECORDS = 20
REQUEST_TIMEOUT = 180
RETRY_DELAY = 5
MAX_RETRIES = 3

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

# --- Prompts Optimizados ---
PROMPT_TITULO_SEO = """Eres un copywriter experto en SEO B2B para tecnología. Crea un título profesional (20-60 caracteres) con este formato:

[Nombre Cliente] - [Servicio realizado] - [Detalle específico]

Reglas:
1. Usa exactamente el nombre del cliente como aparece en los datos, revisa que no se duplique el nombre de cliente
2. El servicio debe ser claro y específico
3. El detalle debe incluir tecnología usada o beneficio clave
4. Mantén un tono profesional y descriptivo
5. Usa términos técnicos relevantes

Ejemplos:
"Aeropuertos Argentina 2000 - Redes de incendio en aeropuerto Mendoza - Desarrollo de proyecto y cableado estructurado"
"Hospital Italo Perrupato - Sistema de distribución de información - Implementación SDI con redundancia"

Datos:
Cliente: {cliente}
Área: {area}
Servicios: {servicios}

Título:"""

PROMPT_DESCRIPCION_ENRIQUECIDA = """Escribe un párrafo (20- 80 palabras) que describa el servicio realizado:

1. Contexto: Breve introducción del cliente, SIN INVENTAR actividades del cliente que no se puedan deducir de los datos del antecedente
2. Desafío: Problema o necesidad específica que planteaba la tarea
3. Solución: Servicio realizado con tecnologías clave
4. Resultado: Beneficio cuantificable si está disponible

Reglas:
- Usa exactamente el nombre del cliente como aparece
- Mantén un tono profesional y técnico
- No inventes información que no esté en los datos, no alucines ni rellenes 
- Usa un lenguaje genérico pero preciso

Datos:
Cliente: {cliente}
Área: {area}
Servicios: {servicios}
Monto: {monto}
Fecha: {fecha}

Descripción:"""

PROMPT_PALABRAS_CLAVE = """Genera 5-7 palabras clave para SEO basadas en este proyecto. Incluye:
1. Tecnologías usadas
2. Tipo de servicio
3. Sector del cliente
4. Beneficios clave

Ejemplo: "redes de incendio, cableado estructurado, aeropuertos, seguridad, normativa IRAM"

Reglas:
- Usa solo información del proyecto
- No inventes tecnologías no mencionadas
- Incluye el sector del cliente si es relevante

Datos:
Título: {titulo}
Descripción: {descripcion}
Área: {area}
Servicios: {servicios}
Cliente: {cliente}

Palabras clave:"""

PROMPT_SELECCION_AREA = """De la siguiente lista de áreas técnicas, selecciona la MÁS ADECUADA para este proyecto. 
Responde SOLO con el nombre exacto del área elegida:

Áreas disponibles:
{areas}

Datos del proyecto:
Cliente: {cliente}
Servicios: {servicios}
Descripción: {descripcion}

El área más adecuada es:"""

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

    def llamar_api(self, prompt: str, temperature: float = 0.4) -> Optional[str]:
        """Llama a la API de Gemma con manejo de errores y reintentos"""
        payload = {
            "model": self.modelo,
            "prompt": prompt,
            "stream": False,
            "options": {"temperature": temperature}
        }
        
        for intento in range(MAX_RETRIES):
            try:
                response = requests.post(self.url_api, json=payload, timeout=self.timeout)
                response.raise_for_status()
                respuesta = response.json().get("response", "").strip()
                
                # Limpieza avanzada de la respuesta
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

    def normalizar_fecha(self, fecha_input: Any) -> str:
        """Normaliza la fecha manteniendo el formato original si es válido"""
        if fecha_input is None:
            return "Fecha no especificada"
        
        if isinstance(fecha_input, str):
            fecha_input = self.limpiar_texto(fecha_input)
            if not fecha_input:
                return "Fecha no especificada"

        # Intentar parsear y mantener formato original si es posible
        formatos = ['%Y-%m-%d', '%d-%m-%Y', '%Y/%m/%d', '%d/%m/%Y', '%m/%d/%Y']
        for fmt in formatos:
            try:
                datetime.strptime(str(fecha_input), fmt)
                return fecha_input  # Mantener formato original si es válido
            except ValueError:
                continue
        
        return str(fecha_input)

    def formatear_monto(self, monto: Any) -> str:
        """Formatea el monto manteniendo la moneda original"""
        if monto is None:
            return "Monto no especificado"
        
        try:
            # Extraer número y moneda si está especificada
            monto_str = str(monto).strip()
            moneda = "USD" if "USD" in monto_str.upper() else "ARS"
            
            # Extraer solo los números y puntos
            num_str = re.sub(r'[^\d.]', '', monto_str)
            monto_num = float(num_str) if num_str else 0
            
            # Formatear según la moneda
            if moneda == "USD":
                return f"USD {monto_num:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')
            else:
                return f"${monto_num:,.2f} ARS".replace(',', 'X').replace('.', ',').replace('X', '.')
        except Exception:
            return str(monto)

    def seleccionar_area(self, cliente: str, servicios: str, descripcion: str) -> str:
        """Selecciona el área más adecuada de las predefinidas"""
        prompt = PROMPT_SELECCION_AREA.format(
            areas="\n".join(AREAS_PREDEFINIDAS),
            cliente=cliente,
            servicios=servicios,
            descripcion=descripcion
        )
        
        area_seleccionada = self.llamar_api(prompt, temperature=0.3)
        
        # Validar que el área seleccionada esté en la lista predefinida
        if area_seleccionada and area_seleccionada in AREAS_PREDEFINIDAS:
            return area_seleccionada
        
        # Fallback: usar la primera palabra de los servicios si no se pudo seleccionar
        primera_palabra = servicios.split()[0] if servicios else "Servicios"
        for area in AREAS_PREDEFINIDAS:
            if primera_palabra.lower() in area.lower():
                return area
                
        return AREAS_PREDEFINIDAS[0]  # Default

    def generar_titulo(self, cliente: str, area: str, servicios: str) -> str:
        """Genera título SEO profesional"""
        prompt = PROMPT_TITULO_SEO.format(
            cliente=cliente,
            area=area,
            servicios=servicios[:300]  # Limitar longitud pero dar más contexto
        )
        
        titulo = self.llamar_api(prompt, temperature=0.5)
        
        # Validación y fallback robusto
        if not titulo or len(titulo) < 10:
            palabras_servicio = servicios.split()[:5]
            servicio_principal = " ".join(palabras_servicio) if palabras_servicio else "servicios técnicos"
            titulo = f"{cliente} - {servicio_principal} - Implementación profesional"
        
        # Asegurar que el cliente esté al inicio
        titulo = self.limpiar_texto(titulo)
        if not titulo.startswith(cliente):
            titulo = f"{cliente} - {titulo}"
            
        # Limitar longitud pero manteniendo estructura
        return titulo[:120].strip()

    def generar_descripcion(self, cliente: str, area: str, servicios: str, monto: str, fecha: str) -> str:
        """Genera descripción enriquecida del caso de éxito"""
        prompt = PROMPT_DESCRIPCION_ENRIQUECIDA.format(
            cliente=cliente,
            area=area,
            servicios=servicios,
            monto=monto,
            fecha=fecha
        )
        
        descripcion = self.llamar_api(prompt, temperature=0.6)
        
        # Fallback detallado si la API falla
        if not descripcion:
            descripcion = (
                f"{cliente} implementó un proyecto de {area.lower()} que incluyó: {servicios}. "
                f"El trabajo se completó en {fecha} con una inversión de {monto}. "
                "La solución implementada mejoró significativamente las operaciones del cliente, "
                "proporcionando mayor eficiencia y confiabilidad en sus sistemas."
            )
            
        # Limpieza final
        descripcion = self.limpiar_texto(descripcion)
        
        # Asegurar que termine con punto
        if not descripcion.endswith('.'):
            descripcion += '.'
            
        return descripcion[:350]  # Limitar longitud razonable

    def generar_keywords(self, titulo: str, descripcion: str, area: str, servicios: str, cliente: str) -> str:
        """Genera palabras clave relevantes y específicas"""
        prompt = PROMPT_PALABRAS_CLAVE.format(
            titulo=titulo,
            descripcion=descripcion,
            area=area,
            servicios=servicios,
            cliente=cliente
        )
        
        keywords = self.llamar_api(prompt, temperature=0.7)
        
        # Fallback inteligente si la API falla
        if not keywords:
            palabras = set()
            
            # Extraer del área
            palabras.update(area.replace('(', '').replace(')', '').split())
            
            # Extraer de servicios (palabras de 3+ letras)
            palabras.update(w for w in servicios.split() if len(w) >= 3 and w.lower() not in ['con', 'para', 'los'])
            
            # Extraer del cliente (primera palabra)
            primera_palabra_cliente = cliente.split()[0]
            if len(primera_palabra_cliente) > 3:
                palabras.add(primera_palabra_cliente)
                
            # Ordenar por relevancia (largas primero)
            keywords = ", ".join(sorted(palabras, key=lambda x: -len(x))[:7])
            
        return self.limpiar_texto(keywords)

    def procesar_item(self, item: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Procesa un item individual con manejo robusto de errores"""
        try:
            # Obtener datos básicos con manejo flexible de nombres de campos
            cliente = self.limpiar_texto(item.get('Cliente') or item.get('cliente') or item.get('nombre_cliente') or "Cliente no especificado")
            area_original = self.limpiar_texto(item.get('Area') or item.get('área') or "Servicios técnicos")
            servicios = self.limpiar_texto(item.get('Servicios') or item.get('servicios') or item.get('descripcion') or "implementación técnica")
            fecha = self.normalizar_fecha(item.get('Fecha de final') or item.get('fecha_final') or item.get('fecha'))
            monto = self.formatear_monto(item.get('Monto contratado') or item.get('monto') or item.get('presupuesto'))
            unidad_negocio = self.limpiar_texto(
                item.get('Unidad de Negocio ID') or 
                item.get('unidad_negocio') or 
                item.get('departamento') or
                "No especificado"
            )
            imagen = item.get('Imagen') or item.get('imagen')
            archivo = item.get('Archivo') or item.get('archivo')

            # Validar datos mínimos
            if not cliente or cliente == "Cliente no especificado":
                logging.warning(f"Item omitido: falta nombre de cliente. Datos: {str(item)[:200]}...")
                return None

            # Generar contenido enriquecido en orden lógico
            descripcion = self.generar_descripcion(cliente, area_original, servicios, monto, fecha)
            area = self.seleccionar_area(cliente, servicios, descripcion)
            titulo = self.generar_titulo(cliente, area, servicios)
            keywords = self.generar_keywords(titulo, descripcion, area, servicios, cliente)

            # Estructura final ordenada
            return {
                "status": "published",
                "Titulo": titulo,
                "Descripcion": descripcion,
                "Imagen": imagen,
                "Archivo": archivo,
                "Fecha": fecha,
                "Cliente": cliente,
                "Unidad_de_negocio": unidad_negocio,
                "Presupuesto": monto,
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
    campos_deseados = {'cliente', 'servicios', 'area', 'fecha', 'monto'}
    
    if not campos_deseados.intersection(campos_encontrados):
        logging.warning(f"Estructura inesperada. Campos encontrados: {list(datos[0].keys())}")
        return False
    
    return True

def main():
    print("\n" + "="*60)
    print(" ENRIQUECEDOR DE ANTECEDENTES - VERSIÓN OPTIMIZADA")
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
        print("   Campos mínimos esperados: Cliente, Servicios, Area/Monto/Fecha (alguno de estos)")
        print(f"   Campos encontrados en el primer item: {list(datos[0].keys())}")

if __name__ == "__main__":
    main()