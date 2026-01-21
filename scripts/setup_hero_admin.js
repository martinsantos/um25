import { createDirectus, rest, staticToken, createCollection, createField } from '@directus/sdk';

const DIRECTUS_URL = 'http://localhost:8055';
const STATIC_TOKEN = 'k6P8LAY8_x_y1miB_KTlWnysCnx2Abky';
const PASSWORD = 'UmbotAdmin2025!';

const client = createDirectus(DIRECTUS_URL)
    .with(rest())
    .with(staticToken(STATIC_TOKEN));

async function setupHeroAdmin() {
  try {
    console.log('✅ Started setup with Token.');

    // 1. Create Collection
    try {
      await client.request(createCollection({
        collection: 'Hero_Home',
        meta: {
          display_template: '{{titulo}}',
          hidden: false,
          icon: 'home',
          singleton: false,
          translations: [
            { language: 'en-US', translation: 'Home Hero' },
            { language: 'es-ES', translation: 'Hero Home' }
          ]
        },
        schema: {}
      }));
      console.log('✅ Collection Hero_Home created.');
    } catch (e) {
      const msg = e.message || (e.errors && e.errors[0] && e.errors[0].message) || "";
      if (msg.includes('already exists')) {
        console.log('ℹ️ Collection Hero_Home already exists.');
      } else {
        console.error('❌ Error creating collection:', e);
        throw e;
      }
    }

    // 2. Create/Re-create Fields
    const fields = [
      {
        field: 'status',
        type: 'string',
        meta: {
          interface: 'select-dropdown',
          options: {
            choices: [
              { text: 'Published', value: 'published' },
              { text: 'Draft', value: 'draft' },
              { text: 'Archived', value: 'archived' }
            ]
          },
          width: 'half'
        },
        schema: { default_value: 'published' }
      },
      {
        field: 'titulo',
        type: 'string',
        meta: {
          interface: 'input',
          width: 'half'
        }
      },
      {
        field: 'orden',
        type: 'integer',
        meta: {
          interface: 'input',
          width: 'half'
        }
      },
      {
        field: 'imagen',
        type: 'uuid',
        schema: {
          foreign_key_table: 'directus_files',
          foreign_key_column: 'id',
        },
        meta: {
          interface: 'file',
          width: 'full',
          special: ['file']
        }
      }
    ];

    for (const field of fields) {
      try {
        await client.request(createField('Hero_Home', field));
        console.log(`✅ Field ${field.field} created.`);
      } catch (e) {
        const msg = e.message || (e.errors && e.errors[0] && e.errors[0].message) || "";
        if (msg.includes('already exists')) {
          console.log(`ℹ️ Field ${field.field} already exists. Attempting to update instead...`);
        } else {
          console.error(`❌ Error creating field ${field.field}:`, msg);
        }
      }
    }

    console.log('> Finalizing setup...');
    console.log('🚀 Setup complete.');
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  }
}

setupHeroAdmin();
