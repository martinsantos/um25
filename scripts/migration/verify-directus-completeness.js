#!/usr/bin/env node
/**
 * Verify Directus Completeness - Verifica que todo esté 100% en Directus
 */

import { createDirectus, rest, readItems } from '@directus/sdk';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const DIRECTUS_URL = process.env.PUBLIC_DIRECTUS_URL || 'http://localhost:8055';
const DIRECTUS_TOKEN = process.env.DIRECTUS_STATIC_TOKEN || process.env.PUBLIC_DIRECTUS_TOKEN;

import fetch from 'node-fetch';

// Usar fetch directamente con token
async function fetchFromDirectus(collection, options = {}) {
  const queryParams = new URLSearchParams();
  if (options.limit) queryParams.append('limit', options.limit);
  if (options.filter) queryParams.append('filter', JSON.stringify(options.filter));

  const url = `${DIRECTUS_URL}/items/${collection}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  return data.data;
}

const directus = createDirectus(DIRECTUS_URL).with(rest());

async function verifyCompleteness() {
  console.log('✅ Verificando completitud de Directus...\n');
  console.log('━'.repeat(80));

  const results = {
    timestamp: new Date().toISOString(),
    tests: [],
    passed: 0,
    failed: 0
  };

  try {
    // Test 1: 8 servicios
    console.log('\n1️⃣  Verificando servicios...');
    const servicios = await fetchFromDirectus('Servicios', { limit: -1 });
    const test1 = servicios.length === 8;
    results.tests.push({
      name: '8 servicios en Directus',
      expected: 8,
      actual: servicios.length,
      passed: test1
    });
    console.log(test1 ? `   ✅ PASS: ${servicios.length} servicios` : `   ❌ FAIL: ${servicios.length}/8 servicios`);
    if (test1) results.passed++; else results.failed++;

    // Test 2: 53 productos (lo que teníamos en el fallback)
    console.log('\n2️⃣  Verificando productos...');
    let productos = [];
    try {
      productos = await fetchFromDirectus('productos', { limit: -1 });
    } catch (error) {
      console.error(`   ❌ Error leyendo productos: ${error.message}`);
      throw error;
    }
    const test2 = productos.length >= 53; // >= porque pudimos haber agregado más
    results.tests.push({
      name: '53+ productos en colección productos',
      expected: 53,
      actual: productos.length,
      passed: test2
    });
    console.log(test2 ? `   ✅ PASS: ${productos.length} productos` : `   ❌ FAIL: ${productos.length}/53 productos`);
    if (test2) results.passed++; else results.failed++;

    // Test 3: Todos los productos tienen imagen
    console.log('\n3️⃣  Verificando imágenes...');
    const productosSinImagen = productos.filter(p => !p.imagen);
    const test3 = productosSinImagen.length === 0;
    results.tests.push({
      name: 'Todos los productos tienen imagen',
      expected: 0,
      actual: productosSinImagen.length,
      passed: test3
    });
    console.log(test3 ? '   ✅ PASS: Todos los productos tienen imagen' : `   ❌ FAIL: ${productosSinImagen.length} productos sin imagen`);
    if (test3) results.passed++; else results.failed++;

    if (!test3) {
      console.log('\n   Productos sin imagen:');
      productosSinImagen.forEach(p => {
        console.log(`   - ${p.titulo} (Servicio ${p.servicio_id})`);
      });
    }

    // Test 4: Relaciones servicio_id válidas
    console.log('\n4️⃣  Verificando relaciones...');
    const servicioIds = servicios.map(s => s.id);
    const productosConServicioInvalido = productos.filter(p => !servicioIds.includes(p.servicio_id));
    const test4 = productosConServicioInvalido.length === 0;
    results.tests.push({
      name: 'Todos los productos tienen servicio_id válido',
      expected: 0,
      actual: productosConServicioInvalido.length,
      passed: test4
    });
    console.log(test4 ? '   ✅ PASS: Todas las relaciones válidas' : `   ❌ FAIL: ${productosConServicioInvalido.length} relaciones inválidas`);
    if (test4) results.passed++; else results.failed++;

    // Test 5: Assets existen
    console.log('\n5️⃣  Verificando assets...');
    try {
      const assets = await fetchFromDirectus('directus_files', {
        limit: -1,
        filter: { folder: { _nnull: true } }
      });
      const test5 = assets.length >= 101; // Subimos 101 imágenes
      results.tests.push({
        name: '101+ assets en Directus',
        expected: 101,
        actual: assets.length,
        passed: test5
      });
      console.log(test5 ? `   ✅ PASS: ${assets.length} assets` : `   ❌ FAIL: ${assets.length}/101 assets`);
      if (test5) results.passed++; else results.failed++;
    } catch (error) {
      console.log(`   ⚠️  No se pudieron verificar assets: ${error.message}`);
      results.tests.push({
        name: 'Verificar assets',
        error: error.message,
        passed: false
      });
      results.failed++;
    }

    // Test 6: Productos por servicio
    console.log('\n6️⃣  Verificando distribución por servicio...');
    const productosPorServicio = {};
    servicioIds.forEach(id => {
      productosPorServicio[id] = productos.filter(p => p.servicio_id === id).length;
    });

    console.log('\n   Productos por servicio:');
    Object.entries(productosPorServicio).forEach(([id, count]) => {
      const servicio = servicios.find(s => s.id === parseInt(id));
      console.log(`   - Servicio ${id}: ${count} productos (${servicio?.Titulo || 'N/A'})`);
    });

    const test6 = Object.values(productosPorServicio).every(count => count > 0);
    results.tests.push({
      name: 'Todos los servicios tienen al menos 1 producto',
      passed: test6,
      distribution: productosPorServicio
    });
    console.log(test6 ? '\n   ✅ PASS: Todos los servicios tienen productos' : '\n   ❌ FAIL: Algunos servicios sin productos');
    if (test6) results.passed++; else results.failed++;

    // Resumen final
    console.log('\n━'.repeat(80));
    console.log('📊 RESUMEN');
    console.log('━'.repeat(80));

    console.log(`\n✅ Tests pasados: ${results.passed}`);
    console.log(`❌ Tests fallidos: ${results.failed}`);
    console.log(`📊 Total: ${results.tests.length} tests`);

    if (results.failed === 0) {
      console.log('\n🎉 ✅ ALL CHECKS PASSED - Directus 100% complete!\n');
      console.log('   - 8 servicios ✓');
      console.log('   - 53+ productos ✓');
      console.log('   - Todas las imágenes ✓');
      console.log('   - Todas las relaciones ✓');
      console.log('   - Assets completos ✓\n');
    } else {
      console.log('\n⚠️  Algunos tests fallaron. Revisar arriba.\n');
    }

    console.log('━'.repeat(80));

    return results;

  } catch (error) {
    console.error('\n❌ Error fatal:', error.message);
    process.exit(1);
  }
}

verifyCompleteness()
  .then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
