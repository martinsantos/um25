import fs from 'fs';
import path from 'path';
import axios from 'axios';
import 'dotenv/config';
import { mapeoImagenes } from '../src/data/mapeo_imagenes_completo.js';
import { manualData } from '../src/data/antecedentes_completos.js';

// CONFIGURATION
const DIRECTUS_URL = 'http://23.105.176.45:8055';
const PUBLIC_DOMAIN_FOR_IMAGES = 'https://ultimamilla.com.ar'; // For downloading legacy images
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN || 'k6P8LAY8_x_y1miB_KTlWnysCnx2Abky';
const OUTPUT_JSON = path.resolve('src/data/directus_fallback_offline.json');
const SYNC_DIR = path.resolve('public/img/sync-offline');
const SERVER_IMG_DIR = '/var/www/html/imagenes_antecedentes_versionproduccion';
const SSH_HOST = '23.105.176.45';
const SSH_PASS = 'gsiB%s@0yD';

// MANUAL OVERRIDES for known broken/missing Directus assets
const MANUAL_IMAGE_OVERRIDES = {
    3381: '/img/sync-offline/a0894963-881d-4995-8f6f-467ae5a21adb.png', // Reubicacion de tablero -> Hospital Tablero
    3581: '/img/sync-offline/0b029f93-6eb9-4ff5-89a6-6f11b859a69c.png'  // Tablero Banco Capacitores -> Triunfo Cableado
};

// Ensure sync directory exists
if (!fs.existsSync(SYNC_DIR)) {
    fs.mkdirSync(SYNC_DIR, { recursive: true });
}

async function fetchFromDirectus(collection) {
    console.log(`[SYNC] Fetching ${collection} from Directus...`);
    try {
        const response = await axios.get(`${DIRECTUS_URL}/items/${collection}`, {
            headers: { Authorization: `Bearer ${DIRECTUS_TOKEN}` },
            params: { limit: -1, fields: '*' }
        });
        return response.data.data;
    } catch (error) {
        console.error(`[SYNC] Error fetching ${collection}:`, error.message);
        return [];
    }
}

async function downloadImage(url, filename) {
    const filePath = path.join(SYNC_DIR, filename);
    if (fs.existsSync(filePath)) return true;

    try {
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream',
            timeout: 10000,
            headers: { Authorization: `Bearer ${DIRECTUS_TOKEN}` }
        });
        
        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    } catch (error) {
        console.warn(`[SYNC] Could not download image ${url}:`, error.message);
        return false;
    }
}

async function sync() {
    console.log('🚀 Starting Robust Fallback Sync...');
    
    // 1. Fetch Data
    const antecedentes = await fetchFromDirectus('Antecedentes');
    const servicios = await fetchFromDirectus('Servicios');
    
    const fallbackData = {
        antecedentes: [],
        servicios: [],
        timestamp: new Date().toISOString()
    };

    console.log(`[SYNC] Processing ${antecedentes.length} antecedentes...`);
    
    for (const item of antecedentes) {
        const itemData = { ...item };
        let imageFound = false;

        // PRIORITY 0: Manual Overrides
        if (MANUAL_IMAGE_OVERRIDES[item.id]) {
            itemData.LocalFallbackImage = MANUAL_IMAGE_OVERRIDES[item.id];
            console.log(`[SYNC] Applied manual override for ID ${item.id}: ${itemData.LocalFallbackImage}`);
            imageFound = true;
        }

        // PRIORITY 1: Map to "Perfect" Legacy Images from Server
        const mapping = mapeoImagenes.find(m => m.numero === item.id);
        if (mapping && mapping.nombre_archivo_generado) {
            const filename = mapping.nombre_archivo_generado;
            console.log(`[SYNC] Found legacy mapping for ID ${item.id}: ${filename}`);
            
            // We use the public URL to "download" it locally to the proyecto if not present
            // This is safer than scp for a bulk script
            const url = `https://ultimamilla.com.ar/imagenes_antecedentes_versionproduccion/${filename}`;
            const success = await downloadImage(url, filename);
            if (success) {
                itemData.LocalFallbackImage = `/img/sync-offline/${filename}`;
                imageFound = true;
            }
        }

        // PRIORITY 2: Directus UUID Sync
        if (!imageFound && item.Imagen && item.Imagen.match(/^[a-f0-9-]{36}$/)) {
            const ext = 'png'; // Directus default or we could probe
            const filename = `${item.Imagen}.${ext}`;
            const url = `${DIRECTUS_URL}/assets/${item.Imagen}`;
            console.log(`[SYNC] Downloading Directus asset for ID ${item.id}: ${item.Imagen}`);
            const success = await downloadImage(url, filename);
            if (success) {
                itemData.LocalFallbackImage = `/img/sync-offline/${filename}`;
            }
        }

        fallbackData.antecedentes.push(itemData);
    }

    // Process Servicios similarly
    console.log(`[SYNC] Processing ${servicios.length} servicios...`);
    for (const item of servicios) {
        const itemData = { ...item };
        // Basic mapping for services if needed, usually they use the same UUIDs
        if (item.Imagen && item.Imagen.match(/^[a-f0-9-]{36}$/)) {
            const filename = `${item.Imagen}.png`;
            const url = `${DIRECTUS_URL}/assets/${item.Imagen}`;
            await downloadImage(url, filename);
            itemData.LocalFallbackImage = `/img/sync-offline/${filename}`;
        }
        fallbackData.servicios.push(itemData);
    }

    // Save JSON
    fs.writeFileSync(OUTPUT_JSON, JSON.stringify(fallbackData, null, 2));
    console.log(`✅ Sync Complete! JSON saved to ${OUTPUT_JSON}`);
}

sync();
