import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  TYPOLOGIES,
  PUBLIC_PLANTS_DIR,
  PROJECT_ROOT,
  EXPECTED_IMAGE_WIDTH,
  EXPECTED_IMAGE_HEIGHT,
  EXPECTED_VIDEO_WIDTH,
  EXPECTED_VIDEO_HEIGHT,
  EXPECTED_VIDEO_FPS,
  SOLD_UNIT_IDS,
} from './helpers/test-constants.js';
import {
  parseWebPDimensions,
  getVideoMetadata,
  computeMD5,
} from './helpers/asset-helpers.js';

describe('Tier 2: Boundary & Corner Cases', () => {

  // =========================================================================
  // Group 2.1: Duplex T12 Multi-Floor Verification
  // =========================================================================
  describe('Group 2.1: Duplex T12 Multi-Floor Verification', () => {

    it('2.1.1: Duplex T12 has independent Floor 1 and Floor 2 WebP plan assets on disk', () => {
      const t12Dir = join(PUBLIC_PLANTS_DIR, 'T12');
      const floor1Files = ['plans.webp', 'furnished.webp', 'unfurnished.webp'];
      const floor2Files = ['plans_2floor.webp', 'furnished_2floor.webp', 'unfurnished_2floor.webp'];

      for (const f of floor1Files) {
        assert.ok(existsSync(join(t12Dir, f)), `T12 Floor 1 missing ${f}`);
      }
      for (const f of floor2Files) {
        assert.ok(existsSync(join(t12Dir, f)), `T12 Floor 2 missing ${f}`);
      }
    });

    it('2.1.2: Duplex T12 Floor 2 assets are valid WebP with exact dimensions 3840x2160', () => {
      const t12Dir = join(PUBLIC_PLANTS_DIR, 'T12');
      const floor2Files = ['plans_2floor.webp', 'furnished_2floor.webp', 'unfurnished_2floor.webp'];

      for (const f of floor2Files) {
        const filePath = join(t12Dir, f);
        const meta = parseWebPDimensions(filePath);
        assert.strictEqual(meta.isValidWebP, true, `${f} must be valid WebP`);
        assert.strictEqual(meta.width, EXPECTED_IMAGE_WIDTH, `${f} width must be ${EXPECTED_IMAGE_WIDTH}`);
        assert.strictEqual(meta.height, EXPECTED_IMAGE_HEIGHT, `${f} height must be ${EXPECTED_IMAGE_HEIGHT}`);
      }
    });

    it('2.1.3: Duplex T12 has all 12 transitions (6 for floor 1 with _1 suffix, 6 for floor 2 with _2 suffix)', () => {
      const transDir = join(PUBLIC_PLANTS_DIR, 'T12', 'transitions');
      assert.ok(existsSync(transDir), 'T12 transitions directory must exist');

      const transitionsP1 = [
        't12_-_01_a_a_e_1.mp4',
        't12_-_02_cad_a_a_1.mp4',
        't12_-_03_cad_a_e_1.mp4',
        't12_-_04_e_a_a_1.mp4',
        't12_-_05_a_a_cad_1.mp4',
        't12_-_06_e_a_cad_1.mp4',
      ];
      const transitionsP2 = [
        't12_-_01_a_a_e_2.mp4',
        't12_-_02_cad_a_a_2.mp4',
        't12_-_03_cad_a_e_2.mp4',
        't12_-_04_e_a_a_2.mp4',
        't12_-_05_a_a_cad_2.mp4',
        't12_-_06_e_a_cad_2.mp4',
      ];

      for (const f of transitionsP1) {
        assert.ok(existsSync(join(transDir, f)), `T12 Piso 1 missing transition: ${f}`);
      }
      for (const f of transitionsP2) {
        assert.ok(existsSync(join(transDir, f)), `T12 Piso 2 missing transition: ${f}`);
      }
    });

    it('2.1.4: Duplex T12 Floor 1 and Floor 2 transition videos have distinct content (hashes differ)', () => {
      const transDir = join(PUBLIC_PLANTS_DIR, 'T12', 'transitions');
      const pairs = [
        ['t12_-_01_a_a_e_1.mp4', 't12_-_01_a_a_e_2.mp4'],
        ['t12_-_02_cad_a_a_1.mp4', 't12_-_02_cad_a_a_2.mp4'],
        ['t12_-_03_cad_a_e_1.mp4', 't12_-_03_cad_a_e_2.mp4'],
        ['t12_-_04_e_a_a_1.mp4', 't12_-_04_e_a_a_2.mp4'],
        ['t12_-_05_a_a_cad_1.mp4', 't12_-_05_a_a_cad_2.mp4'],
        ['t12_-_06_e_a_cad_1.mp4', 't12_-_06_e_a_cad_2.mp4'],
      ];

      for (const [p1, p2] of pairs) {
        const hash1 = computeMD5(join(transDir, p1));
        const hash2 = computeMD5(join(transDir, p2));
        assert.notStrictEqual(
          hash1,
          hash2,
          `Floor 1 (${p1}) and Floor 2 (${p2}) transitions must not be identical clones`
        );
      }
    });

    it('2.1.5: Duplex T12 Floor 1 and Floor 2 transition videos both run at 60fps and 1080p', () => {
      const transDir = join(PUBLIC_PLANTS_DIR, 'T12', 'transitions');
      const sampleP1 = getVideoMetadata(join(transDir, 't12_-_01_a_a_e_1.mp4'));
      const sampleP2 = getVideoMetadata(join(transDir, 't12_-_01_a_a_e_2.mp4'));

      assert.strictEqual(sampleP1.width, EXPECTED_VIDEO_WIDTH);
      assert.strictEqual(sampleP1.height, EXPECTED_VIDEO_HEIGHT);
      assert.strictEqual(Math.round(sampleP1.fps), EXPECTED_VIDEO_FPS);

      assert.strictEqual(sampleP2.width, EXPECTED_VIDEO_WIDTH);
      assert.strictEqual(sampleP2.height, EXPECTED_VIDEO_HEIGHT);
      assert.strictEqual(Math.round(sampleP2.fps), EXPECTED_VIDEO_FPS);
    });

  });

  // =========================================================================
  // Group 2.2: Edge & Boundary Units
  // =========================================================================
  describe('Group 2.2: Edge & Boundary Units', () => {

    it('2.2.1: Lowest unit 201 (T1) on Floor 2 has complete assets and unique dimensions', async () => {
      const floorsModule = await import('../../src/data/floors.js');
      const floor2 = floorsModule.floorsData.find(f => f.id === '2');
      assert.ok(floor2, 'Floor 2 must exist in floorsData');

      const unit201 = floor2.units.find(u => u.id === '201');
      assert.ok(unit201, 'Unit 201 must exist on Floor 2');
      assert.strictEqual(unit201.dimensions, 71.23, 'Unit 201 dimensions must be 71.23 m²');
      assert.strictEqual(unit201.bedrooms, 3);
      assert.strictEqual(unit201.bathrooms, 2);
      assert.strictEqual(unit201.assetId, 'T1');

      const t1Dir = join(PUBLIC_PLANTS_DIR, 'T1');
      assert.ok(existsSync(join(t1Dir, 'plans.webp')));
      assert.ok(existsSync(join(t1Dir, 'furnished.webp')));
      assert.ok(existsSync(join(t1Dir, 'unfurnished.webp')));
    });

    it('2.2.2: Penthouse Duplex unit 1601 (T12) correctly spans across both Floor 16 and Floor 17 in floorsData', async () => {
      const floorsModule = await import('../../src/data/floors.js');
      const floor16 = floorsModule.floorsData.find(f => f.id === '16');
      const floor17 = floorsModule.floorsData.find(f => f.id === '17');

      assert.ok(floor16, 'Floor 16 must exist');
      assert.ok(floor17, 'Floor 17 must exist');

      const u16 = floor16.units.find(u => u.id === '1601');
      const u17 = floor17.units.find(u => u.id === '1601');

      assert.ok(u16, 'Unit 1601 must be accessible from Floor 16 schedule');
      assert.ok(u17, 'Unit 1601 must be accessible from Floor 17 schedule');
      assert.strictEqual(u16.assetId, 'T12');
      assert.strictEqual(u17.assetId, 'T12');
      assert.strictEqual(u16.subtitle, 'Dúplex');
      assert.strictEqual(u16.dimensions, 105.31);
    });

    it('2.2.3: Adjacent top-floor units 1502 and 1602 (T11) share typology T11 and have identical asset availability', async () => {
      const floorsModule = await import('../../src/data/floors.js');
      const allUnits = floorsModule.floorsData.flatMap(f => f.units);

      const u1502 = allUnits.find(u => u.id === '1502');
      const u1602 = allUnits.find(u => u.id === '1602');

      assert.ok(u1502, 'Unit 1502 must exist');
      assert.ok(u1602, 'Unit 1602 must exist');
      assert.strictEqual(u1502.assetId, 'T11');
      assert.strictEqual(u1602.assetId, 'T11');
      assert.strictEqual(u1502.dimensions, u1602.dimensions);
      assert.strictEqual(u1502.bedrooms, u1602.bedrooms);

      const t11Dir = join(PUBLIC_PLANTS_DIR, 'T11');
      assert.ok(existsSync(join(t11Dir, 'plans.webp')));
      assert.ok(existsSync(join(t11Dir, 'furnished.webp')));
      assert.ok(existsSync(join(t11Dir, 'unfurnished.webp')));
    });

    it('2.2.4: Sold units preserve complete asset links for showroom demonstration', async () => {
      const floorsModule = await import('../../src/data/floors.js');
      const allUnits = floorsModule.floorsData.flatMap(f => f.units);

      for (const soldId of SOLD_UNIT_IDS) {
        const unit = allUnits.find(u => u.id === soldId);
        assert.ok(unit, `Sold unit ${soldId} must be present in unit catalog`);
        assert.strictEqual(unit.status, 'sold', `Unit ${soldId} must have status 'sold'`);
        assert.ok(unit.assetId, `Sold unit ${soldId} must retain its assetId`);

        const unitDir = join(PUBLIC_PLANTS_DIR, unit.assetId);
        assert.ok(
          existsSync(join(unitDir, 'plans.webp')),
          `Sold unit ${soldId} (${unit.assetId}) must retain accessible plans.webp`
        );
        assert.ok(
          existsSync(join(unitDir, 'furnished.webp')),
          `Sold unit ${soldId} (${unit.assetId}) must retain accessible furnished.webp`
        );
      }
    });

    it('2.2.5: Multi-unit typologies (T2 with 9 units, T4 with 13 units, T5 with 9 units) resolve all assets consistently', async () => {
      const checkTypologies = ['T2', 'T4', 'T5'];
      for (const type of checkTypologies) {
        const meta = TYPOLOGIES.find(t => t.type === type)!;
        assert.ok(meta.ids.length >= 9, `${type} must cover multiple floors`);

        const dir = join(PUBLIC_PLANTS_DIR, type);
        assert.ok(existsSync(join(dir, 'plans.webp')));
        assert.ok(existsSync(join(dir, 'furnished.webp')));
        assert.ok(existsSync(join(dir, 'unfurnished.webp')));

        const galleryFiles = readdirSync(join(dir, 'gallery')).filter(f => f.endsWith('.webp'));
        assert.strictEqual(galleryFiles.length, meta.galleryCount);
      }
    });

  });

  // =========================================================================
  // Group 2.3: Legacy JPG Fallback & WebP Primary Resolution
  // =========================================================================
  describe('Group 2.3: Legacy JPG Fallback & WebP Primary Resolution', () => {

    it('2.3.1: Frontend getStaticViewUrl in src/app/unidad/[id]/page.tsx prioritizes .webp before .jpg', () => {
      const pagePath = join(PROJECT_ROOT, 'src/app/unidad/[id]/page.tsx');
      assert.ok(existsSync(pagePath), 'Unit page component must exist');

      const content = readFileSync(pagePath, 'utf-8');
      
      // Look for extensions array in getStaticViewUrl
      const extMatch = content.match(/const\s+extensions\s*=\s*\[([^\]]+)\]/);
      assert.ok(extMatch, 'getStaticViewUrl must define an extensions array');

      const rawExts = extMatch[1];
      assert.ok(
        rawExts.includes('webp'),
        `extensions array [${rawExts}] must include 'webp'`
      );

      // Verify 'webp' appears before 'jpg' in priority order
      const webpIdx = rawExts.indexOf('webp');
      const jpgIdx = rawExts.indexOf('jpg');
      assert.ok(
        webpIdx < jpgIdx,
        `'webp' (index ${webpIdx}) must appear before 'jpg' (index ${jpgIdx}) in priority order`
      );
    });

    it('2.3.2: Asset manifest declares WebP assets for all 12 typologies', async () => {
      const manifestModule = await import('../../src/data/asset-manifest.js');
      const manifest: string[] = manifestModule.assetManifest;

      for (const meta of TYPOLOGIES) {
        const expectedPlans = `plants/details/${meta.type}/plans.webp`;
        const expectedFurnished = `plants/details/${meta.type}/furnished.webp`;
        const expectedUnfurnished = `plants/details/${meta.type}/unfurnished.webp`;

        assert.ok(
          manifest.includes(expectedPlans),
          `assetManifest must declare ${expectedPlans}`
        );
        assert.ok(
          manifest.includes(expectedFurnished),
          `assetManifest must declare ${expectedFurnished}`
        );
        assert.ok(
          manifest.includes(expectedUnfurnished),
          `assetManifest must declare ${expectedUnfurnished}`
        );

        for (let i = 1; i <= meta.galleryCount; i++) {
          const expectedGallery = `plants/details/${meta.type}/gallery/${i}.webp`;
          assert.ok(
            manifest.includes(expectedGallery),
            `assetManifest must declare ${expectedGallery}`
          );
        }
      }
    });

    it('2.3.3: R2 upload script (scripts/upload-typologies.mjs) handles image/webp MIME type', () => {
      const scriptPath = join(PROJECT_ROOT, 'scripts/upload-typologies.mjs');
      assert.ok(existsSync(scriptPath), 'upload-typologies.mjs script must exist');

      const scriptContent = readFileSync(scriptPath, 'utf-8');
      assert.ok(
        scriptContent.includes('webp') && scriptContent.includes('image/webp'),
        'scripts/upload-typologies.mjs must recognize .webp and map to content-type image/webp'
      );
    });

    it('2.3.4: Cloudflare pages prep script (scripts/prepare-pages-assets.mjs) allows .webp in regex pattern', () => {
      const scriptPath = join(PROJECT_ROOT, 'scripts/prepare-pages-assets.mjs');
      assert.ok(existsSync(scriptPath), 'prepare-pages-assets.mjs script must exist');

      const scriptContent = readFileSync(scriptPath, 'utf-8');
      assert.ok(
        scriptContent.includes('webp'),
        'scripts/prepare-pages-assets.mjs regex must accept webp extension'
      );
    });

  });

});
