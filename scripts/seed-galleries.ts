import { assetManifest } from '../src/data/asset-manifest';
const q = (v: string) => `'${v.replace(/'/g, "''")}'`;
console.log("INSERT OR IGNORE INTO gallery_collections (id,title,description,cover_image,is_active) VALUES ('amenities','Amenidades','Espacios del proyecto','/amenities/',1);");
assetManifest.filter(path => path.startsWith('amenities/')).forEach((path, index) => {
 const title = path.split('/').pop()?.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ') || `Amenidad ${index + 1}`;
 console.log(`INSERT OR IGNORE INTO media (id,title,url,type,category,is_active) VALUES (${q(`livigno-amenity-${index + 1}`)},${q(title)},${q('/' + path)},'image','AMENITIES_GALLERY',1);`);
});
