#!/usr/bin/env node

/**
 * MIGRACIÓN: Actualizar campos V4 en Servicios existentes
 *
 * Este script actualiza los servicios existentes en Directus con los nuevos campos V4:
 * - subtitulo
 * - stats
 * - marcas
 * - por_que_elegirnos
 * - area
 * - slug
 *
 * Pre-requisitos:
 * - Campos V4 agregados a colección 'Servicios' en Directus
 * - Servicios existentes con IDs 101-106
 *
 * Uso:
 *   node scripts/migration/migrate-servicios-v4-fields.js
 *   node scripts/migration/migrate-servicios-v4-fields.js --dry-run
 */

import { createDirectus, rest, updateItem } from '@directus/sdk';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

// Importar datos
const { default: serviciosCompletos } = await import('../../src/data/servicios_completos_v4.js');

// Configuración
const DIRECTUS_URL = process.env.PUBLIC_DIRECTUS_URL || 'http://localhost:8055';
const DIRECTUS_TOKEN = process.env.PUBLIC_DIRECTUS_TOKEN;
const DRY_RUN = process.argv.includes('--dry-run');

if (!DIRECTUS_TOKEN) {
  console.error('❌ Error: PUBLIC_DIRECTUS_TOKEN no configurado');
  process.exit(1);
}

const directus = createDirectus(DIRECTUS_URL).with(rest());

// ==========================================
// FUNCIONES
// ==========================================

/**
 * Genera slug URL-friendly
 */
function generateSlug(titulo) {
  return titulo
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .trim();
}

/**
 * Convierte servicio JS a datos V4
 */
function convertToV4Fields(servicio) {
  return {
    subtitulo: servicio.Subtitulo || null,
    stats: servicio.Stats || null,
    marcas: servicio.Marcas || null,
    por_que_elegirnos: servicio.PorQueElegirnos || null,
    area: servicio.Area || null,
    slug: generateSlug(servicio.Titulo)
  };
}

/**
 * Actualiza un servicio en Directus
 */
async function updateServicio(servicioId, v4Fields) {
  if (DRY_RUN) {
    console.log(`  📋 [DRY-RUN] Servicio ${servicioId}:`);
    console.log(`     subtitulo: "${v4Fields.subtitulo}"`);
    console.log(`     area: "${v4Fields.area}"`);
    console.log(`     slug: "${v4Fields.slug}"`);
    console.log(`     stats: ${v4Fields.stats ? v4Fields.stats.length : 0} items`);
    console.log(`     marcas: ${v4Fields.marcas ? v4Fields.marcas.length : 0} items`);
    return { success: true, dryRun: true };
  }

  try {
    const result = await directus.request(
      updateItem('Servicios', servicioId, v4Fields)
    );

    console.log(`  ✅ Actualizado: Servicio ${servicioId} (${v4Fields.slug})`);
    return { success: true, result };
  } catch (error) {
    console.error(`  ❌ Error en servicio ${servicioId}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Verifica que el servicio existe en Directus
 */
async function checkServicioExists(servicioId) {
  try {
    const response = await fetch(
      `${DIRECTUS_URL}/items/Servicios/${servicioId}`,
      {
        headers: {
          'Authorization': `Bearer ${DIRECTUS_TOKEN}`
        }
      }
    );

    return response.ok;
  } catch {
    return false;
  }
}

// ==========================================
// MAIN
// ==========================================

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  MIGRACIÓN: Campos V4 en Servicios                     ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  if (DRY_RUN) {
    console.log('🔍 MODO DRY-RUN: No se modificará la base de datos\n');
  }

  // 1. Verificar conexión
  console.log('1️⃣  Verificando conexión...');
  try {
    const response = await fetch(`${DIRECTUS_URL}/server/info`, {
      headers: { 'Authorization': `Bearer ${DIRECTUS_TOKEN}` }
    });
    if (!response.ok) throw new Error('Conexión fallida');
    console.log(`   ✅ Conectado a: ${DIRECTUS_URL}\n`);
  } catch (error) {
    console.error('   ❌ Error:', error.message);
    process.exit(1);
  }

  // 2. Cargar servicios de JS
  console.log('2️⃣  Cargando servicios desde JS...');
  const servicios = Object.values(serviciosCompletos);
  console.log(`   ✅ ${servicios.length} servicios cargados\n`);

  // 3. Verificar servicios en Directus
  console.log('3️⃣  Verificando servicios en Directus...');
  const serviciosStatus = [];

  for (const servicio of servicios) {
    const exists = await checkServicioExists(servicio.id);
    serviciosStatus.push({ id: servicio.id, exists });

    if (exists) {
      console.log(`   ✅ Servicio ${servicio.id}: ${servicio.Titulo}`);
    } else {
      console.log(`   ⚠️  Servicio ${servicio.id}: NO ENCONTRADO en Directus`);
    }
  }

  const existingCount = serviciosStatus.filter(s => s.exists).length;
  console.log(`\n   ${existingCount}/${servicios.length} servicios encontrados en Directus\n`);

  if (existingCount === 0) {
    console.error('❌ No hay servicios en Directus para actualizar');
    process.exit(1);
  }

  // 4. Actualizar servicios
  console.log('4️⃣  Actualizando campos V4...');
  console.log('   ════════════════════════════════════════════════════════\n');

  const stats = {
    total: existingCount,
    success: 0,
    errors: 0,
    skipped: servicios.length - existingCount
  };

  for (const servicio of servicios) {
    const servicioStatus = serviciosStatus.find(s => s.id === servicio.id);

    if (!servicioStatus.exists) {
      console.log(`  ⏭️  Saltando servicio ${servicio.id} (no existe en Directus)`);
      continue;
    }

    const v4Fields = convertToV4Fields(servicio);
    const result = await updateServicio(servicio.id, v4Fields);

    if (result.success) {
      stats.success++;
    } else {
      stats.errors++;
    }
  }

  // 5. Resumen
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  RESUMEN DE MIGRACIÓN                                  ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  console.log(`  📊 Servicios a procesar: ${stats.total}`);
  console.log(`  ✅ Actualizados:         ${stats.success}`);
  console.log(`  ❌ Errores:              ${stats.errors}`);
  console.log(`  ⏭️  Saltados:            ${stats.skipped}`);

  if (DRY_RUN) {
    console.log('\n  🔍 Modo DRY-RUN: Ejecutar sin --dry-run para aplicar cambios');
  } else {
    console.log('\n  ✅ Migración completada');

    // Mostrar verificación de slugs
    console.log('\n  📝 Slugs generados:');
    servicios.forEach(s => {
      const slug = generateSlug(s.Titulo);
      console.log(`     ${s.id}: /${slug}`);
    });
  }

  console.log('\n═══════════════════════════════════════════════════════════\n');

  process.exit(stats.errors > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('\n❌ Error fatal:', error);
  process.exit(1);
});
