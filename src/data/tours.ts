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
const buildingTarget = 'https://kuula.co/share/collection/7dqJv?logo=-1&card=1&info=0&fs=1&vr=1&zoom=1&gyro=0&initload=0&thumbs=3&inst=es';

const buildingTours: Tour[] = [
  {
    id: 'building-main',
    title: 'Edificio Principal',
    subtitle: 'Showroom Virtual',
    thumbnail: getAssetUrl('amenities/2.webp'),
    type: 'building',
    target: buildingTarget
  }
];

const seenUnits = new Set<string>();
const unitTours: Tour[] = floorsData.flatMap((floor) =>
  floor.units.flatMap((unit) => {
    if (!unit.tourUrl || seenUnits.has(unit.id)) return [];
    seenUnits.add(unit.id);

    return [{
      id: `unit-${unit.id}`,
      title: `Unidad ${unit.id}`,
      subtitle: `${unit.subtitle || 'Departamento'} · Recorrido 360°`,
      thumbnail: getAssetUrl(`plants/details/${unit.assetId}/gallery/1.jpg`),
      type: 'unit' as const,
      target: unit.tourUrl,
      floorName: floor.name,
    }];
  })
);

export const tours: Tour[] = [...buildingTours, ...unitTours];

export const getTours = () => tours;
