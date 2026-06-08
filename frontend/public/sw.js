/** Service Worker minimal — requis par Chrome/Android pour proposer l'installation de la PWA.
 * Stratégie : réseau d'abord, cache en fallback pour les navigations (rechargement hors ligne). */

const CACHE_NAME = 'educmentor-v1';

self.addEventListener('install', () => {
  // Activation immédiate sans attendre la fermeture des autres onglets.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Supprimer les anciens caches quand une nouvelle version du SW est déployée.
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // On ne gère que les navigations (GET sur des pages HTML).
  // Les assets JS/CSS ont déjà des hash Vite — le cache HTTP suffit pour eux.
  if (event.request.mode !== 'navigate') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Mettre en cache la réponse pour le fallback hors ligne.
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse.clone()));
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});
