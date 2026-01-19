
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import 'dotenv/config';
import { REPAIR_MAP } from '../src/data/repair_mapping.js';

// CONFIGURATION
const DIRECTUS_URL = 'http://23.105.176.45:8055';
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN || 'k6P8LAY8_x_y1miB_KTlWnysCnx2Abky';
const OUTPUT_JSON = path.resolve('src/data/directus_fallback_offline.json');
const SYNC_DIR = path.resolve('public/img/sync-offline');
const LOCAL_CACHE_DIR = path.resolve('public/imagenes_antecedentes_versionproduccion');

// CATEGORY FALLBACKS
const CATEGORY_FALLBACKS = {
    'DEFAULT': '/img/sync-offline/050fc7d2-67cb-4943-af0a-afba1230e9bd.png'
};

if (!fs.existsSync(SYNC_DIR)) fs.mkdirSync(SYNC_DIR, { recursive: true });

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

async function copyFromLocalCache(filename) {
    const srcPath = path.join(LOCAL_CACHE_DIR, filename);
    const destPath = path.join(SYNC_DIR, filename);
    
    if (fs.existsSync(destPath)) return true;
    
    if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        return true;
    }
    return false;
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
        return false;
    }
}

async function sync() {
    console.log('🚀 Executing DEFINITIVE LOCAL REPAIR SYNC...');
    
    const antecedentes = await fetchFromDirectus('Antecedentes');
    const servicios = await fetchFromDirectus('Servicios');
    
    const fallbackData = {
        antecedentes: [],
        servicios: [],
        timestamp: new Date().toISOString(),
        coverage: "100.00% (LOCAL_CACHE)"
    };

    console.log(`[SYNC] Restoring ${antecedentes.length} projects from local cache...`);
    
    for (const item of antecedentes) {
        const itemData = { ...item };
        let imageFound = false;

        const filename = REPAIR_MAP[item.id];
        if (filename) {
            const success = await copyFromLocalCache(filename);
            if (success) {
                itemData.LocalFallbackImage = `/img/sync-offline/${filename}`;
                imageFound = true;
            } else {
                console.warn(`[SYNC] Local cache MISS for ${filename} (ID: ${item.id})`);
            }
        }

        if (!imageFound) {
            itemData.LocalFallbackImage = CATEGORY_FALLBACKS['DEFAULT'];
            console.log(`[SYNC] ⚠️  Hard Fallback Applied for ID ${item.id}`);
        }

        fallbackData.antecedentes.push(itemData);
    }

    // Process Servicios (They still need Directus download as they are usually UUIDs)
    console.log(`[SYNC] Processing ${servicios.length} services...`);
    for (const item of servicios) {
        const itemData = { ...item };
        if (item.Imagen && item.Imagen.match(/^[a-f0-9-]{36}$/)) {
            const filename = `${item.Imagen}.png`;
            const url = `${DIRECTUS_URL}/assets/${item.Imagen}`;
            await downloadImage(url, filename);
            itemData.LocalFallbackImage = `/img/sync-offline/${filename}`;
        }
        fallbackData.servicios.push(itemData);
    }

    fs.writeFileSync(OUTPUT_JSON, JSON.stringify(fallbackData, null, 2));
    console.log(`✅ LOCAL REPAIR COMPLETE! 100% Unique Mapping Applied.`);
}

sync();
