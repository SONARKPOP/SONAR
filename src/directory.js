import {artistCategories,groupActivity,sortGroups,artistsInDebutRange} from './lib.js';

export function careerTagsFor(artist,groups){
 const previous=[...new Set(artist.previousGroupIds||[])];
 const parents=[...new Set(artist.relatedGroupIds||[])].filter(id=>!previous.includes(id));
 const name=id=>groups.find(g=>g.id===id)?.name||id;
 return [...(artist.artistType==='solo'?[{id:'solo',label:'솔로'}]:previous.length?[{id:'redebut',label:'재데뷔'}]:[]),...previous.map(id=>({id,label:`${name(id)} 출신`})),...parents.map(id=>({id,label:`${name(id)} · 솔로`}))];
}

export function directoryResults(groups,{query='',type='all',status='general',year='all',sort='az',now=Date.now()}={}){
 const needle=query.trim().toLowerCase();
 const visibleStatus=g=>status==='all'||(status==='general'?groupActivity(g,now)!=='archived':groupActivity(g,now)===status);
 const matched=needle?groups.filter(g=>[g.name,...g.aliases,...careerTagsFor(g,groups).map(t=>t.label)].join(' ').toLowerCase().includes(needle)):
 artistsInDebutRange(groups.filter(g=>(type==='all'||artistCategories(g).includes(type))&&visibleStatus(g)),year);
 return sortGroups(matched,sort);
}
