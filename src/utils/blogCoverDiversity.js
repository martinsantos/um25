export const BLOG_COVER_CANONICAL_SITE_URL = 'https://www.ultimamilla.com.ar';

const PUBLIC_HOSTS = new Set(['ultimamilla.com.ar', 'www.ultimamilla.com.ar']);
const IMAGE_PATH_RE = /\.(avif|gif|jpe?g|png|svg|webp)$/i;
const UUID_RE = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
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

function blogSortTime(value) {
  const time = Date.parse(value || '');
  return Number.isFinite(time) ? time : 0;
}

export function sortBlogPostsNewestFirst(posts) {
  return [...(Array.isArray(posts) ? posts : [])].sort((a, b) => (
    blogSortTime(b?.fecha_publicacion) - blogSortTime(a?.fecha_publicacion)
  ));
}

/** Read surfaces preserve the image stored on each note, independent of filters/order. */
export function preserveBlogPostCovers(posts) {
  return (Array.isArray(posts) ? posts : []).map((post) => ({
    ...post,
    imagen_portada: normalizeBlogCoverUrl(post?.imagen_portada) || null,
  }));
}
