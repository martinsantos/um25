/* ULTIMA MILLA · service worker UM25 (fase 5)
 * Se registra sólo cuando PUBLIC_ENABLE_SW=true en el build (bandera).
 * Cachea fuentes, posters y assets versionados; páginas comerciales con
 * network-first y respaldo offline. Nunca cachea /api, Directus ni POST.
 * Subir SW_VERSION purga las cachés anteriores en activate. */
const SW_VERSION = 'um25-2026-10-02';
const CACHE_STATIC = `um25-static-${SW_VERSION}`;
const CACHE_PAGES = `um25-pages-${SW_VERSION}`;
const PRECACHE = ['/', '/servicios', '/sectores', '/offline.html', '/manifest.json'];
const PAGE_ALLOW = [/^\/$/, /^\/servicios(\/|$)/, /^\/sectores(\/|$)/, /^\/(aeropuertos|bodegas|constructoras|gobiernosectorpublico|industria|mineria|salud|seguridad-electronica|software)$/, /^\/certificaciones$/, /^\/nosotros$/, /^\/contacto$/];
const STATIC_ALLOW = [/^\/_astro\//, /^\/fonts\/um-sans\//, /^\/cine\/media\/.*\.(?:jpg|avif|webp|json)$/, /^\/cine\/servicios\//, /^\/img\//, /^\/images\//, /^\/datasheets\//, /^\/(?:favicon|apple-touch-icon|android-chrome)[^/]*$/];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_PAGES).then((cache) => Promise.allSettled(PRECACHE.map((u) => cache.add(u)))).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('um25-') && !k.endsWith(SW_VERSION)).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});

const isStatic = (url) => STATIC_ALLOW.some((re) => re.test(url.pathname));
const isPage = (request, url) => request.mode === 'navigate' && PAGE_ALLOW.some((re) => re.test(url.pathname.replace(/\/$/, '') || '/'));

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/admin') || url.pathname.startsWith('/estilo')) return;

  if (isStatic(url)) {
    event.respondWith(
      caches.open(CACHE_STATIC).then(async (cache) => {
        const hit = await cache.match(request);
        if (hit) return hit;
        const res = await fetch(request);
        if (res.ok) cache.put(request, res.clone());
        return res;
      }),
    );
    return;
  }

  if (isPage(request, url)) {
    event.respondWith(
      caches.open(CACHE_PAGES).then(async (cache) => {
        try {
          const res = await fetch(request);
          if (res.ok) cache.put(request, res.clone());
          return res;
        } catch {
          return (await cache.match(request)) || (await cache.match('/offline.html')) || Response.error();
        }
      }),
    );
  }
});
