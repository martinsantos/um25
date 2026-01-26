/**
 * Mapeo de Áreas de Antecedentes a IDs de Servicios
 * Permite mostrar productos reales del servicio relacionado
 */

export const areaToServiceMap = {
  // Telecomunicaciones → 103
  'Servicios de Telecomunicaciones': 103,
  'Comunicaciones y Telecomunicaciones': 103,
  'Electrónica y Comunicaciones': 103,
  'Telecomunicaciones': 103,

  // Redes → 101
  'Redes Informáticas': 101,
  'Redes de Cableado Estructurado': 101,
  'Redes de Fibra Óptica': 101,
  'Redes y comunicaciones': 101,
  'Redes': 101,
  'Cableado Estructurado': 101,
  'Fibra Óptica': 101,
  'Data Center': 101,

  // Seguridad → 102
  'Seguridad Informática': 102,
  'Seguridad Digital': 102,
  'Videovigilancia en Circuito Cerrado': 102,
  'Seguridad Electrónica': 102,
  'Seguridad': 102,
  'CCTV': 102,
  'Control de Acceso': 102,
  'Detección de Incendios': 102,
  'Detección Incendios': 102,
  'Alarmas': 102,

  // Software → 104
  'Software': 104,
  'Desarrollo de Software': 104,
  'Desarrollo Web': 104,
  'Aplicaciones': 104,

  // Soporte → 105
  'Soporte TIC': 105,
  'Soporte Técnico': 105,
  'Soporte IT': 105,
  'Mesa de Ayuda': 105,
  'Helpdesk': 105,

  // Consultoría → 106
  'Consultoría': 106,
  'Consultoría IT': 106,
  'Auditoría': 106
};

/**
 * Obtiene el ID del servicio relacionado a un área de antecedente
 * @param {string} area - Área del antecedente
 * @returns {number} - ID del servicio (default: 101 Infraestructura)
 */
export function getServiceIdFromArea(area) {
  if (!area) return 101;

  // Búsqueda exacta
  if (areaToServiceMap[area]) {
    return areaToServiceMap[area];
  }

  // Búsqueda parcial (case insensitive)
  const areaLower = area.toLowerCase();

  // Palabras clave para cada servicio
  if (areaLower.includes('telecom') || areaLower.includes('comunicacion')) return 103;
  if (areaLower.includes('seguridad') || areaLower.includes('cctv') || areaLower.includes('incendio') || areaLower.includes('alarma') || areaLower.includes('acceso')) return 102;
  if (areaLower.includes('software') || areaLower.includes('web') || areaLower.includes('aplicacion') || areaLower.includes('sistema')) return 104;
  if (areaLower.includes('soporte') || areaLower.includes('help') || areaLower.includes('mesa')) return 105;
  if (areaLower.includes('consultor') || areaLower.includes('audit')) return 106;
  if (areaLower.includes('red') || areaLower.includes('cable') || areaLower.includes('fibra') || areaLower.includes('data center')) return 101;

  // Default: Infraestructura de Redes
  return 101;
}

export default areaToServiceMap;
