import {dedupe, isShortContent, monthKey} from './lib.js';

export function artistRelations(groups, id){
 const current=groups.find(group=>group.id===id);
 if(!current)return [];
 return groups.filter(group=>group.id!==id).flatMap(artist=>{
  const labels=[];
  if(current.previousGroupIds?.includes(artist.id))labels.push('이전 소속 그룹');
  else if(current.relatedGroupIds?.includes(artist.id))labels.push('연결된 그룹');
  if(artist.previousGroupIds?.includes(id))labels.push('이 그룹 출신');
  else if(artist.relatedGroupIds?.includes(id))labels.push('연결된 솔로 활동');
  return labels.map(label=>({artist,label}));
 });
}

export const comparisonMetrics=[
 ['total','전체 영상'],['music','MUSIC'],['own','자체 콘텐츠'],
 ['external','외부 콘텐츠'],['live','라이브'],['shorts','쇼츠'],
];
const rollingWindow=90*86400000;

export function compareArtistContent(rows, ids, {recent=false,year='',month='',now=Date.now()}={}){
 const totals=ids.map(()=>Object.fromEntries(comparisonMetrics.map(([key])=>[key,0])));
 const monthly=new Map();
 const shared=[];
 const start=now-rollingWindow;
 const videos=dedupe(rows).sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt));
 for(const video of videos){
  const timestamp=Date.parse(video.publishedAt);
  if(video.demo||!Number.isFinite(timestamp)||(recent&&(timestamp<start||timestamp>now)))continue;
  const period=monthKey(timestamp);
  if((year&&period.slice(0,4)!==year)||(month&&period.slice(5,7)!==month))continue;
  const matches=ids.map(id=>video.groupIds.includes(id));
  if(!matches.some(Boolean))continue;
  if(matches.every(Boolean))shared.push(video);
  const counts=monthly.get(period)||ids.map(()=>0);
  const hasType=type=>video.category===type||video.contentTypes?.includes(type);
  matches.forEach((matchesArtist,index)=>{
   if(!matchesArtist)return;
   const total=totals[index];
   counts[index]++;
   total.total++;
   if(hasType('music'))total.music++;
   if(hasType('own'))total.own++;
   if(hasType('external'))total.external++;
   if(video.format==='live')total.live++;
   if(isShortContent(video))total.shorts++;
  });
  monthly.set(period,counts);
 }
 const first=recent?monthKey(start):year?(month?`${year}-${month}`:`${year}-01`):'';
 const last=recent?monthKey(now):year?(month?`${year}-${month}`:`${year}-12`):'';
 if(first){
  const cursor=new Date(`${first}-01T00:00:00Z`);
  for(let period=first;period<=last;period=cursor.toISOString().slice(0,7)){
   if(!monthly.has(period))monthly.set(period,ids.map(()=>0));
   cursor.setUTCMonth(cursor.getUTCMonth()+1);
  }
 }
 const months=[...monthly].sort(([a],[b])=>a.localeCompare(b)).map(([month,counts])=>({month,counts}));
 return {totals,months,shared};
}
