import { getDirectusImageUrl } from '../lib/directus.ts';

type DirectusImageLike =
  | string
  | {
      id?: string | null;
      directus_files_id?: string | { id?: string | null } | null;
      imagen?: DirectusImageLike;
      image?: DirectusImageLike;
    }
  | null
  | undefined;

const uuidRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

function extractImageValue(image: DirectusImageLike): string {
  if (!image) return '';
  if (typeof image === 'string') return image.trim();
  if (typeof image.directus_files_id === 'string') return image.directus_files_id.trim();
  if (image.directus_files_id && typeof image.directus_files_id === 'object') {
    return String(image.directus_files_id.id || '').trim();
  }
  if (image.id) return image.id.trim();
  return extractImageValue(image.imagen || image.image);
}

export function isEditoriallyUnsafeImageUrl(url: string): boolean {
  const value = url.trim();
  if (!value) return true;

  // These are acceptable for cards/thumbnails, but they are not acceptable as
  // large editorial/hero assets because the local mirrors are square 720px.
  if (value.startsWith('/uploads/antecedentes/')) return true;
  if (value.startsWith('/images/hero/foto-')) return true;
  if (value.startsWith('/images/services/productos/')) return true;

  // Sector snapshots still contain generic stock URLs. Prefer UMSA-controlled
  // editorial assets unless Directus supplies a real asset UUID.
  if (/^https:\/\/images\.unsplash\.com\//i.test(value)) return true;

  return false;
}

export function resolveCmsImageUrl(image: DirectusImageLike, fallback: string): string {
  const raw = extractImageValue(image);
  if (!raw) return fallback;

  if (uuidRegex.test(raw)) {
    const directusUrl = getDirectusImageUrl(raw);
    return directusUrl && !directusUrl.includes('default-background') && !isEditoriallyUnsafeImageUrl(directusUrl)
      ? directusUrl
      : fallback;
  }

  if (/^https?:\/\//i.test(raw) || raw.startsWith('/')) {
    return isEditoriallyUnsafeImageUrl(raw) ? fallback : raw;
  }

  return fallback;
}
