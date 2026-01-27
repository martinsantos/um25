#!/usr/bin/env node
/**
 * Upload Product Images - Sube imágenes de productos a Directus
 *
 * Este script:
 * - Lee todas las imágenes de public/images/services/productos/
 * - Las sube a Directus como assets (directus_files)
 * - Genera un mapping JSON: imagen local → UUID Directus
 * - Organiza en carpeta "productos" en Directus
 */

import { createDirectus, rest, uploadFiles, readFolders, createFolder } from '@directus/sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import FormData from 'form-data';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const DIRECTUS_URL = process.env.PUBLIC_DIRECTUS_URL || 'http://localhost:8055';
const DIRECTUS_TOKEN = process.env.DIRECTUS_STATIC_TOKEN || process.env.PUBLIC_DIRECTUS_TOKEN;
const directus = createDirectus(DIRECTUS_URL).with(rest());

const DRY_RUN = process.argv.includes('--dry-run');

async function uploadProductImages() {
  console.log('🖼️  Subiendo imágenes de productos a Directus...\n');

  if (DRY_RUN) {
    console.log('⚠️  DRY RUN MODE - No se subirán archivos reales\n');
  }

  console.log('━'.repeat(80));

  const uploadedAssets = {};
  const errors = [];
  let totalUploaded = 0;

  try {
    // 1. Verificar/Crear carpeta "productos" en Directus
    console.log('\n📁 Verificando carpeta "productos" en Directus...');

    let productosFolder = null;

    try {
      const folders = await directus.request(readFolders());
      productosFolder = folders.find(f => f.name === 'productos');

      if (productosFolder) {
        console.log(`✓ Carpeta "productos" existe (ID: ${productosFolder.id})`);
      } else {
        console.log('⚠️  Carpeta "productos" no existe');

        if (!DRY_RUN) {
          console.log('   Creando carpeta...');
          productosFolder = await directus.request(
            createFolder({
              name: 'productos',
              parent: null
            })
          );
          console.log(`✓ Carpeta "productos" creada (ID: ${productosFolder.id})`);
        } else {
          console.log('   (Dry run: carpeta no creada)');
          productosFolder = { id: 'dry-run-folder-id' };
        }
      }
    } catch (error) {
      console.error(`❌ Error gestionando carpeta: ${error.message}`);
      if (!DRY_RUN) {
        throw error;
      }
    }

    // 2. Escanear directorio de imágenes
    console.log('\n📂 Escaneando imágenes locales...');

    const imageDir = path.join(__dirname, '../../public/images/services/productos');

    if (!fs.existsSync(imageDir)) {
      throw new Error(`Directorio no encontrado: ${imageDir}`);
    }

    const subdirs = fs.readdirSync(imageDir);
    console.log(`✓ Encontradas ${subdirs.length} categorías de servicio`);

    // 3. Procesar cada categoría (infraestructura, seguridad, etc.)
    console.log('\n━'.repeat(80));
    console.log('📤 SUBIENDO IMÁGENES');
    console.log('━'.repeat(80));

    for (const subdir of subdirs) {
      const subdirPath = path.join(imageDir, subdir);

      if (!fs.statSync(subdirPath).isDirectory()) {
        continue;
      }

      console.log(`\n📁 Categoría: ${subdir}/`);

      const images = fs.readdirSync(subdirPath).filter(f =>
        f.toLowerCase().endsWith('.png')
      );

      console.log(`   Imágenes encontradas: ${images.length}`);

      // Procesar cada imagen
      for (const imageName of images) {
        const imagePath = path.join(subdirPath, imageName);
        const tag = `${subdir}/${imageName}`;

        console.log(`   Subiendo: ${tag}...`);

        if (DRY_RUN) {
          uploadedAssets[tag] = `dry-run-uuid-${subdir}-${imageName}`;
          console.log(`   ✓ (Dry run) UUID: ${uploadedAssets[tag]}`);
          totalUploaded++;
        } else {
          try {
            // Crear FormData con form-data para Node.js
            const formData = new FormData();
            formData.append('folder', productosFolder.id);
            formData.append('title', `Producto - ${tag}`);
            formData.append('file', fs.createReadStream(imagePath), {
              filename: imageName,
              contentType: 'image/png'
            });

            // Upload usando fetch directamente
            const response = await fetch(`${DIRECTUS_URL}/files`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
                ...formData.getHeaders()
              },
              body: formData
            });

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const result = await response.json();
            const fileId = result.data.id;

            uploadedAssets[tag] = fileId;
            console.log(`   ✓ UUID: ${fileId}`);
            totalUploaded++;

          } catch (error) {
            errors.push({ image: tag, error: error.message });
            console.error(`   ❌ Error: ${error.message}`);
          }
        }
      }
    }

    // 4. Guardar mapping JSON
    console.log('\n━'.repeat(80));
    console.log('💾 Guardando mapping de assets...');

    const outputPath = path.join(__dirname, '../../scratchpad/uploaded-assets-mapping.json');
    const outputDir = path.dirname(outputPath);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const mappingData = {
      timestamp: new Date().toISOString(),
      dry_run: DRY_RUN,
      total_uploaded: totalUploaded,
      total_errors: errors.length,
      folder_id: productosFolder?.id || null,
      mapping: uploadedAssets,
      errors: errors
    };

    fs.writeFileSync(outputPath, JSON.stringify(mappingData, null, 2));

    console.log(`✓ Mapping guardado en: ${outputPath}`);
    console.log(`   Total imágenes: ${totalUploaded}`);
    console.log(`   Errores: ${errors.length}`);

    // 5. Resumen
    console.log('\n━'.repeat(80));
    console.log('📊 RESUMEN');
    console.log('━'.repeat(80));

    console.log(`\n✅ Imágenes subidas: ${totalUploaded}`);

    if (errors.length > 0) {
      console.log(`\n⚠️  Errores encontrados: ${errors.length}`);
      errors.forEach(e => {
        console.log(`   - ${e.image}: ${e.error}`);
      });
    }

    console.log('\n━'.repeat(80));

    if (!DRY_RUN) {
      console.log('\n✅ SIGUIENTE PASO:');
      console.log('   1. Verificar imágenes en Directus Admin → File Library');
      console.log('   2. Ejecutar: node scripts/migration/migrate-productos-to-directus.js\n');
    } else {
      console.log('\n⚠️  DRY RUN COMPLETADO');
      console.log('   Ejecutar sin --dry-run para subir imágenes reales\n');
    }

    return mappingData;

  } catch (error) {
    console.error('\n❌ Error fatal:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Ejecutar
uploadProductImages()
  .then(() => {
    console.log('✅ Proceso completado\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
