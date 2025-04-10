import json
import pandas as pd
from datetime import datetime
import os
import sys # Importar sys para manejo de errores de archivo

def csv_to_json(input_file: str):
    """
    Lee un archivo CSV, procesa sus datos y los exporta a un archivo JSON.

    Args:
        input_file (str): La ruta al archivo CSV de entrada.
    """
    # --- Cambio principal: Leer archivo CSV en lugar de Excel ---
    try:
        # Intentar leer con UTF-8, que es común y recomendado
        # Añadir manejo de posibles errores de delimitador si es necesario (ej: delimiter=';')
        df = pd.read_csv(input_file, encoding='utf-8')
        print(f"Archivo CSV '{input_file}' leído exitosamente.")
    except FileNotFoundError:
        print(f"Error: El archivo '{input_file}' no fue encontrado.")
        sys.exit(1) # Salir del script si el archivo no existe
    except UnicodeDecodeError:
        print("Error de codificación al leer el CSV con UTF-8. Intentando con 'latin-1'...")
        try:
            df = pd.read_csv(input_file, encoding='latin-1')
            print(f"Archivo CSV '{input_file}' leído exitosamente con 'latin-1'.")
        except Exception as e:
            print(f"Error al leer el archivo CSV con 'latin-1': {e}")
            sys.exit(1) # Salir si la lectura falla con ambas codificaciones
    except Exception as e:
        print(f"Error inesperado al leer el archivo CSV: {e}")
        sys.exit(1) # Salir ante otros errores de lectura

    # Mapeo de columnas esperadas en el CSV con valores por defecto
    # Asegúrate de que estos nombres coincidan EXACTAMENTE con las cabeceras de tu CSV
    column_mapping = {
        'Antecedente': None,
        'Area': None,
        'Cliente/Organismo': None,
        'Servicios': None,
        'Datos contacto referencia': None,
        'Nombre Contacto responsable': None,
        'Monto contratado': None,
        'Unidad de Negocio ID': None,
        'Fecha de final': None
    }

    # Verificar qué columnas existen realmente en el CSV
    # Se convierten los nombres de columna del DataFrame a una lista para comparación
    df_columns = df.columns.tolist()
    existing_columns = [col for col in column_mapping.keys() if col in df_columns]

    # Si no hay ninguna columna válida
    if not existing_columns:
        print(f"Error: El archivo CSV '{input_file}' no contiene ninguna de las columnas esperadas.")
        print("Columnas esperadas:", list(column_mapping.keys()))
        print("Columnas encontradas:", df_columns)
        sys.exit(1) # Salir si no hay columnas coincidentes

    print(f"Columnas encontradas y mapeadas: {existing_columns}")

    # Lista para almacenar todos los registros JSON
    all_records = []

    # Procesar cada fila del DataFrame
    print("Procesando filas...")
    for index, row in df.iterrows():
        # Obtener valores de las columnas existentes o usar None si la columna no existe
        # o si el valor es NaN/NaT (Not a Number/Not a Time - valores nulos en pandas)
        row_data = {}
        for col_map_key in column_mapping.keys():
            if col_map_key in df.columns:
                 # Usar pd.notna() para chequear valores nulos de forma segura
                row_data[col_map_key] = row[col_map_key] if pd.notna(row[col_map_key]) else None
            else:
                row_data[col_map_key] = None # Asignar None si la columna no está en el CSV

        # Preparar los datos según las equivalencias para el JSON
        data = {
            "status": "published",
            "Titulo": f"{row_data['Cliente/Organismo'] or 'Cliente no especificado'} - {row_data['Area'] or 'Área no especificada'}",
            "Descripcion": build_description(row_data),
            "Imagen": None,  # Mantener como None o adaptar si tienes datos de imagen
            "Archivo": None, # Mantener como None o adaptar si tienes datos de archivo
            "Fecha": format_date(row_data['Fecha de final']),
            "Cliente": row_data['Cliente/Organismo'] or "No especificado",
            # Asegúrate que 'Unidad de Negocio ID' se mapea correctamente a 'Unidad_de_negocio'
            "Unidad_de_negocio": row_data['Unidad de Negocio ID'] or "No especificado",
            "Presupuesto": format_currency(row_data['Monto contratado']),
            "Area": row_data['Area'] or "No especificado",
            "Palabras_clave": generate_keywords(row_data['Area'], row_data['Servicios'])
        }

        all_records.append(data)
        # Opcional: Imprimir progreso cada N filas
        # if (index + 1) % 100 == 0:
        #    print(f"Procesadas {index + 1} filas...")

    # --- Mejora: Nombre del archivo JSON de salida basado en el de entrada ---
    base_filename = os.path.splitext(os.path.basename(input_file))[0]
    output_filename = f"{base_filename}_output.json"

    # Guardar todos los registros en un solo archivo JSON
    try:
        with open(output_filename, 'w', encoding='utf-8') as f:
            # Usar ensure_ascii=False para correcta escritura de caracteres especiales (acentos, ñ)
            json.dump(all_records, f, ensure_ascii=False, indent=4)

        print(f"\nArchivo '{output_filename}' creado exitosamente en: {os.path.abspath(output_filename)}")
        print(f"Total de registros procesados: {len(all_records)}")

    except Exception as e:
        print(f"Error al guardar el archivo JSON: {e}")
        sys.exit(1) # Salir si hay error al escribir el JSON

# --- Las funciones auxiliares (build_description, format_date, format_currency, generate_keywords) ---
# --- permanecen iguales, ya que operan sobre los datos extraídos, independientemente ---
# --- de si vinieron de un XLSX o un CSV. ---

def build_description(row_data):
    """Construye la descripción con los datos disponibles."""
    parts = []
    if row_data.get('Cliente/Organismo'): # Usar .get() para seguridad si la clave no existiera
        parts.append(f"{row_data['Cliente/Organismo']}")
    if row_data.get('Area'):
        parts.append(f"empresa del sector de {str(row_data['Area']).lower()}")
    if row_data.get('Servicios'):
        parts.append(f"{row_data['Servicios']}")
    if row_data.get('Datos contacto referencia'):
        parts.append(f"Datos de contacto: {row_data['Datos contacto referencia']}")
    if row_data.get('Nombre Contacto responsable'):
        parts.append(f"Contacto responsable: {row_data['Nombre Contacto responsable']}")

    if not parts:
        return "No hay descripción disponible." # Añadir punto final

    # Une las partes con ". " y asegura que termine con un solo punto.
    description = ". ".join(filter(None, parts)) # filter(None, parts) elimina strings vacíos si los hubiera
    if not description.endswith('.'):
        description += "."
    return description

def format_date(date_value):
    """Formatea la fecha al formato dd-mm-yyyy. Maneja strings, datetime y nulos."""
    if pd.isna(date_value): # Usar pd.isna() para manejar None, NaN, NaT de pandas
        # Devolver fecha actual como fallback, o puedes devolver None o "No especificado"
        return datetime.now().strftime("%d-%m-%Y")

    try:
        # Pandas a menudo lee fechas como objetos Timestamp (subclase de datetime)
        if isinstance(date_value, (datetime, pd.Timestamp)):
            return date_value.strftime("%d-%m-%Y")
        # Si es string, intentar varios formatos comunes
        elif isinstance(date_value, str):
            for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%Y/%m/%d"):
                try:
                    return datetime.strptime(date_value, fmt).strftime("%d-%m-%Y")
                except ValueError:
                    continue # Probar el siguiente formato
            # Si ningún formato conocido funciona, intentar devolver el string original o fallback
            print(f"Advertencia: Formato de fecha no reconocido '{date_value}'. Usando fecha actual.")
            return datetime.now().strftime("%d-%m-%Y")
        else:
            # Si es otro tipo (ej. número), intentar convertirlo si tiene sentido o fallback
            print(f"Advertencia: Tipo de fecha inesperado '{type(date_value)}'. Usando fecha actual.")
            return datetime.now().strftime("%d-%m-%Y")
    except Exception as e:
        print(f"Error formateando fecha '{date_value}': {e}. Usando fecha actual.")
        return datetime.now().strftime("%d-%m-%Y")

def format_currency(amount):
    """Formatea el monto a formato de moneda USD, manejando nulos y errores."""
    if pd.isna(amount):
        return "No especificado"

    try:
        # Limpiar posible string (quitar símbolos de moneda, comas de miles)
        if isinstance(amount, str):
            # Remover símbolos comunes y espacios, reemplazar coma decimal si es necesario
            cleaned_amount = amount.replace('$', '').replace('USD', '').replace('.', '').replace(',', '.').strip()
            amount_float = float(cleaned_amount)
        else:
            amount_float = float(amount) # Asume que es numérico

        # Formatear con separador de miles (coma) y dos decimales (punto)
        return f"{amount_float:,.2f} USD".replace(',', 'X').replace('.', ',').replace('X', '.') # Adaptar a formato local si es necesario

    except (ValueError, TypeError) as e:
        # Si la conversión falla, devolver el valor original o un mensaje
        print(f"Advertencia: No se pudo formatear el monto '{amount}' como moneda ({e}). Se devuelve como está.")
        return f"{amount} (sin formatear)" if amount else "No especificado"

def generate_keywords(area, services):
    """Genera palabras clave únicas a partir del área y servicios."""
    keywords = []

    # Agregar palabras del área si existe y es string
    if area and isinstance(area, str):
        keywords.extend(area.lower().split())

    # Agregar palabras de servicios si existe y es string
    if services and isinstance(services, str):
        # Tomar hasta 10 palabras clave de los servicios
        service_words = services.lower().split()[:10]
        keywords.extend(service_words)

    if not keywords:
        return "No especificado"

    # Limpiar (quitar puntuación común, palabras cortas) y obtener únicas
    unique_keywords = list(set(
        word.strip('.,;:"\'()[]{}') for word in keywords if len(word.strip('.,;:"\'()[]{}')) > 3
    ))

    return ", ".join(sorted(unique_keywords)) if unique_keywords else "No especificado"

# --- Bloque principal ---
if __name__ == "__main__":
    print("\n--- Conversor de CSV a JSON ---")
    print("-------------------------------")
    # Cambiar el prompt para pedir un archivo CSV
    input_filename = input("Ingrese el nombre del archivo CSV (incluya la extensión .csv): ")

    # Validar extensión simple
    if not input_filename.lower().endswith('.csv'):
        print("Error: El nombre del archivo debe terminar con '.csv'")
        sys.exit(1)

    # Llamar a la función renombrada
    csv_to_json(input_filename)