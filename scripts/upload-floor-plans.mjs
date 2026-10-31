import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const directory = 'public/plants';
const expected = [
  ...Array.from({ length: 17 }, (_, index) => `floor_${index + 1}.jpg`),
  ...[1, 2, 3].map((level) => `floor_s${level}.jpg`),
];
const files = new Set(readdirSync(directory));
const missing = expected.filter((file) => !files.has(file));

if (missing.length) {
  throw new Error(`Missing floor plan assets: ${missing.join(', ')}`);
}

for (const file of expected) {
  const path = join(directory, file);
  if (statSync(path).size > 25 * 1024 * 1024) {
    throw new Error(`Floor plan exceeds the supported size limit: ${path}`);
  }

  const result = spawnSync('npx', [
    'wrangler', 'r2', 'object', 'put', `levigno-assets/plants/${file}`,
    '--remote', '--file', path, '--content-type', 'image/jpeg',
    '--cache-control', 'public, max-age=31536000, immutable',
  ], { stdio: 'inherit' });

  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log(`Uploaded ${expected.length} floor plans to the levigno-assets R2 bucket.`);
