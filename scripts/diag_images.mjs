import fs from 'fs';
import path from 'path';

const DIRECTUS_URL = 'http://localhost:8055';
const EMAIL = 'admin@umbot.com.ar';
const PASSWORD = 'UmbotAdmin2025!';
const IMG_DIR = '/root/fumbling-field/public/imagenes_antecedentes_versionproduccion';

async function diagnose() {
    console.log('[DIAG] Starting Diagnostics...');

    // 1. Get Real Files
    let realFiles = [];
    try {
        realFiles = fs.readdirSync(IMG_DIR);
    } catch (e) {
        console.error(`[DIAG] Failed to read dir ${IMG_DIR}:`, e);
        process.exit(1);
    }
    console.log(`[DIAG] Found ${realFiles.length} files on disk. Sample: ${realFiles.slice(0, 3).join(', ')}`);

    // 2. Auth
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
        console.error('[DIAG] Auth failed');
        process.exit(1);
    }
    const headers = { 'Authorization': `Bearer ${token}` };

    // 3. Fetch Items
    const res = await fetch(`${DIRECTUS_URL}/items/Antecedentes?limit=50&fields=id,Titulo,Imagen`, { headers });
    const json = await res.json();
    const items = json.data || [];

    // 4. Check specific problematic items
    // Look for "Triunfo" or "Finca"
    const problems = items.filter(i => 
        (i.Titulo && i.Titulo.toLowerCase().includes('triunfo')) || 
        (i.Titulo && i.Titulo.toLowerCase().includes('finca'))
    );
    
    console.log(`[DIAG] Checking ${problems.length} suspected problem items...`);

    for (const item of problems) {
        console.log(`\n[ITEM] ID: ${item.id} | Title: ${item.Titulo}`);
        console.log(`[ITEM] Image Path: ${item.Imagen}`);
        
        if (item.Imagen && item.Imagen.includes('/imagenes_antecedentes_versionproduccion/')) {
            const basename = path.basename(item.Imagen);
            const exists = realFiles.includes(basename);
            console.log(`[ITEM] Basename: "${basename}" | Exists on disk? ${exists}`);
            
            if (!exists) {
                // Fuzzy search
                const lower = basename.toLowerCase();
                const match = realFiles.find(f => f.toLowerCase() === lower);
                console.log(`[ITEM] Case-insensitive match? ${match ? match : 'NO'}`);
                
                // Super fuzzy (partial)
                const partial = realFiles.find(f => f.toLowerCase().includes('triunfo') || f.toLowerCase().includes('finca'));
                 console.log(`[ITEM] Any file with similar name? ${partial}`);
            }
        } else {
             console.log(`[ITEM] does not match path pattern.`);
        }
    }
}

diagnose();
