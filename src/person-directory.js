import {artistInitials} from './directory-shortcuts.js';

const regions=new Intl.DisplayNames(['ko'],{type:'region'});
const countries={'대한민국':'KR','한국':'KR','South Korea':'KR','Korea':'KR','일본':'JP','Japan':'JP','중국':'CN','China':'CN',
 '대만':'TW','Taiwan':'TW','태국':'TH','Thailand':'TH','미국':'US','United States':'US','캐나다':'CA','Canada':'CA','호주':'AU','Australia':'AU'};
const normalize=value=>String(value||'').normalize('NFKC').toLowerCase().replace(/\s+/g,'');
export function nationalityView(value){
 const supplied=typeof value==='string'?value:value?.code||value?.countryCode||value?.name||'';
 const code=countries[supplied]||(/^[a-z]{2}$/i.test(supplied)?supplied.toUpperCase():'');
 let name=typeof value==='object'?value.name:undefined;
 if(code&&!name){try{name=regions.of(code);}catch{}}
 return {code,flag:code?[...code].map(char=>String.fromCodePoint(127397+char.charCodeAt(0))).join(''):'',name:name||supplied||'미확인'};
}

export function legalNamesFor(person){
 const raw=person.legalNames;
 const rows=Array.isArray(raw)?raw.map(v=>typeof v==='string'?{lang:'und',text:v}:{lang:v.lang||v.language||'und',text:v.text||v.name}):
  raw&&typeof raw==='object'?Object.entries(raw).map(([lang,value])=>({lang,text:typeof value==='string'?value:value?.text||value?.name})):[];
 const preferred=person.preferredLegalNameLanguages||[];
 return rows.filter(v=>v.text).sort((a,b)=>{
  const rank=lang=>preferred.includes(lang)?preferred.indexOf(lang):preferred.length;
  return rank(a.lang)-rank(b.lang);
 });
}

function displayName(record){
 return record.nameEn||record.aliases?.find(name=>/[a-z]/i.test(name)&&/^[\x20-\x7E]+$/.test(name))||record.name;
}
function membership(member,group){
 const history=(member.membershipHistory||[]).filter(h=>h.groupId===group.id);
 const latest=history.map((h,index)=>({...h,index})).sort((a,b)=>String(a.sourceCheckedAt||a.startDate||'').localeCompare(String(b.sourceCheckedAt||b.startDate||''))||a.index-b.index).at(-1);
 const names=[member.name,...member.aliases||[]].map(normalize),roster=group.memberRoster;
 let status=latest?.status||'unknown';
 if(!latest&&roster){
  if(roster.former?.some(name=>names.includes(normalize(name))))status='former';
  else if(roster.current?.some(name=>names.includes(normalize(name))))status=roster.lineup==='last'?'last-known':'current';
 }
 return {groupId:group.id,name:group.name,status,debutDate:group.debutDate||null,debutYear:group.debutYear||null,
  joinedAt:latest?.startDate||null,leftAt:latest?.endDate||null,sourceUrl:latest?.sourceUrl||null};
}

export function personDirectory(catalog={}){
 catalog=catalog||{};
 const groups=new Map((catalog.groups||[]).map(group=>[group.id,group]));
 const people=new Map();
 for(const member of catalog.members||[]){
  const parent=groups.get(member.groupId);
  if(!parent)continue;
  const row=people.get(member.id)||{...member,id:member.id,personId:member.id,name:displayName(member),
   nameKo:member.nameKo||([member.name,...member.aliases||[]].find(name=>/[가-힣]/.test(name))),
   aliases:[...new Set([member.name,...member.aliases||[]])],memberships:[],soloIds:[],soloArtists:[],soloDebuts:[],identityPending:false};
  const ids=new Set([member.groupId,...(member.membershipHistory||[]).map(h=>h.groupId)]);
  for(const id of ids)if(groups.has(id)&&!row.memberships.some(h=>h.groupId===id))row.memberships.push(membership(member,groups.get(id)));
  people.set(member.id,row);
 }
 const members=[...people.values()];
 const solos=[];
 for(const artist of catalog.groups||[]){
  if(artist.artistType!=='solo')continue;
  const linked=(artist.relatedMemberIds||[]).filter(id=>people.has(id));
  const identified=linked.length===1,standalone=!artist.relatedMemberIds?.length&&!artist.relatedGroupIds?.length&&!artist.previousGroupIds?.length;
  const id=identified?linked[0]:artist.id;
  let row=people.get(id);
  if(!row){
   row={...artist.personProfile,id,personId:standalone?id:null,name:displayName(artist),nameKo:artist.nameKo||[artist.name,...artist.aliases||[]].find(name=>/[가-힣]/.test(name)),
    aliases:[artist.name,...artist.aliases||[]],memberships:[],soloIds:[],soloArtists:[],soloDebuts:[],identityPending:!standalone};
   people.set(id,row);
  }
  const profile=artist.personProfile||{};
  const empty=value=>value==null||value===''||(typeof value==='object'&&Object.keys(value).length===0);
  for(const field of ['birthDate','birthDatePrecision','legalNames','nationalities','birthPlace','preferredLegalNameLanguages','officialLinks']){
   if(empty(row[field])&&!empty(profile[field])){
    row[field]=profile[field];
    if(profile.profileSources?.[field])row.profileSources={...row.profileSources,[field]:profile.profileSources[field]};
   }else if(!empty(profile[field])&&JSON.stringify(row[field])!==JSON.stringify(profile[field])){
    row.profileConflicts=[...new Set([...row.profileConflicts||[],field])];
   }
  }
  row.soloIds.push(artist.id);row.soloArtists.push(artist);
  row.aliases=[...new Set([...row.aliases,artist.name,...artist.aliases||[]])];
  row.soloDebuts.push({artistId:artist.id,name:artist.name,date:artist.soloDebutDate||artist.debutDate||null,year:artist.debutYear||null});
  for(const gid of new Set([...artist.relatedGroupIds||[],...artist.previousGroupIds||[]])){
   if(!groups.has(gid)||row.memberships.some(m=>m.groupId===gid))continue;
   const group=groups.get(gid);
   row.memberships.push({groupId:gid,name:group.name,status:artist.previousGroupIds?.includes(gid)?'former':'linked',debutDate:group.debutDate||null,debutYear:group.debutYear||null});
  }
  if(!solos.includes(row))solos.push(row);
 }
 return {members,solos,people,groups};
}

export function personMatches(person,query){
 const needle=normalize(query);
 return !needle||[person.name,person.nameKo,...person.aliases,...legalNamesFor(person).map(v=>v.text),...person.memberships.map(g=>g.name),...person.soloArtists.map(g=>g.name)]
  .some(value=>normalize(value).includes(needle));
}

export function initialSections(rows,selected=''){
 const buckets=new Map();
 for(const row of rows){
  const initial=selected||artistInitials(row)[0]||'기호';
  if(!buckets.has(initial))buckets.set(initial,[]);
  buckets.get(initial).push(row);
 }
 return [...buckets].sort(([a],[b])=>a.localeCompare(b,'ko',{numeric:true})).map(([letter,items])=>({letter,items}));
}
