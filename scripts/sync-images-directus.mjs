#!/usr/bin/env node

/**
 * Script para sincronizar imágenes generadas con Directus
 * 1. Sube imágenes a Directus Files
 * 2. Asigna imágenes únicas a cada antecedente basado en ID hash
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración Directus
const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://23.105.176.45:8055';
const DIRECTUS_TOKEN = process.env.DIRECTUS_STATIC_TOKEN || 'k6P8LAY8_x_y1miB_KTlWnysCnx2Abky';
const DRY_RUN = process.argv.includes('--dry-run');

// Array de imágenes generadas (30 total)
const GENERATED_IMAGES = [
  'cctv_control_room_1768353676992.png',
  'cctv_outdoor_dome_1768387262497.png',
  'cctv_ptz_camera_1768387278707.png',
  'cctv_video_wall_1768387292977.png',
  'access_control_biometric_1768353716905.png',
  'access_facial_scan_1768387321512.png',
  'access_smart_lock_1768387335317.png',
  'access_turnstile_1768387308294.png',
  'fire_detection_system_1768353731995.png',
  'fire_control_panel_1768387370236.png',
  'fire_smoke_detector_1768387384551.png',
  'fire_sprinkler_system_1768387402715.png',
  'fire_safety_industrial_sensors_1768237918477.png',
  'datacenter_corridor_1768387417712.png',
  'datacenter_technician_1768387433623.png',
  'networking_datacenter_racks_1768353647752.png',
  'network_rack_cabling_1768387461455.png',
  'structured_cabling_patch_1768353747209.png',
  'fiber_optic_installation_1768353661641.png',
  'fiber_splicing_1768387509213.png',
  'fiber_cable_tray_1768387523814.png',
  'fiber_outdoor_cabinet_1768387538667.png',
  'telecom_radio_tower_1768353762111.png',
  'telecom_antenna_array_1768387553993.png',
  'telecom_microwave_dish_1768387570110.png',
  'telecom_equipment_room_1768387584754.png',
  'bodega_tech_overlay_1768237851113.png',
  'gobierno_digital_overlay_1768237887931.png',
  'server_room_maintenance_tech_1768237985687.png',
  'security_camera_analytics_overlay_1768237955796.png'
];

// Función para hacer peticiones HTTP
async function makeRequest(endpoint, options = {}) {
  const url = `${DIRECTUS_URL}${endpoint}`;
  const defaultHeaders = {
    'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
    'Accept': 'application/json'
  };

  const response = await fetch(url, {
    ...options,
    headers: { ...defaultHeaders, ...options.headers }
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Request failed: ${response.status} - ${errorBody}`);
  }

  return response.json();
}

// Función para subir una imagen a Directus
async function uploadImage(imagePath) {
  const filename = path.basename(imagePath);
  console.log(`📤 Subiendo ${filename}...`);

  if (DRY_RUN) {
    console.log(`   [DRY-RUN] Se subiría ${filename}`);
    return { id: `dry-run-${filename}`, filename };
  }

  const fileBuffer = fs.readFileSync(imagePath);
  const blob = new Blob([fileBuffer], { type: 'image/png' });

  const formData = new FormData();
  formData.append('file', blob, filename);
  formData.append('title', filename.replace(/_\d+\.png$/, '').replace(/_/g, ' '));
  formData.append('folder', null); // Root folder

  const response = await fetch(`${DIRECTUS_URL}/files`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DIRECTUS_TOKEN}`
    },
    body: formData
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Upload failed for ${filename}: ${response.status} - ${errorBody}`);
  }

  const data = await response.json();
  console.log(`   ✅ Subido: ${filename} -> ID: ${data.data.id}`);
  return { id: data.data.id, filename };
}

// Función para obtener antecedentes de Directus
async function getAntecedentes() {
  console.log('📋 Obteniendo antecedentes de Directus...');
  
  const response = await makeRequest('/items/Antecedentes?limit=-1&fields=id,Titulo,Imagen');
  console.log(`   ✅ ${response.data.length} antecedentes encontrados`);
  return response.data;
}

// Función para actualizar imagen de antecedente
async function updateAntecedente(id, imageId) {
  if (DRY_RUN) {
    console.log(`   [DRY-RUN] Se actualizaría antecedente ${id} con imagen ${imageId}`);
    return true;
  }

  try {
    await makeRequest(`/items/Antecedentes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ Imagen: imageId })
    });
    return true;
  } catch (error) {
    console.error(`   ❌ Error actualizando antecedente ${id}: ${error.message}`);
    return false;
  }
}

// Función para calcular hash del ID
function hashId(id) {
  let numericId = 0;
  if (typeof id === 'number') {
    numericId = id;
  } else if (typeof id === 'string') {
    if (id.includes('-')) {
      // UUID - suma de caracteres
      numericId = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    } else {
      numericId = parseInt(id, 10) || 0;
    }
  }
  return Math.abs(numericId);
}

// Función principal
async function main() {
  console.log('🚀 Sincronización de Imágenes con Directus');
  console.log('==========================================');
  console.log(`   URL: ${DIRECTUS_URL}`);
  console.log(`   Modo: ${DRY_RUN ? 'DRY-RUN (simulación)' : 'PRODUCCIÓN'}`);
  console.log('');

  try {
    // 1. Verificar imágenes locales
    const imagesDir = path.join(__dirname, '..', 'public', 'images', 'generated');
    const existingImages = [];
    
    console.log('📁 Verificando imágenes locales...');
    for (const imgName of GENERATED_IMAGES) {
      const imgPath = path.join(imagesDir, imgName);
      if (fs.existsSync(imgPath)) {
        existingImages.push({ filename: imgName, path: imgPath });
      } else {
        console.log(`   ⚠️ No encontrada: ${imgName}`);
      }
    }
    console.log(`   ✅ ${existingImages.length}/${GENERATED_IMAGES.length} imágenes disponibles`);
    console.log('');

    // 2. Subir imágenes a Directus
    console.log('📤 Subiendo imágenes a Directus...');
    const uploadedImages = [];
    for (const img of existingImages) {
      try {
        const result = await uploadImage(img.path);
        uploadedImages.push(result);
      } catch (error) {
        console.error(`   ❌ Error con ${img.filename}: ${error.message}`);
      }
    }
    console.log(`   ✅ ${uploadedImages.length} imágenes subidas`);
    console.log('');

    // 3. Obtener antecedentes
    const antecedentes = await getAntecedentes();
    console.log('');

    // 4. Asignar imágenes basadas en hash del ID
    console.log('🔄 Asignando imágenes a antecedentes...');
    let updated = 0;
    let errors = 0;

    for (const ante of antecedentes) {
      const hash = hashId(ante.id);
      const imageIndex = hash % uploadedImages.length;
      const selectedImage = uploadedImages[imageIndex];

      console.log(`   Antecedente ${ante.id} (hash: ${hash}) -> Imagen: ${selectedImage.filename}`);
      
      const success = await updateAntecedente(ante.id, selectedImage.id);
      if (success) {
        updated++;
      } else {
        errors++;
      }
    }

    console.log('');
    console.log('📊 RESUMEN');
    console.log('==========================================');
    console.log(`   Imágenes subidas: ${uploadedImages.length}`);
    console.log(`   Antecedentes actualizados: ${updated}`);
    console.log(`   Errores: ${errors}`);
    
    if (DRY_RUN) {
      console.log('');
      console.log('💡 Ejecuta sin --dry-run para aplicar cambios reales');
    }

  } catch (error) {
    console.error('❌ Error fatal:', error.message);
    process.exit(1);
  }
}

// Ejecutar
main();
