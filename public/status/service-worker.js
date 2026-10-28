// Only the status shell may be cached. Operational readings always need the network.
const CACHE_NAME = 'um-dashboard-v3-application-catalog';
const SHELL = ['/status/', '/status/index.html', '/status/manifest.json'];
const PREVIOUS_STATUS_CACHES = new Set(['um-dashboard-v1', 'um-dashboard-v2-real-readings']);

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(async cache => {
    for (const path of SHELL) {
      const response = await fetch(path, {cache: 'reload'});
      if (!response.ok) throw new Error('Status shell unavailable');
      await cache.put(path, response);
    }
    await self.skipWaiting();
  }));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => PREVIOUS_STATUS_CACHES.has(name)).map(name => caches.delete(name)));
    await self.clients.claim();
    // Replace an already-open v1 shell, whose markup contained fixed metrics.
    const clients = await self.clients.matchAll({type: 'window'});
    for (const client of clients) {
      const url = new URL(client.url);
      if (url.origin === self.location.origin && ['/status/', '/status/index.html'].includes(url.pathname)) {
        // Do not wait for navigation: its fetch needs activation to finish first.
        client.navigate(client.url).catch(() => {});
      }
    }
  })());
});

self.addEventListener('fetch', event => {
  const {request} = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request, {cache: 'no-store'}).catch(() => new Response(
      JSON.stringify({success: false, offline: true, status: 'unknown'}),
      {status: 503, headers: {'Content-Type': 'application/json', 'Cache-Control': 'no-store'}}
    )));
    return;
  }
  if (!SHELL.includes(url.pathname)) return;
  event.respondWith(fetch(request, {cache: 'no-cache'}).then(async response => {
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    }
    return response;
  }).catch(async () => (await caches.match(request)) || new Response('Sin conexión. Estado desconocido.', {status: 503})));
});
