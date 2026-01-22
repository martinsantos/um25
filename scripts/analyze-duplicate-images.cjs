/**
 * Script para identificar antecedentes con imágenes duplicadas
 * y reasignarles imágenes únicas basadas en cliente/área
 */

const fs = require('fs');
const path = require('path');

// Configuración
const DIRECTUS_URL = 'http://localhost:8055';
const TOKEN = process.env.DIRECTUS_STATIC_TOKEN || 'k6P8LAY8_x_y1miB_KTlWnysCnx2Abky';
const LOCAL_IMAGES_PATH = '/var/www/ultimamilla.com.ar/public/imagenes_antecedentes_versionproduccion';

async function fetchAntecedentes() {
    const response = await fetch(`${DIRECTUS_URL}/items/Antecedentes?limit=500&fields=id,Titulo,Cliente,Area,Imagen`, {
        headers: { 'Authorization': `Bearer ${TOKEN}` }
    });
    const data = await response.json();
    return data.data;
}

function getLocalImages() {
    try {
        return fs.readdirSync(LOCAL_IMAGES_PATH)
            .filter(f => !f.startsWith('._') && f.endsWith('.png'));
    } catch (e) {
        console.error('Error leyendo imágenes locales:', e);
        return [];
    }
}

function normalizeString(str) {
    return (str || '').toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .substring(0, 50);
}

function findMatchingImage(antecedente, localImages, usedImages) {
    const cliente = normalizeString(antecedente.Cliente);
    const area = normalizeString(antecedente.Area);
    
    // Buscar imagen que matchee cliente y área
    const matches = localImages.filter(img => {
        if (usedImages.has(img)) return false;
        const imgLower = img.toLowerCase();
        return imgLower.includes(cliente) || imgLower.includes(area);
    });
    
    if (matches.length > 0) {
        return matches[0];
    }
    
    // Si no hay match exacto, buscar solo por cliente
    const clienteMatches = localImages.filter(img => {
        if (usedImages.has(img)) return false;
        return img.toLowerCase().includes(cliente);
    });
    
    return clienteMatches.length > 0 ? clienteMatches[0] : null;
}

async function main() {
    console.log('=== ANÁLISIS DE IMÁGENES DUPLICADAS ===\n');
    
    // 1. Obtener antecedentes
    const antecedentes = await fetchAntecedentes();
    console.log(`Total antecedentes: ${antecedentes.length}`);
    
    // 2. Identificar duplicados
    const imageCount = {};
    antecedentes.forEach(a => {
        if (a.Imagen) {
            imageCount[a.Imagen] = (imageCount[a.Imagen] || 0) + 1;
        }
    });
    
    const duplicatedImages = Object.entries(imageCount)
        .filter(([_, count]) => count > 1)
        .sort((a, b) => b[1] - a[1]);
    
    console.log(`\nImágenes duplicadas: ${duplicatedImages.length}`);
    console.log(`\nTop 10 más repetidas:`);
    duplicatedImages.slice(0, 10).forEach(([img, count]) => {
        console.log(`  ${img.substring(0, 30)}...: ${count}x`);
    });
    
    // 3. Obtener antecedentes afectados
    const duplicatedImageIds = new Set(duplicatedImages.map(([img]) => img));
    const antecedentesAfectados = antecedentes.filter(a => 
        duplicatedImageIds.has(a.Imagen)
    );
    
    console.log(`\nAntecedentes con imagen duplicada: ${antecedentesAfectados.length}`);
    
    // 4. Obtener imágenes locales
    const localImages = getLocalImages();
    console.log(`\nImágenes locales disponibles: ${localImages.length}`);
    
    // 5. Crear plan de reasignación
    const usedImages = new Set();
    const reasignaciones = [];
    const sinMatch = [];
    
    for (const ant of antecedentesAfectados) {
        const match = findMatchingImage(ant, localImages, usedImages);
        if (match) {
            usedImages.add(match);
            reasignaciones.push({
                id: ant.id,
                titulo: ant.Titulo,
                cliente: ant.Cliente,
                imagenActual: ant.Imagen,
                nuevaImagen: match
            });
        } else {
            sinMatch.push({
                id: ant.id,
                titulo: ant.Titulo,
                cliente: ant.Cliente,
                area: ant.Area
            });
        }
    }
    
    console.log(`\n=== RESULTADOS ===`);
    console.log(`Reasignaciones posibles: ${reasignaciones.length}`);
    console.log(`Sin match (necesitan IA): ${sinMatch.length}`);
    
    // 6. Guardar resultados
    fs.writeFileSync('/tmp/reasignaciones.json', JSON.stringify(reasignaciones, null, 2));
    fs.writeFileSync('/tmp/sin_match.json', JSON.stringify(sinMatch, null, 2));
    
    console.log(`\nArchivos generados:`);
    console.log(`  /tmp/reasignaciones.json - ${reasignaciones.length} items`);
    console.log(`  /tmp/sin_match.json - ${sinMatch.length} items`);
    
    // 7. Mostrar muestra
    if (reasignaciones.length > 0) {
        console.log(`\n=== MUESTRA DE REASIGNACIONES ===`);
        reasignaciones.slice(0, 5).forEach(r => {
            console.log(`  ID ${r.id}: ${r.cliente}`);
            console.log(`    Actual: ${r.imagenActual.substring(0, 30)}...`);
            console.log(`    Nueva: ${r.nuevaImagen.substring(0, 50)}...`);
        });
    }
    
    if (sinMatch.length > 0) {
        console.log(`\n=== SIN MATCH (primeros 10) ===`);
        sinMatch.slice(0, 10).forEach(s => {
            console.log(`  ID ${s.id}: ${s.cliente} - ${s.area}`);
        });
    }
}

main().catch(console.error);
