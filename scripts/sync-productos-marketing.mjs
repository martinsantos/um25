#!/usr/bin/env node
/**
 * Sync Productos from Marketing Documents to Directus
 *
 * ⚠️  PRECAUCIÓN: Este script lee UUIDs de scripts/data/image-uuid-mapping.json
 * y los asigna a productos en Directus. Si image-uuid-mapping.json contiene UUIDs
 * incorrectos (por ejemplo, generados por upload-service-images.mjs), este script
 * SOBREESCRIBIRÁ los UUIDs correctos de producción, rompiendo las imágenes.
 *
 * ANTES de ejecutar con --execute:
 * 1. Verifica que image-uuid-mapping.json coincide con src/data/image-local-map.json
 * 2. NUNCA ejecutes upload-service-images.mjs antes de este script (crea UUIDs duplicados)
 * 3. Ejecuta primero en dry-run (sin --execute) para revisar los cambios
 *
 * Uso:
 *   node scripts/sync-productos-marketing.mjs              # Modo dry-run (solo muestra cambios)
 *   node scripts/sync-productos-marketing.mjs --execute    # Ejecuta los cambios
 *   node scripts/sync-productos-marketing.mjs --service=103  # Solo un servicio específico
 *
 * Requisitos:
 * - Directus corriendo
 * - scripts/data/productos-marketing.json
 * - scripts/data/image-uuid-mapping.json (UUIDs de producción — ver image-local-map.json)
 */

import { createDirectus, rest, readItems, readItem, createItem, updateItem, deleteItem, staticToken } from '@directus/sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración
const DIRECTUS_URL = process.env.PUBLIC_DIRECTUS_URL || 'http://23.105.176.45:8055';
const DIRECTUS_TOKEN = process.env.PUBLIC_DIRECTUS_TOKEN || 'k6P8LAY8_x_y1miB_KTlWnysCnx2Abky';

const MARKETING_DATA_FILE = path.resolve(__dirname, 'data/productos-marketing.json');
const IMAGE_MAPPING_FILE = path.resolve(__dirname, 'data/image-uuid-mapping.json');

// Parse CLI arguments
const args = process.argv.slice(2);
const EXECUTE_MODE = args.includes('--execute');
const SERVICE_FILTER = args.find(a => a.startsWith('--service='))?.split('=')[1];

const client = createDirectus(DIRECTUS_URL)
  .with(staticToken(DIRECTUS_TOKEN))
  .with(rest());

// Mapeo de unidades a IDs de servicio (será actualizado al consultar Directus)
const UNIDAD_TO_SERVICE_ID = {
  1: null, // Infraestructura
  2: null, // Seguridad
  3: 103,  // Telecomunicaciones (conocido)
  4: null, // Software
  5: null, // Soporte
  6: null, // Consultoría
  7: null, // Detección Incendios
  8: null  // Eléctricos
};

// Palabras clave para mapear servicios
const SERVICE_KEYWORDS = {
  1: ['infraestructura', 'redes', 'cableado', 'fibra'],
  2: ['seguridad', 'cctv', 'control acceso', 'videovigilancia'],
  3: ['telecomunicaciones', 'telefonía', 'telefonia', 'citofonia'],
  4: ['software', 'desarrollo', 'aplicaciones'],
  5: ['soporte', 'mantenimiento', 'tic', 'help desk'],
  6: ['consultoría', 'consultoria', 'licitaciones'],
  7: ['incendio', 'sdi', 'detección de incendio'],
  8: ['eléctrico', 'electrico', 'ups', 'energía', 'data center']
};

async function loadMarketingData() {
  if (!fs.existsSync(MARKETING_DATA_FILE)) {
    console.error(`❌ Marketing data file not found: ${MARKETING_DATA_FILE}`);
    console.log('💡 Run the script to generate it first');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(MARKETING_DATA_FILE, 'utf-8'));
}

function loadImageMapping() {
  if (!fs.existsSync(IMAGE_MAPPING_FILE)) {
    console.log('⚠️  Image mapping file not found. Images will not be updated.');
    console.log('💡 Run upload-service-images.mjs first to upload images\n');
    return {};
  }
  return JSON.parse(fs.readFileSync(IMAGE_MAPPING_FILE, 'utf-8'));
}

async function fetchAllServicios() {
  try {
    const response = await client.request(
      readItems('Servicios', {
        fields: ['id', 'Titulo', 'Area'],
        limit: -1
      })
    );
    return response || [];
  } catch (error) {
    console.error('Error fetching servicios:', error.message);
    return [];
  }
}

async function fetchProductosByServicio(servicioId) {
  try {
    const response = await client.request(
      readItems('productos', {
        filter: { servicio_id: { _eq: servicioId } },
        fields: ['id', 'titulo', 'descripcion', 'imagen', 'features', 'destacado', 'orden'],
        sort: ['orden', 'id']
      })
    );
    return response || [];
  } catch (error) {
    console.error(`Error fetching productos for servicio ${servicioId}:`, error.message);
    return [];
  }
}

function mapServicioToUnidad(servicio) {
  const titulo = (servicio.Titulo || '').toLowerCase();

  for (const [unidad, keywords] of Object.entries(SERVICE_KEYWORDS)) {
    if (keywords.some(kw => titulo.includes(kw))) {
      return parseInt(unidad);
    }
  }
  return null;
}

function normalizeTitle(title) {
  return (title || '').toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // Remove accents
}

async function createProducto(producto) {
  try {
    const response = await client.request(
      createItem('productos', producto)
    );
    return response;
  } catch (error) {
    console.error(`Error creating producto: ${error.message}`);
    return null;
  }
}

async function updateProducto(id, producto) {
  try {
    const response = await client.request(
      updateItem('productos', id, producto)
    );
    return response;
  } catch (error) {
    console.error(`Error updating producto ${id}: ${error.message}`);
    return null;
  }
}

async function deleteProducto(id) {
  try {
    await client.request(
      deleteItem('productos', id)
    );
    return true;
  } catch (error) {
    console.error(`Error deleting producto ${id}: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  Sync Productos from Marketing Documents               ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  console.log(`Mode: ${EXECUTE_MODE ? '🚀 EXECUTE (changes will be applied)' : '👀 DRY-RUN (preview only)'}`);
  if (SERVICE_FILTER) {
    console.log(`Filter: Service ID ${SERVICE_FILTER} only`);
  }
  console.log(`Directus URL: ${DIRECTUS_URL}\n`);

  // Verificar conexión
  try {
    const servicios = await fetchAllServicios();
    if (servicios.length === 0) {
      throw new Error('No servicios found - check connection');
    }
    console.log(`✅ Connected to Directus (${servicios.length} servicios found)\n`);

    // Mapear servicios a unidades
    console.log('📋 Service to Unit Mapping:');
    for (const servicio of servicios) {
      const unidad = mapServicioToUnidad(servicio);
      if (unidad) {
        UNIDAD_TO_SERVICE_ID[unidad] = servicio.id;
        console.log(`   Unidad ${unidad} → ID ${servicio.id}: ${servicio.Titulo}`);
      } else {
        console.log(`   ❓ No match for ID ${servicio.id}: ${servicio.Titulo}`);
      }
    }
    console.log('');

  } catch (error) {
    console.error('❌ Cannot connect to Directus:', error.message);
    console.log('\n💡 Make sure Directus is running');
    process.exit(1);
  }

  // Cargar datos
  const marketingData = await loadMarketingData();
  const imageMapping = loadImageMapping();

  console.log(`📂 Loaded marketing data: ${marketingData.servicios.length} unidades, ${marketingData.meta.totalProducts} productos`);
  console.log(`📂 Loaded image mapping: ${Object.keys(imageMapping).length} images\n`);

  // Estadísticas
  const stats = {
    created: 0,
    updated: 0,
    deleted: 0,
    unchanged: 0,
    errors: 0
  };

  // Cambios pendientes (para dry-run)
  const pendingChanges = [];

  // Procesar cada unidad
  for (const unidad of marketingData.servicios) {
    const servicioId = UNIDAD_TO_SERVICE_ID[unidad.unidad];

    if (!servicioId) {
      console.log(`\n⚠️  Unidad ${unidad.unidad} (${unidad.titulo}): No matching service found in Directus`);
      continue;
    }

    if (SERVICE_FILTER && servicioId.toString() !== SERVICE_FILTER) {
      continue;
    }

    console.log(`\n═══════════════════════════════════════════════════════════`);
    console.log(`📦 Unidad ${unidad.unidad}: ${unidad.titulo}`);
    console.log(`   Directus Service ID: ${servicioId}`);
    console.log(`   Expected productos: ${unidad.productos.length}`);

    // Obtener productos actuales
    const currentProductos = await fetchProductosByServicio(servicioId);
    console.log(`   Current productos: ${currentProductos.length}`);

    // Crear mapa de productos actuales por título normalizado
    const currentByTitle = new Map();
    for (const p of currentProductos) {
      const key = normalizeTitle(p.titulo);
      if (!currentByTitle.has(key)) {
        currentByTitle.set(key, []);
      }
      currentByTitle.get(key).push(p);
    }

    // Procesar productos esperados
    const processedIds = new Set();

    for (const expected of unidad.productos) {
      const expectedTitle = normalizeTitle(expected.titulo);
      const imageUuid = imageMapping[expected.imagen] || null;

      // Buscar producto existente
      const existing = currentByTitle.get(expectedTitle)?.[0];

      const productoData = {
        servicio_id: servicioId,
        titulo: expected.titulo,
        descripcion: expected.descripcion,
        destacado: expected.destacado,
        features: expected.features,
        imagen: imageUuid,
        orden: expected.orden,
        estado: 'publicado'
      };

      if (existing) {
        processedIds.add(existing.id);

        // Verificar si necesita actualización
        const needsUpdate =
          existing.titulo !== expected.titulo ||
          existing.descripcion !== expected.descripcion ||
          existing.destacado !== expected.destacado ||
          JSON.stringify(existing.features) !== JSON.stringify(expected.features) ||
          existing.orden !== expected.orden ||
          (imageUuid && existing.imagen !== imageUuid);

        if (needsUpdate) {
          console.log(`   🔄 UPDATE: "${expected.titulo}" (ID: ${existing.id})`);
          pendingChanges.push({ action: 'update', id: existing.id, data: productoData });

          if (EXECUTE_MODE) {
            const result = await updateProducto(existing.id, productoData);
            if (result) {
              stats.updated++;
            } else {
              stats.errors++;
            }
          } else {
            stats.updated++;
          }
        } else {
          console.log(`   ✓ UNCHANGED: "${expected.titulo}"`);
          stats.unchanged++;
        }
      } else {
        console.log(`   ➕ CREATE: "${expected.titulo}"`);
        pendingChanges.push({ action: 'create', data: productoData });

        if (EXECUTE_MODE) {
          const result = await createProducto(productoData);
          if (result) {
            stats.created++;
          } else {
            stats.errors++;
          }
        } else {
          stats.created++;
        }
      }
    }

    // Identificar productos a eliminar (están en Directus pero no en marketing)
    for (const current of currentProductos) {
      if (!processedIds.has(current.id)) {
        console.log(`   ➖ DELETE: "${current.titulo}" (ID: ${current.id})`);
        pendingChanges.push({ action: 'delete', id: current.id, titulo: current.titulo });

        if (EXECUTE_MODE) {
          const result = await deleteProducto(current.id);
          if (result) {
            stats.deleted++;
          } else {
            stats.errors++;
          }
        } else {
          stats.deleted++;
        }
      }
    }
  }

  // Resumen
  console.log('\n\n═══════════════════════════════════════════════════════════');
  console.log('📊 SUMMARY\n');

  if (EXECUTE_MODE) {
    console.log('   Changes APPLIED:');
  } else {
    console.log('   Changes PENDING (run with --execute to apply):');
  }

  console.log(`   ➕ Created:   ${stats.created}`);
  console.log(`   🔄 Updated:   ${stats.updated}`);
  console.log(`   ➖ Deleted:   ${stats.deleted}`);
  console.log(`   ✓ Unchanged: ${stats.unchanged}`);

  if (stats.errors > 0) {
    console.log(`   ❌ Errors:    ${stats.errors}`);
  }

  console.log('\n═══════════════════════════════════════════════════════════');

  if (!EXECUTE_MODE && (stats.created > 0 || stats.updated > 0 || stats.deleted > 0)) {
    console.log('\n💡 To apply these changes, run:');
    console.log('   node scripts/sync-productos-marketing.mjs --execute\n');
  }

  // Guardar log de cambios
  const logFile = path.resolve(__dirname, 'data/sync-log.json');
  fs.writeFileSync(logFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    mode: EXECUTE_MODE ? 'execute' : 'dry-run',
    stats,
    changes: pendingChanges
  }, null, 2));

  console.log(`📄 Log saved to: ${logFile}\n`);
}

main().catch(console.error);
