import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import {
  TYPOLOGIES,
  PUBLIC_PLANTS_DIR,
  REFERENCE_DIR,
  PROJECT_ROOT,
  EXPECTED_IMAGE_WIDTH,
  EXPECTED_IMAGE_HEIGHT,
  EXPECTED_VIDEO_FPS,
} from './helpers/test-constants.js';
import {
  parseWebPDimensions,
  getVideoMetadata,
} from './helpers/asset-helpers.js';

describe('Tier 4: Real-World Verification & Build Health', () => {

  // =========================================================================
  // Group 4.1: Reference Parity Audit against Downloads/4. TIPOLOGÍAS COMPLETO
  // =========================================================================
  describe('Group 4.1: Reference Parity Audit', () => {

    it('4.1.1: Reference directory exists and contains all 12 tipología folders', () => {
      assert.ok(
        existsSync(REFERENCE_DIR),
        `Reference directory '${REFERENCE_DIR}' must exist in environment`
      );

      for (const meta of TYPOLOGIES) {
        const refSubdir = join(REFERENCE_DIR, meta.referenceFolderName);
        assert.ok(
          existsSync(refSubdir),
          `Reference folder '${meta.referenceFolderName}' must exist in ${REFERENCE_DIR}`
        );
      }
    });

    it('4.1.2: 100% Parity of Floor Plan Assets: All 39 reference plans have corresponding WebP files at 3840x2160', () => {
      for (const meta of TYPOLOGIES) {
        const refDir = join(REFERENCE_DIR, meta.referenceFolderName);
        const pubDir = join(PUBLIC_PLANTS_DIR, meta.type);

        if (!meta.isDuplex) {
          // 3 plans: CAD (plans), AMOBLADO (furnished), ENTREGABLE (unfurnished)
          const refFiles = readdirSync(refDir).filter(f => f.endsWith('.jpg'));
          assert.strictEqual(
            refFiles.length,
            3,
            `${meta.referenceFolderName} in reference must contain exactly 3 root JPG plans`
          );

          const expectedWebP = ['plans.webp', 'furnished.webp', 'unfurnished.webp'];
          for (const webpFile of expectedWebP) {
            const p = join(pubDir, webpFile);
            assert.ok(existsSync(p), `Public ${meta.type} missing WebP plan: ${webpFile}`);
            const dims = parseWebPDimensions(p);
            assert.strictEqual(dims.width, EXPECTED_IMAGE_WIDTH);
            assert.strictEqual(dims.height, EXPECTED_IMAGE_HEIGHT);
          }
        } else {
          // T12 Duplex: 6 plans (3 for Piso 1, 3 for Piso 2)
          const refFiles = readdirSync(refDir).filter(f => f.endsWith('.jpg'));
          assert.strictEqual(
            refFiles.length,
            6,
            `T12 Duplex reference must contain exactly 6 root JPG plans (Piso 1 & Piso 2)`
          );

          const expectedWebP = [
            'plans.webp', 'furnished.webp', 'unfurnished.webp',
            'plans_2floor.webp', 'furnished_2floor.webp', 'unfurnished_2floor.webp',
          ];
          for (const webpFile of expectedWebP) {
            const p = join(pubDir, webpFile);
            assert.ok(existsSync(p), `Public T12 missing WebP plan: ${webpFile}`);
            const dims = parseWebPDimensions(p);
            assert.strictEqual(dims.width, EXPECTED_IMAGE_WIDTH);
            assert.strictEqual(dims.height, EXPECTED_IMAGE_HEIGHT);
          }
        }
      }
    });

    it('4.1.3: 100% Parity of Gallery Renders: All 98 reference gallery images have corresponding WebP images', () => {
      for (const meta of TYPOLOGIES) {
        const refDir = join(REFERENCE_DIR, meta.referenceFolderName);
        // Find gallery dir (may be GALERÍA with accent or GALERIA without)
        const entries = readdirSync(refDir);
        const refGalleryName = entries.find(e => e.toUpperCase().normalize('NFC').startsWith('GALER'));
        assert.ok(refGalleryName, `${meta.type} must have a gallery directory in reference`);

        const refGalleryFiles = readdirSync(join(refDir, refGalleryName))
          .filter(f => f.endsWith('.jpg'));
        assert.strictEqual(
          refGalleryFiles.length,
          meta.galleryCount,
          `Reference ${meta.type} gallery count must be ${meta.galleryCount}`
        );

        const pubGalleryDir = join(PUBLIC_PLANTS_DIR, meta.type, 'gallery');
        assert.ok(existsSync(pubGalleryDir), `Public gallery dir missing for ${meta.type}`);

        for (let i = 1; i <= meta.galleryCount; i++) {
          const webpPath = join(pubGalleryDir, `${i}.webp`);
          assert.ok(
            existsSync(webpPath),
            `Public ${meta.type} missing gallery WebP: ${i}.webp`
          );
          const dims = parseWebPDimensions(webpPath);
          assert.strictEqual(dims.width, EXPECTED_IMAGE_WIDTH);
          assert.strictEqual(dims.height, EXPECTED_IMAGE_HEIGHT);
        }
      }
    });

    it('4.1.4: 100% Parity of Transition Videos: All 78 reference production transitions exist in public directory', () => {
      for (const meta of TYPOLOGIES) {
        const refTransDir = join(REFERENCE_DIR, meta.referenceFolderName, 'TRANSICIONES');
        assert.ok(existsSync(refTransDir), `Reference TRANSICIONES missing for ${meta.type}`);

        const refVideos = readdirSync(refTransDir).filter(f => f.endsWith('.mp4'));
        const expectedCount = meta.isDuplex ? 12 : 6;
        assert.strictEqual(
          refVideos.length,
          expectedCount,
          `Reference ${meta.type} must have ${expectedCount} transition videos`
        );

        const pubTransDir = join(PUBLIC_PLANTS_DIR, meta.type, 'transitions');
        assert.ok(existsSync(pubTransDir), `Public transitions missing for ${meta.type}`);

        // Every video in reference must have a corresponding file with identical byte size in public
        for (const refVideo of refVideos) {
          const refPath = join(refTransDir, refVideo);
          const refSize = statSync(refPath).size;

          const pubFiles = readdirSync(pubTransDir);
          const matchingPub = pubFiles.find(pf => {
            const pfPath = join(pubTransDir, pf);
            return statSync(pfPath).size === refSize;
          });

          assert.ok(
            matchingPub,
            `Reference video ${refVideo} (${refSize} bytes) has no match in public ${meta.type}/transitions`
          );
        }
      }
    });

    it('4.1.5: Deprecation Isolation: VIDEOS ANDY (24fps draft files) do NOT overwrite production assets', () => {
      const andyDir = join(REFERENCE_DIR, 'VIDEOS ANDY');
      if (existsSync(andyDir)) {
        // Sample check: T1 24fps video size is 2,058,198 bytes
        // Production T1 video size is 3,872,554 bytes
        for (const meta of TYPOLOGIES.filter(t => !t.isDuplex)) {
          const pubTransDir = join(PUBLIC_PLANTS_DIR, meta.type, 'transitions');
          const p2f = join(pubTransDir, 'plans_to_furnished.mp4');
          const metaInfo = getVideoMetadata(p2f);
          assert.strictEqual(
            Math.round(metaInfo.fps),
            EXPECTED_VIDEO_FPS,
            `${meta.type} plans_to_furnished.mp4 must be 60fps (production), not 24fps (draft)`
          );
        }
      }
    });

  });

  // =========================================================================
  // Group 4.2: Build Health & TypeScript Verification
  // =========================================================================
  describe('Group 4.2: Build Health & TypeScript Verification', () => {

    it('4.2.1: Production Build Execution: npm run build finishes with exit code 0 and 0 errors', { timeout: 60000 }, () => {
      // Execute npm run build synchronously
      const output = execSync('npm run build', {
        cwd: PROJECT_ROOT,
        encoding: 'utf-8',
        stdio: 'pipe',
        env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' },
      });

      assert.ok(
        output.includes('Compiled successfully') || output.includes('Generating static pages'),
        `Build output should indicate successful compilation:\n${output.slice(0, 500)}`
      );
    });

    it('4.2.2: Zero TypeScript Compilation Errors: TypeScript check passes without error', () => {
      const output = execSync('npx tsc --noEmit', {
        cwd: PROJECT_ROOT,
        encoding: 'utf-8',
        stdio: 'pipe',
      });
      // If tsc fails, it throws; if it returns cleanly, output is empty or clean
      assert.ok(typeof output === 'string');
    });

    it('4.2.3: Static Generation Health: Showroom, floor routes, and unit dynamic routes are intact', async () => {
      const floorsModule = await import('../../src/data/floors.js');
      assert.ok(floorsModule.floorsData.length >= 20, 'At least 20 floor definitions required (17 + 3 basements)');
      
      const allUnits = floorsModule.floorsData.flatMap(f => f.units);
      const uniqueUnitIds = Array.from(new Set(allUnits.map(u => u.id)));
      assert.strictEqual(uniqueUnitIds.length, 42, '42 unique units must be configured for route generation');
    });

  });

});
