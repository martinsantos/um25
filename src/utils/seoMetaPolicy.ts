import { SITE_NAME } from '../config/seo';

export const SEO_META_LIMITS = {
  title: 70,
  description: 160,
  minimumDescription: 70,
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
  return `Antecedente de ${title} para ${client}, dentro de ${sector}.`;
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
  if (sentenceEnd > maxLength * 0.55) {
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
  const title = cleanSeoText(input.title) || 'Antecedente técnico';
  const client = cleanSeoText(input.client);
  const area = cleanSeoText(input.area);
  const year = cleanSeoText(input.date).match(/\b(20\d{2}|19\d{2})\b/)?.[1] || '';
  const identifier = cleanSeoText(input.identifier);
  const caseCode = identifier ? `UM-${identifier}` : '';
  const clientIsGeneric = /cliente\s+confidencial/i.test(client);
  const clientRepeatsTitle = client ? appearsInsideTitle(title, client) : false;
  const areaRepeatsTitle = area ? appearsInsideTitle(title, area) : false;
  const contextParts = uniqueContextParts([
    client && !clientIsGeneric && !clientRepeatsTitle ? client : '',
    clientIsGeneric && caseCode ? `Confidencial ${caseCode}` : '',
    !areaRepeatsTitle && !client && caseCode ? area : '',
    clientRepeatsTitle && caseCode ? caseCode : '',
    !client && !area && caseCode && year ? year : '',
    !client && !area && !year ? caseCode : '',
  ].filter(Boolean));

  if (contextParts.length === 0) return buildHumanSeoTitle(title);

  const siteName = SITE_NAME;
  const maxLength = SEO_META_LIMITS.title;
  const suffix = ` | ${siteName}`;
  const available = Math.max(24, maxLength - suffix.length);
  const minBaseLength = Math.min(28, Math.max(20, Math.floor(available * 0.46)));
  const maxContextLength = Math.max(14, available - minBaseLength - 3);
  const context = trimAtWordBoundary(contextParts.join(' · '), maxContextLength);
  const baseLength = Math.max(18, available - context.length - 3);
  const compactTitle = trimAtWordBoundary(title, baseLength);

  return `${compactTitle} · ${context}${suffix}`.slice(0, maxLength).trim();
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

  const fallbackText = fallbackParts
    .map((part) => cleanSeoText(part))
    .filter(Boolean)
    .join('. ');
  const generic = lang === 'en'
    ? 'Clear context, scope and next steps from ULTIMA MILLA for business technology decisions.'
    : 'Contexto claro, alcance y próximos pasos de ULTIMA MILLA para decisiones tecnológicas empresariales.';
  const combined = [primaryText, fallbackText, generic].filter(Boolean).join('. ');

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
  ]);

  return {
    title: buildCaseSeoTitle(input),
    description,
  };
}

export function buildBlogSeoMeta(input: BlogSeoMetaInput) {
  const lang = input.lang ?? 'es';
  const title = cleanSeoText(input.title) || (lang === 'en' ? 'Article' : 'Articulo');
  const category = cleanSeoText(input.category);
  const description = buildHumanSeoDescription(input.summary, [
    title,
    category ? (lang === 'en' ? `Topic: ${category}` : `Tema: ${category}`) : '',
  ], { lang });

  return {
    title: buildHumanSeoTitle(title),
    description,
  };
}
