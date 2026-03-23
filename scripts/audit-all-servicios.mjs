#!/usr/bin/env node
/**
 * Audit Script: Servicios y Productos en Directus
 *
 * Este script consulta Directus para:
 * 1. Listar todos los servicios con sus IDs
 * 2. Para cada servicio, listar productos actuales
 * 3. Verificar estado de imágenes
 * 4. Generar reporte de diferencias vs documentos de marketing
 *
 * Uso: node scripts/audit-all-servicios.mjs
 */

import { createDirectus, rest, readItems, readItem, staticToken } from '@directus/sdk';
import fs from 'fs';
import path from 'path';

// Configuración de Directus
// Servidor de producción
const DIRECTUS_URL = process.env.PUBLIC_DIRECTUS_URL || 'http://23.105.176.45:8055';
const DIRECTUS_TOKEN = process.env.PUBLIC_DIRECTUS_TOKEN || 'k6P8LAY8_x_y1miB_KTlWnysCnx2Abky';

const client = createDirectus(DIRECTUS_URL)
  .with(staticToken(DIRECTUS_TOKEN))
  .with(rest());

// Productos esperados según documentos de marketing
const PRODUCTOS_ESPERADOS = {
  // Mapeo por título de servicio (aproximado)
  'Infraestructura': {
    unidad: 1,
    productos: 8,
    imagenes: ['1.1.png', '1.2.png', '1.3.png', '1.4.png', '1.5.png', '1.6.png', '1.7.png', '1.8.png']
  },
  'Seguridad': {
    unidad: 2,
    productos: 8,
    imagenes: ['2.1.png', '2.2.png', '2.3.png', '2.4.png', '2.5.png', '2.6.png', '2.7.png', '2.8.png']
  },
  'Telecomunicaciones': {
    unidad: 3,
    productos: 6,
    imagenes: ['3.1.png', '3.2.png', '3.3.png', '3.4.png', '3.5.png', '3.6.png']
  },
  'Software': {
    unidad: 4,
    productos: 6,
    imagenes: ['4.1.png', '4.2.png', '4.3.png', '4.4.png', '4.5.png', '4.6.png']
  },
  'Soporte': {
    unidad: 5,
    productos: 5,
    imagenes: ['5.1.png', '5.2.png', '5.3.png', '5.4.png', '5.5.png']
  },
  'Consultoría': {
    unidad: 6,
    productos: 5,
    imagenes: ['6.1.png', '6.2.png', '6.3.png', '6.4.png', '6.5.png']
  },
  'Incendios': {
    unidad: 7,
    productos: 8,
    imagenes: ['7.1.png', '7.2.png', '7.3.png', '7.4.png', '7.5.png', '7.6.png', '7.7.png', '7.8.png']
  },
  'Eléctricos': {
    unidad: 8,
    productos: 8,
    imagenes: ['8.1.png', '8.2.png', '8.3.png', '8.4.png', '8.5.png', '8.6.png', '8.7.png', '8.8.png']
  }
};

// Ruta de imágenes locales
const IMAGES_PATH = '/Users/Shared/Files From d.localized/D/ultima milla/2024/MKT 2024/umw141024/umw46-main/fumbling-field/serviciosimg/limpias';

async function fetchAllServicios() {
  try {
    const response = await client.request(
      readItems('Servicios', {
        fields: ['id', 'Titulo', 'Descripcion', 'Imagen', 'Area', 'Subtitulo', 'Stats', 'PorQueElegirnos'],
        sort: ['id'],
        limit: -1
      })
    );
    return response || [];
  } catch (error) {
    console.error('Error fetching servicios:', error.message);
    return [];
  }
}

async function fetchProductosPorServicio(servicioId) {
  try {
    const response = await client.request(
      readItems('productos', {
        filter: { servicio_id: { _eq: servicioId } },
        fields: ['id', 'titulo', 'descripcion', 'imagen', 'features', 'destacado', 'marcas', 'orden', 'estado'],
        sort: ['orden', 'id']
      })
    );
    return response || [];
  } catch (error) {
    console.error(`Error fetching productos for servicio ${servicioId}:`, error.message);
    return [];
  }
}

async function fetchAllImages() {
  // Note: directus_files requires special handling via /files endpoint
  // For now, we'll extract image UUIDs from products
  try {
    const productos = await client.request(
      readItems('productos', {
        fields: ['imagen'],
        filter: { imagen: { _nnull: true } },
        limit: -1
      })
    );
    const uniqueImages = [...new Set(productos.map(p => p.imagen).filter(Boolean))];
    return uniqueImages.map(id => ({ id, filename_download: 'product-image' }));
  } catch (error) {
    console.error('Error fetching images from productos:', error.message);
    return [];
  }
}

function matchServiceToUnit(titulo) {
  const tituloLower = titulo.toLowerCase();

  if (tituloLower.includes('infraestructura') || tituloLower.includes('redes') || tituloLower.includes('cableado')) {
    return 'Infraestructura';
  }
  if (tituloLower.includes('seguridad') && !tituloLower.includes('incendio')) {
    return 'Seguridad';
  }
  if (tituloLower.includes('telecomunicaciones') || tituloLower.includes('telefonía') || tituloLower.includes('telefonia')) {
    return 'Telecomunicaciones';
  }
  if (tituloLower.includes('software') || tituloLower.includes('desarrollo')) {
    return 'Software';
  }
  if (tituloLower.includes('soporte') || tituloLower.includes('mantenimiento') || tituloLower.includes('tic')) {
    return 'Soporte';
  }
  if (tituloLower.includes('consultoría') || tituloLower.includes('consultoria')) {
    return 'Consultoría';
  }
  if (tituloLower.includes('incendio') || tituloLower.includes('detección') || tituloLower.includes('sdi')) {
    return 'Incendios';
  }
  if (tituloLower.includes('eléctrico') || tituloLower.includes('electrico') || tituloLower.includes('ups') || tituloLower.includes('energía')) {
    return 'Eléctricos';
  }

  return null;
}

function checkLocalImages() {
  const results = {};

  try {
    const files = fs.readdirSync(IMAGES_PATH);

    // Verificar imágenes esperadas
    for (const [unit, config] of Object.entries(PRODUCTOS_ESPERADOS)) {
      results[unit] = {
        expected: config.imagenes,
        found: [],
        missing: []
      };

      for (const img of config.imagenes) {
        if (files.includes(img)) {
          results[unit].found.push(img);
        } else {
          results[unit].missing.push(img);
        }
      }
    }

    // Listar archivos adicionales
    const expectedFiles = Object.values(PRODUCTOS_ESPERADOS).flatMap(c => c.imagenes);
    results.extra = files.filter(f =>
      f.endsWith('.png') &&
      !expectedFiles.includes(f)
    );

  } catch (error) {
    console.error('Error reading local images:', error.message);
  }

  return results;
}

async function main() {
  console.log('='.repeat(80));
  console.log('AUDITORÍA DE SERVICIOS Y PRODUCTOS - DIRECTUS');
  console.log('='.repeat(80));
  console.log(`Fecha: ${new Date().toISOString()}`);
  console.log(`Directus URL: ${DIRECTUS_URL}`);
  console.log('');

  // 1. Fetch servicios
  console.log('\n📦 SERVICIOS EN DIRECTUS');
  console.log('-'.repeat(80));

  const servicios = await fetchAllServicios();
  console.log(`Total servicios encontrados: ${servicios.length}`);
  console.log('');

  const servicioMap = [];

  for (const servicio of servicios) {
    const unitMatch = matchServiceToUnit(servicio.Titulo || '');
    const expectedConfig = unitMatch ? PRODUCTOS_ESPERADOS[unitMatch] : null;

    // Fetch productos de este servicio
    const productos = await fetchProductosPorServicio(servicio.id);

    const info = {
      id: servicio.id,
      titulo: servicio.Titulo,
      area: servicio.Area,
      unidadMatch: unitMatch,
      unidadNum: expectedConfig?.unidad,
      productosActuales: productos.length,
      productosEsperados: expectedConfig?.productos || '?',
      tieneImagen: !!servicio.Imagen,
      productos: productos.map(p => ({
        id: p.id,
        titulo: p.titulo,
        tieneImagen: !!p.imagen,
        tieneFeatures: Array.isArray(p.features) && p.features.length > 0,
        tieneDestacado: !!p.destacado,
        orden: p.orden
      }))
    };

    servicioMap.push(info);

    // Print servicio info
    console.log(`\n🔹 ID: ${servicio.id} | ${servicio.Titulo}`);
    console.log(`   Área: ${servicio.Area || 'N/A'}`);
    console.log(`   Unidad Marketing: ${unitMatch ? `${unitMatch} (Unidad ${expectedConfig?.unidad})` : 'NO MATCH'}`);
    console.log(`   Productos actuales: ${productos.length} | Esperados: ${expectedConfig?.productos || '?'}`);
    console.log(`   Imagen servicio: ${servicio.Imagen ? '✅' : '❌'}`);

    if (productos.length > 0) {
      console.log(`   Productos:`);
      for (const p of productos) {
        const imgStatus = p.imagen ? '✅' : '❌';
        const featStatus = Array.isArray(p.features) && p.features.length > 0 ? '✅' : '❌';
        const destStatus = p.destacado ? '✅' : '❌';
        console.log(`     - [${p.orden}] ${p.titulo} | Img:${imgStatus} Feat:${featStatus} Dest:${destStatus}`);
      }
    }

    // Check discrepancies
    if (expectedConfig && productos.length !== expectedConfig.productos) {
      console.log(`   ⚠️  DISCREPANCIA: Faltan ${expectedConfig.productos - productos.length} productos`);
    }
  }

  // 2. Check local images
  console.log('\n\n📷 IMÁGENES LOCALES');
  console.log('-'.repeat(80));

  const localImages = checkLocalImages();

  for (const [unit, status] of Object.entries(localImages)) {
    if (unit === 'extra') {
      if (status.length > 0) {
        console.log(`\n   Archivos adicionales no esperados: ${status.length}`);
        status.slice(0, 10).forEach(f => console.log(`     - ${f}`));
        if (status.length > 10) console.log(`     ... y ${status.length - 10} más`);
      }
    } else {
      const config = PRODUCTOS_ESPERADOS[unit];
      console.log(`\n🔹 Unidad ${config.unidad} - ${unit}:`);
      console.log(`   Encontradas: ${status.found.length}/${status.expected.length}`);
      if (status.missing.length > 0) {
        console.log(`   ❌ Faltantes: ${status.missing.join(', ')}`);
      } else {
        console.log(`   ✅ Todas las imágenes presentes`);
      }
    }
  }

  // 3. Check Directus images
  console.log('\n\n📷 IMÁGENES EN DIRECTUS');
  console.log('-'.repeat(80));

  const directusImages = await fetchAllImages();
  console.log(`Total imágenes en Directus: ${directusImages.length}`);

  // Buscar imágenes de productos
  const productImageNames = Object.values(PRODUCTOS_ESPERADOS)
    .flatMap(c => c.imagenes);

  const matchingImages = directusImages.filter(img =>
    productImageNames.some(name =>
      img.filename_download?.includes(name.replace('.png', '')) ||
      img.title?.includes(name.replace('.png', ''))
    )
  );

  console.log(`Imágenes de productos encontradas en Directus: ${matchingImages.length}`);

  if (matchingImages.length > 0) {
    console.log('\nImágenes de productos en Directus:');
    matchingImages.forEach(img => {
      console.log(`  - ${img.id} | ${img.filename_download}`);
    });
  }

  // 4. Summary
  console.log('\n\n📊 RESUMEN');
  console.log('='.repeat(80));

  const summary = {
    serviciosEnDirectus: servicios.length,
    serviciosEsperados: 8,
    productosEnDirectus: servicioMap.reduce((sum, s) => sum + s.productosActuales, 0),
    productosEsperados: Object.values(PRODUCTOS_ESPERADOS).reduce((sum, c) => sum + c.productos, 0),
    imagenesLocales: Object.values(localImages)
      .filter((v, k) => k !== 'extra')
      .reduce((sum, s) => sum + (s.found?.length || 0), 0),
    imagenesEnDirectus: matchingImages.length
  };

  console.log(`Servicios: ${summary.serviciosEnDirectus}/${summary.serviciosEsperados}`);
  console.log(`Productos: ${summary.productosEnDirectus}/${summary.productosEsperados}`);
  console.log(`Imágenes locales: ${summary.imagenesLocales}/54`);
  console.log(`Imágenes en Directus: ${summary.imagenesEnDirectus}/54`);

  // Mapeo de IDs
  console.log('\n\n🗺️  MAPEO DE IDs');
  console.log('-'.repeat(80));
  console.log('ID\t| Unidad\t| Título');
  console.log('-'.repeat(80));

  const sortedMap = servicioMap.filter(s => s.unidadNum).sort((a, b) => a.unidadNum - b.unidadNum);
  for (const s of sortedMap) {
    console.log(`${s.id}\t| U${s.unidadNum}\t\t| ${s.titulo}`);
  }

  // Servicios sin match
  const noMatch = servicioMap.filter(s => !s.unidadNum);
  if (noMatch.length > 0) {
    console.log('\nServicios sin match de unidad:');
    noMatch.forEach(s => console.log(`  - ID ${s.id}: ${s.titulo}`));
  }

  // Save report to JSON
  const reportPath = path.join(process.cwd(), 'audit-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary,
    servicios: servicioMap,
    localImages,
    directusImages: matchingImages.map(i => ({ id: i.id, filename: i.filename_download }))
  }, null, 2));

  console.log(`\n✅ Reporte guardado en: ${reportPath}`);
}

main().catch(console.error);
