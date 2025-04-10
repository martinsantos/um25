import json
import requests
from tqdm import tqdm
from datetime import datetime
import re
import unicodedata
from typing import Dict, Any, List, Optional

# Configuración
MODEL = "llama3"
OLLAMA_URL = "http://localhost:11434/api/generate"
INPUT_FILE = "antecedentes_enriquecidos_v5.json"
OUTPUT_FILE = "antecedentes_directus_v10.json"
TEST_MODE = True  # Solo procesa 10 registros para prueba
MAX_TEST_RECORDS = 10

# Áreas predefinidas para normalización (según requerimiento)
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

# Verbos prohibidos en títulos (según requerimiento)
VERBOS_PROHIBIDOS = {
    'despliegue', 'optimización', 'implementación', 'sistema', 'plataforma',
    'solución', 'integración', 'modernización'
}

# Prompts optimizados para enriquecimiento
PROMPT_TITULO_SEO = """[INST]
<<SYS>>
Genera un título SEO optimizado en ESPAÑOL para proyecto tecnológico con:
- Exactamente 30-50 caracteres
- Estructura: [Beneficio/Resultado] + [Tecnología/Solución] + [Contexto]
- Evita comenzar con verbos comunes como: {verbos_prohibidos}
- Usa palabras clave específicas del sector
- Enfoque B2B tecnológico profesional
- Todo en español

Contexto:
Área: {area}
Cliente: {cliente}
Descripción: {descripcion}

Ejemplos buenos:
- "Conectividad de Alta Densidad para 200 Periodistas en Eventos Masivos"
- "Infraestructura Cisco para Transmisiones en Estadios Deportivos"
- "Centro de Datos Seguro para Sistemas de Vigilancia Policial"

Genera SOLO el título optimizado sin comentarios:[/INST]"""

PROMPT_DESCRIPCION_UNIFICADA = """[INST]
<<SYS>>
Combina estas descripciones en un texto profesional en español:
- Mínimo 40 palabras, máximo 70
- Estructura: Contexto + Tecnología + Resultados Cuantificables
- Incluye: problema resuelto, tecnología usada, métricas de éxito
- Evita redundancias
- Mantén el tono técnico pero claro

Contexto:
Título: {titulo}
Área: {area}
Cliente: {cliente}
Descripción breve: {desc_breve}
Descripción ampliada: {desc_ampliada}

Ejemplo:
"Para el evento Copa América 2012, implementamos una red de cableado estructurado con 200 puestos para periodistas y 60 puntos de transmisión, utilizando switches Cisco. La solución redujo en 40% los tiempos de configuración e incluyó un centro de datos para sistemas críticos y CCTV, mejorando la operatividad durante el torneo."

Genera SOLO la descripción unificada sin comentarios:[/INST]"""

PROMPT_TRADUCCION = """[INST]
<<SYS>>
Traduce este texto técnico al español (de España):
- Mantén términos técnicos (ej: "firewall" → "cortafuegos")
- Conserva nombres propios (Cisco, VMware)
- Asegura naturalidad
- Adapta formatos (ej: "25%" → "25 %")
- Resultado SOLO en español

Texto: {texto}

Genera SOLO la traducción sin comentarios:[/INST]"""

PROMPT_NORMALIZACION_CLIENTE = """[INST]
<<SYS>>
Extrae y normaliza el nombre del cliente:
- Mantén la denominación oficial
- Elimina términos como "Client", "Customer"
- Conserva acrónimos (ej: AA2000)
- Formato: [Entidad] + [Detalle si aplica]
- Todo en español

Ejemplos:
- "AEROPUERTOS ARGENTINA 2000 Client" → "Aeropuertos Argentina 2000"
- "GOBIERNO DE MENDOZA Customer" → "Gobierno de Mendoza"
- "Copa América 2012 Stadium Malvinas Argentinas Client" → "Copa América 2012 - Estadio Malvinas Argentinas"

Texto: {texto}

Genera SOLO el nombre normalizado sin comentarios:[/INST]"""

PROMPT_SELECCION_AREA = """[INST]
<<SYS>>
Selecciona el área técnica más adecuada para este proyecto:
- Elige SOLO UNA opción de la lista
- Basado en la descripción técnica
- Mantén precisión técnica

Opciones: {opciones}

Contexto:
Título: {titulo}
Descripción: {descripcion}

Genera SOLO el área seleccionada sin comentarios:[/INST]"""

class AntecedenteProcessor:
    def __init__(self):
        self.titulos_utilizados = set()
        self.modelo = MODEL
        self.url_api = OLLAMA_URL
        self.timeout = 120

    def procesar_con_llama(self, prompt: str, temperatura: float = 0.5) -> Optional[str]:
        """Procesamiento mejorado con manejo robusto de errores"""
        try:
            payload = {
                "model": self.modelo,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": temperatura,
                    "num_ctx": 4096
                }
            }
            
            response = requests.post(self.url_api, json=payload, timeout=self.timeout)
            response.raise_for_status()
            
            respuesta = response.json().get("response", "").strip()
            return self.limpiar_texto(respuesta)
            
        except Exception as e:
            print(f"\nError en API: {str(e)}")
            return None

    def limpiar_texto(self, texto: str) -> str:
        """Limpieza exhaustiva de texto"""
        if not texto or not isinstance(texto, str):
            return ""
        
        patrones = [
            r'<<SYS>>.*?<</SYS>>',
            r'\[/?INST\]',
            r'\*\*',
            r'\[.*?\]',
            r'http\S+',
            r'[�]',
            r'[\x00-\x1F\x7F]'
        ]
        
        for patron in patrones:
            texto = re.sub(patron, '', texto, flags=re.DOTALL)
        
        texto = unicodedata.normalize('NFKC', texto)
        texto = texto.replace('"', "'").replace('“', "'").replace('”', "'")
        texto = ' '.join(texto.split())
        return texto.strip()

    def traducir_texto(self, texto: str) -> str:
        """Traduce texto inglés->español con manejo de errores"""
        if not texto or not isinstance(texto, str):
            return ""
        
        if not re.search(r'[a-zA-Z]{3,}', texto):
            return texto
        
        try:
            prompt = PROMPT_TRADUCCION.format(texto=texto)
            resultado = self.procesar_con_llama(prompt, temperatura=0.3)
            return resultado if resultado else texto
        except Exception as e:
            print(f"Error traduciendo: {str(e)}")
            return texto

    def normalizar_cliente(self, cliente: str) -> str:
        """Normaliza el nombre del cliente"""
        if not cliente:
            return ""
        
        try:
            prompt = PROMPT_NORMALIZACION_CLIENTE.format(texto=cliente)
            resultado = self.procesar_con_llama(prompt, temperatura=0.2)
            return resultado if resultado else cliente
        except Exception as e:
            print(f"Error normalizando cliente: {str(e)}")
            return cliente

    def seleccionar_area(self, titulo: str, descripcion: str) -> str:
        """Selecciona el área más adecuada de la lista predefinida"""
        try:
            opciones = "\n".join([f"- {area}" for area in AREAS_PREDEFINIDAS])
            prompt = PROMPT_SELECCION_AREA.format(
                opciones=opciones,
                titulo=titulo,
                descripcion=descripcion
            )
            
            resultado = self.procesar_con_llama(prompt, temperatura=0.1)
            if not resultado:
                return AREAS_PREDEFINIDAS[0]
            
            for area in AREAS_PREDEFINIDAS:
                if area.lower() == resultado.lower():
                    return area
            
            return AREAS_PREDEFINIDAS[0]
        except Exception as e:
            print(f"Error seleccionando área: {str(e)}")
            return AREAS_PREDEFINIDAS[0]

    def normalizar_fecha(self, fecha: str) -> str:
        """Normaliza fechas manteniendo el formato original si es válido"""
        if not fecha:
            return ""
        
        # Si ya está en formato DD-MM-AAAA, mantenerlo
        if re.match(r'^\d{2}-\d{2}-\d{4}$', str(fecha)):
            return fecha
        
        formatos_entrada = [
            '%Y-%m-%d', '%d-%m-%Y', '%m/%d/%Y', 
            '%Y/%m/%d', '%d/%m/%Y', '%B %Y', '%b %Y',
            '%B %d, %Y', '%b %d, %Y', '%Y'
        ]
        
        for fmt in formatos_entrada:
            try:
                dt = datetime.strptime(str(fecha), fmt)
                return dt.strftime('%d-%m-%Y')
            except ValueError:
                continue
                
        if re.match(r'^\d{4}$', str(fecha)):
            return f"01-01-{fecha}"
            
        return str(fecha)  # Mantener original si no se puede parsear

    def normalizar_presupuesto(self, valor: Any) -> str:
        """Normaliza el presupuesto a formato estándar"""
        try:
            if isinstance(valor, str) and "USD" in valor:
                return valor
            
            num = float(str(valor).replace(',', '.'))
            return f"{num:,.2f} USD"
        except:
            return str(valor)

    def generar_titulo_seo(self, item: Dict[str, Any]) -> str:
        """Genera título SEO único evitando verbos prohibidos"""
        intentos = 0
        max_intentos = 5  # Más intentos para evitar verbos prohibidos
        
        while intentos < max_intentos:
            prompt = PROMPT_TITULO_SEO.format(
                verbos_prohibidos=", ".join(VERBOS_PROHIBIDOS),
                area=item.get('Área', ''),
                cliente=item.get('Cliente', ''),
                descripcion=item.get('Descripción', '')
            )
            
            titulo = self.procesar_con_llama(prompt)
            titulo = self.limpiar_texto(titulo)
            
            if not titulo:
                return item.get('Título', '')
            
            # Verificar que no empiece con verbos prohibidos
            primera_palabra = titulo.split()[0].lower() if titulo else ''
            if primera_palabra in VERBOS_PROHIBIDOS:
                intentos += 1
                continue
                
            # Verificar unicidad
            if titulo.lower() not in self.titulos_utilizados:
                self.titulos_utilizados.add(titulo.lower())
                return titulo
                
            intentos += 1
        
        return item.get('Título', '')

    def unificar_descripciones(self, item: Dict[str, Any]) -> str:
        """Combina y mejora las descripciones"""
        desc_breve = item.get('Descripción', '')
        desc_ampliada = item.get('Descripción_Ampliada', '')
        
        if not desc_breve and not desc_ampliada:
            return ""
            
        prompt = PROMPT_DESCRIPCION_UNIFICADA.format(
            titulo=item.get('Título', ''),
            area=item.get('Área', ''),
            cliente=item.get('Cliente', ''),
            desc_breve=desc_breve,
            desc_ampliada=desc_ampliada
        )
        
        descripcion = self.procesar_con_llama(prompt)
        return self.limpiar_texto(descripcion) if descripcion else f"{desc_breve} {desc_ampliada}".strip()

    def generar_palabras_clave(self, item: Dict[str, Any]) -> str:
        """Genera palabras clave para SEO basadas en el contenido"""
        try:
            texto = f"{item.get('Título', '')} {item.get('Descripción', '')} {item.get('Área', '')}"
            palabras = re.findall(r'\b[\w+]+\b', texto.lower())
            stopwords = {'para', 'con', 'los', 'las', 'del', 'una', 'por', 'como'}
            
            frecuencias = {}
            for palabra in palabras:
                if len(palabra) > 3 and palabra not in stopwords:
                    frecuencias[palabra] = frecuencias.get(palabra, 0) + 1
            
            top_palabras = sorted(frecuencias.items(), key=lambda x: x[1], reverse=True)
            palabras_unicas = []
            for palabra, _ in top_palabras:
                if palabra not in palabras_unicas:
                    palabras_unicas.append(palabra)
                    if len(palabras_unicas) >= 5:
                        break
            
            return ', '.join(palabras_unicas)
        except Exception:
            return ""

    def procesar_item(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """Procesamiento completo de un antecedente"""
        try:
            # 1. Traducción de campos en inglés
            item_traducido = {
                k: self.traducir_texto(v) if isinstance(v, str) else v
                for k, v in item.items()
            }
            
            # 2. Normalizar cliente
            cliente_normalizado = self.normalizar_cliente(item_traducido.get('Cliente', ''))
            item_traducido['Cliente'] = cliente_normalizado
            
            # 3. Seleccionar área predefinida
            area_seleccionada = self.seleccionar_area(
                item_traducido.get('Título', ''),
                item_traducido.get('Descripción', '')
            )
            item_traducido['Área'] = area_seleccionada
            item_traducido['Unidad_de_negocio'] = area_seleccionada  # Según requerimiento
            
            # 4. Generar título SEO mejorado
            nuevo_titulo = self.generar_titulo_seo(item_traducido)
            if nuevo_titulo:
                item_traducido['Título'] = nuevo_titulo
            
            # 5. Unificar descripciones
            descripcion_unificada = self.unificar_descripciones(item_traducido)
            item_traducido['Descripción'] = descripcion_unificada
            item_traducido.pop('Descripción_Ampliada', None)
            
            # 6. Normalizar campos clave
            item_traducido['Presupuesto'] = self.normalizar_presupuesto(item_traducido.get('Monto_contratado', ''))
            item_traducido.pop('Monto_contratado', None)
            
            item_traducido['Fecha'] = self.normalizar_fecha(item_traducido.get('Fecha', ''))
            
            # 7. Generar palabras clave para SEO
            item_traducido['Palabras_Clave'] = self.generar_palabras_clave(item_traducido)
            
            # 8. Eliminar campos no necesarios
            item_traducido.pop('Contenido_completo', None)
            
            return item_traducido
        
        except Exception as e:
            print(f"\nError procesando item: {str(e)}")
            return item

    def verificar_calidad(self, item: Dict[str, Any]) -> List[str]:
        """Verificación exhaustiva de calidad del item procesado"""
        problemas = []
        
        # Campos requeridos
        campos_requeridos = ['Título', 'Descripción', 'Cliente', 'Área', 'Fecha']
        for campo in campos_requeridos:
            if not item.get(campo):
                problemas.append(f"Campo requerido vacío: {campo}")
        
        # Longitud mínima descripción
        if len(item.get('Descripción', '').split()) < 30:
            problemas.append("Descripción demasiado corta (mínimo 30 palabras)")
        
        # Verificar formato fecha (pero mantener original)
        fecha = item.get('Fecha', '')
        if not re.match(r'^\d{2}-\d{2}-\d{4}$', str(fecha)) and not fecha:
            problemas.append(f"Formato fecha incorrecto: {fecha}")
        
        # Verificar área predefinida
        if item.get('Área') not in AREAS_PREDEFINIDAS:
            problemas.append(f"Área no está en la lista predefinida: {item.get('Área')}")
        
        # Verificar verbos prohibidos en título
        titulo = item.get('Título', '')
        primera_palabra = titulo.split()[0].lower() if titulo else ''
        if primera_palabra in VERBOS_PROHIBIDOS:
            problemas.append(f"Título comienza con verbo prohibido: {primera_palabra}")
        
        return problemas

def mapear_a_directus(item: Dict[str, Any]) -> Dict[str, Any]:
    """Mapea los campos al formato requerido por Directus"""
    return {
        "status": "published",
        "sort": None,
        "user_created": None,
        "date_created": None,  # Se establecerá en Directus automáticamente
        "Titulo": item.get('Título', ''),
        "Descripcion": item.get('Descripción', ''),
        "Imagen": None,
        "Archivo": None,
        "Fecha": item.get('Fecha', ''),
        "Cliente": item.get('Cliente', ''),
        "Unidad_de_negocio": item.get('Unidad_de_negocio', ''),
        "Presupuesto": item.get('Presupuesto', ''),
        "Area": item.get('Área', ''),
        "Palabras_clave": item.get('Palabras_Clave', '')
    }

def procesar_antecedentes():
    """Procesamiento principal"""
    processor = AntecedenteProcessor()
    
    try:
        with open(INPUT_FILE, 'r', encoding='utf-8') as f:
            datos = json.load(f)
    except Exception as e:
        print(f"\nError cargando archivo: {str(e)}")
        return []
    
    if TEST_MODE:
        datos = datos[:MAX_TEST_RECORDS]
        print(f"\nMODO PRUEBA: Procesando solo {MAX_TEST_RECORDS} registros")
    
    resultados = []
    problemas_totales = 0
    
    for item in tqdm(datos, desc="Procesando antecedentes"):
        try:
            item_procesado = processor.procesar_item(item)
            problemas = processor.verificar_calidad(item_procesado)
            
            if problemas:
                problemas_totales += len(problemas)
                print(f"\nProblemas en item: {item_procesado.get('Título', '')}")
                for p in problemas:
                    print(f" - {p}")
            
            # Mapear a formato Directus
            item_directus = mapear_a_directus(item_procesado)
            resultados.append(item_directus)
        except Exception as e:
            print(f"\nError crítico procesando item: {str(e)}")
            continue
    
    # Guardar resultados
    try:
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(resultados, f, indent=2, ensure_ascii=False)
        
        print(f"\nProceso completado. Registros: {len(resultados)}")
        print(f"Problemas detectados: {problemas_totales}")
        print(f"Archivo generado: {OUTPUT_FILE}")
        
        if TEST_MODE and resultados:
            print("\nMuestra del primer registro procesado:")
            print(json.dumps(resultados[0], indent=2, ensure_ascii=False))
        
        return resultados
    
    except Exception as e:
        print(f"\nError guardando resultados: {str(e)}")
        return []

if __name__ == "__main__":
    print("\n" + "="*60)
    print(" ENRIQUECEDOR DE ANTECEDENTES PARA DIRECTUS")
    print(f" Modelo: {MODEL} | Entrada: {INPUT_FILE}")
    print("="*60 + "\n")
    
    resultados = procesar_antecedentes()