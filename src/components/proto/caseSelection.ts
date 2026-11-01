import type { Caso } from './relato';
import type { Story } from './isoData';
import { isNamedClient } from './catalogEditorial';

export type SelectedCase = { caso: Caso; pub: Story };
export const projectMediaKey = (image: string) => image.replace(/-(?:480|960|1600)\.(?:webp|avif|jpg)$/, '').replace(/\.(?:webp|avif|jpg)$/, '');
export const isCaseBoilerplate = (text: string) => /^Para .+Solución implementada por el equipo de ingeniería de Última Milla\.?$/i.test(text.trim());

/** One identity and one image per page; no service-cover fallback for a project. */
export function selectCaseProjects(casos: Caso[], stories: Story[], candidates?: Story[], max = 4): SelectedCase[] {
  const selected: SelectedCase[] = [];
  const eligibleIds = new Set((candidates || []).map(s => s.id));
  const ids = new Set<number>(), images = new Set<string>();
  const add = (caso: Caso, pub?: Story) => {
    if (!pub || (candidates !== undefined && !eligibleIds.has(pub.id)) || !isShowcaseProject(pub) || !isNamedClient(pub.client) || !pub.image.startsWith('/images/antecedentes/') || ids.has(pub.id) || images.has(projectMediaKey(pub.image)) || selected.length >= max) return;
    selected.push({ caso, pub }); ids.add(pub.id); images.add(projectMediaKey(pub.image));
  };
  for (const caso of casos) if (caso.publicado) add(caso, stories.find(s => s.id === caso.publicado));
  const ranked = (candidates || []).filter(s => s.estado !== 'pendiente').slice().sort((a,b) =>
    Number(b.summary.length > 40 && !isCaseBoilerplate(b.summary)) - Number(a.summary.length > 40 && !isCaseBoilerplate(a.summary)));
  for (const pub of ranked) add({ id: pub.id, publicado: pub.id, titulo: pub.title, cliente: pub.client, year: pub.year, sector: pub.sectorSlug, servicios: pub.serviceCodes, texto: pub.summary }, pub);
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
  if (story.estado === 'pendiente' || /\b(?:cotizar|presupuestar|tr[aá]mita? licitaci[oó]n|tramitamos licitaci[oó]n|costos por puesto|costos por persona|se solicita|hay que)\b/i.test(text)) return false;
  if (genericTitle.test(story.title) && (!story.summary || isCaseBoilerplate(story.summary) || /Solución implementada por el equipo/.test(story.summary))) return false;
  return true;
}
/** Withhold ambiguous placements from the showcase, retaining their catalog record. */
export function pageCaseCandidates(stories: Story[], sector?: string, service?: string): Story[] {
  const scope: Record<string, RegExp> = {
    '101': /cableado|fibra|red(es)?|switch|racks?|conectividad|wifi|wi-fi|punto(s)? de acceso/i,
    '102': /cctv|c[aá]mara|vigilancia|control de acceso|porter[ií]a|portero|alarma|seguridad electr[oó]nica/i,
    '103': /telefon|telecom|radioenlace|enlace|internet|voz|voceo|comunicacion|comunicaci[oó]n|portero|porter[ií]a/i,
    '104': /software|digitaliza|aplicaci[oó]n|trazabilidad|web|erp|api|sistema de gesti[oó]n|sistema de ventas/i,
    '105': /soporte|mantenimiento|guardia|mesa de ayuda|reparaci[oó]n|asistencia|monitoreo/i,
    '106': /consultor[ií]a|ingenier[ií]a|asesoramiento|auditor[ií]a|relevamiento|proyecto ejecutivo/i,
    '107': /incendio|detecci[oó]n|\bsdi\b|detector/i,
    '108': /el[eé]ctric|energ[ií]a|\bups\b|tablero|tierra|bater[ií]a|generador|circuito/i,
  };
  const unprovenPlacement: Record<string, number[]> = { industria: [3099,3113,3213,3224], constructoras: [3119,3082], gobiernosectorpublico: [3078] };
  return stories.filter(s => isShowcaseProject(s) && !(sector && unprovenPlacement[sector]?.includes(s.id)) && (!service || !scope[service] || scope[service].test(service === '104' && genericTitle.test(s.title) ? s.summary : `${s.title} ${s.summary}`)));
}
