import axios from 'axios';

// Configuración
const DIRECTUS_URL = process.env.DIRECTUS_URL || 'https://www.umbot.com.ar';
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN || '';

console.log('🚀 Iniciando migración de datos Directus...');
console.log(`🌐 URL: ${DIRECTUS_URL}`);

// Configurar axios
const api = axios.create({
  baseURL: DIRECTUS_URL,
  headers: {
    'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// Datos de ejemplo para generar información contextual
const industrias = ['Tecnología', 'Finanzas', 'Salud', 'Educación', 'Comercio', 'Manufactura', 'Servicios', 'Gobierno'];
const tecnologias = ['React', 'Node.js', 'Python', 'Java', 'Angular', 'Vue.js', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'PostgreSQL', 'MongoDB'];
const ubicaciones = ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'Tucumán', 'La Plata', 'Mar del Plata', 'Salta'];

// Función para generar datos aleatorios
function generarDatosAleatorios(titulo) {
  const industria = industrias[Math.floor(Math.random() * industrias.length)];
  const techs = tecnologias.sort(() => 0.5 - Math.random()).slice(0, 3).join(', ');
  const ubicacion = ubicaciones[Math.floor(Math.random() * ubicaciones.length)];
  const presupuesto = Math.floor(Math.random() * 500000) + 50000;
  const equipo = Math.floor(Math.random() * 15) + 2;
  const fechaInicio = new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
  const fechaFin = new Date(fechaInicio.getTime() + Math.random() * 365 * 24 * 60 * 60 * 1000);
  const estados = ['En Progreso', 'Completado', 'En Pausa', 'Cancelado'];
  const estado = estados[Math.floor(Math.random() * estados.length)];

  return {
    cliente_nombre: `Cliente ${Math.floor(Math.random() * 1000) + 1}`,
    cliente_industria: industria,
    tecnologias_utilizadas: techs,
    resultados_obtenidos: `Proyecto ${titulo} completado exitosamente con mejoras significativas en rendimiento y funcionalidad.`,
    fecha_inicio: fechaInicio.toISOString().split('T')[0],
    fecha_fin: fechaFin.toISOString().split('T')[0],
    presupuesto: presupuesto,
    equipo_tamaño: equipo,
    ubicacion_proyecto: ubicacion,
    estado_proyecto: estado
  };
}

// Función para generar datos de servicios
function generarDatosServicios(titulo) {
  const techs = tecnologias.sort(() => 0.5 - Math.random()).slice(0, 4).join(', ');
  const complejidades = ['Baja', 'Media', 'Alta'];
  const complejidad = complejidades[Math.floor(Math.random() * complejidades.length)];
  const precio = Math.floor(Math.random() * 100000) + 10000;
  const tiempo = `${Math.floor(Math.random() * 12) + 1} meses`;

  return {
    descripcion_detallada: `Servicio completo de ${titulo} que incluye análisis, diseño, desarrollo, implementación y mantenimiento.`,
    tecnologias_principales: techs,
    tiempo_estimado: tiempo,
    nivel_complejidad: complejidad,
    precio_estimado: precio,
    casos_uso: `Ideal para empresas que necesitan ${titulo.toLowerCase()} para optimizar sus procesos y mejorar la eficiencia operativa.`,
    beneficios_clave: `Reducción de costos, mejora en la productividad, mayor seguridad y escalabilidad para el crecimiento futuro.`
  };
}

async function migrarDatos() {
  try {
    console.log('\n📋 Iniciando migración de datos...');
    
    // Verificar conectividad
    console.log('🔍 Verificando conectividad...');
    await api.get('/server/health');
    console.log('✅ Conectividad verificada');
    
    // Obtener antecedentes existentes
    console.log('\n📊 Obteniendo antecedentes existentes...');
    const antecedentesResponse = await api.get('/items/antecedentes?limit=-1');
    const antecedentes = antecedentesResponse.data.data;
    console.log(`✅ Encontrados ${antecedentes.length} antecedentes`);
    
    // Migrar antecedentes
    console.log('\n🔄 Migrando datos de antecedentes...');
    let antecedentesMigrados = 0;
    
    for (const antecedente of antecedentes) {
      try {
        const datosGenerados = generarDatosAleatorios(antecedente.titulo || 'Proyecto');
        
        await api.patch(`/items/antecedentes/${antecedente.id}`, datosGenerados);
        antecedentesMigrados++;
        
        if (antecedentesMigrados % 50 === 0) {
          console.log(`📈 Progreso: ${antecedentesMigrados}/${antecedentes.length} antecedentes migrados`);
        }
      } catch (error) {
        console.log(`⚠️ Error migrando antecedente ${antecedente.id}:`, error.response?.data || error.message);
      }
    }
    
    console.log(`✅ ${antecedentesMigrados} antecedentes migrados exitosamente`);
    
    // Obtener servicios existentes
    console.log('\n📊 Obteniendo servicios existentes...');
    const serviciosResponse = await api.get('/items/Servicios?limit=-1');
    const servicios = serviciosResponse.data.data;
    console.log(`✅ Encontrados ${servicios.length} servicios`);
    
    // Migrar servicios
    console.log('\n🔄 Migrando datos de servicios...');
    let serviciosMigrados = 0;
    
    for (const servicio of servicios) {
      try {
        const datosGenerados = generarDatosServicios(servicio.titulo || 'Servicio');
        
        await api.patch(`/items/Servicios/${servicio.id}`, datosGenerados);
        serviciosMigrados++;
        
        console.log(`✅ Servicio '${servicio.titulo}' migrado`);
      } catch (error) {
        console.log(`⚠️ Error migrando servicio ${servicio.id}:`, error.response?.data || error.message);
      }
    }
    
    console.log(`✅ ${serviciosMigrados} servicios migrados exitosamente`);
    
    // Resumen final
    console.log('\n📊 RESUMEN DE MIGRACIÓN:');
    console.log(`📋 Antecedentes migrados: ${antecedentesMigrados}/${antecedentes.length}`);
    console.log(`🔧 Servicios migrados: ${serviciosMigrados}/${servicios.length}`);
    console.log(`📈 Total de registros procesados: ${antecedentesMigrados + serviciosMigrados}`);
    
    console.log('\n🎉 Migración de datos completada exitosamente!');
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Ejecutar migración
migrarDatos(); 