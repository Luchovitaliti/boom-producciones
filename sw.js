const CACHE = 'boom-v4';
const PRECACHE = [
  '/', '/index.html', '/css/style.css',
  '/js/data.js', '/js/helpers.js', '/js/auth.js',
  '/js/ui.js', '/js/firebase.js',
  '/js/modules/home.js',
  '/js/modules/dashboard.js',
  '/js/modules/barra.js',
  '/js/modules/adminfin.js',
  '/js/modules/liderpub.js',
  '/js/modules/publicas.js',
  '/js/modules/cm.js',
  '/js/modules/boom.js',
  '/js/modules/chat.js',
  '/js/modules/proveedores.js',
  '/js/modules/kpi.js',
  '/js/modules/trafic.js',
  '/js/modules/recaudacion.js',
  '/js/modules/boomhero.js',
  '/js/modules/heroconfig.js',
  '/js/modules/deco.js',
  '/js/modules/dev.js',
  '/js/modules/usuarios.js',
  '/js/modules/perfil.js',
  '/img/icon.svg',
  '/manifest.json',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      // addAll fails if any request fails; use individual puts to be resilient
      Promise.allSettled(PRECACHE.map(url =>
        fetch(url).then(res => { if (res.ok) c.put(url, res); }).catch(() => {})
      ))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith(self.location.origin)) return; // skip Firebase/external

  const isHtml = e.request.headers.get('Accept')?.includes('text/html');

  if (isHtml) {
    // HTML: network-first → always fresh app shell
    e.respondWith(
      fetch(e.request)
        .then(res => { caches.open(CACHE).then(c => c.put(e.request, res.clone())); return res; })
        .catch(() => caches.match(e.request))
    );
  } else {
    // Assets: cache-first → instant load
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
        if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        return res;
      }))
    );
  }
});
