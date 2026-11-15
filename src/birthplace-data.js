import defaultGazetteer from './birthplace-gazetteer.js';
// Birthplace evidence is deliberately independent of nationality and residence.
const clean=value=>String(value||'').normalize('NFKC').trim().replace(/\s+/g,' ').toLowerCase();
const prefix=(text,name)=>text===name||text.startsWith(`${name} `)||text.startsWith(`${name},`);
const districtPrefix=(text,name)=>new RegExp('^'+clean(name).replace(/\s/g,'').split('').map(c=>c.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('\\s*')+'(?:\\s|,|$)').test(text);
const krAliases={'서울':'서울특별시','부산':'부산광역시','대구':'대구광역시','인천':'인천광역시','광주':'광주광역시','대전':'대전광역시','울산':'울산광역시','세종':'세종특별자치시','경기':'경기도','강원도':'강원특별자치도','전라북도':'전북특별자치도','제주도':'제주특별자치도'};
export function createBirthplaceGazetteer(world,sido,sigungu){
 const countries=[];
 for(const f of world?.features||[]){
  const p=f.properties,code=p.ISO_A2_EH||p.ISO_A2;
  if(!code||code==='-99')continue;
  const names=[p.NAME,p.NAME_EN,p.ADMIN,p.NAME_KO,code];
  for(const lang of ['ko','en']){try{names.push(new Intl.DisplayNames([lang],{type:'region'}).of(code));}catch{}}
  if(code==='KR')names.push('한국','대한민국','South Korea','Republic of Korea');
  countries.push({code,name:p.NAME_KO||p.NAME_EN,aliases:[...new Set(names.filter(Boolean).map(clean))]});
 }
 const regions=(sido?.features||[]).map(f=>({name:f.properties.name,aliases:[f.properties.name,...Object.keys(krAliases).filter(k=>krAliases[k]===f.properties.name)]}));
 const districts=(sigungu?.features||[]).map(f=>({name:f.properties.name,sido:f.properties.sido}));
 return {countries,regions,districts};
}
export function normalizeBirthplace(person,gazetteer=defaultGazetteer){
 const raw=person.birthPlace,source=person.profileSources?.birthPlace||null;
 const object=raw&&typeof raw==='object'?raw:{};
 const display=typeof raw==='string'?raw:[object.countryName||object.country,object.region||object.province,object.city,object.district].filter(v=>typeof v==='string').join(' ');
 const result={raw:display||'',country:null,region:null,district:null,source,uncertain:source?.verificationStatus!=='official_verified',reason:display?'unmapped':'missing'};
 if(!display&&!object.countryCode)return result;
 let text=clean(display);
 const explicit=clean(object.countryCode||'');
 const hits=gazetteer.countries.filter(c=>explicit?clean(c.code)===explicit:c.aliases.some(a=>!/^\w{2}$/.test(a)&&(prefix(text,a)||text.endsWith(`, ${a}`))));
 if(hits.length===1){result.country=hits[0].code;result.countryName=hits[0].name;for(const a of hits[0].aliases.sort((a,b)=>b.length-a.length)){if(prefix(text,a)){text=text.slice(a.length).replace(/^[, ]+/,'');break;}}}
 if(/^광주(?:\s|,|$)/.test(text)){result.reason='ambiguous-region';return result;}
 // A Korean administrative name can establish country; a bare district cannot.
 const matches=gazetteer.regions.filter(r=>r.aliases.some(a=>prefix(text,clean(a))));
 if(matches.length===1&&(!result.country||result.country==='KR')){
  result.country='KR';result.countryName='대한민국';result.region=matches[0].name;
  for(const alias of matches[0].aliases.sort((a,b)=>b.length-a.length)){if(prefix(text,clean(alias))){text=clean(matches[0].name)+text.slice(clean(alias).length);break;}}
  const districts=gazetteer.districts.filter(d=>d.sido===result.region&&districtPrefix(text,d.name)).sort((a,b)=>b.name.length-a.name.length);
  if(districts.length)result.district=districts[0].name;
 }
 result.reason=result.country?'matched':'unmapped';
 return result;
}
export function birthplaceRows(people,gazetteer){return people.map(person=>({person,location:normalizeBirthplace(person,gazetteer)}));}
export function resolveBirthplace(person){const place=normalizeBirthplace(person);return {...place,countryCode:place.country,regionCode:place.region,city:place.district,precision:place.district?'district':place.region?'region':place.country?'country':'unknown'};}
export function filterBirthplaceRows(rows,{query='',kind='all',groupId=''}={}){
 const q=clean(query);
 return rows.filter(({person:p,location:l})=>(kind!=='group'||p.memberships?.length)&&(kind!=='solo'||p.soloIds?.length)&&(!groupId||p.memberships?.some(g=>g.groupId===groupId)||p.soloIds?.includes(groupId))&&(!q||[p.name,p.nameKo,...p.aliases||[],...p.memberships?.map(g=>g.name)||[],l.raw].some(s=>clean(s).includes(q))));
}
