import { getAssetUrl } from '@/utils/assets';
import { floorUnitGeometry } from './floor-unit-geometry';

export type UnitStatus = 'available' | 'reserved' | 'sold' | 'unknown';

export const UnitStatusString: Record<UnitStatus, string> = {
  available: 'Disponible',
  reserved: 'Separado',
  sold: 'Vendido',
  unknown: 'Consultar disponibilidad',
};

export interface Unit {
  id: string;
  floorId: string;
  price?: number;
  dimensions: number;
  bedrooms?: number;
  bathrooms?: number;
  status: UnitStatus;
  type?: 'apartment' | 'storage';
  subtitle?: string;
  description?: string;
  images?: string[];
  tourUrl?: string;
  assetId?: string;
  hasFurnishedView?: boolean;
  hasGallery?: boolean;
  x?: number;
  y?: number;
  path?: string;
}

export interface Floor {
  id: string;
  name: string;
  floorPlanImage: string;
  units: Unit[];
}

// Commercial unit schedule supplied for Levigno. All units are marked available as a temporary initial sales status.
const unitTypes = [
  { ids: ['201'], dimensions: 71.23, bedrooms: 3, bathrooms: 2, subtitle: 'Flat', assetId: 'T1', hasFurnishedView: true, hasGallery: true },
  { ids: ['202', '302', '402', '502', '602', '702', '802', '902', '1002'], dimensions: 61.8, bedrooms: 2, bathrooms: 2, subtitle: 'Flat', assetId: 'T2', hasFurnishedView: true, hasGallery: true },
  { ids: ['203'], dimensions: 40.52, bedrooms: 1, bathrooms: 1, subtitle: 'Flat', assetId: 'T3', hasFurnishedView: true, hasGallery: true },
  { ids: ['301', '401', '501', '601', '701', '801', '901', '1001', '1101', '1201', '1301', '1401', '1501'], dimensions: 72.22, bedrooms: 3, bathrooms: 2, subtitle: 'Flat', assetId: 'T4' },
  { ids: ['303', '403', '503', '603', '703', '803', '903', '1003', '1103'], dimensions: 40.52, bedrooms: 1, bathrooms: 1, subtitle: 'Flat', assetId: 'T5' },
  { ids: ['1102'], dimensions: 61.8, bedrooms: 2, bathrooms: 2, subtitle: 'Flat', assetId: 'T6' },
  { ids: ['1202'], dimensions: 56.69, bedrooms: 2, bathrooms: 2, subtitle: 'Flat', assetId: 'T7' },
  { ids: ['1203', '1303'], dimensions: 40, bedrooms: 1, bathrooms: 1, subtitle: 'Flat', assetId: 'T8' },
  { ids: ['1302'], dimensions: 53.34, bedrooms: 2, bathrooms: 1, subtitle: 'Flat', assetId: 'T9' },
  { ids: ['1402'], dimensions: 76.71, bedrooms: 2, bathrooms: 2, subtitle: 'Flat', assetId: 'T10' },
  { ids: ['1502', '1602'], dimensions: 76.71, bedrooms: 2, bathrooms: 2, subtitle: 'Flat', assetId: 'T11' },
  { ids: ['1601'], dimensions: 105.31, bedrooms: 4, bathrooms: 2.5, subtitle: 'Dúplex', assetId: 'T12' },
];

const units: Unit[] = unitTypes.flatMap((type) => type.ids.map((id) => ({
  id,
  floorId: String(Number(id.slice(0, -2))),
  dimensions: type.dimensions,
  bedrooms: type.bedrooms,
  bathrooms: type.bathrooms,
  status: 'available' as const,
  type: 'apartment' as const,
  subtitle: type.subtitle,
  assetId: type.assetId,
  hasFurnishedView: type.hasFurnishedView,
  hasGallery: type.hasGallery,
})));

// Floor plans supplied for this project include all 17 levels and 3 basements.
// Keep empty floors in the list so every plan is reachable even when no unit
// inventory is published for that level yet.
const floorDefinitions = [
  ...Array.from({ length: 17 }, (_, index) => ({
    id: String(index + 1),
    name: String(index + 1),
    asset: `floor_${index + 1}.png`,
  })),
  ...[1, 2, 3].map((level) => ({
    id: `s${level}`,
    name: `Sótano ${level}`,
    asset: `floor_s${level}.png`,
  })),
];

export const floorsData: Floor[] = floorDefinitions.map(({ id, name, asset }) => {
  // The duplex is one apartment with selectable areas on both of its floors.
  const floorUnits = units.filter((unit) => unit.floorId === id || (id === '17' && unit.id === '1601'));
  return {
    id,
    name,
    floorPlanImage: getAssetUrl(`plants/${asset}`),
    units: floorUnits.map((unit) => ({ ...unit, ...floorUnitGeometry(id, unit.id) })),
  };
});
