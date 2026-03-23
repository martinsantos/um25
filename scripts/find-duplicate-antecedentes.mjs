#!/usr/bin/env node
/**
 * Find Duplicate Antecedentes Images
 *
 * Queries Directus for all antecedentes, crosses with directus_files
 * to find which ones share the same visual image (filename_download),
 * and exports those needing new unique images.
 *
 * Usage: node scripts/find-duplicate-antecedentes.mjs
 * Output: scripts/data/antecedentes-need-images.json
 */

import { createDirectus, rest, readItems, staticToken } from '@directus/sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DIRECTUS_URL = process.env.PUBLIC_DIRECTUS_URL || 'http://23.105.176.45:8055';
const DIRECTUS_TOKEN = process.env.PUBLIC_DIRECTUS_TOKEN || 'k6P8LAY8_x_y1miB_KTlWnysCnx2Abky';

const client = createDirectus(DIRECTUS_URL)
  .with(staticToken(DIRECTUS_TOKEN))
  .with(rest());

async function main() {
  console.log('=== Finding Duplicate Antecedentes Images ===\n');

  // 1. Fetch all antecedentes with their image UUIDs
  console.log('Fetching antecedentes from Directus...');
  const antecedentes = await client.request(
    readItems('Antecedentes', {
      fields: ['id', 'Titulo', 'Descripcion', 'Imagen'],
      limit: -1,
    })
  );
  console.log(`Found ${antecedentes.length} antecedentes`);

  // 2. Collect all unique image UUIDs
  const imageUuids = [...new Set(
    antecedentes
      .filter(a => a.Imagen)
      .map(a => a.Imagen)
  )];
  console.log(`Unique image UUIDs: ${imageUuids.length}`);

  // 3. Fetch file metadata for all image UUIDs (in batches)
  console.log('Fetching file metadata...');
  const fileMap = new Map();
  const batchSize = 100;

  for (let i = 0; i < imageUuids.length; i += batchSize) {
    const batch = imageUuids.slice(i, i + batchSize);
    const ids = batch.join(',');
    const resp = await fetch(
      `${DIRECTUS_URL}/files?filter[id][_in]=${ids}&fields=id,filename_download,filename_disk&limit=-1`,
      { headers: { 'Authorization': `Bearer ${DIRECTUS_TOKEN}` } }
    );
    const json = await resp.json();
    const files = json.data || [];
    for (const f of files) {
      fileMap.set(f.id, f);
    }
  }
  console.log(`Fetched metadata for ${fileMap.size} files`);

  // 4. Group antecedentes by filename_download (visual image)
  const byFilename = new Map();

  for (const ant of antecedentes) {
    if (!ant.Imagen) continue;
    const file = fileMap.get(ant.Imagen);
    const filename = file?.filename_download || 'UNKNOWN';

    if (!byFilename.has(filename)) {
      byFilename.set(filename, []);
    }
    byFilename.get(filename).push({
      id: ant.id,
      titulo: ant.Titulo || '',
      descripcion: ant.Descripcion || '',
      imagen_uuid: ant.Imagen,
    });
  }

  // 5. Find duplicates (filename_download shared by 2+ antecedentes)
  const duplicateGroups = [];
  let totalDuplicateAntecedentes = 0;

  for (const [filename, items] of byFilename) {
    if (items.length > 1) {
      duplicateGroups.push({
        filename,
        count: items.length,
        antecedentes: items,
      });
      totalDuplicateAntecedentes += items.length;
    }
  }

  console.log(`\nDuplicate groups: ${duplicateGroups.length}`);
  console.log(`Total antecedentes sharing images: ${totalDuplicateAntecedentes}`);

  // 6. Select which antecedentes need new images
  // Strategy: For each group, keep the first one (it keeps its image),
  // all others need new unique images
  const needNewImage = [];

  for (const group of duplicateGroups) {
    // Keep the first antecedente's image, mark the rest as needing new ones
    for (let i = 1; i < group.antecedentes.length; i++) {
      const ant = group.antecedentes[i];
      needNewImage.push({
        id: ant.id,
        titulo: ant.titulo,
        descripcion: ant.descripcion,
        current_uuid: ant.imagen_uuid,
        current_filename: group.filename,
        shared_with_count: group.count,
      });
    }
  }

  console.log(`\nAntecedentes needing new unique images: ${needNewImage.length}`);

  // 7. Stats
  const uniqueFilenames = byFilename.size;
  const totalWithImage = antecedentes.filter(a => a.Imagen).length;
  console.log(`\n--- Summary ---`);
  console.log(`Total antecedentes: ${antecedentes.length}`);
  console.log(`With image: ${totalWithImage}`);
  console.log(`Unique visual images: ${uniqueFilenames}`);
  console.log(`Duplicate groups: ${duplicateGroups.length}`);
  console.log(`Need new image: ${needNewImage.length}`);
  console.log(`After fix: ${uniqueFilenames + needNewImage.length} unique (target: ${totalWithImage})`);

  // 8. Save output
  const outputDir = path.join(__dirname, 'data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'antecedentes-need-images.json');
  fs.writeFileSync(outputPath, JSON.stringify(needNewImage, null, 2));
  console.log(`\nSaved to: ${outputPath}`);

  // Also save full duplicate report
  const reportPath = path.join(outputDir, 'duplicate-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    generated: new Date().toISOString(),
    summary: {
      total_antecedentes: antecedentes.length,
      with_image: totalWithImage,
      unique_visual_images: uniqueFilenames,
      duplicate_groups: duplicateGroups.length,
      need_new_image: needNewImage.length,
    },
    duplicate_groups: duplicateGroups.map(g => ({
      filename: g.filename,
      shared_by: g.count,
      antecedente_ids: g.antecedentes.map(a => a.id),
    })),
  }, null, 2));
  console.log(`Report saved to: ${reportPath}`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
