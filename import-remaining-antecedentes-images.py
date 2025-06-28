#!/usr/bin/env python3
"""
Script refinado para completar la importación de imágenes de antecedentes
Utiliza el mapeo existente y procesa de manera inteligente las relaciones
"""

import json
import os
import sys
import hashlib
import re
from pathlib import Path
from datetime import datetime
import logging
import uuid

# Configuración de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class AntecedentesImageImporter:
    def __init__(self):
        self.mapping_file = "./datos_imagenes_para_directus_20250415_181330.json"
        self.antecedentes_file = "./antev3.json"
        self.images_dir = Path("./imagenes_antecedentes_versionproduccion")
        
        self.mapping_data = []
        self.antecedentes_data = []
        self.titulo_to_antecedente = {}
        
    def load_data(self):
        """Cargar todos los datos necesarios"""
        logger.info("📖 Cargando datos...")
        
        # Cargar mapeo de imágenes
        try:
            with open(self.mapping_file, 'r', encoding='utf-8') as f:
                self.mapping_data = json.load(f)
            logger.info(f"✅ Mapeo cargado: {len(self.mapping_data)} registros")
        except Exception as e:
            logger.error(f"❌ Error cargando mapeo: {e}")
            return False
            
        # Cargar antecedentes
        try:
            with open(self.antecedentes_file, 'r', encoding='utf-8') as f:
                self.antecedentes_data = json.load(f)
            logger.info(f"✅ Antecedentes cargados: {len(self.antecedentes_data)} registros")
        except Exception as e:
            logger.error(f"❌ Error cargando antecedentes: {e}")
            return False
            
        # Crear mapeo de títulos para búsqueda rápida
        self.titulo_to_antecedente = {
            ant['Titulo']: ant for ant in self.antecedentes_data
        }
        
        return True
    
    def find_image_file(self, base_filename):
        """Buscar archivo de imagen con diferentes extensiones"""
        base_name = base_filename.rsplit('.', 1)[0]  # Sin extensión
        
        # Buscar con diferentes extensiones
        for ext in ['.png', '.jpg', '.jpeg', '.webp']:
            image_path = self.images_dir / f"{base_name}{ext}"
            if image_path.exists():
                return image_path
                
        return None
    
    def generate_file_id(self, filename):
        """Generar un UUID determinístico para el archivo."""
        # Usar UUIDv5 que es determinístico basado en un nombre y un namespace.
        # Esto asegura que el mismo nombre de archivo siempre genere el mismo UUID.
        return str(uuid.uuid5(uuid.NAMESPACE_DNS, filename))
    
    def clean_sql_string(self, text):
        """Limpiar texto para uso seguro en SQL"""
        if not text:
            return ""
        # Escapar comillas simples
        return text.replace("'", "''")
    
    def process_mapping(self):
        """Procesar el mapeo y generar SQL de importación"""
        logger.info("🔄 Procesando mapeo de imágenes...")
        
        sql_statements = []
        processed_count = 0
        not_found_count = 0
        no_image_count = 0
        
        # Comentario inicial en SQL
        sql_statements.append("-- Script generado automáticamente para importación de imágenes")
        sql_statements.append(f"-- Fecha: {datetime.now().isoformat()}")
        sql_statements.append(f"-- Total registros procesados: {len(self.mapping_data)}")
        sql_statements.append("")
        
        sql_statements.append("""
-- =============================================================
-- GARANTIZAR TABLAS Y CONSTRAINTS BÁSICAS
-- =============================================================
-- Crear tabla de antecedentes si no existe (versión minúscula)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') THEN
        CREATE EXTENSION "uuid-ossp";
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'antecedentes') THEN
        CREATE TABLE antecedentes (
            id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
            "Titulo" text UNIQUE,
            "Imagen" uuid NULL,
            CONSTRAINT antecedentes_imagen_fkey FOREIGN KEY ("Imagen") REFERENCES directus_files(id) ON DELETE SET NULL
        );
    END IF;
END $$;
""")
        
        for i, mapping_entry in enumerate(self.mapping_data):
            titulo_original = mapping_entry.get('titulo_original', '').strip()
            archivo_generado = mapping_entry.get('nombre_archivo_generado', '')
            numero = mapping_entry.get('numero', i + 1)
            
            if not titulo_original:
                logger.warning(f"[{numero}] Registro sin título, omitiendo...")
                continue
                
            if not archivo_generado:
                logger.warning(f"[{numero}] Registro sin archivo generado: {titulo_original}")
                no_image_count += 1
                continue
            
            # Buscar antecedente correspondiente
            antecedente = self.titulo_to_antecedente.get(titulo_original)
            if not antecedente:
                logger.warning(f"[{numero}] Antecedente no encontrado: {titulo_original}")
                not_found_count += 1
                continue
            
            # Buscar archivo de imagen
            imagen_filename = os.path.basename(archivo_generado)
            image_path = self.find_image_file(imagen_filename)
            
            if not image_path:
                logger.warning(f"[{numero}] Imagen no encontrada: {imagen_filename}")
                no_image_count += 1
                continue
            
            # Generar datos para SQL
            file_id = self.generate_file_id(image_path.name)
            clean_titulo = self.clean_sql_string(titulo_original)
            clean_filename = self.clean_sql_string(image_path.name)
            
            # Determinar tipo MIME
            ext = image_path.suffix.lower()
            mime_type = {
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.webp': 'image/webp'
            }.get(ext, 'image/png')
            
            # Obtener tamaño del archivo
            file_size = image_path.stat().st_size
            
            # SQL para insertar en directus_files SIN uploaded_by (se pone NULL)
            sql_statements.append(f"""
-- Antecedente {numero}: {clean_titulo}
INSERT INTO directus_files (
    id, 
    filename_disk, 
    filename_download, 
    title, 
    type, 
    filesize,
    uploaded_by, 
    uploaded_on, 
    storage
) VALUES (
    '{file_id}', 
    '{clean_filename}', 
    '{clean_filename}', 
    '{clean_titulo}', 
    '{mime_type}', 
    {file_size},
    NULL, 
    NOW(), 
    'local'
) ON CONFLICT (id) DO UPDATE SET
    filename_disk = EXCLUDED.filename_disk,
    filename_download = EXCLUDED.filename_download,
    title = EXCLUDED.title,
    type = EXCLUDED.type,
    filesize = EXCLUDED.filesize;
""")
            
            # SQL para actualizar antecedente (solo versión minúscula que sí existirá)
            sql_statements.append(f"""
UPDATE antecedentes 
SET "Imagen" = '{file_id}' 
WHERE "Titulo" = '{clean_titulo}';
""")
            
            processed_count += 1
            
            if processed_count % 50 == 0:
                logger.info(f"Procesados: {processed_count}/{len(self.mapping_data)}")
        
        # Estadísticas finales en SQL
        sql_statements.append(f"""
-- ESTADÍSTICAS DE IMPORTACIÓN:
-- Registros procesados exitosamente: {processed_count}
-- Antecedentes no encontrados: {not_found_count}
-- Imágenes no encontradas: {no_image_count}
-- Total registros en mapeo: {len(self.mapping_data)}
""")
        
        logger.info(f"📊 Estadísticas de procesamiento:")
        logger.info(f"  ✅ Procesados exitosamente: {processed_count}")
        logger.info(f"  ⚠️ Antecedentes no encontrados: {not_found_count}")
        logger.info(f"  ⚠️ Imágenes no encontradas: {no_image_count}")
        
        return sql_statements
    
    def save_sql_script(self, sql_statements, output_file="./update_antecedentes_images_complete.sql"):
        """Guardar script SQL generado"""
        try:
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write('\n'.join(sql_statements))
            logger.info(f"✅ Script SQL guardado: {output_file}")
            return True
        except Exception as e:
            logger.error(f"❌ Error guardando script SQL: {e}")
            return False
    
    def verify_images_exist(self):
        """Verificar que las imágenes existen localmente"""
        logger.info("🔍 Verificando existencia de imágenes...")
        
        if not self.images_dir.exists():
            logger.error(f"❌ Directorio de imágenes no existe: {self.images_dir}")
            return False
            
        image_files = list(self.images_dir.glob("*.png")) + \
                     list(self.images_dir.glob("*.jpg")) + \
                     list(self.images_dir.glob("*.jpeg"))
        
        logger.info(f"📸 Total imágenes encontradas: {len(image_files)}")
        return len(image_files) > 0
    
    def generate_transfer_script(self, server_ip="23.105.176.45", server_user="root", server_dir="/root/fumbling-field"):
        """Generar script de transferencia al servidor"""
        transfer_script = f"""#!/bin/bash

# Script de transferencia de imágenes al servidor
echo "📤 Transfiriendo imágenes al servidor {server_ip}..."

# Crear directorio de uploads en servidor
ssh {server_user}@{server_ip} "mkdir -p {server_dir}/uploads"

# Sincronizar imágenes
rsync -av --progress "./imagenes_antecedentes_versionproduccion/" "{server_user}@{server_ip}:{server_dir}/uploads/"

if [ $? -eq 0 ]; then
    echo "✅ Imágenes transferidas exitosamente"
    
    # Transferir script SQL
    scp "./update_antecedentes_images_complete.sql" "{server_user}@{server_ip}:{server_dir}/"
    
    echo "📋 Script SQL transferido. Ejecutar en servidor:"
    echo "cd {server_dir}"
    echo "docker-compose exec -T database psql -U myuser -d mydatabase -f /root/fumbling-field/update_antecedentes_images_complete.sql"
else
    echo "❌ Error transfiriendo imágenes"
    exit 1
fi
"""
        
        with open("./transfer_images_to_server.sh", 'w') as f:
            f.write(transfer_script)
            
        os.chmod("./transfer_images_to_server.sh", 0o755)
        logger.info("✅ Script de transferencia creado: ./transfer_images_to_server.sh")
    
    def run(self):
        """Ejecutar proceso completo de importación"""
        logger.info("🚀 Iniciando importación completa de imágenes de antecedentes")
        
        # Cargar datos
        if not self.load_data():
            return False
            
        # Verificar imágenes
        if not self.verify_images_exist():
            return False
            
        # Procesar mapeo
        sql_statements = self.process_mapping()
        
        if not sql_statements:
            logger.error("❌ No se pudieron procesar los datos")
            return False
            
        # Guardar script SQL
        if not self.save_sql_script(sql_statements):
            return False
            
        # Generar script de transferencia
        self.generate_transfer_script()
        
        logger.info("🎉 Proceso completado exitosamente")
        logger.info("📋 Próximos pasos:")
        logger.info("  1. Ejecutar: ./transfer_images_to_server.sh")
        logger.info("  2. En el servidor ejecutar el SQL generado")
        logger.info("  3. Reiniciar Directus: docker-compose restart directus-app")
        
        return True

def main():
    importer = AntecedentesImageImporter()
    success = importer.run()
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main() 