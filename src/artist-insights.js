import {artistCategories,visibleArtistIds} from './lib.js';
import {activityView} from './youtube-activity.js';
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
export function groupDemographics(groups,people,today=new Date().toISOString().slice(0,10)){
 const mean=values=>values.length?Math.round(values.reduce((sum,value)=>sum+value,0)/values.length*10)/10:null;
 return groups.filter(group=>group.artistType!=='solo').map(group=>{
  const current=people.filter(person=>person.memberships.some(relation=>relation.groupId===group.id&&relation.status==='current'));
  const expected=group.memberRoster?.lineup==='last'?0:group.memberRoster?.current?.length||current.length;
  const ages=current.map(person=>fullAge(person.birthDate,today)).filter(value=>value!==null);
  // Current membership is not proof of debut membership: require an explicit join date.
  const debut=people.filter(person=>person.memberships.some(relation=>relation.groupId===group.id&&relation.joinedAt&&relation.joinedAt<=group.debutDate&&(!relation.leftAt||relation.leftAt>group.debutDate)))
   .map(person=>fullAge(person.birthDate,group.debutDate)).filter(value=>value!==null);
  return {id:group.id,name:group.name,currentMembers:expected,knownBirthDates:ages.length,meanCurrentAge:mean(ages),meanDebutAge:mean(debut),ageRange:ages.length?Math.max(...ages)-Math.min(...ages):null};
 });
}
