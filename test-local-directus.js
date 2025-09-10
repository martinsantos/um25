// 🧪 Test local de integración Directus sin fallback
// Simula el comportamiento del API UM CLI con los cambios implementados

import { createDirectus, rest, readItems } from '@directus/sdk';

const DIRECTUS_CONFIG = {
  url: 'http://23.105.176.45:8055', // URL de producción
  token: undefined // Sin token - acceso público
};

console.log('🧪 TESTING INTEGRACIÓN DIRECTUS SIN TOKEN');
console.log('==========================================');
console.log('URL:', DIRECTUS_CONFIG.url);
console.log('Token:', DIRECTUS_CONFIG.token ? 'Configurado' : 'Sin token (público)');

async function obtenerContenidoPublicado(coleccion, opciones = {}) {
  try {
    const client = createDirectus(DIRECTUS_CONFIG.url).with(rest());
    const { limite = 10 } = opciones;

    console.log(`\n📋 Consultando colección: "${coleccion}"`);
    
    const items = await client.request(
      readItems(coleccion, {
        limit: limite,
      })
    );
    
    console.log(`✅ Obtenidos ${items.length} elementos de "${coleccion}"`);
    return items;
  } catch (error) {
    console.error(`❌ Error al obtener ${coleccion}:`, error.message);
    return [];
  }
}

async function testDirectusIntegration() {
  console.log('\n🚀 Iniciando test de integración...');
  
  try {
    // Simular las funciones actualizadas
    const getServicios = async (limite = 10) => 
      obtenerContenidoPublicado('Servicios', { limite });

    const getCasosExito = async (limite = 10) => 
      obtenerContenidoPublicado('Antecedentes', { limite });

    // Cargar datos como lo haría el API
    const [servicios, antecedentes] = await Promise.all([
      getServicios(5),
      getCasosExito(5)
    ]);

    // Crear respuesta como la API umcli.json
    const response = {
      success: true,
      data: {
        timestamp: Date.now(),
        servicios,
        antecedentes,
        casos_de_exito: antecedentes, // Alias para compatibilidad
        estadisticas: {
          totalServicios: servicios.length,
          totalAntecedentes: antecedentes.length,
          ultimaActualizacion: new Date().toISOString(),
          modo: servicios.length > 0 ? 'directus' : 'fallback'
        }
      }
    };

    console.log('\n📊 RESULTADO FINAL:');
    console.log('===================');
    console.log(`✅ Success: ${response.success}`);
    console.log(`📋 Servicios: ${response.data.servicios.length}`);
    console.log(`📁 Antecedentes: ${response.data.antecedentes.length}`);
    console.log(`🔧 Modo: ${response.data.estadisticas.modo}`);
    
    if (response.data.servicios.length > 0) {
      console.log('\n📋 SERVICIOS OBTENIDOS:');
      response.data.servicios.slice(0, 3).forEach((s, i) => {
        console.log(`  ${i+1}. ${s.titulo || s.Titulo || 'Sin título'}`);
      });
    }
    
    if (response.data.antecedentes.length > 0) {
      console.log('\n📁 ANTECEDENTES OBTENIDOS:');
      response.data.antecedentes.slice(0, 3).forEach((a, i) => {
        console.log(`  ${i+1}. ${a.titulo || a.Titulo || 'Sin título'}`);
      });
    }

    // Verificar si es fallback o real
    if (response.data.estadisticas.modo === 'directus') {
      console.log('\n🎉 ¡ÉXITO! Datos reales obtenidos desde Directus sin token');
      console.log('   - Sin dependencia de fallback');
      console.log('   - Acceso público funcionando');
      console.log('   - Colecciones accesibles');
    } else {
      console.log('\n⚠️  ADVERTENCIA: Sistema funcionando en modo fallback');
      console.log('   - Verificar conectividad con Directus');
      console.log('   - Revisar permisos de colecciones');
    }

    return response;
    
  } catch (error) {
    console.error('\n❌ ERROR EN TEST:', error.message);
    
    // Simular fallback como lo haría el código real
    return {
      success: false,
      data: {
        servicios: [
          { id: '1', titulo: 'Servicios IT (fallback)', descripcion: 'Datos de respaldo' }
        ],
        antecedentes: [
          { id: '1', titulo: 'Proyecto ejemplo (fallback)', resumen: 'Datos de respaldo' }
        ],
        estadisticas: {
          totalServicios: 1,
          totalAntecedentes: 1,
          modo: 'fallback',
          error: error.message
        }
      }
    };
  }
}

// Ejecutar test
testDirectusIntegration().then(result => {
  console.log('\n🔚 TEST COMPLETADO');
  console.log('==================');
  
  if (result.success && result.data.estadisticas.modo === 'directus') {
    console.log('✅ RESULTADO: DIRECTUS RESTAURADO EXITOSAMENTE SIN FALLBACK');
  } else {
    console.log('❌ RESULTADO: SISTEMA AÚN USANDO FALLBACK');
  }
  
  // Mostrar JSON resumido
  console.log('\n📄 JSON de respuesta (resumido):');
  console.log(JSON.stringify({
    success: result.success,
    servicios_count: result.data.servicios?.length || 0,
    antecedentes_count: result.data.antecedentes?.length || 0,
    modo: result.data.estadisticas?.modo || 'unknown'
  }, null, 2));
});
