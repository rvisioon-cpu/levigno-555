import assert from 'node:assert/strict';
import { test } from 'node:test';
import { existsSync } from 'node:fs';
import { apartmentUnits, floorsData } from '../src/data/floors';
import { assetManifest } from '../src/data/asset-manifest';
import { updatedTypologyAssets } from '../src/data/updated-typology-assets';
import { typologyAssetRoot, hasUpdatedTypology } from '../src/data/typology-assets';
import { mergePublicUnit } from '../src/hooks/usePublicSettings';

const unit = (id: string) => apartmentUnits.find(u => u.id === id)!;
test('confirmed distribution keeps existing units and adds the three new flats', () => {
  assert.equal(apartmentUnits.length, 45);
  assert.equal(new Set(apartmentUnits.map(u => u.id)).size, 45);
  for (let floor = 2; floor <= 13; floor++) assert.equal(unit(`${floor}01`).assetId, 'T1');
  const expected = { '1203': 'T8', '1303': 'T8', '1401': 'T10', '1501': 'T10', '1402': 'T11', '1403': 'T12', '1503': 'T12', '1502': 'T13', '1601': 'T14', '1602': 'T15', '1603': 'T16' };
  for (const [id, type] of Object.entries(expected)) assert.equal(unit(id).assetId, type);
  assert.equal(unit('201').dimensions, 73.52);
  assert.equal(unit('301').dimensions, 73.52);
  for (const id of ['1403', '1503', '1603']) assert.equal(unit(id).dimensions, 0);
  assert.equal(unit('1501').status, 'sold');
});
test('updated types keep confirmed bedrooms and bathrooms, including CMS merging', () => {
  for (const u of apartmentUnits.filter(u => hasUpdatedTypology(u.assetId))) {
    const bedrooms = ['T1', 'T7'].includes(u.assetId!) ? 3 : 2;
    assert.equal(u.bedrooms, bedrooms);
    assert.equal(u.bathrooms, 2);
    const merged = mergePublicUnit(u, { states: {}, features: {}, units: { [u.id]: { tourUrl: null, bedrooms: 4, bathrooms: 3, dimensions: null } } });
    assert.equal(merged.bedrooms, bedrooms);
    assert.equal(merged.bathrooms, 2);
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
    assert.ok(assetManifest.includes(`${typologyAssetRoot(u.assetId!)}/plans.webp`));
  }
  const root = typologyAssetRoot('T14');
  for (const view of ['plans', 'furnished', 'unfurnished']) assert.ok(assetManifest.includes(`${root}/${view}_2floor.webp`));
  assert.equal(updatedTypologyAssets.filter(p => p.includes('/T14/transitions/')).length, 12);
  assert.equal(updatedTypologyAssets.filter(p => p.includes('/T12/transitions/')).length, 6);
  assert.equal(typologyAssetRoot('T8'), 'plants/details/T8');
});
test('duplex remains on both levels and new units have individual selectable pins', () => {
  assert.equal(floorsData.find(f => f.id === '17')?.units.find(u => u.id === '1601')?.assetId, 'T14');
  for (const floor of [14, 15, 16]) {
    const units = floorsData.find(f => f.id === String(floor))!.units;
    assert.equal(units.length, 3);
    assert.equal(new Set(units.map(u => `${u.x},${u.y}`)).size, 3);
  }
});

test('confirmed T1 and T7 areas override old CMS measurements for every affected unit', () => {
  for (const u of apartmentUnits.filter(u => ['T1', 'T7'].includes(u.assetId!))) {
    const expectedArea = u.assetId === 'T1' ? 73.52 : 54.18;
    assert.equal(u.dimensions, expectedArea);
    const merged = mergePublicUnit(u, { states: {}, features: {}, units: { [u.id]: { tourUrl: null, bedrooms: 2, bathrooms: 2, dimensions: 56.69 } } });
    assert.equal(merged.dimensions, expectedArea);
    assert.equal(merged.bedrooms, 3);
    assert.equal(merged.bathrooms, 2);
  }
  assert.equal(unit('1401').dimensions, 72.22);
});
