import type { Caso } from './relato';
import type { Story } from './isoData';
import { isNamedClient } from './catalogEditorial';

export type SelectedCase = { caso: Caso; pub: Story };
export const projectMediaKey = (image: string) => image.replace(/-(?:480|960|1600)\.(?:webp|avif|jpg)$/, '').replace(/\.(?:webp|avif|jpg)$/, '');
export const isCaseBoilerplate = (text: string) => /^Para .+Solución implementada por el equipo de ingeniería de Última Milla\.?$/i.test(text.trim());

const EXECUTION_TEMPLATE_SUFFIX = /,\s*asegurando continuidad operativa y cumplimiento de estándares técnicos de calidad\.?\s*Solución implementada por el equipo de ingeniería de Última Milla\.?$/i;
const CATEGORY_SCOPE_PREFIX = /^(?:Seguridad Electr[oó]nica\s*&\s*SDI|Detecci[oó]n de Incendios\s*&\s*Seguridad)\s*:\s*/i;
const cleanScopeText = (text: string) => text
  .replace(/^Ejecución integral de\s+/i, '')
  .replace(EXECUTION_TEMPLATE_SUFFIX, '')
  .replace(CATEGORY_SCOPE_PREFIX, '')
  .replace(/\s+/g, ' ')
  .trim();

function serviceEvidenceText(story: Story, service?: string): string {
  const title = cleanScopeText(story.title);
  const summary = cleanScopeText(story.summary);
  if (service === '104' && genericTitle.test(story.title)) {
    // A generated summary can repeat the generic software heading without naming software work.
    const specificSummary = summary.replace(new RegExp(`^${escapeRegExp(title)}\\s*`, 'i'), '').trim();
    return specificSummary || (summary === title ? '' : summary);
  }
  return `${title} ${summary}`.trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** One identity and one image per page; no service-cover fallback for a project. */
export function selectCaseProjects(casos: Caso[], stories: Story[], candidates?: Story[], max = 4): SelectedCase[] {
  const selected: SelectedCase[] = [];
  const eligibleIds = new Set((candidates || []).map(s => s.id));
  const ids = new Set<number>(), images = new Set<string>();
  const add = (caso: Caso, pub?: Story) => {
    if (!pub || (candidates !== undefined && !eligibleIds.has(pub.id)) || !isShowcaseProject(pub) || !isNamedClient(pub.client) || !(/^\/images\/(?:antecedentes|photography)\//.test(pub.image)) || ids.has(pub.id) || images.has(projectMediaKey(pub.image)) || selected.length >= max) return;
    selected.push({ caso, pub }); ids.add(pub.id); images.add(projectMediaKey(pub.image));
  };
  const curated = casos.filter(caso => caso.publicado).map(caso => ({ caso, pub: stories.find(s => s.id === caso.publicado) }));
  const ranked = (candidates || []).filter(s => s.estado !== 'pendiente').slice().sort((a,b) =>
    Number(b.summary.length > 40 && !isCaseBoilerplate(b.summary)) - Number(a.summary.length > 40 && !isCaseBoilerplate(a.summary)));
  // A documented, individually reviewed photograph gets the first visible
  // slots. Unreviewed records remain accessible in the catalog and gallery.
  for (const reviewed of [true, false]) {
    for (const { caso, pub } of curated) if (Boolean(pub?.image.startsWith('/images/photography/')) === reviewed) add(caso, pub);
    for (const pub of ranked) if (pub.image.startsWith('/images/photography/') === reviewed) add({ id: pub.id, publicado: pub.id, titulo: pub.title, cliente: pub.client, year: pub.year, sector: pub.sectorSlug, servicios: pub.serviceCodes, texto: pub.summary }, pub);
  }
  return selected;
}

/** The small gallery extends the feature stories instead of repeating them. */
export function remainingCaseProjects(candidates: Story[], selected: SelectedCase[]): Story[] {
  const ids = new Set(selected.map(s => s.pub.id));
  const images = new Set(selected.map(s => projectMediaKey(s.pub.image)));
  return candidates.filter(s => {
    const key = projectMediaKey(s.image);
    if (ids.has(s.id) || images.has(key)) return false;
    ids.add(s.id); images.add(key); return true;
  });
}

const genericTitle = /^(?:implementaci[oó]n de redes de datos y fibra [oó]ptica|desarrollo de software y digitalizaci[oó]n de procesos|soporte de infraestructura IT de alta disponibilidad|mantenimiento cr[ií]tico)/i;
export function isShowcaseProject(story: Story): boolean {
  const text = `${story.title} ${story.summary}`;
  // These two imported records contain a generic software heading and client
  // metadata, but no documented scope supporting a completed showcase case.
  if ([3145, 3150].includes(story.id) && genericTitle.test(story.title) && /Cliente:.*Sector:/i.test(story.summary)) return false;
  if (story.estado === 'pendiente' || /\b(?:cotizar|cotizaci[oó]n(?:es)?|presupuestar|presupuesto|tr[aá]mita? licitaci[oó]n|tramitamos licitaci[oó]n|se solicita|hay que)\b|costos por (?:puesto|persona)\b/i.test(text)) return false;
  // Conflicting dated evidence needs review before a completed case is highlighted.
  const datedMentions = [...text.matchAll(/\b(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+(?:de\s+)?(20\d{2})\b/gi)].map(match => Number(match[1]));
  if (story.year > 0 && datedMentions.length && !datedMentions.includes(story.year)) return false;
  if (genericTitle.test(story.title) && (!story.summary || isCaseBoilerplate(story.summary) || /Solución implementada por el equipo/.test(story.summary))) return false;
  return true;
}
/** Withhold ambiguous placements from the showcase, retaining their catalog record. */
export function pageCaseCandidates(stories: Story[], sector?: string, service?: string): Story[] {
  const scope: Record<string, RegExp> = {
    '101': /cableado|fibra|red(es)?|switch|racks?|conectividad|wifi|wi-fi|punto(s)? de acceso/i,
    '102': /cctv|c[aá]mara|vigilancia|control de acceso|porter[ií]a|portero|alarma|seguridad electr[oó]nica/i,
    '103': /telefon|telecom|radioenlace|enlace|internet|voz|voceo|comunicacion|comunicaci[oó]n|portero|porter[ií]a/i,
    '104': /software|digitaliza|(?:desarroll(?:o|a|ar)|implementaci[oó]n|programaci[oó]n|mantenimiento)\s+(?:de\s+)?aplicaci[oó]n|aplicaci[oó]n(?:es)?\s+(?:web|m[oó]vil|para\s+(?:la\s+)?gesti[oó]n|de\s+gesti[oó]n)|trazabilidad|\bweb\b|\berp\b|\bapi\b|sistema de gesti[oó]n|sistema de ventas/i,
    '105': /soporte|mantenimiento|guardia|mesa de ayuda|reparaci[oó]n|asistencia|monitoreo/i,
    '106': /consultor[ií]a|ingenier[ií]a|asesoramiento|auditor[ií]a|relevamiento|proyecto ejecutivo/i,
    '107': /incendio|\bsdi\b|(?:detector(?:es)?|detecci[oó]n)\s+(?:de\s+)?(?:humo|fuego)/i,
    '108': /el[eé]ctric|energ[ií]a|\bups\b|tablero|tierra|bater[ií]a|generador|circuito/i,
  };
  const unprovenPlacement: Record<string, number[]> = { industria: [3099,3113,3213,3224], constructoras: [3119,3082], gobiernosectorpublico: [3078] };
  return stories.filter(s => isShowcaseProject(s) && !(sector && unprovenPlacement[sector]?.includes(s.id)) && (!service || !scope[service] || scope[service].test(serviceEvidenceText(s, service))));
}
