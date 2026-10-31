import { mkdtempSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { spawn } from 'node:child_process';

function execFile(file, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(file, args, { ...options, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', (code) => code === 0
      ? resolve({ stdout, stderr })
      : reject(new Error(`${file} exited with ${code}:\n${stderr || stdout}`)));
  });
}

const sourceDirectory = process.argv[2] || process.env.AMENITIES_SOURCE_DIR;
if (!sourceDirectory) {
  throw new Error('Pass the source folder: npm run assets:upload-amenities -- "/path/to/6. AMENIDADES"');
}

const files = readdirSync(sourceDirectory, { withFileTypes: true })
  .filter((entry) => entry.isFile() && /^(?:\d+|P\d+)\.(?:jpe?g|png)$/i.test(entry.name))
  .map((entry) => join(sourceDirectory, entry.name))
  .sort((a, b) => {
    const nameA = basename(a, a.slice(a.lastIndexOf('.')));
    const nameB = basename(b, b.slice(b.lastIndexOf('.')));
    const groupA = /^P/i.test(nameA) ? 1 : 0;
    const groupB = /^P/i.test(nameB) ? 1 : 0;
    return groupA - groupB || Number(nameA.replace(/\D/g, '')) - Number(nameB.replace(/\D/g, ''));
  });

if (!files.length) throw new Error(`No numbered JPG/PNG amenity images found in ${sourceDirectory}`);
for (const file of files) {
  if (statSync(file).size === 0) throw new Error(`Source image is empty: ${file}`);
}

const outputDirectory = mkdtempSync(join(tmpdir(), 'levigno-amenities-'));
let nextFile = 0;
let uploaded = 0;
let optimizedBytes = 0;
const originalBytes = files.reduce((sum, file) => sum + statSync(file).size, 0);

async function worker() {
  while (nextFile < files.length) {
    const source = files[nextFile++];
    const key = `amenities/${basename(source).replace(/\.(?:jpe?g|png)$/i, '.webp')}`;
    const optimized = join(outputDirectory, basename(key));
    const { stdout: dimensions } = await execFile('magick', ['identify', '-format', '%w %h', source]);
    const [width, height] = dimensions.trim().split(/\s+/).map(Number);
    const resizeArgs = width > 2560 || height > 1440 ? ['-resize', '2560', '1440'] : [];
    await execFile('cwebp', ['-quiet', '-q', '84', '-m', '6', ...resizeArgs, source, '-o', optimized]);
    optimizedBytes += statSync(optimized).size;
    await execFile('npx', [
      'wrangler', 'r2', 'object', 'put', `levigno-assets/${key}`,
      '--remote', '--file', optimized, '--content-type', 'image/webp',
      '--cache-control', 'public, max-age=31536000, immutable',
    ], { cwd: process.cwd() });

    uploaded++;
    console.log(`[${uploaded}/${files.length}] ${key} (${(statSync(optimized).size / 1024).toFixed(0)} KiB)`);
  }
}

try {
  const results = await Promise.allSettled(Array.from({ length: Math.min(3, files.length) }, worker));
  const failure = results.find((result) => result.status === 'rejected');
  if (failure) throw failure.reason;
  const savings = Math.round((1 - optimizedBytes / originalBytes) * 100);
  console.log(`Uploaded ${files.length} optimized amenity images to levigno-assets (${(originalBytes / 1024 / 1024).toFixed(1)} MiB → ${(optimizedBytes / 1024 / 1024).toFixed(1)} MiB, ${savings}% smaller).`);
} finally {
  rmSync(outputDirectory, { recursive: true, force: true });
}
