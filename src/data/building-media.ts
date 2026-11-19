const exteriorRoot = 'building/exterior/20261119';
const image = (stem: string) => `${exteriorRoot}/${stem}.webp`;
const video = (stem: string) => `${exteriorRoot}/${stem}.mp4`;

export const buildingEntrance = {
  opening: [video('0.1-0.2'), video('0.2-1.1')],
  openingPoster: image('0.1'),
  aerialLoop: video('0.2.loop'),
  aerialPoster: image('0.2'),
};

export function exteriorFaceMedia(id: 1 | 2 | 3, time: 1 | 2) {
  const angle = `${id}.${time}`;
  return {
    background: image(angle),
    introVideo: video(`${angle}-up`),
    toLeft: video(`${angle}-${id === 1 ? 2 : 1}.${time}`),
    toRight: video(`${angle}-${id === 1 ? 3 : 1}.${time}`),
    changeLight: video(`${angle}-${id}.${time === 1 ? 2 : 1}`),
  };
}

export const buildingExteriorAssetKeys = [...new Set([
  ...buildingEntrance.opening,
  buildingEntrance.openingPoster,
  buildingEntrance.aerialLoop,
  buildingEntrance.aerialPoster,
  ...([1, 2, 3] as const).flatMap(id =>
    ([1, 2] as const).flatMap(time => Object.values(exteriorFaceMedia(id, time)))
  ),
])];
