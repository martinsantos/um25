// Test directo de conexión Directus sin fallback
import { createDirectus, rest, readItems } from '@directus/sdk';

const DIRECTUS_URL = 'http://23.105.176.45:8055';

console.log('🔄 Probando conexión a Directus...');
console.log('URL:', DIRECTUS_URL);

async function testDirectus() {
  try {
    const client = createDirectus(DIRECTUS_URL).with(rest());
    
    console.log('\n📊 Probando colección "Servicios"...');
    const servicios = await client.request(readItems('Servicios', { limit: 3 }));
    console.log('✅ Servicios obtenidos:', servicios.length);
    servicios.forEach((s, i) => console.log(`  ${i+1}. ${s.titulo || s.Titulo}`));
    
    console.log('\n📋 Probando colección "Antecedentes"...');
    const antecedentes = await client.request(readItems('Antecedentes', { limit: 3 }));
    console.log('✅ Antecedentes obtenidos:', antecedentes.length);
    antecedentes.forEach((a, i) => console.log(`  ${i+1}. ${a.titulo || a.Titulo}`));
    
    console.log('\n🎉 ¡ÉXITO! Directus está funcionando sin token');
    
    return {
      success: true,
      data: {
        servicios,
        antecedentes,
        estadisticas: {
          totalServicios: servicios.length,
          totalAntecedentes: antecedentes.length,
          ultimaActualizacion: new Date().toISOString()
        }
      }
    };
  } catch (error) {
    console.error('❌ Error:', error.message);
    return {
      success: false,
      error: error.message,
      fallback: true
    };
  }
}

testDirectus().then(result => {
  console.log('\n📊 Resultado final:');
  console.log(JSON.stringify(result, null, 2));
});
