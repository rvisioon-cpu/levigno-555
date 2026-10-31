import { readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { spawn } from 'node:child_process';

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

const concurrency = 4;
let nextFile = 0;
let uploaded = 0;

async function upload(path) {
  const key = relative('public', path).split(sep).join('/');
  const extension = path.split('.').pop()?.toLowerCase();
  const contentType = extension === 'mp4'
    ? 'video/mp4'
    : extension === 'webp'
    ? 'image/webp'
    : extension === 'png'
    ? 'image/png'
    : 'image/jpeg';
  await new Promise((resolve, reject) => {
    const child = spawn('npx', [
      'wrangler', 'r2', 'object', 'put', `levigno-assets/${key}`,
      '--remote', '--file', path, '--content-type', contentType,
      '--cache-control', 'public, max-age=31536000, immutable',
    ]);
    let output = '';
    child.stdout.on('data', (chunk) => { output += chunk; });
    child.stderr.on('data', (chunk) => { output += chunk; });
    child.on('error', reject);
    child.on('close', (code) => code === 0
      ? resolve()
      : reject(new Error(`Failed to upload ${key} (exit ${code}):\n${output}`)));
  });
  uploaded++;
  console.log(`[${uploaded}/${files.length}] ${key}`);
}

async function worker() {
  while (nextFile < files.length) {
    const path = files[nextFile++];
    await upload(path);
  }
}

await Promise.all(Array.from({ length: Math.min(concurrency, files.length) }, worker));
console.log(`Uploaded ${files.length} typology assets to the levigno-assets R2 bucket.`);
