
import fs from 'fs';
import path from 'path';
import { createDirectus, rest } from '@directus/sdk';

const DIRECTUS_URL = 'http://localhost:8055';
const EMAIL = 'admin@umbot.com.ar';
const PASSWORD = 'UmbotAdmin2025!';
const IMAGES_DIR = 'public/images/portadas';

const STATIC_TOKEN = 'k6P8LAY8_x_y1miB_KTlWnysCnx2Abky';

const client = createDirectus(DIRECTUS_URL)
    .with(rest());
// No need to login if using static token for most requests, 
// but for fetch we need the token too.

async function seedHeroImages() {
  try {
    console.log('✅ Starting seeding with static token.');

    // 0. Clear existing items
    console.log('Cleaning existing items in Hero_Home...');
    const listRes = await fetch(`${DIRECTUS_URL}/items/Hero_Home?limit=-1`, {
       headers: { 'Authorization': `Bearer ${STATIC_TOKEN}` }
    });
    const listData = await listRes.json();
    if (listData.data && listData.data.length > 0) {
       const ids = listData.data.map(i => i.id);
       console.log(`Deleting ${ids.length} old items...`);
       await fetch(`${DIRECTUS_URL}/items/Hero_Home`, {
          method: 'DELETE',
          headers: { 
             'Authorization': `Bearer ${STATIC_TOKEN}`,
             'Content-Type': 'application/json'
          },
          body: JSON.stringify(ids)
       });
    }

    const files = fs.readdirSync(IMAGES_DIR).filter(f => f.match(/\.(png|jpg|gif|webp)$/i));
    console.log(`Found ${files.length} images to seed.`);

    for (let i = 0; i < files.length; i++) {
      const filename = files[i];
      const filePath = path.join(IMAGES_DIR, filename);
      
      console.log(`[${i+1}/${files.length}] Uploading ${filename}...`);

      try {
        // Upload file
        const formData = new FormData();
        const fileContent = fs.readFileSync(filePath);
        const blob = new Blob([fileContent], { type: filename.endsWith('.gif') ? 'image/gif' : 'image/png' });
        formData.append('file', blob, filename);

        const uploadResponse = await fetch(`${DIRECTUS_URL}/files`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${STATIC_TOKEN}`
          },
          body: formData
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.errors?.[0]?.message || 'Upload failed');
        }

        const fileData = await uploadResponse.json();
        const fileId = fileData.data.id;
        console.log(`   ✅ File uploaded (ID: ${fileId}). Creating entry...`);

        // Create Hero_Home entry
        const itemResponse = await fetch(`${DIRECTUS_URL}/items/Hero_Home`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${STATIC_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            titulo: filename.split('.')[0].replace('portada', 'Portada '),
            orden: i + 1,
            imagen: fileId,
            status: 'published'
          })
        });

        if (!itemResponse.ok) {
           const errText = await itemResponse.text();
           console.error(`   ❌ Failed to create item: ${errText}`);
        } else {
           console.log(`   ✅ Entry created for ${filename}.`);
        }

      } catch (err) {
        console.error(`   ❌ Failed to process ${filename}:`, err.message);
      }
    }

    console.log('🚀 Seeding complete.');
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
  }
}

seedHeroImages();
