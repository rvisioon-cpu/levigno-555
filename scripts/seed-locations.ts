import { locationsData } from '../src/data/locations';
const q = (value: string | undefined) => value == null ? 'NULL' : `'${value.replace(/'/g, "''")}'`;
for (const f of locationsData.features) {
  const [longitude, latitude] = f.geometry.coordinates;
  console.log(`INSERT OR IGNORE INTO locations_poi (id,name,category,image_path,longitude,latitude,is_active) VALUES (${q(f.id)},${q(f.properties.nombre)},${q(f.properties.categoria || 'Otros')},${q(f.properties.imagen)},${longitude},${latitude},1);`);
}
