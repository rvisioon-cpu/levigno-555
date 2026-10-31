import { floorsData } from '../src/data/floors';
import { assetManifest } from '../src/data/asset-manifest';
import { getTours } from '../src/data/tours';
import { homepageData } from '../src/data/homepage';
import { projectVideo } from '../src/data/video';

const q = (v: string | undefined | null) => v == null ? 'NULL' : `'${v.replace(/'/g, "''")}'`;
const done = new Set<string>();
for (const floor of floorsData) for (const unit of floor.units) {
  if (unit.floorId !== floor.id || done.has(unit.id) || !unit.assetId) continue;
  done.add(unit.id);
  const prefix = `plants/details/${unit.assetId}/`;
  const asJson = (arr: string[]) => q(JSON.stringify(arr.map(path => `/${path}`)));
  const findFile = (kind: string) => assetManifest.filter(path => path === `${prefix}${kind}.jpg`);
  const gallery = assetManifest.filter(path => path.startsWith(`${prefix}gallery/`));
  console.log(`UPDATE units SET photos_furnished = COALESCE(photos_furnished, ${asJson(findFile('furnished'))}), photos_unfurnished = COALESCE(photos_unfurnished, ${asJson(findFile('unfurnished'))}), photos_plans = COALESCE(photos_plans, ${asJson(findFile('plans'))}), gallery = COALESCE(gallery, ${asJson(gallery)}), tour_url = COALESCE(tour_url, ${q(unit.tourUrl)}) WHERE id = ${q(unit.id)} AND deleted_at IS NULL;`);
}
for (const tour of getTours()) {
  const unitId = tour.type === 'unit' ? tour.id.replace(/^unit-/, '') : undefined;
  const thumbnail = tour.id === 'building-main' ? '/building/exterior/1.1.jpg' : tour.thumbnail;
  console.log(`INSERT OR IGNORE INTO tours (id,title,subtitle,thumbnail_url,type,target_url,unit_id,is_active,"order") SELECT ${q(tour.id)},${q(tour.title)},${q(tour.subtitle)},${q(thumbnail)},${q(tour.type)},${q(tour.target)},${q(unitId)},1,0 WHERE ${unitId ? `EXISTS (SELECT 1 FROM units WHERE id = ${q(unitId)} AND deleted_at IS NULL)` : '1'};`);
}
for (const [id,title,url,category] of [
  ['livigno-home-video','Video de portada',homepageData.intro.video,'VIDEO_PORTADA'],
  ['livigno-project-video',projectVideo.title,projectVideo.src,'VIDEO_SIDEBAR'],
]) {
  console.log(`INSERT OR IGNORE INTO media (id,title,url,type,category,is_active) SELECT ${q(id)},${q(title)},${q(url)},'video/mp4',${q(category)},1 WHERE NOT EXISTS (SELECT 1 FROM media WHERE category = ${q(category)});`);
}
