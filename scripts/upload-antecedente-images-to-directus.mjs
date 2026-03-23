#!/usr/bin/env node
/**
 * Upload antecedente images to Directus
 *
 * Problem: Directus DB has file records (UUIDs) but NO physical files on disk (~5 files vs 1678 records).
 * Local images exist at dist/client/uploads/antecedentes/{oldUUID}.jpg (454 files).
 * image-local-map.json maps both old and new UUIDs to the same local paths.
 *
 * This script uploads local image files to Directus so /assets/{uuid} works.
 *
 * Usage:
 *   node scripts/upload-antecedente-images-to-directus.mjs --dry-run   # Preview (default)
 *   node scripts/upload-antecedente-images-to-directus.mjs --execute   # Upload
 *
 * Environment:
 *   DIRECTUS_URL   - Directus base URL (default: http://localhost:8055)
 *   DIRECTUS_TOKEN - Auth token
 *   IMAGES_DIR     - Path to local images (default: public/uploads/antecedentes)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://localhost:8055';
const TOKEN = process.env.DIRECTUS_TOKEN || 'k6P8LAY8_x_y1miB_KTlWnysCnx2Abky';
const DRY_RUN = !process.argv.includes('--execute');
const IMAGES_DIR = process.env.IMAGES_DIR || path.join(ROOT, 'public/uploads/antecedentes');
const BATCH_SIZE = 5; // concurrent uploads
const DELAY_MS = 200; // delay between batches

if (DRY_RUN) {
  console.log('=== DRY RUN === (use --execute to upload)\n');
}

// Load image-local-map to get new UUID → local path mapping
const mapPath = path.join(ROOT, 'src/data/image-local-map.json');
const imageMap = JSON.parse(fs.readFileSync(mapPath, 'utf-8'));

// Filter to antecedente entries only
const anteEntries = Object.entries(imageMap).filter(([_, v]) => v.includes('/antecedentes/'));
console.log(`Image map: ${anteEntries.length} antecedente entries`);

// Build: UUID → local file path
const uuidToFile = new Map();
for (const [uuid, urlPath] of anteEntries) {
  // urlPath is like /uploads/antecedentes/{oldUUID}.jpg
  const filename = path.basename(urlPath);
  const localFile = path.join(IMAGES_DIR, filename);
  if (fs.existsSync(localFile)) {
    uuidToFile.set(uuid, localFile);
  }
}
console.log(`UUIDs with local files: ${uuidToFile.size}`);

// Check which UUIDs need uploading (file doesn't exist in Directus storage)
async function checkAsset(uuid) {
  try {
    const res = await fetch(`${DIRECTUS_URL}/assets/${uuid}`, {
      method: 'HEAD',
      headers: { 'Authorization': `Bearer ${TOKEN}` }
    });
    return res.ok; // true = file exists, false = needs upload
  } catch {
    return false;
  }
}

async function uploadImage(uuid, localFilePath) {
  const fileBuffer = fs.readFileSync(localFilePath);
  const blob = new Blob([fileBuffer], { type: 'image/jpeg' });
  const formData = new FormData();
  formData.append('file', blob, path.basename(localFilePath));

  const res = await fetch(`${DIRECTUS_URL}/files/${uuid}`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${TOKEN}` },
    body: formData
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${res.status}: ${text.substring(0, 100)}`);
  }
  return true;
}

async function processBatch(items) {
  return Promise.all(items.map(async ([uuid, file]) => {
    try {
      await uploadImage(uuid, file);
      return { uuid, status: 'ok' };
    } catch (err) {
      return { uuid, status: 'error', error: err.message };
    }
  }));
}

async function main() {
  // Get unique file paths (multiple UUIDs may point to same file)
  // We only need to upload once per Directus UUID
  const toCheck = [...uuidToFile.entries()];
  console.log(`\nChecking ${toCheck.length} UUIDs against Directus...\n`);

  const needUpload = [];

  // Check in batches which files need uploading
  for (let i = 0; i < toCheck.length; i += 20) {
    const batch = toCheck.slice(i, i + 20);
    const results = await Promise.all(
      batch.map(async ([uuid, file]) => {
        const exists = await checkAsset(uuid);
        return { uuid, file, exists };
      })
    );
    for (const r of results) {
      if (!r.exists) needUpload.push([r.uuid, r.file]);
    }
  }

  console.log(`Need upload: ${needUpload.length}`);
  console.log(`Already exist in Directus: ${toCheck.length - needUpload.length}\n`);

  if (DRY_RUN) {
    for (const [uuid, file] of needUpload.slice(0, 10)) {
      const size = fs.statSync(file).size;
      console.log(`  ${uuid.substring(0, 8)}... ← ${path.basename(file)} (${(size / 1024).toFixed(0)}KB)`);
    }
    if (needUpload.length > 10) console.log(`  ... and ${needUpload.length - 10} more`);
    console.log(`\nTotal upload size: ${(needUpload.reduce((s, [_, f]) => s + fs.statSync(f).size, 0) / 1024 / 1024).toFixed(1)}MB`);
    console.log(`Run with --execute to upload`);
    return;
  }

  // Upload in batches
  let uploaded = 0;
  let errors = 0;

  for (let i = 0; i < needUpload.length; i += BATCH_SIZE) {
    const batch = needUpload.slice(i, i + BATCH_SIZE);
    const results = await processBatch(batch);

    for (const r of results) {
      if (r.status === 'ok') {
        uploaded++;
      } else {
        errors++;
        console.error(`  ERROR ${r.uuid.substring(0, 8)}...: ${r.error}`);
      }
    }

    if (uploaded % 50 === 0 && uploaded > 0) {
      console.log(`  Progress: ${uploaded}/${needUpload.length} uploaded`);
    }

    if (i + BATCH_SIZE < needUpload.length) {
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }

  console.log(`\n=== Done ===`);
  console.log(`Uploaded: ${uploaded}`);
  console.log(`Errors: ${errors}`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
