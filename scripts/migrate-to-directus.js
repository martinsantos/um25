#!/usr/bin/env node

/**
 * Script para migrar datos de antecedentes y servicios a Directus
 * Procesa archivos JSON y los importa a las colecciones correspondientes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar configuración de entorno
config({ path: path.join(__dirname, '../.env.migration') });

// Configuración de Directus
const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://localhost:8055';
const DIRECTUS_TOKEN = process.env.DIRECTUS_STATIC_TOKEN || 'k6P8LAY8_x_y1miB_KTlWnysCnx2Abky';
const DRY_RUN = process.env.DRY_RUN === 'true' || process.argv.includes('--dry-run');

// Función para hacer peticiones HTTP
async function makeRequest(url, options = {}) {
  if (DRY_RUN) {
    console.log(`🔍 [DRY RUN] ${options.method || 'GET'} ${url}`);
    if (options.body) {
      console.log(`📄 [DRY RUN] Body: ${options.body.substring(0, 200)}...`);
    }
    return { data: [], meta: { total_count: 0 } };
  }

  const fetch = (await import('node-fetch')).default;
  
  const defaultOptions = {
    headers: {
      'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
      'Content-Type': 'application/json'
    }
  };

  const response = await fetch(url, { ...defaultOptions, ...options });
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${JSON.stringify(data)}`);
  }
  
  return data;
}

// Crear colección en Directus
async function createCollection(collectionName, fields) {
  console.log(`📦 Creando colección: ${collectionName}`);
  
  try {
    // Crear la colección
    await makeRequest(`${DIRECTUS_URL}/collections`, {
      method: 'POST',
      body: JSON.stringify({
        collection: collectionName,
        meta: {
          collection: collectionName,
          icon: 'folder',
          note: `Colección de ${collectionName}`,
          display_template: null,
          hidden: false,
          singleton: false,
          translations: null,
          archive_field: null,
          archive_app_filter: true,
          archive_value: null,
          unarchive_value: null,
          sort_field: null,
          accountability: 'all',
          color: null,
          item_duplication_fields: null,
          sort: null,
          group: null,
          collapse: 'open'
        },
        schema: {
          name: collectionName
        }
      })
    });

    // Crear los campos
    for (const field of fields) {
      console.log(`  ➕ Creando campo: ${field.field}`);
      try {
        await makeRequest(`${DIRECTUS_URL}/fields/${collectionName}`, {
          method: 'POST',
          body: JSON.stringify(field)
        });
      } catch (fieldError) {
        if (!fieldError.message.includes('already exists')) {
          console.error(`  ❌ Error creando campo ${field.field}:`, fieldError.message);
        }
      }
    }

    console.log(`✅ Colección ${collectionName} creada exitosamente`);
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log(`⚠️  Colección ${collectionName} ya existe`);
    } else {
      throw error;
    }
  }
}

// Definir campos para Antecedentes
const antecedenteFields = [
  {
    field: 'id',
    type: 'integer',
    meta: { hidden: true, readonly: true, interface: 'input', special: ['auto-increment'] },
    schema: { is_primary_key: true, has_auto_increment: true }
  },
  {
    field: 'status',
    type: 'string',
    meta: { interface: 'select-dropdown', options: { choices: [{ text: 'Published', value: 'published' }, { text: 'Draft', value: 'draft' }] }, default_value: 'published' },
    schema: { default_value: 'published' }
  },
  {
    field: 'Titulo',
    type: 'string',
    meta: { interface: 'input', required: true },
    schema: { is_nullable: false }
  },
  {
    field: 'Descripcion',
    type: 'text',
    meta: { interface: 'input-multiline' },
    schema: {}
  },
  {
    field: 'Imagen',
    type: 'string',
    meta: { interface: 'input' },
    schema: {}
  },
  {
    field: 'Archivo',
    type: 'string',
    meta: { interface: 'input' },
    schema: {}
  },
  {
    field: 'Fecha',
    type: 'string',
    meta: { interface: 'input' },
    schema: {}
  },
  {
    field: 'Cliente',
    type: 'string',
    meta: { interface: 'input' },
    schema: {}
  },
  {
    field: 'Unidad_de_negocio',
    type: 'string',
    meta: { interface: 'input' },
    schema: {}
  },
  {
    field: 'Presupuesto',
    type: 'string',
    meta: { interface: 'input' },
    schema: {}
  },
  {
    field: 'Presupuesto_original',
    type: 'string',
    meta: { interface: 'input' },
    schema: {}
  },
  {
    field: 'Area',
    type: 'string',
    meta: { interface: 'input' },
    schema: {}
  },
  {
    field: 'Palabras_clave',
    type: 'string',
    meta: { interface: 'input' },
    schema: {}
  }
];

// Definir campos para Servicios
const servicioFields = [
  {
    field: 'id',
    type: 'integer',
    meta: { hidden: true, readonly: true, interface: 'input', special: ['auto-increment'] },
    schema: { is_primary_key: true, has_auto_increment: true }
  },
  {
    field: 'status',
    type: 'string',
    meta: { interface: 'select-dropdown', options: { choices: [{ text: 'Published', value: 'published' }, { text: 'Draft', value: 'draft' }] }, default_value: 'published' },
    schema: { default_value: 'published' }
  },
  {
    field: 'Titulo',
    type: 'string',
    meta: { interface: 'input', required: true },
    schema: { is_nullable: false }
  },
  {
    field: 'Descripcion',
    type: 'text',
    meta: { interface: 'input-multiline' },
    schema: {}
  },
  {
    field: 'Imagen',
    type: 'string',
    meta: { interface: 'input' },
    schema: {}
  },
  {
    field: 'Icono',
    type: 'string',
    meta: { interface: 'input' },
    schema: {}
  },
  {
    field: 'Slug',
    type: 'string',
    meta: { interface: 'input' },
    schema: {}
  },
  {
    field: 'Orden',
    type: 'integer',
    meta: { interface: 'input' },
    schema: {}
  }
];

// Procesar datos de antecedentes
function processAntecedentes(data) {
  return data.filter(item => item.Titulo && item.Titulo.trim() !== '');
}

// Procesar datos de servicios desde CSV-like JSON
function processServicios(data) {
  const servicios = [
    {
      status: 'published',
      Titulo: 'Servicios IT',
      Descripcion: 'Desarrollo web. Servicios web. Desarrollo de software a medida.',
      Imagen: 'servicios-it.jpg',
      Icono: 'settings',
      Slug: 'servicios-it',
      Orden: 1
    },
    {
      status: 'published',
      Titulo: 'Redes de Datos',
      Descripcion: 'Implementación de redes de datos, cableado estructurado y telecomunicaciones.',
      Imagen: 'redes-datos.jpg',
      Icono: 'network_wifi',
      Slug: 'redes-de-datos',
      Orden: 2
    },
    {
      status: 'published',
      Titulo: 'Seguridad Informática',
      Descripcion: 'Sistemas de seguridad informática, detección de incendios y control de acceso.',
      Imagen: 'seguridad-informatica.jpg',
      Icono: 'security',
      Slug: 'seguridad-informatica',
      Orden: 3
    },
    {
      status: 'published',
      Titulo: 'Servicios Gestionados',
      Descripcion: 'Soporte técnico, mantenimiento y gestión de infraestructura IT.',
      Imagen: 'servicios-gestionados.jpg',
      Icono: 'support_agent',
      Slug: 'servicios-gestionados',
      Orden: 4
    },
    {
      status: 'published',
      Titulo: 'Consultoría Tecnológica',
      Descripcion: 'Asesoramiento en transformación digital y arquitectura de sistemas.',
      Imagen: 'consultoria.jpg',
      Icono: 'psychology',
      Slug: 'consultoria-tecnologica',
      Orden: 5
    }
  ];
  
  return servicios;
}

// Importar datos a Directus
async function importData(collectionName, data) {
  console.log(`📥 Importando ${data.length} registros a ${collectionName}`);
  
  const batchSize = 50;
  let imported = 0;
  
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    
    try {
      await makeRequest(`${DIRECTUS_URL}/items/${collectionName}`, {
        method: 'POST',
        body: JSON.stringify(batch)
      });
      
      imported += batch.length;
      console.log(`  ✅ Importados ${imported}/${data.length} registros`);
    } catch (error) {
      console.error(`  ❌ Error importando batch ${i}-${i + batch.length}:`, error.message);
    }
  }
  
  console.log(`🎉 Importación de ${collectionName} completada: ${imported} registros`);
}

// Función principal
async function main() {
  console.log('🚀 Iniciando migración a Directus...');
  console.log(`📍 URL: ${DIRECTUS_URL}`);
  console.log(`🔑 Token: ${DIRECTUS_TOKEN.substring(0, 8)}...`);
  console.log(`🧪 Modo: ${DRY_RUN ? 'DRY RUN' : 'PRODUCCIÓN'}`);
  
  try {
    if (!DRY_RUN) {
      console.log('\n🔍 Verificando conexión a Directus...');
      await makeRequest(`${DIRECTUS_URL}/server/health`);
    } else {
      console.log('\n🔍 [DRY RUN] Saltando verificación de conexión...');
    }
    console.log('✅ Conexión a Directus exitosa\n');

    // Crear colecciones
    await createCollection('Antecedentes', antecedenteFields);
    await createCollection('Servicios', servicioFields);

    console.log('\n📂 Cargando datos desde archivos...');

    // Cargar y procesar antecedentes
    const antecedentesPath = path.join(__dirname, '../migration_data/antev3.json');
    if (fs.existsSync(antecedentesPath)) {
      const antecedentesRaw = JSON.parse(fs.readFileSync(antecedentesPath, 'utf8'));
      const antecedentes = processAntecedentes(antecedentesRaw);
      console.log(`📊 Antecedentes procesados: ${antecedentes.length}`);
      
      if (antecedentes.length > 0) {
        await importData('Antecedentes', antecedentes);
      }
    } else {
      console.log('⚠️  Archivo de antecedentes no encontrado');
    }

    // Cargar y procesar servicios
    const serviciosPath = path.join(__dirname, '../migration_data/servicios.json');
    if (fs.existsSync(serviciosPath)) {
      const serviciosRaw = JSON.parse(fs.readFileSync(serviciosPath, 'utf8'));
      const servicios = processServicios(serviciosRaw);
      console.log(`📊 Servicios procesados: ${servicios.length}`);
      
      if (servicios.length > 0) {
        await importData('Servicios', servicios);
      }
    } else {
      console.log('⚠️  Archivo de servicios no encontrado');
    }

    console.log('\n🎉 Migración completada exitosamente!');
    
    // Verificar datos importados
    console.log('\n📈 Verificando datos importados...');
    try {
      const antecedentesCount = await makeRequest(`${DIRECTUS_URL}/items/Antecedentes?aggregate[count]=*`);
      const serviciosCount = await makeRequest(`${DIRECTUS_URL}/items/Servicios?aggregate[count]=*`);
      
      console.log(`✅ Antecedentes en Directus: ${antecedentesCount.data[0].count}`);
      console.log(`✅ Servicios en Directus: ${serviciosCount.data[0].count}`);
    } catch (error) {
      console.log('⚠️  No se pudo verificar el conteo final');
    }

  } catch (error) {
    console.error('❌ Error durante la migración:', error.message);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('migrate-to-directus.js')) {
  console.log('🚀 Iniciando migración a Directus...');
  main().catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
}
