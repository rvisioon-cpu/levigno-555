import { getAssetUrl } from '@/utils/assets';
import { floorUnitGeometry } from './floor-unit-geometry';
import { unitTourUrls } from './unit-tours';

export type UnitStatus = 'available' | 'reserved' | 'sold' | 'unknown';

export const UnitStatusString: Record<UnitStatus, string> = {
  available: 'Disponible',
  reserved: 'Separado',
  sold: 'Vendido',
  unknown: 'Consultar disponibilidad',
};

export interface Unit {
  identifier?: string;
  id: string;
  floorId: string;
  price?: number;
  dimensions: number;
  bedrooms?: number;
  bathrooms?: number;
  status: UnitStatus;
  type?: 'apartment' | 'storage' | 'parking';
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

// Confirmed areas take precedence over older CMS measurements.
export const confirmedTypologyAreas: Record<string, number> = { T1: 73.52, T7: 54.18 };

// Commercial unit schedule supplied for Levigno. All units are marked available as a temporary initial sales status.
const unitTypes = [
  { ids: ['201'], dimensions: confirmedTypologyAreas.T1, bedrooms: 3, bathrooms: 2, subtitle: 'Flat', assetId: 'T1', hasFurnishedView: true, hasGallery: true },
  { ids: ['202', '302', '402', '502', '602', '702', '802', '902', '1002'], dimensions: 61.8, bedrooms: 2, bathrooms: 2, subtitle: 'Flat', assetId: 'T2', hasFurnishedView: true, hasGallery: true },
  { ids: ['203'], dimensions: 40.52, bedrooms: 1, bathrooms: 1, subtitle: 'Flat', assetId: 'T3', hasFurnishedView: true, hasGallery: true },
  { ids: ['301', '401', '501', '601', '701', '801', '901', '1001', '1101', '1201', '1301'], dimensions: confirmedTypologyAreas.T1, bedrooms: 3, bathrooms: 2, subtitle: 'Flat', assetId: 'T1', hasFurnishedView: true, hasGallery: true },
  { ids: ['303', '403', '503', '603', '703', '803', '903', '1003', '1103'], dimensions: 40.52, bedrooms: 1, bathrooms: 1, subtitle: 'Flat', assetId: 'T5', hasFurnishedView: true, hasGallery: true },
  { ids: ['1102'], dimensions: 61.8, bedrooms: 2, bathrooms: 2, subtitle: 'Flat', assetId: 'T6', hasFurnishedView: true, hasGallery: true },
  { ids: ['1202'], dimensions: confirmedTypologyAreas.T7, bedrooms: 3, bathrooms: 2, subtitle: 'Flat', assetId: 'T7', hasFurnishedView: true, hasGallery: true },
  { ids: ['1203', '1303'], dimensions: 40, bedrooms: 1, bathrooms: 1, subtitle: 'Flat', assetId: 'T8', hasFurnishedView: true, hasGallery: true },
  { ids: ['1302'], dimensions: 53.34, bedrooms: 2, bathrooms: 2, subtitle: 'Flat', assetId: 'T9', hasFurnishedView: true, hasGallery: true },
  { ids: ['1401', '1501'], dimensions: 72.22, bedrooms: 2, bathrooms: 2, subtitle: 'Flat', assetId: 'T10', hasFurnishedView: true, hasGallery: true },
  { ids: ['1402'], dimensions: 76.71, bedrooms: 2, bathrooms: 2, subtitle: 'Flat', assetId: 'T11', hasFurnishedView: true, hasGallery: true },
  { ids: ['1502'], dimensions: 76.71, bedrooms: 2, bathrooms: 2, subtitle: 'Flat', assetId: 'T13', hasFurnishedView: true, hasGallery: true },
  { ids: ['1601'], dimensions: 105.31, bedrooms: 2, bathrooms: 2, subtitle: 'Dúplex', assetId: 'T14', hasFurnishedView: true, hasGallery: true },
  // Zero means area not supplied yet; the UI hides it until confirmed.
  { ids: ['1403', '1503'], dimensions: 0, bedrooms: 2, bathrooms: 2, subtitle: 'Flat', assetId: 'T12', hasFurnishedView: true, hasGallery: true },
  { ids: ['1602'], dimensions: 76.71, bedrooms: 2, bathrooms: 2, subtitle: 'Flat', assetId: 'T15', hasFurnishedView: true, hasGallery: true },
  { ids: ['1603'], dimensions: 0, bedrooms: 2, bathrooms: 2, subtitle: 'Flat', assetId: 'T16', hasFurnishedView: true, hasGallery: true },
];

const soldUnitIds = new Set(['1501', '1202', '1002', '801', '703', '401']);

export const apartmentUnits: Unit[] = unitTypes.flatMap((type) => type.ids.map((id) => ({
  id,
  floorId: String(Number(id.slice(0, -2))),
  dimensions: type.dimensions,
  bedrooms: type.bedrooms,
  bathrooms: type.bathrooms,
  status: soldUnitIds.has(id) ? ('sold' as const) : ('available' as const),
  type: 'apartment' as const,
  subtitle: type.subtitle,
  assetId: type.assetId,
  tourUrl: unitTourUrls[id],
  hasFurnishedView: type.hasFurnishedView,
  hasGallery: type.hasGallery,
})));

export const parkingUnits: Unit[] = [
  // Piso 1
  { id: 'E1', floorId: '1', dimensions: 0, status: 'available', type: 'parking', subtitle: 'Estacionamiento' },
  // Sótano 1
  { id: 'E2', floorId: 's1', dimensions: 0, status: 'available', type: 'parking', subtitle: 'Estacionamiento' },
  { id: 'E3', floorId: 's1', dimensions: 0, status: 'available', type: 'parking', subtitle: 'Estacionamiento' },
  { id: 'E4', floorId: 's1', dimensions: 0, status: 'available', type: 'parking', subtitle: 'Estacionamiento' },
  { id: 'E5', floorId: 's1', dimensions: 0, status: 'available', type: 'parking', subtitle: 'Estacionamiento' },
  { id: 'E6', floorId: 's1', dimensions: 0, status: 'available', type: 'parking', subtitle: 'Estacionamiento' },
  { id: 'E7', floorId: 's1', dimensions: 0, status: 'available', type: 'parking', subtitle: 'Estacionamiento' },
  // Sótano 2
  { id: 'E8', floorId: 's2', dimensions: 0, status: 'available', type: 'parking', subtitle: 'Estacionamiento' },
  { id: 'E9', floorId: 's2', dimensions: 0, status: 'available', type: 'parking', subtitle: 'Estacionamiento' },
  { id: 'E10', floorId: 's2', dimensions: 0, status: 'available', type: 'parking', subtitle: 'Estacionamiento' },
  { id: 'E11', floorId: 's2', dimensions: 0, status: 'available', type: 'parking', subtitle: 'Estacionamiento' },
  { id: 'E12', floorId: 's2', dimensions: 0, status: 'available', type: 'parking', subtitle: 'Estacionamiento' },
  { id: 'E13', floorId: 's2', dimensions: 0, status: 'available', type: 'parking', subtitle: 'Estacionamiento' },
  // Sótano 3
  { id: 'E14', floorId: 's3', dimensions: 0, status: 'available', type: 'parking', subtitle: 'Estacionamiento' },
  { id: 'E15', floorId: 's3', dimensions: 0, status: 'available', type: 'parking', subtitle: 'Estacionamiento' },
  { id: 'E16', floorId: 's3', dimensions: 0, status: 'available', type: 'parking', subtitle: 'Estacionamiento' },
  { id: 'E17', floorId: 's3', dimensions: 0, status: 'available', type: 'parking', subtitle: 'Estacionamiento' },
  { id: 'E18', floorId: 's3', dimensions: 0, status: 'available', type: 'parking', subtitle: 'Estacionamiento' },
];

const allBuildingUnits: Unit[] = [...apartmentUnits, ...parkingUnits];

// Floor plans supplied for this project include all 17 levels and 3 basements.
// Keep empty floors in the list so every plan is reachable even when no unit
// inventory is published for that level yet.
const floorDefinitions = [
  ...Array.from({ length: 17 }, (_, index) => ({
    id: String(index + 1),
    name: String(index + 1),
    asset: `floor_${index + 1}.jpg`,
  })),
  ...[1, 2, 3].map((level) => ({
    id: `s${level}`,
    name: `Sótano ${level}`,
    asset: `floor_s${level}.jpg`,
  })),
];

export const floorsData: Floor[] = floorDefinitions.map(({ id, name, asset }) => {
  // The duplex is one apartment with selectable areas on both of its floors.
  const floorUnits = allBuildingUnits.filter((unit) => unit.floorId === id || (id === '17' && unit.id === '1601'));
  return {
    id,
    name,
    floorPlanImage: getAssetUrl(`plants/${asset}`),
    units: floorUnits.map((unit) => ({ ...unit, ...floorUnitGeometry(id, unit.id) })),
  };
});
