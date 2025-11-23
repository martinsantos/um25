const axios = require('axios');
const fs = require('fs');

const DIRECTUS_URL = 'https://umbot.com.ar';
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'd1r3ctu5';

async function authenticate() {
  try {
    const response = await axios.post(`${DIRECTUS_URL}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    return response.data.data.access_token;
  } catch (error) {
    console.error('Error en autenticación:', error.response?.data || error.message);
    throw error;
  }
}

async function createCollection(token, collection) {
  try {
    const response = await axios.post(
      `${DIRECTUS_URL}/collections`,
      collection,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    console.log(`Colección ${collection.collection} creada`);
    return response.data.data;
  } catch (error) {
    console.error(`Error creando colección ${collection.collection}:`, error.response?.data || error.message);
    throw error;
  }
}

async function createField(token, collection, field) {
  try {
    const response = await axios.post(
      `${DIRECTUS_URL}/fields/${collection}`,
      field,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    console.log(`Campo ${field.field} creado en ${collection}`);
    return response.data.data;
  } catch (error) {
    console.error(`Error creando campo ${field.field}:`, error.response?.data || error.message);
    throw error;
  }
}

async function main() {
  try {
    const token = await authenticate();

    // Crear colección Antecedentes
    await createCollection(token, {
      collection: 'antecedentes',
      schema: {
        name: 'antecedentes',
        comment: null
      },
      meta: {
        sort_field: 'id',
        archive_field: 'status',
        archive_value: 'archived',
        unarchive_value: 'draft',
        singleton: false,
        collection: 'antecedentes',
        group: null,
        hidden: false,
        icon: 'folder',
        item_duplication_fields: null,
        note: null,
        translations: null,
        display_template: null
      }
    });

    // Crear campos para Antecedentes
    const antecedentesFields = [
      {
        field: 'id',
        type: 'integer',
        meta: {
          hidden: false,
          interface: 'input',
          readonly: true,
          special: null,
          width: 'full'
        },
        schema: {
          is_primary_key: true,
          is_nullable: false
        }
      },
      {
        field: 'Titulo',
        type: 'string',
        meta: {
          hidden: false,
          interface: 'input',
          special: null,
          width: 'full'
        },
        schema: {
          is_nullable: false
        }
      },
      {
        field: 'Descripcion',
        type: 'text',
        meta: {
          hidden: false,
          interface: 'input-multiline',
          special: null,
          width: 'full'
        },
        schema: {
          is_nullable: true
        }
      },
      {
        field: 'Imagen',
        type: 'uuid',
        meta: {
          hidden: false,
          interface: 'file-image',
          special: ['file'],
          width: 'full'
        },
        schema: {
          is_nullable: true
        }
      },
      {
        field: 'Cliente',
        type: 'string',
        meta: {
          hidden: false,
          interface: 'input',
          special: null,
          width: 'full'
        },
        schema: {
          is_nullable: true
        }
      },
      {
        field: 'Area',
        type: 'string',
        meta: {
          hidden: false,
          interface: 'input',
          special: null,
          width: 'full'
        },
        schema: {
          is_nullable: true
        }
      },
      {
        field: 'Fecha',
        type: 'date',
        meta: {
          hidden: false,
          interface: 'datetime',
          special: null,
          width: 'full'
        },
        schema: {
          is_nullable: true
        }
      },
      {
        field: 'status',
        type: 'string',
        meta: {
          hidden: false,
          interface: 'select-dropdown',
          options: {
            choices: [
              { text: 'Published', value: 'published' },
              { text: 'Draft', value: 'draft' },
              { text: 'Archived', value: 'archived' }
            ]
          },
          special: null,
          width: 'full'
        },
        schema: {
          default_value: 'published',
          is_nullable: false
        }
      }
    ];

    for (const field of antecedentesFields) {
      await createField(token, 'antecedentes', field);
    }

    console.log('Configuración completada exitosamente');
  } catch (error) {
    console.error('Error en la configuración:', error);
    process.exit(1);
  }
}

main(); 