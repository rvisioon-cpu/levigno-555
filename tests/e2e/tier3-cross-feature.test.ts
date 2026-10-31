import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  TYPOLOGIES,
  PUBLIC_PLANTS_DIR,
  PROJECT_ROOT,
} from './helpers/test-constants.js';
import {
  getVideoMetadata,
  collectFiles,
} from './helpers/asset-helpers.js';

describe('Tier 3: Cross-Feature Combinations', () => {

  // =========================================================================
  // Group 3.1: Pairwise View Transitions (Complete 3-Node Graph: 6 Directed Edges)
  // =========================================================================
  describe('Group 3.1: Pairwise View Transitions (Complete 3-Node Graph)', () => {

    it('3.1.1: Edge 1 (plans -> furnished): plans_to_furnished.mp4 exists and is valid 1080p MP4 for all typologies', () => {
      for (const meta of TYPOLOGIES.filter(t => !t.isDuplex)) {
        const videoPath = join(PUBLIC_PLANTS_DIR, meta.type, 'transitions', 'plans_to_furnished.mp4');
        assert.ok(existsSync(videoPath), `Missing plans_to_furnished.mp4 for ${meta.type}`);
        const metaInfo = getVideoMetadata(videoPath);
        assert.strictEqual(metaInfo.width, 1920);
        assert.strictEqual(metaInfo.height, 1080);
      }
    });

    it('3.1.2: Edge 2 (furnished -> plans): furnished_to_plans.mp4 exists and is valid 1080p MP4 for all typologies', () => {
      for (const meta of TYPOLOGIES.filter(t => !t.isDuplex)) {
        const videoPath = join(PUBLIC_PLANTS_DIR, meta.type, 'transitions', 'furnished_to_plans.mp4');
        assert.ok(existsSync(videoPath), `Missing furnished_to_plans.mp4 for ${meta.type}`);
        const metaInfo = getVideoMetadata(videoPath);
        assert.strictEqual(metaInfo.width, 1920);
        assert.strictEqual(metaInfo.height, 1080);
      }
    });

    it('3.1.3: Edge 3 (furnished -> unfurnished): furnished_to_unfurnished.mp4 exists and is valid 1080p MP4 for all typologies', () => {
      for (const meta of TYPOLOGIES.filter(t => !t.isDuplex)) {
        const videoPath = join(PUBLIC_PLANTS_DIR, meta.type, 'transitions', 'furnished_to_unfurnished.mp4');
        assert.ok(existsSync(videoPath), `Missing furnished_to_unfurnished.mp4 for ${meta.type}`);
        const metaInfo = getVideoMetadata(videoPath);
        assert.strictEqual(metaInfo.width, 1920);
        assert.strictEqual(metaInfo.height, 1080);
      }
    });

    it('3.1.4: Edge 4 (unfurnished -> furnished): unfurnished_to_furnished.mp4 exists and is valid 1080p MP4 for all typologies', () => {
      for (const meta of TYPOLOGIES.filter(t => !t.isDuplex)) {
        const videoPath = join(PUBLIC_PLANTS_DIR, meta.type, 'transitions', 'unfurnished_to_furnished.mp4');
        assert.ok(existsSync(videoPath), `Missing unfurnished_to_furnished.mp4 for ${meta.type}`);
        const metaInfo = getVideoMetadata(videoPath);
        assert.strictEqual(metaInfo.width, 1920);
        assert.strictEqual(metaInfo.height, 1080);
      }
    });

    it('3.1.5: Edge 5 (plans -> unfurnished) & Edge 6 (unfurnished -> plans): transition files exist on disk for all typologies', () => {
      for (const meta of TYPOLOGIES.filter(t => !t.isDuplex)) {
        const transDir = join(PUBLIC_PLANTS_DIR, meta.type, 'transitions');
        
        // Either named plans_to_unfurnished.mp4 or canonical 03_cad_a_e.mp4
        const p2u = existsSync(join(transDir, 'plans_to_unfurnished.mp4')) ||
                    existsSync(join(transDir, `${meta.type.toLowerCase()}_-_03_cad_a_e.mp4`));
        assert.ok(p2u, `${meta.type} must have plans -> unfurnished transition asset`);

        // Either named unfurnished_to_plans.mp4 or canonical 06_e_a_cad.mp4
        const u2p = existsSync(join(transDir, 'unfurnished_to_plans.mp4')) ||
                    existsSync(join(transDir, `${meta.type.toLowerCase()}_-_06_e_a_cad.mp4`));
        assert.ok(u2p, `${meta.type} must have unfurnished -> plans transition asset`);
      }
    });

    it('3.1.6: UI Navigation Contract: src/app/unidad/[id]/page.tsx getNavState() must support navigating to unfurnished', () => {
      const pagePath = join(PROJECT_ROOT, 'src/app/unidad/[id]/page.tsx');
      assert.ok(existsSync(pagePath));
      const content = readFileSync(pagePath, 'utf-8');

      const startIdx = content.indexOf('const getNavState =');
      assert.ok(startIdx !== -1, 'page.tsx must define getNavState()');
      const endIdx = content.indexOf('const navState = getNavState()');
      assert.ok(endIdx !== -1, 'page.tsx must invoke getNavState()');

      const navBody = content.slice(startIdx, endIdx);
      assert.ok(
        navBody.includes('unfurnished'),
        "getNavState() must include logic for 'unfurnished' view mode navigation"
      );
    });

    it('3.1.7: UI Transition Handler: handleViewChange must define transitions for plans <-> unfurnished', () => {
      const pagePath = join(PROJECT_ROOT, 'src/app/unidad/[id]/page.tsx');
      assert.ok(existsSync(pagePath));
      const content = readFileSync(pagePath, 'utf-8');

      assert.ok(
        content.includes('plans_to_unfurnished') || content.includes('cad_a_e'),
        "handleViewChange must handle 'plans_to_unfurnished' transition"
      );
      assert.ok(
        content.includes('unfurnished_to_plans') || content.includes('e_a_cad'),
        "handleViewChange must handle 'unfurnished_to_plans' transition"
      );
    });

  });

  // =========================================================================
  // Group 3.2: Bidirectional Manifest Alignment
  // =========================================================================
  describe('Group 3.2: Bidirectional Manifest Alignment', () => {

    it('3.2.1: Manifest-to-Disk Integrity: Every WebP asset in assetManifest exists on disk in public/', async () => {
      const manifestModule = await import('../../src/data/asset-manifest.js');
      const manifest: string[] = manifestModule.assetManifest;
      const webpAssets = manifest.filter(p => p.startsWith('plants/details/') && p.endsWith('.webp'));

      assert.ok(webpAssets.length > 0, 'assetManifest must contain WebP assets for plants/details');

      const missing: string[] = [];
      for (const assetPath of webpAssets) {
        const fullPath = join(PROJECT_ROOT, 'public', assetPath);
        if (!existsSync(fullPath)) {
          missing.push(assetPath);
        }
      }

      assert.strictEqual(
        missing.length,
        0,
        `The following ${missing.length} WebP assets declared in manifest are missing from disk:\n${missing.join('\n')}`
      );
    });

    it('3.2.2: Manifest-to-Disk Integrity: Every transition MP4 declared in assetManifest exists on disk in public/', async () => {
      const manifestModule = await import('../../src/data/asset-manifest.js');
      const manifest: string[] = manifestModule.assetManifest;
      const mp4Assets = manifest.filter(p => p.startsWith('plants/details/') && p.endsWith('.mp4'));

      assert.ok(mp4Assets.length > 0, 'assetManifest must declare transition MP4s');

      const missing: string[] = [];
      for (const assetPath of mp4Assets) {
        const fullPath = join(PROJECT_ROOT, 'public', assetPath);
        if (!existsSync(fullPath)) {
          missing.push(assetPath);
        }
      }

      assert.strictEqual(
        missing.length,
        0,
        `The following ${missing.length} transition MP4s declared in manifest are missing from disk:\n${missing.join('\n')}`
      );
    });

    it('3.2.3: Disk-to-Manifest Coverage: Every WebP image in public/plants/details/ is declared in assetManifest', async () => {
      const manifestModule = await import('../../src/data/asset-manifest.js');
      const manifestSet = new Set(manifestModule.assetManifest);

      const allDiskWebPs = collectFiles(PUBLIC_PLANTS_DIR, ['.webp']);
      assert.ok(allDiskWebPs.length >= 137, `Expected at least 137 WebPs on disk, found ${allDiskWebPs.length}`);

      const unindexed: string[] = [];
      for (const diskFile of allDiskWebPs) {
        const relativeKey = diskFile.replace(join(PROJECT_ROOT, 'public') + '/', '');
        if (!manifestSet.has(relativeKey)) {
          unindexed.push(relativeKey);
        }
      }

      assert.strictEqual(
        unindexed.length,
        0,
        `The following ${unindexed.length} WebP files exist on disk but are not declared in assetManifest:\n${unindexed.join('\n')}`
      );
    });

    it('3.2.4: Zero Orphan Assets: No plant asset in assetManifest references a non-existent file on disk', async () => {
      const manifestModule = await import('../../src/data/asset-manifest.js');
      const manifest: string[] = manifestModule.assetManifest;
      const plantAssets = manifest.filter(p => p.startsWith('plants/'));

      const orphans: string[] = [];
      for (const asset of plantAssets) {
        const fullPath = join(PROJECT_ROOT, 'public', asset);
        if (!existsSync(fullPath)) {
          orphans.push(asset);
        }
      }

      assert.strictEqual(
        orphans.length,
        0,
        `Found ${orphans.length} orphan plant assets in manifest:\n${orphans.slice(0, 10).join('\n')}`
      );
    });

  });

  // =========================================================================
  // Group 3.3: Cross-Module Unit Metadata Alignment
  // =========================================================================
  describe('Group 3.3: Cross-Module Unit Metadata Alignment', () => {

    it('3.3.1: All 42 units in floors.ts have corresponding SVG geometry in floor-unit-geometry.ts', async () => {
      const floorsModule = await import('../../src/data/floors.js');
      const geometryModule = await import('../../src/data/floor-unit-geometry.js');
      const allUnits = floorsModule.floorsData.flatMap(f => f.units);
      const uniqueUnitIds = Array.from(new Set(allUnits.map(u => u.id)));

      for (const unitId of uniqueUnitIds) {
        const unit = allUnits.find(u => u.id === unitId)!;
        const geom = geometryModule.floorUnitGeometry(unit.floorId, unitId);
        assert.ok(geom, `Geometry must exist for floor ${unit.floorId}, unit ${unitId}`);
        assert.ok(
          geom.path && geom.path.length > 5,
          `SVG polygon path for unit ${unitId} must not be empty`
        );
        assert.strictEqual(typeof geom.x, 'number', `Unit ${unitId} must have numeric pin x coordinate`);
        assert.strictEqual(typeof geom.y, 'number', `Unit ${unitId} must have numeric pin y coordinate`);
      }
    });

    it('3.3.2: All 42 units in floors.ts have a valid Kuula 360 tour URL in unit-tours.ts', async () => {
      const floorsModule = await import('../../src/data/floors.js');
      const toursModule = await import('../../src/data/unit-tours.js');
      const allUnits = floorsModule.floorsData.flatMap(f => f.units);
      const uniqueUnitIds = Array.from(new Set(allUnits.map(u => u.id)));

      for (const unitId of uniqueUnitIds) {
        const tour = toursModule.unitTourUrls[unitId];
        assert.ok(tour, `Unit ${unitId} must have an entry in unitTourUrls`);
        assert.ok(
          tour.startsWith('https://kuula.co/'),
          `Unit ${unitId} tour URL must be a valid Kuula URL: ${tour}`
        );
      }
    });

    it('3.3.3: Commercial parameters (dimensions, bedrooms, bathrooms) are strictly valid across all 42 units', async () => {
      const floorsModule = await import('../../src/data/floors.js');
      const allUnits = floorsModule.floorsData.flatMap(f => f.units);

      for (const unit of allUnits) {
        assert.ok(unit.dimensions > 0, `Unit ${unit.id} dimensions must be > 0`);
        assert.ok(unit.bedrooms && unit.bedrooms >= 1, `Unit ${unit.id} bedrooms must be >= 1`);
        assert.ok(unit.bathrooms && unit.bathrooms >= 1, `Unit ${unit.id} bathrooms must be >= 1`);
        assert.ok(['available', 'reserved', 'sold'].includes(unit.status), `Unit ${unit.id} status is invalid`);
      }
    });

  });

});
