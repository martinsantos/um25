#!/usr/bin/env node
/**
 * Script to upload images to Directus and create service records
 * Target: Production Directus at admin.ultimamilla.com.ar
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import FormData from 'form-data';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const DIRECTUS_URL = 'https://admin.ultimamilla.com.ar';
const DIRECTUS_TOKEN = 'k6P8LAY8_x_y1miB_KTlWnysCnx2Abky';
const IMAGES_DIR = path.join(__dirname, '../serviciosimg/limpias');

// Image mappings
const HERO_IMAGES = {
  101: 'redinfraestructura.png',
  102: 'seguridad.png',
  103: null, // No hay hero específico para telecomunicaciones
  104: 'desarrollo.png',
  105: 'soportetic.png',
  106: 'consultoria.png'
};

const PRODUCT_IMAGES = {
  // Unidad 1: Infraestructura
  '1.1': 'Fibra Óptica',
  '1.2': 'Patch Panel CAT6A',
  '1.3': 'Cableado Estructurado',
  '1.4': 'Switch Empresarial',
  '1.5': 'Data Center / Rack',
  '1.6': 'Radioenlace',
  '1.7': 'Certificador Fluke',
  '1.8': 'ODF - Distribuidor Fibra',
  // Unidad 2: Seguridad
  '2.1': 'Cámara CCTV Domo',
  '2.2': 'Cámara CCTV Bullet',
  '2.3': 'Detector de Humo',
  '2.4': 'Panel Central SDI',
  '2.5': 'Estación Manual',
  '2.6': 'Lector Biométrico',
  '2.7': 'NVR Grabador',
  '2.8': 'Sensor PIR',
  // Unidad 3: Telecomunicaciones
  '3.1': 'Teléfono IP',
  '3.2': 'Videoportero IP',
  '3.3': 'Monitor Videoportero',
  '3.4': 'Access Point WiFi',
  '3.5': 'Headset Profesional',
  '3.6': 'Central IP PBX',
  // Unidad 4: Desarrollo
  '4.1': 'Aplicaciones Web',
  '4.2': 'Apps Móviles',
  '4.3': 'Trazabilidad QR',
  '4.4': 'Cloud Services',
  '4.5': 'ERP a Medida',
  '4.6': 'APIs e Integraciones',
  // Unidad 5: Soporte
  '5.1': 'Soporte en Sitio',
  '5.2': 'Diagnóstico y Reparación',
  '5.3': 'Monitoreo NOC',
  '5.4': 'Mesa de Ayuda',
  '5.5': 'Backup y Recuperación',
  // Unidad 6: Consultoría
  '6.1': 'Transformación Digital',
  '6.2': 'Gestión Licitaciones',
  '6.3': 'Arquitectura IT',
  '6.4': 'Auditoría IT',
  '6.5': 'Capacitación'
};

async function uploadImage(filePath, title) {
  const form = new FormData();
  form.append('title', title);
  form.append('file', fs.createReadStream(filePath));
  
  try {
    const response = await fetch(`${DIRECTUS_URL}/files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
        ...form.getHeaders()
      },
      body: form
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error(`Error uploading ${title}:`, error);
      return null;
    }
    
    const data = await response.json();
    console.log(`✅ Uploaded: ${title} -> ${data.data.id}`);
    return data.data.id;
  } catch (error) {
    console.error(`Error uploading ${title}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 Starting image upload to Directus...\n');
  
  const uploadedImages = {
    heroes: {},
    products: {}
  };
  
  // Upload hero images
  console.log('📸 Uploading hero images...\n');
  for (const [serviceId, filename] of Object.entries(HERO_IMAGES)) {
    if (!filename) continue;
    
    const filePath = path.join(IMAGES_DIR, filename);
    if (fs.existsSync(filePath)) {
      const uuid = await uploadImage(filePath, `Hero - Servicio ${serviceId}`);
      if (uuid) {
        uploadedImages.heroes[serviceId] = uuid;
      }
    } else {
      console.log(`⚠️ File not found: ${filename}`);
    }
  }
  
  // Upload product images
  console.log('\n📸 Uploading product images...\n');
  for (const [code, title] of Object.entries(PRODUCT_IMAGES)) {
    const filename = `${code}.png`;
    const filePath = path.join(IMAGES_DIR, filename);
    
    if (fs.existsSync(filePath)) {
      const uuid = await uploadImage(filePath, title);
      if (uuid) {
        uploadedImages.products[code] = uuid;
      }
    } else {
      console.log(`⚠️ File not found: ${filename}`);
    }
  }
  
  // Save results
  const outputPath = path.join(__dirname, 'uploaded-images.json');
  fs.writeFileSync(outputPath, JSON.stringify(uploadedImages, null, 2));
  console.log(`\n📁 Results saved to: ${outputPath}`);
  
  console.log('\n✅ Upload complete!');
  console.log(`   Heroes: ${Object.keys(uploadedImages.heroes).length}`);
  console.log(`   Products: ${Object.keys(uploadedImages.products).length}`);
}

main().catch(console.error);
