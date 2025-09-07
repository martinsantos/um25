import axios from 'axios';

// Configuración
const DIRECTUS_URL = process.env.DIRECTUS_URL || 'https://www.ultimamilla.com.ar';
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN || '';

// Detectar entorno
const isProduction = process.env.NODE_ENV === 'production' || DIRECTUS_URL.includes('ultimamilla.com.ar');

console.log('🚀 Iniciando refactorización del esquema Directus...');
console.log(`📍 Entorno: ${isProduction ? 'PRODUCCIÓN' : 'DESARROLLO'}`);
console.log(`🌐 URL: ${DIRECTUS_URL}`);

// Configurar axios
const api = axios.create({
  baseURL: DIRECTUS_URL,
  headers: {
    'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// Campos a agregar a la colección 'antecedentes'
const camposAntecedentes = [
  { field: 'cliente_nombre', type: 'string', interface: 'input', options: { placeholder: 'Nombre del cliente' } },
  { field: 'cliente_industria', type: 'string', interface: 'input', options: { placeholder: 'Industria del cliente' } },
  { field: 'tecnologias_utilizadas', type: 'text', interface: 'input-multiline', options: { placeholder: 'Tecnologías utilizadas en el proyecto' } },
  { field: 'resultados_obtenidos', type: 'text', interface: 'input-multiline', options: { placeholder: 'Resultados obtenidos del proyecto' } },
  { field: 'fecha_inicio', type: 'date', interface: 'datetime', options: { include_seconds: false } },
  { field: 'fecha_fin', type: 'date', interface: 'datetime', options: { include_seconds: false } },
  { field: 'presupuesto', type: 'integer', interface: 'input', options: { placeholder: 'Presupuesto del proyecto' } },
  { field: 'equipo_tamaño', type: 'integer', interface: 'input', options: { placeholder: 'Tamaño del equipo' } },
  { field: 'ubicacion_proyecto', type: 'string', interface: 'input', options: { placeholder: 'Ubicación del proyecto' } },
  { field: 'estado_proyecto', type: 'string', interface: 'select-dropdown', options: { choices: [
    { text: 'En Progreso', value: 'En Progreso' },
    { text: 'Completado', value: 'Completado' },
    { text: 'En Pausa', value: 'En Pausa' },
    { text: 'Cancelado', value: 'Cancelado' }
  ]}}
];

// Campos a agregar a la colección 'Servicios'
const camposServicios = [
  { field: 'descripcion_detallada', type: 'text', interface: 'input-multiline', options: { placeholder: 'Descripción detallada del servicio' } },
  { field: 'tecnologias_principales', type: 'text', interface: 'input-multiline', options: { placeholder: 'Tecnologías principales utilizadas' } },
  { field: 'tiempo_estimado', type: 'string', interface: 'input', options: { placeholder: 'Tiempo estimado de implementación' } },
  { field: 'nivel_complejidad', type: 'string', interface: 'select-dropdown', options: { choices: [
    { text: 'Baja', value: 'Baja' },
    { text: 'Media', value: 'Media' },
    { text: 'Alta', value: 'Alta' }
  ]}},
  { field: 'precio_estimado', type: 'integer', interface: 'input', options: { placeholder: 'Precio estimado del servicio' } },
  { field: 'casos_uso', type: 'text', interface: 'input-multiline', options: { placeholder: 'Casos de uso del servicio' } },
  { field: 'beneficios_clave', type: 'text', interface: 'input-multiline', options: { placeholder: 'Beneficios clave del servicio' } }
];

async function refactorizarEsquema() {
  try {
    console.log('\n📋 Refactorizando esquema...');
    
    // Verificar conectividad
    console.log('🔍 Verificando conectividad...');
    await api.get('/server/health');
    console.log('✅ Conectividad verificada');
    
    // Refactorizar colección 'antecedentes'
    console.log('\n🔄 Refactorizando colección antecedentes...');
    for (const campo of camposAntecedentes) {
      try {
        await api.post('/fields/antecedentes', campo);
        console.log(`✅ Campo '${campo.field}' agregado a antecedentes`);
      } catch (error) {
        if (error.response?.status === 400 && error.response?.data?.error?.code === 'INVALID_PAYLOAD') {
          console.log(`⚠️ Campo '${campo.field}' ya existe en antecedentes`);
        } else {
          console.log(`❌ Error agregando campo '${campo.field}':`, error.response?.data || error.message);
        }
      }
    }
    
    // Refactorizar colección 'Servicios'
    console.log('\n🔄 Refactorizando colección Servicios...');
    for (const campo of camposServicios) {
      try {
        await api.post('/fields/Servicios', campo);
        console.log(`✅ Campo '${campo.field}' agregado a Servicios`);
      } catch (error) {
        if (error.response?.status === 400 && error.response?.data?.error?.code === 'INVALID_PAYLOAD') {
          console.log(`⚠️ Campo '${campo.field}' ya existe en Servicios`);
        } else {
          console.log(`❌ Error agregando campo '${campo.field}':`, error.response?.data || error.message);
        }
      }
    }
    
    console.log('\n🎉 Refactorización del esquema completada exitosamente!');
    
  } catch (error) {
    console.error('❌ Error durante la refactorización:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Ejecutar refactorización
refactorizarEsquema(); 