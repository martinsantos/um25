import { createDirectus, rest, staticToken, createField, deleteField, createRelation } from '@directus/sdk';

const DIRECTUS_URL = 'https://admin.ultimamilla.com.ar';
const STATIC_TOKEN = 'k6P8LAY8_x_y1miB_KTlWnysCnx2Abky';

const client = createDirectus(DIRECTUS_URL)
    .with(rest())
    .with(staticToken(STATIC_TOKEN));

async function fixHeroField() {
  try {
    console.log('👷 Fixing Hero_Home imagen field...');

    // 1. Delete the existing field (this will clear current data in that field!)
    try {
      await client.request(deleteField('Hero_Home', 'imagen'));
      console.log('✅ Deleted old imagen field.');
    } catch (e) {
      console.log('ℹ️ Field might not exist or failed to delete:', e.message);
    }

    // 2. Re-create the field with proper meta
    await client.request(createField('Hero_Home', {
      field: 'imagen',
      type: 'uuid',
      meta: {
        interface: 'file',
        special: ['file'],
        width: 'full'
      },
      schema: {
        is_nullable: true
      }
    }));
    console.log('✅ Re-created imagen field with proper meta.');

    // 3. Create the relationship explicitly
    try {
      await client.request(createRelation({
        collection: 'Hero_Home',
        field: 'imagen',
        related_collection: 'directus_files',
        schema: {
           on_delete: 'SET NULL'
        },
        meta: {
          one_allowed_collections: ['directus_files']
        }
      }));
      console.log('✅ Created relationship to directus_files.');
    } catch (e) {
      console.log('ℹ️ Relationship might already exist or failed:', e.message);
    }

    console.log('🚀 Fix applied successfully. please refresh Directus Admin.');
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  }
}

fixHeroField();
