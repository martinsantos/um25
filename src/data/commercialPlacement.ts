/**
 * Reglas de ubicación de bloques comerciales (CTA / fold).
 * Objetivo: no repetir el mismo pitch en cada producto ni en cada post del blog.
 */

export type BlogPostCommercialInput = {
  slug?: string;
  categoria?: string;
  tags?: string[];
};

/** Posts donde el fold comercial aporta (caso de uso / conversión). */
const BLOG_COMMERCIAL_SLUGS = new Set([
  'plantilla-arca-facturacion-electronica-gratis',
  'aeropuerto-mendoza-red-wifi-6-proyecto',
  'hospital-regional-neuquen-cableado-estructurado',
]);

/** Categorías con intención comercial explícita. */
const BLOG_COMMERCIAL_CATEGORIES = new Set(['proyectos', 'empresa']);

/** Categorías solo informativas — sin fold. */
const BLOG_NO_COMMERCIAL_CATEGORIES = new Set(['noticias', 'tecnico']);

export function shouldShowBlogCommercialFold(post: BlogPostCommercialInput): boolean {
  const slug = String(post.slug || '').trim();
  const category = String(post.categoria || '').trim().toLowerCase();

  if (slug && BLOG_COMMERCIAL_SLUGS.has(slug)) return true;
  if (category && BLOG_NO_COMMERCIAL_CATEGORIES.has(category)) return false;
  if (category && BLOG_COMMERCIAL_CATEGORIES.has(category)) return true;

  const tags = (post.tags || []).map((t) => String(t).toLowerCase());
  if (tags.some((t) => t.includes('proyecto') || t.includes('caso'))) return true;

  return false;
}

export type ProductCardCommercialInput = {
  index: number;
  total: number;
};

/** CTAs de producto: una sola vez al cierre del listado (CTASection cubre el resto). */
export function shouldShowProductCardActions({ index, total }: ProductCardCommercialInput): boolean {
  if (total <= 0) return false;
  return index === total - 1;
}
