import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';

export const EMOJI_RE =
  /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]|[\u{1F1E6}-\u{1F1FF}]{2}/gu;

const HTML_TAG_RE =
  /<\/?(p|h[1-6]|ul|ol|li|table|thead|tbody|tr|td|th|pre|blockquote|figure|img|a|strong|em|code)\b/i;

const GENERIC_MARKETING_PATTERNS: Array<[RegExp, string]> = [
  [/Transformar su [Nn]egocio\.?/gi, ''],
  [/Tecnología que trabaja para su negocio\.?/gi, ''],
  [/Soluciones [Dd]igitales a [Mm]edida para /gi, ''],
  [/Olvídese de los cuellos de botella\.?\s*/gi, ''],
  [/Un patch panel bien instalado es la diferencia entre encontrar un problema en minutos o en horas\.?\s*/gi, ''],
  [/La diferencia entre encontrar un problema en minutos o en horas\.?\s*/gi, ''],
  [/No instalamos cables, construimos infraestructura\.?\s*/gi, ''],
  [/No confíe en "funciona bien"\.?\s*/gi, ''],
  [/Ejecución integral de [^.]+\.\s*/gi, ''],
  [/,\s*asegurando continuidad operativa y cumplimiento de estándares técnicos de calidad\.?\s*/gi, ''],
  [/Solución implementada por el equipo de ingeniería de Última Milla\.?\s*/gi, ''],
];

/** Texto plano sin emojis ni espacios redundantes (JSON / Directus / CMS). */
export function sanitizeEditorialText(value: unknown): string {
  if (value == null) return '';
  return String(value)
    .replace(EMOJI_RE, '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function stripHtml(value: unknown): string {
  return sanitizeEditorialText(String(value || '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

/** Alias usado en blog, antecedentes y servicios para excerpts SEO/UI. */
export function plainTextFromHtml(value: unknown, maxLength?: number): string {
  const plain = stripHtml(value);
  if (!maxLength || plain.length <= maxLength) return plain;
  return `${plain.slice(0, maxLength - 1)}…`;
}

export function truncateEditorialText(value: unknown, maxLength: number): string {
  return plainTextFromHtml(value, maxLength);
}

const DISPLAY_CONNECTORS = new Set([
  'a',
  'al',
  'con',
  'de',
  'del',
  'e',
  'el',
  'en',
  'la',
  'las',
  'los',
  'para',
  'por',
  'y',
]);

const DISPLAY_ACRONYMS = new Map([
  ['ai', 'AI'],
  ['api', 'API'],
  ['cctv', 'CCTV'],
  ['co2', 'CO2'],
  ['crm', 'CRM'],
  ['dvr', 'DVR'],
  ['erp', 'ERP'],
  ['ia', 'IA'],
  ['ip', 'IP'],
  ['it', 'IT'],
  ['nvr', 'NVR'],
  ['odf', 'ODF'],
  ['pa', 'PA'],
  ['s.a', 'S.A.'],
  ['sa', 'SA'],
  ['s.a.s', 'S.A.S.'],
  ['sas', 'SAS'],
  ['sdi', 'SDI'],
  ['s.r.l', 'S.R.L.'],
  ['srl', 'SRL'],
  ['ups', 'UPS'],
  ['ute', 'UTE'],
  ['vms', 'VMS'],
]);

const NAME_LETTER_RE = /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g;
const LOWERCASE_LETTER_RE = /[a-záéíóúüñ]/;
const TOKEN_CORE_RE = /^([^A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9]*)(.*?)([^A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9]*)$/u;

function isUppercaseDisplayCandidate(value: string): boolean {
  const letters = value.match(NAME_LETTER_RE) || [];
  if (letters.length < 4) return false;
  return !LOWERCASE_LETTER_RE.test(value);
}

function displayTokenKey(value: string): string {
  return value
    .toLocaleLowerCase('es-AR')
    .replace(/[^a-z0-9áéíóúüñ.]/g, '')
    .replace(/\.+$/g, '');
}

function capitalizeDisplayCore(core: string, tokenIndex: number): string {
  const lower = core.toLocaleLowerCase('es-AR');
  if (tokenIndex > 0 && DISPLAY_CONNECTORS.has(lower)) return lower;
  return `${lower.charAt(0).toLocaleUpperCase('es-AR')}${lower.slice(1)}`;
}

/** Capitalización editorial para nombres que llegan del CMS en mayúsculas. */
export function formatDisplayName(value: unknown): string {
  const text = stripHtml(value);
  if (!text || !isUppercaseDisplayCandidate(text)) return text;

  let tokenIndex = 0;
  return text
    .split(/(\s+)/)
    .map((token) => {
      if (/^\s+$/.test(token)) return token;
      const key = displayTokenKey(token).replace(/\./g, '');
      const dottedKey = displayTokenKey(token);
      const acronym = DISPLAY_ACRONYMS.get(dottedKey) || DISPLAY_ACRONYMS.get(key);
      if (acronym) {
        tokenIndex += 1;
        return acronym;
      }

      const match = token.match(TOKEN_CORE_RE);
      if (!match || !match[2]) return token;
      const [, prefix, core, suffix] = match;
      const formattedCore = capitalizeDisplayCore(core, tokenIndex);
      tokenIndex += 1;
      return `${prefix}${formattedCore}${suffix}`;
    })
    .join('');
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Reemplaza nombres crudos del CMS por su forma editorial en excerpts visibles. */
export function applyDisplayNameReplacements(value: unknown, names: unknown[] = []): string {
  let text = stripHtml(value);
  const uniqueNames = [...new Set(names.map(stripHtml).filter(Boolean))].sort((a, b) => b.length - a.length);

  for (const rawName of uniqueNames) {
    const displayName = formatDisplayName(rawName);
    if (!displayName || displayName === rawName) continue;
    text = text.replace(new RegExp(`${escapeRegExp(rawName)}(?:\\s*\\(\\d+\\))?`, 'g'), displayName);
  }

  return text;
}

/** Elimina frases genéricas de marketing antes de renderizar body copy. */
export function stripMarketingFluff(value: unknown): string {
  let clean = sanitizeEditorialText(value);
  for (const [pattern, replacement] of GENERIC_MARKETING_PATTERNS) {
    clean = clean.replace(pattern, replacement);
  }
  clean = clean
    .replace(/\bes\s+(?=[A-ZÁÉÍÓÚÑ])/g, '. ')
    .replace(/\.\s+\./g, '.')
    .replace(/\s+/g, ' ')
    .trim();
  return stripBannedLedgerPhrases(clean);
}

export function sanitizeMarketingCopy(value: unknown, maxLength?: number): string {
  const clean = stripMarketingFluff(value);
  if (maxLength && clean.length > maxLength) {
    return `${clean.slice(0, maxLength - 1)}…`;
  }
  return clean;
}

/** Frases rechazadas en DESIGN.md (ledger de copy UMSA). */
export const LEDGER_BANNED_COPY =
  /soluciones integrales|transformaci[oó]n digital|innovaci[oó]n tecnol[oó]gica|potenciamos/i;

const LEDGER_REPLACEMENTS: Array<[RegExp, string]> = [
  [/soluciones integrales/gi, 'alcance técnico'],
  [/transformaci[oó]n digital/gi, 'arquitectura y procesos'],
  [/innovaci[oó]n tecnol[oó]gica/gi, 'ingeniería aplicada'],
  [/potenciamos/gi, 'documentamos'],
  [/99[.,]\d+%/gi, '24/7'],
];

export function containsBannedLedgerCopy(value: unknown): boolean {
  return LEDGER_BANNED_COPY.test(String(value || '')) || /99[.,]\d+%/.test(String(value || ''));
}

/** Elimina frases del ledger y claims de precisión no soportados (DESIGN.md). */
export function stripBannedLedgerPhrases(value: unknown): string {
  let text = sanitizeEditorialText(value);
  for (const [pattern, replacement] of LEDGER_REPLACEMENTS) {
    text = text.replace(pattern, replacement);
  }
  return text.replace(/\s{2,}/g, ' ').replace(/\s+([,.;])/g, '$1').trim();
}

export function stripBannedLedgerFromHtml(html: string): string {
  let out = String(html || '');
  for (const [pattern, replacement] of LEDGER_REPLACEMENTS) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

/** Directus entrega `Subtitulo`; snapshots/JS pueden usar `subtitulo`. */
export function readServiceSubtitulo(servicio: {
  subtitulo?: string;
  Subtitulo?: string;
}): string {
  return String(servicio.subtitulo || servicio.Subtitulo || '').trim();
}

export function sanitizeServicePageTitle(
  serviceId: number,
  cmsTitle: string,
  fallback?: string,
  preferCms = false,
): string {
  if (preferCms) {
    const fromCms = stripBannedLedgerPhrases(cmsTitle.split('|')[0]?.trim() || cmsTitle);
    return fromCms || 'Servicio IT';
  }

  const heroTitles: Record<number, string> = {
    101: 'Redes y conectividad',
    102: 'Seguridad electrónica',
    103: 'Telecomunicaciones',
    104: 'Software a medida',
    105: 'Soporte 24/7',
    106: 'Consultoría IT',
    107: 'Detección de incendios',
    108: 'Energía para IT',
  };
  const base =
    heroTitles[serviceId] ||
    fallback ||
    stripBannedLedgerPhrases(cmsTitle.split('|')[0]?.trim() || cmsTitle);
  return base || 'Servicio IT';
}

export function sanitizeProductTitle(value: unknown): string {
  const cleaned = stripBannedLedgerPhrases(value);
  if (!cleaned) return 'Equipamiento';
  return cleaned;
}

export function serviceHeroLead(
  subtitulo: unknown,
  visualProof: string | undefined,
  pageDescription: string,
  bodyPlainPrefix?: string,
): string {
  const cleanedSub = subtitulo ? sanitizeMarketingCopy(subtitulo, 220) : '';
  if (cleanedSub && !containsBannedLedgerCopy(cleanedSub)) return cleanedSub;
  if (visualProof && !containsBannedLedgerCopy(visualProof)) return visualProof;

  const cleanedPage = sanitizeMarketingCopy(pageDescription, 220);
  const bodyPrefix = bodyPlainPrefix ? sanitizeMarketingCopy(bodyPlainPrefix, 120) : '';
  const duplicatesBody =
    Boolean(bodyPrefix && cleanedPage) &&
    cleanedPage.slice(0, 72).toLowerCase() === bodyPrefix.slice(0, 72).toLowerCase();

  if (cleanedPage && !containsBannedLedgerCopy(cleanedPage) && !duplicatesBody) {
    return cleanedPage;
  }
  return visualProof || cleanedSub || 'Alcance técnico con evidencia y soporte en sitio.';
}

export function sanitizeServiceStats(stats: Array<{ value?: string; label?: string; valor?: string }> = []) {
  return stats
    .map((stat) => {
      const value = String(stat?.value ?? stat?.valor ?? '');
      const label = String(stat?.label || '');
      if (/99[\.,]\d+%/.test(value) || /uptime|disponibilidad/i.test(label)) {
        return { ...stat, value: '24/7', label: 'Operación' };
      }
      if (/100\s*%/.test(value) && /certific/i.test(label)) {
        return null;
      }
      if (/\b469\+|\b518\+/.test(value) || /proyectos ejecutados/i.test(label)) {
        return null;
      }
      if (/\bISO\s*(9001|27001|14001)/i.test(`${value} ${label}`)) {
        return null;
      }
      return stat;
    })
    .filter(Boolean) as Array<{ value?: string; label?: string; valor?: string }>;
}

/** Filtra bullets CMS con certificaciones corporativas no acreditadas en el sitio. */
export function sanitizeServiceBulletList(items: string[] = []): string[] {
  return items.filter((item) => {
    const text = String(item || '');
    if (!text.trim()) return false;
    if (/\bISO\s*(9001|27001|14001|45001)\b/i.test(text)) return false;
    if (/PCI\s*DSS/i.test(text)) return false;
    if (containsBannedLedgerCopy(text)) return false;
    return true;
  });
}

/** CMS a veces entrega HTML con `**negrita**` sin parsear — lo normalizamos. */
function htmlBlockFromLiteralMarkdown(text: string): string {
  const clean = text.trim();
  if (!clean) return '';

  if (/^-\s+/.test(clean)) {
    const items = clean
      .replace(/^-\s+/, '')
      .split(/\s+-\s+/)
      .map((item) => item.trim())
      .filter(Boolean);

    if (items.length > 0) {
      return `<ul>${items.map((item) => `<li>${item}</li>`).join('')}</ul>`;
    }
  }

  return `<p>${clean}</p>`;
}

function fixLiteralMarkdownHeadingsInParagraph(inner: string): string {
  if (!/\s##\s+/.test(inner)) return `<p>${inner}</p>`;

  const headingRegex = /\s##\s+(.{1,140}?)(?=\s+(?:El|La|Los|Las|Un|Una|En|Si|Cuando|Cada|Zammad|FleetDM|OpenWISP|Caddy|ARCA|ENACOM|Grafana|PostGIS|LibreNMS|GitHub)\s+[a-záéíóúñ]|\s+-\s+<a\b|$)/g;
  const blocks: string[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = headingRegex.exec(inner)) !== null) {
    const before = inner.slice(cursor, match.index);
    blocks.push(htmlBlockFromLiteralMarkdown(before));
    blocks.push(`<h2>${match[1].trim()}</h2>`);
    cursor = match.index + match[0].length;
  }

  blocks.push(htmlBlockFromLiteralMarkdown(inner.slice(cursor)));
  return blocks.filter(Boolean).join('');
}

export function fixLiteralMarkdownInHtml(html: string): string {
  return String(html || '')
    .replace(/\*\*([^*<]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(?<![\w/])__([^_<]+)__(?![\w/])/g, '<strong>$1</strong>')
    .replace(/<p>([\s\S]*?)<\/p>/gi, (_match, inner) => fixLiteralMarkdownHeadingsInParagraph(inner));
}

export async function markdownToHtml(markdown: string): Promise<string> {
  const cleaned = sanitizeEditorialText(markdown);

  const hasHtml = HTML_TAG_RE.test(cleaned);
  const hasMarkdownBlocks = /(^|\n)\s{0,3}(#{1,6}\s+|[-*+]\s+|\d+\.\s+)/m.test(cleaned);

  if (hasHtml && !hasMarkdownBlocks) {
    return fixLiteralMarkdownInHtml(cleaned);
  }

  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeStringify)
    .process(cleaned);
  return String(result);
}

/** Body copy con Markdown renderizado (párrafos, negritas, listas). */
export async function renderEditorialBody(raw: unknown): Promise<string> {
  const cleaned = stripMarketingFluff(raw);
  if (!cleaned) return '';

  const html = await markdownToHtml(cleaned);
  if (/<p[\s>]/i.test(html)) return stripBannedLedgerFromHtml(html);
  if (/<(ul|ol|h[2-4])\b/i.test(html)) return stripBannedLedgerFromHtml(html);

  return stripBannedLedgerFromHtml(
    cleaned
      .split(/\n{2,}/)
      .map((block) => `<p>${block.replace(/\n/g, '<br>')}</p>`)
      .join(''),
  );
}

export function productAnchorId(titulo: string): string {
  return sanitizeEditorialText(titulo)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}
