/**
 * Upload Service Thumbnail Images to Directus
 *
 * This script uploads the 8 main service thumbnail images to Directus using PATCH,
 * which preserves the existing UUIDs without creating duplicates.
 *
 * Usage:
 *   export DIRECTUS_TOKEN="your-admin-token"
 *   node scripts/patch-service-images.mjs
 *
 * To get the token:
 *   1. SSH to production: ssh ultimamilla
 *   2. Extract from .env or Directus admin panel
 */

import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'https://admin.ultimamilla.com.ar';
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;

if (!DIRECTUS_TOKEN) {
  console.error('❌ ERROR: DIRECTUS_TOKEN environment variable not set');
  console.error('');
  console.error('Usage:');
  console.error('  export DIRECTUS_TOKEN="your-admin-token"');
  console.error('  node scripts/patch-service-images.mjs');
  console.error('');
  console.error('To get the token:');
  console.error('  1. SSH to production: ssh ultimamilla');
  console.error('  2. Extract from .env or Directus admin panel');
  process.exit(1);
}

const serviceImages = [
  { id: 101, uuid: '444d0889-3a56-4caa-bb5a-61a921a8bc79', file: 'public/images/services/productos/infraestructura/1.jpg', name: 'Infraestructura de Redes' },
  { id: 102, uuid: '8a6b1436-5c14-431d-a5ad-38f24c7fc501', file: 'public/images/services/productos/seguridad/2.jpg', name: 'Seguridad Electrónica' },
  { id: 103, uuid: '7c0537e4-35d7-40fb-919c-3ef5afc96f22', file: 'public/images/services/productos/telecomunicaciones/3.jpg', name: 'Telecomunicaciones' },
  { id: 104, uuid: '88cdaaba-b147-4db9-898f-f76bad42724c', file: 'public/images/services/productos/software/4.jpg', name: 'Desarrollo de Software' },
  { id: 105, uuid: '68b55aa6-9d91-41a5-8c84-6a3042d22886', file: 'public/images/services/productos/soporte/5.jpg', name: 'Soporte Técnico 24/7' },
  { id: 106, uuid: 'be059379-e255-46cb-9cb9-29ad8a2f5a3e', file: 'public/images/services/productos/consultoria/6.jpg', name: 'Consultoría IT' },
  { id: 107, uuid: '622e19d2-31c9-43e7-a071-478f6676efdd', file: 'public/images/services/productos/incendios/7.jpg', name: 'Detección de Incendios' },
  { id: 108, uuid: 'ad3a3e96-6f83-40f0-bba3-8ca42837b511', file: 'public/images/services/productos/electricos/8.jpg', name: 'Servicios Eléctricos' },
];

async function patchDirectusFile(serviceId, uuid, filePath, serviceName) {
  try {
    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`);
      return false;
    }

    const stats = fs.statSync(filePath);
    const fileSizeKB = (stats.size / 1024).toFixed(1);

    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));

    console.log(`🔄 Service ${serviceId} (${serviceName}): Uploading ${fileSizeKB}KB → ${uuid}`);

    const response = await fetch(`${DIRECTUS_URL}/files/${uuid}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
      },
      body: formData
    });

    if (response.ok) {
      console.log(`✅ Service ${serviceId} uploaded successfully`);
      return true;
    } else {
      const text = await response.text();
      console.error(`❌ Service ${serviceId} upload failed (${response.status}): ${text}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Service ${serviceId} error: ${error.message}`);
    return false;
  }
}

async function verifyAsset(uuid, serviceName) {
  try {
    const response = await fetch(`${DIRECTUS_URL}/assets/${uuid}`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000)
    });

    if (response.ok) {
      const contentType = response.headers.get('content-type');
      console.log(`✅ ${serviceName}: Asset accessible (${contentType})`);
      return true;
    } else {
      console.log(`❌ ${serviceName}: Asset not accessible (${response.status})`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${serviceName}: Verification failed (${error.message})`);
    return false;
  }
}

async function main() {
  console.log('🚀 Service Image Upload to Directus');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log(`📡 Directus URL: ${DIRECTUS_URL}`);
  console.log(`🔑 Token: ${DIRECTUS_TOKEN.substring(0, 10)}...`);
  console.log(`📁 Total images: ${serviceImages.length}\n`);

  // Phase 1: Upload images
  console.log('Phase 1: Uploading Images');
  console.log('───────────────────────────────────────────────────────────\n');

  let successCount = 0;
  let failCount = 0;
  const results = [];

  for (const { id, uuid, file, name } of serviceImages) {
    const success = await patchDirectusFile(id, uuid, file, name);
    results.push({ id, uuid, name, success });

    if (success) {
      successCount++;
    } else {
      failCount++;
    }

    // Add delay to avoid overwhelming Directus
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('Phase 2: Verifying Uploads');
  console.log('───────────────────────────────────────────────────────────\n');

  let verifiedCount = 0;
  for (const { uuid, name, success } of results) {
    if (success) {
      const verified = await verifyAsset(uuid, name);
      if (verified) verifiedCount++;
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📊 Upload Summary');
  console.log('───────────────────────────────────────────────────────────');
  console.log(`✅ Uploaded: ${successCount}/${serviceImages.length}`);
  console.log(`❌ Failed: ${failCount}/${serviceImages.length}`);
  console.log(`🔍 Verified: ${verifiedCount}/${successCount}`);
  console.log('═══════════════════════════════════════════════════════════\n');

  if (failCount === 0 && verifiedCount === successCount) {
    console.log('✨ All service images uploaded and verified successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Rebuild application: npm run build');
    console.log('  2. Redeploy to production');
    console.log('  3. Verify at: https://www.ultimamilla.com.ar/servicios');
    console.log('');
  } else if (successCount > 0) {
    console.log('⚠️  Some images uploaded but issues detected');
    console.log('');
    console.log('Failed uploads:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - Service ${r.id}: ${r.name}`);
    });
    console.log('');
  } else {
    console.log('❌ Upload failed');
    console.log('');
    console.log('Check:');
    console.log('  1. DIRECTUS_TOKEN is valid');
    console.log('  2. Directus is accessible at', DIRECTUS_URL);
    console.log('  3. File UUIDs exist in Directus files table');
    console.log('');
  }

  process.exit(failCount > 0 ? 1 : 0);
}

main();
