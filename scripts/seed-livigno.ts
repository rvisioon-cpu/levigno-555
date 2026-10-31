import { floorsData } from '../src/data/floors';

const sql = (value: string | number | null | undefined) => value == null ? 'NULL' : typeof value === 'number' ? String(value) : `'${value.replace(/'/g, "''")}'`;
const seen = new Set<string>();
for (const floor of floorsData) {
  const level = floor.id.startsWith('s') ? -Number(floor.id.slice(1)) : Number(floor.id);
  const type = floor.id.startsWith('s') ? 'Sótano' : 'Piso';
  console.log(`INSERT OR IGNORE INTO floors (id,name,level,type,image_path) VALUES (${sql(`floor_${floor.id}`)},${sql(floor.name)},${level},${sql(type)},${sql(floor.floorPlanImage)});`);
}
for (const floor of floorsData) for (const unit of floor.units) {
  if (seen.has(unit.id) || unit.floorId !== floor.id) continue;
  seen.add(unit.id);
  const state = unit.status === 'sold' ? 'SOLD' : unit.status === 'reserved' ? 'RESERVED' : 'AVAILABLE';
  const coordinates = JSON.stringify({ x: unit.x, y: unit.y, path: unit.path });
  console.log(`INSERT OR IGNORE INTO units (id,floor_id,identifier,type,bedrooms,bathrooms,area_sqm,coordinates,state,tour_url) VALUES (${sql(unit.id)},${sql(`floor_${floor.id}`)},${sql(unit.id)},${sql(unit.type === 'storage' ? 'STORAGE' : 'APARTMENT')},${sql(unit.bedrooms)},${sql(unit.bathrooms)},${sql(unit.dimensions)},${sql(coordinates)},${sql(state)},${sql(unit.tourUrl)});`);
}
