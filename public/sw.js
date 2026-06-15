/**
 * Service Worker for ULTIMA MILLA public site
 * Features: Offline support, caching strategies, background sync
 * Version: 1.0.0
 */

const CACHE_NAME = 'um-public-v1.0.0';
const DYNAMIC_CACHE = 'um-dynamic-v1.0.0';
const OFFLINE_FALLBACK_PAGE = '/offline.html';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/global.css',
  '/uiEffects.css',
  '/terminalEnhanced.js',
  '/uiEffectsSystem.js',
  '/contactSystem.js',
  '/dataNavigationEngine.js',
  '/performanceOptimizer.js',
  '/favicon.ico',
  '/manifest.json'
];

// Cache strategies by route pattern
const CACHE_STRATEGIES = {
  // Static assets - Cache First
  static: {
    pattern: /\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/,
    strategy: 'cache-first',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  },
  
  // API calls - Network First with fallback
  api: {
    pattern: /\/api\//,
    strategy: 'network-first',
    maxAge: 5 * 60 * 1000, // 5 minutes
    fallback: 'offline-data'
  },
  
  // HTML pages - Network First
  pages: {
    pattern: /\.html$|\/$/,
    strategy: 'network-first',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  },
  
  // Images - Cache First with Network Fallback
  images: {
    pattern: /\/images\/|\/webp\/|\/avif\//,
    strategy: 'cache-first',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  }
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => {
        console.log('[SW] Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      }),
      self.skipWaiting()
    ])
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      self.clients.claim()
    ])
  );
});

// Fetch event - handle requests with appropriate strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const { url, method } = request;
  
  // Only handle GET requests
  if (method !== 'GET') {
    return;
  }
  
  // Skip cross-origin requests
  if (!url.startsWith(self.location.origin)) {
    return;
  }
  
  // Determine cache strategy based on URL pattern
  const strategy = determineStrategy(url);
  
  event.respondWith(
    handleRequest(request, strategy)
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'contact-form') {
    event.waitUntil(syncContactForms());
  } else if (event.tag === 'analytics') {
    event.waitUntil(syncAnalytics());
  }
});

// Push notifications (if needed in the future)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'Nueva notificación de ULTIMA MILLA',
      icon: '/favicon-192x192.png',
      badge: '/favicon-72x72.png',
      tag: data.tag || 'um-notification',
      requireInteraction: data.requireInteraction || false,
      actions: data.actions || []
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'ULTIMA MILLA', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// HELPER FUNCTIONS

function determineStrategy(url) {
  for (const [name, config] of Object.entries(CACHE_STRATEGIES)) {
    if (config.pattern.test(url)) {
      return config;
    }
  }
  
  // Default strategy
  return {
    strategy: 'network-first',
    maxAge: 24 * 60 * 60 * 1000
  };
}

async function handleRequest(request, strategy) {
  const { url } = request;
  
  try {
    switch (strategy.strategy) {
      case 'cache-first':
        return await cacheFirst(request, strategy);
      
      case 'network-first':
        return await networkFirst(request, strategy);
      
      case 'stale-while-revalidate':
        return await staleWhileRevalidate(request, strategy);
      
      default:
        return await networkFirst(request, strategy);
    }
  } catch (error) {
    console.error('[SW] Request handling failed:', error);
    return await getFallbackResponse(request, strategy);
  }
}

async function cacheFirst(request, strategy) {
  const cachedResponse = await getCachedResponse(request);
  
  if (cachedResponse) {
    // Check if cached response is still valid
    const cacheTime = await getCacheTime(request);
    if (Date.now() - cacheTime < strategy.maxAge) {
      return cachedResponse;
    }
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.status === 200) {
      await cacheResponse(request, networkResponse.clone(), DYNAMIC_CACHE);
    }
    
    return networkResponse;
  } catch (error) {
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

async function networkFirst(request, strategy) {
  try {
    const networkResponse = await fetchWithTimeout(request, 3000);
    
    if (networkResponse.status === 200) {
      await cacheResponse(request, networkResponse.clone(), DYNAMIC_CACHE);
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await getCachedResponse(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

async function staleWhileRevalidate(request, strategy) {
  const cachedResponse = getCachedResponse(request);
  
  const networkUpdate = fetch(request).then((networkResponse) => {
    if (networkResponse.status === 200) {
      cacheResponse(request, networkResponse.clone(), DYNAMIC_CACHE);
    }
    return networkResponse;
  }).catch(() => {
    // Network failed, but we might have cached response
  });
  
  return (await cachedResponse) || (await networkUpdate);
}

async function getCachedResponse(request) {
  const caches = await self.caches.keys();
  
  for (const cacheName of [CACHE_NAME, DYNAMIC_CACHE]) {
    const cache = await self.caches.open(cacheName);
    const response = await cache.match(request);
    
    if (response) {
      return response;
    }
  }
  
  return null;
}

async function cacheResponse(request, response, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    
    // Don't cache non-successful responses or opaque responses
    if (response.status !== 200 && response.type !== 'opaque') {
      return;
    }
    
    // Store cache timestamp
    const url = new URL(request.url);
    url.searchParams.set('_cache_time', Date.now().toString());
    
    await cache.put(request, response);
  } catch (error) {
    console.error('[SW] Failed to cache response:', error);
  }
}

async function getCacheTime(request) {
  try {
    const url = new URL(request.url);
    const cacheTime = url.searchParams.get('_cache_time');
    return cacheTime ? parseInt(cacheTime) : 0;
  } catch (error) {
    return 0;
  }
}

async function fetchWithTimeout(request, timeout = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(request, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

async function getFallbackResponse(request, strategy) {
  const url = new URL(request.url);
  
  // Fallback for API calls
  if (strategy.fallback === 'offline-data') {
    return getOfflineDataResponse(url.pathname);
  }
  
  // Fallback for HTML pages
  if (request.headers.get('accept')?.includes('text/html')) {
    const offlineResponse = await getCachedResponse(new Request(OFFLINE_FALLBACK_PAGE));
    if (offlineResponse) {
      return offlineResponse;
    }
  }
  
  // Generic fallback
  return new Response(
    JSON.stringify({
      error: 'Offline',
      message: 'No tienes conexión a internet. Algunas funcionalidades pueden estar limitadas.',
      timestamp: new Date().toISOString()
    }),
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    }
  );
}

function getOfflineDataResponse(pathname) {
  let data = {};
  
  // Provide offline data based on pathname
  if (pathname.includes('/api/servicios')) {
    data = {
      success: true,
      data: [
        {
          id: 1,
          title: 'Servicios (Modo Offline)',
          description: 'Datos almacenados localmente. Conéctate para ver información actualizada.'
        }
      ],
      offline: true
    };
  } else if (pathname.includes('/api/antecedentes')) {
    data = {
      success: true,
      data: [
        {
          id: 1,
          title: 'Antecedentes (Modo Offline)',
          description: 'Datos almacenados localmente. Conéctate para ver información actualizada.'
        }
      ],
      offline: true
    };
  } else {
    data = {
      error: 'Offline',
      message: 'Datos no disponibles en modo offline',
      offline: true
    };
  }
  
  return new Response(
    JSON.stringify(data),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    }
  );
}

// Background sync functions
async function syncContactForms() {
  try {
    const store = await getIDBStore('contact-forms', 'readonly');
    const forms = await getAllFromStore(store);
    
    for (const form of forms) {
      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(form.data)
        });
        
        if (response.ok) {
          // Remove from local storage after successful sync
          await removeFromStore('contact-forms', form.id);
          console.log('[SW] Contact form synced successfully:', form.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync contact form:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

async function syncAnalytics() {
  try {
    const store = await getIDBStore('analytics', 'readonly');
    const events = await getAllFromStore(store);
    
    for (const event of events) {
      try {
        const response = await fetch('/api/analytics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(event.data)
        });
        
        if (response.ok) {
          await removeFromStore('analytics', event.id);
          console.log('[SW] Analytics event synced successfully:', event.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync analytics event:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Analytics sync failed:', error);
  }
}

// IndexedDB helpers (simplified)
function getIDBStore(storeName, mode) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('UMTerminalDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);
      resolve(store);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: 'id' });
      }
    };
  });
}

function getAllFromStore(store) {
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function removeFromStore(storeName, id) {
  return new Promise(async (resolve, reject) => {
    try {
      const store = await getIDBStore(storeName, 'readwrite');
      const request = store.delete(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    } catch (error) {
      reject(error);
    }
  });
}

// Log service worker lifecycle
console.log('[SW] Service Worker script loaded');
