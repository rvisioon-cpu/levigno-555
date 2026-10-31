import { locationsData } from '../src/data/locations';
import { normalizeCategory } from '../src/utils/categories';
const q = (value: string | undefined) => value == null ? 'NULL' : `'${value.replace(/'/g, "''")}'`;
for (const f of locationsData.features) {
  const [longitude, latitude] = f.geometry.coordinates;
  const category = normalizeCategory(f.properties.categoria || 'Otros');
  console.log(`INSERT OR IGNORE INTO locations_poi (id,name,category,image_path,longitude,latitude,is_active) VALUES (${q(f.id)},${q(f.properties.nombre)},${q(category)},${q(f.properties.imagen)},${longitude},${latitude},1);`);
}
