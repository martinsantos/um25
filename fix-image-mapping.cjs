#!/usr/bin/env node

/**
 * CORRECIÓN DE MAPEO DE IMÁGENES - 469 ANTECEDENTES
 * Mapea imágenes físicas con UUIDs de antecedentes
 */

const fs = require('fs');
const path = require('path');

async function fixImageMapping() {
  console.log('🔧 INICIANDO CORRECCIÓN DE MAPEO DE IMÁGENES...');
  
  try {
    // 1. Leer datos de antecedentes
    const antecedentesPath = path.join(__dirname, 'src/data/antecedentes_completos.js');
    const fileContent = fs.readFileSync(antecedentesPath, 'utf8');
    const exportMatch = fileContent.match(/export const antecedentesReales = (\[[\s\S]*\]);/);
    
    if (!exportMatch) {
      throw new Error('❌ No se pudo extraer antecedentesReales del archivo');
    }
    
    const antecedentesData = eval(exportMatch[1]);
    console.log(`✅ Datos cargados: ${antecedentesData.length} antecedentes`);
    
    // 2. Leer imágenes físicas disponibles
    const imagesDir = 'public/imagenes_antecedentes_versionproduccion';
    const imageFiles = fs.readdirSync(imagesDir).filter(file => file.endsWith('.png'));
    console.log(`✅ Imágenes disponibles: ${imageFiles.length}`);
    
    // 3. Crear mapeo de títulos a archivos de imagen
    const titleToImageMap = {};
    imageFiles.forEach(filename => {
      // Extraer información del nombre del archivo
      // Formato: ultimamilla_cliente_-_servicio_fecha_timestamp_hash.png
      const parts = filename.replace('ultimamilla_', '').replace('.png', '').split('_-_');
      if (parts.length >= 2) {
        const cliente = parts[0].replace(/_/g, ' ').toLowerCase();
        const servicio = parts[1].split('_')[0].replace(/_/g, ' ').toLowerCase();
        const key = `${cliente}_${servicio}`;
        titleToImageMap[key] = filename;
      }
    });
    
    console.log(`✅ Mapeo creado para ${Object.keys(titleToImageMap).length} combinaciones`);
    
    // 4. Generar script SQL para crear registros en directus_files
    let sql = `-- CORRECCIÓN DE MAPEO DE IMÁGENES - ${antecedentesData.length} ANTECEDENTES
-- Generado automáticamente el ${new Date().toISOString()}

-- Limpiar registros existentes de imágenes
DELETE FROM directus_files WHERE storage = 'local';

-- Insertar registros de imágenes con UUIDs correctos
`;

    let mappedCount = 0;
    let unmappedCount = 0;
    const unmappedList = [];
    
    antecedentesData.forEach((antecedente, index) => {
      const cliente = antecedente.Cliente.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
      const titulo = antecedente.Titulo.toLowerCase();
      
      // Buscar imagen por diferentes criterios
      let matchedImage = null;
      
      // 1. Buscar por cliente exacto
      const clienteKey = cliente.replace(/\s/g, '_');
      for (const [key, filename] of Object.entries(titleToImageMap)) {
        if (key.includes(clienteKey) || clienteKey.includes(key.split('_')[0])) {
          matchedImage = filename;
          break;
        }
      }
      
      // 2. Si no encuentra, buscar por palabras clave del título
      if (!matchedImage) {
        const keywords = ['software', 'redes', 'comunicaciones', 'cctv', 'detección', 'incendio', 'sdi', 'cableado'];
        for (const keyword of keywords) {
          if (titulo.includes(keyword)) {
            for (const [key, filename] of Object.entries(titleToImageMap)) {
              if (key.includes(keyword)) {
                matchedImage = filename;
                break;
              }
            }
            if (matchedImage) break;
          }
        }
      }
      
      // 3. Si aún no encuentra, usar imagen por índice
      if (!matchedImage && index < imageFiles.length) {
        matchedImage = imageFiles[index];
      }
      
      if (matchedImage) {
        const imagePath = path.join(imagesDir, matchedImage);
        const stats = fs.statSync(imagePath);
        const filesize = stats.size;
        
        sql += `INSERT INTO directus_files (id, storage, filename_disk, filename_download, title, type, folder, uploaded_by, uploaded_on, modified_by, modified_on, charset, filesize, width, height, duration, embed, description, location, tags, metadata) VALUES ('${antecedente.Imagen}', 'local', '${matchedImage}', '${matchedImage}', '${antecedente.Titulo.replace(/'/g, "''")}', 'image/png', NULL, NULL, NOW(), NULL, NOW(), NULL, ${filesize}, NULL, NULL, NULL, NULL, '${antecedente.Descripcion.substring(0, 200).replace(/'/g, "''")}', NULL, NULL, '{}');\n`;
        
        mappedCount++;
      } else {
        unmappedList.push({
          id: antecedente.id,
          titulo: antecedente.Titulo,
          cliente: antecedente.Cliente,
          imagen: antecedente.Imagen
        });
        unmappedCount++;
      }
    });
    
    // 5. Agregar configuración de permisos
    sql += `
-- Configurar permisos públicos para archivos
INSERT INTO directus_permissions (collection, action, permissions, validation, presets, fields, policy) 
VALUES ('directus_files', 'read', '{}', '{}', NULL, '*', 'abf8a154-5b1c-4a46-ac9c-7300570f4f17') 
ON CONFLICT DO NOTHING;

-- Verificación final
SELECT 'MAPEO DE IMÁGENES COMPLETADO:' as status;
SELECT COUNT(*) as total_imagenes FROM directus_files WHERE storage = 'local';
SELECT 'Primeras 5 imágenes:' as info;
SELECT id, filename_disk, title FROM directus_files WHERE storage = 'local' ORDER BY uploaded_on LIMIT 5;
`;

    // 6. Escribir archivo SQL
    const outputPath = 'fix-image-mapping.sql';
    fs.writeFileSync(outputPath, sql);
    
    // 7. Crear script de ejecución
    const executeScript = `#!/bin/bash
# SCRIPT DE CORRECCIÓN DE MAPEO DE IMÁGENES
echo "🔧 INICIANDO CORRECCIÓN DE MAPEO DE IMÁGENES..."

# Ejecutar corrección
ssh root@23.105.176.45 "docker exec -i fumbling-field-database-1 psql -U myuser -d mydatabase" < ${outputPath}

# Verificar resultado
echo "✅ Verificando resultado..."
ssh root@23.105.176.45 "docker exec -i fumbling-field-database-1 psql -U myuser -d mydatabase -c 'SELECT COUNT(*) as total FROM directus_files WHERE storage = \\"local\\";'"

echo "🎯 Probando API de assets..."
curl -I "http://www.umbot.com.ar:8055/assets/$(head -1 /tmp/sample_uuid.txt 2>/dev/null || echo '6f535377-5177-4fcd-8c8d-8f41f32ece7c')"

echo "✅ CORRECCIÓN COMPLETADA"
`;
    
    const executeScriptPath = 'execute-fix-mapping.sh';
    fs.writeFileSync(executeScriptPath, executeScript);
    fs.chmodSync(executeScriptPath, '755');
    
    // 8. Crear script de copia de archivos con nombres UUID
    const copyScript = `#!/bin/bash
# SCRIPT DE COPIA DE ARCHIVOS CON NOMBRES UUID
echo "📂 COPIANDO ARCHIVOS CON NOMBRES UUID..."

SERVER="root@23.105.176.45"
LOCAL_DIR="public/imagenes_antecedentes_versionproduccion"
REMOTE_DIR="/root/fumbling-field/uploads"

# Crear directorio temporal para archivos renombrados
mkdir -p temp_uuid_images

`;

    // Generar comandos de copia con nombres UUID
    antecedentesData.forEach((antecedente, index) => {
      if (index < imageFiles.length) {
        const originalFile = imageFiles[index];
        const uuidFile = `${antecedente.Imagen}.png`;
        copyScript += `cp "$LOCAL_DIR/${originalFile}" "temp_uuid_images/${uuidFile}"\n`;
      }
    });

    copyScript += `
# Transferir archivos renombrados al servidor
echo "📤 Transfiriendo archivos al servidor..."
scp temp_uuid_images/* $SERVER:$REMOTE_DIR/

# Limpiar directorio temporal
rm -rf temp_uuid_images

echo "✅ COPIA DE ARCHIVOS COMPLETADA"
`;

    const copyScriptPath = 'copy-uuid-images.sh';
    fs.writeFileSync(copyScriptPath, copyScript);
    fs.chmodSync(copyScriptPath, '755');
    
    // 9. Estadísticas finales
    console.log('\n✅ CORRECCIÓN DE MAPEO GENERADA EXITOSAMENTE');
    console.log('================================================');
    console.log(`📄 Archivo SQL: ${outputPath}`);
    console.log(`📊 Antecedentes mapeados: ${mappedCount}`);
    console.log(`⚠️ Antecedentes sin mapear: ${unmappedCount}`);
    console.log(`🔧 Script de ejecución: ${executeScriptPath}`);
    console.log(`📂 Script de copia: ${copyScriptPath}`);
    
    if (unmappedList.length > 0) {
      console.log('\n⚠️ ANTECEDENTES SIN MAPEAR:');
      unmappedList.slice(0, 10).forEach(item => {
        console.log(`   - ID ${item.id}: ${item.cliente} - ${item.titulo.substring(0, 50)}...`);
      });
      if (unmappedList.length > 10) {
        console.log(`   ... y ${unmappedList.length - 10} más`);
      }
    }
    
    console.log('\n🎯 PRÓXIMOS PASOS:');
    console.log(`   1. Ejecutar: ./${copyScriptPath}`);
    console.log(`   2. Ejecutar: ./${executeScriptPath}`);
    console.log(`   3. Verificar: curl -I http://www.umbot.com.ar:8055/assets/6f535377-5177-4fcd-8c8d-8f41f32ece7c`);
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  fixImageMapping();
}

module.exports = { fixImageMapping }; 