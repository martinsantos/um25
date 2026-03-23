#!/usr/bin/env node
/**
 * Upload Service Images to Directus
 *
 * ⚠️  DEPRECATED — DO NOT RUN THIS SCRIPT ⚠️
 *
 * Este script crea NUEVOS file entries en Directus (POST /files) cada vez que se ejecuta,
 * generando UUIDs duplicados. Los productos ya tienen UUIDs asignados en producción.
 * Si necesitas corregir el contenido de una imagen, usa PATCH /files/{uuid} con el UUID
 * existente (ver scripts/data/image-uuid-mapping.json para los UUIDs correctos).
 *
 * La fuente de verdad para los UUIDs de producción es:
 *   - src/data/image-local-map.json (UUID → local path)
 *   - scripts/data/image-uuid-mapping.json (filename → UUID, sincronizado con image-local-map)
 *
 * Uso original: node scripts/upload-service-images.mjs
 *
 * Requisitos:
 * - Directus corriendo en localhost:8055 o la URL configurada
 * - Token de Directus válido
 * - Imágenes en /serviciosimg/limpias/
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración
const DIRECTUS_URL = process.env.PUBLIC_DIRECTUS_URL || 'http://23.105.176.45:8055';
const DIRECTUS_TOKEN = process.env.PUBLIC_DIRECTUS_TOKEN || 'k6P8LAY8_x_y1miB_KTlWnysCnx2Abky';
const IMAGES_PATH = path.resolve(__dirname, '../serviciosimg/limpias');
const OUTPUT_FILE = path.resolve(__dirname, 'data/image-uuid-mapping.json');

// Lista de imágenes esperadas (ordenadas por unidad)
const EXPECTED_IMAGES = [
  // Unidad 1: Infraestructura
  '1.1.png', '1.2.png', '1.3.png', '1.4.png', '1.5.png', '1.6.png', '1.7.png', '1.8.png',
  // Unidad 2: Seguridad
  '2.1.png', '2.2.png', '2.3.png', '2.4.png', '2.5.png', '2.6.png', '2.7.png', '2.8.png',
  // Unidad 3: Telecomunicaciones
  '3.1.png', '3.2.png', '3.3.png', '3.4.png', '3.5.png', '3.6.png',
  // Unidad 4: Software
  '4.1.png', '4.2.png', '4.3.png', '4.4.png', '4.5.png', '4.6.png',
  // Unidad 5: Soporte
  '5.1.png', '5.2.png', '5.3.png', '5.4.png', '5.5.png',
  // Unidad 6: Consultoría
  '6.1.png', '6.2.png', '6.3.png', '6.4.png', '6.5.png',
  // Unidad 7: Detección Incendios
  '7.1.png', '7.2.png', '7.3.png', '7.4.png', '7.5.png', '7.6.png', '7.7.png', '7.8.png',
  // Unidad 8: Eléctricos
  '8.1.png', '8.2.png', '8.3.png', '8.4.png', '8.5.png', '8.6.png', '8.7.png', '8.8.png'
];

async function uploadImage(filename) {
  const filePath = path.join(IMAGES_PATH, filename);

  if (!fs.existsSync(filePath)) {
    console.log(`   ⚠️  File not found: ${filename}`);
    return null;
  }

  const fileBuffer = fs.readFileSync(filePath);
  const blob = new Blob([fileBuffer], { type: 'image/png' });

  const formData = new FormData();
  formData.append('file', blob, filename);

  // Agregar metadata
  formData.append('title', `Producto ${filename.replace('.png', '')}`);
  formData.append('folder', null); // Carpeta raíz

  try {
    const response = await fetch(`${DIRECTUS_URL}/files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DIRECTUS_TOKEN}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`   ❌ Error uploading ${filename}: ${response.status} - ${errorText}`);
      return null;
    }

    const data = await response.json();
    return data.data.id; // UUID del archivo
  } catch (error) {
    console.log(`   ❌ Error uploading ${filename}: ${error.message}`);
    return null;
  }
}

async function checkExistingImage(filename) {
  try {
    const response = await fetch(
      `${DIRECTUS_URL}/files?filter[filename_download][_eq]=${encodeURIComponent(filename)}&fields=id,filename_download`,
      {
        headers: {
          'Authorization': `Bearer ${DIRECTUS_TOKEN}`
        }
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (data.data && data.data.length > 0) {
      return data.data[0].id;
    }
    return null;
  } catch (error) {
    return null;
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  Upload Service Images to Directus                     ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  console.log(`Directus URL: ${DIRECTUS_URL}`);
  console.log(`Images Path: ${IMAGES_PATH}`);
  console.log(`Output File: ${OUTPUT_FILE}\n`);

  // Verificar conexión a Directus
  try {
    const testRequest = await fetch(`${DIRECTUS_URL}/files?limit=1`, {
      headers: { 'Authorization': `Bearer ${DIRECTUS_TOKEN}` }
    });
    if (!testRequest.ok) {
      throw new Error(`API check failed: ${testRequest.status}`);
    }
    console.log('✅ Directus connection OK\n');
  } catch (error) {
    console.error('❌ Cannot connect to Directus:', error.message);
    console.log('\n💡 Make sure Directus is running or update DIRECTUS_URL');
    process.exit(1);
  }

  // Cargar mapeo existente si existe
  let mapping = {};
  if (fs.existsSync(OUTPUT_FILE)) {
    try {
      mapping = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
      console.log(`📂 Loaded existing mapping with ${Object.keys(mapping).length} entries\n`);
    } catch (e) {
      console.log('⚠️  Could not load existing mapping, starting fresh\n');
    }
  }

  // Procesar imágenes
  console.log('📤 Processing images...\n');

  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const filename of EXPECTED_IMAGES) {
    process.stdout.write(`   ${filename}: `);

    // Verificar si ya tenemos el UUID
    if (mapping[filename]) {
      console.log(`✓ Already mapped (${mapping[filename].substring(0, 8)}...)`);
      skipped++;
      continue;
    }

    // Verificar si ya existe en Directus
    const existingId = await checkExistingImage(filename);
    if (existingId) {
      mapping[filename] = existingId;
      console.log(`✓ Found in Directus (${existingId.substring(0, 8)}...)`);
      skipped++;
      continue;
    }

    // Subir imagen
    const uuid = await uploadImage(filename);
    if (uuid) {
      mapping[filename] = uuid;
      console.log(`✓ Uploaded (${uuid.substring(0, 8)}...)`);
      uploaded++;
    } else {
      failed++;
    }

    // Pequeña pausa para no sobrecargar el servidor
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Guardar mapeo
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(mapping, null, 2));

  // Resumen
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📊 SUMMARY\n');
  console.log(`   Total expected: ${EXPECTED_IMAGES.length}`);
  console.log(`   Uploaded:       ${uploaded}`);
  console.log(`   Skipped:        ${skipped}`);
  console.log(`   Failed:         ${failed}`);
  console.log(`\n   Mapping saved to: ${OUTPUT_FILE}`);
  console.log('═══════════════════════════════════════════════════════════\n');

  if (failed > 0) {
    console.log('⚠️  Some images failed to upload. Run the script again to retry.\n');
  } else {
    console.log('✅ All images processed successfully!\n');
  }
}

main().catch(console.error);
