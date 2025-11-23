import re

# Leer el archivo de backup
with open('restore_directus_files.sql', 'r') as f:
    content = f.read()

# Extraer solo las líneas de datos (después de FROM stdin; y antes de \.)
lines = content.split('\n')
data_lines = []
in_data = False

for line in lines:
    if 'FROM stdin;' in line:
        in_data = True
        continue
    if line.strip() == '\.':
        break
    if in_data and line.strip():
        data_lines.append(line)

print(f'Encontradas {len(data_lines)} líneas de datos')

# Crear el script SQL
sql_script = '''-- Restaurar archivos de directus_files
TRUNCATE TABLE directus_files CASCADE;

INSERT INTO directus_files (
    id, storage, filename_disk, filename_download, title, type, 
    created_on, modified_on, filesize, width, height, metadata
) VALUES
'''

values = []
for i, line in enumerate(data_lines):
    parts = line.split('\t')
    if len(parts) >= 15:
        id_val = parts[0]
        storage = parts[1] 
        filename_disk = parts[2]
        filename_download = parts[3]
        title = parts[4].replace("'", "''")  # Escapar comillas
        type_val = parts[5]
        created_on = parts[8]
        modified_on = parts[10]
        filesize = parts[12] if parts[12] != '\\N' else '0'
        width = parts[13] if parts[13] != '\\N' else '0'
        height = parts[14] if parts[14] != '\\N' else '0'
        
        value = f"('{id_val}', '{storage}', '{filename_disk}', '{filename_download}', '{title}', '{type_val}', '{created_on}', '{modified_on}', {filesize}, {width}, {height}, '{{}}')"
        values.append(value)

sql_script += ',\n'.join(values) + ';\n\n-- Verificar que se insertaron\nSELECT COUNT(*) as total_files FROM directus_files;'

with open('restore_files_clean.sql', 'w') as f:
    f.write(sql_script)

print(f'Script creado: restore_files_clean.sql con {len(values)} archivos') 