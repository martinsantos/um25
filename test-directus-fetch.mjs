import fs from 'fs';
import path from 'path';

async function testDirectusData() {
  console.log('🔄 Iniciando prueba DIRECTA con fetch (bypassing module issues)...');

  const DIRECTUS_URL = process.env.DIRECTUS_URL;
  const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;

  console.log(`📡 URL: ${DIRECTUS_URL}`);

  if (!DIRECTUS_URL) {
    console.error('❌ DIRECTUS_URL no definida en ambiente.');
    process.exit(1);
  }

  async function fetchItems(collection, limit = 5) {
    const url = `${DIRECTUS_URL}/items/${collection}?limit=${limit}`;
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${DIRECTUS_TOKEN}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`❌ Error fetching ${collection}:`, error.message);
      return null;
    }
  }

  // Test Antecedentes
  console.log('\n--- 🧪 Antecedentes ---');
  const antParams = 'fields=id,Titulo&limit=3';
  const ant = await fetchItems(`antecedentes?${antParams}`);
  if (ant && ant.data) {
    console.log(`✅ OK. Items: ${ant.data.length}`);
    if (ant.data.length > 0) console.log(`   Ej: ${ant.data[0].Titulo}`);
  }

  // Test Servicios
  console.log('\n--- 🧪 Servicios ---');
  const serv = await fetchItems('Servicios?fields=id,Titulo&limit=1');
  if (serv && serv.data) {
    console.log(`✅ OK. Items: ${serv.data.length}`);
  }

  console.log('\n✨ CONECTIVIDAD VERIFICADA.');
}

testDirectusData();
