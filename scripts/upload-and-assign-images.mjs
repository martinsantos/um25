#!/usr/bin/env node
/**
 * Upload Generated Images to Directus and Assign to Antecedentes
 *
 * Reads generated-images-log.json, uploads each successful image
 * to Directus via API, then updates the antecedente record.
 *
 * Usage: node scripts/upload-and-assign-images.mjs
 * Output: scripts/data/upload-results.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const PROJECT_ROOT = path.join(__dirname, '..');
const IMAGES_DIR = path.join(PROJECT_ROOT, 'serviciosimg', 'nuevas');

const LOG_FILE = path.join(DATA_DIR, 'generated-images-log.json');
const OUTPUT_FILE = path.join(DATA_DIR, 'upload-results.json');

const DIRECTUS_URL = process.env.PUBLIC_DIRECTUS_URL || 'http://23.105.176.45:8055';
const DIRECTUS_TOKEN = process.env.PUBLIC_DIRECTUS_TOKEN || 'k6P8LAY8_x_y1miB_KTlWnysCnx2Abky';

async function uploadFile(filePath, filename) {
  const fileBuffer = fs.readFileSync(filePath);
  const blob = new Blob([fileBuffer], { type: 'image/png' });

  const formData = new FormData();
  formData.append('file', blob, filename);
  formData.append('title', filename.replace('.png', '').replace(/_/g, ' '));

  const response = await fetch(`${DIRECTUS_URL}/files`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Upload failed (${response.status}): ${text.slice(0, 200)}`);
  }

  const data = await response.json();
  return data.data; // Returns file object with id, filename_disk, etc.
}

async function updateAntecedente(antecedenteId, fileUuid) {
  const response = await fetch(`${DIRECTUS_URL}/items/Antecedentes/${antecedenteId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ Imagen: fileUuid }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Update failed (${response.status}): ${text.slice(0, 200)}`);
  }

  return await response.json();
}

async function main() {
  console.log('=== Upload and Assign Images to Directus ===\n');

  // Load generation log
  if (!fs.existsSync(LOG_FILE)) {
    console.error(`ERROR: ${LOG_FILE} not found`);
    console.error('Run image generation scripts first');
    process.exit(1);
  }

  const log = JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8'));
  const successfulEntries = log.filter(e => e.success && e.filename);

  console.log(`Total log entries: ${log.length}`);
  console.log(`Successful generations: ${successfulEntries.length}\n`);

  if (successfulEntries.length === 0) {
    console.log('No images to upload.');
    return;
  }

  // Load existing results for resume
  let results = [];
  if (fs.existsSync(OUTPUT_FILE)) {
    results = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
  }
  const uploadedIds = new Set(results.filter(r => r.success).map(r => r.id));

  let okCount = 0;
  let failCount = 0;
  let skipCount = 0;

  for (let i = 0; i < successfulEntries.length; i++) {
    const entry = successfulEntries[i];
    const { id: antId, filename, titulo } = entry;

    // Skip already uploaded
    if (uploadedIds.has(antId)) {
      console.log(`[${i + 1}/${successfulEntries.length}] ID ${antId}: SKIP (already uploaded)`);
      skipCount++;
      continue;
    }

    const imagePath = path.join(IMAGES_DIR, filename);
    if (!fs.existsSync(imagePath)) {
      console.log(`[${i + 1}/${successfulEntries.length}] ID ${antId}: SKIP (file not found: ${filename})`);
      results.push({ id: antId, success: false, error: 'File not found' });
      failCount++;
      continue;
    }

    console.log(`[${i + 1}/${successfulEntries.length}] ID ${antId}: ${titulo?.slice(0, 50)}...`);

    try {
      // 1. Upload file to Directus
      const fileData = await uploadFile(imagePath, filename);
      const newUuid = fileData.id;
      console.log(`  Uploaded: ${newUuid} (${fileData.filename_disk})`);

      // 2. Update antecedente with new image UUID
      await updateAntecedente(antId, newUuid);
      console.log(`  Assigned to antecedente ${antId}`);

      results.push({
        id: antId,
        titulo,
        new_uuid: newUuid,
        filename_disk: fileData.filename_disk,
        filename,
        success: true,
        timestamp: new Date().toISOString(),
      });
      okCount++;
    } catch (err) {
      console.log(`  ERROR: ${err.message}`);
      results.push({
        id: antId,
        titulo,
        filename,
        success: false,
        error: err.message,
        timestamp: new Date().toISOString(),
      });
      failCount++;
    }

    // Save results incrementally
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));

    // Small delay to avoid overwhelming Directus
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n=== Results ===`);
  console.log(`Uploaded & assigned: ${okCount}`);
  console.log(`Failed: ${failCount}`);
  console.log(`Skipped: ${skipCount}`);
  console.log(`Results saved to: ${OUTPUT_FILE}`);

  if (okCount > 0) {
    console.log(`\n=== Next Steps ===`);
    console.log(`1. Copy files to production server:`);
    console.log(`   scp serviciosimg/nuevas/*.png ultimamilla:/root/fumbling-field/uploads/`);
    console.log(`2. Fix permissions:`);
    console.log(`   ssh ultimamilla "chown -R 1000:1000 /root/fumbling-field/uploads/"`);
    console.log(`3. Verify with: node scripts/verify-unique-images.mjs`);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
