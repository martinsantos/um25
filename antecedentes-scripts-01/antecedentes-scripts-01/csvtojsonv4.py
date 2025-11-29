import json
import pandas as pd
from datetime import datetime
import os
import sys
import re
from typing import Union, Any
from tqdm import tqdm  # Asegúrate de instalarlo con: pip install tqdm
import numpy as np


# ==============================================================================
# Función de Moneda Mejorada (Versión Corregida)
# ==============================================================================
def format_currency_flexible(amount_str: Union[str, None]) -> Union[float, None]:
    """
    Limpia y convierte strings de montos en diversos formatos (USD/ARS, $/,.)
    a un valor flotante. Maneja correctamente los formatos argentinos.
    Devuelve None si la conversión falla o el input es inválido/nulo.
    """
    if pd.isna(amount_str) or not isinstance(amount_str, str) or not amount_str.strip():
        return None

    original_value = amount_str.strip()
    cleaned = original_value

    try:
        # Eliminar símbolos de moneda y espacios
        cleaned = cleaned.lower()
        cleaned = cleaned.replace("usd", "").replace("ars", "").replace("pesos", "")
        cleaned = cleaned.replace("$", "").strip()
        
        # Manejar formato argentino (punto para miles, coma para decimales)
        if ',' in cleaned and '.' in cleaned:
            # Formato con ambos: 1.234,56 o 1,234.56
            if cleaned.find(',') < cleaned.find('.'):  # 1,234.56 -> formato inglés
                cleaned = cleaned.replace(',', '')
            else:  # 1.234,56 -> formato argentino
                cleaned = cleaned.replace('.', '').replace(',', '.')
        elif ',' in cleaned:  # Solo coma, asumir decimales
            cleaned = cleaned.replace(',', '.')
        
        # Eliminar cualquier otro carácter no numérico excepto punto
        cleaned = re.sub(r'[^\d.]', '', cleaned)
        
        # Convertir a float
        return float(cleaned) if cleaned else None

    except (ValueError, TypeError) as e:
        print(f"Advertencia: No se pudo convertir el monto '{original_value}' (procesado como '{cleaned}'): {e}. Se devolverá None.")
        return None

# ==============================================================================
# Función de Fecha Mejorada (Versión 2)
# ==============================================================================
def format_dd_mm_yyyy(date_value: Any) -> Union[str, None]:
    """
    Intenta formatear la fecha a 'DD-MM-YYYY'.
    Maneja strings (varios formatos), Timestamps, y números seriales de Excel.
    Devuelve None si no se puede formatear.
    """
    if pd.isna(date_value):
        return None

    original_value = str(date_value)

    try:
        # Caso 1: Ya es datetime o Timestamp de Pandas
        if isinstance(date_value, (datetime, pd.Timestamp)):
            return date_value.strftime("%d-%m-%Y")

        # Caso 2: Es string
        elif isinstance(date_value, str):
            cleaned_date_str = date_value.strip()

            # Subcaso 2.1: Número serial de Excel
            if cleaned_date_str.isdigit():
                try:
                    serial_num = int(cleaned_date_str)
                    if 20000 < serial_num < 60000:
                        dt = pd.to_datetime(serial_num, unit='D', origin='1899-12-30')
                        return dt.strftime("%d-%m-%Y")
                    else:
                        print(f"Advertencia: Valor numérico '{original_value}' no parece fecha serial válida de Excel. Ignorando.")
                except (ValueError, TypeError, OverflowError) as e_serial:
                    print(f"Advertencia: Posible fecha serial '{original_value}' no pudo convertirse ({e_serial}). Intentando otros formatos.")

            # Subcaso 2.2: Intentar formatos de string comunes
            common_formats = [
                "%d/%m/%Y", "%d-%m-%Y", "%Y/%m/%d", "%m/%d/%Y", 
                "%d.%m.%Y", "%Y-%m-%d", "%d/%m/%y", "%d-%m-%y"
            ]
            for fmt in common_formats:
                try:
                    return datetime.strptime(cleaned_date_str, fmt).strftime("%d-%m-%Y")
                except ValueError:
                    continue

            print(f"Advertencia: Formato de fecha string no reconocido '{original_value}'. Se devolverá None.")
            return None

        # Caso 3: Es número (pero no se leyó como string)
        elif isinstance(date_value, (int, float)):
            try:
                serial_num = int(date_value)
                if 20000 < serial_num < 60000:
                    dt = pd.to_datetime(serial_num, unit='D', origin='1899-12-30')
                    return dt.strftime("%d-%m-%Y")
                else:
                    print(f"Advertencia: Valor numérico '{original_value}' no parece fecha serial válida. Se devolverá None.")
                    return None
            except (ValueError, TypeError, OverflowError):
                print(f"Advertencia: Número '{original_value}' no pudo convertirse como fecha serial. Se devolverá None.")
                return None

        # Caso 4: Otro tipo inesperado
        else:
            print(f"Advertencia: Tipo de fecha inesperado '{type(date_value)}' para valor '{original_value}'. Se devolverá None.")
            return None

    except Exception as e:
        print(f"Error inesperado formateando fecha '{original_value}': {e}. Se devolverá None.")
        return None

# ==============================================================================
# Funciones Auxiliares
# ==============================================================================
def clean_text_for_description(text: str) -> str:
    if pd.isna(text) or not isinstance(text, str):
        return ""
    return text.strip().strip('.').strip()

def build_custom_description(cliente: Union[str, None], servicios: Union[str, None]) -> str:
    cliente_clean = clean_text_for_description(cliente)
    servicios_clean = clean_text_for_description(servicios)
    parts = [part for part in [cliente_clean, servicios_clean] if part]
    if not parts:
        return "No hay descripción disponible."
    else:
        return " - ".join(parts)

def generate_clean_keywords(area, services) -> str:
    keywords = []
    if area and isinstance(area, str):
        unique_areas = ". ".join(list(dict.fromkeys(part.strip() for part in area.split('.') if part.strip())))
        keywords.extend(unique_areas.lower().split())
    if services and isinstance(services, str):
        keywords.extend(services.lower().split())

    if not keywords:
        return "No especificado"

    cleaned_words = set()
    for word in keywords:
        cleaned_word = word.strip('.,;:"\'()[]{}!¡¿?').lower()
        if len(cleaned_word) > 3:
            cleaned_words.add(cleaned_word)

    return ", ".join(sorted(list(cleaned_words))) if cleaned_words else "No especificado"

def clean_presupuesto(value):
    # Removemos los caracteres no numéricos excepto el punto
    cleaned = re.sub(r"[^\d.]", "", value)
    try:
        return float(cleaned)
    except ValueError:
        return None

# ==============================================================================
# Función Principal Mejorada
# ==============================================================================
def csv_to_target_json(input_file: str):
    """
    Lee un archivo CSV, procesa sus datos y exporta a JSON con mejor manejo de:
    - Construcción inteligente del título
    - Validación de datos esenciales
    - Manejo de errores por fila
    - Limpieza de datos consistente
    """
    # Lectura del CSV con manejo mejorado de codificaciones
    try:
        df = pd.read_csv(input_file, encoding='utf-8', dtype=str)
        print(f"✓ CSV '{input_file}' leído exitosamente (UTF-8)")
    except UnicodeDecodeError:
        try:
            df = pd.read_csv(input_file, encoding='latin-1', dtype=str)
            print(f"✓ CSV '{input_file}' leído exitosamente (Latin-1)")
        except Exception as e:
            print(f"✗ Error fatal en lectura: {e}")
            sys.exit(1)
    except Exception as e:
        print(f"✗ Error inesperado: {e}")
        sys.exit(1)

    # Preprocesamiento de datos
    df = df.replace({np.nan: None, '': None})
    
    # Validación de columnas críticas
    REQUIRED_COLUMNS = {'Cliente/Organismo', 'Area', 'Servicios'}
    missing_columns = REQUIRED_COLUMNS - set(df.columns)
    if missing_columns:
        print(f"✗ Columnas requeridas faltantes: {', '.join(missing_columns)}")
        sys.exit(1)

    # Procesamiento de filas con manejo de errores individual
    all_records = []
    error_count = 0
    
    print(f"\nProcesando {len(df)} registros...")
    for index, row in tqdm(df.iterrows(), total=len(df), desc="Progreso"):
        try:
            # Extracción y limpieza de datos
            cliente = clean_text_for_description(row['Cliente/Organismo']) or "No especificado"
            area = clean_text_for_description(row['Area']) or "No especificado"
            servicios = clean_text_for_description(row['Servicios'])
            
            # Construcción inteligente del título
            title_components = []
            if cliente != "No especificado":
                title_components.append(cliente)
            if area != "No especificado":
                title_components.append(area)
                
            titulo = " - ".join(title_components) if title_components else "Proyecto sin título"
            
            # Procesamiento condicional de área
            if area != "No especificado":
                area = ". ".join(
                    dict.fromkeys(
                        part.strip() 
                        for part in area.split('.') 
                        if part.strip()
                    )
                )
            
            # Construcción del registro
            record = {
                "id": index + 1,
                "status": "published",
                "Fecha": format_dd_mm_yyyy(row.get('Fecha de final')),
                "Presupuesto": format_currency_flexible(row.get('Monto contratado')),
                "Area": area,
                "Descripcion": build_custom_description(cliente, servicios),
                "Palabras_clave": generate_clean_keywords(row.get('Area'), servicios),
                "Cliente": cliente,
                "Titulo": titulo,
                "Unidad_de_negocio": row.get('Unidad de Negocio ID') or "No especificado",
                "Metadata": {
                    "Creado_por": row.get('Nombre Contacto responsable'),
                    "Antecedentes": clean_text_for_description(row.get('Antecedente')),
                    "Fecha_procesamiento": datetime.now().strftime("%d-%m-%Y %H:%M")
                }
            }
            
            all_records.append(record)
            
        except Exception as e:
            error_count += 1
            print(f"\n⚠ Error en fila {index + 1}: {str(e)}")
            if 'row' in locals():
                print(f"Datos problemáticos: {dict(row.dropna())}")

    # Generación del archivo de salida
    output_file = f"{os.path.splitext(input_file)[0]}_output_{datetime.now().strftime('%Y%m%d')}.json"
    
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(all_records, f, ensure_ascii=False, indent=2, default=str)
        
        print(f"\n✅ Conversión exitosa: {len(all_records)} registros procesados")
        print(f"   - Archivo generado: {output_file}")
        print(f"   - Registros con errores: {error_count}")
        
    except Exception as e:
        print(f"\n✗ Error crítico al guardar JSON: {e}")
        sys.exit(1)

# --- Bloque principal ---
if __name__ == "__main__":
    print("\n--- Conversor CSV a JSON (Formato Destino Específico - v4) ---")
    print("-------------------------------------------------------------")
    input_filename = input("Ingrese el nombre del archivo CSV (ej: ante2025.csv): ")

    if not input_filename.lower().endswith('.csv'):
        print("Error: El nombre del archivo debe terminar con '.csv'")
        sys.exit(1)
    if not os.path.exists(input_filename):
         print(f"Error: El archivo '{input_filename}' no fue encontrado en la ruta actual.")
         sys.exit(1)

    csv_to_target_json(input_filename)