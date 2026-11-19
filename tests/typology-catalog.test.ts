import assert from 'node:assert/strict';
import { test } from 'node:test';
import { existsSync } from 'node:fs';
import { apartmentUnits, floorsData } from '../src/data/floors';
import { assetManifest } from '../src/data/asset-manifest';
import { updatedTypologyAssets } from '../src/data/updated-typology-assets';
import { typologyAssetRoot, typologyPlanAssetRoot, hasUpdatedTypology } from '../src/data/typology-assets';
import { mergePublicUnit } from '../src/hooks/usePublicSettings';

const unit = (id: string) => apartmentUnits.find(u => u.id === id)!;
test('confirmed distribution keeps existing units and adds the three new flats', () => {
  assert.equal(apartmentUnits.length, 45);
  assert.equal(new Set(apartmentUnits.map(u => u.id)).size, 45);
  for (let floor = 2; floor <= 13; floor++) assert.equal(unit(`${floor}01`).assetId, 'T1');
  const expected = { '1203': 'T8', '1303': 'T17', '1401': 'T10', '1501': 'T10', '1402': 'T11', '1403': 'T12', '1503': 'T12', '1502': 'T13', '1601': 'T14', '1602': 'T15', '1603': 'T16' };
  for (const [id, type] of Object.entries(expected)) assert.equal(unit(id).assetId, type);
  assert.equal(unit('201').dimensions, 73.54);
  assert.equal(unit('301').dimensions, 73.54);
  assert.equal(unit('1403').dimensions, 44.29);
  assert.equal(unit('1503').dimensions, 44.29);
  assert.equal(unit('1603').dimensions, 40.16);
  assert.equal(unit('1501').status, 'sold');
});
test('updated types keep confirmed bedrooms and bathrooms, including CMS merging', () => {
  for (const u of apartmentUnits.filter(u => hasUpdatedTypology(u.assetId))) {
    const bedrooms = ({ T1: 3, T7: 3, T9: 2, T10: 2, T11: 2, T12: 1, T13: 2, T14: 4, T15: 1, T16: 1 } as Record<string, number>)[u.assetId!];
    const bathrooms = ({ T9: 1, T12: 1, T14: 2.5, T15: 1, T16: 1 } as Record<string, number>)[u.assetId!] ?? 2;
    assert.equal(u.bedrooms, bedrooms);
    assert.equal(u.bathrooms, bathrooms);
    const merged = mergePublicUnit(u, { states: {}, features: {}, units: { [u.id]: { tourUrl: null, bedrooms: 4, bathrooms: 3, dimensions: null } } });
    assert.equal(merged.bedrooms, bedrooms);
    assert.equal(merged.bathrooms, bathrooms);
  }
  assert.equal(unit('203').bedrooms, 1);
});
test('every active updated view, gallery and transition points to prepared versioned content', () => {
  assert.equal(updatedTypologyAssets.length, 178);
  assert.equal(new Set(assetManifest).size, assetManifest.length);
  for (const asset of updatedTypologyAssets) {
    assert.ok(assetManifest.includes(asset));
    assert.ok(existsSync(`public/${asset}`), asset);
  }
  for (const u of apartmentUnits) {
    assert.ok(assetManifest.includes(`${typologyPlanAssetRoot(u.assetId!)}/plans.webp`));
  }
  const root = typologyAssetRoot('T14');
  for (const view of ['plans', 'furnished', 'unfurnished']) assert.ok(assetManifest.includes(`${root}/${view}_2floor.webp`));
  assert.equal(updatedTypologyAssets.filter(p => p.includes('/T14/transitions/')).length, 12);
  assert.equal(updatedTypologyAssets.filter(p => p.includes('/T12/transitions/')).length, 6);
  assert.equal(typologyAssetRoot('T8'), 'plants/details/T8');
});
test('duplex remains on both levels and upper units have independent selection polygons', () => {
  assert.equal(floorsData.find(f => f.id === '17')?.units.find(u => u.id === '1601')?.assetId, 'T14');
  for (const floor of [14, 15, 16]) {
    const units = floorsData.find(f => f.id === String(floor))!.units;
    assert.equal(units.length, 3);
    for (const u of units) assert.ok(u.path?.endsWith(' Z'), `${u.id} must have a polygon`);
    assert.equal(new Set(units.map(u => `${u.x},${u.y}`)).size, 3);
  }
});

test('confirmed T1 and T7 areas override old CMS measurements for every affected unit', () => {
  for (const u of apartmentUnits.filter(u => ['T1', 'T7'].includes(u.assetId!))) {
    const expectedArea = ['201', '301', '401'].includes(u.id) ? 73.54
      : ['501', '601'].includes(u.id) ? 72.83
      : u.assetId === 'T1' ? 72.07 : 57.30;
    assert.equal(u.dimensions, expectedArea);
    const merged = mergePublicUnit(u, { states: {}, features: {}, units: { [u.id]: { tourUrl: null, bedrooms: 2, bathrooms: 2, dimensions: 56.69 } } });
    assert.equal(merged.dimensions, expectedArea);
    assert.equal(merged.bedrooms, 3);
    assert.equal(merged.bathrooms, 2);
  }
  assert.equal(unit('1401').dimensions, 50.52);
});

test('confirmed schedule survives stale CMS values and excludes the roof area from the duplex', () => {
  const schedule: Record<string, [number, number, number]> = {
    '1302': [54.82, 2, 1], '1401': [50.52, 2, 2], '1501': [50.52, 2, 2],
    '1402': [67.74, 2, 2], '1403': [44.29, 1, 1], '1503': [44.29, 1, 1],
    '1502': [63.24, 2, 2], '1601': [66.34, 4, 2.5], '1602': [44.16, 1, 1], '1603': [40.16, 1, 1],
  };
  for (const [id, expected] of Object.entries(schedule)) {
    const original = unit(id);
    const merged = mergePublicUnit(original, { states: {}, features: {}, units: { [id]: { tourUrl: null, bedrooms: 2, bathrooms: 2, dimensions: 76.71 } } });
    for (const u of [original, merged]) assert.deepEqual([u.dimensions, u.bedrooms, u.bathrooms], expected);
  }
  assert.equal(unit('1601').areaBreakdown, undefined);
  const upper = floorsData.find(f => f.id === '17')!.units.find(u => u.id === '1601')!;
  assert.equal(upper.dimensions, 101.38);
  assert.equal(upper.areaBreakdown, unit('1601').areaBreakdown);
});
