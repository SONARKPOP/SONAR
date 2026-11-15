export const ACTIVITY_TYPES={music:'음악 · MV · 커버',broadcast:'음악방송',radio:'라디오',officialContent:'공식 콘텐츠',externalConfirmed:'확인된 외부 출연',externalInferred:'추정 외부 출연',live:'LIVE',shorts:'Shorts',unclassified:'분류 확인 대기'};
export function analyticsRows(data,artists,days,query='',sort='observedUploads'){
 const known=new Map((data?.artists||[]).map(row=>[row.artistId,row]));
 const needle=query.normalize('NFKC').toLowerCase().trim();
 return artists.filter(a=>!needle||[a.name,a.nameKo,a.nameEn,...a.aliases||[]].some(n=>String(n||'').normalize('NFKC').toLowerCase().includes(needle))).map(artist=>{
  const row=known.get(artist.id),values=row?.windows?.[String(days)];
  if(!values)return null;
  const official=values.official??(values.officialObserved>0?values.officialObserved:null);
  const result={...row,...values,id:artist.id,name:artist.name,official,officialPartial:values.official===null&&official!==null};
  return ['official','confirmed','inferred','member'].some(key=>(result[key]??0)>0)?result:null;
 }).filter(Boolean).sort((a,b)=>(Number.isFinite(b[sort])?b[sort]:-1)-(Number.isFinite(a[sort])?a[sort]:-1)||a.name.localeCompare(b.name,'ko'));
}
const day=86400000;
export function activitySeries(row,days,bucket='day',asOf,metric='observedUploads'){
 const at=Date.parse(asOf);if(!Number.isFinite(at))return [];
 const dates=new Map((row.windows?.[String(days)]?.series||row.series||[]).map(p=>[p.date,p]));
 const complete=metric==='official'&&row.windows?.[String(days)]?.officialCoverage==='complete';
 const bins=new Map();
 for(let stamp=at-days*day;stamp<=at;stamp+=day){
  const date=new Date(stamp+9*3600000).toISOString().slice(0,10);let key=date;
  if(bucket==='week'){const d=new Date(date+'T00:00:00Z');d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7);key=d.toISOString().slice(0,10);}
  if(bucket==='month')key=date.slice(0,7);
  const value=dates.has(date)?dates.get(date)[metric]??null:complete?0:null;
  const bin=bins.get(key)||{date:key,value:0,known:0,missing:0};
  if(value===null)bin.missing++;else{bin.value+=value;bin.known++;}bins.set(key,bin);
 }
 return [...bins.values()].map(bin=>({...bin,value:bin.known?bin.value:null,partial:bin.missing>0}));
}
