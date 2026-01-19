
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import 'dotenv/config';
import { REPAIR_MAP } from '../src/data/repair_mapping.js';

// CONFIGURATION
const DIRECTUS_URL = 'http://localhost:8055'; // Using local API on server
const DIRECTUS_TOKEN = process.env.DIRECTUS_STATIC_TOKEN || 'k6P8LAY8_x_y1miB_KTlWnysCnx2Abky';
const OUTPUT_JSON = path.resolve('src/data/directus_fallback_offline.json');
const SYNC_DIR = path.resolve('public/img/sync-offline');
const LOCAL_CACHE_DIR = path.resolve('public/imagenes_antecedentes_versionproduccion');

if (!fs.existsSync(SYNC_DIR)) fs.mkdirSync(SYNC_DIR, { recursive: true });

async function fetchFromDirectus(collection, fields = '*') {
    console.log(`[SNAPSHOT] Fetching ${collection}...`);
    try {
        const response = await axios.get(`${DIRECTUS_URL}/items/${collection}`, {
            headers: { Authorization: `Bearer ${DIRECTUS_TOKEN}` },
            params: { limit: -1, fields: fields }
        });
        return response.data.data;
    } catch (error) {
        console.error(`[SNAPSHOT] Error fetching ${collection}:`, error.message);
        return [];
    }
}

async function downloadImage(url, id) {
    if (!id || !id.match(/^[a-f0-9-]{36}$/)) return null;
    
    const filename = `${id}.png`;
    const filePath = path.join(SYNC_DIR, filename);
    
    if (fs.existsSync(filePath)) return `/img/sync-offline/${filename}`;

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
        return new Promise((resolve) => {
            writer.on('finish', () => resolve(`/img/sync-offline/${filename}`));
            writer.on('error', () => resolve(null));
        });
    } catch (error) {
        return null;
    }
}

async function snapshot() {
    console.log('📸 STARTING COMPLETE DATABASE SNAPSHOT...');

    // 1. Fetch Data with deep relations
    const antecedenteFields = '*,Galeria.directus_files_id.*,Servicios.Servicios_id.*,ImagenFondo.*';
    const servicioFields = 'id,Titulo,Descripcion,Imagen,status,Area,Cliente,Unidad_de_negocio,Servicios_Detalle,Caracteristicas';
    const blogFields = 'id,slug,Titulo,Resumen,Contenido,Imagen_portada,Fecha_publicacion,Autor,Categorias.Nombre,Estado';

    const antecedenteItems = await fetchFromDirectus('Antecedentes', antecedenteFields);
    const servicioItems = await fetchFromDirectus('Servicios', servicioFields);
    const blogItems = await fetchFromDirectus('Entradas_Blog', blogFields);

    const snapshotData = {
        antecedentes: [],
        servicios: [],
        blog: [],
        timestamp: new Date().toISOString(),
        version: "1.2.0-FOTO-FINAL"
    };

    // 2. Process Antecedentes
    console.log(`[SNAPSHOT] Processing ${antecedenteItems.length} Antecedentes...`);
    for (const item of antecedenteItems) {
        const itemData = { ...item };
        
        // Priority image resolution
        let imageResolved = null;
        
        // A. Check REPAIR_MAP
        if (REPAIR_MAP[item.id]) {
            const filename = REPAIR_MAP[item.id];
            // Check if it exists in local cache or sync-offline
            if (fs.existsSync(path.join(LOCAL_CACHE_DIR, filename)) || fs.existsSync(path.join(SYNC_DIR, filename))) {
                 imageResolved = `/img/sync-offline/${filename}`;
            }
        }

        // B. Check Directus Imagen UUID
        if (!imageResolved && item.Imagen && item.Imagen.match(/^[a-f0-9-]{36}$/)) {
            imageResolved = await downloadImage(`${DIRECTUS_URL}/assets/${item.Imagen}`, item.Imagen);
        }

        itemData.LocalFallbackImage = imageResolved || '/images/antecedentes-hero-bg.jpg';
        snapshotData.antecedentes.push(itemData);
    }

    // 3. Process Servicios
    console.log(`[SNAPSHOT] Processing ${servicioItems.length} Servicios...`);
    for (const item of servicioItems) {
        const itemData = { ...item };
        if (item.Imagen && item.Imagen.match(/^[a-f0-9-]{36}$/)) {
             itemData.LocalFallbackImage = await downloadImage(`${DIRECTUS_URL}/assets/${item.Imagen}`, item.Imagen);
        }
        snapshotData.servicios.push(itemData);
    }

    // 4. Process Blog
    console.log(`[SNAPSHOT] Processing ${blogItems.length} Blog Entries...`);
    for (const item of blogItems) {
        const itemData = { ...item };
        if (item.Imagen_portada && item.Imagen_portada.match(/^[a-f0-9-]{36}$/)) {
             itemData.LocalFallbackImage = await downloadImage(`${DIRECTUS_URL}/assets/${item.Imagen_portada}`, item.Imagen_portada);
        }
        snapshotData.blog.push(itemData);
    }

    // 5. Save Snapshot
    fs.writeFileSync(OUTPUT_JSON, JSON.stringify(snapshotData, null, 2));
    console.log(`✅ SNAPSHOT COMPLETE! Saved to: ${OUTPUT_JSON}`);
}

snapshot();
