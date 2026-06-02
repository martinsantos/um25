import {
  fixLiteralMarkdownInHtml,
  markdownToHtml,
  plainTextFromHtml,
  sanitizeEditorialText,
  stripMarketingFluff,
} from './editorialContent';

const CATEGORY_COLORS: Record<string, string> = {
  noticias: '#111111',
  proyectos: '#DC2626',
  tecnico: '#111111',
  tecnologia: '#111111',
  empresa: '#DC2626',
};

const CATEGORY_LABELS: Record<string, string> = {
  noticias: 'Noticias',
  proyectos: 'Proyectos',
  tecnico: 'Técnico',
  tecnologia: 'Tecnología',
  empresa: 'Empresa',
};

export function getCategoryColor(cat: string): string {
  return CATEGORY_COLORS[cat] || '#111111';
}

export function getCategoryLabel(cat: string): string {
  return CATEGORY_LABELS[cat] || cat;
}

export function formatBlogDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export { markdownToHtml };

export async function addHeadingIds(content: string): Promise<{
  html: string;
  headings: Array<{ level: number; id: string; text: string }>;
}> {
  const normalized = stripMarketingFluff(sanitizeEditorialText(content));
  const html = fixLiteralMarkdownInHtml((await markdownToHtml(normalized))
    .replace(/<h1([^>]*)>/gi, '<h2$1>')
    .replace(/<\/h1>/gi, '</h2>'));

  const headings: Array<{ level: number; id: string; text: string }> = [];
  const usedIds = new Map<string, number>();

  const processed = html.replace(
    /<h([2-4])([^>]*)>([\s\S]*?)<\/h\1>/gi,
    (_match, level, attrs, inner) => {
      const plainText = inner.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      if (!plainText) return _match;

      const baseId = plainText
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 80) || 'seccion';
      const count = usedIds.get(baseId) || 0;
      usedIds.set(baseId, count + 1);
      const id = count > 0 ? `${baseId}-${count + 1}` : baseId;
      const cleanAttrs = String(attrs || '').replace(/\s+id=(["']).*?\1/gi, '');

      headings.push({ level: Number(level), id, text: plainText });
      return `<h${level}${cleanAttrs} id="${id}">${inner}</h${level}>`;
    },
  );

  return { html: processed, headings };
}

export function extractFaqSchema(html: string): object | null {
  const pairs: Array<{ question: string; answer: string }> = [];

  const h3Regex = /<h3[^>]*>(.*?)<\/h3>\s*<p[^>]*>(.*?)<\/p>/gis;
  let match: RegExpExecArray | null;
  while ((match = h3Regex.exec(html)) !== null) {
    const question = match[1].replace(/<[^>]+>/g, '').trim();
    const answer = match[2].replace(/<[^>]+>/g, '').trim();
    if ((question.includes('¿') || question.endsWith('?')) && answer.length > 20) {
      pairs.push({ question, answer });
    }
  }

  if (pairs.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: pairs.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  };
}

export function sanitizeBlogExcerpt(value: unknown, maxLength = 160): string {
  return plainTextFromHtml(value, maxLength);
}
