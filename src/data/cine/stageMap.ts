// How each service drives the 3D stage: the layer it lights and the equipment
// the camera moves to. Points are defined by each sector scene; a missing point
// keeps the whole site in view.
export interface StageFocus { layer: 'en' | 'da' | 'se' | 'de' | 'all'; point: string | null; film: number }
export const SERVICE_STAGE: Record<string, StageFocus> = {
  '101': { layer: 'da', point: 'rack', film: 2.8 },
  '102': { layer: 'se', point: 'cam', film: 10.8 },
  '103': { layer: 'da', point: 'ap', film: 2.8 },
  '104': { layer: 'da', point: 'screen', film: 6.6 },
  '105': { layer: 'all', point: 'rack', film: 15.6 },
  '106': { layer: 'all', point: null, film: 0 },
  '107': { layer: 'de', point: 'det', film: 10.8 },
  '108': { layer: 'en', point: 'ups', film: 10.8 },
};
export const STAGE_SECTORS = ['salud', 'constructoras', 'aeropuertos', 'industria', 'bodegas', 'mineria'];

// Antecedentes carry area, title and description but no service code: a keyword
// reading assigns the service that best describes the work.
const CASE_RULES: [string, RegExp][] = [
  ['107', /incend|humo|detecci[oó]n de|sistemas? de detecci|detectores?\b|sdi\b|rociador|notifier|pulsador|pusaldor|sirena/i],
  ['102', /cctv|c[aá]mara|videovigil|control de acceso|control de asistencia|seguridad electr|alarma|intrusi/i],
  ['108', /el[eé]ctric|\bups\b|tablero|grupo electr|energ[ií]a|puesta a tierra|iluminaci/i],
  ['103', /tel[eé]fon|telecom|radioenlace|enlace|\bvoz\b|central telef|amplificador|voceo|megafon|llamador|trama sip/i],
  ['106', /consultor|auditor|relevamiento|dise[nñ]o de|transformaci[oó]n digital|ingenier[ií]a de/i],
  ['104', /software|desarrollo de|aplicaci[oó]n (web|m[oó]vil)|\bweb\b|digitaliz/i],
  ['105', /soporte|mantenimiento|mesa de ayuda|servidor|disco|servicio t[eé]cnico/i],
  ['101', /\bred(es)?\b|cablead|fibra|\blan\b|\bwan\b|wi-?fi|switch|\brack\b|corrientes d[eé]biles/i],
];
export function caseService(item: { Area?: unknown; Titulo?: unknown; Descripcion?: unknown }): string | null {
  const text = [item.Area, item.Titulo, item.Descripcion].filter(Boolean).join(' ');
  return CASE_RULES.find(([, re]) => re.test(text))?.[0] ?? null;
}

// Area values in the antecedentes archive that name a sector with its own 3D scene.
export function caseSector(area: unknown): string | null {
  const a = String(area || '');
  if (/aeropuert/i.test(a)) return 'aeropuertos';
  if (/salud|hospital/i.test(a)) return 'salud';
  if (/bodega/i.test(a)) return 'bodegas';
  if (/industr/i.test(a)) return 'industria';
  if (/miner/i.test(a)) return 'mineria';
  if (/constru/i.test(a)) return 'constructoras';
  return null;
}
