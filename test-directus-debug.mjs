import fs from 'fs';

async function testDirectusData() {
  console.log('🔄 DEBUGGING DIRECTUS CONNECTION...');

  const DIRECTUS_URL = process.env.DIRECTUS_URL;
  const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;

  console.log(`📡 URL: ${DIRECTUS_URL}`);

  async function fetchDebug(endpoint) {
    const url = `${DIRECTUS_URL}/${endpoint}`;
    console.log(`\n👉 Request: ${url}`);
    
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${DIRECTUS_TOKEN}`
        }
      });
      
      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      const text = await response.text();
      try {
        const json = JSON.parse(text);
        if (response.ok) {
           console.log(`✅ SUCCESS. Data count: ${json.data ? json.data.length : 'N/A'}`);
        } else {
           console.log(`❌ ERROR JSON:`, JSON.stringify(json, null, 2));
        }
      } catch (e) {
        console.log(`Response (Text): ${text.substring(0, 200)}...`);
      }
      
    } catch (error) {
      console.error(`❌ NETWORK ERROR:`, error.message);
    }
  }

  // 1. Ping /server/ping or /server/info to check basic life
  await fetchDebug('server/health');

  // 2. Simple fetch items/antecedentes (no params)
  await fetchDebug('items/antecedentes?limit=1');

  // 3. Simple fetch items/Servicios (case sensitive?)
  await fetchDebug('items/Servicios?limit=1');
}

testDirectusData();
