/**
 * Script para subir imágenes locales a Directus y actualizar antecedentes
 * Ejecutar con: node scripts/upload-images.cjs
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const TOKEN = 'k6P8LAY8_x_y1miB_KTlWnysCnx2Abky';
const DIRECTUS_URL = 'http://localhost:8055';
const LOCAL_IMAGES_PATH = '/var/www/ultimamilla.com.ar/public/imagenes_antecedentes_versionproduccion';

async function uploadImage(filePath) {
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));
    
    const response = await fetch(`${DIRECTUS_URL}/files`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${TOKEN}`
        },
        body: form
    });
    
    if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data.id;
}

async function updateAntecedente(id, imageId) {
    const response = await fetch(`${DIRECTUS_URL}/items/Antecedentes/${id}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ Imagen: imageId })
    });
    
    if (!response.ok) {
        throw new Error(`Update failed: ${response.status}`);
    }
    
    return true;
}

async function main() {
    console.log('=== INICIANDO REASIGNACIÓN DE IMÁGENES ===\n');
    
    // Cargar matches
    const matches = JSON.parse(fs.readFileSync('/tmp/matches.json', 'utf8'));
    console.log(`Total a procesar: ${matches.length}`);
    
    let success = 0;
    let errors = [];
    
    for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        const imagePath = path.join(LOCAL_IMAGES_PATH, match.nuevaImagen);
        
        try {
            // Verificar que existe la imagen
            if (!fs.existsSync(imagePath)) {
                throw new Error(`Imagen no existe: ${match.nuevaImagen}`);
            }
            
            // Subir imagen
            console.log(`[${i+1}/${matches.length}] Subiendo: ${match.nuevaImagen.substring(0, 40)}...`);
            const newImageId = await uploadImage(imagePath);
            
            // Actualizar antecedente
            console.log(`  Actualizando antecedente ${match.id}...`);
            await updateAntecedente(match.id, newImageId);
            
            success++;
            console.log(`  ✅ OK (nuevo ID: ${newImageId})`);
            
        } catch (error) {
            console.log(`  ❌ Error: ${error.message}`);
            errors.push({ id: match.id, error: error.message });
        }
        
        // Pequeña pausa para no sobrecargar el servidor
        await new Promise(r => setTimeout(r, 500));
    }
    
    console.log('\n=== RESUMEN ===');
    console.log(`Exitosos: ${success}`);
    console.log(`Errores: ${errors.length}`);
    
    if (errors.length > 0) {
        fs.writeFileSync('/tmp/upload_errors.json', JSON.stringify(errors, null, 2));
        console.log('Errores guardados en /tmp/upload_errors.json');
    }
}

main().catch(console.error);
