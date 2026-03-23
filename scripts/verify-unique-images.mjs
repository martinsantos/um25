#!/usr/bin/env node
/**
 * Verify Unique Images for Antecedentes
 *
 * Checks that all 518 antecedentes have unique image UUIDs,
 * no shared filename_downloads, and images are HTTP accessible.
 *
 * Usage: node scripts/verify-unique-images.mjs
 */

import { createDirectus, rest, readItems, staticToken } from '@directus/sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DIRECTUS_URL = process.env.PUBLIC_DIRECTUS_URL || 'http://23.105.176.45:8055';
const DIRECTUS_TOKEN = process.env.PUBLIC_DIRECTUS_TOKEN || 'k6P8LAY8_x_y1miB_KTlWnysCnx2Abky';
const PUBLIC_URL = 'https://www.ultimamilla.com.ar';

const client = createDirectus(DIRECTUS_URL)
  .with(staticToken(DIRECTUS_TOKEN))
  .with(rest());

async function checkHttp(uuid) {
  try {
    const response = await fetch(`${PUBLIC_URL}/assets/${uuid}`, {
      method: 'HEAD',
      redirect: 'follow',
    });
    return response.status;
  } catch {
    return 0;
  }
}

async function main() {
  console.log('=== Verify Unique Antecedentes Images ===\n');

  // 1. Fetch all antecedentes
  const antecedentes = await client.request(
    readItems('Antecedentes', {
      fields: ['id', 'Titulo', 'Imagen'],
      limit: -1,
    })
  );
  console.log(`Total antecedentes: ${antecedentes.length}`);

  // 2. Check UUID uniqueness
  const withImage = antecedentes.filter(a => a.Imagen);
  const uuids = withImage.map(a => a.Imagen);
  const uniqueUuids = new Set(uuids);
  const duplicateUuids = uuids.length - uniqueUuids.size;

  console.log(`With image UUID: ${withImage.length}`);
  console.log(`Unique UUIDs: ${uniqueUuids.size}`);
  console.log(`Duplicate UUIDs: ${duplicateUuids}`);

  if (duplicateUuids > 0) {
    // Find which UUIDs are duplicated
    const uuidCounts = {};
    for (const uuid of uuids) {
      uuidCounts[uuid] = (uuidCounts[uuid] || 0) + 1;
    }
    const dups = Object.entries(uuidCounts)
      .filter(([, count]) => count > 1)
      .sort((a, b) => b[1] - a[1]);

    console.log(`\nDuplicate UUID details (top 10):`);
    for (const [uuid, count] of dups.slice(0, 10)) {
      const ants = withImage.filter(a => a.Imagen === uuid);
      console.log(`  ${uuid}: shared by ${count} antecedentes (IDs: ${ants.map(a => a.id).join(', ')})`);
    }
  }

  // 3. Check filename_download uniqueness
  console.log('\nFetching file metadata...');
  const allUuids = [...uniqueUuids];
  const fileMap = new Map();
  const batchSize = 100;

  for (let i = 0; i < allUuids.length; i += batchSize) {
    const batch = allUuids.slice(i, i + batchSize);
    const ids = batch.join(',');
    const resp = await fetch(
      `${DIRECTUS_URL}/files?filter[id][_in]=${ids}&fields=id,filename_download&limit=-1`,
      { headers: { 'Authorization': `Bearer ${DIRECTUS_TOKEN}` } }
    );
    const json = await resp.json();
    const files = json.data || [];
    for (const f of files) {
      fileMap.set(f.id, f.filename_download);
    }
  }

  // Group by filename_download
  const byFilename = new Map();
  for (const ant of withImage) {
    const filename = fileMap.get(ant.Imagen) || 'UNKNOWN';
    if (!byFilename.has(filename)) {
      byFilename.set(filename, []);
    }
    byFilename.get(filename).push(ant.id);
  }

  const sharedFilenames = [...byFilename.entries()].filter(([, ids]) => ids.length > 1);
  const uniqueFilenames = byFilename.size;
  const totalSharing = sharedFilenames.reduce((sum, [, ids]) => sum + ids.length, 0);

  console.log(`Unique visual images (filename_download): ${uniqueFilenames}`);
  console.log(`Filename groups shared by 2+: ${sharedFilenames.length}`);
  console.log(`Antecedentes sharing images: ${totalSharing}`);

  if (sharedFilenames.length > 0 && sharedFilenames.length <= 20) {
    console.log('\nShared filename details:');
    for (const [filename, ids] of sharedFilenames) {
      console.log(`  ${filename}: ${ids.length} antecedentes (IDs: ${ids.join(', ')})`);
    }
  }

  // 4. HTTP spot check (sample of 20)
  console.log('\nHTTP accessibility check (sample of 20)...');
  const sample = [...uniqueUuids].sort(() => Math.random() - 0.5).slice(0, 20);
  let httpOk = 0;
  let httpFail = 0;

  for (const uuid of sample) {
    const status = await checkHttp(uuid);
    if (status === 200) {
      httpOk++;
    } else {
      httpFail++;
      console.log(`  FAIL: ${uuid} → HTTP ${status}`);
    }
  }
  console.log(`HTTP check: ${httpOk}/20 OK, ${httpFail}/20 FAIL`);

  // 5. Summary report
  const uniquenessPercent = ((uniqueFilenames / withImage.length) * 100).toFixed(1);

  console.log('\n' + '='.repeat(50));
  console.log('VERIFICATION REPORT');
  console.log('='.repeat(50));
  console.log(`Total antecedentes:        ${antecedentes.length}`);
  console.log(`With image:                ${withImage.length}`);
  console.log(`Unique UUIDs:              ${uniqueUuids.size}`);
  console.log(`Duplicate UUIDs:           ${duplicateUuids}`);
  console.log(`Unique visual images:      ${uniqueFilenames}`);
  console.log(`Shared image groups:       ${sharedFilenames.length}`);
  console.log(`Visual uniqueness:         ${uniquenessPercent}%`);
  console.log(`HTTP accessibility:        ${httpOk}/20 (${((httpOk / 20) * 100).toFixed(0)}%)`);
  console.log('='.repeat(50));

  if (duplicateUuids === 0 && sharedFilenames.length === 0 && httpFail === 0) {
    console.log('STATUS: ✓ ALL CHECKS PASSED');
  } else if (sharedFilenames.length <= 5 && httpFail === 0) {
    console.log('STATUS: ⚠ MOSTLY OK (few remaining duplicates)');
  } else {
    console.log('STATUS: ✗ ISSUES FOUND');
  }

  // Save report
  const report = {
    generated: new Date().toISOString(),
    total_antecedentes: antecedentes.length,
    with_image: withImage.length,
    unique_uuids: uniqueUuids.size,
    duplicate_uuids: duplicateUuids,
    unique_visual_images: uniqueFilenames,
    shared_image_groups: sharedFilenames.length,
    uniqueness_percent: parseFloat(uniquenessPercent),
    http_ok: httpOk,
    http_fail: httpFail,
    http_sample_size: 20,
  };

  const reportPath = path.join(__dirname, 'data', 'verification-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nReport saved to: ${reportPath}`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
