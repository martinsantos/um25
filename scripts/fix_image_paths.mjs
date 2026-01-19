import fs from 'fs';
import path from 'path';

const DIRECTUS_URL = 'http://localhost:8055';
const EMAIL = 'admin@umbot.com.ar';
const PASSWORD = 'UmbotAdmin2025!';
const IMG_DIR = '/root/fumbling-field/public/imagenes_antecedentes_versionproduccion';

async function fixImages() {
    console.log('[FIX] Starting Image Fixer...');

    // 1. Get Real Files
    let realFiles = [];
    try {
        realFiles = fs.readdirSync(IMG_DIR);
        console.log(`[FIX] Found ${realFiles.length} files on disk.`);
    } catch (e) {
        console.error(`[FIX] Failed to read dir ${IMG_DIR}:`, e);
        process.exit(1);
    }

    const fileMap = new Map(); // lowercase -> realname
    realFiles.forEach(f => fileMap.set(f.toLowerCase(), f));

    // 2. Auth Directus
    let token = '';
    try {
        const authRes = await fetch(`${DIRECTUS_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: EMAIL, password: PASSWORD })
        });
        const authData = await authRes.json();
        token = authData.data.access_token;
    } catch (e) {
        console.error('[FIX] Auth failed');
        process.exit(1);
    }
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    // 3. Fetch Items
    const res = await fetch(`${DIRECTUS_URL}/items/Antecedentes?limit=-1&fields=id,Titulo,Imagen`, { headers });
    const json = await res.json();
    const items = json.data || [];
    console.log(`[FIX] Checking ${items.length} items...`);

    // 4. Check and Fix
    let fixed = 0;
    let notFound = 0;

    for (const item of items) {
        if (!item.Imagen) continue;

        // Check if it looks like a local path
        if (item.Imagen.includes('/imagenes_antecedentes_versionproduccion/')) {
            const basename = path.basename(item.Imagen);
            
            // Check exact match first
            if (realFiles.includes(basename)) {
                continue; // All good
            }

            // Check case-insensitive match
            const lower = basename.toLowerCase();
            const correctName = fileMap.get(lower);

            if (correctName) {
                console.log(`[FIX] Mismatch: "${basename}" -> "${correctName}"`);
                
                // Update Directus
                const newPath = `/imagenes_antecedentes_versionproduccion/${correctName}`;
                await fetch(`${DIRECTUS_URL}/items/Antecedentes/${item.id}`, {
                    method: 'PATCH',
                    headers,
                    body: JSON.stringify({ Imagen: newPath })
                });
                fixed++;
            } else {
                console.warn(`[FIX] 404 Not Found: ${basename} (ID: ${item.id})`);
                notFound++;
            }
        }
    }

    console.log(`[FIX] Complete. Fixed: ${fixed}. Still Broken: ${notFound}.`);
}

fixImages();
