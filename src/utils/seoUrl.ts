import { SITE_URL } from '../config/seo';

const UUID_RE = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const PUBLIC_SITE_RE = /^https?:\/\/(?:www\.)?ultimamilla\.com\.ar/i;
const PUBLIC_IMAGE_HOSTS = new Set(['ultimamilla.com.ar', 'www.ultimamilla.com.ar']);
const EXTERNAL_IMAGE_HOSTS = new Set(['images.unsplash.com']);

export function stripWww(url: string): string {
  return url.replace(PUBLIC_SITE_RE, SITE_URL);
}

export function normalizePath(pathname: string): string {
  if (!pathname || pathname === '/') return '';
  return `/${pathname.replace(/^\/+|\/+$/g, '')}`;
}

export function canonicalUrl(pathOrUrl: string = ''): string {
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return stripWww(pathOrUrl).replace(/\/$/, '');
  }

  return `${SITE_URL}${normalizePath(pathOrUrl)}`.replace(/\/$/, '');
}

export function escapeXml(value: string | number | null | undefined): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function formatSitemapDate(value?: string | Date | null): string {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return new Date().toISOString().split('T')[0] || '';
  return date.toISOString().split('T')[0] || '';
}

export function publicImageUrl(image: unknown): string | null {
  if (!image) return null;

  if (typeof image === 'string') {
    if (image.startsWith('http')) {
      try {
        const parsed = new URL(image);
        if (EXTERNAL_IMAGE_HOSTS.has(parsed.hostname) && /^\/photo-[a-z0-9-]+$/i.test(parsed.pathname)) {
          return parsed.toString();
        }
        if (!PUBLIC_IMAGE_HOSTS.has(parsed.hostname)) return null;
      } catch {
        return null;
      }
      return stripWww(image);
    }
    if (image.startsWith('/')) return canonicalUrl(image);
    if (UUID_RE.test(image)) return canonicalUrl(`/assets/${image}`);
    return null;
  }

  if (typeof image === 'object') {
    const record = image as Record<string, unknown>;
    const id = record['id'] || record['directus_files_id'];
    if (typeof id === 'string' && UUID_RE.test(id)) return canonicalUrl(`/assets/${id}`);
    if (typeof record['url'] === 'string') return publicImageUrl(record['url']);
  }

  return null;
}

export function clampText(value: string | null | undefined, maxLength: number): string {
  const normalized = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;
  const sliced = normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd();
  const lastSpace = sliced.lastIndexOf(' ');
  const cleanCut = lastSpace > maxLength * 0.65 ? sliced.slice(0, lastSpace) : sliced;
  return `${cleanCut.replace(/[.,;:!?-]+$/g, '')}…`;
}
