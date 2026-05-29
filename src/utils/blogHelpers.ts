import type { EntradaBlog } from '../lib/directus';
import imageLocalMap from '../data/image-local-map.json';

const UUID_RE = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

const FALLBACK_BY_SLUG: Record<string, string> = {
  'plantilla-arca-facturacion-electronica-gratis': '/images/hero/foto-software.jpg',
  'nueva-normativa-camara-vigilancia-edificios-2024': '/uploads/hero/c194b40e-925c-4de5-924b-ea61ab835c0e.jpg',
  'aeropuerto-mendoza-red-wifi-6-proyecto': '/images/hero/foto-telecom.jpg',
  'comparativa-fibra-optica-multimodo-monomodo': '/uploads/hero/4f9aa0c4-4aeb-4027-a7a0-8a6cfbb14705.jpg',
  'deteccion-incendio-bodegas-vitivinicolas': '/images/services/productos/incendios/7.jpg',
  'hospital-regional-neuquen-cableado-estructurado': '/uploads/hero/f83400c2-c46f-4120-9aad-b44495ecbebe.jpg',
  'ciberseguridad-2024': '/images/hero/foto-seguridad.jpg',
};

const FALLBACK_BY_CATEGORY: Record<string, string> = {
  noticias: '/images/hero/foto-telecom.jpg',
  proyectos: '/uploads/hero/f83400c2-c46f-4120-9aad-b44495ecbebe.jpg',
  tecnico: '/uploads/hero/4f9aa0c4-4aeb-4027-a7a0-8a6cfbb14705.jpg',
  tecnologia: '/images/hero/foto-software.jpg',
  empresa: '/uploads/hero/a7f7d962-a5f8-4310-9f59-afeb62dcb0eb.jpg',
};

export function blogImageUrl(value: string | null | undefined): string {
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/')) {
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
    '/images/hero/foto-general.jpg'
  );
}

export function blogPostImageAlt(post: Pick<EntradaBlog, 'imagen_portada_alt' | 'titulo'>): string {
  return post.imagen_portada_alt || post.titulo;
}

export function bp(path: string): string {
  return path;
}
