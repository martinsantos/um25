import { canonicalUrl, publicImageUrl } from './seoUrl';
import { generateSlug } from './slugUtils.js';

export type AntecedenteQuality =
  | 'strong-case'
  | 'needs-editorial-review'
  | 'low-value-candidate'
  | 'data-error-candidate';

export interface AntecedenteCuration {
  quality: AntecedenteQuality;
  issues: string[];
  isPromotable: boolean;
  displayTitle: string;
  displayDescription: string;
  displayYear: string;
  canonicalPath: string;
}

export type CuratedAntecedente<T extends Record<string, any> = Record<string, any>> = T & {
  curation: AntecedenteCuration;
  displayTitle: string;
  displayDescription: string;
  displayYear: string;
  canonicalPath: string;
};

const DATA_ERROR_PATTERNS: Array<[RegExp, string]> = [
  [/\bsistena\b/i, 'typo:sistena'],
  [/\bremplazo\b/i, 'typo:remplazo'],
  [/\bunivercidad\b/i, 'typo:univercidad'],
  [/\bcpamaras\b/i, 'typo:cpamaras'],
  [/\bpusaldor\b/i, 'typo:pusaldor'],
  [/\bmunicip$/i, 'truncated:municip'],
];

const LOW_VALUE_PATTERNS: Array<[RegExp, string]> = [
  [/\b(dis[ck]o duro|nas\s*\d+tb|ssd|memoria ram|ram\s*\d+gb)\b/i, 'minor-supply:storage-memory'],
  [/\b(pc\s*\+\s*monitor|computadora\s*\+\s*monitor|pcs?\s+con\s+monitor)\b/i, 'minor-supply:monitor'],
  [/\bmonitor\s*(22|24|pulgadas|")?\b/i, 'minor-supply:monitor'],
  [/\btablets?\b/i, 'minor-supply:tablet'],
  [/\bproyector\b/i, 'minor-supply:projector'],
  [/\bcomodato\b/i, 'commercial-loan:comodato'],
  [/\bremanente de proyectos\b/i, 'minor-supply:remanent-sale'],
];

const GENERIC_PATTERNS: Array<[RegExp, string]> = [
  [/\bprovisi[oó]n de\b/i, 'generic-provision'],
  [/\basistencia t[eé]cnica\b/i, 'generic:asistencia-tecnica'],
  [/\bvisita t[eé]cnica\b/i, 'generic:visita-tecnica'],
  [/\bconfiguraci[oó]n\b/i, 'generic:configuracion'],
  [/\btrabajos varios\b/i, 'generic:trabajos-varios'],
];

const STRATEGIC_PATTERNS = [
  /\bdesarrollo de software\b/i,
  /\bdigitalizaci[oó]n\b/i,
  /\bimplementaci[oó]n de redes\b/i,
  /\bfibra [oó]ptica\b/i,
  /\bdata center\b/i,
  /\binfraestructura\b/i,
  /\bmantenimiento cr[ií]tico\b/i,
  /\bdetecci[oó]n de incendios\b/i,
  /\bseguridad electr[oó]nica\b/i,
  /\bgesti[oó]n y monitoreo\b/i,
  /\bsoporte de infraestructura\b/i,
  /\balta disponibilidad\b/i,
  /\bcorrientes d[eé]biles\b/i,
  /\bcctv\b/i,
  /\bvideo vigilancia\b/i,
];

const QUALITY_RANK: Record<AntecedenteQuality, number> = {
  'strong-case': 0,
  'needs-editorial-review': 1,
  'low-value-candidate': 2,
  'data-error-candidate': 3,
};

export function cleanAntecedenteText(value: unknown): string {
  return String(value ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function fixKnownTextErrors(value: string): string {
  return value
    .replace(/\bSistena\b/g, 'Sistema')
    .replace(/\bsistena\b/g, 'sistema')
    .replace(/\bRemplazo\b/g, 'Reemplazo')
    .replace(/\bremplazo\b/g, 'reemplazo')
    .replace(/\bUnivercidad\b/g, 'Universidad')
    .replace(/\bunivercidad\b/g, 'universidad')
    .replace(/\bcpamaras\b/g, 'cámaras')
    .replace(/\bCpamaras\b/g, 'Cámaras')
    .replace(/\bpusaldor\b/g, 'pulsador')
    .replace(/\bPusaldor\b/g, 'Pulsador')
    .replace(/\btecnica\b/g, 'técnica')
    .replace(/\bTecnica\b/g, 'Técnica')
    .replace(/\btelefonico\b/g, 'telefónico')
    .replace(/\bTelefonico\b/g, 'Telefónico')
    .replace(/\bAmpliacion\b/g, 'Ampliación')
    .replace(/\bampliacion\b/g, 'ampliación')
    .replace(/\bmodulo\b/g, 'módulo')
    .replace(/\bModulo\b/g, 'Módulo');
}

function uniqueIssues(issues: string[]): string[] {
  return [...new Set(issues.filter(Boolean))];
}

function isTemplateDescription(title: string, description: string): boolean {
  if (!title || !description) return false;
  const normalizedTitle = title.toLowerCase().replace(/\s+/g, ' ').trim();
  const normalizedDescription = description.toLowerCase().replace(/\s+/g, ' ').trim();

  return normalizedDescription.startsWith(`${normalizedTitle} cliente:`)
    || /^.+?\s+cliente:\s+.+?\.\s+sector:\s+.+?\.?$/i.test(description);
}

function getDateTime(value: unknown): number {
  const raw = cleanAntecedenteText(value);
  if (!raw || /invalid date/i.test(raw)) return 0;
  const parsed = new Date(raw).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function formatAntecedenteYear(value: unknown): string {
  const raw = cleanAntecedenteText(value);
  if (!raw || /invalid date/i.test(raw)) return 'documentado';
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) return String(parsed.getFullYear());
  const year = raw.match(/\b(19\d{2}|20\d{2})\b/)?.[1];
  return year || 'documentado';
}

export function formatAntecedenteDate(value: unknown): string {
  const raw = cleanAntecedenteText(value);
  if (!raw || /invalid date/i.test(raw)) return '';
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return '';

  return parsed.toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'long',
  });
}

function buildDisplayTitle(item: Record<string, any>): string {
  const title = fixKnownTextErrors(cleanAntecedenteText(item.Titulo || item.Nombre || 'Antecedente técnico documentado'));
  return title
    .replace(/\s+\(\d+\)$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function humanizeTemplateDescription(title: string, description: string): string {
  const match = description.match(/^(.+?)\s+Cliente:\s+(.+?)\.\s+Sector:\s+(.+?)\.?$/i);
  if (!match) return description;

  const [, sourceTitle, client, sector] = match.map((part) => fixKnownTextErrors(cleanAntecedenteText(part)));
  return `Antecedente de ${sourceTitle || title} para ${client}, dentro de ${sector}.`;
}

function buildDisplayDescription(item: Record<string, any>, displayTitle: string): string {
  const title = cleanAntecedenteText(item.Titulo || item.Nombre);
  const description = fixKnownTextErrors(cleanAntecedenteText(item.Descripcion || item.descripcion || ''));
  const client = cleanAntecedenteText(item.Cliente);
  const sector = cleanAntecedenteText(item.Area || item.Unidad_de_negocio);

  if (description && isTemplateDescription(title, description)) {
    return humanizeTemplateDescription(displayTitle, description);
  }

  if (description.length >= 70) return description;

  const factualParts = [
    description || displayTitle,
    client ? `Cliente: ${client}` : '',
    sector ? `Sector: ${sector}` : '',
  ].filter(Boolean);

  const combined = factualParts.join('. ').replace(/\.\s*\./g, '.');
  return combined.endsWith('.') ? combined : `${combined}.`;
}

export function getAntecedenteIssues(item: Record<string, any>): string[] {
  const title = cleanAntecedenteText(item.Titulo || item.Nombre);
  const description = cleanAntecedenteText(item.Descripcion || item.descripcion);
  const combined = `${title} ${description}`;
  const issues: string[] = [];

  if (title.length > 95) issues.push('title-too-long');
  if (title.includes('...') || title.includes('…')) issues.push('title-truncated-ellipsis');
  if (description.includes('...') || description.includes('…')) issues.push('description-truncated-ellipsis');
  if (/\(\d+\)$/.test(title)) issues.push('duplicate-sequence-suffix');
  if (/cliente confidencial/i.test(title)) issues.push('confidential-client-in-title');
  if (description.length > 0 && description.length < 70) issues.push('description-too-short-for-seo');
  if (description.length > 0 && description.split(/\s+/).filter(Boolean).length < 10) issues.push('description-too-few-words');
  if (description && !/[.!?)]$/.test(description)) issues.push('description-no-terminal-punctuation');
  if (isTemplateDescription(title, description)) issues.push('description-only-template');

  for (const [pattern, issue] of DATA_ERROR_PATTERNS) {
    if (pattern.test(combined)) issues.push(issue);
  }

  for (const [pattern, issue] of LOW_VALUE_PATTERNS) {
    if (pattern.test(combined)) issues.push(issue);
  }

  for (const [pattern, issue] of GENERIC_PATTERNS) {
    if (pattern.test(combined)) issues.push(issue);
  }

  return uniqueIssues(issues);
}

function classifyAntecedente(item: Record<string, any>, issues: string[]): AntecedenteQuality {
  const rawTitle = cleanAntecedenteText(item.Titulo || item.Nombre);
  const rawDescription = cleanAntecedenteText(item.Descripcion || item.descripcion).replace(/\s+Cliente:\s+.+$/i, '');
  const contentText = `${rawTitle} ${rawDescription}`;
  const hasDataError = issues.some((issue) => issue.startsWith('typo:') || issue.startsWith('truncated:'));
  const hasLowValueSignal = issues.some((issue) => issue.startsWith('minor-supply:') || issue.startsWith('commercial-loan:'));
  const hasStrategicSignal = STRATEGIC_PATTERNS.some((pattern) => pattern.test(contentText));
  const hasNamedClient = cleanAntecedenteText(item.Cliente).length >= 3;
  const hasSector = cleanAntecedenteText(item.Area || item.Unidad_de_negocio).length >= 3;
  const hasDate = formatAntecedenteYear(item.Fecha) !== 'documentado';

  if (hasDataError) return 'data-error-candidate';
  if (hasLowValueSignal && !hasStrategicSignal) return 'low-value-candidate';
  if (hasStrategicSignal && hasNamedClient && hasSector && hasDate && !issues.includes('confidential-client-in-title')) {
    return 'strong-case';
  }
  return 'needs-editorial-review';
}

export function curateAntecedente<T extends Record<string, any>>(item: T): CuratedAntecedente<T> {
  const issues = getAntecedenteIssues(item);
  const quality = classifyAntecedente(item, issues);
  const displayTitle = buildDisplayTitle(item);
  const displayDescription = buildDisplayDescription(item, displayTitle);
  const slug = generateSlug(cleanAntecedenteText(item.Titulo || item.Nombre || displayTitle));
  const canonicalPath = `/antecedentes/${item.id}/${slug}`;
  const curation: AntecedenteCuration = {
    quality,
    issues,
    isPromotable: quality === 'strong-case',
    displayTitle,
    displayDescription,
    displayYear: formatAntecedenteYear(item.Fecha),
    canonicalPath,
  };

  return {
    ...item,
    curation,
    displayTitle,
    displayDescription,
    displayYear: curation.displayYear,
    canonicalPath,
  };
}

export function isPromotableAntecedente(item: Record<string, any>): boolean {
  return item?.curation?.isPromotable === true || curateAntecedente(item).curation.isPromotable;
}

export function sortAntecedentesForPublicList<T extends Record<string, any>>(items: T[]): CuratedAntecedente<T>[] {
  return items
    .map((item) => ('curation' in item ? item as CuratedAntecedente<T> : curateAntecedente(item)))
    .sort((a, b) => {
      const qualityDiff = QUALITY_RANK[a.curation.quality] - QUALITY_RANK[b.curation.quality];
      if (qualityDiff !== 0) return qualityDiff;
      const dateDiff = getDateTime(b.Fecha) - getDateTime(a.Fecha);
      if (dateDiff !== 0) return dateDiff;
      return Number(b.id || 0) - Number(a.id || 0);
    });
}

export function buildAntecedenteListItemStructuredData(item: Record<string, any>, position: number) {
  const curated = 'curation' in item ? item as CuratedAntecedente : curateAntecedente(item);
  const imageUrl = publicImageUrl(curated.imageUrl || curated.Imagen || '');
  const datePublished = formatAntecedenteDate(curated.Fecha) ? cleanAntecedenteText(curated.Fecha) : undefined;

  return {
    '@type': 'ListItem',
    position,
    url: canonicalUrl(curated.canonicalPath),
    name: curated.displayTitle,
    item: {
      '@type': 'CreativeWork',
      name: curated.displayTitle,
      description: curated.displayDescription,
      url: canonicalUrl(curated.canonicalPath),
      image: imageUrl || undefined,
      datePublished,
      about: curated.Area ? { '@type': 'Thing', name: cleanAntecedenteText(curated.Area) } : undefined,
      mentions: curated.Cliente ? [{ '@type': 'Organization', name: cleanAntecedenteText(curated.Cliente) }] : undefined,
      identifier: curated.id ? `ANT-${curated.id}` : undefined,
    },
  };
}
