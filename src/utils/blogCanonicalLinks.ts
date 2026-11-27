import { blogNoteHref } from '../lib/blogListingRoute';
import { resolveCanonicalBlogSlug } from '../data/seoRedirects';
import { generateSlug } from './slugUtils.js';

export function canonicalizeBlogSlug(value: unknown): string {
  const raw = String(value || '').trim();
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    // Keep malformed legacy input deterministic; generateSlug will sanitize it.
  }
  // Un slug ya limpio se respeta completo: generateSlug lo corta a 100 caracteres y
  // dejaba posts largos de Directus redirigiendo a una URL inexistente.
  const clean = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(decoded) ? decoded : generateSlug(decoded);
  return resolveCanonicalBlogSlug(clean);
}

export function canonicalizeInternalBlogLinks(html: string, readingReturn?: string): string {
  return String(html || '').replace(
    /(<a\b[^>]*?\shref\s*=\s*)(["'])(?:https?:\/\/(?:www\.)?ultimamilla\.com\.ar)?\/blog\/([^"'/?#]+)\/?(\?[^"'#]*)?(#[^"']*)?\2/gi,
    (_match, prefix: string, quote: string, rawSlug: string, query?: string, fragment?: string) => {
      const href = blogNoteHref(canonicalizeBlogSlug(rawSlug), readingReturn);
      const rest = readingReturn && query ? '&amp;' + query.slice(1) : (query || '');
      return prefix + quote + href + rest + (fragment || '') + quote;
    },
  );
}
