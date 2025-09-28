self.addEventListener('install', e => {
  e.waitUntil(caches.open('kids-v1').then(c => c.addAll([
    '/', '/kiosk/checkin', '/kiosk/signup'
  ])));
});
self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});