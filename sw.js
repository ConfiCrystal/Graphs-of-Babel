const CACHE_NAME = `babel-1.0`;
const files = ['/', 'forceDirected.html', 'index.html', 'nav.html', 'NPDA.html', 'readWriters.html', 'config.js', 'forceDirected.js', 'nav.js', 'NPDA.js', 'readWriters.js', 'sw.js', 'babel.css', 'icon512.png', 'manifest.json', 'COW.csv'];

// Skip and update
self.addEventListener('install', event => {
    event.waitUntil((async () => {
        const cache = await caches.open(CACHE_NAME);
        cache.addAll(files);
    })());
    self.skipWaiting();
    self.update();
});

// Local save
self.addEventListener('fetch', event => {
    event.respondWith((async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(event.request);

        if (cachedResponse) {
            return cachedResponse;
        } else {
            const fetchResponse = await fetch(event.request);
            cache.put(event.request, fetchResponse.clone());
            return fetchResponse;
        }
    })());
});