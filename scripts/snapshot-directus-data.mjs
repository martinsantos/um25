#!/usr/bin/env node

/**
 * Snapshot Directus Data
 * =====================
 * Exports all Directus collections to static JSON snapshot files.
 * These snapshots serve as fallback when Directus is unavailable.
 *
 * Usage:
 *   node scripts/snapshot-directus-data.mjs
 *
 * Requires Directus to be running at http://localhost:8055
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SNAPSHOTS_DIR = join(__dirname, '..', 'src', 'data', 'snapshots');

const DIRECTUS_URL = process.env.PUBLIC_DIRECTUS_URL || 'http://localhost:8055';
const DIRECTUS_TOKEN = process.env.DIRECTUS_STATIC_TOKEN || 'k6P8LAY8_x_y1miB_KTlWnysCnx2Abky';

const headers = {
  'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
  'Accept': 'application/json',
};

async function fetchCollection(collection, params = {}) {
  const query = new URLSearchParams();
  if (params.fields) query.set('fields', params.fields.join(','));
  if (params.sort) query.set('sort', params.sort.join(','));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.filter) query.set('filter', JSON.stringify(params.filter));

  const url = `${DIRECTUS_URL}/items/${collection}?${query.toString()}`;
  console.log(`  Fetching ${collection}...`);

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${collection}: ${response.status} ${response.statusText}`);
  }
  const json = await response.json();
  return json.data || [];
}

async function snapshotServicios() {
  const data = await fetchCollection('Servicios', {
    fields: ['id', 'Titulo', 'Descripcion', 'Imagen', 'Subtitulo', 'Stats', 'PorQueElegirnos', 'Area', 'Cliente', 'Productos'],
    sort: ['id'],
  });
  writeSnapshot('servicios.json', data);
  return data;
}

async function snapshotProductos() {
  const data = await fetchCollection('productos', {
    fields: ['id', 'servicio_id', 'titulo', 'descripcion', 'imagen', 'features', 'destacado', 'orden', 'status'],
    sort: ['servicio_id', 'orden'],
    limit: -1,
  });
  writeSnapshot('productos.json', data);
  return data;
}

async function snapshotAntecedentes() {
  const data = await fetchCollection('Antecedentes', {
    fields: ['id', 'Titulo', 'Descripcion', 'Cliente', 'Imagen', 'Area', 'Unidad_de_negocio', 'Fecha', 'Presupuesto', 'original_id'],
    sort: ['-Fecha', '-id'],
    limit: -1,
  });
  writeSnapshot('antecedentes.json', data);
  return data;
}

async function snapshotHero() {
  const data = await fetchCollection('Hero_Home', {
    fields: ['id', 'titulo', 'orden', 'imagen', 'status'],
    sort: ['orden'],
    limit: -1,
  });
  writeSnapshot('hero.json', data);
  return data;
}

async function snapshotSectores() {
  // 1. Get base sector data
  const sectores = await fetchCollection('sectores', {
    fields: ['id', 'slug', 'nombre', 'emoji', 'descripcion', 'hero_image', 'keywords', 'color_theme', 'seo_title', 'seo_description', 'seo_keywords', 'stats', 'activo', 'orden'],
    sort: ['orden'],
    filter: { activo: { _eq: true } },
  });

  // 2. For each sector, get value_props and servicios
  for (const sector of sectores) {
    try {
      const valueProps = await fetchCollection('sector_value_props', {
        fields: ['icono', 'titulo', 'descripcion', 'orden'],
        sort: ['orden'],
        filter: { sector_id: { _eq: sector.id } },
      });
      sector.value_props = valueProps;
    } catch (e) {
      console.warn(`  Warning: Could not fetch value_props for sector ${sector.slug}:`, e.message);
      sector.value_props = [];
    }

    try {
      const junctions = await fetchCollection('sectores_servicios', {
        fields: ['orden', 'descripcion_custom', 'servicios_id.id', 'servicios_id.Titulo', 'servicios_id.Descripcion'],
        sort: ['orden'],
        filter: { sectores_id: { _eq: sector.id } },
      });
      sector.servicios = junctions
        .map(j => {
          if (!j.servicios_id) return null;
          return {
            id: j.servicios_id.id,
            nombre: j.servicios_id.Titulo,
            descripcion: j.descripcion_custom || j.servicios_id.Descripcion,
            orden: j.orden,
          };
        })
        .filter(Boolean);
    } catch (e) {
      console.warn(`  Warning: Could not fetch servicios for sector ${sector.slug}:`, e.message);
      sector.servicios = [];
    }
  }

  writeSnapshot('sectores.json', sectores);
  return sectores;
}

function writeSnapshot(filename, data) {
  mkdirSync(SNAPSHOTS_DIR, { recursive: true });
  const filepath = join(SNAPSHOTS_DIR, filename);
  writeFileSync(filepath, JSON.stringify({ data }, null, 0));
  console.log(`  ✅ ${filename}: ${data.length} items written`);
}

async function main() {
  console.log(`\n📸 Snapshotting Directus data from ${DIRECTUS_URL}\n`);

  try {
    await snapshotServicios();
    await snapshotProductos();
    await snapshotAntecedentes();
    await snapshotHero();
    await snapshotSectores();

    console.log(`\n✅ All snapshots saved to ${SNAPSHOTS_DIR}\n`);
  } catch (error) {
    console.error('\n❌ Snapshot failed:', error.message);
    process.exit(1);
  }
}

main();
