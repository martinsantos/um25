/**
 * Protección de un registro cuyo nombre de cliente fue retirado del CMS,
 * pero todavía aparece en sus textos públicos históricos.
 */
export const PROTECTED_CASE_ID = 3568;
export const PROTECTED_CASE_TITLE = 'Montaje de sirenas y avisos de emergencia en campo de vuelo';
export const PROTECTED_CASE_SLUG = 'montaje-de-sirenas-y-avisos-de-emergencia-en-campo-de-vuelo';

// Textos revisados para fichas confidenciales cuyos títulos o descripciones
// identificaban un cliente, una instalación o una dirección.
const SAFE_TITLES = {
  "3171": "Sistema de detección de incendios para local comercial",
  "3175": "Cámara de CCTV para edificio",
  "3261": "Provisión e instalación de punto de acceso",
  "3288": "Software para administración de distribución de agua de riego",
  "3329": "Sistema de detección de incendios, CCTV y portería",
  "3382": "Adicional de 120 luminarias LED",
  "3383": "Red de cableado estructurado para local comercial",
  "3499": "Antecedente técnico para edificio",
  "3509": "Actualización de licencia de central telefónica",
  "3512": "Antecedente técnico para oficinas",
  "3515": "Soporte técnico para evento deportivo",
  "3518": "Sistema de detección de incendios para oficina",
  "3520": "Servicio de diagnóstico de red IP",
  "3537": "Ampliación de sistema de detección en clínica",
  "3538": "Servicios de Internet",
  "3539": "Obra básica y trabajos adicionales",
  "3532": "Sistema de corrientes débiles para ampliación hospitalaria",
  "3540": "Sitio web",
  "3541": "Alojamiento corporativo",
  "3546": "Red de cableado estructurado, fibra óptica y enlaces",
  "3548": "Licitación para provisión de equipos informáticos y conectividad",
  "3549": "Sistema de detección de incendios para edificio de departamentos",
  "3551": "Provisión de equipamiento para evento",
  "3552": "Servicios de infraestructura para evento",
  "3553": "Alarma de instrucción",
  "3555": "Alarma de instrucción",
  "3557": "Sistema de detección de incendios para edificio",
  "3566": "Detector de humo para instalación aeroportuaria",
  "3567": "Adicional de sistema de detección de incendios",
  "3568": "Montaje de sirenas y avisos de emergencia en campo de vuelo",
  "3570": "Renovación de contratos web",
  "3632": "Vinculación con helipuerto",
  "3633": "Alojamiento y servicios",
  "3642": "Presupuesto de trabajo en sistema de detección de incendios",
  "3651": "Presupuesto para revisión de cámaras",
  "3653": "Presupuesto para trabajos en sistema de detección de incendios",
  "3658": "Presupuesto de equipamiento para evento",
  "3659": "Presupuesto por adicionales para un edificio",
  "3661": "Equipamiento de detección de incendios para edificio"
};
// Título o descripción exigen confidencialidad mientras Cliente muestra otro dato.
const CONFLICTING_PRIVACY = new Set([3288, 3382, 3383, 3509, 3512, 3515, 3518, 3532, 3553, 3557, 3566, 3567]);

function safeSlug(title) {
  return title.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/**
 * @template {object & {id?: unknown, Cliente?: unknown}} T
 * @param {T} item
 * @returns {T}
 */
export function protectPublicCase(item) {
  const title = SAFE_TITLES[Number(item.id)];
  if (!title) return item;

  const client = String(item.Cliente || '').trim().toLowerCase();
  if (client && client !== 'cliente confidencial' && !CONFLICTING_PRIVACY.has(Number(item.id))) return item;

  const safe = { ...item };
  if ('Cliente' in safe) safe.Cliente = 'Cliente Confidencial';
  for (const key of ['Titulo', 'Nombre', 'title']) {
    if (key in safe) safe[key] = title;
  }
  for (const key of ['Descripcion', 'content']) {
    if (key in safe) safe[key] = `${title}.`;
  }
  if ('client' in safe) safe.client = 'Cliente Confidencial';
  if ('slug' in safe) safe.slug = `${item.id}/${safeSlug(title)}`;
  return safe;
}

/** URL canónica segura para una ficha modificada por esta política. */
export function protectedCasePath(item) {
  if (protectPublicCase(item) === item) return null;
  return `/antecedentes/${item.id}/${safeSlug(SAFE_TITLES[Number(item.id)])}`;
}

/**
 * Conserva la versión revisada de los textos confidenciales al regenerar
 * snapshots con un token que podría tener acceso a datos más amplios.
 */
export function protectSnapshotCase(item, reviewedById, restrictedIds) {
  if (!restrictedIds.has(Number(item.id))) return protectPublicCase(item);
  const reviewed = reviewedById.get(Number(item.id));
  if (!reviewed || reviewed.Cliente !== 'Cliente Confidencial') {
    throw new Error(`Falta una ficha confidencial revisada para ${item.id}`);
  }
  return protectPublicCase({
    ...item,
    Cliente: reviewed.Cliente,
    Titulo: reviewed.Titulo,
    Descripcion: reviewed.Descripcion,
  });
}
