#!/usr/bin/env node

/**
 * Download Directus Images
 * ========================
 * Pre-downloads all images referenced in snapshot JSON files
 * to public/uploads/{uuid}.jpg so they serve as local fallback
 * when Directus is unavailable.
 *
 * Usage:
 *   node scripts/download-directus-images.mjs
 *
 * Requires Directus to be running (or accessible via network)
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SNAPSHOTS_DIR = join(ROOT, 'src', 'data', 'snapshots');
const UPLOADS_DIR = join(ROOT, 'public', 'uploads');

const DIRECTUS_URL = process.env.PUBLIC_DIRECTUS_URL || 'http://localhost:8055';
const DIRECTUS_TOKEN = process.env.DIRECTUS_STATIC_TOKEN || 'k6P8LAY8_x_y1miB_KTlWnysCnx2Abky';

const UUID_REGEX = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const CONCURRENCY = 5; // parallel downloads
const TIMEOUT_MS = 10000;

function loadSnapshot(filename) {
  const filepath = join(SNAPSHOTS_DIR, filename);
  if (!existsSync(filepath)) {
    console.warn(`  ⚠️  Snapshot not found: ${filename}`);
    return [];
  }
  const raw = readFileSync(filepath, 'utf-8');
  const parsed = JSON.parse(raw);
  return parsed.data || [];
}

function extractUUIDs() {
  const uuids = new Set();

  // Antecedentes: .Imagen
  for (const item of loadSnapshot('antecedentes.json')) {
    if (item.Imagen && UUID_REGEX.test(item.Imagen)) uuids.add(item.Imagen);
  }

  // Servicios: .Imagen
  for (const item of loadSnapshot('servicios.json')) {
    if (item.Imagen && UUID_REGEX.test(item.Imagen)) uuids.add(item.Imagen);
  }

  // Productos: .imagen
  for (const item of loadSnapshot('productos.json')) {
    const img = typeof item.imagen === 'string' ? item.imagen : item.imagen?.id;
    if (img && UUID_REGEX.test(img)) uuids.add(img);
  }

  // Hero: .imagen
  for (const item of loadSnapshot('hero.json')) {
    if (item.imagen && UUID_REGEX.test(item.imagen)) uuids.add(item.imagen);
  }

  return [...uuids];
}

async function downloadImage(uuid) {
  const outputPath = join(UPLOADS_DIR, `${uuid}.jpg`);

  // Skip if already downloaded
  if (existsSync(outputPath)) {
    return { uuid, status: 'skipped' };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const url = `${DIRECTUS_URL}/assets/${uuid}?quality=80&width=800&format=jpg`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${DIRECTUS_TOKEN}` },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return { uuid, status: 'error', error: `HTTP ${response.status}` };
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    writeFileSync(outputPath, buffer);
    return { uuid, status: 'downloaded', size: buffer.length };
  } catch (error) {
    return { uuid, status: 'error', error: error.message };
  }
}

async function downloadBatch(uuids, concurrency) {
  const results = { downloaded: 0, skipped: 0, errors: 0, totalBytes: 0 };
  let idx = 0;

  async function worker() {
    while (idx < uuids.length) {
      const currentIdx = idx++;
      const uuid = uuids[currentIdx];
      const result = await downloadImage(uuid);

      if (result.status === 'downloaded') {
        results.downloaded++;
        results.totalBytes += result.size || 0;
        process.stdout.write(`\r  📥 Downloaded: ${results.downloaded} | Skipped: ${results.skipped} | Errors: ${results.errors} | Total: ${currentIdx + 1}/${uuids.length}`);
      } else if (result.status === 'skipped') {
        results.skipped++;
      } else {
        results.errors++;
        console.error(`\n  ❌ ${uuid}: ${result.error}`);
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);
  console.log(''); // newline after progress
  return results;
}

function generateManifest(uuids) {
  const manifest = {};
  for (const uuid of uuids) {
    const filepath = join(UPLOADS_DIR, `${uuid}.jpg`);
    if (existsSync(filepath)) {
      manifest[uuid] = `/uploads/${uuid}.jpg`;
    }
  }

  const manifestPath = join(SNAPSHOTS_DIR, 'image-manifest.json');
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 0));
  console.log(`  ✅ Manifest: ${Object.keys(manifest).length} images mapped`);
  return manifest;
}

async function main() {
  console.log(`\n🖼️  Downloading Directus images from ${DIRECTUS_URL}\n`);

  // Extract unique UUIDs from snapshots
  const uuids = extractUUIDs();
  console.log(`  Found ${uuids.length} unique image UUIDs across all snapshots\n`);

  if (uuids.length === 0) {
    console.log('  No images to download.');
    return;
  }

  // Ensure output directory exists
  mkdirSync(UPLOADS_DIR, { recursive: true });

  // Download images
  const results = await downloadBatch(uuids, CONCURRENCY);

  console.log(`\n  Summary:`);
  console.log(`    Downloaded: ${results.downloaded} (${(results.totalBytes / 1024 / 1024).toFixed(1)} MB)`);
  console.log(`    Skipped (already exists): ${results.skipped}`);
  console.log(`    Errors: ${results.errors}`);

  // Generate manifest
  console.log('');
  generateManifest(uuids);

  console.log(`\n✅ Done. Images saved to public/uploads/\n`);
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
