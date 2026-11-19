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
  areaBreakdown?: string;
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

// Área ocupada por departamento según el cuadro de noviembre de 2026.
export const occupiedUnitAreas: Readonly<Record<string, number | undefined>> = {
  '201': 73.54,
  '202': 60.61,
  '203': 44.98,
  '301': 73.54,
  '302': 60.61,
  '303': 40.51,
  '401': 73.54,
  '402': 60.61,
  '403': 40.51,
  '501': 72.83,
  '502': 60.61,
  '503': 40.51,
  '601': 72.83,
  '602': 60.61,
  '603': 40.51,
  '701': 72.07,
  '702': 59.97,
  '703': 40.13,
  '801': 72.07,
  '802': 59.97,
  '803': 40.13,
  '901': 72.07,
  '902': 59.97,
  '903': 40.13,
  '1001': 72.07,
  '1002': 59.97,
  '1003': 40.13,
  '1101': 72.07,
  '1102': 59.96,
  '1103': 40.13,
  '1201': 72.07,
  '1202': 57.30,
  '1203': 41.92,
  '1301': 72.07,
  '1302': 54.82,
  '1303': 39.42,
  '1401': 50.52,
  '1402': 67.74,
  '1403': 44.29,
  '1501': 50.52,
  '1502': 63.24,
  '1503': 44.29,
  '1602': 44.16,
  // Metrajes vigentes mientras se confirma la identificación de la azotea.
  '1601': 101.38,
  '1603': 40.22,
};

// Commercial unit schedule supplied for Levigno. All units are marked available as a temporary initial sales status.
const unitTypes = [
  { ids: ['201'], bedrooms: 3, bathrooms: 2, subtitle: 'Flat', assetId: 'T1', hasFurnishedView: true, hasGallery: true },
  { ids: ['202', '302', '402', '502', '602', '702', '802', '902', '1002'], bedrooms: 2, bathrooms: 2, subtitle: 'Flat', assetId: 'T2', hasFurnishedView: true, hasGallery: true },
  { ids: ['203'], bedrooms: 1, bathrooms: 1, subtitle: 'Flat', assetId: 'T3', hasFurnishedView: true, hasGallery: true },
  { ids: ['301', '401', '501', '601', '701', '801', '901', '1001', '1101', '1201', '1301'], bedrooms: 3, bathrooms: 2, subtitle: 'Flat', assetId: 'T1', hasFurnishedView: true, hasGallery: true },
  { ids: ['303', '403', '503', '603', '703', '803', '903', '1003', '1103'], bedrooms: 1, bathrooms: 1, subtitle: 'Flat', assetId: 'T5', hasFurnishedView: true, hasGallery: true },
  { ids: ['1102'], bedrooms: 2, bathrooms: 2, subtitle: 'Flat', assetId: 'T6', hasFurnishedView: true, hasGallery: true },
  { ids: ['1202'], bedrooms: 3, bathrooms: 2, subtitle: 'Flat', assetId: 'T7', hasFurnishedView: true, hasGallery: true },
  { ids: ['1203'], bedrooms: 1, bathrooms: 1, subtitle: 'Flat', assetId: 'T8', hasFurnishedView: true, hasGallery: true },
  { ids: ['1303'], bedrooms: 1, bathrooms: 1, subtitle: 'Flat', assetId: 'T17', hasFurnishedView: true, hasGallery: true },
  { ids: ['1302'], bedrooms: 2, bathrooms: 1, subtitle: 'Flat', assetId: 'T9', hasFurnishedView: true, hasGallery: true },
  { ids: ['1401', '1501'], bedrooms: 2, bathrooms: 2, subtitle: 'Flat', assetId: 'T10', hasFurnishedView: true, hasGallery: true },
  { ids: ['1402'], bedrooms: 2, bathrooms: 2, subtitle: 'Flat', assetId: 'T11', hasFurnishedView: true, hasGallery: true },
  { ids: ['1502'], bedrooms: 2, bathrooms: 2, subtitle: 'Flat', assetId: 'T13', hasFurnishedView: true, hasGallery: true },
  { ids: ['1601'], bedrooms: 4, bathrooms: 2.5, subtitle: 'Dúplex', assetId: 'T14', hasFurnishedView: true, hasGallery: true },
  { ids: ['1403', '1503'], bedrooms: 1, bathrooms: 1, subtitle: 'Flat', assetId: 'T12', hasFurnishedView: true, hasGallery: true },
  { ids: ['1602'], bedrooms: 1, bathrooms: 1, subtitle: 'Flat', assetId: 'T15', hasFurnishedView: true, hasGallery: true },
  { ids: ['1603'], bedrooms: 1, bathrooms: 1, subtitle: 'Flat', assetId: 'T16', hasFurnishedView: true, hasGallery: true },
];

const soldUnitIds = new Set(['1501', '1202', '1002', '801', '703', '401']);

export const apartmentUnits: Unit[] = unitTypes.flatMap((type) => type.ids.map((id) => ({
  id,
  floorId: String(Number(id.slice(0, -2))),
  dimensions: occupiedUnitAreas[id] ?? 0,
  areaBreakdown: type.assetId === 'T14' ? '66.20 + 35.18' : undefined,
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
