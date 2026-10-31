const exterior = (file: string) => `/building/exterior/${file}.mp4`;

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

export const buildingOpening = [exterior('0.1-0'), exterior('0.2-1.1')];
export const buildingAerialLoop = exterior('0.2.loop');

function face(id: 1 | 2 | 3, name: string): BuildingFace {
  const assets = (time: 1 | 2): AssetSet => ({
    background: `/building/exterior/${id}.${time}.jpg`,
    backgroundVideo: exterior(`${id}.${time}.loop`),
    introVideo: exterior(`${id}.${time}-up`),
    transitions: {
      toLeft: exterior(id === 1 ? `1.${time}-2.${time}` : `${id}.${time}-1.${time}`),
      toRight: exterior(id === 1 ? (time === 1 ? '1.1-3' : '1.2-3.2') : `${id}.${time}-1.${time}`),
    },
  });
  return {
    id, name,
    dayToNightTransition: exterior(id === 1 ? '1.1-1' : `${id}.1-${id}.2`),
    nightToDayTransition: exterior(`${id}.2-${id}.1`),
    day: assets(1), night: assets(2),
  };
}

// Array indices are internal; IDs match the names supplied with the animations.
export const buildingFaces = [face(1, 'Cara Central'), face(2, 'Cara Izquierda'), face(3, 'Cara Derecha')];
