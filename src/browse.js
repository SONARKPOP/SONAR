import {videoMatchesArtist} from './lib.js';

export function archiveRequest(browse,ids,tab,year,month,progress){
 const wide=ids.length>=10;
 const period=Boolean(year||month||tab==='uploads');
 const months=(browse?.months||[]).filter(key=>(!year||key.startsWith(year+'-'))&&(!month||key.endsWith('-'+month)));
 const limit=wide?(browse?.limits?.[tab]||24):ids.length===1?6:(browse?.limits?.[tab]||24);
 if(!ids.length||tab==='station')return {paths:[],hasMore:false,limit,preview:false,wide};
 if(!browse)return {paths:ids.map(id=>`groups/${id}.json`),hasMore:false,limit,preview:false,wide};
 if(wide){
  const monthCount=Math.max(period?1:0,progress.months);
  const paths=months.slice(0,monthCount).map(key=>`browse/months/${key}.json`);
  if(!period&&browse.limits[tab])paths.unshift(`browse/${tab}.json`);
  return {paths,limit,preview:!period&&!monthCount,hasMore:monthCount<months.length,wide,monthCount};
 }
 const full=period||progress.months>0||!browse.limits[tab];
 const paths=full?ids.map(id=>`groups/${id}.json`):ids.filter(id=>browse.groupTabs[id]?.[tab]).map(id=>`browse/groups/${tab}/${id}.json`);
 return {paths,limit,preview:!full,hasMore:!full&&ids.some(id=>(browse.groupTabs[id]?.[tab]||0)>3),wide,monthCount:full?1:0};
}

export function balancedPreview(rows,groups,limit,cap,includeIndividual){
 if(groups.length<2)return rows.slice(0,limit);
 const counts=new Map(),shown=[],overflow=[];
 for(const row of rows){
  const ids=groups.filter(id=>videoMatchesArtist(row,id,includeIndividual));
  const group=ids.find(id=>(counts.get(id)||0)<cap);
  if(!group){overflow.push(row);continue;}
  shown.push(row);
  counts.set(group,(counts.get(group)||0)+1);
  if(shown.length===limit)return shown;
 }
 const selected=new Set([...shown,...overflow.slice(0,limit-shown.length)].map(row=>row.id));
 return rows.filter(row=>selected.has(row.id));
}
