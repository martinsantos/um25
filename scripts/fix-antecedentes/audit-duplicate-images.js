#!/usr/bin/env node

/**
 * AUDITORÍA: Imágenes Duplicadas en Antecedentes
 *
 * Identifica antecedentes que comparten la misma imagen UUID en Directus.
 * CONSIGNA: NO PUEDE HABER NINGUNA IMAGEN REPETIDA NI ASIGNADA A MÁS DE UN ANTECEDENTE.
 *
 * Output: scratchpad/duplicados-antecedentes.json
 *
 * Uso:
 *   node scripts/fix-antecedentes/audit-duplicate-images.js
 */

import { createDirectus, rest, readItems } from '@directus/sdk';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// ESM fix para __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar .env desde raíz del proyecto
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Configuración
const DIRECTUS_URL = process.env.PUBLIC_DIRECTUS_URL || 'http://localhost:8055';
const DIRECTUS_TOKEN = process.env.DIRECTUS_STATIC_TOKEN || process.env.PUBLIC_DIRECTUS_TOKEN;
const SCRATCHPAD = '/private/tmp/claude/-Users-Shared-Files-From-d-localized-D-ultima-milla-2024-MKT-2024-umw141024-umw46-main-fumbling-field/5ef45364-98da-4d05-b7ef-4aa177deb7cf/scratchpad';

// Validación
if (!DIRECTUS_TOKEN) {
  console.error('❌ Error: PUBLIC_DIRECTUS_TOKEN no configurado en .env');
  process.exit(1);
}

// Cliente Directus
const directus = createDirectus(DIRECTUS_URL).with(rest());

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

/**
 * Obtiene todos los antecedentes con imágenes
 */
async function getAllAntecedentes() {
  try {
    console.log('📥 Obteniendo antecedentes de Directus...');

    const antecedentes = await directus.request(
      readItems('antecedentes', {
        fields: [
          'id',
          'Nombre',
          'Cliente',
          'Area',
          'Titulo',
          'imagen'
        ],
        limit: -1, // Obtener todos
        filter: {
          status: { _eq: 'published' }
        }
      })
    );

    console.log(`   ✅ ${antecedentes.length} antecedentes obtenidos\n`);
    return antecedentes;
  } catch (error) {
    console.error('❌ Error obteniendo antecedentes:', error.message);
    throw error;
  }
}

/**
 * Agrupa antecedentes por imagen UUID
 */
function groupByImage(antecedentes) {
  console.log('🔍 Agrupando por imagen UUID...');

  const imageMap = new Map();
  let withoutImage = 0;

  for (const ant of antecedentes) {
    const imageUuid = ant.imagen;

    if (!imageUuid) {
      withoutImage++;
      continue;
    }

    if (!imageMap.has(imageUuid)) {
      imageMap.set(imageUuid, []);
    }

    imageMap.get(imageUuid).push({
      id: ant.id,
      nombre: ant.Nombre,
      cliente: ant.Cliente,
      area: ant.Area,
      titulo: ant.Titulo
    });
  }

  console.log(`   📊 ${imageMap.size} imágenes únicas encontradas`);
  console.log(`   ⚠️  ${withoutImage} antecedentes sin imagen\n`);

  return { imageMap, withoutImage };
}

/**
 * Identifica duplicados (imágenes usadas por >1 antecedente)
 */
function identifyDuplicates(imageMap) {
  console.log('🔎 Identificando duplicados...');

  const duplicates = [];
  let totalDuplicateCount = 0;

  for (const [imageUuid, antecedentes] of imageMap.entries()) {
    if (antecedentes.length > 1) {
      duplicates.push({
        imagen_uuid: imageUuid,
        count: antecedentes.length,
        antecedentes: antecedentes
      });
      totalDuplicateCount += antecedentes.length;
    }
  }

  // Ordenar por cantidad de duplicados (mayor a menor)
  duplicates.sort((a, b) => b.count - a.count);

  console.log(`   🚨 ${duplicates.length} imágenes duplicadas encontradas`);
  console.log(`   📌 ${totalDuplicateCount} antecedentes afectados\n`);

  return duplicates;
}

/**
 * Guarda reporte de duplicados en JSON
 */
function saveReport(duplicates, totalAntecedentes, withoutImage) {
  const outputPath = path.join(SCRATCHPAD, 'duplicados-antecedentes.json');

  const report = {
    fecha_auditoria: new Date().toISOString(),
    estadisticas: {
      total_antecedentes: totalAntecedentes,
      antecedentes_sin_imagen: withoutImage,
      imagenes_duplicadas: duplicates.length,
      antecedentes_afectados: duplicates.reduce((sum, d) => sum + d.count, 0)
    },
    duplicates: duplicates
  };

  // Crear directorio si no existe
  if (!fs.existsSync(SCRATCHPAD)) {
    fs.mkdirSync(SCRATCHPAD, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log(`💾 Reporte guardado: ${outputPath}\n`);

  return outputPath;
}

/**
 * Imprime resumen de duplicados en consola
 */
function printSummary(duplicates) {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  TOP 10 IMÁGENES MÁS DUPLICADAS                        ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  const top10 = duplicates.slice(0, 10);

  for (const dup of top10) {
    console.log(`🖼️  Imagen: ${dup.imagen_uuid.substring(0, 8)}... (${dup.count} antecedentes)`);
    for (const ant of dup.antecedentes) {
      console.log(`   - [${ant.id}] ${ant.nombre} (${ant.cliente || 'Sin cliente'})`);
    }
    console.log('');
  }

  if (duplicates.length > 10) {
    console.log(`   ... y ${duplicates.length - 10} imágenes duplicadas más\n`);
  }
}

// ==========================================
// MAIN
// ==========================================

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  AUDITORÍA: Imágenes Duplicadas en Antecedentes       ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  try {
    // 1. Obtener todos los antecedentes
    const antecedentes = await getAllAntecedentes();

    // 2. Agrupar por imagen
    const { imageMap, withoutImage } = groupByImage(antecedentes);

    // 3. Identificar duplicados
    const duplicates = identifyDuplicates(imageMap);

    // 4. Guardar reporte
    const reportPath = saveReport(duplicates, antecedentes.length, withoutImage);

    // 5. Imprimir resumen
    if (duplicates.length > 0) {
      printSummary(duplicates);
    }

    // 6. Resultado final
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║  RESUMEN DE AUDITORÍA                                  ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    console.log(`  📊 Total antecedentes:        ${antecedentes.length}`);
    console.log(`  🖼️  Imágenes únicas:           ${imageMap.size}`);
    console.log(`  🚨 Imágenes duplicadas:       ${duplicates.length}`);
    console.log(`  📌 Antecedentes afectados:    ${duplicates.reduce((sum, d) => sum + d.count, 0)}`);
    console.log(`  ⚠️  Sin imagen:                ${withoutImage}`);
    console.log(`\n  📄 Reporte: ${reportPath}\n`);

    if (duplicates.length === 0) {
      console.log('  ✅ ¡PERFECTO! No se encontraron imágenes duplicadas\n');
      process.exit(0);
    } else {
      console.log('  ⚠️  Se encontraron duplicados. Ejecutar siguiente paso:');
      console.log('     node scripts/fix-antecedentes/resolve-correct-images.js\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  }
}

// Ejecutar
main();
