import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const generalOnly = process.argv.includes('--general-only');
const args = process.argv.slice(2).filter(argument => argument !== '--general-only');
const source = path.resolve(args[0] ?? path.join(root, '..', 'work', 'actualizacion-portada-20261119'));
const generalVideo = path.resolve(args[1] ?? process.env.GENERAL_VIDEO_PATH ?? path.join(source, 'VIDEO LIVIGNO.mp4'));
const version = '20261119';
const exterior = `building/exterior/${version}`;
const fallbackFfmpeg = path.join(root, '..', 'arquitecto_transiciones', '.venv', 'lib', 'python3.9', 'site-packages', 'imageio_ffmpeg', 'binaries', 'ffmpeg-macos-aarch64-v7.1');
const ffmpeg = process.env.FFMPEG_PATH ?? (fs.existsSync(fallbackFfmpeg) ? fallbackFfmpeg : 'ffmpeg');
const ffmpegCheck = spawnSync(ffmpeg, ['-version'], { encoding: 'utf8' });
if (ffmpegCheck.status !== 0) throw new Error('FFmpeg is unavailable. Set FFMPEG_PATH to its executable path.');

// ZIP filenames can use decomposed accents and inconsistent capitalization.
function sourceFile(relative) {
  return relative.split('/').reduce((directory, segment) => {
    const canonical = segment.normalize('NFC').toLocaleLowerCase('es');
    const entry = fs.readdirSync(directory).find(name => name.normalize('NFC').toLocaleLowerCase('es') === canonical);
    if (!entry) throw new Error(`Missing source: ${relative}`);
    return path.join(directory, entry);
  }, source);
}

const images = ['0.1', '0.2', '1.1', '1.2', '2.1', '2.2', '3.1', '3.2'].map(id => ({
  source: `FINALES/LIVIGNO EXTERIORES NUEVO/${id}.png`,
  key: `${exterior}/photos/${id}.webp`,
}));
const videos = [
  { source: 'PORTADA.mp4', key: `videos/${version}/portada.mp4` },
  { source: 'VIDEO LIVIGNO.mp4', file: generalVideo, key: `videos/${version}/livigno-general.mp4` },
  { source: 'FINALES/LOOP GENERAL.mp4', key: `${exterior}/aerial-loop.mp4` },
  { source: 'FINALES/0.1 A 0.2.mp4', key: `${exterior}/0.1-0.2.mp4` },
  { source: 'FINALES/0.2 a 1.1.mp4', key: `${exterior}/0.2-1.1.mp4` },
  ...['1.1', '1.2', '2.1', '2.2', '3.1', '3.2'].map(id => ({
    source: `FINALES/A PLANTA/${id}. A UP.mp4`, key: `${exterior}/${id}-up.mp4`,
  })),
  ...[['1.1', '1.2'], ['1.2', '1.1'], ['2.1', '2.2'], ['2.2', '2.1'], ['3.1', '3.2'], ['3.2', '3.1']].map(([from, to]) => ({
    source: `FINALES/DÍA A NOCHE/${from} A ${to}.mp4`, key: `${exterior}/${from}-${to}.mp4`,
  })),
  ...[
    ['1.1', '2.1'], ['1.1', '3.1'], ['1.2', '2.2', '1.2 A 2.1.mp4'], ['1.2', '3.2'],
    ['2.1', '1.1'], ['2.2', '1.2'], ['3.1', '1.1'], ['3.2', '1.2'],
  ].map(([from, to, filename]) => ({
    source: `FINALES/LATERALES/${filename ?? `${from} A ${to}.mp4`}`, key: `${exterior}/${from}-${to}.mp4`,
  })),
];
const posters = [
  { source: 'PORTADA.mp4', key: `homepage/${version}/portada.webp` },
  { source: 'VIDEO LIVIGNO.mp4', file: generalVideo, key: `videos/${version}/livigno-general-poster.webp` },
];
const assets = [...images, ...videos, ...posters];
if (assets.length !== 35 || new Set(assets.map(asset => asset.key)).size !== assets.length) {
  throw new Error('Expected exactly 35 unique media keys.');
}
// Verify every input before preparing any output.
for (const asset of assets) {
  asset.file ??= sourceFile(asset.source);
  if (!fs.existsSync(asset.file)) throw new Error(`Missing source: ${asset.source}`);
}
// Add the general video without rewriting files that may already be uploading.
const selected = asset => !generalOnly || asset.source === 'VIDEO LIVIGNO.mp4';

function output(key) {
  const destination = path.join(root, 'public', key);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  return destination;
}

for (const asset of images.filter(selected)) {
  await sharp(asset.file)
    .resize({ width: 3840, height: 2160, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 90 })
    .toFile(output(asset.key));
  console.log(`Prepared ${asset.key}`);
}
for (const asset of videos.filter(selected)) {
  const destination = output(asset.key);
  const temporary = `${destination}.tmp.mp4`;
  const result = spawnSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-i', asset.file, '-map', '0', '-c', 'copy', '-movflags', '+faststart', temporary], { encoding: 'utf8' });
  if (result.status !== 0) {
    fs.rmSync(temporary, { force: true });
    throw new Error(result.stderr || result.error?.message || `FFmpeg failed for ${asset.source}`);
  }
  fs.renameSync(temporary, destination);
  console.log(`Prepared ${asset.key}`);
}
for (const poster of posters.filter(selected)) {
  const frame = spawnSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-ss', '1', '-i', poster.file, '-frames:v', '1', '-f', 'image2pipe', '-vcodec', 'png', '-'], { maxBuffer: 64 * 1024 * 1024 });
  if (frame.status !== 0) throw new Error(frame.stderr.toString() || `Cannot extract poster from ${poster.source}`);
  await sharp(frame.stdout).resize({ width: 1920, withoutEnlargement: true }).webp({ quality: 90 }).toFile(output(poster.key));
}

const manifest = {
  version,
  totalFiles: assets.length,
  assets: assets.map(({ source: relative, key }) => {
    const data = fs.readFileSync(path.join(root, 'public', key));
    return { source: relative, key, size: data.length, sha256: createHash('sha256').update(data).digest('hex') };
  }),
};
fs.writeFileSync(path.join(root, 'public', `media-${version}-manifest.json`), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Prepared ${assets.length} assets (${manifest.assets.reduce((sum, asset) => sum + asset.size, 0)} bytes). No files were uploaded.`);
