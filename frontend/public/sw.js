'use strict';

var CACHE_NAME = 'seewhy-v33-shell-v3';
var ASSET_CACHE = 'seewhy-v33-assets-v3';

var SHELL_URLS = [
  '/',
  '/manifest.json',
  '/favicon.svg',
];

// Install — cache the shell
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(SHELL_URLS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// Activate — delete old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) {
          return key !== CACHE_NAME && key !== ASSET_CACHE;
        }).map(function(key) {
          return caches.delete(key);
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// Fetch — route-specific strategies
self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);

  // Skip non-GET and cross-origin requests
  if (event.request.method !== 'GET') return;
  if (url.origin !== self.location.origin) {
    // Stale-while-revalidate for Google Fonts
    if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
      event.respondWith(networkFirstWithCache(event.request, ASSET_CACHE));
    }
    return;
  }

  // API calls — network only, no caching
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/socket.io')) {
    return;
  }

  // JS/CSS/images/fonts — cache first, background revalidate
  var ext = url.pathname.split('.').pop().toLowerCase();
  var isCacheableAsset = (
    ext === 'js' || ext === 'css' || ext === 'svg' ||
    ext === 'png' || ext === 'jpg' || ext === 'jpeg' ||
    ext === 'woff' || ext === 'woff2' || ext === 'ttf'
  );

  if (isCacheableAsset) {
    event.respondWith(cacheFirstWithRevalidate(event.request, ASSET_CACHE));
    return;
  }

  // Navigation (HTML) — network first, fall back to shell
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(function() {
        return caches.match('/');
      })
    );
    return;
  }

  // Everything else — network first
  event.respondWith(networkFirstWithCache(event.request, CACHE_NAME));
});

function cacheFirstWithRevalidate(request, cacheName) {
  return caches.open(cacheName).then(function(cache) {
    return cache.match(request).then(function(cached) {
      var fetchPromise = fetch(request).then(function(response) {
        if (response && response.status === 200) {
          cache.put(request, response.clone());
        }
        return response;
      }).catch(function() {
        return cached;
      });
      return cached || fetchPromise;
    });
  });
}

function networkFirstWithCache(request, cacheName) {
  return fetch(request).then(function(response) {
    if (response && response.status === 200) {
      caches.open(cacheName).then(function(cache) {
        cache.put(request, response.clone());
      });
    }
    return response;
  }).catch(function() {
    return caches.match(request);
  });
}
