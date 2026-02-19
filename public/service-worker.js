/* eslint-disable no-restricted-globals */
/**
 * Service Worker for Climate Disaster Response Platform
 * Provides offline support, caching, and push notifications
 */

const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `climate-disaster-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;

// Critical resources to cache on install
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/offline.html',
  '/icon-192x192.png',
  '/icon-512x512.png',
];

// API endpoints to cache with network-first strategy
const API_CACHE_URLS = [
  '/api/alerts',
  '/api/emergency-alerts',
  '/api/weather',
  '/api/evacuation',
];

// Install event - cache critical resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Precaching app shell');
      return cache.addAll(PRECACHE_URLS);
    }).then(() => {
      console.log('[SW] Skip waiting on install');
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    // For API requests to backend
    if (url.pathname.startsWith('/api')) {
      event.respondWith(networkFirstStrategy(request));
    }
    return;
  }

  // HTML pages - Network first, fallback to cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || caches.match('/offline.html');
          });
        })
    );
    return;
  }

  // API requests - Network first with timeout
  if (url.pathname.startsWith('/api')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Static assets - Cache first
  if (request.destination === 'style' || 
      request.destination === 'script' || 
      request.destination === 'image' ||
      request.destination === 'font') {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // Default - Network first
  event.respondWith(networkFirstStrategy(request));
});

/**
 * Cache First Strategy
 * Good for: Static assets that rarely change
 */
function cacheFirstStrategy(request) {
  return caches.match(request).then((cachedResponse) => {
    if (cachedResponse) {
      return cachedResponse;
    }

    return fetch(request).then((response) => {
      // Don't cache if not a success response
      if (!response || response.status !== 200 || response.type === 'error') {
        return response;
      }

      const responseToCache = response.clone();
      caches.open(RUNTIME_CACHE).then((cache) => {
        cache.put(request, responseToCache);
      });

      return response;
    });
  });
}

/**
 * Network First Strategy with timeout
 * Good for: API requests, dynamic content
 */
function networkFirstStrategy(request) {
  const timeout = 5000; // 5 second timeout

  return Promise.race([
    fetch(request),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('timeout')), timeout)
    )
  ])
    .then((response) => {
      // Cache successful responses
      if (response && response.status === 200) {
        const responseToCache = response.clone();
        caches.open(RUNTIME_CACHE).then((cache) => {
          cache.put(request, responseToCache);
        });
      }
      return response;
    })
    .catch(() => {
      // If network fails, try cache
      return caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        // Return offline page for navigation requests
        if (request.mode === 'navigate') {
          return caches.match('/offline.html');
        }
        throw new Error('No cached response available');
      });
    });
}

// Push notification event
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Climate Disaster Alert';
  const options = {
    body: data.body || 'New emergency alert',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    tag: data.tag || 'emergency-alert',
    requireInteraction: data.severity === 'critical',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
      severity: data.severity || 'medium'
    },
    actions: [
      { action: 'view', title: 'View Details' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  event.notification.close();

  if (event.action === 'view') {
    const urlToOpen = event.notification.data.url || '/';
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((windowClients) => {
          // Check if there is already a window/tab open
          for (let client of windowClients) {
            if (client.url === urlToOpen && 'focus' in client) {
              return client.focus();
            }
          }
          // If not, open a new window
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
  }
});

// Background sync event
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-reports') {
    event.waitUntil(syncReports());
  }
});

/**
 * Sync pending reports when connection is restored
 */
async function syncReports() {
  try {
    const cache = await caches.open('pending-reports');
    const requests = await cache.keys();
    
    for (const request of requests) {
      try {
        await fetch(request);
        await cache.delete(request);
      } catch (error) {
        console.error('[SW] Failed to sync report:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Sync failed:', error);
  }
}

// Message event - handle messages from clients
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(RUNTIME_CACHE).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }
});
