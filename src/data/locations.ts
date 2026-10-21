import livignoLocations from './livigno_locations.json';

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

// Only the five verified landmarks are listed here; nearby businesses and
// transit stops from the full source GeoJSON are deliberately omitted.
export const locationsData: LocationCollection = {
  features: livignoLocations.features.map((feature) => ({
    ...feature,
    properties: {
      nombre: feature.properties.name,
      categoria: feature.properties.type,
      imagen: `${feature.properties.type === 'educación' ? 'icons/EDUCACION' : feature.properties.type === 'comercio' ? 'icons/COMERCIO' : feature.properties.type === 'lifestyle' ? 'icons/LIFESTYLE' : 'icons/AREAS_VERDES_Y_RECREACION'}/${feature.properties.icon}.png`,
    },
  })) as LocationFeature[],
};
