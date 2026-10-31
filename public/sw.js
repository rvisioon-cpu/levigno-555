/* eslint-disable no-restricted-globals */
// ============================================================================
// SERVICE WORKER — sirve el showroom de Livigno sin internet
// ----------------------------------------------------------------------------
// ESTE ARCHIVO SOLO LEE. No descarga nada por iniciativa propia: se limita a
// responder desde las cachés que llenó `/preparar`.
//
// Es deliberado. Un service worker es un proceso que el navegador desaloja tras
// ~30 segundos de inactividad, y reanudarlo no reanuda lo que estuviera
// haciendo. Meter dentro la descarga de cientos de megabytes significaría que
// el navegador puede cortarla por la mitad sin que la pantalla de progreso se
// entere. La Cache API también está disponible desde una pestaña normal, y una
// pestaña vive mientras el presentador la mantenga abierta.
//
// Las dos cachés y por qué están separadas:
//   livigno-shell-v2   HTML de las rutas, chunks de Next, fuentes, iconos
//   livigno-media-v1   los assets y videos de R2 y del edificio
// Separadas porque se invalidan por motivos distintos: el shell caduca con
// cada despliegue de código y el media solo cuando se resube material.
// ============================================================================

const SHELL_VERSION = 'v2';
const MEDIA_VERSION = 'v1';
const SHELL_CACHE = `livigno-shell-${SHELL_VERSION}`;
const MEDIA_CACHE = `livigno-media-${MEDIA_VERSION}`;
const KNOWN_CACHES = [SHELL_CACHE, MEDIA_CACHE];

// Origen del bucket, leído de la query con la que se registró este worker
// (`/sw.js?media=https://…`).
const mediaOrigin = (() => {
  try {
    const declared = new URL(self.location.href).searchParams.get('media');
    return declared ? new URL(declared).origin : null;
  } catch {
    return null;
  }
})();

self.addEventListener('install', () => {
  // Activar de inmediato: no quedarse esperando a que la pestaña anterior se cierre.
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

// ----------------------------------------------------------------------------
// Rangos: soporte para <video> y Range requests
// ----------------------------------------------------------------------------
// Un elemento <video> pide `Range: bytes=…` y espera un código `206 Partial Content`
// con su correspondiente cabecera `Content-Range`. La Cache API guarda la
// respuesta COMPLETA (200 OK) e ignora la cabecera Range. Sin este paso, el video
// no arranca o falla en Safari y al mover la barra de tiempo.
//
// Fabricamos la respuesta 206 recortando el arrayBuffer en memoria.
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

/**
 * Sirve peticiones con soporte de rangos desde la caché especificada.
 */
const serveRanged = async (request, cacheName) => {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request, { ignoreVary: true });
  if (cached) {
    const range = request.headers.get('range');
    return range ? rangeResponse(cached, range) : cached;
  }

  // Sin caché: pedir a la red.
  const response = await fetch(request);
  if (response.ok && !request.headers.get('range')) {
    cache.put(request, response.clone()).catch(() => {});
  }
  return response;
};

/** Estáticos de Next y de `public/`: inmutables, la caché manda. */
const serveStatic = async (request) => {
  const cache = await caches.open(SHELL_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone()).catch(() => {});
  return response;
};

/**
 * Navegaciones: red primero con timeout de 4 s, fallback a la caché.
 */
const serveNavigation = async (request) => {
  const cache = await caches.open(SHELL_CACHE);

  try {
    const response = await Promise.race([
      fetch(request),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 4000)),
    ]);
    if (response.ok) cache.put(request, response.clone()).catch(() => {});
    return response;
  } catch {
    const exact = await cache.match(request);
    if (exact) return exact;

    // Sin coincidencia exacta se prueba sin query.
    const loose = await cache.match(request, { ignoreSearch: true });
    if (loose) return loose;

    const home = await cache.match('/');
    if (home) return home;

    return new Response(
      '<!doctype html><meta charset="utf-8"><title>Livigno 555 — Sin conexión</title>' +
        '<body style="font-family:system-ui;padding:3rem;text-align:center;background:#111;color:#fff;">' +
        '<h1>Esta pantalla no está descargada</h1>' +
        '<p style="color:#aaa;">Conéctate a internet y abre <a href="/preparar" style="color:#ff8400;text-decoration:underline;">/preparar</a> para dejar el showroom listo sin conexión.</p>',
      { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    );
  }
};

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Solo peticiones GET. Las mutaciones y POSTs nunca se cachean.
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // 1. Media externo de R2
  if (mediaOrigin && url.origin === mediaOrigin) {
    event.respondWith(serveRanged(request, MEDIA_CACHE));
    return;
  }

  // 2. Misma procedencia (Same origin)
  if (url.origin !== self.location.origin) return;

  // Rutas de API que son de datos (excepto /api/r2/ que es media)
  if (url.pathname.startsWith('/api/') && !url.pathname.startsWith('/api/r2/')) return;

  // Media local o proxy de R2
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

  // Navegación de páginas (HTML)
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
