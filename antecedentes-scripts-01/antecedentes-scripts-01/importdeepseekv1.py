import json
import requests
from tqdm import tqdm
from datetime import datetime
import re
import unicodedata
from typing import Dict, Any, List, Optional

# Configuración
MODEL = "deepseek-r1:1.5b"
OLLAMA_URL = "http://localhost:11434/api/generate"
INPUT_FILE = "antecedentes_enriquecidos_v5.json"
OUTPUT_FILE = "antecedentes_deepseek_v1.json"
TEST_MODE = True  # Solo procesa 10 registros para prueba
MAX_TEST_RECORDS = 10

# Áreas predefinidas para normalización
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

# Prompts optimizados para DeepSeek
PROMPT_TITULO_SEO = """[INST]
<<SYS>>
Genera un título SEO optimizado en ESPAÑOL para proyecto tecnológico con:
- Exactamente 50-70 caracteres
- Estructura: [Solución] + [Beneficio] + [Sector]
- Verbos de acción: Despliegue, Integración, Modernización, Solución, Plataforma
- Evita términos repetitivos como "Optimización" e "Implementación"
- Palabras clave relevantes para posicionamiento web
- Enfoque B2B tecnológico profesional
- Todo el texto DEBE estar en español
- No repitas palabras iniciales de otros títulos (evita "Despliegue", "Solución", etc. si ya se usaron)

Contexto:
Área: {area}
Cliente: {cliente}
Descripción: {descripcion}

Ejemplos buenos:
- "Infraestructura de Redes Avanzadas: Conectividad de Alto Rendimiento para Estadios Deportivos"
- "Plataforma de Gestión Cloud: Reducción de Costos Operativos en Retail"
- "Sistema de Videovigilancia IP: Seguridad Integral para Campus Universitarios"

Genera SOLO el título optimizado en español sin comentarios:[/INST]"""

PROMPT_DESCRIPCION_UNIFICADA = """[INST]
<<SYS>>
Combina y mejora estas descripciones en ESPAÑOL creando un único campo profesional:
- Mínimo 30 palabras, máximo 100
- Estructura: Problema + Solución + Tecnología + Resultados
- Incluir métricas concretas (%, tiempo, ahorro) cuando sea posible
- Estilo técnico pero claro
- Evitar redundancias
- Todo el texto DEBE estar en español
- Mantener información técnica relevante

Contexto:
Título: {titulo}
Área: {area}
Cliente: {cliente}
Descripción breve: {desc_breve}
Descripción ampliada: {desc_ampliada}

Ejemplo de salida:
"El estadio requería una solución integral de conectividad para soportar transmisiones en vivo y trabajo de periodistas durante eventos masivos. Implementamos una red de cableado estructurado con 200 puestos para periodistas y 60 puntos en vigas de transmisión, utilizando tecnología Cisco. La solución incluyó un data center central que albergó los sistemas del estadio y el CCTV de seguridad, reduciendo tiempos de respuesta en un 40%."

Genera SOLO la descripción unificada en español sin comentarios:[/INST]"""

PROMPT_TRADUCCION = """[INST]
<<SYS>>
Traduce este texto técnico profesional del inglés al español (de España):
- Mantén terminología técnica adecuada (ej: "firewall" → "cortafuegos")
- Conserva nombres propios y marcas (Cisco, VMware)
- Asegura fluidez y naturalidad
- Adapta formatos (ej: "25%" → "25 %")
- Todo el resultado DEBE estar en español

Texto a traducir: {texto}

Genera SOLO la traducción al español sin comentarios:[/INST]"""

PROMPT_NORMALIZACION = """[INST]
<<SYS>>
Normaliza este valor de campo para sistema técnico profesional:
- Todo en español
- Mayúsculas iniciales correctas
- Sin redundancias
- Terminología precisa
- Formato consistente
- Optimizado para búsquedas

Campo: {campo}
Valor Actual: {valor}
Contexto: Área: {area}

Ejemplos:
- "Closed-Circuit Television" → "Videovigilancia IP"
- "941376.0" → "941.376,00 USD"
- "March 2025" → "01-03-2025"
- "Telecomunicaciones -> Redes" → "Telecomunicaciones/Redes"

Genera SOLO el valor normalizado en español sin comentarios:[/INST]"""

class AntecedenteProcessor:
    def __init__(self):
        self.titulos_utilizados = set()
        self.modelo = MODEL
        self.url_api = OLLAMA_URL
        self.timeout = 120

    def procesar_con_deepseek(self, prompt: str, temperatura: float = 0.5) -> Optional[str]:
        """Procesamiento mejorado con manejo robusto de errores para DeepSeek"""
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
        """Limpieza exhaustiva de texto, eliminando bloques <think> y otros patrones no deseados"""
        if not texto or not isinstance(texto, str):
            return ""
        
        # Eliminar bloques <think> y contenido dentro de ellos
        texto = re.sub(r'<think>.*?</think>', '', texto, flags=re.DOTALL)
        
        # Eliminar otros patrones no deseados
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

    def traducir_texto(self, texto: str) -> str:
        """Traduce texto inglés->español con manejo de errores"""
        if not texto or not isinstance(texto, str):
            return ""
        
        # Si no parece contener inglés, devolver original
        if not re.search(r'[a-zA-Z]{3,}', texto):
            return texto
        
        try:
            prompt = PROMPT_TRADUCCION.format(texto=texto)
            resultado = self.procesar_con_deepseek(prompt, temperatura=0.3)
            return self.limpiar_texto(resultado) if resultado else texto
        except Exception as e:
            print(f"Error traduciendo: {str(e)}")
            return texto

    def normalizar_campo(self, campo: str, valor: Any, area: str) -> Any:
        """Normalización avanzada de campos"""
        if not valor:
            return valor
        
        # Campos especiales
        if campo.lower() == 'presupuesto':
            return self.normalizar_presupuesto(valor)
        
        if campo.lower() == 'fecha':
            return self.normalizar_fecha(valor)
        
        if campo.lower() == 'area':
            return self.normalizar_area(valor)
        
        if campo.lower() in ['unidad_de_negocio', 'unidad de negocio']:
            return self.normalizar_unidad_negocio(valor)
        
        try:
            prompt = PROMPT_NORMALIZACION.format(
                campo=campo,
                valor=str(valor),
                area=area
            )
            resultado = self.procesar_con_deepseek(prompt, temperatura=0.2)
            return self.limpiar_texto(resultado) if resultado else valor
        except Exception as e:
            print(f"Error normalizando {campo}: {str(e)}")
            return valor

    def normalizar_presupuesto(self, valor: str) -> str:
        """Normalización de montos monetarios"""
        try:
            # Limpiar caracteres no numéricos
            valor_limpio = re.sub(r'[^\d.,]', '', str(valor))
            
            # Convertir a float
            if '.' in valor_limpio and ',' in valor_limpio:
                # Formato 1.000,00
                num = float(valor_limpio.replace('.', '').replace(',', '.'))
            elif ',' in valor_limpio:
                # Formato 1000,00
                num = float(valor_limpio.replace(',', '.'))
            else:
                # Formato 1000.00 o 1000
                num = float(valor_limpio)
            
            return f"{num:,.2f} USD"
        except:
            return str(valor)

    def normalizar_fecha(self, fecha: str) -> str:
        """Normalización robusta de fechas a formato DD-MM-AAAA"""
        try:
            if not fecha:
                return "01-01-2023"  # Fecha por defecto
            
            fecha = str(fecha).strip()
            formatos_entrada = [
                '%Y-%m-%d', '%d-%m-%Y', '%m/%d/%Y', 
                '%Y/%m/%d', '%d/%m/%Y', '%B %Y', '%b %Y',
                '%B %d, %Y', '%b %d, %Y', '%Y'
            ]
            
            for fmt in formatos_entrada:
                try:
                    dt = datetime.strptime(fecha, fmt)
                    return dt.strftime('%d-%m-%Y')
                except ValueError:
                    continue
                    
            # Intento con solo año
            if re.match(r'^\d{4}$', fecha):
                return f"01-01-{fecha}"
                
            return fecha  # Si no se puede normalizar, devolver original
        except Exception:
            return fecha

    def normalizar_area(self, valor: str) -> str:
        """Normaliza el área a una de las predefinidas"""
        if not valor:
            return "Tecnologías de Información y Comunicación (TIC)"
        
        # Buscar coincidencia exacta
        for area in AREAS_PREDEFINIDAS:
            if area.lower() in valor.lower():
                return area
        
        # Buscar por palabras clave
        palabras_clave = {
            'telecom': 'Comunicaciones y Telecomunicaciones',
            'redes': 'Redes Informáticas',
            'cableado': 'Redes de Cableado Estructurado',
            'fibra': 'Redes de Fibra Óptica',
            'software': 'Desarrollo de Software',
            'seguridad': 'Seguridad Informática',
            'videovigilancia': 'Videovigilancia en Circuito Cerrado',
            'soporte': 'Soporte Técnico',
            'sdi': 'Sistema de Distribución de Información (SDI)',
            'datos': 'Tecnología de Datos'
        }
        
        for palabra, area in palabras_clave.items():
            if palabra in valor.lower():
                return area
        
        return "Tecnologías de Información y Comunicación (TIC)"

    def normalizar_unidad_negocio(self, valor: str) -> str:
        """Normaliza la unidad de negocio"""
        if not valor:
            return "Servicios TI"
        
        valor = str(valor).strip().title()
        
        # Normalizaciones comunes
        normalizaciones = {
            'Otr Servicios Ti': 'Servicios TI',
            'Servicios Tic': 'Servicios TI',
            'Telecomunicaciones': 'Servicios de Telecomunicaciones',
            'It Services': 'Servicios TI',
            'Tecnología': 'Servicios TI'
        }
        
        return normalizaciones.get(valor, valor)

    def generar_titulo_seo(self, item: Dict[str, Any]) -> str:
        """Genera título SEO único y profesional"""
        intentos = 0
        max_intentos = 3
        
        while intentos < max_intentos:
            prompt = PROMPT_TITULO_SEO.format(
                area=item.get('Área', ''),
                cliente=item.get('Cliente', ''),
                descripcion=item.get('Descripción', '')
            )
            
            titulo = self.procesar_con_deepseek(prompt)
            titulo = self.limpiar_texto(titulo)
            
            if not titulo:
                return item.get('Título', '')
            
            # Verificar que no empiece con palabras repetidas
            primera_palabra = titulo.split()[0].lower() if titulo else ''
            palabras_inicio_prohibidas = {'optimización', 'implementación', 'sistema', 'despliegue', 'solución'}
            if primera_palabra in palabras_inicio_prohibidas:
                intentos += 1
                continue
                
            # Verificar que no sea un título ya usado
            if titulo.lower() not in self.titulos_utilizados:
                self.titulos_utilizados.add(titulo.lower())
                return titulo
                
            intentos += 1
        
        # Si no se genera uno nuevo, usar el existente limpiado
        return self.limpiar_texto(item.get('Título', ''))

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
        
        descripcion = self.procesar_con_deepseek(prompt)
        descripcion = self.limpiar_texto(descripcion)
        
        # Si no se generó o es muy corta, combinar manualmente
        if not descripcion or len(descripcion.split()) < 20:
            descripcion = f"{desc_breve}. {desc_ampliada}".strip()
        
        return descripcion

    def extraer_cliente(self, item: Dict[str, Any]) -> str:
        """Extrae y normaliza el nombre del cliente"""
        cliente = item.get('Cliente', '')
        if not cliente:
            # Intentar extraer de la descripción
            desc = f"{item.get('Descripción', '')} {item.get('Descripción_Ampliada', '')}"
            patrones = [
                r'para (?:el |la )?(Gobierno de \w+|Municipalidad de \w+)',
                r'para (?:el |la )?([A-Z][a-z]+(?: [A-Z][a-z]+)*)',
                r'en (?:el |la )?(Ministerio de \w+|Secretaría de \w+)',
                r'contratado por ([\w\s]+)'
            ]
            
            for patron in patrones:
                match = re.search(patron, desc, re.IGNORECASE)
                if match:
                    cliente = match.group(1).title()
                    break
        
        # Normalizaciones comunes
        normalizaciones = {
            'Copa América 2012 Stadium Malvinas Argentinas Client': 'Gobierno de Mendoza',
            'Aeropuertos Argentina 2000 Client': 'Aeropuertos Argentina 2000',
            'Municipality of San Isidro Client': 'Municipalidad de San Isidro'
        }
        
        return normalizaciones.get(cliente, cliente.title())

    def procesar_item(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """Procesamiento completo de un antecedente"""
        try:
            # 1. Traducción de campos en inglés
            item_traducido = {
                k: self.traducir_texto(v) if isinstance(v, str) else v
                for k, v in item.items()
            }
            
            # 2. Extraer y normalizar cliente
            cliente_normalizado = self.extraer_cliente(item_traducido)
            item_traducido['Cliente'] = cliente_normalizado
            
            # 3. Generar título SEO mejorado
            titulo_actual = item_traducido.get('Título', '')
            nuevo_titulo = self.generar_titulo_seo(item_traducido)
            item_traducido['Título'] = nuevo_titulo if nuevo_titulo else titulo_actual
            
            # 4. Unificar descripciones
            descripcion_unificada = self.unificar_descripciones(item_traducido)
            item_traducido['Descripción'] = descripcion_unificada
            item_traducido.pop('Descripción_Ampliada', None)  # Eliminar campo antiguo
            
            # 5. Normalizar campos clave
            campos_normalizar = {
                'Área': 'Área',
                'Unidad_de_negocio': 'Unidad_de_negocio',
                'Monto_contratado': 'Presupuesto',
                'Fecha': 'Fecha'
            }
            
            for campo_orig, campo_dest in campos_normalizar.items():
                if campo_orig in item_traducido:
                    valor_normalizado = self.normalizar_campo(
                        campo_orig,
                        item_traducido[campo_orig],
                        item_traducido.get('Área', '')
                    )
                    item_traducido[campo_dest] = valor_normalizado
                    if campo_orig != campo_dest:
                        item_traducido.pop(campo_orig, None)
            
            # 6. Generar palabras clave para SEO
            item_traducido['Palabras_clave'] = self.generar_palabras_clave(item_traducido)
            
            # 7. Estructura final para Directus
            item_final = {
                "Titulo": self.limpiar_texto(item_traducido.get('Título', '')),
                "Descripcion": self.limpiar_texto(item_traducido.get('Descripción', '')),
                "Fecha": self.limpiar_texto(item_traducido.get('Fecha', '01-01-2023')),
                "Cliente": self.limpiar_texto(item_traducido.get('Cliente', '')),
                "Unidad_de_negocio": self.limpiar_texto(item_traducido.get('Unidad_de_negocio', 'Servicios TI')),
                "Presupuesto": self.limpiar_texto(item_traducido.get('Presupuesto', '0,00 USD')),
                "Area": self.limpiar_texto(item_traducido.get('Área', 'Tecnologías de Información y Comunicación (TIC)')),
                "Palabras_clave": self.limpiar_texto(item_traducido.get('Palabras_clave', '')),
                "status": "published",
                "sort": 0
            }
            
            return item_final
        
        except Exception as e:
            print(f"\nError procesando item: {str(e)}")
            return item

    def generar_palabras_clave(self, item: Dict[str, Any]) -> str:
        """Genera palabras clave para SEO basadas en el contenido"""
        try:
            texto = f"{item.get('Título', '')} {item.get('Descripción', '')} {item.get('Área', '')}"
            palabras = re.findall(r'\b[\w+]+\b', texto.lower())
            stopwords = {'para', 'con', 'los', 'las', 'del', 'una', 'por', 'como', 'para', 'mediante'}
            
            frecuencias = {}
            for palabra in palabras:
                if len(palabra) > 3 and palabra not in stopwords:
                    frecuencias[palabra] = frecuencias.get(palabra, 0) + 1
            
            # Ordenar por frecuencia y tomar las top 5 únicas
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

    def verificar_calidad(self, item: Dict[str, Any]) -> List[str]:
        """Verificación exhaustiva de calidad del item procesado"""
        problemas = []
        
        # Campos requeridos
        campos_requeridos = ['Titulo', 'Descripcion', 'Cliente', 'Area']
        for campo in campos_requeridos:
            if not item.get(campo):
                problemas.append(f"Campo requerido vacío: {campo}")
        
        # Longitud mínima descripción
        if len(item.get('Descripcion', '').split()) < 30:
            problemas.append("Descripción demasiado corta (mínimo 30 palabras)")
        
        # Caracteres inválidos
        for k, v in item.items():
            if isinstance(v, str) and re.search(r'[\x00-\x1F\x7F]', v):
                problemas.append(f"Caracteres inválidos en {k}")
        
        # Inglés residual
        for k, v in item.items():
            if isinstance(v, str) and re.search(r'\b[a-zA-Z]{4,}\b', v) and not re.search(r'(IEEE|WiFi|IP|Cisco|VMware)', v):
                problemas.append(f"Texto en inglés detectado en {k}: {v[:50]}...")
        
        # Formato fecha
        if item.get('Fecha'):
            if not re.match(r'^\d{2}-\d{2}-\d{4}$', item['Fecha']):
                problemas.append(f"Formato fecha incorrecto: {item['Fecha']}")
        
        # Títulos duplicados
        titulo = item.get('Titulo', '').lower()
        if titulo in self.titulos_utilizados:
            problemas.append(f"Título duplicado: {titulo[:50]}...")
        else:
            self.titulos_utilizados.add(titulo)
        
        return problemas

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
                print(f"\nProblemas en item: {item_procesado.get('Titulo', '')}")
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
        
        print(f"\nProceso completado. Registros: {len(resultados)}")
        print(f"Problemas detectados: {problemas_totales}")
        print(f"Archivo generado: {OUTPUT_FILE}")
        
        return resultados
    
    except Exception as e:
        print(f"\nError guardando resultados: {str(e)}")
        return []

if __name__ == "__main__":
    print("\n" + "="*60)
    print(" ENRIQUECEDOR DE ANTECEDENTES TÉCNICOS CON DEEPSEEK-R1")
    print(f" Modelo: {MODEL} | Entrada: {INPUT_FILE}")
    print("="*60 + "\n")
    
    resultados = procesar_antecedentes()
    
    if resultados and TEST_MODE:
        print("\nMuestra del primer registro procesado:")
        print(json.dumps(resultados[0], indent=2, ensure_ascii=False))