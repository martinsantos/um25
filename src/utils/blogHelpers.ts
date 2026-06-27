import type { EntradaBlog } from '../lib/directus';
import { editorialImages } from '../data/editorialImageSystem';
import imageLocalMap from '../data/image-local-map.json';

const UUID_RE = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const PUBLIC_BLOG_IMAGE_HOSTS = new Set(['ultimamilla.com.ar', 'www.ultimamilla.com.ar']);

const FALLBACK_BY_SLUG: Record<string, string> = {
  'plantilla-arca-facturacion-electronica-gratis': editorialImages.sectors.software,
  'nueva-normativa-camara-vigilancia-edificios-2024': '/uploads/hero/c194b40e-925c-4de5-924b-ea61ab835c0e.jpg',
  'aeropuerto-mendoza-red-wifi-6-proyecto': editorialImages.sectors.aeropuertos,
  'comparativa-fibra-optica-multimodo-monomodo': '/uploads/hero/4f9aa0c4-4aeb-4027-a7a0-8a6cfbb14705.jpg',
  'deteccion-incendio-bodegas-vitivinicolas': editorialImages.services[107],
  'hospital-regional-neuquen-cableado-estructurado': '/uploads/hero/f83400c2-c46f-4120-9aad-b44495ecbebe.jpg',
  'ciberseguridad-2024': editorialImages.sectors['seguridad-electronica'],
};

const FALLBACK_BY_CATEGORY: Record<string, string> = {
  noticias: editorialImages.defaultOg,
  proyectos: '/uploads/hero/f83400c2-c46f-4120-9aad-b44495ecbebe.jpg',
  tecnico: '/uploads/hero/4f9aa0c4-4aeb-4027-a7a0-8a6cfbb14705.jpg',
  tecnologia: editorialImages.sectors.software,
  empresa: '/uploads/hero/a7f7d962-a5f8-4310-9f59-afeb62dcb0eb.jpg',
};

export function blogImageUrl(value: string | null | undefined): string {
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://')) {
    try {
      const parsed = new URL(value);
      if (
        PUBLIC_BLOG_IMAGE_HOSTS.has(parsed.hostname) &&
        /\.(jpg|jpeg|png|webp|gif)$/i.test(parsed.pathname)
      ) {
        return parsed.pathname;
      }
      if (
        PUBLIC_BLOG_IMAGE_HOSTS.has(parsed.hostname) &&
        (parsed.pathname.startsWith('/uploads/') || parsed.pathname.startsWith('/images/'))
      ) {
        return parsed.pathname;
      }
    } catch {
      return '';
    }
    return '';
  }
  if (value.startsWith('/')) {
    return value;
  }
  if (UUID_RE.test(value)) {
    return (imageLocalMap as Record<string, string>)[value] || `/api/asset/${value}`;
  }
  return '';
}

export function blogPostImageUrl(post: Pick<EntradaBlog, 'imagen_portada' | 'slug' | 'categoria'>): string {
  return (
    blogImageUrl(post.imagen_portada) ||
    FALLBACK_BY_SLUG[post.slug] ||
    FALLBACK_BY_CATEGORY[post.categoria] ||
    editorialImages.defaultOg
  );
}

export function blogPostImageAlt(post: Pick<EntradaBlog, 'imagen_portada_alt' | 'titulo'>): string {
  return post.imagen_portada_alt || post.titulo;
}

export function bp(path: string): string {
  return path;
}
