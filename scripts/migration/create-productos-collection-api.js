#!/usr/bin/env node
/**
 * Create Productos Collection via API
 * Uses Directus REST API to create the collection programmatically
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const DIRECTUS_URL = process.env.PUBLIC_DIRECTUS_URL || 'http://localhost:8055';
const DIRECTUS_TOKEN = process.env.DIRECTUS_STATIC_TOKEN || process.env.PUBLIC_DIRECTUS_TOKEN;

async function createCollection() {
  console.log('🔧 Creando colección "productos" via API...\n');

  if (!DIRECTUS_TOKEN) {
    console.error('❌ Token no disponible');
    process.exit(1);
  }

  try {
    // 1. Crear la colección
    console.log('1️⃣  Creando colección base...');

    const collectionResponse = await fetch(`${DIRECTUS_URL}/collections`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        collection: 'productos',
        meta: {
          icon: 'inventory_2',
          note: 'Productos de servicios',
          display_template: '{{titulo}}',
          hidden: false,
          singleton: false,
          sort_field: 'orden'
        },
        schema: {
          name: 'productos'
        }
      })
    });

    if (!collectionResponse.ok) {
      const error = await collectionResponse.text();
      throw new Error(`Failed to create collection: ${error}`);
    }

    console.log('✅ Colección creada\n');

    // 2. Crear campos
    console.log('2️⃣  Creando campos...');

    const fields = [
      // servicio_id - M2O relation
      {
        field: 'servicio_id',
        type: 'integer',
        meta: {
          interface: 'select-dropdown-m2o',
          special: ['m2o'],
          required: true,
          options: {
            template: '{{id}} - {{Titulo}}'
          }
        },
        schema: {
          is_nullable: false
        }
      },
      // titulo
      {
        field: 'titulo',
        type: 'string',
        meta: {
          interface: 'input',
          required: true,
          width: 'full'
        },
        schema: {
          max_length: 255,
          is_nullable: false
        }
      },
      // descripcion
      {
        field: 'descripcion',
        type: 'text',
        meta: {
          interface: 'input-multiline',
          width: 'full'
        }
      },
      // imagen - File relation
      {
        field: 'imagen',
        type: 'uuid',
        meta: {
          interface: 'file-image',
          special: ['file'],
          width: 'half'
        }
      },
      // features - JSON
      {
        field: 'features',
        type: 'json',
        meta: {
          interface: 'list',
          width: 'full'
        }
      },
      // destacado
      {
        field: 'destacado',
        type: 'text',
        meta: {
          interface: 'input-multiline',
          width: 'full'
        }
      },
      // orden
      {
        field: 'orden',
        type: 'integer',
        meta: {
          interface: 'input',
          width: 'half'
        },
        schema: {
          default_value: 0
        }
      },
      // status
      {
        field: 'status',
        type: 'string',
        meta: {
          interface: 'select-dropdown',
          width: 'half',
          options: {
            choices: [
              { text: 'Publicado', value: 'published' },
              { text: 'Borrador', value: 'draft' }
            ]
          }
        },
        schema: {
          default_value: 'published',
          is_nullable: false
        }
      }
    ];

    for (const field of fields) {
      const fieldResponse = await fetch(`${DIRECTUS_URL}/fields/productos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(field)
      });

      if (!fieldResponse.ok) {
        const error = await fieldResponse.text();
        console.error(`❌ Error creando campo ${field.field}:`, error);
      } else {
        console.log(`✅ Campo creado: ${field.field}`);
      }
    }

    // 3. Crear relación con Servicios
    console.log('\n3️⃣  Creando relación M2O con Servicios...');

    const relationResponse = await fetch(`${DIRECTUS_URL}/relations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        collection: 'productos',
        field: 'servicio_id',
        related_collection: 'Servicios',
        meta: {
          one_field: 'productos_relacion',
          sort_field: 'orden'
        },
        schema: {
          on_delete: 'CASCADE'
        }
      })
    });

    if (!relationResponse.ok) {
      const error = await relationResponse.text();
      console.log(`⚠️  Relación: ${error}`);
    } else {
      console.log('✅ Relación creada');
    }

    console.log('\n✅ Colección "productos" creada exitosamente\n');
    console.log('📋 Siguiente paso: node scripts/migration/upload-product-images.js\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

createCollection();
