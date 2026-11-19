import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { test } from 'node:test';
import {
  buildingAerialLoop,
  buildingAerialPoster,
  buildingFaces,
  buildingOpening,
} from '../src/data/buildingData';
import { assetManifest } from '../src/data/asset-manifest';
import { galleries } from '../src/data/galleries';
import { amenityPhotos, buildingMediaPaths, latestMedia } from '../src/data/latest-media';
import { projectVideo } from '../src/data/video';

const exteriorRoot = 'building/exterior/20261119/';
const photosRoot = `${exteriorRoot}photos/`;
const keyOf = (url: string) => new URL(url, 'https://showroom.test').pathname.slice(1);
const publicFile = (key: string) => new URL(`../public/${key}`, import.meta.url);
const exteriorVideo = (name: string) => `${exteriorRoot}${name}.mp4`;
const preparedMedia = [
  ...buildingMediaPaths,
  latestMedia.introVideo,
  latestMedia.introPoster,
  latestMedia.mainVideo,
  latestMedia.mainPoster,
];

test('entrance moves from opening to aerial, then to the central day face', () => {
  assert.deepEqual(buildingOpening.map(keyOf), [
    exteriorVideo('0.1-0.2'),
    exteriorVideo('0.2-1.1'),
  ]);
  assert.equal(keyOf(buildingAerialLoop), exteriorVideo('aerial-loop'));
  assert.equal(keyOf(buildingAerialPoster), `${photosRoot}0.2.webp`);
  assert.equal(buildingFaces[0].id, 1);
  assert.equal(keyOf(buildingFaces[0].day.background), `${photosRoot}1.1.webp`);
});

test('rotation keeps the lighting mode and each lateral returns to the central face', () => {
  assert.deepEqual(buildingFaces.map(face => face.id), [1, 2, 3]);
  for (const face of buildingFaces) {
    for (const [mode, time] of [['day', 1], ['night', 2]] as const) {
      const source = `${face.id}.${time}`;
      const leftDestination = face.id === 1 ? `2.${time}` : `1.${time}`;
      const rightDestination = face.id === 1 ? `3.${time}` : `1.${time}`;
      assert.equal(keyOf(face[mode].transitions.toLeft), exteriorVideo(`${source}-${leftDestination}`));
      assert.equal(keyOf(face[mode].transitions.toRight), exteriorVideo(`${source}-${rightDestination}`));
    }
  }
  // The supplied file named "1.2 A 2.1" actually ends at the night view 2.2.
  assert.equal(keyOf(buildingFaces[0].night.transitions.toLeft), exteriorVideo('1.2-2.2'));
});

test('day/night changes preserve the face and all six ascents reach the floor selector', () => {
  for (const face of buildingFaces) {
    assert.equal(keyOf(face.dayToNightTransition), exteriorVideo(`${face.id}.1-${face.id}.2`));
    assert.equal(keyOf(face.nightToDayTransition), exteriorVideo(`${face.id}.2-${face.id}.1`));
    for (const [mode, time] of [['day', 1], ['night', 2]] as const) {
      assert.equal(keyOf(face[mode].background), `${photosRoot}${face.id}.${time}.webp`);
      assert.equal(keyOf(face[mode].introVideo), exteriorVideo(`${face.id}.${time}-up`));
      assert.equal(face[mode].backgroundVideo, '', 'old face loops must not cover the supplied stills');
    }
  }
});

test('all 35 prepared media files exist and use the new cache version', () => {
  assert.equal(preparedMedia.length, 35);
  assert.equal(new Set(preparedMedia).size, 35);
  assert.equal(latestMedia.introVideo, 'videos/20261119/portada.mp4');
  assert.equal(latestMedia.introPoster, 'homepage/20261119/portada.webp');
  assert.deepEqual(
    readdirSync(publicFile(photosRoot)).sort(),
    buildingMediaPaths.filter(key => key.endsWith('.webp')).map(key => key.slice(photosRoot.length)).sort(),
  );
  assert.deepEqual(
    readdirSync(publicFile(exteriorRoot)).filter(name => name.endsWith('.mp4')).sort(),
    buildingMediaPaths.filter(key => key.endsWith('.mp4')).map(key => key.slice(exteriorRoot.length)).sort(),
  );
  for (const key of preparedMedia) {
    assert.ok(assetManifest.includes(key), `${key} must be available to the preload system`);
    assert.ok(statSync(publicFile(key)).size > 0, `${key} must contain prepared media`);
  }
  assert.ok(assetManifest.filter(key => key.startsWith('building/exterior/'))
    .every(key => key.startsWith(exteriorRoot)), 'the asset manifest must not preload old exterior media');
  assert.ok(assetManifest.filter(key => key.startsWith(exteriorRoot) && key.endsWith('.webp'))
    .every(key => key.startsWith(photosRoot)), 'images must use fresh URLs rather than previously cached exterior image keys');
});

test('offline manifest includes every new file with a measured size', () => {
  const manifest = JSON.parse(readFileSync(publicFile('precache-manifest.json'), 'utf8')) as {
    tiers: { id: string; assets: [string, number][] }[];
    missing: string[];
  };
  const offlineAssets = new Map(manifest.tiers.flatMap(tier => tier.assets));
  for (const key of preparedMedia) {
    assert.equal(offlineAssets.get(key), statSync(publicFile(key)).size, `${key} must be measured for offline use`);
    assert.ok(!manifest.missing.includes(key));
  }
  assert.ok([...offlineAssets.keys()].filter(key => key.startsWith('building/exterior/'))
    .every(key => key.startsWith(exteriorRoot)), 'offline preparation must use the current exterior version');
  assert.ok([...offlineAssets.keys()].filter(key => key.startsWith(exteriorRoot) && key.endsWith('.webp'))
    .every(key => key.startsWith(photosRoot)), 'offline preparation must not retain the previously cached exterior image keys');
});

test('project video uses the supplied source directly and repeats by default', () => {
  assert.equal(latestMedia.mainVideo, 'videos/20261119/livigno-general.mp4');
  assert.equal(latestMedia.mainPoster, 'videos/20261119/livigno-general-poster.webp');
  assert.equal(keyOf(projectVideo.src), latestMedia.mainVideo);
  assert.equal(keyOf(projectVideo.poster), latestMedia.mainPoster);
  assert.equal(projectVideo.loop, true);
});

test('amenity nine is Petshower and the twelve-photo gallery retains Coworking', () => {
  assert.equal(amenityPhotos.length, 12);
  assert.equal(amenityPhotos[8].title, 'Petshower');
  assert.equal(amenityPhotos[8].path, 'amenities/20261119/10.webp');
  assert.equal(amenityPhotos[6].title, 'Coworking');
  assert.equal(amenityPhotos[6].path, 'amenities/20261119/coworking.webp');
  const amenities = galleries.find(gallery => gallery.id === 'amenities')!;
  assert.equal(amenities.images.length, 12);
  assert.equal(amenities.images[8].title, 'Petshower');
  assert.equal(amenities.images[6].title, 'Coworking');
});
