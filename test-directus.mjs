import { directus } from './src/utils/directus.js';

async function testDirectus() {
  console.log('🔄 Iniciando prueba de conexión con Directus...');
  console.log(`📡 URL Configurada: ${process.env.DIRECTUS_URL || 'No definida'}`);
  
  try {
    // 1. Test fetch Antecedentes
    console.log('\n--- 🧪 Probando Antecedentes ---');
    const antecedentes = await directus.getAntecedentes({ limit: 5 });
    console.log(`✅ Status: OK`);
    console.log(`📦 Antecedentes encontrados: ${antecedentes.data.length}`);
    if (antecedentes.data.length > 0) {
      console.log(`📝 Ejemplo: ${antecedentes.data[0].Titulo} (ID: ${antecedentes.data[0].id})`);
    } else {
      console.warn('⚠️ No se encontraron antecedentes, pero la conexión fue exitosa.');
    }

    // 2. Test fetch Servicios
    console.log('\n--- 🧪 Probando Servicios ---');
    const servicios = await directus.getServicios({ limit: 1 });
    console.log(`✅ Status: OK`);
    console.log(`📦 Servicios encontrados: ${servicios.data.length}`);

    // 3. Test fetch Blog
    console.log('\n--- 🧪 Probando Blog ---');
    const posts = await directus.getBlogPosts({ limit: 1 });
    console.log(`✅ Status: OK`);
    console.log(`📦 Posts encontrados: ${posts.data.length}`);

    console.log('\n✨ PRUEBA EXITOSA: Directus está respondiendo correctamente.');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERROR FATAL EN PRUEBA DE DIRECTUS:');
    console.error(error);
    process.exit(1);
  }
}

testDirectus();
