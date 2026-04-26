/**
 * Mapeo de IDs de Servicio a Badges Descriptivos y Sectores
 *
 * Uso:
 * import { serviceBadgeMap, serviceToSectorMap } from '@/data/serviceBadgeMap';
 * const badge = serviceBadgeMap[101]; // 'Redes'
 * const sector = serviceToSectorMap[101]; // 'telecomunicaciones'
 */

/**
 * Mapeo de Service ID a Badge descriptivo
 * Reemplaza el genérico "Tecnología" con descriptores específicos
 */
export const serviceBadgeMap: Record<number, string> = {
  101: 'Redes',              // Infraestructura de Redes | Cableado, Fibra Óptica
  102: 'Seguridad',          // Sistemas de Seguridad Electrónica | CCTV, Control Acceso
  103: 'Telecom',            // Telecomunicaciones | Datos, Voz, Video
  104: 'Software',           // Desarrollo de Software a Medida | Web, Mobile, ERP
  105: 'Soporte IT',         // Mesa de Ayuda y Soporte Técnico
  106: 'Consultoría',        // Consultoría IT y Auditoría de Infraestructura
  107: 'Incendios',          // Detección de Incendios (SDI)
  108: 'Energía'             // Sistemas Eléctricos y Tableros
};

/**
 * Mapeo de Service ID a Sector
 * Vincula cada servicio con su sector cromático correspondiente
 */
export const serviceToSectorMap: Record<number, string> = {
  101: 'telecomunicaciones',  // Redes → Telecom sector (teal)
  102: 'seguridad',           // Seguridad → Seguridad sector (red)
  103: 'telecomunicaciones',  // Telecom → Telecom sector (teal)
  104: 'software',            // Software → Software sector (cyan)
  105: 'software',            // Soporte IT → Software sector (cyan)
  106: 'software',            // Consultoría → Software sector (cyan)
  107: 'seguridad',           // Incendios → Seguridad sector (red)
  108: 'industria'            // Energía → Industria sector (indigo)
};

/**
 * Obtiene el badge de un servicio por ID
 * @param serviceId - ID del servicio (101-108)
 * @returns Badge descriptivo o fallback "Tecnología"
 */
export function getServiceBadge(serviceId: number): string {
  return serviceBadgeMap[serviceId] || 'Tecnología';
}

/**
 * Obtiene el sector de un servicio por ID
 * @param serviceId - ID del servicio (101-108)
 * @returns Clave del sector o fallback "tecnologia"
 */
export function getServiceSector(serviceId: number): string {
  return serviceToSectorMap[serviceId] || 'tecnologia';
}
