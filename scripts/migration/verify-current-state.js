#!/usr/bin/env node
/**
 * Verify Current State - Compara estado actual de Directus vs Fallback
 *
 * Este script verifica el estado actual del sistema antes de la migración:
 * - Cuenta servicios en Directus
 * - Cuenta productos en Directus
 * - Cuenta productos en fallback JS
 * - Identifica el gap de datos a migrar
 * - Lista imágenes disponibles
 */

import { createDirectus, rest, readItems } from '@directus/sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIRECTUS_URL = process.env.PUBLIC_DIRECTUS_URL || 'http://localhost:8055';
const directus = createDirectus(DIRECTUS_URL).with(rest());

async function verifyCurrentState() {
  console.log('🔍 Verificando estado actual del sistema...\n');
  console.log('━'.repeat(80));

  const report = {
    timestamp: new Date().toISOString(),
    directus: {},
    fallback: {},
    gap: {},
    images: {}
  };

  try {
    // 1. Verificar Servicios en Directus
    console.log('\n📊 DIRECTUS - Servicios');
    console.log('─'.repeat(80));

    const servicios = await directus.request(readItems('Servicios'));

    report.directus.servicios = servicios.length;
    console.log(`✓ Total servicios en Directus: ${servicios.length}`);

    servicios.forEach(s => {
      console.log(`  ${s.id}: ${s.Titulo}`);
    });

    // 2. Verificar Productos en Directus (campo JSON)
    console.log('\n📦 DIRECTUS - Productos (campo JSON en Servicios)');
    console.log('─'.repeat(80));

    let totalProductosDirectus = 0;
    const productosPorServicio = {};

    for (const servicio of servicios) {
      const productos = servicio.Productos || servicio.productos || [];
      const count = Array.isArray(productos) ? productos.length : 0;
      totalProductosDirectus += count;
      productosPorServicio[servicio.id] = count;

      console.log(`  Servicio ${servicio.id}: ${count} productos`);
    }

    report.directus.productos = totalProductosDirectus;
    report.directus.productosPorServicio = productosPorServicio;
    console.log(`\n✓ Total productos en Directus: ${totalProductosDirectus}`);

    // 3. Verificar si existe colección "productos" separada
    console.log('\n🔍 DIRECTUS - Collection "productos" (si existe)');
    console.log('─'.repeat(80));

    try {
      const productosCollection = await directus.request(readItems('productos'));
      report.directus.productosCollection = productosCollection.length;
      console.log(`✓ Collection "productos" existe: ${productosCollection.length} items`);
    } catch (error) {
      report.directus.productosCollection = 0;
      console.log(`ℹ Collection "productos" no existe (se creará en migración)`);
    }

    // 4. Verificar Assets/Imágenes en Directus
    console.log('\n🖼️  DIRECTUS - Assets (directus_files)');
    console.log('─'.repeat(80));

    try {
      const files = await directus.request(readItems('directus_files', {
        filter: { folder: { _null: false } }
      }));
      report.directus.assets = files.length;
      console.log(`✓ Total assets en Directus: ${files.length}`);

      // Contar por carpeta
      const filesByFolder = {};
      for (const file of files) {
        const folder = file.folder || 'root';
        filesByFolder[folder] = (filesByFolder[folder] || 0) + 1;
      }
      console.log('\nAssets por carpeta:');
      Object.entries(filesByFolder).forEach(([folder, count]) => {
        console.log(`  ${folder}: ${count} archivos`);
      });
    } catch (error) {
      report.directus.assets = 0;
      console.log(`⚠ No se pudieron leer assets: ${error.message}`);
    }

  } catch (error) {
    console.error(`\n❌ Error consultando Directus: ${error.message}`);
    report.directus.error = error.message;
  }

  // 5. Verificar Fallback JS
  console.log('\n📄 FALLBACK JS - servicios_completos_v4.js');
  console.log('─'.repeat(80));

  try {
    const fallbackPath = path.join(__dirname, '../../src/data/servicios_completos_v4.js');

    if (!fs.existsSync(fallbackPath)) {
      console.log('⚠ Archivo servicios_completos_v4.js no encontrado');
      report.fallback.error = 'File not found';
    } else {
      // Leer y evaluar el archivo
      const fallbackContent = fs.readFileSync(fallbackPath, 'utf-8');

      // Contar productos (líneas que contienen "titulo:")
      const productoLines = fallbackContent.match(/titulo:\s*['"]/g);
      const totalProductosFallback = productoLines ? productoLines.length : 0;

      // Contar servicios (objetos con id: número)
      const servicioMatches = fallbackContent.match(/^\s*(\d{3}):\s*{/gm);
      const totalServiciosFallback = servicioMatches ? servicioMatches.length : 0;

      report.fallback.servicios = totalServiciosFallback;
      report.fallback.productos = totalProductosFallback;

      console.log(`✓ Total servicios en fallback: ${totalServiciosFallback}`);
      console.log(`✓ Total productos en fallback: ${totalProductosFallback}`);

      // Contar productos por servicio en fallback
      const productosPorServicioFallback = {};
      const servicioBlocks = fallbackContent.split(/^\s*(\d{3}):\s*{/gm);

      for (let i = 1; i < servicioBlocks.length; i += 2) {
        const servicioId = servicioBlocks[i];
        const servicioContent = servicioBlocks[i + 1];
        const productos = servicioContent.match(/titulo:\s*['"]/g);
        productosPorServicioFallback[servicioId] = productos ? productos.length : 0;
      }

      report.fallback.productosPorServicio = productosPorServicioFallback;

      console.log('\nProductos por servicio (fallback):');
      Object.entries(productosPorServicioFallback).forEach(([id, count]) => {
        console.log(`  Servicio ${id}: ${count} productos`);
      });
    }
  } catch (error) {
    console.error(`\n❌ Error leyendo fallback: ${error.message}`);
    report.fallback.error = error.message;
  }

  // 6. Verificar Imágenes Locales
  console.log('\n🖼️  IMÁGENES LOCALES - public/images/services/productos/');
  console.log('─'.repeat(80));

  try {
    const imageDir = path.join(__dirname, '../../public/images/services/productos');

    if (!fs.existsSync(imageDir)) {
      console.log('⚠ Directorio de imágenes no encontrado');
      report.images.error = 'Directory not found';
    } else {
      const subdirs = fs.readdirSync(imageDir);
      let totalImages = 0;
      const imagesByService = {};

      for (const subdir of subdirs) {
        const subdirPath = path.join(imageDir, subdir);
        if (fs.statSync(subdirPath).isDirectory()) {
          const images = fs.readdirSync(subdirPath).filter(f => f.endsWith('.png'));
          imagesByService[subdir] = images.length;
          totalImages += images.length;
        }
      }

      report.images.total = totalImages;
      report.images.byService = imagesByService;

      console.log(`✓ Total imágenes locales: ${totalImages}`);
      console.log('\nImágenes por servicio:');
      Object.entries(imagesByService).forEach(([service, count]) => {
        console.log(`  ${service}/: ${count} imágenes`);
      });
    }
  } catch (error) {
    console.error(`\n❌ Error contando imágenes: ${error.message}`);
    report.images.error = error.message;
  }

  // 7. Calcular GAP
  console.log('\n📊 ANÁLISIS DE GAP (Datos faltantes en Directus)');
  console.log('━'.repeat(80));

  if (!report.directus.error && !report.fallback.error) {
    report.gap.servicios = report.fallback.servicios - report.directus.servicios;
    report.gap.productos = report.fallback.productos - report.directus.productos;
    report.gap.imagenes = report.images.total - (report.directus.assets || 0);

    console.log(`\n  Servicios faltantes: ${report.gap.servicios} (Directus: ${report.directus.servicios}, Fallback: ${report.fallback.servicios})`);
    console.log(`  Productos faltantes: ${report.gap.productos} (Directus: ${report.directus.productos}, Fallback: ${report.fallback.productos})`);
    console.log(`  Imágenes a migrar: ${report.gap.imagenes} (Directus: ${report.directus.assets || 0}, Local: ${report.images.total})`);

    // Gap por servicio
    if (report.directus.productosPorServicio && report.fallback.productosPorServicio) {
      console.log('\n  Gap de productos por servicio:');
      Object.keys(report.fallback.productosPorServicio).forEach(servicioId => {
        const fallbackCount = report.fallback.productosPorServicio[servicioId] || 0;
        const directusCount = report.directus.productosPorServicio[servicioId] || 0;
        const gap = fallbackCount - directusCount;

        if (gap !== 0) {
          console.log(`    Servicio ${servicioId}: ${gap} productos faltantes (Fallback: ${fallbackCount}, Directus: ${directusCount})`);
        }
      });
    }
  } else {
    console.log('\n  ⚠ No se puede calcular gap debido a errores en la verificación');
  }

  // 8. Resumen Final
  console.log('\n━'.repeat(80));
  console.log('📋 RESUMEN');
  console.log('━'.repeat(80));

  const needsMigration = report.gap.productos > 0 || report.gap.imagenes > 0;

  if (needsMigration) {
    console.log('\n⚠️  MIGRACIÓN NECESARIA');
    console.log('   Directus no tiene todos los datos del fallback.');
    console.log(`   Se requiere migrar ${report.gap.productos} productos y ${report.gap.imagenes} imágenes.`);
  } else {
    console.log('\n✅ DIRECTUS COMPLETO');
    console.log('   Directus tiene todos los datos del fallback.');
    console.log('   Se puede proceder a eliminar el sistema de fallback.');
  }

  console.log('\n━'.repeat(80));
  console.log(`\nReporte completo guardado en: migration-gap-analysis.json`);
  console.log(`Timestamp: ${report.timestamp}\n`);

  return report;
}

// Ejecutar verificación
verifyCurrentState()
  .then(report => {
    // Guardar reporte en JSON
    const outputPath = path.join(__dirname, '../../scratchpad/migration-gap-analysis.json');
    const outputDir = path.dirname(outputPath);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  });
