#!/usr/bin/env node

/**
 * AUDIT: Productos Data Quality Check
 *
 * Verifies data integrity across all productos in Directus:
 * - Duplicate titles within same service
 * - Duplicate images across different products
 * - Missing images
 * - Products with no service association
 * - Orphaned productos (servicio_id doesn't exist)
 *
 * Usage:
 *   node audit-all-productos.mjs
 *   node audit-all-productos.mjs --service=103  # Audit specific service only
 */

import { createDirectus, rest, readItems } from '@directus/sdk';
import dotenv from 'dotenv';

dotenv.config();

const DIRECTUS_URL = process.env.PUBLIC_DIRECTUS_URL || 'http://localhost:8055';
const DIRECTUS_TOKEN = process.env.DIRECTUS_STATIC_TOKEN || process.env.PUBLIC_DIRECTUS_TOKEN || 'k6P8LAY8_x_y1miB_KTlWnysCnx2Abky';

const directus = createDirectus(DIRECTUS_URL).with(rest());

console.log('╔════════════════════════════════════════════════════════╗');
console.log('║  AUDIT: Productos Data Quality Check                  ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

const issues = {
  duplicateTitles: [],
  duplicateImages: [],
  missingImages: [],
  missingServiceId: [],
  orphanedProductos: []
};

try {
  // 1. Fetch all productos
  console.log('📥 Fetching all productos from Directus...\n');
  const productos = await directus.request(
    readItems('productos', {
      fields: ['id', 'titulo', 'servicio_id', 'imagen', 'orden'],
      sort: ['servicio_id', 'orden', 'id'],
      limit: -1
    })
  );

  console.log(`✅ Found ${productos.length} productos\n`);

  // 2. Fetch all servicios to validate service_id references
  console.log('📥 Fetching all servicios...\n');
  const servicios = await directus.request(
    readItems('Servicios', {
      fields: ['id', 'Titulo'],
      limit: -1
    })
  );

  const validServiceIds = new Set(servicios.map(s => s.id));
  console.log(`✅ Found ${servicios.length} servicios\n`);

  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('🔍 RUNNING AUDITS...\n');

  // 3. Check for missing images
  console.log('1️⃣  Checking for missing images...');
  const productosWithoutImages = productos.filter(p => !p.imagen);
  if (productosWithoutImages.length > 0) {
    console.log(`   ⚠️  Found ${productosWithoutImages.length} productos without images:`);
    productosWithoutImages.forEach(p => {
      console.log(`      - ID ${p.id}: "${p.titulo}" (Service ${p.servicio_id})`);
      issues.missingImages.push(p);
    });
  } else {
    console.log('   ✅ All productos have images');
  }
  console.log('');

  // 4. Check for duplicate images
  console.log('2️⃣  Checking for duplicate images...');
  const imageMap = new Map();
  productos.forEach(p => {
    if (!p.imagen) return;
    if (!imageMap.has(p.imagen)) {
      imageMap.set(p.imagen, []);
    }
    imageMap.get(p.imagen).push(p);
  });

  const duplicateImages = Array.from(imageMap.entries())
    .filter(([, prods]) => prods.length > 1);

  if (duplicateImages.length > 0) {
    console.log(`   ⚠️  Found ${duplicateImages.length} images used by multiple products:`);
    duplicateImages.forEach(([imageId, prods]) => {
      console.log(`\n      Image UUID: ${imageId}`);
      console.log(`      Used by ${prods.length} products:`);
      prods.forEach(p => {
        console.log(`        - ID ${p.id}: "${p.titulo}" (Service ${p.servicio_id})`);
      });
      issues.duplicateImages.push({ imageId, products: prods });
    });
  } else {
    console.log('   ✅ All product images are unique');
  }
  console.log('');

  // 5. Check for missing servicio_id
  console.log('3️⃣  Checking for productos without service association...');
  const productosWithoutService = productos.filter(p => !p.servicio_id);
  if (productosWithoutService.length > 0) {
    console.log(`   ⚠️  Found ${productosWithoutService.length} productos without servicio_id:`);
    productosWithoutService.forEach(p => {
      console.log(`      - ID ${p.id}: "${p.titulo}"`);
      issues.missingServiceId.push(p);
    });
  } else {
    console.log('   ✅ All productos have service associations');
  }
  console.log('');

  // 6. Check for orphaned productos (servicio_id doesn't exist)
  console.log('4️⃣  Checking for orphaned productos (invalid servicio_id)...');
  const orphanedProductos = productos.filter(p =>
    p.servicio_id && !validServiceIds.has(p.servicio_id)
  );
  if (orphanedProductos.length > 0) {
    console.log(`   ⚠️  Found ${orphanedProductos.length} productos with invalid servicio_id:`);
    orphanedProductos.forEach(p => {
      console.log(`      - ID ${p.id}: "${p.titulo}" (Invalid Service ID: ${p.servicio_id})`);
      issues.orphanedProductos.push(p);
    });
  } else {
    console.log('   ✅ All servicio_id references are valid');
  }
  console.log('');

  // 7. Check for duplicate titles within same service
  console.log('5️⃣  Checking for duplicate titles within same service...');
  const serviceTitleMap = new Map();
  productos.forEach(p => {
    if (!p.servicio_id) return;
    const key = `${p.servicio_id}:${p.titulo?.toLowerCase().trim()}`;
    if (!serviceTitleMap.has(key)) {
      serviceTitleMap.set(key, []);
    }
    serviceTitleMap.get(key).push(p);
  });

  const duplicateTitles = Array.from(serviceTitleMap.entries())
    .filter(([, prods]) => prods.length > 1);

  if (duplicateTitles.length > 0) {
    console.log(`   ⚠️  Found ${duplicateTitles.length} duplicate titles within services:`);
    duplicateTitles.forEach(([key, prods]) => {
      const [serviceId, title] = key.split(':');
      console.log(`\n      Service ${serviceId}: "${title}"`);
      console.log(`      Duplicates:`);
      prods.forEach(p => {
        console.log(`        - ID ${p.id} (orden: ${p.orden})`);
      });
      issues.duplicateTitles.push({ serviceId, title, products: prods });
    });
  } else {
    console.log('   ✅ No duplicate titles within services');
  }
  console.log('');

  // 8. Summary by service
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 SUMMARY BY SERVICE\n');

  const productosByService = new Map();
  productos.forEach(p => {
    const key = p.servicio_id || 'NO_SERVICE';
    if (!productosByService.has(key)) {
      productosByService.set(key, []);
    }
    productosByService.get(key).push(p);
  });

  Array.from(productosByService.entries())
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .forEach(([serviceId, prods]) => {
      const servicioData = servicios.find(s => s.id === Number(serviceId));
      const serviceName = servicioData ? servicioData.Titulo : 'Unknown';

      console.log(`\n   Service ${serviceId}: ${serviceName}`);
      console.log(`   ${prods.length} productos`);

      // Count issues for this service
      const serviceIssues = {
        missingImages: prods.filter(p => !p.imagen).length,
        duplicateImages: 0,
        duplicateTitles: 0
      };

      duplicateImages.forEach(([, dupProds]) => {
        const inThisService = dupProds.filter(p => p.servicio_id === serviceId).length;
        if (inThisService > 1) serviceIssues.duplicateImages++;
      });

      duplicateTitles.forEach(({ serviceId: sid, products: dupProds }) => {
        if (Number(sid) === Number(serviceId)) serviceIssues.duplicateTitles++;
      });

      const totalIssues = serviceIssues.missingImages + serviceIssues.duplicateImages + serviceIssues.duplicateTitles;

      if (totalIssues > 0) {
        console.log(`   ⚠️  ${totalIssues} issues:`);
        if (serviceIssues.missingImages > 0) console.log(`      - ${serviceIssues.missingImages} missing images`);
        if (serviceIssues.duplicateImages > 0) console.log(`      - ${serviceIssues.duplicateImages} duplicate images`);
        if (serviceIssues.duplicateTitles > 0) console.log(`      - ${serviceIssues.duplicateTitles} duplicate titles`);
      } else {
        console.log(`   ✅ No issues`);
      }
    });

  // 9. Final Summary
  console.log('\n\n═══════════════════════════════════════════════════════════');
  console.log('📋 FINAL AUDIT REPORT\n');

  const totalIssues = Object.values(issues).reduce((sum, arr) => sum + arr.length, 0);

  console.log(`   Total Productos: ${productos.length}`);
  console.log(`   Total Issues: ${totalIssues}\n`);

  console.log(`   Issues Breakdown:`);
  console.log(`   - Missing Images: ${issues.missingImages.length}`);
  console.log(`   - Duplicate Images: ${issues.duplicateImages.length}`);
  console.log(`   - Missing Service ID: ${issues.missingServiceId.length}`);
  console.log(`   - Orphaned Productos: ${issues.orphanedProductos.length}`);
  console.log(`   - Duplicate Titles: ${issues.duplicateTitles.length}`);

  if (totalIssues === 0) {
    console.log('\n   ✅ ALL CHECKS PASSED - No data quality issues found!');
  } else {
    console.log('\n   ⚠️  ACTION REQUIRED - See issues above');
    console.log('   💡 Refer to fix-phantom-productos.md for remediation steps');
  }

  console.log('\n═══════════════════════════════════════════════════════════\n');

} catch (error) {
  console.error('\n❌ Error running audit:', error.message);
  if (error.message.includes('ECONNREFUSED')) {
    console.log('\n💡 Tip: Make sure Directus is running or update PUBLIC_DIRECTUS_URL in .env');
  }
  process.exit(1);
}
