import defaultGazetteer from './birthplace-gazetteer.js';
import {nationalityView} from './person-directory.js';
import {administrativePlace} from './admin-geography.js';
import {GEOGRAPHIC_ALIASES} from './geographic-aliases.js';
import {WORLD_ADM1,KOREA_ADM3} from './globe-gazetteer.js';
const byCountry=new Map(),byProvince=new Map();
for(const place of WORLD_ADM1){if(!byCountry.has(place.country))byCountry.set(place.country,[]);byCountry.get(place.country).push(place);}
for(const place of KOREA_ADM3){if(!byProvince.has(place.sido))byProvince.set(place.sido,[]);byProvince.get(place.sido).push(place);}
// Birthplace evidence is deliberately independent of nationality and residence.
const clean=value=>String(value||'').normalize('NFKC').trim().replace(/\s+/g,' ').toLowerCase();
const prefix=(text,name)=>text===name||text.startsWith(`${name} `)||text.startsWith(`${name},`);
const adminPatterns=new Map();
const districtPrefix=(text,name)=>{
 if(!adminPatterns.has(name))adminPatterns.set(name,new RegExp('^'+clean(name).replace(/\s/g,'').split('').map(c=>c.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('\\s*')+'(?:\\s|,|$)'));
 return adminPatterns.get(name).test(text);
};
const krAliases={'광주직할시':'광주광역시','부산직할시':'부산광역시','대구직할시':'대구광역시','인천직할시':'인천광역시','대전직할시':'대전광역시','서울':'서울특별시','부산':'부산광역시','대구':'대구광역시','인천':'인천광역시','광주':'광주광역시','대전':'대전광역시','울산':'울산광역시','세종':'세종특별자치시','경기':'경기도','강원도':'강원특별자치도','전라북도':'전북특별자치도','제주도':'제주특별자치도'};
export function createBirthplaceGazetteer(world,sido,sigungu){
 const countries=[];
 for(const f of world?.features||[]){
  const p=f.properties,code=p.ISO_A2_EH||p.ISO_A2;
  if(!code||code==='-99')continue;
  const names=[p.NAME,p.NAME_EN,p.ADMIN,p.NAME_KO,code];
  for(const lang of ['ko','en']){try{names.push(new Intl.DisplayNames([lang],{type:'region'}).of(code));}catch{}}
  if(code==='KR')names.push('한국','대한민국','South Korea','Republic of Korea');
  if(code==='TW')names.push('대만','중화민국','Taiwan','Republic of China');
  if(code==='CN')names.push('중국','중화인민공화국','China',"People's Republic of China");
  countries.push({code,name:['TW','CN'].includes(code)?nationalityView(code).name:p.NAME_KO||p.NAME_EN,aliases:[...new Set(names.filter(Boolean).map(clean))]});
 }
 const regions=(sido?.features||[]).map(f=>({name:f.properties.name,aliases:[f.properties.name,...Object.keys(krAliases).filter(k=>krAliases[k]===f.properties.name)]}));
 const districts=(sigungu?.features||[]).map(f=>({name:f.properties.name,sido:f.properties.sido}));
 return {countries,regions,districts};
}
export function normalizeBirthplace(person,gazetteer=defaultGazetteer){
 const raw=person.birthPlace,source=person.profileSources?.birthPlace||null;
 const object=raw&&typeof raw==='object'?raw:{};
 const display=typeof raw==='string'?raw:[object.countryName||object.country,object.regionName||object.region||object.province||object.adm1||object.regionCode,object.city,object.district,object.ward||object.neighborhood||object.adm3].filter(v=>typeof v==='string').join(' ');
 const result={raw:display||'',country:null,region:null,district:null,source,uncertain:source?.verificationStatus!=='official_verified',reason:display?'unmapped':'missing'};
 if(!display&&!object.countryCode)return result;
 const administrative=administrativePlace(display,gazetteer);
 if(administrative.change)result.administrativeChange={...administrative.change,sourceUrl:administrative.change.sourceUrl||source?.sourceUrl||null};
 if(administrative.review)result.administrativeReview=administrative.review;
 let text=clean(administrative.text).replace(/^중화인민공화국(?=\s|,|$)/,'중국').replace(/^중화민국(?=\s|,|$)/,'대만');
 if(/^광주(?:\s|,|$)/.test(text)){result.country=object.countryCode==='KR'?'KR':null;result.reason='ambiguous-region';return result;}
 const renamed=Object.entries(krAliases).find(([old])=>prefix(text,clean(old)));if(renamed)text=clean(renamed[1])+text.slice(clean(renamed[0]).length);
 const explicit=clean(object.countryCode||(/^[a-z]{2}$/i.test(object.country||'')?object.country:''));
 const hits=gazetteer.countries.filter(c=>explicit?clean(c.code)===explicit:c.aliases.some(a=>!/^\w{2}$/.test(a)&&(prefix(text,a)||text.endsWith(`, ${a}`))));
 if(hits.length===1){result.country=hits[0].code;result.countryName=hits[0].name;for(const a of hits[0].aliases.sort((a,b)=>b.length-a.length)){if(prefix(text,a)){text=text.slice(a.length).replace(/^[, ]+/,'');break;}}}
 if(!result.country){const labels=GEOGRAPHIC_ALIASES.filter(place=>place.aliases.some(alias=>prefix(text,clean(alias))));if(new Set(labels.map(p=>p.country)).size===1){result.country=labels[0].country;result.countryName=nationalityView(labels[0].country).name;result.geographySource=labels[0];}}
 if(/^광주(?:\s|,|$)/.test(text)){result.reason='ambiguous-region';return result;}
 // A Korean administrative name can establish country; a bare district cannot.
 const matches=gazetteer.regions.filter(r=>r.aliases.some(a=>prefix(text,clean(a))));
 if(matches.length===1&&(!result.country||result.country==='KR')){
  result.country='KR';result.countryName='대한민국';result.region=matches[0].name;
  for(const alias of matches[0].aliases.sort((a,b)=>b.length-a.length)){if(prefix(text,clean(alias))){text=clean(matches[0].name)+text.slice(clean(alias).length);break;}}
  const districts=gazetteer.districts.filter(d=>d.sido===result.region&&districtPrefix(text,d.name)).sort((a,b)=>b.name.length-a.name.length);
  if(districts.length)result.district=districts[0].name;
  if(result.region==='세종특별자치시'&&!result.district)result.district=gazetteer.districts.find(d=>d.sido===result.region)?.name||null;
 }
 if(result.country&&result.country!=='KR'){
  const regional=clean(object.regionName||object.region||object.province||object.adm1||object.regionCode||text);
  const regions=(byCountry.get(result.country)||[]).filter(r=>r.aliases.some(alias=>districtPrefix(regional,alias)));
  if(regions.length===1){const region=regions[0];result.region=region.name;result.adm1Id=region.mapKey;result.adm1Name=region.name;result.boundarySource={name:'Natural Earth',sourceUrl:'https://www.naturalearthdata.com/about/terms-of-use/',license:'Public Domain'};}
 }
 if(result.country==='KR'&&result.region){
  result.adm1Id='kr1:'+result.region;
  if(result.district)result.adm2Id='kr2:'+result.district;
  const wards=(byProvince.get(result.region)||[]).filter(w=>districtPrefix(text,w.name));
  if(wards.length===1){result.ward=wards[0].name;result.adm3Id=wards[0].mapKey;}
 }
 result.reason=result.country?'matched':'unmapped';
 return result;
}
export function birthplaceRows(people,gazetteer){return [...new Map(people.map(p=>[p.id,p])).values()].map(person=>({person,location:normalizeBirthplace(person,gazetteer)}));}
export function resolveBirthplace(person){const place=normalizeBirthplace(person);return {...place,countryCode:place.country,regionCode:place.region,city:place.district,precision:place.ward?'ward':place.district?'district':place.region?'region':place.country?'country':'unknown'};}
export function filterBirthplaceRows(rows,{query='',kind='all',groupId=''}={}){
 const q=clean(query);
 return rows.filter(({person:p,location:l})=>(kind!=='group'||p.memberships?.length)&&(kind!=='solo'||p.soloIds?.length)&&(!groupId||p.memberships?.some(g=>g.groupId===groupId)||p.soloIds?.includes(groupId))&&(!q||[p.name,p.nameKo,...p.aliases||[],...p.memberships?.map(g=>g.name)||[],l.raw].some(s=>clean(s).includes(q))));
}

// Optional map overlay. Nationality never changes the stored birthplace or birthplace totals.
export function geographyRows(people,gazetteer=defaultGazetteer,{nationalityFallback=false}={}){
 return birthplaceRows(people,gazetteer).flatMap(row=>{
  const location={...row.location,basis:'birthplace'};
  if(location.country||!nationalityFallback)return [{...row,location}];
  const nationalities=[...new Map((row.person.nationalities||[]).map(n=>nationalityView(n)).filter(n=>{if(!n.code||['EU','UN','XA','XB','ZZ','QO'].includes(n.code))return false;try{return new Intl.DisplayNames(['en'],{type:'region'}).of(n.code)!==n.code;}catch{return false;}}).map(n=>[n.code,n])).values()];
  if(!nationalities.length)return [{...row,location}];
  return nationalities.map(n=>({person:row.person,location:{...location,country:n.code,countryName:n.name,region:null,district:null,basis:'nationality',source:row.person.profileSources?.nationalities||null,uncertain:true,reason:'nationality-only',originalBirthPlace:location.raw,raw:`${n.flag} ${n.name} · 국적 기준 · 출생지 미확인${location.raw?' ('+location.raw+')':''}`}}));
 });
}
export function geographySummary(rows){
 const unique=values=>new Set(values.map(r=>r.person.id)).size;
 return {people:unique(rows),birthplace:unique(rows.filter(r=>r.location.country&&r.location.basis!=='nationality')),nationality:unique(rows.filter(r=>r.location.basis==='nationality')),unknown:unique(rows.filter(r=>!r.location.country)),unresolvedBirthplace:unique(rows.filter(r=>!r.location.country||r.location.basis==='nationality'))};
}

export const geographyLabel=value=>String(value||'').replaceAll('중화인민공화국','중국').replaceAll('중화민국','대만');

// A deeper map never moves a country-only fact to an arbitrary subregion.
export function geographyRegionKey(location,{view='world',level='country'}={}){
 if(!location.country)return null;
 if(location.basis==='nationality')return location.country;
 if(view==='world'||level==='country')return level==='adm1'?(location.adm1Id||location.country):location.country;
 if(location.country!=='KR')return location.country;
 if(level==='adm3')return location.adm3Id||location.adm2Id||location.adm1Id||location.country;
 if(level==='sigungu')return location.adm2Id||location.adm1Id||location.country;
 return location.adm1Id||location.country;
}

export function countryBirthplaceStats(rows){const countries=new Map();for(const row of rows){const l=row.location;if(!l.country||l.basis==='nationality')continue;if(!countries.has(l.country))countries.set(l.country,new Map());countries.get(l.country).set(row.person.id,row);}return new Map([...countries].map(([country,people])=>{const all=[...people.values()],known=all.filter(r=>r.location.adm1Id);return [country,{total:all.length,known:known.length,unknown:all.length-known.length}];}));}
export function countryDetailAsset(country,available={}){return available[country]?.replace(/\.geojson$/,'')||null;}

// Explicit citizenship mode includes every known citizenship, including people with known birthplaces.
export function citizenshipRows(people,gazetteer=defaultGazetteer){const byId=new Map(people.map(person=>[person.id,person]));return geographyRows(people.map(person=>({...person,birthPlace:undefined})),gazetteer,{nationalityFallback:true}).map(row=>({...row,person:byId.get(row.person.id)||row.person,location:{...row.location,citizenshipMode:true}}));}
