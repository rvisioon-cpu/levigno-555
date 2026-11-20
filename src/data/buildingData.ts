import { getAssetUrl } from '@/utils/assets';
import { buildingAerialLoopPath, buildingMediaPrefix, buildingPhotosPrefix } from './latest-media';

const exterior = (file: string) => getAssetUrl(`${buildingMediaPrefix}${file}.mp4`);
const exteriorImage = (view: string) => getAssetUrl(`${buildingPhotosPrefix}${view}.webp`);

interface AssetSet {
  background: string;
  backgroundVideo: string;
  highlight?: string;
  introVideo: string;
  transitions: { toLeft: string; toRight: string };
}

export interface BuildingFace {
  id: number;
  name: string;
  dayToNightTransition: string;
  nightToDayTransition: string;
  day: AssetSet;
  night: AssetSet;
}

export const buildingOpening = [exterior('0.1-0.2'), exterior('0.2-1.1')];
export const buildingAerialLoop = getAssetUrl(buildingAerialLoopPath);
export const buildingAerialPoster = exteriorImage('0.2');

function face(id: 1 | 2 | 3, name: string): BuildingFace {
  const assets = (time: 1 | 2): AssetSet => ({
    background: exteriorImage(`${id}.${time}`),
    backgroundVideo: '',
    introVideo: exterior(`${id}.${time}-up`),
    transitions: {
      toLeft: exterior(id === 1 ? `1.${time}-2.${time}` : `${id}.${time}-1.${time}`),
      toRight: exterior(id === 1 ? `1.${time}-3.${time}` : `${id}.${time}-1.${time}`),
    },
  });
  return {
    id, name,
    dayToNightTransition: exterior(`${id}.1-${id}.2`),
    nightToDayTransition: exterior(`${id}.2-${id}.1`),
    day: assets(1), night: assets(2),
  };
}

// Array indices are internal; IDs match the names supplied with the animations.
export const buildingFaces = [face(1, 'Cara Central'), face(2, 'Cara Izquierda'), face(3, 'Cara Derecha')];
