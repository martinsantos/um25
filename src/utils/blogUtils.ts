const CATEGORY_COLORS: Record<string, string> = {
  noticias: '#3b82f6',
  proyectos: '#10b981',
  tecnico: '#f59e0b',
  empresa: '#8b5cf6',
};

const CATEGORY_LABELS: Record<string, string> = {
  noticias: 'NOTICIAS',
  proyectos: 'PROYECTOS',
  tecnico: 'TÉCNICO',
  empresa: 'EMPRESA',
};

export function getCategoryColor(cat: string): string {
  return CATEGORY_COLORS[cat] || '#3b82f6';
}

export function getCategoryLabel(cat: string): string {
  return CATEGORY_LABELS[cat] || cat.toUpperCase();
}

export function formatBlogDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Injects id attributes into h2/h3 tags in HTML content.
 * Returns the processed HTML and an array of headings for TOC generation.
 */
export function addHeadingIds(html: string): {
  html: string;
  headings: Array<{ level: number; id: string; text: string }>;
} {
  const headings: Array<{ level: number; id: string; text: string }> = [];

  const processed = html.replace(
    /<h([23])([^>]*)>(.*?)<\/h[23]>/gi,
    (_match, level, attrs, inner) => {
      const plainText = inner.replace(/<[^>]+>/g, '');
      const id = plainText
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      headings.push({ level: Number(level), id, text: plainText });
      return `<h${level}${attrs} id="${id}">${inner}</h${level}>`;
    }
  );

  return { html: processed, headings };
}
