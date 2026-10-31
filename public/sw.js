/* eslint-disable no-restricted-globals */
// ============================================================================
// SERVICE WORKER — LIVIGNO 555
//
// MODO OFFLINE: DESACTIVADO POR DEFECTO ("OFF").
// Si no viene con `enabled=true` en la query de registro, este worker
// se desregistra de inmediato y NO intercepta peticiones.
// ============================================================================

const isOfflineEnabled = (() => {
  try {
    const url = new URL(self.location.href);
    return url.searchParams.get('enabled') === 'true' || url.searchParams.get('offline') === '1';
  } catch {
    return false;
  }
})();

// Si está desactivado, desregistrar y limpiar sin interceptar
if (!isOfflineEnabled) {
  self.addEventListener('install', () => {
    self.skipWaiting();
  });

  self.addEventListener('activate', (event) => {
    event.waitUntil(
      (async () => {
        const names = await caches.keys();
        await Promise.all(
          names
            .filter((name) => name.startsWith('livigno-'))
            .map((name) => caches.delete(name)),
        );
        await self.registration.unregister();
      })(),
    );
  });
} else {
  // LÓGICA ACTIVA CUANDO EL MODO OFFLINE ESTÁ HABILITADO
  const SHELL_VERSION = 'v2';
  const MEDIA_VERSION = 'v1';
  const SHELL_CACHE = `livigno-shell-${SHELL_VERSION}`;
  const MEDIA_CACHE = `livigno-media-${MEDIA_VERSION}`;
  const KNOWN_CACHES = [SHELL_CACHE, MEDIA_CACHE];

  const mediaOrigin = (() => {
    try {
      const declared = new URL(self.location.href).searchParams.get('media');
      return declared ? new URL(declared).origin : null;
    } catch {
      return null;
    }
  })();

  self.addEventListener('install', () => {
    self.skipWaiting();
  });

  self.addEventListener('activate', (event) => {
    event.waitUntil(
      (async () => {
        const names = await caches.keys();
        await Promise.all(
          names
            .filter((name) => name.startsWith('livigno-') && !KNOWN_CACHES.includes(name))
            .map((name) => caches.delete(name)),
        );
        await self.clients.claim();
      })(),
    );
  });

  const rangeResponse = async (cached, rangeHeader) => {
    const buffer = await cached.arrayBuffer();
    const total = buffer.byteLength;

    const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
    if (!match) {
      return new Response(buffer, { status: 200, headers: cached.headers });
    }

    const [, rawStart, rawEnd] = match;
    let start;
    let end;

    if (rawStart === '') {
      const suffix = Number(rawEnd);
      start = Math.max(0, total - suffix);
      end = total - 1;
    } else if (rawEnd === '') {
      start = Number(rawStart);
      end = total - 1;
    } else {
      start = Number(rawStart);
      end = Math.min(Number(rawEnd), total - 1);
    }

    if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= total) {
      return new Response(null, {
        status: 416,
        headers: {
          'Content-Range': `bytes */${total}`,
          'Accept-Ranges': 'bytes',
        },
      });
    }

    const sliced = buffer.slice(start, end + 1);
    const headers = new Headers(cached.headers);
    headers.set('Content-Range', `bytes ${start}-${end}/${total}`);
    headers.set('Content-Length', String(sliced.byteLength));
    headers.set('Accept-Ranges', 'bytes');

    return new Response(sliced, { status: 206, headers });
  };

  const serveRanged = async (request, cacheName) => {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request, { ignoreVary: true });
    if (cached) {
      const range = request.headers.get('range');
      return range ? rangeResponse(cached, range) : cached;
    }

    const response = await fetch(request);
    if (response.ok && !request.headers.get('range')) {
      cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  };

  const serveStatic = async (request) => {
    const cache = await caches.open(SHELL_CACHE);
    const cached = await cache.match(request);
    if (cached) return cached;

    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone()).catch(() => {});
    return response;
  };

  const serveNavigation = async (request) => {
    const cache = await caches.open(SHELL_CACHE);

    try {
      const response = await fetch(request);
      if (response.ok) cache.put(request, response.clone()).catch(() => {});
      return response;
    } catch {
      const exact = await cache.match(request);
      if (exact) return exact;

      const loose = await cache.match(request, { ignoreSearch: true });
      if (loose) return loose;

      const home = await cache.match('/');
      if (home) return home;

      return fetch(request);
    }
  };

  self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET') return;

    const url = new URL(request.url);

    // Media externo de R2
    if (mediaOrigin && url.origin === mediaOrigin) {
      event.respondWith(serveRanged(request, MEDIA_CACHE));
      return;
    }

    if (url.origin !== self.location.origin) return;

    // Rutas de API que son de datos
    if (url.pathname.startsWith('/api/') && !url.pathname.startsWith('/api/r2/')) return;

    // Media local
    if (
      url.pathname.startsWith('/building/') ||
      url.pathname.startsWith('/plants/') ||
      url.pathname.startsWith('/videos/') ||
      url.pathname.startsWith('/amenities/') ||
      url.pathname.startsWith('/location/videos/') ||
      url.pathname.startsWith('/gallery/') ||
      url.pathname.startsWith('/api/r2/')
    ) {
      event.respondWith(serveRanged(request, MEDIA_CACHE));
      return;
    }

    // Navegación
    if (request.mode === 'navigate') {
      event.respondWith(serveNavigation(request));
      return;
    }

    // Estáticos del shell
    if (
      url.pathname.startsWith('/_next/static/') ||
      url.pathname.startsWith('/fonts/') ||
      url.pathname.startsWith('/icons/') ||
      url.pathname.startsWith('/identity/') ||
      url.pathname === '/precache-manifest.json' ||
      url.pathname === '/favicon.ico' ||
      url.pathname === '/portada.png' ||
      url.pathname === '/intro.jpg'
    ) {
      event.respondWith(serveStatic(request));
    }
  });
}
