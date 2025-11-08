// Mapeo de verticales/sectores con palabras clave para clasificar antecedentes
export const verticalesConfig = {
  constructoras: {
    nombre: "Constructoras",
    descripcion: "Infraestructura IT para obras y proyectos de construcción",
    keywords: ['constructora', 'obra', 'cantero', 'construcción', 'procon', 'lauggero', 'kristich', 'edificio', 'proyecto inmobiliario', 'vivienda', 'complejo', 'desarrollo inmobiliario'],
    areas: ['Redes Informáticas', 'Servicios de Telecomunicaciones', 'Soporte TIC', 'Comunicaciones y Telecomunicaciones'],
    clientes: ['PROCON', 'LAUGGERO', 'KRISTICH', 'Constructora', 'Inmobiliaria'],
    proyectosEsperados: 50
  },
  aeropuertos: {
    nombre: "Aeropuertos",
    descripcion: "Comunicaciones críticas y seguridad aeroportuaria",
    keywords: ['aeropuerto', 'aeronaval', 'aviación', 'terminal aérea', 'pista', 'hangar'],
    areas: ['Servicios de Telecomunicaciones', 'Comunicaciones y Telecomunicaciones', 'Seguridad Informática'],
    clientes: ['Aeropuerto', 'Aeronaval', 'Aviación'],
    proyectosEsperados: 35
  },
  salud: {
    nombre: "Salud",
    descripcion: "Tecnología hospitalaria y sistemas críticos de salud",
    keywords: ['hospital', 'clínica', 'sanatorio', 'salud', 'médico', 'farmacia', 'laboratorio', 'centro médico'],
    areas: ['Servicios de Telecomunicaciones', 'Comunicaciones y Telecomunicaciones', 'Redes Informáticas'],
    clientes: ['Hospital', 'Clínica', 'Sanatorio', 'Centro Médico', 'Farmacia'],
    proyectosEsperados: 40
  },
  bodegas: {
    nombre: "Bodegas",
    descripcion: "Tecnología para bodegas y vitivinicultura",
    keywords: ['bodega', 'vino', 'viña', 'vitivinicultura', 'enología', 'viticultura'],
    areas: ['Redes Informáticas', 'Servicios de Telecomunicaciones', 'Soporte TIC'],
    clientes: ['Bodega', 'Viña', 'Vino'],
    proyectosEsperados: 10
  },
  software: {
    nombre: "Software",
    descripcion: "Desarrollo de software a medida y personalizado",
    keywords: ['software', 'desarrollo', 'aplicación', 'sistema', 'plataforma', 'app', 'web'],
    areas: ['Servicios de Telecomunicaciones', 'Comunicaciones y Telecomunicaciones', 'Soporte TIC'],
    clientes: [],
    proyectosEsperados: 20
  },
  gobierno: {
    nombre: "Gobierno",
    descripcion: "Soluciones tecnológicas para el sector público",
    keywords: ['gobierno', 'ministerio', 'municipalidad', 'provincia', 'estado', 'público', 'administración'],
    areas: ['Servicios de Telecomunicaciones', 'Comunicaciones y Telecomunicaciones', 'Redes Informáticas'],
    clientes: ['Gobierno', 'Ministerio', 'Municipalidad', 'Provincia'],
    proyectosEsperados: 30
  }
};

/**
 * Clasifica un antecedente en un vertical basado en cliente, área y título
 * @param {Object} antecedente - Objeto antecedente con Cliente, Area, Titulo
 * @returns {string|null} - Nombre del vertical o null si no coincide
 */
export function clasificarEnVertical(antecedente) {
  const cliente = (antecedente.Cliente || '').toLowerCase();
  const area = (antecedente.Area || '').toLowerCase();
  const titulo = (antecedente.Titulo || '').toLowerCase();
  const descripcion = (antecedente.Descripcion || '').toLowerCase();
  
  // Buscar coincidencias en cada vertical
  for (const [key, config] of Object.entries(verticalesConfig)) {
    // Verificar palabras clave en cliente, título y descripción
    const keywords = config.keywords.map(k => k.toLowerCase());
    
    for (const keyword of keywords) {
      if (cliente.includes(keyword) || titulo.includes(keyword) || descripcion.includes(keyword)) {
        return key;
      }
    }
    
    // Verificar coincidencias exactas de clientes
    for (const clienteConfig of config.clientes) {
      if (cliente.includes(clienteConfig.toLowerCase())) {
        return key;
      }
    }
  }
  
  return null;
}

/**
 * Filtra antecedentes por vertical
 * @param {Array} antecedentes - Array de antecedentes
 * @param {string} vertical - Nombre del vertical
 * @returns {Array} - Antecedentes filtrados
 */
export function filtrarPorVertical(antecedentes, vertical) {
  return antecedentes.filter(item => clasificarEnVertical(item) === vertical);
}
