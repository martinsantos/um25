import { approvedCaseImages } from '../../data/approvedImageAssets';
import { casePhotograph } from '../../data/photography';

/**
 * Evidence-backed editorial additions for records whose Directus export has no
 * service code or project photo. Keep this separate from the source snapshot:
 * it describes the evidence and can be integrated by the catalog loader without
 * rewriting CMS data.
 */

export type ServiceEvidence = {
  service: string;
  evidence: string;
};

export type RelatedServiceEvidence = ServiceEvidence & {
  sourceRecordId: number;
  sourceEvidence: string;
  requiresExactSgiDate?: boolean;
};

/**
 * Source wording that names a service directly. Entries intentionally stay
 * narrow: broad words such as "sistema", "mantenimiento" or "IT" do not
 * identify a service on their own.
 */
export const CATALOG_SERVICE_EVIDENCE: Readonly<Record<number, ServiceEvidence>> = {
  3127: { service: '101', evidence: 'Tendido de FO' },
  3116: { service: '101', evidence: 'Provisión de AP' },
  3586: { service: '101', evidence: 'cable cat.6' },
  3159: { service: '101', evidence: 'Insumo de red' },
  3210: { service: '101', evidence: 'Provisión de SFP' },
  3233: { service: '101', evidence: 'Insumos de red' },
  3236: { service: '101', evidence: 'Insumo de red' },
  3251: { service: '101', evidence: 'Puesto de datos' },
  3261: { service: '101', evidence: 'instalación de punto de acceso' },
  3362: { service: '101', evidence: 'puesto de datos' },
  3400: { service: '101', evidence: 'puesto de datos' },
  3668: { service: '101', evidence: 'Networking' },
  3260: { service: '103', evidence: 'Central Denwa' },
  3671: { service: '103', evidence: 'Central Denwa' },
  3265: { service: '104', evidence: 'Web, host y mail' },
  3348: { service: '104', evidence: 'web service' },
  3451: { service: '104', evidence: 'e-commerce' },
  3449: { service: '104', evidence: 'Módulo web' },
  3547: { service: '104', evidence: 'Sistema de gestión de riego' },
  3320: { service: '106', evidence: 'asesoramiento' },
  3382: { service: '108', evidence: 'luminarias LED' },
  3674: { service: '108', evidence: 'Iluminación de Planta' },
  3669: { service: '108', evidence: 'Luminaria Isla' },
  3165: { service: '103', evidence: 'Internet compartido' },
  3538: { service: '103', evidence: 'Servicios de Internet' },
  3573: { service: '102', evidence: 'Instalación de sistemas de seguridad para móviles policiales' },
};

/** Additional mappings backed by the matching full source records in antecedentes_completos.js. */
export const CATALOG_RELATED_SERVICE_EVIDENCE: Readonly<Record<number, RelatedServiceEvidence>> = {
  3582: { service: '107', evidence: 'Placa de lazo maestra LCM320', sourceRecordId: 11190, sourceEvidence: 'SDI' },
  3214: { service: '107', evidence: 'Cambio de central', sourceRecordId: 11088, sourceEvidence: 'SDI' },
  3606: { service: '101', evidence: 'FTTH', sourceRecordId: 11079, sourceEvidence: 'Fibra Óptica' },
  3300: { service: '103', evidence: 'Provisión de torre y equipamiento', sourceRecordId: 11001, sourceEvidence: 'Enlace' },
  3401: { service: '101', evidence: 'Llamadores para enfermería', sourceRecordId: 10902, sourceEvidence: 'Redes de Cableado Estructurado' },
  3209: { service: '107', evidence: 'Cambio de central', sourceRecordId: 11082, sourceEvidence: 'SDI', requiresExactSgiDate: true },
};

const normalize = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase('es')
  .replace(/[^\p{L}\p{N}]+/gu, ' ')
  .trim();

/** Remove inherited service tags only for an unchanged, identified source record. */
export function correctUnsupportedServices(id: number, client: string, title: string, services: string[]): string[] {
  const rules: Record<number, { client: string; title: string; remove: string[]; add?: string }> = {
    3164: { client: 'Aeropuertos Argentina 2000', title: 'Detección de Incendios & Seguridad: Insumos de SDI - Aeropuertos Argentina 2000', remove: ['103'] },
    3221: { client: 'Aeropuertos Argentina 2000', title: 'Video Vigilancia & Seguridad: Insumo de CCTV - Aeropuertos Argentina 2000', remove: ['103'] },
    3224: { client: 'Obras SRL', title: 'Seguridad Electrónica & SDI: 10 Telefonos IP - Obras SRL', remove: ['102', '107'], add: '103' },
    3334: { client: 'Bodegas y Viñedos Santa Elena SRL - TYGIA SRL - UTE', title: 'Provisión de discos para servidor de aplicaciones', remove: ['103', '104'] },
  };
  const rule = rules[id];
  if (!rule || normalize(client).replace(/\s/g, '') !== normalize(rule.client).replace(/\s/g, '') || normalize(title) !== normalize(rule.title)) return services;
  const corrected = services.filter(code => !rule.remove.includes(code));
  if (rule.add && !corrected.includes(rule.add)) corrected.push(rule.add);
  return corrected;
}

/** Add one service only when the stored record still contains its quoted source evidence. */
export function addEvidenceBackedService(
  id: number,
  title: string,
  summary: string,
  serviceCodes: string[],
): string[] {
  if (serviceCodes.length) return serviceCodes;
  const entry = CATALOG_SERVICE_EVIDENCE[id] || CATALOG_RELATED_SERVICE_EVIDENCE[id];
  if (!entry) return serviceCodes;
  const source = normalize(`${title} ${summary}`);
  if (!source.includes(normalize(entry.evidence))) return serviceCodes;
  return [entry.service];
}

export type SectorEvidence = {
  sector: string;
  evidence: string;
};

/** Reviewed related records whose imported area mixes a service with a place.
 * Their source does not substantiate the displayed vertical. Keep the projects,
 * images and services, but withhold that badge instead of inventing another place.
 */
const UNVERIFIED_SECTOR_TAGS: Readonly<Record<number, { client: string; evidence: string; sector: string }>> = {
  3628: { client: 'CERVECERIA Y MALTERIA QUILMES', evidence: 'Expansor de señal Hikvision', sector: 'aeropuertos' },
  3646: { client: 'CERVECERIA Y MALTERIA QUILMES', evidence: 'cotizar tres días de trabajo', sector: 'aeropuertos' },
  3655: { client: 'CERVECERIA Y MALTERIA QUILMES', evidence: 'En Quilmes hay que cotizar el tendido', sector: 'aeropuertos' },
  3471: { client: 'CERVECERIA Y MALTERIA QUILMES', evidence: 'Soporte de Infraestructura IT de Alta Disponibilidad', sector: 'constructoras' },
  3421: { client: 'Kristich Desarrollos', evidence: 'Torres calle Pedro J. Godoy', sector: 'aeropuertos' },
  3194: { client: 'Kristich Desarrollos', evidence: 'Hotel fuente Mayor Mendoza', sector: 'aeropuertos' },
};

export function withholdUnverifiedSector(id: number, client: string, text: string, sector: string): string {
  const entry = UNVERIFIED_SECTOR_TAGS[id];
  return entry && normalize(client) === normalize(entry.client)
    && normalize(text).includes(normalize(entry.evidence)) && sector === entry.sector ? '' : sector;
}

export type ClassificationCorrection = {
  /** Exact wording retained in the current case text or its verified source crosswalk. */
  evidence: string;
  sourceRecordId?: number;
  sector?: string;
  services?: string[];
};

/** Narrow corrections for curated cases where the current tags conflict with the named scope. */
export const CURATED_CLASSIFICATION_CORRECTIONS: Readonly<Record<number, ClassificationCorrection>> = {
  3588: { sourceRecordId: 11154, sector: 'constructoras', services: ['103', '102'], evidence: 'complejo de departamentos del Marqués' },
  3126: { sourceRecordId: 11146, services: ['107'], evidence: 'Sistema de Detección de Incendios en Balizamiento' },
  3144: { sourceRecordId: 11145, services: ['101', '103'], evidence: 'puestos simple Cat.6 LSZH para datos 18 dieciocho puestos simples Cat.6 LSZH para telefonía' },
  3102: { sourceRecordId: 11173, services: ['101'], evidence: 'puestos simples para datos Categoría 6 LSZH' },
  3103: { sourceRecordId: 11174, services: ['101'], evidence: 'puestos simples para datos Categoría 6 LSZH' },
  3085: { sourceRecordId: 11179, services: ['101', '108'], evidence: 'puestos simples para datos Categoría 6 LSZH' },
  3104: { sector: 'aeropuertos', services: ['102'], evidence: 'control de acceso para pañol y taller de trabajo en campo de vuelo para Aeropuertos Argentina 2000' },
  3140: { sourceRecordId: 11158, services: ['102'], evidence: 'Sistema de Video Cámaras de Seguridad o C.C.T.V. para el sector de mostradores de cobros de parking' },
  3116: { sourceRecordId: 11162, sector: 'bodegas', services: ['101'], evidence: 'Bodega Sur de los Andes' },
  3640: { sourceRecordId: 10927, sector: 'industria', services: ['102'], evidence: 'oficina de elaboración' },
  // Mayorista is explicit; none of the available sector filters describes retail/wholesale.
  // Do not turn a networking service into an unsupported construction-sector claim.
  3099: { sourceRecordId: 11176, sector: '', services: ['101'], evidence: 'Mayorista Yaguar' },
};

/** Apply a per-case correction only while its specific source wording is still present. */
export function correctCuratedClassification(
  id: number,
  title: string,
  summary: string,
  sector: string,
  services: string[],
): { sector: string; services: string[] } {
  const correction = CURATED_CLASSIFICATION_CORRECTIONS[id];
  if (!correction || !normalize(`${title} ${summary}`).includes(normalize(correction.evidence))) {
    return { sector, services };
  }
  return {
    sector: correction.sector ?? sector,
    services: correction.services ? [...correction.services] : services,
  };
}

/** Exact, in-record place/institution wording for currently unclassified records. */
// Las fichas antes listadas aquí ahora son confidenciales: la identidad histórica
// ya no constituye evidencia pública para asignarles un sector.
export const SECTOR_EVIDENCE: Readonly<Record<number, SectorEvidence>> = {};

/** Add a broad sector only when the title/description names its public setting. */
export function addEvidenceBackedSector(
  id: number,
  title: string,
  summary: string,
  currentSector: string,
): string {
  if (currentSector) return currentSector;
  const entry = SECTOR_EVIDENCE[id];
  if (!entry || !normalize(`${title} ${summary}`).includes(normalize(entry.evidence))) return currentSector;
  return entry.sector;
}

/** Editorial context images for SGI extras, explicitly labeled as illustrative. */
export const CATALOG_ILLUSTRATIVE_IMAGE: Readonly<Record<number, { src: string; label: string }>> = {
  9001: {
    src: '/images/editorial/umsa-sector-constructoras.webp',
    label: 'Imagen editorial de contexto · Constructoras',
  },
  9002: {
    src: '/cine/media/cine-software-system-v27-clean-poster.avif',
    label: 'Imagen editorial de contexto · Software a medida',
  },
};

/** Set an existing, relevant editorial image; never imply that it documents the named project. */
export function curateCatalogImage(id: number, currentImage: string): string {
  return approvedCaseImages[id] || casePhotograph(id) || CATALOG_ILLUSTRATIVE_IMAGE[id]?.src || currentImage;
}

export function catalogImageLabel(id: number): string | undefined {
  return casePhotograph(id) ? 'Fotografía de contexto' : CATALOG_ILLUSTRATIVE_IMAGE[id]?.label;
}

/** Anonymous labels are not a single identifiable customer. Keep their projects in the catalog. */
export const isNamedClient = (name: string): boolean => {
  const value = normalize(name);
  return Boolean(value) && !['cliente confidencial', 'confidencial', 'cliente no identificado', 'sin cliente', 'sin datos'].includes(value);
};
