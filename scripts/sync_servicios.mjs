import { serviciosReales } from '../src/data/servicios_reales_db.js';

const DIRECTUS_URL = 'http://localhost:8055';
const EMAIL = 'admin@umbot.com.ar';
const PASSWORD = 'UmbotAdmin2025!';

async function sync() {
    console.log(`[SYNC] SERVICIOS UPSERT STARTING...`);

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

    // 2. Map existing items by original_id or Titulo
    console.log('[SYNC] Mapping existing items in Directus...');
    const res = await fetch(`${DIRECTUS_URL}/items/Servicios?limit=-1&fields=id,original_id,Titulo`, { headers });
    const data = await res.json();
    const existingMap = new Map();
    (data.data || []).forEach(item => {
        if (item.original_id) {
            existingMap.set(item.original_id.toString(), item.id);
        } else if (item.Titulo) {
            // Fallback to title if no original_id (for the 5 existing records)
            existingMap.set(item.Titulo.toLowerCase(), item.id);
        }
    });
    console.log(`[SYNC] Found ${existingMap.size} valid mappings.`);

    // 3. UPSERT Items
    console.log(`[SYNC] Processing ${serviciosReales.length} items...`);
    let created = 0;
    let updated = 0;
    let errors = 0;

    for (const item of serviciosReales) {
        const payload = {
            original_id: item.id.toString(),
            Titulo: item.Titulo,
            Descripcion: item.Descripcion,
            Area: item.Area,
            Cliente: item.Cliente,
            Unidad_de_negocio: item.Unidad_de_negocio,
            Imagen: item.Imagen,
            Presupuesto: item.Presupuesto,
            Servicios_Detalle: item.Servicios,
            Caracteristicas: item.Caracteristicas,
            status: 'published'
        };

        // Try lookup by original_id first, then Titulo
        let existingId = existingMap.get(item.id.toString());
        if (!existingId) {
            existingId = existingMap.get(item.Titulo.toLowerCase());
        }

        try {
            if (existingId) {
                console.log(`[SYNC] Updating ${item.Titulo} (ID ${existingId})...`);
                const res = await fetch(`${DIRECTUS_URL}/items/Servicios/${existingId}`, {
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
                console.log(`[SYNC] Creating ${item.Titulo}... payload:`, JSON.stringify(payload));
                const res = await fetch(`${DIRECTUS_URL}/items/Servicios`, {
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
    }
    console.log(`\n[SYNC] Finished. Created: ${created}. Updated: ${updated}. Errors: ${errors}.`);
}

sync();
