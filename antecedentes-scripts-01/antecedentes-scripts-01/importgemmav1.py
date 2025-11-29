import json
import requests
from tqdm import tqdm
from datetime import datetime
import re
import unicodedata
from typing import Dict, Any, List, Optional

# Configuración
MODEL = "gemma"  # Cambiado a Gemma
OLLAMA_URL = "http://localhost:11434/api/generate"
INPUT_FILE = "antecedentes_enriquecidos_v5.json"
OUTPUT_FILE = "antecedentes_gemma_v1.json"
TEST_MODE = True
MAX_TEST_RECORDS = 10

# Áreas predefinidas (igual que antes)
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

# Prompts optimizados para Gemma
PROMPT_TITULO_SEO = """Genera un título SEO optimizado en español (50-70 caracteres) con esta estructura:
[Solución técnica] + [Beneficio cuantificable] + [Sector]

Requisitos:
- NO uses "Optimización" ni "Implementación" como primeras palabras
- Enfoque B2B profesional
- Palabras clave para posicionamiento web
- Basado en este contexto:
Área: {area}
Cliente: {cliente}
Descripción: {descripcion}

Ejemplos válidos:
"Plataforma Cloud: Reducción de Costos para Empresas Retail"
"Solución de Fibra Óptica: Conectividad de Alta Velocidad para Municipios"

Devuelve SOLO el título final sin comentarios:"""

PROMPT_DESCRIPCION_UNIFICADA = """Combina estas descripciones en un texto profesional (30-100 palabras):
- Problema inicial
- Solución técnica implementada
- Tecnologías utilizadas
- Resultados medibles

Contexto:
Título: {titulo}
Área: {area}
Cliente: {cliente}
Descripción breve: {desc_breve}
Descripción ampliada: {desc_ampliada}

Ejemplo:
"El cliente necesitaba mejorar la conectividad en su sede central. Implementamos una red WiFi 6 de alta densidad con tecnología Cisco, cubriendo 15,000 m². La solución soporta 1,000 dispositivos simultáneos con un 99.9% de disponibilidad, reduciendo costos en 40%."

Devuelve SOLO la descripción unificada:"""

PROMPT_TRADUCCION = """Traduce este texto técnico al español (conserva marcas como Cisco/VMware):
{texto}

Devuelve SOLO la traducción sin comentarios:"""

PROMPT_NORMALIZACION = """Normaliza este valor para un sistema técnico:
Campo: {campo}
Valor actual: {valor}
Área relacionada: {area}

Instrucciones:
- Usa terminología técnica en español
- Formatea números, fechas correctamente
- Mantén nombres propios
- Ejemplos:
  "941376.0" → "941.376,00 USD"
  "March 2025" → "01-03-2025"

Devuelve SOLO el valor normalizado:"""

class AntecedenteProcessor:
    def __init__(self):
        self.titulos_utilizados = set()
        self.modelo = MODEL
        self.url_api = OLLAMA_URL
        self.timeout = 120

    def generar_con_gemma(self, prompt: str, temp: float = 0.5) -> Optional[str]:
        """Generación con Gemma optimizada para respuestas limpias"""
        try:
            payload = {
                "model": self.modelo,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": temp,
                    "num_ctx": 4096,
                    "stop": ["\n", "```"]  # Para evitar bloques de código
                }
            }
            
            response = requests.post(self.url_api, json=payload, timeout=self.timeout)
            response.raise_for_status()
            
            respuesta = response.json().get("response", "")
            return self.limpiar_respuesta(respuesta)
            
        except Exception as e:
            print(f"\nError en API: {str(e)}")
            return None

    def limpiar_respuesta(self, texto: str) -> str:
        """Limpieza profunda de respuestas del modelo"""
        if not texto:
            return ""
        
        # Eliminar patrones comunes en Gemma
        patrones = [
            r'<.*?>',          # Tags HTML/XML
            r'```.*?```',      # Bloques de código
            r'\[.*?\]',        # Corchetes
            r'^\W+',           # Caracteres no alfanuméricos al inicio
            r'\b(?:Note|Example|Output):.*$'  # Comentarios del modelo
        ]
        
        for patron in patrones:
            texto = re.sub(patron, '', texto, flags=re.DOTALL | re.MULTILINE)
        
        # Normalización final
        texto = unicodedata.normalize('NFKC', texto.strip())
        return ' '.join(texto.split())

    def traducir_texto(self, texto: str) -> str:
        """Traducción mejorada con Gemma"""
        if not texto or not isinstance(texto, str):
            return ""
        
        if not re.search(r'[a-zA-Z]{3,}', texto):
            return texto
        
        try:
            prompt = PROMPT_TRADUCCION.format(texto=texto)
            resultado = self.generar_con_gemma(prompt, 0.3)
            return resultado if resultado else texto
        except Exception as e:
            print(f"Error traduciendo: {str(e)}")
            return texto

    def normalizar_valor(self, campo: str, valor: Any, area: str) -> Any:
        """Normalización con Gemma para tipos específicos"""
        if not valor:
            return valor
        
        # Manejo especial para campos numéricos y fechas
        if campo.lower() == 'presupuesto':
            try:
                num = float(re.sub(r'[^\d.]', '', str(valor)))
                return f"{num:,.2f} USD"
            except:
                return str(valor)
        
        if campo.lower() == 'fecha':
            return self.normalizar_fecha(valor)
        
        # Para otros campos, usamos Gemma
        prompt = PROMPT_NORMALIZACION.format(
            campo=campo,
            valor=str(valor),
            area=area
        )
        resultado = self.generar_con_gemma(prompt, 0.2)
        return resultado if resultado else valor

    def normalizar_fecha(self, fecha: str) -> str:
        """Normalización robusta de fechas"""
        try:
            formatos = ['%Y-%m-%d', '%d-%m-%Y', '%m/%d/%Y', '%Y/%m/%d', '%d/%m/%Y']
            for fmt in formatos:
                try:
                    dt = datetime.strptime(str(fecha), fmt)
                    return dt.strftime('%d-%m-%Y')
                except ValueError:
                    continue
            return str(fecha)
        except:
            return "01-01-2023"

    def generar_titulo_optimizado(self, item: Dict[str, Any]) -> str:
        """Generación de títulos con Gemma evitando repeticiones"""
        max_intentos = 3
        for _ in range(max_intentos):
            prompt = PROMPT_TITULO_SEO.format(
                area=item.get('Área', ''),
                cliente=item.get('Cliente', ''),
                descripcion=item.get('Descripción', '')
            )
            
            titulo = self.generar_con_gemma(prompt)
            if not titulo:
                continue
                
            # Verificar unicidad y requisitos
            primeras_palabras = titulo.split()[0].lower()
            if (primeras_palabras not in {'optimización', 'implementación', 'sistema'} and
                titulo.lower() not in self.titulos_utilizados):
                self.titulos_utilizados.add(titulo.lower())
                return titulo
        
        return self.limpiar_respuesta(item.get('Título', ''))

    def crear_descripcion_unificada(self, item: Dict[str, Any]) -> str:
        """Fusión de descripciones con Gemma"""
        prompt = PROMPT_DESCRIPCION_UNIFICADA.format(
            titulo=item.get('Título', ''),
            area=item.get('Área', ''),
            cliente=item.get('Cliente', ''),
            desc_breve=item.get('Descripción', ''),
            desc_ampliada=item.get('Descripción_Ampliada', '')
        )
        
        descripcion = self.generar_con_gemma(prompt)
        if not descripcion or len(descripcion.split()) < 25:
            descripcion = f"{item.get('Descripción', '')} {item.get('Descripción_Ampliada', '')}".strip()
        
        return descripcion

    def procesar_item(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """Pipeline completo de procesamiento"""
        try:
            # 1. Traducción y limpieza inicial
            item_limpio = {
                k: self.traducir_texto(v) if isinstance(v, str) else v
                for k, v in item.items()
            }
            
            # 2. Generación de campos mejorados
            item_limpio['Título'] = self.generar_titulo_optimizado(item_limpio)
            item_limpio['Descripción'] = self.crear_descripcion_unificada(item_limpio)
            
            # 3. Normalización de campos
            campos_a_normalizar = {
                'Área': self.normalizar_area,
                'Unidad_de_negocio': self.normalizar_unidad_negocio,
                'Monto_contratado': lambda v, _: self.normalizar_valor('presupuesto', v, ''),
                'Fecha': lambda v, _: self.normalizar_fecha(v)
            }
            
            for campo, func in campos_a_normalizar.items():
                if campo in item_limpio:
                    item_limpio[campo] = func(item_limpio[campo], item_limpio.get('Área', ''))
            
            # 4. Estructura final para Directus
            return {
                "Titulo": item_limpio['Título'],
                "Descripcion": item_limpio['Descripción'],
                "Fecha": item_limpio.get('Fecha', '01-01-2023'),
                "Cliente": self.normalizar_cliente(item_limpio),
                "Unidad_de_negocio": item_limpio.get('Unidad_de_negocio', 'Servicios TI'),
                "Presupuesto": item_limpio.get('Presupuesto', '0,00 USD'),
                "Area": item_limpio.get('Área', 'Tecnologías de Información y Comunicación (TIC)'),
                "Palabras_clave": self.generar_palabras_clave(item_limpio),
                "status": "published",
                "sort": 0
            }
            
        except Exception as e:
            print(f"\nError procesando item: {str(e)}")
            return item

    # ... (métodos auxiliares como normalizar_area, normalizar_unidad_negocio, generar_palabras_clave, etc.)

def procesar_antecedentes():
    """Función principal de ejecución"""
    processor = AntecedenteProcessor()
    
    try:
        with open(INPUT_FILE, 'r', encoding='utf-8') as f:
            datos = json.load(f)
    except Exception as e:
        print(f"\nError cargando archivo: {str(e)}")
        return []
    
    if TEST_MODE:
        datos = datos[:MAX_TEST_RECORDS]
    
    resultados = []
    for item in tqdm(datos, desc="Procesando"):
        try:
            resultados.append(processor.procesar_item(item))
        except Exception as e:
            print(f"\nError en item: {str(e)}")
            continue
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(resultados, f, indent=2, ensure_ascii=False)
    
    return resultados

if __name__ == "__main__":
    print("\n" + "="*60)
    print(f" ENRIQUECEDOR DE ANTECEDENTES CON {MODEL.upper()}")
    print("="*60 + "\n")
    
    resultados = procesar_antecedentes()
    
    if TEST_MODE and resultados:
        print("\nMuestra del resultado:")
        print(json.dumps(resultados[0], indent=2, ensure_ascii=False))