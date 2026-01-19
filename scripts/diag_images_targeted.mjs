import fs from 'fs';
import path from 'path';

const DIRECTUS_URL = 'http://localhost:8055';
const EMAIL = 'admin@umbot.com.ar';
const PASSWORD = 'UmbotAdmin2025!';
const IMG_DIR = '/root/fumbling-field/public/imagenes_antecedentes_versionproduccion';

async function diagnose() {
    // 1. Auth
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

    // 2. Fetch specific items
    console.log('[DIAG] Searching for Triunfo and Finca...');
    const res = await fetch(`${DIRECTUS_URL}/items/Antecedentes?limit=-1&fields=id,Titulo,Imagen`, { headers });
    const json = await res.json();
    const items = json.data || [];

    const targets = items.filter(i => 
        (i.Titulo && i.Titulo.toLowerCase().includes('triunfo')) || 
        (i.Titulo && i.Titulo.toLowerCase().includes('finca'))
    );

    console.log(`[DIAG] Found ${targets.length} items.`);
    
    // 3. Check against disk
    const diskFiles = fs.readdirSync(IMG_DIR);

    for (const item of targets) {
        console.log(`\n--- Item ${item.id}: ${item.Titulo} ---`);
        console.log(`    DB Image: "${item.Imagen}"`);
        
        if (!item.Imagen) {
            console.log('    Status: MISSING IMAGE FIELD');
            continue;
        }

        const basename = path.basename(item.Imagen);
        const exactMatch = diskFiles.includes(basename);
        
        console.log(`    Basename: "${basename}"`);
        console.log(`    Exact File Exists? ${exactMatch ? 'YES' : 'NO'}`);
        
        if (!exactMatch) {
            // Find similar
            const fuzzy = diskFiles.find(f => f.toLowerCase().includes('triunfo') || f.toLowerCase().includes('finca'));
            console.log(`    Suggested file on disk: ${fuzzy || 'None'}`);
        }
    }
}

diagnose();
