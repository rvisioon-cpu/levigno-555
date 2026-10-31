import { floorsData } from './floors';
import { getAssetUrl } from '@/utils/assets';

export interface Tour {
  id: string;
  title: string;
  subtitle: string;
  thumbnail: string;
  type: 'unit' | 'building';
  target: string;
  floorName?: string;
}

// Example Building Tour Target
const buildingTarget= 'https://kuula.co/share/collection/7HQY1?logo=1&card=1&info=0&logosize=175&fs=1&vr=1&zoom=1&initload=0&thumbs=3&alpha=0.91&inst=es';

const buildingTours: Tour[] = [
  {
    id: 'building-main',
    title: 'Edificio Principal',
    subtitle: 'Showroom Virtual',
    thumbnail: getAssetUrl('building/photos/face_0_daylight.png'),
    type: 'building',
    target: buildingTarget
  }
];

const unitTours: Tour[] = floorsData.flatMap((floor) =>
  floor.units.flatMap((unit) => {
    if (!unit.tourUrl) return [];

    return [{
      id: `unit-${unit.id}`,
      title: `Unidad ${unit.id}`,
      subtitle: `${unit.subtitle || 'Departamento'} · Recorrido 360°`,
      thumbnail: getAssetUrl(`plants/details/${unit.assetId}/furnished.jpg`),
      type: 'unit' as const,
      target: unit.tourUrl,
      floorName: floor.name,
    }];
  })
);

export const tours: Tour[] = [...buildingTours, ...unitTours];

export const getTours = () => tours;
