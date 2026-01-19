import { antecedentesEnhanced } from '../src/data/antecedentes_enhanced.js';

const DIRECTUS_URL = 'http://localhost:8055';
const EMAIL = 'admin@umbot.com.ar';
const PASSWORD = 'UmbotAdmin2025!';

async function sync() {
    console.log(`[SYNC] Connecting to ${DIRECTUS_URL}...`);

    let token = '';
    try {
        const authRes = await fetch(`${DIRECTUS_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: EMAIL, password: PASSWORD })
        });
        const authData = await authRes.json();
        if (!authData.data?.access_token) throw new Error('Auth failed');
        token = authData.data.access_token;
        console.log('[SYNC] Authenticated.');
    } catch (e) {
        console.error('[SYNC] Auth Error:', e);
        process.exit(1);
    }

    const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    // 1. Fetch ALL existing Directus items to map Titles -> IDs
    console.log('[SYNC] Fetching existing Directus items...');
    let existingItems = [];
    try {
        const res = await fetch(`${DIRECTUS_URL}/items/Antecedentes?limit=-1&fields=id,Titulo`, { headers });
        const data = await res.json();
        existingItems = data.data || [];
        console.log(`[SYNC] Found ${existingItems.length} items in Directus.`);
    } catch (e) {
        console.error('[SYNC] Failed to fetch items:', e);
        return;
    }

    // Create Map: Normalized Title -> Searchable Object
    const normalize = (s) => s ? String(s).toLowerCase().trim() : '';
    const dbMap = new Map();
    existingItems.forEach(item => {
        dbMap.set(normalize(item.Titulo), item.id);
    });

    // 2. Iterate Enhanced and Update
    let updated = 0;
    let notFound = 0;
    let errors = 0;
    let created = 0;

    for (const item of antecedentesEnhanced) {
        const normTitle = normalize(item.Titulo);
        const dbId = dbMap.get(normTitle);

        const payload = {
            Titulo: item.Titulo, // Ensure casing is perfect (enhanced)
            Descripcion: item.Descripcion,
            Imagen: item.Imagen,
            status: 'published',
            // Also map other fields if needed? SGI/Client/Area?
            Cliente: item.Cliente,
            Area: item.Area,
            Unidad_de_negocio: item.Unidad_de_negocio
        };

        if (dbId) {
            // UPDATE
            try {
                const res = await fetch(`${DIRECTUS_URL}/items/Antecedentes/${dbId}`, {
                    method: 'PATCH',
                    headers,
                    body: JSON.stringify(payload)
                });
                if (res.ok) {
                    updated++;
                    if (updated % 50 === 0) console.log(`[SYNC] Updated ${updated}...`);
                } else {
                    errors++;
                    console.warn(`[SYNC] Failed update ID ${dbId}:`, await res.text());
                }
            } catch (e) {
                errors++;
                console.error(`[SYNC] Error updating ${dbId}:`, e);
            }
        } else {
            // CREATE (If user wants ALL items)
            // The user asked "por que no salen todos". So we should create missing ones.
            try {
                const res = await fetch(`${DIRECTUS_URL}/items/Antecedentes`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(payload)
                });
                if (res.ok) {
                    created++;
                } else {
                    const txt = await res.text();
                    console.warn(`[SYNC] Failed to create "${item.Titulo}":`, txt);
                    errors++;
                }
            } catch (e) {
                errors++;
                console.error(`[SYNC] Error creating "${item.Titulo}":`, e);
            }
        }
    }

    console.log(`[SYNC] Completed. Updated: ${updated}. Created: ${created}. Errors: ${errors}.`);
}

sync();
