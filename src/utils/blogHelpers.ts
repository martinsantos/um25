import type { EntradaBlog } from '../lib/directus';
import imageLocalMap from '../data/image-local-map.json';
import { blogTopicPoster } from '../data/cine/posters';

const UUID_RE = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const PUBLIC_BLOG_IMAGE_HOSTS = new Set(['ultimamilla.com.ar', 'www.ultimamilla.com.ar']);
const EXTERNAL_BLOG_IMAGE_HOSTS = new Set(['images.unsplash.com']);
const IMAGE_PATH_RE = /\.(avif|gif|jpe?g|png|svg|webp)$/i;

function isLocalBlogImagePath(pathname: string): boolean {
  const cleanPath = pathname.split('?')[0] || '';
  if (!cleanPath.startsWith('/')) return false;
  if (IMAGE_PATH_RE.test(cleanPath)) return true;
  if (/^\/(?:api\/asset|assets)\/[a-f0-9-]{36}$/i.test(cleanPath)) return true;
  return false;
}

export function blogImageUrl(value: string | null | undefined): string {
  if (!value) return '';
  const cleanValue = value.trim();
  if (!cleanValue) return '';
  if (cleanValue.startsWith('http://') || cleanValue.startsWith('https://')) {
    try {
      const parsed = new URL(cleanValue);
      if (PUBLIC_BLOG_IMAGE_HOSTS.has(parsed.hostname) && isLocalBlogImagePath(parsed.pathname)) {
        return parsed.pathname;
      }
      if (EXTERNAL_BLOG_IMAGE_HOSTS.has(parsed.hostname) && /^\/photo-[a-z0-9-]+$/i.test(parsed.pathname)) {
        return parsed.toString();
      }
    } catch {
      return '';
    }
    return '';
  }
  if (cleanValue.startsWith('/')) {
    return isLocalBlogImagePath(cleanValue) ? cleanValue : '';
  }
  if (UUID_RE.test(cleanValue)) {
    return (imageLocalMap as Record<string, string>)[cleanValue] || `/api/asset/${cleanValue}`;
  }
  return '';
}

export function blogPostImageUrl(post: Pick<EntradaBlog, 'imagen_portada' | 'slug' | 'categoria'> & Partial<Pick<EntradaBlog, 'titulo' | 'tags' | 'resumen'>>): string {
  // Póster propio según el tema: las portadas de Directus eran imágenes generadas.
  return blogTopicPoster(post);
}

export function blogPostImageAlt(post: Pick<EntradaBlog, 'imagen_portada_alt' | 'titulo'>): string {
  return post.imagen_portada_alt || post.titulo;
}

export function bp(path: string): string {
  return path;
}
