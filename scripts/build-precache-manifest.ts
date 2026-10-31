// ============================================================================
// MANIFIESTO DE PRECARGA — LIVIGNO 555
// Genera la lista de claves de media que el Service Worker y /preparar guardan
// para que el showroom funcione 100% sin internet.
//
//   npx tsx scripts/build-precache-manifest.ts          (pesos cacheados / locales)
//   npx tsx scripts/build-precache-manifest.ts --measure (vuelve a medir contra R2 y local)
//
// Escribe:
//   public/precache-manifest.json
//   scripts/.precache-sizes.json
// ============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { assetManifest } from '../src/data/asset-manifest';
import * as buildingData from '../src/data/buildingData';
import { homepageData } from '../src/data/homepage';
import { floorsData } from '../src/data/floors';
import { tours } from '../src/data/tours';
import { projectVideo } from '../src/data/video';
import { galleries } from '../src/data/galleries';
import { constructionProgress } from '../src/data/constructionProgress';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT = path.join(ROOT, 'public', 'precache-manifest.json');
const SIZE_CACHE = path.join(ROOT, 'scripts', '.precache-sizes.json');

const R2_BASE =
  process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.replace(/\/$/, '') ||
  process.env.NEXT_PUBLIC_ASSET_BASE_URL?.replace(/\/$/, '') ||
  '';

// ----------------------------------------------------------------------------
// 1. Recolección de claves
// ----------------------------------------------------------------------------

const MEDIA_EXTENSION = /\.(webp|mp4|png|jpe?g|avif)$/i;

const isMediaKey = (value: string): boolean => {
  if (typeof value !== 'string') return false;
  if (value.startsWith('http') || value.startsWith('data:') || value.startsWith('blob:')) return false;
  const clean = value.replace(/^\//, '').split('?')[0].split('#')[0];
  return MEDIA_EXTENSION.test(clean);
};

const cleanKey = (value: string): string => {
  return value.replace(/^\//, '').split('?')[0].split('#')[0];
};

const collectKeys = (...roots: unknown[]): Set<string> => {
  const found = new Set<string>();
  const visited = new WeakSet<object>();

  const walk = (value: unknown): void => {
    if (typeof value === 'string') {
      if (isMediaKey(value)) found.add(cleanKey(value));
      return;
    }
    if (!value || typeof value !== 'object') return;
    if (visited.has(value as object)) return;
    visited.add(value as object);
    for (const child of Object.values(value as Record<string, unknown>)) walk(child);
  };

  roots.forEach(walk);
  return found;
};

// ----------------------------------------------------------------------------
// 2. Reparto en Tiers (critical vs full)
// ----------------------------------------------------------------------------
// CRITICAL: Lo que se usa en el recorrido principal indispensable:
//   - Portada y hero
//   - Fachadas de día y sus loops / transiciones base
//   - Planos de plantas (1-17, s1-s3)
//   - Planos y vistas principales de tipologías (T1-T12)
//   - Identidad y logos
// FULL: Todo el material secundario o de exploración profunda:
//   - Fachadas de noche
//   - Galerías de fotos de amenidades y departamentos
//   - Transiciones de tipologías amoblado/desamoblado
//   - Videos generales y de ubicación
//   - Avance de obra

export type TierId = 'critical' | 'full';

const CRITICAL_RULES: RegExp[] = [
  /^homepage\//,
  /^identity\//,
  /^videos\/portada\.mp4$/,
  /^building\/exterior\/0\./,
  /^building\/exterior\/[1-3]\.1\./,
  /^building\/exterior\/[1-3]\.1-[1-3]\.1/,
  /^building\/exterior\/1\.1-3\.mp4$/,
  /^building\/exterior\/3\.1-1\.1\.mp4$/,
  /^plants\/floor_[0-9s]+\.jpg$/,
  /^plants\/details\/T\d+\/(plans|furnished|unfurnished|deliverable)\.(webp|jpg)$/,
  /^plants\/details\/T12\/.*2floor\.(webp|jpg)$/,
];

const tierOf = (key: string): TierId =>
  CRITICAL_RULES.some((rule) => rule.test(key)) ? 'critical' : 'full';

const EXTRA_KEYS: string[] = [
  'building/exterior/0.1-0.mp4',
  'building/exterior/0.2-1.1.mp4',
  'building/exterior/0.2.loop.mp4',
  'building/exterior/0.2.jpg',
  'videos/portada.mp4',
  'portada.png',
  'intro.jpg',
];

const EXCLUDE_RULES: RegExp[] = [];

const isExcluded = (key: string): boolean => EXCLUDE_RULES.some((rule) => rule.test(key));

// ----------------------------------------------------------------------------
// 3. Rastreo de claves sueltas en componentes
// ----------------------------------------------------------------------------

type SizeMap = Record<string, number>;

const findUnreferencedKeys = (manifestKeys: Set<string>, sizes: SizeMap): string[] => {
  const sourceDirs = [path.join(ROOT, 'src', 'components'), path.join(ROOT, 'src', 'app')];
  const pattern = /['"`]((?:[a-z0-9][a-z0-9_.-]*\/)+[a-zA-Z0-9_.-]+\.(?:webp|mp4|png|jpe?g))['"`]/g;
  const found = new Set<string>();

  const scan = (dir: string): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scan(full);
      } else if (/\.tsx?$/.test(entry.name)) {
        const source = fs.readFileSync(full, 'utf8');
        for (const match of source.matchAll(pattern)) {
          const key = cleanKey(match[1]);
          if (isMediaKey(key)) found.add(key);
        }
      }
    }
  };

  sourceDirs.filter((dir) => fs.existsSync(dir)).forEach(scan);

  return [...found]
    .filter((key) => !manifestKeys.has(key) && !isExcluded(key) && (sizes[key] ?? -1) > 0)
    .sort();
};

// ----------------------------------------------------------------------------
// 4. Medición de pesos (local filesystem o remoto R2)
// ----------------------------------------------------------------------------

const readSizeCache = (): SizeMap => {
  try {
    return JSON.parse(fs.readFileSync(SIZE_CACHE, 'utf8')) as SizeMap;
  } catch {
    return {};
  }
};

const measureSizes = async (keys: string[], cached: SizeMap): Promise<SizeMap> => {
  const sizes: SizeMap = {};
  let index = 0;
  let done = 0;

  const measureKey = async (key: string): Promise<number> => {
    // 1. Probar archivo local en public/
    const localPath = path.join(ROOT, 'public', key);
    if (fs.existsSync(localPath)) {
      try {
        return fs.statSync(localPath).size;
      } catch {}
    }

    // 2. Si hay R2_BASE remoto, probar con HEAD
    if (R2_BASE) {
      try {
        const response = await fetch(`${R2_BASE}/${key}`, { method: 'HEAD' });
        if (response.ok) {
          const cl = response.headers.get('content-length');
          return cl ? Number(cl) : 0;
        }
      } catch {}
    }

    // 3. Revisar caché anterior
    if (cached[key] !== undefined) return cached[key];

    return -1;
  };

  const worker = async (): Promise<void> => {
    while (index < keys.length) {
      const key = keys[index++];
      sizes[key] = await measureKey(key);
      done++;
      if (done % 50 === 0 || done === keys.length) {
        process.stderr.write(`  medidos ${done}/${keys.length}\n`);
      }
    }
  };

  await Promise.all(Array.from({ length: 15 }, worker));
  return sizes;
};

// ----------------------------------------------------------------------------
// 5. Estáticos locales en public/
// ----------------------------------------------------------------------------

const collectPublicAssets = (): string[] => {
  const publicDir = path.join(ROOT, 'public');
  if (!fs.existsSync(publicDir)) return [];

  const SERVED = /\.(png|webp|jpe?g|svg|avif|woff2?|ttf)$/i;
  const found: string[] = [];

  const walk = (dir: string): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (SERVED.test(entry.name)) {
        const relative = path.relative(publicDir, full);
        found.push(`/${relative.split(path.sep).map(encodeURIComponent).join('/')}`);
      }
    }
  };

  walk(publicDir);
  return found.sort();
};

const formatMB = (bytes: number): string => `${(bytes / 1_048_576).toFixed(1)} MB`;

// ----------------------------------------------------------------------------
// Función principal
// ----------------------------------------------------------------------------

const main = async (): Promise<void> => {
  const shouldMeasure = process.argv.includes('--measure');

  // Recolectar claves del dominio de Livigno
  const domainKeys = collectKeys(
    buildingData,
    homepageData,
    floorsData,
    tours,
    projectVideo,
    galleries,
    constructionProgress,
  );

  const manifestKeys = assetManifest.map(cleanKey).filter(isMediaKey);

  const allKeys = [...new Set([...domainKeys, ...manifestKeys, ...EXTRA_KEYS.map(cleanKey)])].sort();

  const cached = readSizeCache();
  const sizes = shouldMeasure || Object.keys(cached).length === 0 ? await measureSizes(allKeys, cached) : cached;

  if (shouldMeasure || Object.keys(cached).length === 0) {
    fs.writeFileSync(SIZE_CACHE, `${JSON.stringify(sizes, null, 2)}\n`);
  }

  const unmeasured = allKeys.filter((key) => sizes[key] === undefined);
  if (unmeasured.length > 0) {
    console.warn(`\n${unmeasured.length} claves sin peso conocido. Ejecuta con --measure.`);
  }

  const excluded = allKeys.filter(isExcluded);
  const usableKeys = allKeys.filter((key) => !isExcluded(key));
  const present = usableKeys.filter((key) => (sizes[key] ?? -1) > 0);

  const declared = new Set([...domainKeys, ...EXTRA_KEYS.map(cleanKey)]);
  const missing = usableKeys.filter((key) => (sizes[key] ?? -1) === -1 && declared.has(key));

  const tiers = (['critical', 'full'] as TierId[]).map((id) => {
    const keys = present.filter((key) => tierOf(key) === id);
    return {
      id,
      label: id === 'critical' ? 'Recorrido principal' : 'Material completo',
      bytes: keys.reduce((total, key) => total + (sizes[key] || 0), 0),
      assets: keys.map((key) => [key, sizes[key] || 0] as const),
    };
  });

  const totalBytes = tiers.reduce((total, tier) => total + tier.bytes, 0);

  const manifest = {
    generatedAt: new Date().toISOString(),
    r2Base: R2_BASE,
    totalAssets: present.length,
    totalBytes,
    tiers,
    missing,
    publicAssets: collectPublicAssets(),
  };

  fs.writeFileSync(OUTPUT, `${JSON.stringify(manifest, null, 2)}\n`);

  console.log(`\nManifiesto generado exitosamente en public/precache-manifest.json`);
  console.log(`  ${present.length} assets disponibles (${formatMB(totalBytes)})`);
  for (const tier of tiers) {
    console.log(`  ${tier.id.padEnd(9)} ${String(tier.assets.length).padStart(4)} archivos  ${formatMB(tier.bytes)}`);
  }

  if (missing.length > 0) {
    console.log(`\n  MATERIAL PENDIENTE — ${missing.length} claves declaradas no encontradas:`);
    for (const key of missing.slice(0, 10)) console.log(`    ${key}`);
    if (missing.length > 10) console.log(`    ... y ${missing.length - 10} más.`);
  }

  const unreferenced = findUnreferencedKeys(new Set(present), sizes);
  if (unreferenced.length > 0) {
    console.log(`\n  AVISO — ${unreferenced.length} claves referenciadas en código no incluidas en el manifiesto:`);
    for (const key of unreferenced) console.log(`    ${key}`);
  }
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
