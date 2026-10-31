import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, statSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  TYPOLOGIES,
  TOTAL_UNITS,
  TOTAL_GALLERY_IMAGES,
  PUBLIC_PLANTS_DIR,
  EXPECTED_IMAGE_WIDTH,
  EXPECTED_IMAGE_HEIGHT,
  EXPECTED_VIDEO_WIDTH,
  EXPECTED_VIDEO_HEIGHT,
  EXPECTED_VIDEO_FPS,
  EXPECTED_VIDEO_DURATION_SEC,
  ALL_TRANSITION_NAMES,
} from './helpers/test-constants.js';
import {
  parseWebPDimensions,
  verifyWebPWithSharp,
  getVideoMetadata,
  computeMD5,
} from './helpers/asset-helpers.js';

describe('Tier 1: Feature Coverage', () => {

  // =========================================================================
  // Feature 1.1: Unit-Level WebP Asset Completeness (all 42 units across floors 2-17)
  // =========================================================================
  describe('Feature 1.1: Unit-Level WebP Asset Completeness (42 units)', () => {
    
    it('1.1.1: All 42 units in floors.ts map to a valid typology T1..T12', async () => {
      const floorsModule = await import('../../src/data/floors.js');
      const allUnits = floorsModule.floorsData.flatMap(f => f.units).filter(u => u.type === 'apartment' || u.assetId);
      
      // Filter out duplicate floor 17 entry for duplex 1601 to get unique units
      const uniqueUnitIds = Array.from(new Set(allUnits.map(u => u.id)));
      assert.strictEqual(
        uniqueUnitIds.length,
        TOTAL_UNITS,
        `Expected exactly ${TOTAL_UNITS} unique units, but found ${uniqueUnitIds.length}`
      );

      for (const unitId of uniqueUnitIds) {
        const unit = allUnits.find(u => u.id === unitId)!;
        assert.ok(unit.assetId, `Unit ${unitId} must have an assetId`);
        const matchingType = TYPOLOGIES.find(t => t.type === unit.assetId);
        assert.ok(
          matchingType,
          `Unit ${unitId} assetId '${unit.assetId}' must match one of T1..T12`
        );
      }
    });

    it('1.1.2: All 42 units have accessible plans.webp asset on disk', async () => {
      const floorsModule = await import('../../src/data/floors.js');
      const allUnits = floorsModule.floorsData.flatMap(f => f.units).filter(u => u.type === 'apartment' || u.assetId);
      const uniqueUnitIds = Array.from(new Set(allUnits.map(u => u.id)));

      for (const unitId of uniqueUnitIds) {
        const unit = allUnits.find(u => u.id === unitId)!;
        const plansPath = join(PUBLIC_PLANTS_DIR, unit.assetId!, 'plans.webp');
        assert.ok(
          existsSync(plansPath),
          `Unit ${unitId} (${unit.assetId}) missing required WebP plan: ${plansPath}`
        );
        const stat = statSync(plansPath);
        assert.ok(stat.size > 1000, `Unit ${unitId} plans.webp is too small (${stat.size} bytes)`);
      }
    });

    it('1.1.3: All 42 units have accessible furnished.webp asset on disk', async () => {
      const floorsModule = await import('../../src/data/floors.js');
      const allUnits = floorsModule.floorsData.flatMap(f => f.units).filter(u => u.type === 'apartment' || u.assetId);
      const uniqueUnitIds = Array.from(new Set(allUnits.map(u => u.id)));

      for (const unitId of uniqueUnitIds) {
        const unit = allUnits.find(u => u.id === unitId)!;
        const furnishedPath = join(PUBLIC_PLANTS_DIR, unit.assetId!, 'furnished.webp');
        assert.ok(
          existsSync(furnishedPath),
          `Unit ${unitId} (${unit.assetId}) missing required furnished.webp: ${furnishedPath}`
        );
        const stat = statSync(furnishedPath);
        assert.ok(stat.size > 1000, `Unit ${unitId} furnished.webp is too small (${stat.size} bytes)`);
      }
    });

    it('1.1.4: All 42 units have accessible unfurnished.webp asset on disk', async () => {
      const floorsModule = await import('../../src/data/floors.js');
      const allUnits = floorsModule.floorsData.flatMap(f => f.units).filter(u => u.type === 'apartment' || u.assetId);
      const uniqueUnitIds = Array.from(new Set(allUnits.map(u => u.id)));

      for (const unitId of uniqueUnitIds) {
        const unit = allUnits.find(u => u.id === unitId)!;
        const unfurnishedPath = join(PUBLIC_PLANTS_DIR, unit.assetId!, 'unfurnished.webp');
        assert.ok(
          existsSync(unfurnishedPath),
          `Unit ${unitId} (${unit.assetId}) missing required unfurnished.webp: ${unfurnishedPath}`
        );
        const stat = statSync(unfurnishedPath);
        assert.ok(stat.size > 1000, `Unit ${unitId} unfurnished.webp is too small (${stat.size} bytes)`);
      }
    });

    it('1.1.5: All 42 units have accessible gallery WebP assets matching their typology count', async () => {
      const floorsModule = await import('../../src/data/floors.js');
      const allUnits = floorsModule.floorsData.flatMap(f => f.units).filter(u => u.type === 'apartment' || u.assetId);
      const uniqueUnitIds = Array.from(new Set(allUnits.map(u => u.id)));

      for (const unitId of uniqueUnitIds) {
        const unit = allUnits.find(u => u.id === unitId)!;
        const meta = TYPOLOGIES.find(t => t.type === unit.assetId)!;
        const galleryDir = join(PUBLIC_PLANTS_DIR, unit.assetId!, 'gallery');

        assert.ok(
          existsSync(galleryDir),
          `Unit ${unitId} (${unit.assetId}) missing gallery directory: ${galleryDir}`
        );

        for (let i = 1; i <= meta.galleryCount; i++) {
          const imgPath = join(galleryDir, `${i}.webp`);
          assert.ok(
            existsSync(imgPath),
            `Unit ${unitId} (${unit.assetId}) missing gallery WebP: ${imgPath}`
          );
        }
      }
    });

    it('1.1.6: Distribution of units across low, mid, high, and top floor bands has 100% asset coverage', async () => {
      const bands = {
        low: ['201', '202', '203', '301', '302', '303', '401', '402', '403', '501', '502', '503'],
        mid: ['601', '602', '603', '701', '702', '703', '801', '802', '803', '901', '902', '903', '1001', '1002', '1003'],
        high: ['1101', '1102', '1103', '1201', '1202', '1203', '1301', '1302', '1303', '1401', '1402', '1501', '1502'],
        top: ['1601', '1602'],
      };

      for (const [bandName, unitIds] of Object.entries(bands)) {
        for (const uid of unitIds) {
          const type = TYPOLOGIES.find(t => t.ids.includes(uid));
          assert.ok(type, `Unit ${uid} in band ${bandName} must belong to a known typology`);
          const p = join(PUBLIC_PLANTS_DIR, type.type);
          assert.ok(existsSync(join(p, 'plans.webp')), `Band ${bandName} unit ${uid} missing plans.webp`);
          assert.ok(existsSync(join(p, 'furnished.webp')), `Band ${bandName} unit ${uid} missing furnished.webp`);
          assert.ok(existsSync(join(p, 'unfurnished.webp')), `Band ${bandName} unit ${uid} missing unfurnished.webp`);
        }
      }
    });

  });

  // =========================================================================
  // Feature 1.2: Typology-Level Asset Completeness (all 12 typologies T1–T12)
  // =========================================================================
  describe('Feature 1.2: Typology-Level Asset Completeness (T1–T12)', () => {

    it('1.2.1: Exactly 12 typology directories exist in public/plants/details/ (T1 to T12)', () => {
      assert.ok(existsSync(PUBLIC_PLANTS_DIR), `Directory ${PUBLIC_PLANTS_DIR} must exist`);
      for (let i = 1; i <= 12; i++) {
        const typeDir = join(PUBLIC_PLANTS_DIR, `T${i}`);
        assert.ok(existsSync(typeDir), `Typology folder T${i} must exist in public/plants/details/`);
      }
    });

    it('1.2.2: All 12 typologies contain primary plan WebP images (plans, furnished, unfurnished)', () => {
      for (const meta of TYPOLOGIES) {
        const dir = join(PUBLIC_PLANTS_DIR, meta.type);
        assert.ok(existsSync(join(dir, 'plans.webp')), `${meta.type} must have plans.webp`);
        assert.ok(existsSync(join(dir, 'furnished.webp')), `${meta.type} must have furnished.webp`);
        assert.ok(existsSync(join(dir, 'unfurnished.webp')), `${meta.type} must have unfurnished.webp`);
      }
    });

    it('1.2.3: All 12 typologies contain their full set of numbered gallery WebP images', () => {
      for (const meta of TYPOLOGIES) {
        const galleryDir = join(PUBLIC_PLANTS_DIR, meta.type, 'gallery');
        assert.ok(existsSync(galleryDir), `${meta.type} must have a gallery directory`);
        for (let i = 1; i <= meta.galleryCount; i++) {
          const imgPath = join(galleryDir, `${i}.webp`);
          assert.ok(existsSync(imgPath), `${meta.type} missing gallery image ${i}.webp`);
        }
      }
    });

    it('1.2.4: Total gallery WebP images across T1..T12 equals exactly 98', () => {
      let totalGallery = 0;
      for (const meta of TYPOLOGIES) {
        const galleryDir = join(PUBLIC_PLANTS_DIR, meta.type, 'gallery');
        if (existsSync(galleryDir)) {
          const files = readdirSync(galleryDir).filter(f => f.endsWith('.webp'));
          totalGallery += files.length;
        }
      }
      assert.strictEqual(
        totalGallery,
        TOTAL_GALLERY_IMAGES,
        `Expected ${TOTAL_GALLERY_IMAGES} gallery WebP images across T1..T12, got ${totalGallery}`
      );
    });

    it('1.2.5: Total primary plan WebP images across T1..T12 equals at least 39 files', () => {
      let planCount = 0;
      for (const meta of TYPOLOGIES) {
        const dir = join(PUBLIC_PLANTS_DIR, meta.type);
        for (const name of ['plans.webp', 'furnished.webp', 'unfurnished.webp']) {
          if (existsSync(join(dir, name))) planCount++;
        }
        if (meta.isDuplex) {
          for (const name of ['plans_2floor.webp', 'furnished_2floor.webp', 'unfurnished_2floor.webp']) {
            if (existsSync(join(dir, name))) planCount++;
          }
        }
      }
      assert.ok(
        planCount >= 39,
        `Expected at least 39 primary plan WebP images, found ${planCount}`
      );
    });

  });

  // =========================================================================
  // Feature 1.3: WebP Image Validity (Binary Headers, Dimensions 3840x2160)
  // =========================================================================
  describe('Feature 1.3: WebP Image Validity (Headers, Dimensions, Integrity)', () => {

    it('1.3.1: All primary plan WebP files contain valid RIFF/WEBP magic headers', () => {
      for (const meta of TYPOLOGIES) {
        const dir = join(PUBLIC_PLANTS_DIR, meta.type);
        for (const name of ['plans.webp', 'furnished.webp', 'unfurnished.webp']) {
          const filePath = join(dir, name);
          const parsed = parseWebPDimensions(filePath);
          assert.strictEqual(parsed.isValidWebP, true, `${filePath} must be valid WebP`);
          assert.ok(
            ['VP8 ', 'VP8L', 'VP8X'].includes(parsed.chunkType),
            `${filePath} chunkType '${parsed.chunkType}' must be VP8, VP8L, or VP8X`
          );
        }
      }
    });

    it('1.3.2: All gallery WebP files contain valid RIFF/WEBP magic headers', () => {
      for (const meta of TYPOLOGIES) {
        const galleryDir = join(PUBLIC_PLANTS_DIR, meta.type, 'gallery');
        for (let i = 1; i <= meta.galleryCount; i++) {
          const filePath = join(galleryDir, `${i}.webp`);
          const parsed = parseWebPDimensions(filePath);
          assert.strictEqual(parsed.isValidWebP, true, `${filePath} must be valid WebP`);
        }
      }
    });

    it('1.3.3: 100% of primary plan WebP files have exact dimensions 3840x2160', () => {
      for (const meta of TYPOLOGIES) {
        const dir = join(PUBLIC_PLANTS_DIR, meta.type);
        const planFiles = ['plans.webp', 'furnished.webp', 'unfurnished.webp'];
        if (meta.isDuplex) {
          planFiles.push('plans_2floor.webp', 'furnished_2floor.webp', 'unfurnished_2floor.webp');
        }

        for (const name of planFiles) {
          const filePath = join(dir, name);
          const parsed = parseWebPDimensions(filePath);
          assert.strictEqual(
            parsed.width,
            EXPECTED_IMAGE_WIDTH,
            `${filePath} width must be ${EXPECTED_IMAGE_WIDTH}, got ${parsed.width}`
          );
          assert.strictEqual(
            parsed.height,
            EXPECTED_IMAGE_HEIGHT,
            `${filePath} height must be ${EXPECTED_IMAGE_HEIGHT}, got ${parsed.height}`
          );
        }
      }
    });

    it('1.3.4: 100% of gallery WebP files have exact dimensions 3840x2160', async () => {
      for (const meta of TYPOLOGIES) {
        const galleryDir = join(PUBLIC_PLANTS_DIR, meta.type, 'gallery');
        for (let i = 1; i <= meta.galleryCount; i++) {
          const filePath = join(galleryDir, `${i}.webp`);
          const parsed = parseWebPDimensions(filePath);
          assert.strictEqual(
            parsed.width,
            EXPECTED_IMAGE_WIDTH,
            `${filePath} width must be ${EXPECTED_IMAGE_WIDTH}, got ${parsed.width}`
          );
          assert.strictEqual(
            parsed.height,
            EXPECTED_IMAGE_HEIGHT,
            `${filePath} height must be ${EXPECTED_IMAGE_HEIGHT}, got ${parsed.height}`
          );

          // Double check with sharp on a sample (first of each gallery)
          if (i === 1) {
            const sharpMeta = await verifyWebPWithSharp(filePath);
            assert.strictEqual(sharpMeta.width, EXPECTED_IMAGE_WIDTH);
            assert.strictEqual(sharpMeta.height, EXPECTED_IMAGE_HEIGHT);
            assert.strictEqual(sharpMeta.format, 'webp');
          }
        }
      }
    });

    it('1.3.5: All WebP files pass integrity check (file size > 20KB, non-empty, readable chunks)', () => {
      for (const meta of TYPOLOGIES) {
        const dir = join(PUBLIC_PLANTS_DIR, meta.type);
        const checkFiles = [
          join(dir, 'plans.webp'),
          join(dir, 'furnished.webp'),
          join(dir, 'unfurnished.webp'),
        ];
        for (let i = 1; i <= meta.galleryCount; i++) {
          checkFiles.push(join(dir, 'gallery', `${i}.webp`));
        }

        for (const f of checkFiles) {
          const stat = statSync(f);
          assert.ok(stat.size > 20000, `File ${f} is unusually small: ${stat.size} bytes`);
        }
      }
    });

  });

  // =========================================================================
  // Feature 1.4: Transition Videos Existence, Technical Specs, and Mapping
  // =========================================================================
  describe('Feature 1.4: Transition Videos Existence, Specs & Mapping', () => {

    it('1.4.1: All standard typologies T1..T11 have all 6 bidirectional transition MP4 videos', () => {
      for (const meta of TYPOLOGIES.filter(t => !t.isDuplex)) {
        const transDir = join(PUBLIC_PLANTS_DIR, meta.type, 'transitions');
        assert.ok(existsSync(transDir), `${meta.type} must have transitions directory`);

        for (const tName of ALL_TRANSITION_NAMES) {
          const videoPath = join(transDir, `${tName}.mp4`);
          assert.ok(
            existsSync(videoPath),
            `${meta.type} missing transition video: ${videoPath}`
          );
        }
      }
    });

    it('1.4.2: All transition MP4 videos have resolution 1920x1080 (1080p Full HD)', () => {
      // Test sample across all typologies
      for (const meta of TYPOLOGIES.filter(t => !t.isDuplex)) {
        const transDir = join(PUBLIC_PLANTS_DIR, meta.type, 'transitions');
        const p2f = join(transDir, 'plans_to_furnished.mp4');
        const info = getVideoMetadata(p2f);
        assert.strictEqual(info.width, EXPECTED_VIDEO_WIDTH, `${p2f} width must be ${EXPECTED_VIDEO_WIDTH}`);
        assert.strictEqual(info.height, EXPECTED_VIDEO_HEIGHT, `${p2f} height must be ${EXPECTED_VIDEO_HEIGHT}`);
      }
    });

    it('1.4.3: All transition MP4 videos have framerate 60.0 fps (production render)', () => {
      for (const meta of TYPOLOGIES.filter(t => !t.isDuplex)) {
        const transDir = join(PUBLIC_PLANTS_DIR, meta.type, 'transitions');
        const f2p = join(transDir, 'furnished_to_plans.mp4');
        const info = getVideoMetadata(f2p);
        assert.strictEqual(
          Math.round(info.fps),
          Math.round(EXPECTED_VIDEO_FPS),
          `${f2p} must be 60fps (not draft 24fps), got ${info.fps}`
        );
      }
    });

    it('1.4.4: All transition MP4 videos have duration 2.50s (+/- 0.1s)', () => {
      for (const meta of TYPOLOGIES.filter(t => !t.isDuplex)) {
        const transDir = join(PUBLIC_PLANTS_DIR, meta.type, 'transitions');
        const f2u = join(transDir, 'furnished_to_unfurnished.mp4');
        const info = getVideoMetadata(f2u);
        assert.ok(
          Math.abs(info.durationSec - EXPECTED_VIDEO_DURATION_SEC) <= 0.1,
          `${f2u} duration must be ~${EXPECTED_VIDEO_DURATION_SEC}s, got ${info.durationSec}`
        );
      }
    });

    it('1.4.5: plans_to_furnished.mp4 is correctly mapped to CAD->Amoblado (02_cad_a_a), NOT CAD->Entregable (03_cad_a_e)', () => {
      for (const meta of TYPOLOGIES.filter(t => !t.isDuplex)) {
        const transDir = join(PUBLIC_PLANTS_DIR, meta.type, 'transitions');
        const p2f = join(transDir, 'plans_to_furnished.mp4');
        const cad_a = join(transDir, `${meta.type.toLowerCase()}_-_02_cad_a_a.mp4`);
        const cad_e = join(transDir, `${meta.type.toLowerCase()}_-_03_cad_a_e.mp4`);

        if (existsSync(cad_a)) {
          const hashP2F = computeMD5(p2f);
          const hashCadA = computeMD5(cad_a);
          const hashCadE = existsSync(cad_e) ? computeMD5(cad_e) : '';

          assert.strictEqual(
            hashP2F,
            hashCadA,
            `${meta.type} plans_to_furnished.mp4 must match CAD->Amoblado (${cad_a})`
          );
          if (hashCadE) {
            assert.notStrictEqual(
              hashP2F,
              hashCadE,
              `${meta.type} plans_to_furnished.mp4 must NOT match CAD->Entregable (${cad_e})`
            );
          }
        }
      }
    });

  });

});
