import { getAssetUrl } from '@/utils/assets';

import { buildingEntrance, exteriorFaceMedia } from './building-media';

interface AssetSet {
  background: string;
  backgroundVideo?: string;
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

export const buildingOpening = buildingEntrance.opening.map(getAssetUrl);
export const buildingOpeningPoster = getAssetUrl(buildingEntrance.openingPoster);
export const buildingAerialLoop = getAssetUrl(buildingEntrance.aerialLoop);
export const buildingAerialPoster = getAssetUrl(buildingEntrance.aerialPoster);

function face(id: 1 | 2 | 3, name: string): BuildingFace {
  const day = exteriorFaceMedia(id, 1);
  const night = exteriorFaceMedia(id, 2);

  function assets(media: typeof day): AssetSet {
    return {
      background: getAssetUrl(media.background),
      introVideo: getAssetUrl(media.introVideo),
      transitions: { toLeft: getAssetUrl(media.toLeft), toRight: getAssetUrl(media.toRight) },
    };
  }

  return {
    id,
    name,
    dayToNightTransition: getAssetUrl(day.changeLight),
    nightToDayTransition: getAssetUrl(night.changeLight),
    day: assets(day),
    night: assets(night),
  };
}

// Array indices are internal; IDs match the names supplied with the animations.
export const buildingFaces = [face(1, 'Cara Central'), face(2, 'Cara Izquierda'), face(3, 'Cara Derecha')];
