import {artistProfileRows,agencyHistory} from './artist-insights.js';

// Legacy agencyHistory rows describe agencies. Explicit roles never cross buckets.
export function affiliationRows(artist){
 const seen=new Set();
 return agencyHistory(artist).map(row=>({...row,role:row.role||'agency'})).filter(row=>{
  if(!['agency','label'].includes(row.role))return false;
  const key=[row.role,row.status,row.agencyId||row.labelId||row.name,row.startDate||'',row.endDate||''].join('|');
  if(seen.has(key))return false;seen.add(key);return true;
 });
}
export function affiliationCategories(artist){
 const history=affiliationRows(artist);
 return Object.fromEntries(['agency','label'].map(role=>{
  const ids=[...new Set(history.filter(r=>r.role===role&&r.status==='current').map(r=>r.agencyId||r.labelId||r.name))].sort();
  return [role,ids.length===1?ids[0]:null];
 }));
}
export function profileRows(artists,people,today){
 const byId=new Map(artists.map(a=>[a.id,a]));
 return artistProfileRows(artists,people,today).map(row=>{
  const artist=byId.get(row.id),affiliations=affiliationRows(artist);
  const affiliationText=role=>affiliations.filter(r=>r.role===role).map(r=>`${r.status==='current'?'0':'1'} ${r.name}`).join(' · ')||null;
  return {...row,aliases:[...(artist.aliases||[]),artist.nameKo,artist.nameEn].filter(Boolean),affiliations,agency:affiliationText('agency'),label:affiliationText('label')};
 });
}
export function sortProfileRows(rows,{query='',key='name',direction='asc'}={}){
 const q=query.trim().normalize('NFKC').toLocaleLowerCase(),sign=direction==='desc'?-1:1;
 return rows.filter(row=>!q||[row.name,row.id,...(row.aliases||[])].some(v=>String(v||'').normalize('NFKC').toLocaleLowerCase().includes(q))).sort((a,b)=>{
  const av=a[key],bv=b[key],missing=v=>v===null||v===undefined||v==='';
  if(missing(av)||missing(bv))return missing(av)&&missing(bv)?String(a.id).localeCompare(String(b.id)):missing(av)?1:-1;
  const compared=typeof av==='number'&&typeof bv==='number'?av-bv:String(av).localeCompare(String(bv),'ko',{numeric:true});
  return sign*compared||String(a.id).localeCompare(String(b.id));
 });
}
export function formatDebutElapsed(row){return row.yearsSinceDebut==null||row.daysSinceDebut==null?'—':`${row.yearsSinceDebut.toFixed(2)}년 (${row.daysSinceDebut.toLocaleString('ko-KR')}일)`;}
