import { SITE_NAME } from '../config/seo';

export const SEO_META_LIMITS = {
  title: 60,
  minimumTitle: 30,
  description: 160,
  minimumDescription: 120,
} as const;

export const SEO_META_POLICY_SUMMARY = [
  'Conservar el titulo humano de la pagina como fuente principal.',
  'No inventar nombres propios, clientes, marcas, ubicaciones ni atributos para diferenciar metatags.',
  'Usar solo datos reales disponibles en la pagina o en el CMS.',
  'Escribir descripciones como frases completas, amables y utiles para personas.',
  'Ajustar longitud con cortes naturales, no con keyword stuffing.',
] as const;

export type SeoLanguage = 'es' | 'en';

export interface BuildSeoTitleOptions {
  siteName?: string;
  maxLength?: number;
}

export interface BuildSeoDescriptionOptions {
  lang?: SeoLanguage;
  maxLength?: number;
  minLength?: number;
  /** Frase de cierre propia del tipo de página cuando el texto real no alcanza. */
  generic?: string;
}

export interface CaseSeoMetaInput {
  title?: unknown;
  description?: unknown;
  area?: unknown;
  date?: unknown;
  client?: unknown;
  identifier?: unknown;
}

export interface BlogSeoMetaInput {
  title?: unknown;
  summary?: unknown;
  category?: unknown;
  lang?: SeoLanguage;
}

function humanizeCaseDescriptionTemplate(value: string): string {
  const match = value.match(/^(.+?)\s+Cliente:\s+(.+?)\.\s+Sector:\s+(.+?)\.?$/i);
  if (!match) return value;

  const [, title, client, sector] = match.map((part) => cleanSeoText(part));
  return `Antecedente de ${title.replace(/[.\s]+$/, '')} para ${client}, dentro de ${sector}.`;
}

const htmlEntities: Record<string, string> = {
  amp: '&',
  quot: '"',
  apos: "'",
  '#39': "'",
  lt: '<',
  gt: '>',
  nbsp: ' ',
};

export function cleanSeoText(value: unknown): string {
  return String(value ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&([a-zA-Z0-9#]+);/g, (match, entity) => htmlEntities[entity] ?? match)
    .replace(/&#(\d+);/g, (_match, code) => String.fromCharCode(Number(code)))
    .replace(/([.!?])(?:\s*[.!?])+/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripExistingBrand(value: string, siteName: string): string {
  const escaped = siteName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return value
    .replace(new RegExp(`\\s*[|·-]\\s*${escaped}\\s*$`, 'i'), '')
    .replace(new RegExp(`^${escaped}\\s*[|·-]\\s*`, 'i'), '')
    .trim();
}

export function trimAtWordBoundary(value: unknown, maxLength = SEO_META_LIMITS.description): string {
  const clean = cleanSeoText(value);
  if (clean.length <= maxLength) return clean;

  const sliced = clean.slice(0, Math.max(0, maxLength - 1)).trimEnd();
  const sentenceEnd = Math.max(
    sliced.lastIndexOf('. '),
    sliced.lastIndexOf('? '),
    sliced.lastIndexOf('! '),
  );
  // Cortar en una oración sólo si lo que queda sigue siendo una descripción útil
  // (≥120 con el límite de 160). Antes cortaba al 55 % y dejaba 88–119 caracteres.
  const minSentenceKeep = maxLength >= SEO_META_LIMITS.minimumDescription
    ? SEO_META_LIMITS.minimumDescription
    : maxLength * 0.55;
  if (sentenceEnd >= minSentenceKeep) {
    return sliced.slice(0, sentenceEnd + 1).trim();
  }

  const lastSpace = sliced.lastIndexOf(' ');
  const cleanCut = lastSpace > maxLength * 0.65 ? sliced.slice(0, lastSpace) : sliced;
  return `${cleanCut.replace(/[.,;:!?-]+$/g, '')}…`;
}

export function buildHumanSeoTitle(rawTitle: unknown, options: BuildSeoTitleOptions = {}): string {
  const siteName = options.siteName ?? SITE_NAME;
  const maxLength = options.maxLength ?? SEO_META_LIMITS.title;
  const fallbackTitle = siteName === 'ULTIMA MILLA'
    ? 'Servicios IT para empresas'
    : siteName;
  const cleanTitle = stripExistingBrand(cleanSeoText(rawTitle), siteName) || fallbackTitle;
  const suffix = ` | ${siteName}`;
  const available = Math.max(24, maxLength - suffix.length);
  const compactTitle = trimAtWordBoundary(cleanTitle, available);

  return `${compactTitle}${suffix}`.slice(0, maxLength).trim();
}

function normalizeForSeoComparison(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es-AR')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function appearsInsideTitle(title: string, context: string): boolean {
  const normalizedTitle = normalizeForSeoComparison(title);
  const normalizedContext = normalizeForSeoComparison(context);
  return Boolean(
    normalizedContext.length > 8
    && normalizedTitle.includes(normalizedContext),
  );
}

function uniqueContextParts(parts: string[]): string[] {
  const seen = new Set<string>();
  return parts.filter((part) => {
    const key = normalizeForSeoComparison(part);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildCaseSeoTitle(input: CaseSeoMetaInput): string {
  const title = cleanSeoText(input.title).replace(/\s+-\s+/g, ' · ') || 'Antecedente técnico';
  const client = cleanSeoText(input.client);
  const area = cleanSeoText(input.area);
  const identifier = cleanSeoText(input.identifier);
  const caseCode = identifier ? `UM-${identifier}` : '';
  const clientIsGeneric = /cliente\s+confidencial/i.test(client);
  const usableClient = client && !clientIsGeneric && !appearsInsideTitle(title, client) ? client : '';
  const usableArea = area && !appearsInsideTitle(title, area) ? area : '';
  const suffix = ` | ${SITE_NAME}`;
  const { title: max, minimumTitle: min } = SEO_META_LIMITS;

  const wordTrim = (value: string, limit: number): string => {
    if (value.length <= limit) return value;
    const sliced = value.slice(0, Math.max(0, limit - 1));
    const lastSpace = sliced.lastIndexOf(' ');
    const cut = lastSpace > 8 ? sliced.slice(0, lastSpace) : sliced;
    return `${cut.replace(/[\s.,;:·&|-]+$/g, '')}…`;
  };
  const trimmedClient = (() => {
    if (!usableClient || !caseCode) return '';
    const room = max - title.length - caseCode.length - 6;
    if (room < 12) return '';
    const compact = wordTrim(usableClient, room);
    return compact.length >= 12 ? compact : '';
  })();

  // Título humano completo primero; el cliente y el código público diferencian
  // títulos repetidos. Sólo se recorta por palabra, nunca a mitad de palabra.
  const candidates = [
    usableClient && caseCode ? `${title} · ${usableClient} · ${caseCode}${suffix}` : '',
    usableClient && caseCode ? `${title} · ${usableClient} · ${caseCode}` : '',
    trimmedClient ? `${title} · ${trimmedClient} · ${caseCode}` : '',
    usableClient && !caseCode ? `${title} · ${usableClient}${suffix}` : '',
    caseCode ? `${title} · ${caseCode}${suffix}` : '',
    caseCode ? `${title} · ${caseCode}` : '',
    usableArea && !caseCode ? `${title} · ${usableArea}${suffix}` : '',
    // Si el cliente ya está en el título (origen de los títulos repetidos), el código
    // público los diferencia: si no entra completo, se recorta el título por palabra.
    caseCode && !usableClient && `${title} · ${caseCode}`.length > max ? `${wordTrim(title, max - caseCode.length - 3)} · ${caseCode}` : '',
    `${title}${suffix}`,
    title,
  ].filter(Boolean);

  const fitting = candidates.find((candidate) => candidate.length >= min && candidate.length <= max);
  if (fitting) return fitting;

  const context = [usableClient ? wordTrim(usableClient, 22) : '', caseCode].filter(Boolean).join(' · ');
  if (context) {
    const room = max - context.length - 3;
    if (room >= 18) return `${wordTrim(title, room)} · ${context}`;
  }
  const shortEnough = candidates.filter((candidate) => candidate.length <= max);
  if (shortEnough.length > 0) return shortEnough.sort((a, b) => b.length - a.length)[0]!;
  return wordTrim(title, max);
}

/**
 * Title final para <title>/OG: 30–60 caracteres. Agrega la marca sólo si entra;
 * si no, conserva el título humano completo (la marca ya está en og:site_name).
 */
export function finalizeSeoTitle(rawTitle: unknown, siteName = SITE_NAME): string {
  const base = stripExistingBrand(cleanSeoText(rawTitle), siteName) || 'Servicios IT para empresas';
  const branded = `${base} | ${siteName}`;
  if (branded.length <= SEO_META_LIMITS.title) return branded;
  if (base.length <= SEO_META_LIMITS.title) return base;
  return trimAtWordBoundary(base, SEO_META_LIMITS.title);
}

export function buildHumanSeoDescription(
  primary: unknown,
  fallbackParts: unknown[] = [],
  options: BuildSeoDescriptionOptions = {},
): string {
  const lang = options.lang ?? 'es';
  const maxLength = options.maxLength ?? SEO_META_LIMITS.description;
  const minLength = options.minLength ?? SEO_META_LIMITS.minimumDescription;
  const primaryText = cleanSeoText(primary);

  if (primaryText.length >= minLength) {
    return trimAtWordBoundary(primaryText, maxLength);
  }

  const usedText = normalizeForSeoComparison(primaryText);
  const fallbackText = fallbackParts
    .map((part) => cleanSeoText(part).replace(/[.]+$/g, ''))
    .filter((part) => part && !usedText.includes(normalizeForSeoComparison(part)))
    .join('. ');
  const generic = options.generic ?? (lang === 'en'
    ? 'Clear context, scope and next steps from ULTIMA MILLA for business technology decisions.'
    : 'Contexto claro, alcance y próximos pasos de ULTIMA MILLA para decisiones tecnológicas empresariales.');
  const combined = [primaryText.replace(/[.]+$/g, ''), fallbackText, generic].filter(Boolean).join('. ');

  return trimAtWordBoundary(combined, maxLength);
}

export function buildCaseSeoMeta(input: CaseSeoMetaInput) {
  const title = cleanSeoText(input.title) || 'Antecedente técnico';
  const area = cleanSeoText(input.area);
  const client = cleanSeoText(input.client);
  const year = cleanSeoText(input.date).match(/\b(20\d{2}|19\d{2})\b/)?.[1] || '';
  const sourceDescription = humanizeCaseDescriptionTemplate(cleanSeoText(input.description));
  const description = buildHumanSeoDescription(sourceDescription, [
    title,
    client ? `Proyecto para ${client}` : '',
    area ? `Trabajo relacionado con ${area}` : '',
    year ? `Registro del proyecto en ${year}` : '',
  ], { generic: 'Antecedente técnico documentado por ULTIMA MILLA, servicios IT con sede en Mendoza.' });

  return {
    title: buildCaseSeoTitle(input),
    description,
  };
}

export function buildBlogSeoMeta(input: BlogSeoMetaInput) {
  const lang = input.lang ?? 'es';
  const title = cleanSeoText(input.title) || (lang === 'en' ? 'Article' : 'Articulo');
  const category = cleanSeoText(input.category);
  // El resumen real manda; si no alcanza 120 caracteres se cierra con una firma
  // breve (sin repetir el título ni la categoría).
  const description = buildHumanSeoDescription(input.summary, [
    cleanSeoText(input.summary) ? '' : title,
    cleanSeoText(input.summary) ? '' : category,
  ], {
    lang,
    generic: lang === 'en'
      ? 'Technical reading by ULTIMA MILLA.'
      : 'Lectura técnica de ULTIMA MILLA.',
  });

  return {
    title: finalizeSeoTitle(title),
    description,
  };
}
