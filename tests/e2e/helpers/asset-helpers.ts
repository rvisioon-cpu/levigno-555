import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';

export interface WebPMetadata {
  chunkType: 'VP8 ' | 'VP8L' | 'VP8X';
  width: number;
  height: number;
  fileSizeBytes: number;
  isValidWebP: boolean;
}

export interface VideoMetadata {
  codec: string;
  width: number;
  height: number;
  fps: number;
  durationSec: number;
  fileSizeBytes: number;
}

/**
 * Parses binary header of a WebP file without depending on external tools.
 * Handles VP8 (simple lossy), VP8L (lossless), and VP8X (extended).
 */
export function parseWebPDimensions(filePath: string): WebPMetadata {
  if (!existsSync(filePath)) {
    throw new Error(`WebP file does not exist: ${filePath}`);
  }
  const stat = statSync(filePath);
  const buf = readFileSync(filePath);

  if (buf.length < 30) {
    throw new Error(`File is too small to be a valid WebP container: ${filePath}`);
  }

  const riff = buf.toString('ascii', 0, 4);
  const webp = buf.toString('ascii', 8, 12);
  if (riff !== 'RIFF' || webp !== 'WEBP') {
    throw new Error(`File does not have valid RIFF/WEBP magic header: ${filePath}`);
  }

  const chunkType = buf.toString('ascii', 12, 16);
  let width = 0;
  let height = 0;

  if (chunkType === 'VP8 ') {
    // 3 bytes frame tag at bytes 20..22, sync code 0x9D 0x01 0x2A at bytes 23..25
    width = buf.readUInt16LE(26) & 0x3fff;
    height = buf.readUInt16LE(28) & 0x3fff;
  } else if (chunkType === 'VP8L') {
    // 1 byte signature 0x2F at byte 20, 14 bits width-1, 14 bits height-1 at bytes 21..24
    const b = buf.readUInt32LE(21);
    width = (b & 0x3fff) + 1;
    height = ((b >> 14) & 0x3fff) + 1;
  } else if (chunkType === 'VP8X') {
    // Canvas width-1 at bytes 24..26 (uint24 LE), canvas height-1 at bytes 27..29 (uint24 LE)
    width = buf.readUIntLE(24, 3) + 1;
    height = buf.readUIntLE(27, 3) + 1;
  } else {
    throw new Error(`Unsupported WebP chunk type '${chunkType}' in file: ${filePath}`);
  }

  return {
    chunkType: chunkType as 'VP8 ' | 'VP8L' | 'VP8X',
    width,
    height,
    fileSizeBytes: stat.size,
    isValidWebP: true,
  };
}

/**
 * Validates WebP image integrity using sharp for double verification.
 */
export async function verifyWebPWithSharp(filePath: string): Promise<{ width: number; height: number; format: string }> {
  const metadata = await sharp(filePath).metadata();
  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
    format: metadata.format || '',
  };
}

/**
 * Extracts video stream metadata using ffprobe.
 */
export function getVideoMetadata(filePath: string): VideoMetadata {
  if (!existsSync(filePath)) {
    throw new Error(`Video file does not exist: ${filePath}`);
  }
  const stat = statSync(filePath);

  const stdout = execFileSync('ffprobe', [
    '-v', 'error',
    '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height,codec_name,r_frame_rate,duration',
    '-of', 'json',
    filePath,
  ], { encoding: 'utf-8' });

  const data = JSON.parse(stdout);
  if (!data.streams || data.streams.length === 0) {
    throw new Error(`No video stream found in: ${filePath}`);
  }

  const stream = data.streams[0];
  const [num, den] = (stream.r_frame_rate || '0/1').split('/').map(Number);
  const fps = num / (den || 1);

  return {
    codec: stream.codec_name || 'unknown',
    width: Number(stream.width) || 0,
    height: Number(stream.height) || 0,
    fps: Math.round(fps * 100) / 100,
    durationSec: parseFloat(stream.duration) || 0,
    fileSizeBytes: stat.size,
  };
}

/**
 * Computes MD5 hash of a file.
 */
export function computeMD5(filePath: string): string {
  const buffer = readFileSync(filePath);
  return createHash('md5').update(buffer).digest('hex');
}

/**
 * Recursively collects files inside a directory.
 */
export function collectFiles(dirPath: string, filterExt?: string[]): string[] {
  const results: string[] = [];
  if (!existsSync(dirPath)) return results;

  function walk(current: string) {
    const entries = readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue; // ignore hidden/system files
      const fullPath = join(current, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else {
        if (!filterExt || filterExt.some(ext => entry.name.toLowerCase().endsWith(ext.toLowerCase()))) {
          results.push(fullPath);
        }
      }
    }
  }

  walk(dirPath);
  return results;
}
