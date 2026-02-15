#!/usr/bin/env node

/**
 * MIGRACIÓN: Productos JS → Directus
 *
 * Este script migra los ~40 productos desde servicios_completos_v4.js
 * a la colección 'productos' en Directus.
 *
 * Pre-requisitos:
 * - Colección 'productos' creada en Directus
 * - Servicios existentes en Directus (con IDs 101-106)
 * - Imágenes de productos ya subidas (ejecutar upload-product-images.js primero)
 *
 * Uso:
 *   node scripts/migration/migrate-productos-to-directus.js
 *   node scripts/migration/migrate-productos-to-directus.js --dry-run  # Modo prueba
 */

import { createDirectus, rest, createItem } from '@directus/sdk';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

// ESM fix para __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar .env desde raíz del proyecto
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Importar datos de servicios
const { default: serviciosCompletos } = await import('../../src/data/servicios_completos_v4.js');

// Cargar mapping de imágenes (UUID)
import fs from 'fs';
const mappingPath = path.join(__dirname, '../../scratchpad/uploaded-assets-mapping.json');
let assetsMapping = {};

if (fs.existsSync(mappingPath)) {
  const mappingData = JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));
  assetsMapping = mappingData.mapping || {};
  console.log(`📂 Mapping de assets cargado: ${Object.keys(assetsMapping).length} imágenes\n`);
} else {
  console.warn('⚠️  Warning: No se encontró uploaded-assets-mapping.json');
  console.warn('   Las imágenes no se vincularán. Ejecutar primero: upload-product-images.js\n');
}

// Configuración
const DIRECTUS_URL = process.env.PUBLIC_DIRECTUS_URL || 'http://localhost:8055';
const DIRECTUS_TOKEN = process.env.DIRECTUS_STATIC_TOKEN || process.env.PUBLIC_DIRECTUS_TOKEN;
const DRY_RUN = process.argv.includes('--dry-run');

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
 * Convierte imagen JS a formato Directus (UUID)
 * Usa el mapping generado por upload-product-images.js
 */
function convertImagePath(jsImagePath) {
  // Formato JS: '/images/services/productos/infraestructura/1.1.png'
  // Extraer: 'infraestructura/1.1.png'

  if (!jsImagePath) return null;

  const match = jsImagePath.match(/\/productos\/(.+\.png)/);
  if (!match) return null;

  const tag = match[1]; // e.g., 'infraestructura/1.1.png'
  const uuid = assetsMapping[tag];

  if (!uuid) {
    console.warn(`   ⚠️  Imagen no encontrada en mapping: ${tag}`);
    return null;
  }

  return uuid;
}

/**
 * Migra un producto individual a Directus
 */
async function migrateProducto(producto, servicioId, orden) {
  const productoData = {
    servicio_id: servicioId,
    titulo: producto.titulo,
    descripcion: producto.descripcion,
    imagen: convertImagePath(producto.imagen),
    features: producto.features || [],
    destacado: producto.destacado || null,
    orden: orden,
    status: 'published'
  };

  if (DRY_RUN) {
    console.log('  📋 [DRY-RUN] Producto:', productoData.titulo);
    console.log('     Servicio:', servicioId, '| Orden:', orden);
    return { success: true, dryRun: true };
  }

  try {
    // Usar fetch directamente en vez del SDK
    const response = await fetch(`${DIRECTUS_URL}/items/productos`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(productoData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    const productId = result.data.id;

    console.log(`  ✅ Creado: ${productoData.titulo} (ID: ${productId})`);
    return { success: true, id: productId };
  } catch (error) {
    console.error(`  ❌ Error en "${productoData.titulo}":`, error.message.substring(0, 200));
    return { success: false, error: error.message };
  }
}

/**
 * Migra todos los productos de un servicio
 */
async function migrateServicioProductos(servicio) {
  const servicioId = servicio.id;
  const servicioTitulo = servicio.Titulo;
  const productos = servicio.Productos || [];

  console.log(`\n📦 Servicio ${servicioId}: ${servicioTitulo}`);
  console.log(`   ${productos.length} productos a migrar`);

  if (productos.length === 0) {
    console.log('   ⚠️  No tiene productos');
    return { total: 0, success: 0, errors: 0 };
  }

  const results = {
    total: productos.length,
    success: 0,
    errors: 0
  };

  for (let i = 0; i < productos.length; i++) {
    const producto = productos[i];
    const result = await migrateProducto(producto, servicioId, i);

    if (result.success) {
      results.success++;
    } else {
      results.errors++;
    }
  }

  console.log(`   ✅ ${results.success}/${results.total} productos migrados`);
  if (results.errors > 0) {
    console.log(`   ❌ ${results.errors} errores`);
  }

  return results;
}

/**
 * Verifica conectividad con Directus
 */
async function checkDirectusConnection() {
  try {
    // Intentar obtener colecciones para verificar conexión
    const response = await fetch(`${DIRECTUS_URL}/collections`, {
      headers: {
        'Authorization': `Bearer ${DIRECTUS_TOKEN}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('❌ Error conectando a Directus:', error.message);
    return false;
  }
}

/**
 * Verifica que la colección productos existe
 */
async function checkProductosCollection() {
  try {
    const response = await fetch(`${DIRECTUS_URL}/collections/productos`, {
      headers: {
        'Authorization': `Bearer ${DIRECTUS_TOKEN}`
      }
    });

    if (!response.ok) {
      throw new Error('Colección productos no existe');
    }

    return true;
  } catch (error) {
    console.error('❌ Error: Colección "productos" no encontrada');
    console.log('💡 Ejecutar primero: Crear schema según docs/DIRECTUS_SCHEMA_SETUP.md');
    return false;
  }
}

/**
 * Cuenta productos existentes en Directus
 */
async function countExistingProductos() {
  try {
    const response = await fetch(
      `${DIRECTUS_URL}/items/productos?aggregate[count]=*`,
      {
        headers: {
          'Authorization': `Bearer ${DIRECTUS_TOKEN}`
        }
      }
    );

    if (!response.ok) return 0;

    const data = await response.json();
    return data.data?.[0]?.count || 0;
  } catch {
    return 0;
  }
}

// ==========================================
// MAIN
// ==========================================

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  MIGRACIÓN: Productos JS → Directus                    ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  if (DRY_RUN) {
    console.log('🔍 MODO DRY-RUN: No se modificará la base de datos\n');
  }

  // 1. Verificar conexión
  console.log('1️⃣  Verificando conexión a Directus...');
  const isConnected = await checkDirectusConnection();
  if (!isConnected) {
    console.log('\n❌ Abortando migración');
    process.exit(1);
  }
  console.log(`   ✅ Conectado a: ${DIRECTUS_URL}\n`);

  // 2. Verificar colección productos
  console.log('2️⃣  Verificando colección "productos"...');
  const collectionExists = await checkProductosCollection();
  if (!collectionExists) {
    console.log('\n❌ Abortando migración');
    process.exit(1);
  }

  const existingCount = await countExistingProductos();
  console.log(`   ✅ Colección existe (${existingCount} productos actuales)\n`);

  if (existingCount > 0 && !DRY_RUN) {
    console.log('⚠️  ADVERTENCIA: Ya existen productos en Directus');
    console.log('   Esta migración creará productos adicionales.');
    console.log('   Si deseas limpiar primero, ejecuta:');
    console.log('   DELETE FROM productos; (en PostgreSQL)\n');
  }

  // 3. Cargar servicios de JS
  console.log('3️⃣  Cargando servicios desde JS...');
  const servicios = Object.values(serviciosCompletos);
  console.log(`   ✅ ${servicios.length} servicios cargados\n`);

  // 4. Migrar productos
  console.log('4️⃣  Migrando productos...');
  console.log('   ════════════════════════════════════════════════════════\n');

  const totalStats = {
    servicios: servicios.length,
    productosTotal: 0,
    productosSuccess: 0,
    productosErrors: 0
  };

  for (const servicio of servicios) {
    const results = await migrateServicioProductos(servicio);
    totalStats.productosTotal += results.total;
    totalStats.productosSuccess += results.success;
    totalStats.productosErrors += results.errors;
  }

  // 5. Resumen final
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  RESUMEN DE MIGRACIÓN                                  ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  console.log(`  📊 Servicios procesados: ${totalStats.servicios}`);
  console.log(`  📦 Productos totales:    ${totalStats.productosTotal}`);
  console.log(`  ✅ Migrados exitosos:    ${totalStats.productosSuccess}`);
  console.log(`  ❌ Errores:              ${totalStats.productosErrors}`);

  if (DRY_RUN) {
    console.log('\n  🔍 Modo DRY-RUN: Ejecutar sin --dry-run para aplicar cambios');
  } else {
    console.log('\n  ✅ Migración completada');
  }

  console.log('\n═══════════════════════════════════════════════════════════\n');

  // Exit code
  if (totalStats.productosErrors > 0 && !DRY_RUN) {
    console.log('⚠️  Migración completada con errores');
    process.exit(1);
  } else {
    process.exit(0);
  }
}

// Ejecutar
main().catch((error) => {
  console.error('\n❌ Error fatal:', error);
  process.exit(1);
});
