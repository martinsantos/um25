import json
import pandas as pd
from datetime import datetime
import os

def xlsx_to_json(input_file):
    # Leer el archivo Excel
    try:
        df = pd.read_excel(input_file)
    except Exception as e:
        print(f"Error al leer el archivo Excel: {e}")
        return

    # Mapeo de columnas con valores por defecto
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

    # Verificar qué columnas existen realmente en el Excel
    existing_columns = [col for col in column_mapping.keys() if col in df.columns]
    
    # Si no hay ninguna columna válida
    if not existing_columns:
        print("Error: El archivo Excel no contiene ninguna de las columnas esperadas")
        return

    # Lista para almacenar todos los registros
    all_records = []

    # Procesar cada fila del DataFrame
    for index, row in df.iterrows():
        # Obtener valores de las columnas existentes o usar None
        row_data = {col: row[col] if col in df.columns and pd.notna(row[col]) else None 
                   for col in column_mapping.keys()}

        # Preparar los datos según las equivalencias
        data = {
            "status": "published",
            "Titulo": f"{row_data['Cliente/Organismo'] or 'Cliente no especificado'} - {row_data['Area'] or 'Área no especificada'}",
            "Descripcion": build_description(row_data),
            "Imagen": None,
            "Archivo": None,
            "Fecha": format_date(row_data['Fecha de final']),
            "Cliente": row_data['Cliente/Organismo'] or "No especificado",
            "Unidad_de_negocio": row_data['Unidad de Negocio ID'] or "No hay información proporcionada para traducir.",
            "Presupuesto": format_currency(row_data['Monto contratado']),
            "Area": row_data['Area'] or "No especificado",
            "Palabras_clave": generate_keywords(row_data['Area'], row_data['Servicios'])
        }

        all_records.append(data)

    # Nombre del archivo JSON de salida
    output_filename = "output2.json"

    # Guardar todos los registros en un solo archivo JSON
    try:
        with open(output_filename, 'w', encoding='utf-8') as f:
            json.dump(all_records, f, ensure_ascii=False, indent=4)
        print(f"\nArchivo {output_filename} creado exitosamente en: {os.path.abspath(output_filename)}")
        print(f"Total de registros procesados: {len(all_records)}")
    except Exception as e:
        print(f"Error al guardar el archivo JSON: {e}")

def build_description(row_data):
    """Construye la descripción con los datos disponibles"""
    parts = []
    
    if row_data['Cliente/Organismo']:
        parts.append(f"{row_data['Cliente/Organismo']}")
    
    if row_data['Area']:
        parts.append(f"empresa del sector de {row_data['Area'].lower()}")
    
    if row_data['Servicios']:
        parts.append(f"{row_data['Servicios']}")
    
    if row_data['Datos contacto referencia']:
        parts.append(f"Datos de contacto: {row_data['Datos contacto referencia']}")
    
    if row_data['Nombre Contacto responsable']:
        parts.append(f"Contacto responsable: {row_data['Nombre Contacto responsable']}")
    
    if not parts:
        return "No hay descripción disponible"
    
    return ". ".join(parts) + "."

def format_date(date_value):
    """Formatea la fecha al formato dd-mm-yyyy"""
    if date_value is None:
        return datetime.now().strftime("%d-%m-%Y")
    
    try:
        if isinstance(date_value, str):
            # Si es string, intentar parsear
            return datetime.strptime(date_value, "%Y-%m-%d").strftime("%d-%m-%Y")
        else:
            # Si es datetime de pandas o similar
            return date_value.strftime("%d-%m-%Y")
    except:
        return datetime.now().strftime("%d-%m-%Y")

def format_currency(amount):
    """Formatea el monto a formato de moneda"""
    if amount is None:
        return "No especificado"
    
    try:
        # Intentar formatear como número con 2 decimales
        amount_float = float(amount)
        return f"{amount_float:,.2f} USD"
    except:
        return f"{amount} USD" if amount else "No especificado"

def generate_keywords(area, services):
    """Genera palabras clave basadas en el área y servicios"""
    keywords = []
    
    # Agregar palabras del área
    if area:
        keywords.extend(area.split())
    
    # Agregar palabras de servicios (tomar primeras palabras)
    if services:
        service_words = services.split()[:10]  # Limitar a 10 palabras
        keywords.extend(service_words)
    
    if not keywords:
        return "No especificado"
    
    # Eliminar duplicados y unir con comas
    unique_keywords = list(set([word.strip(".,") for word in keywords if len(word) > 3]))
    return ", ".join(unique_keywords) if unique_keywords else "No especificado"

if __name__ == "__main__":
    print("\nConversor de XLSX a JSON")
    print("------------------------")
    input_filename = input("Ingrese el nombre del archivo XLSX (incluya la extensión .xlsx): ")
    xlsx_to_json(input_filename)