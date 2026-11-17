// Reuse downloaded Natural Earth geometry without simplifying or changing map IDs.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const source=process.argv[2]||'work/world-adm1-source.geojson';
const bytes=fs.readFileSync(source),raw=JSON.parse(bytes),byKey=new Map();
for(const feature of raw.features){
 const p=feature.properties,key=`adm1:${p.iso_a2}:${p.iso_3166_2||p.adm1_code}`;
 if(!byKey.has(key))byKey.set(key,[]);
 byKey.get(key).push(feature);
}
const root='public/data/maps/',manifest=JSON.parse(fs.readFileSync(root+'country-adm1-manifest.json','utf8'));
let replaced=0;
for(const [country,file] of Object.entries(manifest.countries)){
 if(country==='KR')continue;
 const data=JSON.parse(fs.readFileSync(root+file,'utf8'));
 for(const feature of data.features){
  const candidates=byKey.get(feature.properties.mapKey)||[];
  const match=candidates.length===1?candidates[0]:candidates.find(f=>[f.properties.name_ko,f.properties.name_en,f.properties.name].includes(feature.properties.name));
  if(!match)throw Error('Unresolved geometry identity: '+feature.properties.mapKey);
  feature.geometry=match.geometry;replaced++;
 }
 fs.writeFileSync(root+file,JSON.stringify(data));
}
manifest.adm1Source={url:'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson',sha256:createHash('sha256').update(bytes).digest('hex'),scale:'1:10m',simplification:'none; original geometry retained',license:'Public Domain',features:replaced};
fs.writeFileSync(root+'country-adm1-manifest.json',JSON.stringify(manifest,null,2)+'\n');
console.log(`Preserved original geometry for ${replaced} ADM1 regions.`);
