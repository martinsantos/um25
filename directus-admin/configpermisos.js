import axios from 'axios';
import { createConnection } from 'mysql2/promise'; // Añade esta línea al inicio


const DIRECTUS_URL = 'http://localhost:8055';
// Reemplaza ESTE_TOKEN con tu token real de administrador
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImI1OGZhZTc3LWU0ZmItNDI2MC04MmMxLWFmYzJiYzExMjNmMSIsInJvbGUiOiJhNWNkZWE3ZC1mMGViLTQ0MmItODdiNi0yMGM3NzU5YzY3MGUiLCJhcHBfYWNjZXNzIjp0cnVlLCJhZG1pbl9hY2Nlc3MiOnRydWUsImlhdCI6MTc0MjkzMzg0OSwiZXhwIjoxNzQyOTM0NzQ5LCJpc3MiOiJkaXJlY3R1cyJ9._Qb5CH41coymfbv_PJ27tIS2eRNKl4USbpsBD4hh3uA';
const DB_CONFIG = {
  host: 'localhost',
  user: 'directus_user',
  password: 'tu_contraseña',
  database: 'directus'
};

async function fixPermissions() {
  try {
    // Intento 1: Usando la API REST
    const headers = {
      Authorization: `Bearer ${ADMIN_TOKEN}`,
      'Content-Type': 'application/json'
    };

    console.log('🔍 Verificando componentes via API...');
    await axios.get(`${DIRECTUS_URL}/collections/antecedentes`, { headers });
    await axios.get(`${DIRECTUS_URL}/roles/a5cdea7d-f0eb-442b-87b6-20c7759c670e`, { headers });

    console.log('⚡ Intentando crear permiso via API...');
    try {
      const response = await axios.post(`${DIRECTUS_URL}/permissions`, {
        collection: 'antecedentes',
        role: 'a5cdea7d-f0eb-442b-87b6-20c7759c670e',
        action: 'read',
        fields: ['*'],
        policy: 'full'
      }, { headers });
      console.log('✅ Permiso creado via API! ID:', response.data.data.id);
      return;
    } catch (apiError) {
      console.warn('⚠️ Falló la API, intentando via SQL directo...');
    }

    // Intento 2: Conexión directa a la base de datos
    const connection = await createConnection(DB_CONFIG);
    await connection.execute(`
      INSERT INTO directus_permissions 
      (collection, role, action, fields, policy, permissions, validation) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['antecedentes', 'a5cdea7d-f0eb-442b-87b6-20c7759c670e', 'read', '*', 'full', '{}', '{}']
    );
    console.log('✅ Permiso creado directamente en la base de datos!');
    await connection.end();

  } catch (error) {
    console.error('💥 Error crítico:', error.message);
    console.log('\n🔧 Última opción:');
    console.log('1. Ve a http://localhost:8055/admin/settings/roles');
    console.log('2. Edita el rol "Public"');
    console.log('3. Crea manualmente el permiso para "antecedentes"');
    process.exit(1);
  }
}

await fixPermissions();