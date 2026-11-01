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
  3261: { service: '101', evidence: 'instalación de AP' },
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
  3382: { service: '108', evidence: 'Luminaria led' },
  3674: { service: '108', evidence: 'Iluminación de Planta' },
  3669: { service: '108', evidence: 'Luminaria Isla' },
  3165: { service: '103', evidence: 'Internet compartido' },
  3538: { service: '103', evidence: 'Servicios de Internet en Pasip' },
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

/** Exact, in-record place/institution wording for currently unclassified records. */
export const SECTOR_EVIDENCE: Readonly<Record<number, SectorEvidence>> = {
  3633: { sector: 'gobiernosectorpublico', evidence: 'Cliente: Municipalidad Guaymallén' },
  3669: { sector: 'gobiernosectorpublico', evidence: 'Cliente: Municipalidad Guaymallén' },
  3541: { sector: 'gobiernosectorpublico', evidence: 'Cliente: Municipalidad de Gral San Martín' },
};

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
  return CATALOG_ILLUSTRATIVE_IMAGE[id]?.src || currentImage;
}

export function catalogImageLabel(id: number): string | undefined {
  return CATALOG_ILLUSTRATIVE_IMAGE[id]?.label;
}

/** Anonymous labels are not a single identifiable customer. Keep their projects in the catalog. */
export const isNamedClient = (name: string): boolean => {
  const value = normalize(name);
  return Boolean(value) && !['cliente confidencial', 'confidencial', 'cliente no identificado', 'sin cliente', 'sin datos'].includes(value);
};
