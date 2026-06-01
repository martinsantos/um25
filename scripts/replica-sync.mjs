#!/usr/bin/env node
/**
 * Sincroniza snapshots desde Directus (túnel SSH a prod o Directus local).
 *
 * Producción (desde tu Mac):
 *   ssh -N -L 8055:127.0.0.1:8055 root@23.105.176.45
 *   DIRECTUS_STATIC_TOKEN=<token_prod> npm run replica:sync
 */
import { spawn } from 'node:child_process';

const DIRECTUS_URL = process.env.DIRECTUS_INTERNAL_URL || process.env.PUBLIC_DIRECTUS_URL || 'http://localhost:8055';

console.log(`Réplica — exportando snapshots desde ${DIRECTUS_URL}\n`);

const child = spawn('node', ['scripts/snapshot-directus-data.mjs'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    PUBLIC_DIRECTUS_URL: DIRECTUS_URL,
    DIRECTUS_INTERNAL_URL: DIRECTUS_URL,
  },
});

child.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ Snapshots actualizados en src/data/snapshots/');
    console.log('Descargando imágenes desde producción (solo GET)…\n');
    const img = spawn('node', ['scripts/replica-download-images.mjs'], {
      stdio: 'inherit',
      env: { ...process.env, REPLICA_PROD_URL: process.env.REPLICA_PROD_URL || 'https://ultimamilla.com.ar' },
    });
    img.on('close', (imgCode) => process.exit(imgCode ?? 1));
    return;
  }
  process.exit(code ?? 1);
});
