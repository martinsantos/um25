import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

// --- Configuración ---
const INPUT_FILE = '/Users/Shared/Files From d.localized/D/ultima milla/2024/MKT 2024/umw141024/umw46-main/antecedentes-scripts-01/antev3.json';const DIRECTUS_PORT = 8055;
const DIRECTUS_URL = `http://localhost:${DIRECTUS_PORT}`;
const DIRECTUS_EMAIL = 'admin@example.com';
const DIRECTUS_PASSWORD = 'adminpassword';
const PROVIDED_TOKEN = null;
const COLLECTION_NAME = 'Antecedentes';
const IMAGE_FIELD_NAME = 'Imagen';
const ENDPOINTS = {
    items: `/items/${COLLECTION_NAME}`,
    files: `/files`,
    auth: '/auth/login',
};
const DEBUG = false;

function generarNombreBaseImagen(titulo) {
    if (!titulo) return '';
    let nombreBase = titulo.substring(0, 30);
    nombreBase = nombreBase.replace(/ /g, '_');
    nombreBase = nombreBase.replace(/^_+|_+$/g, '');
    return `${nombreBase}_HD`;
}

async function loginToDirectus() {
    if (PROVIDED_TOKEN) return PROVIDED_TOKEN;
    const response = await axios.post(`${DIRECTUS_URL}${ENDPOINTS.auth}`, {
        email: DIRECTUS_EMAIL,
        password: DIRECTUS_PASSWORD
    }, { headers: { 'Content-Type': 'application/json' }});
    return response.data.data.access_token;
}

async function buscarArchivoEnDirectusPorNombre(nombreArchivo, token) {
    const url = `${DIRECTUS_URL}${ENDPOINTS.files}?filter[filename_download][_eq]=${encodeURIComponent(nombreArchivo)}`;
    const response = await axios.get(url, { headers: { 'Authorization': `Bearer ${token}` }});
    const files = response.data.data;
    if (files.length > 0) {
        return files[0].id;
    } else {
        return null;
    }
}

async function buscarItemsPorTitulo(titulo, token) {
    const url = `${DIRECTUS_URL}${ENDPOINTS.items}?filter[Titulo][_eq]=${encodeURIComponent(titulo)}`;
    const response = await axios.get(url, { headers: { 'Authorization': `Bearer ${token}` }});
    return response.data.data;
}

async function actualizarItemConImagen(itemId, fileId, token) {
    const url = `${DIRECTUS_URL}${ENDPOINTS.items}/${itemId}`;
    const payload = { [IMAGE_FIELD_NAME]: fileId };
    await axios.patch(url, payload, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    });
}

async function asociarImagenesDirectusExistentes() {
    let antecedentes;
    try {
        const data = await fs.readFile(INPUT_FILE, 'utf-8');
        antecedentes = JSON.parse(data);
    } catch (e) {
        console.error('No se pudo leer el archivo de antecedentes:', e.message);
        process.exit(1);
    }

    let token;
    try {
        token = await loginToDirectus();
    } catch (e) {
        console.error('No se pudo autenticar en Directus:', e.message);
        process.exit(1);
    }

    let asociados = 0, sinImagen = 0, sinItem = 0;
    for (const ant of antecedentes) {
        const nombreImagen = generarNombreBaseImagen(ant.Titulo) + '.png';
        let fileId = null;
        try {
            fileId = await buscarArchivoEnDirectusPorNombre(nombreImagen, token);
        } catch (e) {
            console.error(`Error buscando imagen ${nombreImagen}:`, e.message);
            continue;
        }
        if (!fileId) {
            sinImagen++;
            continue;
        }
        let items = [];
        try {
            items = await buscarItemsPorTitulo(ant.Titulo, token);
        } catch (e) {
            console.error(`Error buscando antecedente '${ant.Titulo}':`, e.message);
            continue;
        }
        if (!items.length) {
            sinItem++;
            continue;
        }
        for (const item of items) {
            try {
                await actualizarItemConImagen(item.id, fileId, token);
                asociados++;
            } catch (e) {
                console.error(`Error asociando imagen a item ID ${item.id}:`, e.message);
            }
        }
    }
    console.log(`\nResumen: Asociados: ${asociados}, Sin imagen: ${sinImagen}, Sin antecedente: ${sinItem}`);
}

// --- Ejecución ---
asociarImagenesDirectusExistentes().catch(e => {
    console.error('Error inesperado:', e.message);
    process.exit(1);
});
