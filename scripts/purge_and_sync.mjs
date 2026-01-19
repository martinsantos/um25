import { antecedentesEnhanced } from '../src/data/antecedentes_enhanced.js';

const DIRECTUS_URL = 'http://localhost:8055';
const EMAIL = 'admin@umbot.com.ar';
const PASSWORD = 'UmbotAdmin2025!';

async function sync() {
    console.log(`[SYNC] SMART UPSERT STARTING...`);

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
        console.error('[SYNC] Auth failed');
        process.exit(1);
    }
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    // 2. Map existing items by original_id
    console.log('[SYNC] Mapping existing items in Directus...');
    const res = await fetch(`${DIRECTUS_URL}/items/Antecedentes?limit=-1&fields=id,original_id,Titulo`, { headers });
    const data = await res.json();
    const existingMap = new Map();
    (data.data || []).forEach(item => {
        if (item.original_id) {
            existingMap.set(item.original_id, item.id);
        }
    });
    console.log(`[SYNC] Found ${existingMap.size} valid mappings.`);

    // 3. UPSERT Enhanced Items
    console.log(`[SYNC] Processing ${antecedentesEnhanced.length} items...`);
    let created = 0;
    let updated = 0;
    let errors = 0;

    for (const item of antecedentesEnhanced) {
        const payload = {
            original_id: item.id, // Store the UUID
            Titulo: item.Titulo,
            Descripcion: item.Descripcion,
            Imagen: item.Imagen,
            status: 'published',
            Cliente: item.Cliente,
            Area: item.Area,
            Unidad_de_negocio: item.Unidad_de_negocio,
            Fecha: item.Fecha,
            Presupuesto: item.Presupuesto
        };

        const existingId = existingMap.get(item.id);

        try {
            if (existingId) {
                // UPDATE (PATCH)
                // Note: We could skip updating if we want to protect manual edits
                // For now, let's update but log it
                const res = await fetch(`${DIRECTUS_URL}/items/Antecedentes/${existingId}`, {
                    method: 'PATCH',
                    headers,
                    body: JSON.stringify(payload)
                });
                if (res.ok) {
                    updated++;
                } else {
                    console.warn(`[SYNC] Error updating ${item.Titulo} (ID ${existingId}):`, await res.text());
                    errors++;
                }
            } else {
                // CREATE (POST)
                const res = await fetch(`${DIRECTUS_URL}/items/Antecedentes`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(payload)
                });
                if (res.ok) {
                    created++;
                } else {
                    console.warn(`[SYNC] Error creating ${item.Titulo}:`, await res.text());
                    errors++;
                }
            }
        } catch (e) {
            console.error('[SYNC] Network Error:', e);
            errors++;
        }
        
        if ((created + updated) % 50 === 0) process.stdout.write('.');
    }
    console.log(`\n[SYNC] Finished. Created: ${created}. Updated: ${updated}. Errors: ${errors}.`);
}

sync();
