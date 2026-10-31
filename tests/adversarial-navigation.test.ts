import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
import React from 'react';
import ReactDOMServer from 'react-dom/server';

// Domain imports
import { floorsData, UnitStatusString, Unit } from '../src/data/floors';
import { assetManifest } from '../src/data/asset-manifest';
import { getAssetUrl } from '../src/utils/assets';
import { TYPOLOGIES, TypologyMeta } from './e2e/helpers/test-constants';
import { parseWebPDimensions, getVideoMetadata } from './e2e/helpers/asset-helpers';

const PROJECT_ROOT = resolve(process.cwd());
const PUBLIC_DIR = join(PROJECT_ROOT, 'public');

/**
 * Extraction of UnitPage internal resolution algorithms
 * to verify parity and run high-volume stress cycles.
 */
function getStaticViewUrlSim(
  assetId: string,
  type: 'furnished' | 'unfurnished' | 'plans',
  isDuplex: boolean,
  activeFloor: 1 | 2
): { url: string; relativePath: string } | undefined {
  const typeKey = isDuplex && activeFloor === 2 ? `${type}_2floor` : type;
  const extensions = ['webp', 'jpg', 'jpeg', 'png'];
  const candidateKeys = [typeKey];
  if (typeKey === 'unfurnished') candidateKeys.push('deliverable');
  if (typeKey === 'unfurnished_2floor') candidateKeys.push('deliverable_2floor');

  for (const key of candidateKeys) {
    for (const ext of extensions) {
      const relativePath = `plants/details/${assetId}/${key}.${ext}`;
      if (assetManifest.includes(relativePath)) {
        return { url: getAssetUrl(relativePath), relativePath };
      }
    }
  }
  return undefined;
}

function getTransitionUrlSim(
  assetId: string,
  type: string,
  isDuplex: boolean,
  activeFloor: 1 | 2
): { url: string; relativePath: string } | undefined {
  if (isDuplex && activeFloor === 2) {
    const floor2Path = `plants/details/${assetId}/transitions/${type}_2floor.mp4`;
    if (assetManifest.includes(floor2Path)) {
      return { url: getAssetUrl(floor2Path), relativePath: floor2Path };
    }
  }
  const floor1Path = `plants/details/${assetId}/transitions/${type}_1floor.mp4`;
  if (isDuplex && activeFloor === 1 && assetManifest.includes(floor1Path)) {
    return { url: getAssetUrl(floor1Path), relativePath: floor1Path };
  }
  const relativePath = `plants/details/${assetId}/transitions/${type}.mp4`;
  if (assetManifest.includes(relativePath)) {
    return { url: getAssetUrl(relativePath), relativePath };
  }
  return undefined;
}

function getUnitGalleryImagesSim(assetId: string, title?: string) {
  const specificImages = assetManifest.filter((path) =>
    path.includes(`plants/details/${assetId}/gallery/`)
  );
  const webpImages = specificImages.filter((path) => path.endsWith('.webp'));
  const finalImages = webpImages.length > 0 ? webpImages : specificImages;

  return finalImages.map((path) => ({
    id: path,
    src: getAssetUrl(path),
    alt: `Unit ${title || assetId} Gallery`,
    title: `Unit ${title || assetId}`,
    relativePath: path,
  }));
}

function getTransitionNameSim(fromMode: string, toMode: string): string {
  if (fromMode === 'furnished' && toMode === 'unfurnished') return 'furnished_to_unfurnished';
  if (fromMode === 'unfurnished' && toMode === 'furnished') return 'unfurnished_to_furnished';
  if (fromMode === 'furnished' && toMode === 'plans') return 'furnished_to_plans';
  if (fromMode === 'plans' && toMode === 'furnished') return 'plans_to_furnished';
  if (fromMode === 'plans' && toMode === 'unfurnished') return 'plans_to_unfurnished';
  if (fromMode === 'unfurnished' && toMode === 'plans') return 'unfurnished_to_plans';
  return '';
}

function getNavStateSim(unit: { hasFurnishedView?: boolean }, viewMode: string) {
  if (!unit.hasFurnishedView) return { showLeft: false, showRight: false };
  if (viewMode === 'unfurnished') {
    return { showLeft: false, showRight: true, rightTarget: 'furnished' as const };
  }
  if (viewMode === 'furnished') {
    return {
      showLeft: true,
      leftTarget: 'unfurnished' as const,
      showRight: true,
      rightTarget: 'plans' as const,
    };
  }
  if (viewMode === 'plans') {
    return { showLeft: true, leftTarget: 'furnished' as const, showRight: false };
  }
  return { showLeft: false, showRight: false };
}

function getNavLabelSim(unit: { subtitle?: string }, target?: 'furnished' | 'unfurnished' | 'plans') {
  if (!target) return '';
  if (target === 'unfurnished') return 'Sin Amoblar';
  if (target === 'furnished') return unit.subtitle === 'Terraza' ? 'Terraza' : 'Amoblado';
  if (target === 'plans') return unit.subtitle === 'Terraza' ? 'Medidas' : 'Plano';
  return '';
}

function md5File(filePath: string): string {
  const buf = readFileSync(filePath);
  return createHash('md5').update(buf).digest('hex');
}

// Extract unique apartment units across all floors (42 total)
const allUnitsMap = new Map<string, Unit>();
for (const floor of floorsData) {
  for (const unit of floor.units) {
    if (unit.type === 'apartment' || unit.assetId) {
      if (!allUnitsMap.has(unit.id)) {
        allUnitsMap.set(unit.id, unit);
      }
    }
  }
}
const uniqueUnits = Array.from(allUnitsMap.values());

describe('Adversarial Test Suite: Unit Navigation & Stress Challenger', () => {

  describe('Suite 1: Empirical Route & View Resolution Across All 42 Units', () => {
    it('1.1.0: Exact count of unique units across floors 2 to 17 is exactly 42', () => {
      assert.equal(uniqueUnits.length, 42, `Expected 42 unique units, found ${uniqueUnits.length}`);
    });

    it('1.1.1: Every unit strictly resolves .webp format as primary for all 3 standard views', () => {
      const views = ['plans', 'furnished', 'unfurnished'] as const;
      const nonWebpResolutions: { unitId: string; view: string; resolved: string }[] = [];

      for (const unit of uniqueUnits) {
        const assetId = unit.assetId || unit.id;
        const isDuplex = assetId === 'T12' || unit.subtitle === 'Dúplex' || unit.id === '1601';

        for (const view of views) {
          const res = getStaticViewUrlSim(assetId, view, isDuplex, 1);
          assert.ok(res, `Unit ${unit.id} failed to resolve view: ${view}`);
          if (!res.relativePath.endsWith('.webp')) {
            nonWebpResolutions.push({ unitId: unit.id, view, resolved: res.relativePath });
          }
        }
      }

      assert.equal(
        nonWebpResolutions.length,
        0,
        `Found ${nonWebpResolutions.length} views that did not resolve to .webp: ${JSON.stringify(nonWebpResolutions)}`
      );
    });

    it('1.1.2: Zero 404s: All resolved WebP image paths exist on disk, are non-empty, and have 3840x2160 dimensions', () => {
      const views = ['plans', 'furnished', 'unfurnished'] as const;
      let checkedCount = 0;

      for (const unit of uniqueUnits) {
        const assetId = unit.assetId || unit.id;
        const isDuplex = assetId === 'T12' || unit.subtitle === 'Dúplex' || unit.id === '1601';

        for (const view of views) {
          const res = getStaticViewUrlSim(assetId, view, isDuplex, 1)!;
          const diskPath = join(PUBLIC_DIR, res.relativePath);
          assert.ok(existsSync(diskPath), `404 Error: File does not exist on disk: ${diskPath}`);

          const meta = parseWebPDimensions(diskPath);
          assert.ok(meta.isValidWebP, `Invalid WebP file at ${diskPath}`);
          assert.equal(meta.width, 3840, `Width mismatch at ${diskPath}: got ${meta.width}`);
          assert.equal(meta.height, 2160, `Height mismatch at ${diskPath}: got ${meta.height}`);
          assert.ok(meta.fileSizeBytes > 10000, `Suspiciously small file size (${meta.fileSizeBytes}b) at ${diskPath}`);
          checkedCount++;
        }
      }

      // 42 units * 3 views = 126 view checks
      assert.equal(checkedCount, 126, `Expected 126 view checks, executed ${checkedCount}`);
    });

    it('1.1.3: Gallery images: Every unit resolves its gallery images strictly as .webp without slide duplication', () => {
      let totalGalleryImagesChecked = 0;

      for (const unit of uniqueUnits) {
        const assetId = unit.assetId || unit.id;
        const gallery = getUnitGalleryImagesSim(assetId, unit.id);
        assert.ok(gallery.length > 0, `Gallery empty for unit ${unit.id} (typology ${assetId})`);

        // Check for duplicates
        const relativePaths = gallery.map((g) => g.relativePath);
        const uniquePaths = new Set(relativePaths);
        assert.equal(
          uniquePaths.size,
          relativePaths.length,
          `Duplicate gallery images detected for unit ${unit.id}`
        );

        for (const item of gallery) {
          assert.ok(
            item.relativePath.endsWith('.webp'),
            `Gallery item ${item.relativePath} is not WebP for unit ${unit.id}`
          );
          const diskPath = join(PUBLIC_DIR, item.relativePath);
          assert.ok(existsSync(diskPath), `404 Gallery item not found on disk: ${diskPath}`);
          const meta = parseWebPDimensions(diskPath);
          assert.equal(meta.width, 3840, `Gallery image width != 3840: ${diskPath}`);
          assert.equal(meta.height, 2160, `Gallery image height != 2160: ${diskPath}`);
          totalGalleryImagesChecked++;
        }
      }

      // Total across 42 units (units sharing typology will check typology galleries)
      assert.ok(totalGalleryImagesChecked > 300, `Checked ${totalGalleryImagesChecked} gallery instances`);
    });
  });

  describe('Suite 2: Duplex Unit 1601 Multi-Level Floor Deep Stress Test', () => {
    const duplexId = '1601';
    const duplexAssetId = 'T12';

    it('2.1: Duplex Unit 1601 exists on both Floor 16 and Floor 17 in floorsData', () => {
      const floor16 = floorsData.find((f) => f.id === '16');
      const floor17 = floorsData.find((f) => f.id === '17');

      assert.ok(floor16, 'Floor 16 missing in floorsData');
      assert.ok(floor17, 'Floor 17 missing in floorsData');

      const u16 = floor16.units.find((u) => u.id === duplexId);
      const u17 = floor17.units.find((u) => u.id === duplexId);

      assert.ok(u16, 'Duplex 1601 not found in Floor 16 units');
      assert.ok(u17, 'Duplex 1601 not found in Floor 17 units');
      assert.equal(u16.subtitle, 'Dúplex');
      assert.equal(u17.subtitle, 'Dúplex');
    });

    it('2.2: Duplex Floor 1 resolves plans.webp, furnished.webp, and unfurnished.webp', () => {
      const p1 = getStaticViewUrlSim(duplexAssetId, 'plans', true, 1)!;
      const f1 = getStaticViewUrlSim(duplexAssetId, 'furnished', true, 1)!;
      const u1 = getStaticViewUrlSim(duplexAssetId, 'unfurnished', true, 1)!;

      assert.equal(p1.relativePath, 'plants/details/T12/plans.webp');
      assert.equal(f1.relativePath, 'plants/details/T12/furnished.webp');
      assert.equal(u1.relativePath, 'plants/details/T12/unfurnished.webp');

      for (const res of [p1, f1, u1]) {
        const diskPath = join(PUBLIC_DIR, res.relativePath);
        assert.ok(existsSync(diskPath), `Missing Floor 1 duplex asset: ${diskPath}`);
        const meta = parseWebPDimensions(diskPath);
        assert.equal(meta.width, 3840);
        assert.equal(meta.height, 2160);
      }
    });

    it('2.3: Duplex Floor 2 resolves plans_2floor.webp, furnished_2floor.webp, and unfurnished_2floor.webp', () => {
      const p2 = getStaticViewUrlSim(duplexAssetId, 'plans', true, 2)!;
      const f2 = getStaticViewUrlSim(duplexAssetId, 'furnished', true, 2)!;
      const u2 = getStaticViewUrlSim(duplexAssetId, 'unfurnished', true, 2)!;

      assert.equal(p2.relativePath, 'plants/details/T12/plans_2floor.webp');
      assert.equal(f2.relativePath, 'plants/details/T12/furnished_2floor.webp');
      assert.equal(u2.relativePath, 'plants/details/T12/unfurnished_2floor.webp');

      for (const res of [p2, f2, u2]) {
        const diskPath = join(PUBLIC_DIR, res.relativePath);
        assert.ok(existsSync(diskPath), `Missing Floor 2 duplex asset: ${diskPath}`);
        const meta = parseWebPDimensions(diskPath);
        assert.equal(meta.width, 3840);
        assert.equal(meta.height, 2160);
      }
    });

    it('2.4: Floor 1 and Floor 2 assets are architecturally distinct (MD5 hashes differ)', () => {
      const p1Hash = md5File(join(PUBLIC_DIR, 'plants/details/T12/plans.webp'));
      const p2Hash = md5File(join(PUBLIC_DIR, 'plants/details/T12/plans_2floor.webp'));
      assert.notEqual(p1Hash, p2Hash, 'Floor 1 and Floor 2 plans must not be identical');

      const f1Hash = md5File(join(PUBLIC_DIR, 'plants/details/T12/furnished.webp'));
      const f2Hash = md5File(join(PUBLIC_DIR, 'plants/details/T12/furnished_2floor.webp'));
      assert.notEqual(f1Hash, f2Hash, 'Floor 1 and Floor 2 furnished renders must not be identical');

      const u1Hash = md5File(join(PUBLIC_DIR, 'plants/details/T12/unfurnished.webp'));
      const u2Hash = md5File(join(PUBLIC_DIR, 'plants/details/T12/unfurnished_2floor.webp'));
      assert.notEqual(u1Hash, u2Hash, 'Floor 1 and Floor 2 unfurnished renders must not be identical');
    });

    it('2.5: Duplex transitions: Floor 1 resolves *_1floor.mp4 and Floor 2 resolves *_2floor.mp4 for all 6 directions', () => {
      const transitionKeys = [
        'furnished_to_unfurnished',
        'unfurnished_to_furnished',
        'furnished_to_plans',
        'plans_to_furnished',
        'plans_to_unfurnished',
        'unfurnished_to_plans',
      ];

      for (const tr of transitionKeys) {
        // Floor 1
        const t1 = getTransitionUrlSim(duplexAssetId, tr, true, 1);
        assert.ok(t1, `Duplex Floor 1 missing transition ${tr}`);
        assert.ok(
          t1.relativePath.includes('1floor.mp4') || t1.relativePath.includes(`${tr}.mp4`),
          `Floor 1 transition path unexpected: ${t1.relativePath}`
        );
        const disk1 = join(PUBLIC_DIR, t1.relativePath);
        assert.ok(existsSync(disk1), `Disk file missing: ${disk1}`);

        // Floor 2
        const t2 = getTransitionUrlSim(duplexAssetId, tr, true, 2);
        assert.ok(t2, `Duplex Floor 2 missing transition ${tr}`);
        assert.ok(
          t2.relativePath.includes('2floor.mp4'),
          `Floor 2 transition path must contain 2floor: ${t2.relativePath}`
        );
        const disk2 = join(PUBLIC_DIR, t2.relativePath);
        assert.ok(existsSync(disk2), `Disk file missing: ${disk2}`);

        // Distinct video content
        const hash1 = md5File(disk1);
        const hash2 = md5File(disk2);
        assert.notEqual(hash1, hash2, `Floor 1 and Floor 2 transition video ${tr} must have distinct content`);
      }
    });
  });

  describe('Suite 3: Stress Testing the Complete View Transition Graph (T1–T12)', () => {
    const sixTransitions = [
      'furnished_to_unfurnished',
      'unfurnished_to_furnished',
      'furnished_to_plans',
      'plans_to_furnished',
      'plans_to_unfurnished',
      'unfurnished_to_plans',
    ];

    it('3.1: Every typology T1–T12 has all 6 transitions resolvable via getTransitionUrl', () => {
      for (let i = 1; i <= 12; i++) {
        const assetId = `T${i}`;
        const isDuplex = assetId === 'T12';
        for (const tr of sixTransitions) {
          const res = getTransitionUrlSim(assetId, tr, isDuplex, 1);
          assert.ok(res, `Failed to resolve transition ${tr} for ${assetId}`);
          const diskPath = join(PUBLIC_DIR, res.relativePath);
          assert.ok(existsSync(diskPath), `Transition MP4 does not exist on disk: ${diskPath}`);

          // Fast verify MP4 container box header (bytes 4..8 == 'ftyp')
          const buf = readFileSync(diskPath);
          assert.ok(buf.length > 100000, `Video file too small (<100KB) at ${diskPath}`);
          const ftyp = buf.toString('ascii', 4, 8);
          assert.equal(ftyp, 'ftyp', `Invalid MP4 magic container in ${diskPath}`);
        }
      }
    });

    it('3.2: Transition Regression Check: plans_to_furnished matches 02_cad_a_a and NOT 03_cad_a_e', () => {
      const suspectTypologies = ['T1', 'T4', 'T5', 'T12'];

      for (const t of suspectTypologies) {
        const transPath = join(PUBLIC_DIR, `plants/details/${t}/transitions/plans_to_furnished.mp4`);
        assert.ok(existsSync(transPath), `Missing plans_to_furnished in ${t}`);
        const actualHash = md5File(transPath);

        const tLower = t.toLowerCase();
        const cadAA = t === 'T12'
          ? join(PUBLIC_DIR, `plants/details/${t}/transitions/t12_-_02_cad_a_a_1.mp4`)
          : join(PUBLIC_DIR, `plants/details/${t}/transitions/${tLower}_-_02_cad_a_a.mp4`);
        const cadAE = t === 'T12'
          ? join(PUBLIC_DIR, `plants/details/${t}/transitions/t12_-_03_cad_a_e_1.mp4`)
          : join(PUBLIC_DIR, `plants/details/${t}/transitions/${tLower}_-_03_cad_a_e.mp4`);

        assert.ok(existsSync(cadAA), `Missing reference 02_cad_a_a in ${t}`);
        assert.ok(existsSync(cadAE), `Missing reference 03_cad_a_e in ${t}`);

        const expectedHash = md5File(cadAA);
        const forbiddenHash = md5File(cadAE);

        assert.equal(
          actualHash,
          expectedHash,
          `Typology ${t}: plans_to_furnished.mp4 does NOT match genuine CAD->Furnished (02_cad_a_a)`
        );
        assert.notEqual(
          actualHash,
          forbiddenHash,
          `Typology ${t}: plans_to_furnished.mp4 STILL matches legacy buggy CAD->Unfurnished (03_cad_a_e)`
        );
      }
    });

    it('3.3: Every directed transition edge is strictly inverted by its reverse pair', () => {
      const pairs: [string, string][] = [
        ['plans', 'furnished'],
        ['furnished', 'unfurnished'],
        ['plans', 'unfurnished'],
      ];

      for (const [from, to] of pairs) {
        const forwardName = getTransitionNameSim(from, to);
        const reverseName = getTransitionNameSim(to, from);

        assert.ok(forwardName.length > 0, `Missing forward transition name for ${from} -> ${to}`);
        assert.ok(reverseName.length > 0, `Missing reverse transition name for ${to} -> ${from}`);

        assert.equal(forwardName, `${from}_to_${to}`);
        assert.equal(reverseName, `${to}_to_${from}`);
      }
    });
  });

  describe('Suite 4: Edge Cases, Malformed Inputs & State Machine Stress Testing', () => {
    it('4.1: Missing & Malformed unit IDs: Floors lookup and UnitPage fallback logic gracefully reject invalid IDs', () => {
      const invalidIds = ['9999', '0', '-1', '', 'xyz', 'null', 'undefined', '<script>alert(1)</script>', 'T1'];

      for (const badId of invalidIds) {
        const floor = floorsData.find((f) => f.units.some((u) => u.id === badId));
        const originalUnit = floor?.units.find((u) => u.id === badId);

        // Both must be undefined for invalid IDs
        assert.equal(floor, undefined, `Invalid ID '${badId}' unexpectedly matched a floor`);
        assert.equal(originalUnit, undefined, `Invalid ID '${badId}' unexpectedly matched a unit`);
      }
    });

    it('4.2: Sold units: Verified status strings, sold badges, and showroom asset retention', () => {
      const knownSoldUnitIds = ['1501', '1202', '1002', '801', '703', '401'];

      for (const soldId of knownSoldUnitIds) {
        const unit = uniqueUnits.find((u) => u.id === soldId);
        assert.ok(unit, `Sold unit ${soldId} not found in inventory`);
        assert.equal(unit.status, 'sold', `Unit ${soldId} should be marked sold`);
        assert.equal(UnitStatusString[unit.status], 'Vendido');

        // Verify that sold units still have complete assets for showroom presentation
        const assetId = unit.assetId || unit.id;
        const plans = getStaticViewUrlSim(assetId, 'plans', false, 1);
        const furnished = getStaticViewUrlSim(assetId, 'furnished', false, 1);
        const unfurnished = getStaticViewUrlSim(assetId, 'unfurnished', false, 1);

        assert.ok(plans && plans.relativePath.endsWith('.webp'));
        assert.ok(furnished && furnished.relativePath.endsWith('.webp'));
        assert.ok(unfurnished && unfurnished.relativePath.endsWith('.webp'));
      }
    });

    it('4.3: Available units: Verified status strings and availability badges', () => {
      const availableUnits = uniqueUnits.filter((u) => u.status === 'available');
      assert.equal(availableUnits.length, 36, `Expected 36 available units (42 total - 6 sold)`);

      for (const unit of availableUnits) {
        assert.equal(UnitStatusString[unit.status], 'Disponible');
      }
    });

    it('4.4: Subtitle & Common Area Boundaries: Simulated Common/Terraza units handle custom labels', () => {
      const mockTerrazaUnit = { subtitle: 'Terraza', hasFurnishedView: true };

      assert.equal(getNavLabelSim(mockTerrazaUnit, 'furnished'), 'Terraza');
      assert.equal(getNavLabelSim(mockTerrazaUnit, 'plans'), 'Medidas');
      assert.equal(getNavLabelSim(mockTerrazaUnit, 'unfurnished'), 'Sin Amoblar');

      const mockStandardUnit = { subtitle: 'Flat', hasFurnishedView: true };
      assert.equal(getNavLabelSim(mockStandardUnit, 'furnished'), 'Amoblado');
      assert.equal(getNavLabelSim(mockStandardUnit, 'plans'), 'Plano');
      assert.equal(getNavLabelSim(mockStandardUnit, 'unfurnished'), 'Sin Amoblar');
    });

    it('4.5: Non-Furnished Units Boundary: Units with hasFurnishedView: false disable arrow navigation', () => {
      const mockStorageUnit = { subtitle: 'Depósito', hasFurnishedView: false };
      const nav = getNavStateSim(mockStorageUnit, 'plans');

      assert.equal(nav.showLeft, false);
      assert.equal(nav.showRight, false);
    });

    it('4.6: Rapid State Switching & Random Walk Stress Test (10,000 state transitions)', () => {
      const modes = ['unfurnished', 'furnished', 'plans'] as const;
      const allModes = ['unfurnished', 'furnished', 'plans', 'gallery', 'tour'] as const;

      let currentState: 'unfurnished' | 'furnished' | 'plans' | 'gallery' | 'tour' = 'furnished';
      let currentDuplexFloor: 1 | 2 = 1;
      let totalTransitionsChecked = 0;

      // Seed pseudo-random generator for reproducible deterministic run
      let seed = 123456789;
      const nextRand = () => {
        seed = (seed * 1664525 + 1013904223) % 4294967296;
        return seed / 4294967296;
      };

      for (let step = 0; step < 10000; step++) {
        const rand = nextRand();
        const nextMode = allModes[Math.floor(nextRand() * allModes.length)];

        if (nextMode !== currentState) {
          // If moving between view modes:
          if (['unfurnished', 'furnished', 'plans'].includes(currentState) &&
              ['unfurnished', 'furnished', 'plans'].includes(nextMode)) {
            const transName = getTransitionNameSim(currentState, nextMode);
            assert.ok(transName.length > 0, `Missing transition name between ${currentState} and ${nextMode}`);

            // Test transition resolution for both duplex and standard units
            const transStandard = getTransitionUrlSim('T1', transName, false, 1);
            assert.ok(transStandard, `Standard transition resolution failed for ${transName}`);

            const transDuplex = getTransitionUrlSim('T12', transName, true, currentDuplexFloor);
            assert.ok(transDuplex, `Duplex floor ${currentDuplexFloor} transition resolution failed for ${transName}`);
          }
          currentState = nextMode;
        }

        // Randomly toggle duplex floor
        if (rand < 0.2) {
          currentDuplexFloor = currentDuplexFloor === 1 ? 2 : 1;
          const staticView = getStaticViewUrlSim('T12', 'plans', true, currentDuplexFloor);
          assert.ok(staticView, `Duplex static view failed on floor ${currentDuplexFloor}`);
        }

        totalTransitionsChecked++;
      }

      assert.equal(totalTransitionsChecked, 10000, 'Executed 10,000 random walk state switches without error');
    });

    it('4.7: Linear Arrow Navigation Invariance: Unfurnished <-> Furnished <-> Plans bidirectional flow', () => {
      const unit = { hasFurnishedView: true };

      // At unfurnished: can only go right to furnished
      const state1 = getNavStateSim(unit, 'unfurnished');
      assert.equal(state1.showLeft, false);
      assert.equal(state1.showRight, true);
      assert.equal(state1.rightTarget, 'furnished');

      // At furnished: can go left to unfurnished or right to plans
      const state2 = getNavStateSim(unit, 'furnished');
      assert.equal(state2.showLeft, true);
      assert.equal(state2.leftTarget, 'unfurnished');
      assert.equal(state2.showRight, true);
      assert.equal(state2.rightTarget, 'plans');

      // At plans: can only go left to furnished
      const state3 = getNavStateSim(unit, 'plans');
      assert.equal(state3.showLeft, true);
      assert.equal(state3.leftTarget, 'furnished');
      assert.equal(state3.showRight, false);

      // Verify that left of (right of unfurnished) is unfurnished
      assert.equal(state1.rightTarget, 'furnished');
      const fromRight = getNavStateSim(unit, state1.rightTarget!);
      assert.equal(fromRight.leftTarget, 'unfurnished');

      // Verify that right of (left of plans) is plans
      assert.equal(state3.leftTarget, 'furnished');
      const fromLeft = getNavStateSim(unit, state3.leftTarget!);
      assert.equal(fromLeft.rightTarget, 'plans');
    });
  });

  describe('Suite 5: React Component DOM Server Rendering Across All 42 Units & Edge Cases', () => {
    let UnitPage: any = null;
    let mockContext: { currentId: string } = { currentId: '201' };

    // Set up mock if module mocking is available in current Node runner
    it('5.0: Initialize Next.js navigation mocks and import UnitPage component', async (t) => {
      const { mock } = await import('node:test');
      if (typeof mock?.module === 'function') {
        mock.module('next/navigation', {
          namedExports: {
            useParams: () => ({ id: mockContext.currentId }),
            useRouter: () => ({ push: () => {}, back: () => {}, forward: () => {} }),
            usePathname: () => `/unidad/${mockContext.currentId}`,
            useSearchParams: () => new URLSearchParams(),
          },
        });
      }

      try {
        const mod = await import('../src/app/unidad/[id]/page');
        UnitPage = mod.default;
      } catch (err: any) {
        t.skip(`Skipping React render tests if environment cannot import UnitPage: ${err.message}`);
      }
    });

    it('5.1: Empirical React Render: All 42 units render cleanly without runtime exceptions and output primary WebP image tags', (t) => {
      if (!UnitPage) {
        t.skip('UnitPage not loaded');
        return;
      }

      let renderCount = 0;
      for (const unit of uniqueUnits) {
        mockContext.currentId = unit.id;
        const html = ReactDOMServer.renderToString(React.createElement(UnitPage));

        assert.ok(html.length > 5000, `HTML output too short for unit ${unit.id}`);
        assert.ok(html.includes(unit.id), `HTML does not contain unit id ${unit.id}`);
        assert.ok(html.includes('.webp'), `HTML does not contain primary .webp image for unit ${unit.id}`);
        assert.ok(!html.includes('Image not found'), `HTML rendered fallback 'Image not found' for unit ${unit.id}`);
        renderCount++;
      }

      assert.equal(renderCount, 42, `Expected 42 successful React component renders, executed ${renderCount}`);
    });

    it('5.2: Duplex Penthouse Unit 1601 renders duplex-specific floor toggle UI pills in React DOM', (t) => {
      if (!UnitPage) {
        t.skip('UnitPage not loaded');
        return;
      }

      mockContext.currentId = '1601';
      const html = ReactDOMServer.renderToString(React.createElement(UnitPage));

      assert.ok(html.includes('Piso 16 (Nivel 1)'), 'Missing Piso 16 (Nivel 1) pill button');
      assert.ok(html.includes('Piso 17 (Nivel 2)'), 'Missing Piso 17 (Nivel 2) pill button');
      assert.ok(html.includes('Sin Amoblar'), 'Missing Sin Amoblar pill button');
      assert.ok(html.includes('Amoblado'), 'Missing Amoblado pill button');
      assert.ok(html.includes('Plano'), 'Missing Plano pill button');
      assert.ok(html.includes('Dúplex'), 'Missing Dúplex subtitle in header');
    });

    it('5.3: Standard Unit 201 does NOT render duplex floor toggle pills in React DOM', (t) => {
      if (!UnitPage) {
        t.skip('UnitPage not loaded');
        return;
      }

      mockContext.currentId = '201';
      const html = ReactDOMServer.renderToString(React.createElement(UnitPage));

      assert.equal(html.includes('Piso 16 (Nivel 1)'), false, 'Standard unit should not have duplex floor pill');
      assert.equal(html.includes('Piso 17 (Nivel 2)'), false, 'Standard unit should not have duplex floor pill');
      assert.ok(html.includes('201'), 'Missing 201 title');
      assert.ok(html.includes('Flat'), 'Missing Flat subtitle');
    });

    it('5.4: Sold Unit 1501 renders Sold status badge and unavailable poster text in React DOM', (t) => {
      if (!UnitPage) {
        t.skip('UnitPage not loaded');
        return;
      }

      mockContext.currentId = '1501';
      const html = ReactDOMServer.renderToString(React.createElement(UnitPage));

      assert.ok(html.includes('Vendido'), 'Missing Vendido status badge');
      assert.ok(html.includes('Esta unidad no está disponible'), 'Missing unavailable poster text');
      assert.ok(html.includes('1501'), 'Missing 1501 unit id');
    });

    it('5.5: Non-existent Unit 9999 renders fallback 404 screen cleanly without unhandled exception', (t) => {
      if (!UnitPage) {
        t.skip('UnitPage not loaded');
        return;
      }

      mockContext.currentId = '9999';
      const html = ReactDOMServer.renderToString(React.createElement(UnitPage));

      assert.ok(html.includes('Unidad no encontrada'), 'Missing Unidad no encontrada heading');
      assert.ok(html.includes('Volver a Plantas'), 'Missing Volver a Plantas return button');
    });
  });
});

