import fs from 'node:fs';
import path from 'node:path';
import { spawnSync, spawn } from 'node:child_process';
import sharp from 'sharp';
const source = process.argv[2];
if (!source) throw new Error('Pass the Downloads folder containing PORTADA.mp4 and VIDEO FINAL livigno.mp4.');
const keys = [];
const output = key => { const p = path.join('public', key); fs.mkdirSync(path.dirname(p), {recursive:true}); keys.push(key); return p; };
const amenities = process.argv[3];
if (!amenities) throw new Error('Pass the extracted amenity image directory as the second argument.');
for(let i=1; i<=13; i++) {
  const name = fs.readdirSync(amenities).find(f=>new RegExp(`^${i}\\.(jpg|png)$`,'i').test(f));
  if(!name) throw new Error(`Missing amenity ${i}`);
  await sharp(path.join(amenities,name)).resize({width:2560,height:1440,fit:'inside',withoutEnlargement:true}).webp({quality:84}).toFile(output(`amenities/20261117/${i}.webp`));
}
for(const [name,key,poster] of [
  ['PORTADA.mp4','videos/20261117/portada.mp4','homepage/20261117/portada.webp'],
  ['VIDEO FINAL livigno.mp4','videos/20261117/livigno-general.mp4','videos/20261117/livigno-general-poster.webp'],
]) {
  const video = path.join(source,name);
  fs.copyFileSync(video,output(key));
  const frame=spawnSync('ffmpeg',['-v','error','-ss','1','-i',video,'-frames:v','1','-f','image2pipe','-vcodec','png','-'],{maxBuffer:64*1024*1024});
  if(frame.status!==0) throw new Error(frame.stderr.toString());
  await sharp(frame.stdout).resize({width:1920,withoutEnlargement:true}).webp({quality:84}).toFile(output(poster));
}
const sizes=JSON.parse(fs.readFileSync('scripts/.precache-sizes.json'));
for(const key of keys)sizes[key]=fs.statSync(path.join('public',key)).size;
fs.writeFileSync('scripts/.precache-sizes.json',JSON.stringify(sizes,null,2)+'\n');
console.log(`Prepared ${keys.length} files.`);
if(process.argv.includes('--upload')) {
 let index=0,done=0;
 async function worker(){while(index<keys.length){const key=keys[index++];
 for(let attempt=1;attempt<=3;attempt++){try { await new Promise((resolve,reject)=>{
  const child=spawn('npx',['wrangler','r2','object','put',`levigno-assets/${key}`,'--remote','--file',path.join('public',key),'--content-type',key.endsWith('.mp4')?'video/mp4':'image/webp','--cache-control','public, max-age=31536000, immutable']);
  let log='';child.stdout.on('data',c=>log+=c);child.stderr.on('data',c=>log+=c);child.on('error',reject);child.on('close',code=>code===0?resolve():reject(new Error(log)));
 }); break; } catch(error) { if(attempt===3) throw error; console.log(`Retrying ${key} (${attempt}/3)`); }}
 console.log(`[${++done}/${keys.length}] ${key}`);}}
 await Promise.all(Array.from({length:3},worker));
}
