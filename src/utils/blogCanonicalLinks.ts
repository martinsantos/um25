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
  return resolveCanonicalBlogSlug(generateSlug(decoded));
}

export function canonicalizeInternalBlogLinks(html: string): string {
  return String(html || '').replace(
    /href=(["'])(?:https?:\/\/(?:www\.)?ultimamilla\.com\.ar)?\/blog\/([^"'?#]+)([^"']*)\1/gi,
    (_match, quote: string, rawSlug: string, suffix: string) => {
      const canonicalSlug = canonicalizeBlogSlug(rawSlug);
      return `href=${quote}/blog/${canonicalSlug}${suffix}${quote}`;
    },
  );
}
