import {artistCategories,groupActivity,sortGroups,artistsInDebutRange,monthsAfter} from './lib.js';
import {ACTIVITY_META,activityView} from './youtube-activity.js';

export const DIRECTORY_ACTIVITY_STATES=Object.keys(ACTIVITY_META);
const normalizeName=value=>value.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');

export function koreanArtistName(artist){
 const name=artist.nameKo?.trim()||artist.aliases?.find(alias=>/[가-힣]/.test(alias)&&!/[a-z]/i.test(alias));
 return name&&normalizeName(name)!==normalizeName(artist.name)?name:'';
}

export function matchesArtistName(artist,query,extra=[]){
 const needle=normalizeName(query);
 return !needle||[artist?.name,artist?.nameKo,artist?.nameEn,...(artist?.aliases||[]),...extra].some(name=>name&&normalizeName(name).includes(needle));
}

export function isArtistSearch(query){return Boolean(normalizeName(query));}

export function legacyGroupState(artist,now=Date.now()){
 if(artist.artistType==='solo')return null;
 if(artist.groupStatus==='disbanded'||artist.groupStatus==='hiatus')return artist.groupStatus;
 if(artist.directoryArchiveReason==='official-channel-unavailable')return 'channel-unavailable';
 const last=lastKnownUpload(artist,now);
 return last!==null&&now>=monthsAfter(last,24)?'long-dormant':null;
}

export function lastKnownUpload(artist,now=Date.now()){
 const dates=[artist.youtubeActivity?.last_upload_at,artist.lastOfficialUploadAt].map(Date.parse).filter(date=>Number.isFinite(date)&&date<=now);
 return dates.length?Math.max(...dates):null;
}

export const LEGACY_LABELS={disbanded:'해체',hiatus:'활동 중단','channel-unavailable':'공식 채널 이용 불가'};

export function matchesDirectoryScope(artist,scope,now=Date.now()){
 if(scope==='all')return true;
 const last=lastKnownUpload(artist,now);
 if(last===null)return false;
 const band=now>=monthsAfter(last,24)?'legacy':
  now>=monthsAfter(last,6)?'dormant':
  now>=monthsAfter(last,1)?'intermittent':'recent';
 return scope===band;
}

export function matchesDirectoryActivity(artist,status,now){
 if(status==='all')return true;
 const state=activityView(artist,now)?.state;
 if(status==='general')return state?state!=='LOST SIGNAL':groupActivity(artist,now)!=='archived';
 if(status==='unknown')return !state;
 if(DIRECTORY_ACTIVITY_STATES.includes(status))return state===status;
 return groupActivity(artist,now)===status;
}

export function careerTagsFor(artist,groups){
 const previous=artist.previousGroupIds||[];
 const affiliations=[...new Set([...previous,...(artist.relatedGroupIds||[])])];
 const name=id=>{
  const group=groups instanceof Map?groups.get(id):groups.find(g=>g.id===id);
  return group?koreanArtistName(group)||group.name:id;
 };
 const kind=artist.artistType==='solo'?{id:'solo',label:'솔로'}:previous.length?{id:'redebut',label:'재데뷔'}:null;
 return [...(kind?[kind]:[]),...affiliations.map(id=>({id,label:name(id),affiliation:true}))];
}

export function directoryResults(groups,{query='',type='all',status='general',year='all',sort='az',now=Date.now(),narrowSearch=false,memberNames}={}){
 const searching=isArtistSearch(query);
 const inScope=groups.filter(g=>(type==='all'||artistCategories(g).includes(type))&&
  (searching&&status==='general'||matchesDirectoryActivity(g,status,now)));
 const matched=searching?(narrowSearch?artistsInDebutRange(inScope,year):groups).filter(g=>{
  const relatedIds=[...(g.previousGroupIds||[]),...(g.relatedGroupIds||[])];
  const relatedNames=groups.filter(group=>relatedIds.includes(group.id)).flatMap(group=>[group.name,group.nameKo,group.nameEn,...(group.aliases||[])]);
  return matchesArtistName(g,query,[...relatedNames,...careerTagsFor(g,groups).map(tag=>tag.label),...(g.memberRoster?.current||[]),...(g.memberRoster?.former||[]),...(memberNames?.get(g.id)||[])])&&(status==='general'||matchesDirectoryActivity(g,status,now));
 }):
 artistsInDebutRange(inScope,year);
 return sortGroups(matched,sort);
}
