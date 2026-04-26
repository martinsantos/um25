/**
 * Script para optimizar imágenes de servicios
 * Genera versiones WebP en múltiples tamaños para srcset responsive
 *
 * Uso: node scripts/optimize-service-images.js
 */

import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuración
const SERVICES_DIR = path.join(__dirname, '../public/images/services');
const SIZES = [400, 800, 1600]; // Tamaños para srcset
const QUALITY = 95; // Calidad alta para evitar artefactos
const FORMAT = 'webp'; // Formato moderno con mejor compresión

/**
 * Procesa una imagen de servicio generando múltiples versiones optimizadas
 */
async function processServiceImage(imageNumber) {
  const sourcePath = path.join(SERVICES_DIR, `${imageNumber}.png`);

  console.log(`\n📸 Procesando servicio ${imageNumber}...`);

  try {
    // Verificar que el archivo fuente existe
    await fs.access(sourcePath);

    // Generar versión para cada tamaño
    for (const size of SIZES) {
      const outputPath = path.join(SERVICES_DIR, `${imageNumber}-${size}.${FORMAT}`);

      await sharp(sourcePath)
        .resize(size, size, {
          fit: 'cover',        // Recortar para llenar el espacio
          position: 'center'   // Centrar el recorte
        })
        .webp({
          quality: QUALITY,
          effort: 6           // Mayor esfuerzo de compresión (0-6)
        })
        .toFile(outputPath);

      const stats = await fs.stat(outputPath);
      const sizeKB = (stats.size / 1024).toFixed(2);
      console.log(`  ✅ ${size}x${size} → ${imageNumber}-${size}.${FORMAT} (${sizeKB} KB)`);
    }

    // Generar también versión WebP del tamaño original para fallback
    const originalWebpPath = path.join(SERVICES_DIR, `${imageNumber}-original.${FORMAT}`);
    await sharp(sourcePath)
      .webp({ quality: QUALITY, effort: 6 })
      .toFile(originalWebpPath);

    const stats = await fs.stat(originalWebpPath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    console.log(`  ✅ Original → ${imageNumber}-original.${FORMAT} (${sizeKB} KB)`);

  } catch (error) {
    console.error(`  ❌ Error procesando imagen ${imageNumber}:`, error.message);
  }
}

/**
 * Procesa todas las imágenes de servicios (1-8)
 */
async function processAllImages() {
  console.log('🚀 Iniciando optimización de imágenes de servicios...\n');
  console.log(`📋 Configuración:`);
  console.log(`   - Tamaños: ${SIZES.join(', ')} px`);
  console.log(`   - Formato: ${FORMAT.toUpperCase()}`);
  console.log(`   - Calidad: ${QUALITY}%`);
  console.log(`   - Fit: cover (square crop)`);

  // Procesar cada imagen secuencialmente
  for (let i = 1; i <= 8; i++) {
    await processServiceImage(i);
  }

  console.log('\n\n✨ Optimización completada con éxito!');
  console.log('\n📊 Resumen:');
  console.log(`   - ${8} imágenes originales procesadas`);
  console.log(`   - ${8 * (SIZES.length + 1)} archivos WebP generados`);
  console.log(`   - Tamaños disponibles: ${SIZES.join('w, ')}w, original`);
  console.log('\n💡 Próximo paso: Actualizar ServiceCard.astro para usar srcset');
}

// Ejecutar
processAllImages().catch(console.error);
