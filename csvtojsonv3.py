import json
import pandas as pd
from datetime import datetime
import os
import sys
import re
from typing import Union, Any

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
# Función Principal
# ==============================================================================
def csv_to_target_json(input_file: str):
    """
    Lee un archivo CSV, procesa sus datos según la estructura JSON deseada y exporta.
    """
    try:
        df = pd.read_csv(input_file, encoding='utf-8', dtype=str)
        print(f"Archivo CSV '{input_file}' leído exitosamente (como texto).")
    except FileNotFoundError:
        print(f"Error: El archivo '{input_file}' no fue encontrado.")
        sys.exit(1)
    except UnicodeDecodeError:
        print("Error de codificación UTF-8. Intentando con 'latin-1'...")
        try:
            df = pd.read_csv(input_file, encoding='latin-1', dtype=str)
            print(f"Archivo CSV '{input_file}' leído exitosamente con 'latin-1' (como texto).")
        except Exception as e:
            print(f"Error al leer el archivo CSV con 'latin-1': {e}")
            sys.exit(1)
    except Exception as e:
        print(f"Error inesperado al leer el archivo CSV: {e}")
        sys.exit(1)

    df.fillna('', inplace=True)
    df = df.replace({'' : None})

    expected_csv_columns = [
        'Antecedente', 'Area', 'Cliente/Organismo', 'Servicios',
        'Nombre Contacto responsable',
        'Monto contratado', 'Unidad de Negocio ID', 'Fecha de final'
    ]

    actual_columns = df.columns.tolist()
    missing_columns = [col for col in expected_csv_columns if col not in actual_columns]
    if missing_columns:
        print(f"Información: Faltan las siguientes columnas opcionales en el CSV: {missing_columns}")

    all_records = []
    print("Procesando filas para formato JSON destino...")

    for index, row in df.iterrows():
        cliente_org = row.get('Cliente/Organismo')
        servicios = row.get('Servicios')
        area_csv = row.get('Area')
        fecha_final_csv = row.get('Fecha de final')
        monto_csv = row.get('Monto contratado')
        unidad_negocio_csv = row.get('Unidad de Negocio ID')

        # Usar la función mejorada que itera sobre posibles formatos para el presupuesto
        presupuesto_float = format_currency_flexible(monto_csv)
        fecha_formateada = format_dd_mm_yyyy(fecha_final_csv)

        descripcion_final = build_custom_description(cliente_org, servicios)
        palabras_clave = generate_clean_keywords(area_csv, servicios)
        cliente_final = clean_text_for_description(cliente_org) or "No especificado"
        area_final = clean_text_for_description(area_csv) or "No especificado"
        if area_final != "No especificado":
             area_final = ". ".join(list(dict.fromkeys(part.strip() for part in area_final.split('.') if part.strip())))

        data = {
            "id": index + 1,
            "status": "published",
            "sort": None,
            "user_created": None,
            "date_created": datetime.now().isoformat(),
            "Imagen": None,
            "Archivo": None,
            "Fecha": fecha_formateada,
            "Presupuesto": presupuesto_float,
            "Area": area_final,
            "Descripcion": descripcion_final,
            "Unidad_de_negocio": unidad_negocio_csv or "No especificado",
            "Palabras_clave": palabras_clave,
            "Cliente": cliente_final,
            "Titulo": f"{cliente_final} - {area_final}"
        }

        all_records.append(data)

    base_filename = os.path.splitext(os.path.basename(input_file))[0]
    output_filename = f"{base_filename}_output_v4.json"

    try:
        with open(output_filename, 'w', encoding='utf-8') as f:
            json.dump(all_records, f, ensure_ascii=False, indent=4, default=str)
        print(f"\nArchivo '{output_filename}' creado exitosamente.")
        print(f"Total de registros procesados: {len(all_records)}")
    except Exception as e:
        print(f"Error al guardar el archivo JSON: {e}")
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