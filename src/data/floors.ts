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
  { ids: ['201'], dimensions: 71.23, bedrooms: 3, bathrooms: 2, subtitle: 'Flat' },
  { ids: ['202', '302', '402', '502', '602', '702', '802', '902', '1002'], dimensions: 61.8, bedrooms: 2, bathrooms: 2, subtitle: 'Flat' },
  { ids: ['203'], dimensions: 40.52, bedrooms: 1, bathrooms: 1, subtitle: 'Flat' },
  { ids: ['301', '401', '501', '601', '701', '801', '901', '1001', '1101', '1201', '1301', '1401', '1501'], dimensions: 72.22, bedrooms: 3, bathrooms: 2, subtitle: 'Flat' },
  { ids: ['303', '403', '503', '603', '703', '803', '903', '1003', '1103'], dimensions: 40.52, bedrooms: 1, bathrooms: 1, subtitle: 'Flat' },
  { ids: ['1102'], dimensions: 61.8, bedrooms: 2, bathrooms: 2, subtitle: 'Flat' },
  { ids: ['1202'], dimensions: 56.69, bedrooms: 2, bathrooms: 2, subtitle: 'Flat' },
  { ids: ['1203', '1303'], dimensions: 40, bedrooms: 1, bathrooms: 1, subtitle: 'Flat' },
  { ids: ['1302'], dimensions: 53.34, bedrooms: 2, bathrooms: 1, subtitle: 'Flat' },
  { ids: ['1402'], dimensions: 76.71, bedrooms: 2, bathrooms: 2, subtitle: 'Flat' },
  { ids: ['1502', '1602'], dimensions: 76.71, bedrooms: 2, bathrooms: 2, subtitle: 'Flat' },
  { ids: ['1601'], dimensions: 105.31, bedrooms: 4, bathrooms: 2.5, subtitle: 'Dúplex' },
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
})));

export const floorsData: Floor[] = Array.from(new Set(units.map((unit) => unit.floorId)))
  .sort((a, b) => Number(a) - Number(b))
  .map((id) => ({
    id,
    name: id,
    floorPlanImage: `/plants/floor_${id}.png`,
    units: units.filter((unit) => unit.floorId === id),
  }));
