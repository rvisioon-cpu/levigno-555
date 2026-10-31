import livignoLocations from './livigno_locations.json';
import { normalizeCategory } from '@/utils/categories';

export interface LocationFeature {
  type: 'Feature';
  properties: {
    nombre: string;
    categoria?: string;
    imagen?: string;
    [key: string]: unknown;
  };
  geometry: { coordinates: [number, number]; type: 'Point' };
  id: string;
}

export interface LocationCollection {
  features: LocationFeature[];
}

export const locationsData: LocationCollection = {
  features: livignoLocations.features.map((feature) => ({
    ...feature,
    properties: {
      nombre: feature.properties.name,
      categoria: normalizeCategory(feature.properties.type),
      imagen: 'image_path' in feature.properties ? feature.properties.image_path : undefined,
    },
  })) as LocationFeature[],
};
