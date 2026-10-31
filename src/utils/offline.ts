// ============================================================================
// MODO OFFLINE — LIVIGNO 555
// Utilidades para llenar y auditar las cachés que consume `public/sw.js`.
//
// La descarga se ejecuta en el contexto de la ventana/pestaña (window),
// no dentro del service worker (el navegador mata trabajadores inactivos).
// ============================================================================

import { ASSET_BASE_URL, getAssetUrl } from '@/utils/assets';
import { floorsData } from '@/data/floors';

export const SHELL_CACHE = 'livigno-shell-v1';
export const MEDIA_CACHE = 'livigno-media-v1';

export type ManifestAsset = readonly [string, number];

export interface ManifestTier {
  id: 'critical' | 'full';
  label: string;
  bytes: number;
  assets: ManifestAsset[];
}

export interface PrecacheManifest {
  generatedAt: string;
  r2Base: string;
  totalAssets: number;
  totalBytes: number;
  tiers: ManifestTier[];
  missing: string[];
  publicAssets?: string[];
}

export interface Progress {
  bytes: number;
  totalBytes: number;
  files: number;
  totalFiles: number;
  current: string;
  bytesPerSecond: number;
  failed: number;
}

/**
 * Obtiene todas las rutas que deben precargarse en el Shell.
 */
export const getLivignoRoutesToWarm = (): string[] => {
  const baseRoutes = [
    '/',
    '/showroom',
    '/showroom?transition=intro',
    '/showroom?transition=floors&targetPath=/plantas',
    '/plantas',
    '/galeria',
    '/recorridos',
    '/video',
    '/ubicacion',
    '/avance-de-obra',
    '/contact',
    '/politica-de-privacidad',
    '/terminos-y-condiciones',
    '/preparar',
  ];

  // Unidades del edificio (42 departamentos)
  const unitRoutes: string[] = [];
  const seenUnits = new Set<string>();

  for (const floor of floorsData) {
    for (const unit of floor.units) {
      if (!seenUnits.has(unit.id)) {
        seenUnits.add(unit.id);
        unitRoutes.push(`/unidad/${unit.id}`);
        if (unit.assetId === 'T12' || unit.subtitle === 'Dúplex') {
          unitRoutes.push(`/unidad/${unit.id}?nivel=1`);
          unitRoutes.push(`/unidad/${unit.id}?nivel=2`);
        }
      }
    }
  }

  return [...new Set([...baseRoutes, ...unitRoutes])];
};

// ----------------------------------------------------------------------------
// Almacenamiento persistente
// ----------------------------------------------------------------------------

export const requestPersistentStorage = async (): Promise<boolean> => {
  if (typeof navigator === 'undefined' || !navigator.storage?.persist) return false;
  if (await navigator.storage.persisted?.()) return true;
  try {
    return await navigator.storage.persist();
  } catch {
    return false;
  }
};

export interface StorageEstimate {
  usageBytes: number;
  quotaBytes: number;
  persisted: boolean;
}

export const estimateStorage = async (): Promise<StorageEstimate | null> => {
  if (typeof navigator === 'undefined' || !navigator.storage?.estimate) return null;
  const { usage = 0, quota = 0 } = await navigator.storage.estimate();
  const persisted = (await navigator.storage.persisted?.()) ?? false;
  return { usageBytes: usage, quotaBytes: quota, persisted };
};

// ----------------------------------------------------------------------------
// Manifiesto
// ----------------------------------------------------------------------------

export const loadManifest = async (): Promise<PrecacheManifest> => {
  const response = await fetch('/precache-manifest.json', { cache: 'no-cache' });
  if (!response.ok) {
    throw new Error(
      'Falta /precache-manifest.json. Genéralo con: npm run offline:manifest',
    );
  }
  return (await response.json()) as PrecacheManifest;
};

// ----------------------------------------------------------------------------
// Descarga de Media
// ----------------------------------------------------------------------------

const CONCURRENCY = 6;

export class CorsNotConfiguredError extends Error {
  constructor() {
    super(
      'El almacenamiento remoto de R2 no permite peticiones desde este origen. ' +
        'Debes configurar CORS en el bucket levigno-assets con r2-cors.json.',
    );
    this.name = 'CorsNotConfiguredError';
  }
}

interface DownloadOptions {
  signal?: AbortSignal;
  onProgress: (progress: Progress) => void;
}

export const downloadAssets = async (
  assets: ManifestAsset[],
  options: DownloadOptions,
): Promise<{ failed: string[] }> => {
  const cache = await caches.open(MEDIA_CACHE);
  const totalBytes = assets.reduce((total, [, bytes]) => total + bytes, 0);

  let bytes = 0;
  let files = 0;
  let index = 0;
  let current = '';
  const failed: string[] = [];
  const startedAt = performance.now();
  let downloadedBytes = 0;

  const report = () => {
    const elapsedSeconds = (performance.now() - startedAt) / 1000;
    options.onProgress({
      bytes,
      totalBytes,
      files,
      totalFiles: assets.length,
      current,
      bytesPerSecond: elapsedSeconds > 0 ? downloadedBytes / elapsedSeconds : 0,
      failed: failed.length,
    });
  };

  const worker = async (): Promise<void> => {
    while (index < assets.length) {
      if (options.signal?.aborted) return;

      const [key, size] = assets[index++];
      const url = getAssetUrl(key);
      current = key;

      try {
        const already = await cache.match(url);
        if (!already) {
          const response = await fetch(url, { signal: options.signal, cache: 'reload' });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          await cache.put(url, response);
          downloadedBytes += size;
        }
        bytes += size;
        files++;
      } catch (error) {
        if (options.signal?.aborted) return;
        failed.push(key);
        if (error instanceof TypeError && failed.length > 5) {
          throw new CorsNotConfiguredError();
        }
      }

      report();
    }
  };

  report();
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  return { failed };
};

// ----------------------------------------------------------------------------
// Calentamiento del Shell
// ----------------------------------------------------------------------------

export const warmShell = async (
  routes: string[],
  onProgress: (route: string, index: number, total: number) => void,
): Promise<{ failed: string[] }> => {
  const cache = await caches.open(SHELL_CACHE);
  const failed: string[] = [];
  const assetUrls = new Set<string>();

  for (const [index, route] of routes.entries()) {
    onProgress(route, index, routes.length);
    try {
      const response = await fetch(route, { cache: 'no-cache' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const html = await response.clone().text();
      await cache.put(route, response);

      for (const match of html.matchAll(/["'(](\/_next\/static\/[^"')\s]+)["')]/g)) {
        assetUrls.add(match[1]);
      }
      for (const match of html.matchAll(/["'(](\/fonts\/[^"')\s]+)["')]/g)) {
        assetUrls.add(match[1]);
      }
    } catch {
      failed.push(route);
    }
  }

  // Estáticos del shell requeridos
  assetUrls.add('/precache-manifest.json');
  assetUrls.add('/favicon.ico');
  assetUrls.add('/portada.png');
  assetUrls.add('/intro.jpg');

  try {
    const manifest = await loadManifest();
    for (const path of manifest.publicAssets ?? []) assetUrls.add(path);
  } catch {
    // Continúa si no se ha cargado el manifiesto aún
  }

  const cacheBatch = async (urls: string[], speculative = false): Promise<string[]> => {
    const scripts: string[] = [];
    await Promise.all(
      urls.map(async (url) => {
        try {
          let response = await cache.match(url);
          if (!response) {
            const fetched = await fetch(url);
            if (!fetched.ok) {
              if (!speculative) failed.push(url);
              return;
            }
            await cache.put(url, fetched.clone());
            response = fetched;
          }
          if (url.endsWith('.js')) scripts.push(await response.text());
        } catch {
          if (!speculative) failed.push(url);
        }
      }),
    );
    return scripts;
  };

  // Escaneo recursivo de imports dinámicos en los bundles JS de Next.js
  const CHUNK_REFERENCE = /static\/chunks\/[a-zA-Z0-9._-]+\.(?:js|css)/g;
  const seen = new Set(assetUrls);
  let frontier = [...assetUrls];

  for (let pass = 0; pass < 6 && frontier.length > 0; pass++) {
    const scripts = await cacheBatch(frontier, pass > 0);
    const discovered = new Set<string>();

    for (const source of scripts) {
      for (const match of source.matchAll(CHUNK_REFERENCE)) {
        const url = `/_next/${match[0]}`;
        if (!seen.has(url)) {
          seen.add(url);
          discovered.add(url);
        }
      }
    }

    frontier = [...discovered];
    if (frontier.length > 0) {
      onProgress(`${frontier.length} archivos de soporte`, routes.length, routes.length);
    }
  }

  return { failed };
};

// ----------------------------------------------------------------------------
// Inspección y Auditoría del Estado Local
// ----------------------------------------------------------------------------

export interface CacheStatus {
  cachedFiles: number;
  cachedBytes: number;
  totalFiles: number;
  totalBytes: number;
  missingKeys: string[];
}

export const inspectCache = async (tiers: ManifestTier[]): Promise<CacheStatus> => {
  const cache = await caches.open(MEDIA_CACHE);
  const assets = tiers.flatMap((tier) => tier.assets);

  let cachedFiles = 0;
  let cachedBytes = 0;
  const missingKeys: string[] = [];

  const stored = new Set((await cache.keys()).map((request) => request.url));

  for (const [key, bytes] of assets) {
    if (stored.has(getAssetUrl(key))) {
      cachedFiles++;
      cachedBytes += bytes;
    } else {
      missingKeys.push(key);
    }
  }

  return {
    cachedFiles,
    cachedBytes,
    totalFiles: assets.length,
    totalBytes: assets.reduce((total, [, bytes]) => total + bytes, 0),
    missingKeys,
  };
};

export const clearOfflineCaches = async (): Promise<void> => {
  await Promise.all([caches.delete(MEDIA_CACHE), caches.delete(SHELL_CACHE)]);
};

export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1_073_741_824) return `${(bytes / 1_048_576).toFixed(0)} MB`;
  return `${(bytes / 1_073_741_824).toFixed(2)} GB`;
};

export const formatDuration = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds <= 0) return '—';
  if (seconds < 60) return `${Math.ceil(seconds)} s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
};

export { ASSET_BASE_URL };
