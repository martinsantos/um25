#!/usr/bin/env node
/**
 * Upsert CCTV AI as a Directus PRODUCTO with its own frontend template payload.
 *
 * Default mode is dry-run:
 *   node scripts/migration/upsert-cctvai-product-template.mjs
 *
 * Apply mode:
 *   PUBLIC_DIRECTUS_URL=https://admin.ultimamilla.com.ar \
 *   DIRECTUS_STATIC_TOKEN=... \
 *   node scripts/migration/upsert-cctvai-product-template.mjs --apply
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '../..');

dotenv.config({ path: path.join(root, '.env') });

const DIRECTUS_URL = process.env.DIRECTUS_INTERNAL_URL || process.env.PUBLIC_DIRECTUS_URL || 'http://localhost:8055';
const DIRECTUS_TOKEN =
  process.env.DIRECTUS_STATIC_TOKEN ||
  process.env.PUBLIC_DIRECTUS_TOKEN ||
  process.env.DIRECTUS_ADMIN_TOKEN ||
  '';
const APPLY = process.argv.includes('--apply') || process.env.DRY_RUN === 'false';

const newFields = [
  {
    field: 'categoria_informacion',
    type: 'string',
    meta: {
      interface: 'select-dropdown',
      width: 'half',
      note: 'Categoría editorial/comercial: PRODUCTO, EQUIPAMIENTO o SERVICIO_ASOCIADO',
      options: {
        choices: [
          { text: 'Producto', value: 'PRODUCTO' },
          { text: 'Equipamiento', value: 'EQUIPAMIENTO' },
          { text: 'Servicio asociado', value: 'SERVICIO_ASOCIADO' },
        ],
      },
    },
    schema: { default_value: 'EQUIPAMIENTO', max_length: 64, is_nullable: true },
  },
  {
    field: 'categoria_comercial',
    type: 'string',
    meta: { interface: 'input', width: 'half', note: 'Etiqueta comercial visible' },
    schema: { max_length: 100, is_nullable: true },
  },
  {
    field: 'tipo_producto',
    type: 'string',
    meta: { interface: 'input', width: 'half', note: 'Tipo/familia de producto' },
    schema: { max_length: 100, is_nullable: true },
  },
  {
    field: 'slug_producto',
    type: 'string',
    meta: { interface: 'input', width: 'half', note: 'Slug estable para resolver la página del producto' },
    schema: { max_length: 255, is_nullable: true, is_unique: true },
  },
  {
    field: 'url_producto',
    type: 'string',
    meta: { interface: 'input', width: 'half', note: 'URL pública/canonical, ej: /cctvai/' },
    schema: { max_length: 255, is_nullable: true },
  },
  {
    field: 'template_producto',
    type: 'string',
    meta: {
      interface: 'select-dropdown',
      width: 'half',
      note: 'Template frontend asociado',
      options: {
        choices: [
          { text: 'Producto CCTV AI', value: 'cctv-ai-operational-single' },
          { text: 'Producto estándar', value: 'producto-standard' },
        ],
      },
    },
    schema: { max_length: 100, is_nullable: true },
  },
  {
    field: 'imagen_publica',
    type: 'string',
    meta: { interface: 'input', width: 'full', note: 'Asset público opcional, preferentemente WebP optimizado' },
    schema: { max_length: 500, is_nullable: true },
  },
  {
    field: 'contenido_producto',
    type: 'json',
    meta: {
      interface: 'input-code',
      width: 'full',
      note: 'JSON estructurado que alimenta el template propio del producto',
      options: { language: 'JSON' },
    },
    schema: { is_nullable: true },
  },
  {
    field: 'opciones_comerciales',
    type: 'json',
    meta: {
      interface: 'input-code',
      width: 'full',
      note: 'Opciones comerciales comparables para pricing y propuestas',
      options: { language: 'JSON' },
    },
    schema: { is_nullable: true },
  },
];

async function request(endpoint, options = {}) {
  const method = options.method || 'GET';
  const url = `${DIRECTUS_URL}${endpoint}`;

  if (!APPLY) {
    console.log(`[dry-run] ${method} ${url}`);
    if (options.body) console.log(String(options.body).slice(0, 360));
    return { data: [] };
  }

  if (!DIRECTUS_TOKEN) {
    throw new Error('Falta DIRECTUS_STATIC_TOKEN, PUBLIC_DIRECTUS_TOKEN o DIRECTUS_ADMIN_TOKEN');
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${DIRECTUS_TOKEN}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(`${method} ${endpoint} -> HTTP ${response.status}: ${text}`);
  }

  return data;
}

async function ensureField(field) {
  if (!APPLY) {
    console.log(`[dry-run] would ensure field: ${field.field}`);
    return;
  }

  try {
    await request(`/fields/productos/${field.field}`);
    console.log(`ok field exists: ${field.field}`);
  } catch (error) {
    if (!String(error.message).includes('HTTP 404')) throw error;
    await request('/fields/productos', {
      method: 'POST',
      body: JSON.stringify(field),
    });
    console.log(`created field: ${field.field}`);
  }
}

async function loadCctvAiProduct() {
  const snapshotPath = path.join(root, 'src/data/snapshots/productos.json');
  const snapshot = JSON.parse(await fs.readFile(snapshotPath, 'utf8'));
  const productos = snapshot.data || snapshot;
  const product = productos.find((item) => item.titulo === 'CCTV AI Integrado');

  if (!product) throw new Error('No se encontró CCTV AI Integrado en snapshot productos.json');

  return product;
}

async function findExistingProduct(product) {
  const bySlug = await request(
    `/items/productos?filter[slug_producto][_eq]=${encodeURIComponent(product.slug_producto)}&fields=id,titulo,slug_producto&limit=1`
  );
  if (bySlug.data?.[0]?.id) return bySlug.data[0];

  const byTitle = await request(
    `/items/productos?filter[titulo][_eq]=${encodeURIComponent(product.titulo)}&fields=id,titulo,slug_producto&limit=1`
  );
  return byTitle.data?.[0] || null;
}

async function main() {
  console.log(`${APPLY ? 'APPLY' : 'DRY RUN'} Directus ${DIRECTUS_URL}`);
  const product = await loadCctvAiProduct();

  for (const field of newFields) {
    await ensureField(field);
  }

  const payload = {
    servicio_id: product.servicio_id,
    titulo: product.titulo,
    descripcion: product.descripcion,
    imagen: product.imagen,
    features: product.features,
    destacado: product.destacado,
    marcas: product.marcas,
    orden: product.orden,
    status: product.status,
    categoria_informacion: product.categoria_informacion,
    categoria_comercial: product.categoria_comercial,
    tipo_producto: product.tipo_producto,
    slug_producto: product.slug_producto,
    url_producto: product.url_producto,
    template_producto: product.template_producto,
    imagen_publica: product.imagen_publica,
    contenido_producto: product.contenido_producto,
    opciones_comerciales: product.opciones_comerciales,
  };

  const existing = await findExistingProduct(product);
  if (existing?.id) {
    await request(`/items/productos/${existing.id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    console.log(`updated product: ${existing.id} ${product.titulo}`);
  } else {
    await request('/items/productos', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    console.log(`created product: ${product.titulo}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
