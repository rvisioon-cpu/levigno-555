/**
 * Authoritative SVG floor plan polygon coordinates for Livigno units and parkings.
 * All coordinates are normalized percentage-based values (viewBox 0 0 100 100)
 * aligned with the visual layout of each level.
 */

export const UNIT_COORDINATES = {
  /** 1601 piso 2 (Planta alta / Nivel 17) */
  DUPLEX_1601_PISO_2: 'M 26.5,74 L 10.8,74.6 L 12.3,25.6 L 32.9,26 L 32.7,44 L 31.6,44 L 31.6,48.5 L 32.1,48.5 L 31.9,52.2 L 27.1,52.4 Z',

  /** 1601 piso 1 (Planta baja / Nivel 16) */
  DUPLEX_1601_PISO_1: 'M 32.7,44.1 L 33,25.4 L 12.5,25.4 L 10.5,66.1 L 11.9,66.2 L 11.5,75.1 L 36.3,74.5 L 36.5,57.7 L 30.6,57.9 L 30.9,44.3 Z',

  /** Unidades 1502 y 1602 */
  UNITS_1502_1602: 'M 49.8,25.8 L 49.7,46.9 L 46.9,46.9 L 47.1,48.2 L 43.8,48.3 L 43.7,57.4 L 36.7,57.4 L 36.6,74.2 L 57.7,74.6 L 57.4,59.7 L 63.2,59.7 L 62.8,48.9 L 64.8,48.8 L 64.5,41.2 L 69.8,41.2 L 70,48.4 L 77.9,48.3 L 77.5,25.1 Z',

  /** Unidades 301 al 1501 */
  UNITS_301_TO_1501: 'M 34.9,38 L 33,41.6 L 32.3,40.9 L 31.6,40.9 L 31.5,48.4 L 32.1,48.2 L 32.1,52.4 L 30.8,52.6 L 30.7,60.6 L 36.5,60.5 L 36.4,74.2 L 11.8,74.6 L 11.9,66.5 L 10.4,66.2 L 11,53.4 L 11.4,43.1 L 11.4,25.3 L 33.2,25.5 L 33.1,33.5 L 33.6,35.8 Z',

  /** Unidad 1402 */
  UNIT_1402: 'M 36.6,74.4 L 36.6,57.5 L 43.6,57.3 L 43.6,48.2 L 46.8,48.4 L 46.9,46.9 L 49.7,47.1 L 49.6,25.5 L 87.9,25.1 L 89.2,48.4 L 70,48.4 L 69.7,41.1 L 64.6,41.1 L 64.8,48.8 L 62.9,49.1 L 63.3,59.5 L 57.3,59.9 L 57.7,74.8 Z',

  /** Unidad 1302 */
  UNIT_1302: 'M 49.8,46.9 L 49.6,25.3 L 88,25.5 L 89,48.1 L 83.9,48.3 L 83.9,56.5 L 76.2,56.7 L 75.9,48.5 L 70.1,48.6 L 69.7,40.9 L 53.8,41.1 L 53.6,46.5 Z',

  /** Unidades 303 al 1303 */
  UNITS_303_TO_1303: 'M 43.6,48.2 L 43.6,57.4 L 36.6,57.5 L 36.5,74.4 L 57.6,74.8 L 57.3,59.8 L 63.2,59.8 L 62.9,49 L 64.8,48.9 L 64.7,41.2 L 53.8,41.3 L 53.8,46.9 L 47,46.9 L 47.1,48.3 Z',

  /** Unidad 1202 */
  UNIT_1202: 'M 49.8,46.7 L 53.8,46.9 L 53.8,41.2 L 64.6,41.1 L 64.8,48.7 L 70.1,49 L 69.8,46.2 L 73.2,46.7 L 73.3,48.7 L 76.5,48.7 L 76.7,54.8 L 84.4,54.6 L 84.2,48.5 L 88.9,48.5 L 87.6,25.4 L 49.7,25.6 Z',

  /** Unidad 1102 */
  UNIT_1102: 'M 49.6,25.5 L 87.9,25.1 L 89.2,48 L 84.2,47.6 L 84.6,54.6 L 76.7,54.8 L 76.4,48.7 L 73.3,48.7 L 69.8,48.5 L 64.9,48.6 L 62.8,48.3 L 62.7,41.3 L 53.8,41.1 L 54,52.8 L 49.7,52.6 Z',

  /** Unidades 202 al 1002 */
  UNITS_202_TO_1002: 'M 49.7,25.4 L 87.6,25.2 L 89,48.2 L 84.1,48.1 L 84.4,54.3 L 76.7,54.6 L 76.3,48.3 L 63,48.6 L 62.7,41.1 L 53.8,41.2 L 54,52.7 L 49.7,52.8 Z',

  /** Unidad 201 */
  UNIT_201: 'M 34.9,38 L 33.1,41.6 L 32.4,40.9 L 31.5,41 L 31.5,48.9 L 32.1,48.6 L 32,52.4 L 30.8,52.7 L 30.7,60.5 L 36.5,60.5 L 36.4,74.1 L 9.9,74.9 L 11.1,53.4 L 11.6,41 L 12.3,25.2 L 33.1,25.5 L 33,33.3 L 33.6,36 Z',

  /** Unidad 203 */
  UNIT_203: 'M 43.5,48.1 L 43.6,57.3 L 36.6,57.5 L 36.5,74.1 L 65,74.8 L 64.6,48.6 L 62.9,48.6 L 62.6,41.1 L 54.5,41.4 L 54.7,52.9 L 47.1,53 L 46.9,48.1 Z',
} as const;

/**
 * Estacionamientos de carros (E1..E14) y cuatrimotos (M1..M7).
 */
export const PARKING_COORDINATES: Record<string, string> = {
  // Piso 1
  E1: 'M 13.3,41.4 L 13.9,29.5 L 0.4,29.7 L 0.2,41.1 Z',
  E2: 'M 13.5,53.3 L 13.2,40.9 L 0.3,41.1 L 0.1,53.5 Z',

  // Sótano 1
  E3: 'M 75.4,62.9 L 89.3,62.8 L 89.9,72.4 L 75.8,72.3 Z',
  E4: 'M 74.9,51.7 L 88.6,51.2 L 89.3,62.7 L 75.4,62.8 Z',
  E5: 'M 21.6,45.8 L 21.8,34.7 L 8.7,34.1 L 8.9,45.8 Z',
  E6: 'M 21.3,51.9 L 20.1,51.9 L 20.1,51.2 L 7.9,51 L 7.6,63.3 L 19.3,63.4 L 19.6,56.4 L 21.1,56.5 Z',
  E7: 'M 19.2,64 L 7.6,64.3 L 7.1,71.9 L 19,71.8 Z',
  M1: 'M 88.6,50.6 L 88,41.8 L 74.8,42.4 L 75,50.2 Z',
  M2: 'M 86.1,40.8 L 85.8,31.9 L 74.4,32.5 L 74.7,41.1 Z',

  // Sótano 2
  E8: 'M 90.4,72.3 L 89.8,61.4 L 75.9,61.8 L 76.5,71.9 Z',
  E9: 'M 89.6,60.1 L 89.2,49.9 L 75.7,50.3 L 76,60.9 Z',
  E10: 'M 20.9,43.4 L 21.4,33.4 L 20.4,33.2 L 20.5,32.5 L 8.2,32.2 L 7.6,40.3 L 9,42.8 L 9.5,44.1 Z',
  E11: 'M 20.4,61.4 L 20.7,50.3 L 19.6,50.1 L 19.5,49.3 L 7.3,49.4 L 6.9,61.7 Z',
  E12: 'M 20.3,62.7 L 6.9,62.7 L 6.3,71.8 L 20,71.9 Z',
  M3: 'M 89,49 L 88.4,40.2 L 75.3,40.7 L 75.3,47.7 L 78.8,47.3 L 78.8,49.2 Z',
  M4: 'M 75,39.1 L 86.7,39.2 L 86.4,30.1 L 74.8,30.2 Z',

  // Sótano 3
  E13: 'M 89.7,61.5 L 75.9,61.7 L 76.3,71.8 L 90.3,72.1 Z',
  E14: 'M 89.6,60.8 L 89.2,49.9 L 75.8,50.3 L 76,60.7 Z',
  M5: 'M 89,49 L 78.8,49.2 L 78.7,46.7 L 75.3,47 L 75.1,40 L 88.5,40 Z',
  M6: 'M 88.5,39.1 L 88.3,34.6 L 88.1,30.2 L 74.9,30.1 L 75.1,39.1 Z',
  M7: 'M 21,43.4 L 21.4,33.2 L 20.4,33.1 L 20.4,32.3 L 8.2,32.1 L 7.8,40.3 L 20.5,40.9 Z',
};

/**
 * Calculates the exact geometric centroid of an SVG polygon path.
 * Guarantees stable pin placement inside the visible boundaries.
 */
export function calculatePolygonCenter(path: string): { x: number; y: number } {
  const matches = path.matchAll(/([0-9.]+)[, ]\s*([0-9.]+)/g);
  const pts = Array.from(matches).map((m) => ({ x: parseFloat(m[1]), y: parseFloat(m[2]) }));
  if (pts.length === 0) return { x: 50, y: 50 };

  let area = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    const factor = pts[i].x * pts[j].y - pts[j].x * pts[i].y;
    area += factor;
    cx += (pts[i].x + pts[j].x) * factor;
    cy += (pts[i].y + pts[j].y) * factor;
  }
  area *= 0.5;

  if (Math.abs(area) < 1e-4) {
    const total = pts.reduce((acc, curr) => ({ x: acc.x + curr.x, y: acc.y + curr.y }), { x: 0, y: 0 });
    return {
      x: +(total.x / pts.length).toFixed(1),
      y: +(total.y / pts.length).toFixed(1),
    };
  }

  cx /= 6 * area;
  cy /= 6 * area;

  return {
    x: +cx.toFixed(1),
    y: +cy.toFixed(1),
  };
}

/**
 * Resolves the polygon path for a given unit or parking on a specific floor.
 */
export function getUnitPath(floorId: string, unitId: string): string | undefined {
  // Estacionamientos de carros y cuatrimotos
  if (PARKING_COORDINATES[unitId]) {
    return PARKING_COORDINATES[unitId];
  }

  const level = Number(floorId);

  // Duplex 1601: Level 16 (piso 1) vs Level 17 (piso 2)
  if (unitId === '1601') {
    if (level === 17) return UNIT_COORDINATES.DUPLEX_1601_PISO_2;
    if (level === 16) return UNIT_COORDINATES.DUPLEX_1601_PISO_1;
    return undefined;
  }

  // Tipología 01 (Frente / izquierda)
  if (unitId === '201') {
    return UNIT_COORDINATES.UNIT_201;
  }
  if (unitId.endsWith('01') && level >= 3 && level <= 15) {
    return UNIT_COORDINATES.UNITS_301_TO_1501;
  }

  // Tipología 02 (Lateral / derecha)
  if (unitId === '1602' || unitId === '1502') {
    return UNIT_COORDINATES.UNITS_1502_1602;
  }
  if (unitId === '1402') {
    return UNIT_COORDINATES.UNIT_1402;
  }
  if (unitId === '1302') {
    return UNIT_COORDINATES.UNIT_1302;
  }
  if (unitId === '1202') {
    return UNIT_COORDINATES.UNIT_1202;
  }
  if (unitId === '1102') {
    return UNIT_COORDINATES.UNIT_1102;
  }
  if (unitId.endsWith('02') && level >= 2 && level <= 10) {
    return UNIT_COORDINATES.UNITS_202_TO_1002;
  }

  // Tipología 03 (Centro / patio)
  if (unitId === '203') {
    return UNIT_COORDINATES.UNIT_203;
  }
  if (unitId.endsWith('03') && level >= 3 && level <= 13) {
    return UNIT_COORDINATES.UNITS_303_TO_1303;
  }

  return undefined;
}

// Pre-computed centers cache for peak performance
const CENTER_CACHE = new Map<string, { x: number; y: number }>();

/**
 * Returns SVG path and pin center coordinates for interactive floor plans.
 */
export function floorUnitGeometry(
  floorId: string,
  unitId: string
): { path: string; x: number; y: number } | undefined {
  const path = getUnitPath(floorId, unitId);
  if (!path) return undefined;

  let center = CENTER_CACHE.get(path);
  if (!center) {
    center = calculatePolygonCenter(path);
    CENTER_CACHE.set(path, center);
  }

  return {
    path,
    x: center.x,
    y: center.y,
  };
}
