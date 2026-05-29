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

export function sanitizeServicePageTitle(
  serviceId: number,
  cmsTitle: string,
  fallback?: string,
): string {
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
): string {
  const cleanedSub = subtitulo ? sanitizeMarketingCopy(subtitulo, 220) : '';
  if (cleanedSub && !containsBannedLedgerCopy(cleanedSub)) return cleanedSub;
  if (visualProof && !containsBannedLedgerCopy(visualProof)) return visualProof;
  const cleanedPage = sanitizeMarketingCopy(pageDescription, 220);
  if (cleanedPage && !containsBannedLedgerCopy(cleanedPage)) return cleanedPage;
  return visualProof || 'Alcance técnico documentado con evidencia y soporte en sitio.';
}

export function sanitizeServiceStats(stats: Array<{ value?: string; label?: string }> = []) {
  return stats.map((stat) => {
    const value = String(stat?.value || '');
    const label = String(stat?.label || '');
    if (/99[\.,]\d+%/.test(value) || /uptime|disponibilidad/i.test(label)) {
      return { ...stat, value: '24/7', label: 'Operación' };
    }
    return stat;
  });
}

/** CMS a veces entrega HTML con `**negrita**` sin parsear — lo normalizamos. */
export function fixLiteralMarkdownInHtml(html: string): string {
  return String(html || '')
    .replace(/\*\*([^*<]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(?<![\w/])__([^_<]+)__(?![\w/])/g, '<strong>$1</strong>');
}

export async function markdownToHtml(markdown: string): Promise<string> {
  const cleaned = sanitizeEditorialText(markdown);

  if (HTML_TAG_RE.test(cleaned)) {
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
