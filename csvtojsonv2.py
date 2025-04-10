import json
import pandas as pd
from datetime import datetime
import os
import sys
import re
import uuid
from typing import Union, Any # Import Any for date_value flexibility

# ==============================================================================
# Función de Moneda Mejorada
# ==============================================================================
def format_currency_flexible(amount_str: Union[str, None]) -> Union[float, None]:
    """
    Limpia y convierte strings de montos en diversos formatos (USD/ARS, $/,.)
    a un valor flotante.
    Devuelve None si la conversión falla o el input es inválido/nulo.
    """
    if pd.isna(amount_str) or not isinstance(amount_str, str):
        return None

    original_value = amount_str # Para mensajes de error claros

    try:
        # 1. Quitar símbolos/texto de moneda comunes (case-insensitive) y espacios
        #    Añade más si encuentras otros (ej: 'eur', '€')
        cleaned = amount_str.lower()
        cleaned = re.sub(r'(usd|ars|pesos|\$)', '', cleaned)
        cleaned = cleaned.strip() # Quitar espacios al inicio/final

        # 2. Determinar separadores y normalizar a formato numérico estándar (con '.' como decimal)
        num_commas = cleaned.count(',')
        num_periods = cleaned.count('.')

        # Escenario: '1.234,56' (coma decimal)
        if num_commas == 1 and num_periods > 0:
            if cleaned.rfind(',') > cleaned.rfind('.'):
                cleaned = cleaned.replace('.', '') # Quitar separador de miles (.)
                cleaned = cleaned.replace(',', '.') # Cambiar coma decimal a punto
            else: # Escenario '1,234.56' (punto decimal) - aunque num_commas sea > 0
                 cleaned = cleaned.replace(',', '') # Quitar separador de miles (,)
        # Escenario: '1,234' (sin decimales, coma como miles) O '1234,56' (coma decimal, sin miles)
        elif num_commas >= 1 and num_periods == 0:
             # Si hay más de una coma, o una sola pero parece ser decimal (ej: ',56')
             if num_commas > 1 or (num_commas==1 and cleaned.find(',') > 0):
                cleaned = cleaned.replace(',', '', num_commas -1) # Quitar comas de miles
             cleaned = cleaned.replace(',', '.') # Asumir/confirmar coma como decimal -> punto
        # Escenario: '1234.56' (punto decimal, sin miles) O '1.234' (punto como miles)
        elif num_periods >= 1 and num_commas == 0:
             # Si hay más de un punto, tratar todos menos el último como miles
             if num_periods > 1:
                 cleaned = cleaned.replace('.', '', num_periods - 1)
             # El último punto ya es el decimal, no hacer nada más
        # Escenario sin separadores: '1234'
        # else: no changes needed

        # 3. Intentar convertir a float
        # Puede que aún falle si quedaron caracteres extraños
        return float(cleaned)

    except (ValueError, TypeError) as e:
        # Devolver None si falla, pero imprimir advertencia útil
        processed_value = cleaned if 'cleaned' in locals() else 'no_procesado'
        print(f"Advertencia: No se pudo convertir el monto '{original_value}' a número (procesado como '{processed_value}'): {e}. Se devolverá None.")
        return None


# ==============================================================================
# Función de Fecha Mejorada
# ==============================================================================
def format_iso_date(date_value: Any) -> Union[str, None]:
    """
    Intenta formatear la fecha a 'YYYY-MM-DD'.
    Maneja strings (varios formatos), Timestamps, y números seriales de Excel.
    Devuelve None si no se puede formatear.
    """
    if pd.isna(date_value):
        return None

    original_value = str(date_value) # Para mensajes de error

    try:
        # Caso 1: Ya es datetime o Timestamp de Pandas
        if isinstance(date_value, (datetime, pd.Timestamp)):
            return date_value.strftime("%Y-%m-%d")

        # Caso 2: Es string
        elif isinstance(date_value, str):
            cleaned_date_str = date_value.strip()
            # Subcaso 2.1: Parece número serial de Excel
            if cleaned_date_str.isdigit():
                try:
                    serial_num = int(cleaned_date_str)
                    # Excel para Windows: base 1899-12-30 (porque considera 1900 bisiesto por error)
                    # Excel para Mac: base 1904-01-01
                    # Pandas to_datetime maneja esto. Origin='excel' usa base Windows.
                    # Hay que tener cuidado con números muy grandes que no sean fechas.
                    # Se asume que números > 25569 (1/1/1970) y < 60000 (aprox 2160) son fechas seriales.
                    if 20000 < serial_num < 60000: # Heurística para evitar convertir IDs numéricos
                         # Probar origen Windows (más común)
                        dt = pd.to_datetime(serial_num, unit='D', origin='1899-12-30')
                        return dt.strftime("%Y-%m-%d")
                    else:
                         print(f"Advertencia: Valor numérico '{original_value}' no parece fecha serial válida de Excel. Ignorando.")
                         # Continuar para intentar parseo de string por si acaso
                except (ValueError, TypeError, OverflowError) as e_serial:
                    print(f"Advertencia: Posible fecha serial '{original_value}' no pudo convertirse ({e_serial}). Intentando otros formatos.")
                    # Continuar para intentar parseo de string

            # Subcaso 2.2: Intentar formatos de string comunes
            # Añadir más formatos si son necesarios
            common_formats = ["%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%Y/%m/%d", "%m/%d/%Y", "%d.%m.%Y"]
            for fmt in common_formats:
                try:
                    return datetime.strptime(cleaned_date_str, fmt).strftime("%Y-%m-%d")
                except ValueError:
                    continue # Probar el siguiente formato

            # Si ningún formato funcionó
            print(f"Advertencia: Formato de fecha string no reconocido '{original_value}'. Se devolverá None.")
            return None

        # Caso 3: Es número (pero no se leyó como string) - menos probable con dtype=str
        elif isinstance(date_value, (int, float)):
            try:
                 serial_num = int(date_value)
                 if 20000 < serial_num < 60000: # Misma heurística
                    dt = pd.to_datetime(serial_num, unit='D', origin='1899-12-30')
                    return dt.strftime("%Y-%m-%d")
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
        # Captura general para errores inesperados durante el formateo
        print(f"Error inesperado formateando fecha '{original_value}': {e}. Se devolverá None.")
        return None

# ==============================================================================
# Funciones Anteriores (sin cambios relevantes aquí, salvo compatibilidad Python)
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

# ==============================================================================
# Función Principal (Llama a las funciones mejoradas)
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
    # ... (resto del manejo de errores de lectura y codificación) ...
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

    # Quitar la columna opcional si se desea no ver la advertencia
    expected_csv_columns = [
        'Antecedente', 'Area', 'Cliente/Organismo', 'Servicios',
        #'Datos contacto referencia', # <--- Comentado si ya no se espera
        'Nombre Contacto responsable',
        'Monto contratado', 'Unidad de Negocio ID', 'Fecha de final'
    ]

    actual_columns = df.columns.tolist()
    missing_columns = [col for col in expected_csv_columns if col not in actual_columns]
    if missing_columns:
        print(f"Información: Faltan las siguientes columnas opcionales en el CSV: {missing_columns}") # Cambiado a Información

    all_records = []
    print("Procesando filas para formato JSON destino...")

    for index, row in df.iterrows():
        # ... (obtener datos con row.get() como antes) ...
        cliente_org = row.get('Cliente/Organismo')
        servicios = row.get('Servicios')
        area_csv = row.get('Area')
        fecha_final_csv = row.get('Fecha de final')
        monto_csv = row.get('Monto contratado')
        unidad_negocio_csv = row.get('Unidad de Negocio ID')

        # <<< --- LLAMAR A LAS NUEVAS FUNCIONES --- >>>
        presupuesto_float = format_currency_flexible(monto_csv)
        fecha_formateada = format_iso_date(fecha_final_csv)
        # <<< ------------------------------------ >>>

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
            "Fecha": fecha_formateada, # Fecha formateada o None
            "Presupuesto": presupuesto_float, # Presupuesto como número o None
            "Area": area_final,
            "Descripcion": descripcion_final,
            "Unidad_de_negocio": unidad_negocio_csv or "No especificado",
            "Palabras_clave": palabras_clave,
            "Cliente": cliente_final,
            "Titulo": f"{cliente_final} - {area_final}"
        }

        all_records.append(data)

    # ... (resto del script: guardar JSON, bloque __main__) ...
    base_filename = os.path.splitext(os.path.basename(input_file))[0]
    # Guardar con otro nombre para ver los nuevos resultados
    output_filename = f"{base_filename}_output_v3.json"

    try:
        with open(output_filename, 'w', encoding='utf-8') as f:
            # Usar default=str es un salvavidas si algún tipo raro se cuela,
            # pero idealmente las funciones de formato devuelven tipos serializables (str, float, int, None, list, dict)
            json.dump(all_records, f, ensure_ascii=False, indent=4, default=str)
        print(f"\nArchivo '{output_filename}' creado exitosamente.")
        print(f"Total de registros procesados: {len(all_records)}")
    except Exception as e:
        print(f"Error al guardar el archivo JSON: {e}")
        sys.exit(1)

# --- Bloque principal ---
if __name__ == "__main__":
    print("\n--- Conversor CSV a JSON (Formato Destino Específico - v3) ---")
    print("-------------------------------------------------------------")
    input_filename = input("Ingrese el nombre del archivo CSV (ej: ante2025.csv): ")

    if not input_filename.lower().endswith('.csv'):
        print("Error: El nombre del archivo debe terminar con '.csv'")
        sys.exit(1)
    if not os.path.exists(input_filename):
         print(f"Error: El archivo '{input_filename}' no fue encontrado en la ruta actual.")
         sys.exit(1)

    csv_to_target_json(input_filename)