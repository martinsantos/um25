import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const generatedImageMap = require('../data/antecedentes-generated-image-map.json');

export const BLOG_COVER_CANONICAL_SITE_URL = 'https://www.ultimamilla.com.ar';
export const BLOG_COVER_DIVERSITY_LIMIT = 200;
export const BLOG_COVER_MAX_REUSE = 1;

const PUBLIC_HOSTS = new Set(['ultimamilla.com.ar', 'www.ultimamilla.com.ar']);
const IMAGE_PATH_RE = /\.(avif|gif|jpe?g|png|svg|webp)$/i;
const UUID_RE = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const GENERATED_IMAGE_RE = /^\/images\/antecedentes\/generated\/.+\.webp$/i;

const EDITORIAL_COVER_PATHS = [
  '/images/editorial/umsa-service-redes.webp',
  '/images/editorial/umsa-service-telecomunicaciones.webp',
  '/images/editorial/umsa-service-soporte-247.webp',
  '/images/editorial/umsa-service-software-a-medida.webp',
  '/images/editorial/umsa-service-seguridad-electronica.webp',
  '/images/editorial/umsa-service-deteccion-incendios.webp',
  '/images/editorial/umsa-service-electricos-it.webp',
  '/images/editorial/umsa-service-consultoria-it.webp',
  '/images/editorial/umsa-sector-aeropuertos.webp',
  '/images/editorial/umsa-sector-bodegas.webp',
  '/images/editorial/umsa-sector-constructoras.webp',
  '/images/editorial/umsa-sector-gobierno.webp',
  '/images/editorial/umsa-sector-industria.webp',
  '/images/editorial/umsa-sector-mineria.webp',
  '/images/editorial/umsa-sector-salud.webp',
  '/images/editorial/umsa-sector-seguridad-electronica.webp',
  '/images/editorial/umsa-sector-software.webp',
  '/images/editorial/umsa-about-engineering.webp',
  '/images/editorial/umsa-home-operations.webp',
];

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function asCanonicalLocalUrl(path) {
  return `${BLOG_COVER_CANONICAL_SITE_URL}${path}`;
}

function isLocalImagePath(pathname) {
  const cleanPath = String(pathname || '').split('?')[0] || '';
  if (!cleanPath.startsWith('/')) return false;
  if (IMAGE_PATH_RE.test(cleanPath)) return true;
  return /^\/(?:api\/asset|assets)\/[a-f0-9-]{36}$/i.test(cleanPath);
}

export function normalizeBlogCoverUrl(value) {
  const cleanValue = String(value || '').trim();
  if (!cleanValue) return '';

  if (UUID_RE.test(cleanValue)) {
    return asCanonicalLocalUrl(`/api/asset/${cleanValue}`);
  }

  if (cleanValue.startsWith('/')) {
    const [pathname = ''] = cleanValue.split('?');
    return isLocalImagePath(pathname) ? asCanonicalLocalUrl(pathname) : '';
  }

  if (!/^https?:\/\//i.test(cleanValue)) return '';

  try {
    const parsed = new URL(cleanValue);
    if (PUBLIC_HOSTS.has(parsed.hostname) && isLocalImagePath(parsed.pathname)) {
      return asCanonicalLocalUrl(parsed.pathname);
    }
    if (parsed.hostname === 'images.unsplash.com' && /^\/photo-[a-z0-9-]+$/i.test(parsed.pathname)) {
      return parsed.toString();
    }
  } catch {
    return '';
  }

  return '';
}

function coverCandidatePaths() {
  const generatedPaths = Object.values(generatedImageMap)
    .map((value) => String(value || '').trim())
    .filter((value) => GENERATED_IMAGE_RE.test(value));

  return unique([...EDITORIAL_COVER_PATHS, ...generatedPaths]);
}

export const BLOG_COVER_DIVERSITY_CANDIDATES = coverCandidatePaths().map(asCanonicalLocalUrl);

function stableHash(value) {
  const input = String(value || '');
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function blogSortTime(value) {
  const time = Date.parse(value || '');
  return Number.isFinite(time) ? time : 0;
}

function postSeed(post) {
  return [
    post?.slug,
    post?.titulo,
    post?.categoria,
    post?.fecha_publicacion,
  ].filter(Boolean).join('|');
}

function orderedCandidatesForPost(post) {
  if (BLOG_COVER_DIVERSITY_CANDIDATES.length === 0) return [];
  const start = stableHash(postSeed(post)) % BLOG_COVER_DIVERSITY_CANDIDATES.length;
  return [
    ...BLOG_COVER_DIVERSITY_CANDIDATES.slice(start),
    ...BLOG_COVER_DIVERSITY_CANDIDATES.slice(0, start),
  ];
}

function pickReplacementCover(post, usage, originalCover) {
  for (const candidate of orderedCandidatesForPost(post)) {
    if (candidate === originalCover) continue;
    if ((usage.get(candidate) || 0) < BLOG_COVER_MAX_REUSE) return candidate;
  }

  return originalCover || BLOG_COVER_DIVERSITY_CANDIDATES[stableHash(postSeed(post)) % BLOG_COVER_DIVERSITY_CANDIDATES.length] || '';
}

export function sortBlogPostsNewestFirst(posts) {
  return [...(Array.isArray(posts) ? posts : [])].sort((a, b) => (
    blogSortTime(b?.fecha_publicacion) - blogSortTime(a?.fecha_publicacion)
  ));
}

export function diversifyBlogPostCovers(posts) {
  const usage = new Map();

  return (Array.isArray(posts) ? posts : []).map((post) => {
    const originalCover = normalizeBlogCoverUrl(post?.imagen_portada);
    const isRepeated = Boolean(originalCover) && (usage.get(originalCover) || 0) > 0;
    const selectedCover = !originalCover || isRepeated
      ? pickReplacementCover(post, usage, originalCover)
      : originalCover;

    if (selectedCover) usage.set(selectedCover, (usage.get(selectedCover) || 0) + 1);

    return {
      ...post,
      imagen_portada: selectedCover || null,
    };
  });
}

export function diversifySortedBlogPostCovers(posts, limit = posts?.length || 0) {
  const sorted = sortBlogPostsNewestFirst(posts);
  return diversifyBlogPostCovers(sorted).slice(0, limit || sorted.length);
}

export function selectDiverseBlogCover(post, existingPosts = []) {
  const usage = new Map();
  for (const existingPost of Array.isArray(existingPosts) ? existingPosts : []) {
    const existingCover = normalizeBlogCoverUrl(existingPost?.imagen_portada);
    if (existingCover) usage.set(existingCover, (usage.get(existingCover) || 0) + 1);
  }

  const originalCover = normalizeBlogCoverUrl(post?.imagen_portada);
  if (originalCover && !usage.has(originalCover)) return originalCover;
  return pickReplacementCover(post, usage, originalCover);
}
