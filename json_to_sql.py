#!/usr/bin/env python3
"""
Convertir antev3.json a sentencias SQL INSERT para PostgreSQL
"""

import json
import uuid
from datetime import datetime

def escape_sql_string(s):
    """Escapar strings para SQL"""
    if s is None:
        return "NULL"
    
    # Convertir a string y escapar comillas simples
    s = str(s).replace("'", "''")
    return f"'{s}'"

def convert_json_to_sql(json_file, output_file):
    """Convertir JSON a SQL INSERT statements"""
    
    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("-- Insertar datos de antecedentes desde antev3.json\n")
        f.write("-- Total de registros: {}\n\n".format(len(data)))
        
        f.write("BEGIN;\n\n")
        
        # Generar INSERT statements en lotes de 100
        batch_size = 100
        for i in range(0, len(data), batch_size):
            batch = data[i:i+batch_size]
            
            f.write(f"-- Lote {i//batch_size + 1}: registros {i+1} a {min(i+batch_size, len(data))}\n")
            f.write("INSERT INTO antecedentes (status, \"Titulo\", \"Descripcion\", \"Cliente\", \"Area\", \"Fecha\", \"Unidad_de_negocio\", \"Presupuesto\", date_created, date_updated) VALUES\n")
            
            values = []
            for item in batch:
                # Generar UUID para cada registro
                item_id = str(uuid.uuid4())
                now = datetime.now().isoformat()
                
                titulo = escape_sql_string(item.get('Titulo', ''))
                descripcion = escape_sql_string(item.get('Descripcion', ''))
                cliente = escape_sql_string(item.get('Cliente', ''))
                area = escape_sql_string(item.get('Area', ''))
                fecha = escape_sql_string(item.get('Fecha', ''))
                unidad = escape_sql_string(item.get('Unidad_de_negocio', ''))
                presupuesto = escape_sql_string(item.get('Presupuesto', ''))
                
                value_str = f"('published', {titulo}, {descripcion}, {cliente}, {area}, {fecha}, {unidad}, {presupuesto}, '{now}', '{now}')"
                values.append(value_str)
            
            f.write(',\n'.join(values))
            f.write(';\n\n')
        
        f.write("COMMIT;\n\n")
        f.write(f"-- Verificar inserción\nSELECT COUNT(*) as total_antecedentes FROM antecedentes;\n")
        f.write("SELECT 'Migración de antecedentes completada exitosamente!' as status;\n")

if __name__ == "__main__":
    print("🔄 Convirtiendo antev3.json a SQL...")
    convert_json_to_sql('antev3.json', 'insert_antecedentes.sql')
    print("✅ Archivo insert_antecedentes.sql generado")
    print("📊 Listo para ejecutar en PostgreSQL") 