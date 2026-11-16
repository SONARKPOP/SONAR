import {activityView} from './youtube-activity.js';
export const ANALYSIS_TABS=[['profiles','아티스트 통계'],['activity','콘텐츠 활동량'],['maps','출생지 지도']];
export function analysisDataFiles(tab){return tab==='activity'?{activity:'analysis-activity.json',legacy:'activity-comparison.json'}:{};}
function debutYear(artist){
 const date=artist.artistType==='solo'?(artist.soloDebutDate||artist.debutDate):artist.debutDate;
 const year=String(date||'').match(/^(\d{4})(?:-|$)/)?.[1];
 return year?Number(year):Number.isInteger(artist.debutYear)?artist.debutYear:null;
}
export function analysisYearOptions(artists,step=1){
 const size=step===5?5:1,counts=new Map();
 for(const artist of artists){const year=debutYear(artist),id=year===null?'unknown':String(Math.floor(year/size)*size);counts.set(id,(counts.get(id)||0)+1);}
 return [...counts].sort(([a],[b])=>a==='unknown'?1:b==='unknown'?-1:Number(b)-Number(a)).map(([id,count])=>({id,count,label:id==='unknown'?'연도 미확인':size===1?id:`${id}–${Number(id)+4}`}));
}
export function filterAnalysisArtists(artists,{favoriteIds=null,kind='all',year='',step=1,states=[],now=Date.now()}={}){
 const favorites=favoriteIds===null?null:new Set(favoriteIds),size=step===5?5:1;
 return artists.filter(artist=>{
  if(favorites&&!favorites.has(artist.id))return false;
  if(kind!=='all'&&(artist.artistType==='solo')!==(kind==='solo'))return false;
  const debut=debutYear(artist);
  if(year==='unknown'&&debut!==null)return false;
  if(year&&year!=='unknown'&&(debut===null||Math.floor(debut/size)*size!==Number(year)))return false;
  return !states.length||states.includes(activityView(artist,now)?.state);
 });
}
