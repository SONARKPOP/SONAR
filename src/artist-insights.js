import {artistCategories,visibleArtistIds} from './lib.js';
import {activityView} from './youtube-activity.js';
import {nationalityView} from './person-directory.js';
const safe=url=>{try{return new URL(url).protocol==='https:';}catch{return false;}};
function participantIds(row){
 const individual=row.individualActivity||{};
 return [...(row.groupIds||[]),...(row.memberIds||[]),...(row.personIds||[]),...(individual.memberIds||[]),individual.artistId,
  ...(row.appearanceEvidence||[]).filter(e=>!['mention','original-artist','cover-target'].includes(e.role)).flatMap(e=>[e.groupId,e.memberId,e.personId])].filter(Boolean);
}
export function uniquePeople(directory){return [...new Map([...directory.members,...directory.solos].map(person=>[person.id,person])).values()];}
export function agencyHistory(artist){
 return (artist?.agencyHistory||artist?.personProfile?.agencyHistory||[]).filter(row=>row.name&&safe(row.sourceUrl)&&['current','former'].includes(row.status));
}
export function hardBlockContent(rows,blocked=[],catalog={}){
 const ids=new Set(blocked),people=new Map((catalog.members||[]).map(person=>[person.id,person]));
 const blockedArtists=new Set((catalog.groups||[]).filter(artist=>ids.has(artist.id)||(artist.relatedMemberIds||[]).some(id=>ids.has(id))).map(artist=>artist.id));
 return rows.filter(row=>{
  return !participantIds(row).some(id=>ids.has(id)||blockedArtists.has(id)||ids.has(people.get(id)?.groupId));
 });
}
export function softBlockContent(rows,blocked=[],favorites=[]){
 const excluded=new Set(blocked),preferred=new Set(favorites);
 return rows.filter(row=>{
  const participants=participantIds(row);
  return !participants.some(id=>excluded.has(id))||participants.some(id=>preferred.has(id));
 });
}
export function favoriteArtistIds(catalog,ids){
 const preferred=new Set(ids),parents=new Set((catalog?.members||[]).filter(person=>preferred.has(person.id)).map(person=>person.groupId));
 return (catalog?.groups||[]).filter(group=>preferred.has(group.id)||parents.has(group.id)||(group.relatedMemberIds||[]).some(id=>preferred.has(id))).map(group=>group.id);
}
export function browsingArtistIds(catalog,{types,excluded=[],muted=[],hardBlocked=[],favoriteIds=[],favoritesOnly=false,activeOnly=false,now=Date.now()}){
 const preferred=new Set(favoriteArtistIds(catalog,favoriteIds)),off=new Set([...muted,...hardBlocked]);
 const rows=(catalog?.groups||[]).filter(group=>!off.has(group.id)&&(!favoritesOnly||preferred.has(group.id))&&(!activeOnly||['SURGE','SAILING','COASTING','ANCHORED'].includes(activityView(group,now)?.state)));
 return visibleArtistIds(rows,rows.map(row=>row.id),types,excluded);
}
export function visibleLiveRows(rows,catalog,{types,hardBlocked=[],excluded=[],favorites=[]}){
 const byId=new Map(catalog.groups.map(group=>[group.id,group]));
 return softBlockContent(hardBlockContent(rows,hardBlocked,catalog),excluded,favorites).filter(row=>row.groupIds?.some(id=>artistCategories(byId.get(id)||{}).some(type=>types.includes(type))));
}
export function favoriteContent(rows,ids=[],catalog={}){
 if(!ids.length)return rows;
 const chosen=new Set(ids),groups=new Set((catalog.groups||[]).filter(artist=>chosen.has(artist.id)||(artist.relatedMemberIds||[]).some(id=>chosen.has(id))).map(artist=>artist.id));
 return rows.filter(row=>[...(row.groupIds||[]),row.individualActivity?.artistId].some(id=>groups.has(id))||(row.memberIds||[]).some(id=>chosen.has(id)));
}
export function comparisonRows(data,artists,window,now=Date.now()){
 const entries=new Map((data?.artists||[]).map(row=>[row.artistId,row]));
 const generated=Date.parse(data?.generatedAt),archiveFresh=Number.isFinite(generated)&&now>=generated&&now-generated<=86400000;
 return artists.map(artist=>{
  const row=entries.get(artist.id),official=row?.officialUploads;
  const checked=Date.parse(official?.checkedAt||data?.generatedAt);
  const fresh=Number.isFinite(checked)&&now>=checked&&now-checked<=86400000;
  return {id:artist.id,name:artist.name,official:official?.canCompare&&fresh&&Number.isFinite(official.counts?.[window])?official.counts[window]:null,
   confirmed:archiveFresh?row?.externalAppearances?.confirmedCounts?.[window]??null:null,inferred:archiveFresh?row?.externalAppearances?.inferredCounts?.[window]??null:null,
   member:archiveFresh?row?.memberActivities?.counts?.[window]??null:null};
 });
}
export function fullAge(birth,at){
 const valid=value=>/^\d{4}-\d{2}-\d{2}$/.test(value||'')&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;
 if(!valid(birth)||!valid(at)||birth>at)return null;
 return Number(at.slice(0,4))-Number(birth.slice(0,4))-(at.slice(5)<birth.slice(5)?1:0);
}
export function ageSummary(values){
 const ages=values.filter(Number.isFinite).sort((a,b)=>a-b),n=ages.length;
 if(!n)return {count:0,mean:null,median:null,min:null,max:null,stdDev:null};
 const mean=ages.reduce((a,b)=>a+b,0)/n,round=value=>Math.round(value*100)/100;
 return {count:n,mean:round(mean),median:round(n%2?ages[(n-1)/2]:(ages[n/2-1]+ages[n/2])/2),min:ages[0],max:ages[n-1],stdDev:round(Math.sqrt(ages.reduce((sum,v)=>sum+(v-mean)**2,0)/n))};
}
export function analysisDate(value){
 const at=Date.parse(value||'');
 return Number.isFinite(at)?new Date(at+9*3600000).toISOString().slice(0,10):null;
}
export function groupDemographics(groups,people,today=new Date().toISOString().slice(0,10)){
 return groups.filter(group=>group.artistType!=='solo').map(group=>{
  const relations=person=>person.memberships?.filter(h=>h.groupId===group.id)||[];
  const ended=group.memberRoster?.lineup==='last'||group.groupStatus==='disbanded';
  const listed=people.filter(p=>relations(p).some(h=>h.status==='current'));
  const current=ended?[]:listed;
  const expected=ended?0:Array.isArray(group.memberRoster?.current)?group.memberRoster.current.length:current.length||null;
  const former=people.filter(p=>relations(p).some(h=>h.status==='former'));
  const lastKnown=people.filter(p=>relations(p).some(h=>h.status==='last-known')||(ended&&listed.includes(p)));
  const ages=ageSummary(current.map(p=>fullAge(p.birthDate,today)));
  // Only explicit start/end dates establish membership on debut day.
  const debutPeople=people.filter(person=>relations(person).some(h=>h.joinedAt&&h.joinedAt<=group.debutDate&&(!h.leftAt||h.leftAt>group.debutDate)));
  const debut=ageSummary(debutPeople.map(person=>fullAge(person.birthDate,group.debutDate)));
  const knownNationality=current.filter(p=>p.nationalities?.length&&p.nationalities.every(n=>nationalityView(n).code)),foreign=knownNationality.filter(p=>p.nationalities.some(n=>nationalityView(n).code!=='KR'));
  const debutDate=fullAge(group.debutDate,today)!==null?Date.parse(group.debutDate):null;
  return {id:group.id,name:group.name,kind:'group',currentMembers:expected,formerMembers:former.length,lastKnownMembers:lastKnown.length,knownBirthDates:ages.count,
   birthDateCoverage:expected?Math.min(1,ages.count/expected):null,meanCurrentAge:ages.mean,medianCurrentAge:ages.median,minCurrentAge:ages.min,maxCurrentAge:ages.max,currentAgeStdDev:ages.stdDev,
   meanDebutAge:debut.mean,debutAgeKnown:debut.count,debutMembershipKnown:debutPeople.length,ageRange:ages.count?ages.max-ages.min:null,
   yearsSinceDebut:debutDate===null?null:Math.round((Date.parse(today)-debutDate)/86400000/365.2425*100)/100,
   knownNationalities:knownNationality.length,nationalityCoverage:expected?Math.min(1,knownNationality.length/expected):null,
   foreignNationalityShare:knownNationality.length?foreign.length/knownNationality.length:null,
   soloActivityMembers:current.filter(p=>p.soloIds?.length).length};
 });
}
export function artistProfileRows(artists,people,today){
 const groupRows=groupDemographics(artists,people,today);
 const solos=artists.filter(a=>a.artistType==='solo').map(artist=>{
  const person=people.find(p=>p.soloIds?.includes(artist.id)||(artist.relatedMemberIds||[]).includes(p.id));
  const known=person&&!person.identityPending?person:null,age=fullAge(known?.birthDate,today),date=artist.soloDebutDate||artist.debutDate;
  const nationality=known?.nationalities?.length&&known.nationalities.every(n=>nationalityView(n).code)?known.nationalities:null;
  return {id:artist.id,name:artist.name,kind:'solo',currentMembers:1,formerMembers:0,lastKnownMembers:0,knownBirthDates:age===null?0:1,birthDateCoverage:age===null?0:1,
   meanCurrentAge:age,medianCurrentAge:age,minCurrentAge:age,maxCurrentAge:age,currentAgeStdDev:age===null?null:0,meanDebutAge:fullAge(known?.birthDate,date),debutAgeKnown:fullAge(known?.birthDate,date)===null?0:1,ageRange:age===null?null:0,
   yearsSinceDebut:fullAge(date,today)===null?null:Math.round((Date.parse(today)-Date.parse(date))/86400000/365.2425*100)/100,
   knownNationalities:nationality?1:0,nationalityCoverage:nationality?1:0,foreignNationalityShare:nationality?(nationality.some(n=>nationalityView(n).code!=='KR')?1:0):null,soloActivityMembers:1};
 });return [...groupRows,...solos];
}
export function peopleForArtists(artists,people){
 const ids=new Set(artists.map(a=>a.id));
 return people.filter(person=>(person.memberships||[]).some(h=>ids.has(h.groupId))||(person.soloIds||[]).some(id=>ids.has(id)));
}
