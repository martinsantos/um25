#!/usr/bin/env node
/**
 * Create Productos Collection - Crea colección separada para productos
 *
 * Este script crea una nueva colección "productos" en Directus con:
 * - Relación M2O con Servicios (servicio_id)
 * - Campo para imagen como UUID (relación con directus_files)
 * - Campos JSON para features
 * - Ordenamiento
 * - Status de publicación
 */

import { createDirectus, rest } from '@directus/sdk';

const DIRECTUS_URL = process.env.PUBLIC_DIRECTUS_URL || 'http://localhost:8055';
const DIRECTUS_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN || '';

const directus = createDirectus(DIRECTUS_URL).with(rest());

async function createProductosCollection() {
  console.log('🔧 Creando colección "productos" en Directus...\n');
  console.log('━'.repeat(80));

  try {
    // IMPORTANTE: Directus SDK no tiene helper para crear colecciones
    // Necesitamos usar la API REST directamente

    console.log('\n⚠️  NOTA IMPORTANTE:');
    console.log('Este script requiere crear la colección manualmente en Directus Admin');
    console.log('o usar la API REST con autenticación de admin.\n');

    console.log('━'.repeat(80));
    console.log('📋 SCHEMA DE LA COLECCIÓN "productos"');
    console.log('━'.repeat(80));

    const schema = {
      collection: 'productos',
      meta: {
        collection: 'productos',
        icon: 'inventory_2',
        note: 'Productos de servicios - Migrado desde fallback JS',
        display_template: '{{titulo}} (Servicio {{servicio_id}})',
        hidden: false,
        singleton: false,
        translations: null,
        archive_field: null,
        archive_value: null,
        unarchive_value: null,
        archive_app_filter: true,
        sort_field: 'orden'
      },
      schema: {
        name: 'productos'
      },
      fields: [
        {
          field: 'id',
          type: 'integer',
          meta: {
            hidden: true,
            interface: 'input',
            readonly: true
          },
          schema: {
            is_primary_key: true,
            has_auto_increment: true,
            is_nullable: false
          }
        },
        {
          field: 'servicio_id',
          type: 'integer',
          meta: {
            interface: 'select-dropdown-m2o',
            display: 'related-values',
            display_options: {
              template: '{{id}} - {{Titulo}}'
            },
            options: {
              template: '{{id}} - {{Titulo}}'
            },
            special: ['m2o'],
            required: true,
            note: 'Relación con tabla Servicios'
          },
          schema: {
            is_nullable: false,
            foreign_key_table: 'Servicios',
            foreign_key_column: 'id'
          }
        },
        {
          field: 'titulo',
          type: 'string',
          meta: {
            interface: 'input',
            width: 'full',
            required: true,
            note: 'Nombre del producto'
          },
          schema: {
            max_length: 255,
            is_nullable: false
          }
        },
        {
          field: 'descripcion',
          type: 'text',
          meta: {
            interface: 'input-multiline',
            width: 'full',
            note: 'Descripción del producto'
          },
          schema: {
            is_nullable: true
          }
        },
        {
          field: 'imagen',
          type: 'uuid',
          meta: {
            interface: 'file-image',
            special: ['file'],
            width: 'half',
            note: 'Imagen del producto (Directus asset)'
          },
          schema: {
            is_nullable: true,
            foreign_key_table: 'directus_files',
            foreign_key_column: 'id'
          }
        },
        {
          field: 'features',
          type: 'json',
          meta: {
            interface: 'list',
            width: 'full',
            note: 'Lista de características (array de strings)'
          },
          schema: {
            is_nullable: true
          }
        },
        {
          field: 'destacado',
          type: 'text',
          meta: {
            interface: 'input-multiline',
            width: 'full',
            note: 'Texto destacado del producto'
          },
          schema: {
            is_nullable: true
          }
        },
        {
          field: 'orden',
          type: 'integer',
          meta: {
            interface: 'input',
            width: 'half',
            note: 'Orden de visualización del producto'
          },
          schema: {
            is_nullable: true,
            default_value: 0
          }
        },
        {
          field: 'status',
          type: 'string',
          meta: {
            interface: 'select-dropdown',
            width: 'half',
            options: {
              choices: [
                { text: 'Publicado', value: 'published' },
                { text: 'Borrador', value: 'draft' },
                { text: 'Archivado', value: 'archived' }
              ]
            }
          },
          schema: {
            default_value: 'published',
            max_length: 255,
            is_nullable: false
          }
        },
        {
          field: 'date_created',
          type: 'timestamp',
          meta: {
            special: ['date-created'],
            interface: 'datetime',
            readonly: true,
            hidden: true,
            width: 'half'
          },
          schema: {
            is_nullable: true
          }
        },
        {
          field: 'date_updated',
          type: 'timestamp',
          meta: {
            special: ['date-updated'],
            interface: 'datetime',
            readonly: true,
            hidden: true,
            width: 'half'
          },
          schema: {
            is_nullable: true
          }
        }
      ]
    };

    console.log('\nColección: productos');
    console.log('Icono: inventory_2');
    console.log('Sort field: orden\n');

    console.log('Campos:');
    schema.fields.forEach(field => {
      const required = field.meta?.required ? ' (REQUERIDO)' : '';
      const type = field.schema?.foreign_key_table
        ? `${field.type} → ${field.schema.foreign_key_table}`
        : field.type;
      console.log(`  - ${field.field}: ${type}${required}`);
    });

    console.log('\n━'.repeat(80));
    console.log('🔧 OPCIONES DE CREACIÓN');
    console.log('━'.repeat(80));

    console.log('\n1. MANUAL - Directus Admin Panel (RECOMENDADO)');
    console.log('   a) Abrir: https://admin.ultimamilla.com.ar');
    console.log('   b) Settings → Data Model → Create Collection');
    console.log('   c) Nombre: "productos"');
    console.log('   d) Agregar campos según schema arriba');
    console.log('   e) Crear relación M2O con Servicios (servicio_id)');

    console.log('\n2. API REST - Usando curl');
    console.log('   Requiere token de admin en variable DIRECTUS_ADMIN_TOKEN\n');

    if (!DIRECTUS_TOKEN) {
      console.log('   ⚠️  DIRECTUS_ADMIN_TOKEN no configurado');
      console.log('   Para usar API, configurar variable de entorno primero\n');
    } else {
      console.log('   ✓ Token configurado, se puede usar API\n');

      const apiUrl = `${DIRECTUS_URL}/collections`;
      console.log(`   POST ${apiUrl}`);
      console.log('   Authorization: Bearer $DIRECTUS_ADMIN_TOKEN');
      console.log('   Content-Type: application/json\n');

      console.log('   Body (schema JSON disponible arriba)\n');
    }

    console.log('\n3. SCRIPT SQL - Directamente en PostgreSQL');
    console.log('   ssh ultimamilla');
    console.log('   docker exec -it umbot-postgres-prod psql -U directus directus');
    console.log('   Luego ejecutar comandos CREATE TABLE manualmente\n');

    console.log('━'.repeat(80));
    console.log('\n💡 RECOMENDACIÓN:');
    console.log('   Usar Directus Admin Panel (opción 1) por simplicidad');
    console.log('   y para aprovechar validaciones de Directus.\n');

    console.log('━'.repeat(80));
    console.log('\n📄 Schema JSON guardado en:');

    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const outputPath = path.join(__dirname, '../../scratchpad/productos-collection-schema.json');
    const outputDir = path.dirname(outputPath);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(schema, null, 2));
    console.log(`   ${outputPath}\n`);

    console.log('━'.repeat(80));
    console.log('\n✅ SIGUIENTE PASO:');
    console.log('   1. Crear la colección manualmente en Directus Admin');
    console.log('   2. Verificar que se creó correctamente');
    console.log('   3. Ejecutar: node scripts/migration/upload-product-images.js\n');

    return schema;

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Ejecutar
createProductosCollection()
  .then(() => {
    console.log('✅ Proceso completado\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
