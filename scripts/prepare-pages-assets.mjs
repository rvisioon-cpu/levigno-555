import { readdirSync, rmSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const root = '.open-next/assets';
const r2BackedLargeAssets = new Set([
  'videos/premapa.mp4',
  'location/videos/hitos/plaza-san-miguel/full.mp4',
]);
const maxAssetSize = 25 * 1024 * 1024;
let removed = 0;

function prepare(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      prepare(path);
      continue;
    }

    const key = relative(root, path).split(sep).join('/');
    if (statSync(path).size > maxAssetSize) {
      if (!r2BackedLargeAssets.has(key) && !/^plants\/(floor_(\d+|s\d+)\.jpg|details\/.*\.(mp4|jpe?g|png|webp))$/i.test(key)) {
        throw new Error(`Pages asset exceeds 25 MiB and has no R2 route: ${key}`);
      }
      rmSync(path);
      removed++;
    }
  }
}

prepare(root);
console.log(`Pages assets prepared: ${removed} large files will be served from R2.`);
