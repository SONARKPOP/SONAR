import {artistCategories,groupActivity,sortGroups,artistsInDebutRange} from './lib.js';
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

export function matchesDirectoryActivity(artist,status,now){
 if(status==='all')return true;
 const state=activityView(artist,now)?.state;
 if(status==='general')return state?state!=='LOST SIGNAL':groupActivity(artist,now)!=='archived';
 if(status==='unknown')return !state;
 if(DIRECTORY_ACTIVITY_STATES.includes(status))return state===status;
 return groupActivity(artist,now)===status;
}

export function careerTagsFor(artist,groups){
 const previous=[...new Set(artist.previousGroupIds||[])];
 const parents=[...new Set(artist.relatedGroupIds||[])].filter(id=>!previous.includes(id));
 const name=id=>groups.find(g=>g.id===id)?.name||id;
 return [...(artist.artistType==='solo'?[{id:'solo',label:'솔로'}]:previous.length?[{id:'redebut',label:'재데뷔'}]:[]),...previous.map(id=>({id,label:`${name(id)} 출신`})),...parents.map(id=>({id,label:`${name(id)} · 솔로`}))];
}

export function directoryResults(groups,{query='',type='all',status='general',year='all',sort='az',now=Date.now()}={}){
 const matched=isArtistSearch(query)?groups.filter(g=>matchesArtistName(g,query,careerTagsFor(g,groups).map(t=>t.label))&&(status==='general'||matchesDirectoryActivity(g,status,now))):
 artistsInDebutRange(groups.filter(g=>(type==='all'||artistCategories(g).includes(type))&&matchesDirectoryActivity(g,status,now)),year);
 return sortGroups(matched,sort);
}
