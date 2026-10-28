import { readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = 'public/plants/details';
const files = [];

function collect(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) collect(path);
    else files.push(path);
  }
}

collect(root);
if (files.length === 0) throw new Error(`No typology assets found in ${root}`);

for (const path of files) {
  if (statSync(path).size > 25 * 1024 * 1024) {
    throw new Error(`Typology asset exceeds the supported size limit: ${path}`);
  }
  const key = relative('public', path).split(sep).join('/');
  const result = spawnSync('npx', [
    'wrangler', 'r2', 'object', 'put', `levigno-assets/${key}`,
    '--remote', '--file', path, '--content-type', 'image/jpeg',
    '--cache-control', 'public, max-age=31536000, immutable',
  ], { stdio: 'inherit' });

  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log(`Uploaded ${files.length} typology images to the levigno-assets R2 bucket.`);
