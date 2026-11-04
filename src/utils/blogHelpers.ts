import { createHash } from 'node:crypto';
import corrections from '../data/blogPhotoReview.json';
import descriptions from '../data/blogPhotoAlt.json';
import type { EntradaBlog } from '../lib/directus';
import imageLocalMap from '../data/image-local-map.json';
import antecedenteImages from '../data/antecedentes-generated-image-map.json';

export const DEFAULT_BLOG_COVER = '/images/editorial/umsa-about-engineering.webp';
// Portada externa retirada (404). Las notas revisadas usan su alternativa editorial.
const UNAVAILABLE_BLOG_COVER = 'https://images.unsplash.com/photo-1586281380349-6325315f36a2';

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

type Review = { asset: string; sources: string[] };
const reviewed = corrections as Record<string, Review>;
const pinnedCaseCover: Record<string, string> = {
  "superset-en-bodegas-tableros-roles-y-cierre-semanal": "/images/antecedentes/generated/lote_037/3428-desarrollo-de-software-y-digitalizacion-de-procesos-la-casa-del-aroma-sa-principal.webp",
  "zammad-en-cooperativas-reclamos-sla-y-salida": "/images/antecedentes/generated/lote_046/3666-principal.webp",
  "zabbix-7-4-en-municipios-proxies-cortes-y-mapas": "/images/antecedentes/generated/lote_019/3249-soporte-de-infraestructura-it-de-alta-disponibilidad-jose-nucete-e-hijos-sa-mayo-2022-principal.webp"
};
const altByAsset = descriptions as Record<string, string>;
const archiveDir = '/images/blog/editorial/';
function reviewedAsset(slug: string, cover: string): string | undefined {
  if (!Object.prototype.hasOwnProperty.call(reviewed, slug)) return;
  const rule = reviewed[slug];
  if (!rule) return;
  if (cover === archiveDir + rule.asset + '-v1.webp') return rule.asset;
  const key = !cover || cover.startsWith('/cine/iso/') || cover.split('?')[0] === UNAVAILABLE_BLOG_COVER
    ? DEFAULT_BLOG_COVER : (cover.split('?')[0] || '');
  // Match only the reviewed file or a known archived filename. A new CMS selection wins.
  const fingerprint = createHash('sha256').update(key).digest('hex').slice(0, 24);
  return rule.sources.includes(fingerprint) ? rule.asset : undefined;
}
export function blogImageSrcset(src: string): string | undefined {
  if (!src.startsWith(archiveDir) || !src.endsWith('-v1.webp')) return undefined;
  return [480, 960, 1536].map(w => (w === 1536 ? src : src.replace(/\.webp$/, '-' + w + '.webp')) + ' ' + w + 'w').join(', ');
}

export function blogPostImageUrl(post: Pick<EntradaBlog, 'imagen_portada' | 'slug' | 'categoria'> & Partial<Pick<EntradaBlog, 'titulo' | 'tags' | 'resumen'>>): string {
  const cover = blogImageUrl(post.imagen_portada);
  const asset = reviewedAsset(post.slug, cover);
  if (asset) return archiveDir + asset + '-v1.webp';
  if (cover.split('?')[0] === UNAVAILABLE_BLOG_COVER) return DEFAULT_BLOG_COVER;
  // Preserve the assigned cover. Historical project filenames may have been
  // shortened; the explicit ID map keeps the same source available in the package.
  const historicalId = cover.match(/^\/images\/antecedentes\/generated\/lote_\d+\/(\d+)-/)?.[1];
  const pinned = pinnedCaseCover[post.slug];
  const selected = historicalId && (antecedenteImages as Record<string, string>)[historicalId];
  if (typeof pinned === 'string' && historicalId && pinned.includes('/' + historicalId + '-') && cover !== selected) return pinned;
  const currentCover = historicalId ? (antecedenteImages as Record<string, string>)[historicalId] : '';
  if (currentCover) return currentCover;
  return cover && !cover.startsWith('/cine/iso/') ? cover : DEFAULT_BLOG_COVER;
}

export function blogPostImageAlt(post: Pick<EntradaBlog, 'imagen_portada_alt' | 'titulo'> & Partial<Pick<EntradaBlog, 'slug' | 'imagen_portada'>>): string {
  const asset = post.slug && reviewedAsset(post.slug, blogImageUrl(post.imagen_portada));
  return (asset && altByAsset[asset]) || post.imagen_portada_alt || post.titulo;
}

export function bp(path: string): string {
  return path;
}
