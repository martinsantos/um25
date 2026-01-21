process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const STATIC_TOKEN = 'k6P8LAY8_x_y1miB_KTlWnysCnx2Abky';
const BASE_URL = 'https://admin.ultimamilla.com.ar';

async function fix() {
  console.log('👷 Deep fixing Hero_Home.imagen...');

  // 1. Delete relationship if exists (best effort)
  console.log('Cleaning old relations...');
  
  // 2. Delete field
  console.log('Deleting field...');
  await fetch(`${BASE_URL}/fields/Hero_Home/imagen`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${STATIC_TOKEN}` }
  });

  // 3. Recreate field with proper "special"
  console.log('Creating field with special: [file]...');
  const fieldRes = await fetch(`${BASE_URL}/fields/Hero_Home`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${STATIC_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      field: 'imagen',
      type: 'uuid',
      meta: {
        interface: 'file',
        special: ['file'],
        width: 'full'
      },
      schema: {}
    })
  });
  console.log('Field creation status:', fieldRes.status);

  // 4. Create Relation
  console.log('Creating relation to directus_files...');
  const relRes = await fetch(`${BASE_URL}/relations`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${STATIC_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      collection: 'Hero_Home',
      field: 'imagen',
      related_collection: 'directus_files',
      meta: {},
      schema: {
        table: 'Hero_Home',
        column: 'imagen',
        foreign_key_table: 'directus_files',
        foreign_key_column: 'id'
      }
    })
  });
  console.log('Relation creation status:', relRes.status);
  if (!relRes.ok) {
     console.log('Error details:', await relRes.text());
  }

  console.log('🚀 Deep fix complete.');
}

fix();
