export const PAGE_SIZE=24;
export function monthKey(value){const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit'}).formatToParts(new Date(value));return `${parts.find(p=>p.type==='year').value}-${parts.find(p=>p.type==='month').value}`;}
export function dedupe(rows){return [...new Map(rows.map(x=>[x.id,x])).values()];}
export function filterContent(rows,{groups=[],category='home',query='',channel='',member='',subtype='',format='',year='',month='',externalType='',ownType=''}){
 const q=query.trim().toLocaleLowerCase();
 return dedupe(rows).filter(v=>(!groups.length||groups.some(g=>v.groupIds.includes(g))) && (category==='shorts'?isShortContent(v):(category==='uploads'||!isShortContent(v))&&(category==='home'||category==='uploads'||(category==='live'?v.format==='live':category===v.category||v.contentTypes?.includes(category)))) && (!q||[v.title,v.channelName,...v.tags].join(' ').toLocaleLowerCase().includes(q)) && (!channel||(v.programId||v.channelId)===channel) && (!member||v.memberIds.includes(member)) && (!subtype||v.subtypes.includes(subtype)) && (!format||v.format===format) && (!year||monthKey(v.publishedAt).slice(0,4)===year) && (!month||monthKey(v.publishedAt).slice(5,7)===month) && (!externalType||externalKind(v)===externalType) && (!ownType||ownKind(v)===ownType)).sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt));
}
export function commonChannels(rows,groups){
 const map=new Map();
 for(const v of dedupe(rows).filter(v=>(v.category==='external'||v.contentTypes?.includes('external')))){const key=v.programId||v.channelId;const x=map.get(key)||{id:key,name:v.programName||v.channelName,groups:new Set(),count:0};v.groupIds.filter(g=>!groups.length||groups.includes(g)).forEach(g=>x.groups.add(g));x.count++;map.set(x.id,x);}
 return [...map.values()].sort((a,b)=>b.groups.size-a.groups.size||b.count-a.count||a.name.localeCompare(b.name));
}
export function activeLives(feed,channels,now=Date.now()){
 const updated=Date.parse(feed.updatedAt);
 if(!Number.isFinite(updated)||now-updated>30*60*1000||updated>now+60000)return [];
 return feed.items.filter(v=>!v.demo&&v.liveStatus==='live'&&v.actualStartTime&&!v.actualEndTime&&channels.some(c=>c.id===v.channelId&&c.official&&v.groupIds.some(g=>c.groupIds.includes(g))));
}
export function loadSaved(storage,key,fallback){try{const v=JSON.parse(storage.getItem(key));return Array.isArray(v)&&v.every(x=>typeof x==='string')?v:fallback;}catch{return fallback;}}
export function groupPreferences(storage,catalog){
 const available=new Set(catalog.groups.map(g=>g.id));
 const defaults=(catalog.defaultGroupIds||[]).filter(id=>available.has(id));
 const saved=[...new Set((loadSaved(storage,'sonar.groups.v2',null)??defaults).filter(id=>available.has(id)))];
 const selected=[...new Set((loadSaved(storage,'sonar.selected.v2',null)??saved).filter(id=>saved.includes(id)))];
 return {saved,selected};
}
export function favoriteGroupSelection(storage,catalog){
 return [...new Set(loadSaved(storage,'sonar.favorite-groups.v1',[]).filter(id=>catalog.groups.some(g=>g.id===id)))];
}
export function selectionReducer(state,action){
 if(action.type==='hydrate')return {selected:[...new Set(action.selected)]};
 let next;
 if(action.type==='toggle')next=state.selected.includes(action.id)?state.selected.filter(id=>id!==action.id):[...state.selected,action.id];
 else if(action.type==='add')next=[...new Set([...state.selected,...action.ids])];
 else if(action.type==='remove')next=state.selected.filter(id=>!action.ids.includes(id));
 else if(action.type==='change')next=[...new Set(action.ids)];
 else return state;
 if(next.length===state.selected.length&&next.every(id=>state.selected.includes(id)))return state;
 return {selected:next};
}

const GROUP_COLORS=['#729ca8','#aa8eae','#8ea782','#b69a76','#8d99bd','#b88491','#78a69a','#aa9e72','#918ab3','#81a1bc','#b39481','#90aaa0','#a58d9b','#9aab73','#ac997f','#b0a2bf','#91b0ae','#bd9b9f','#a1ac90'];
export function favoriteColorPreferences(storage,catalog){
 let saved={};try{const value=JSON.parse(storage.getItem('sonar.favorite-colors.v1'));if(value&&!Array.isArray(value)&&typeof value==='object')saved=value;}catch{}
 return Object.fromEntries(catalog.groups.map((g,i)=>[g.id,/^#[0-9a-f]{6}$/i.test(saved[g.id]||'')?saved[g.id]:GROUP_COLORS[i%GROUP_COLORS.length]]));
}
export function themePreference(storage,systemDark=false){try{const value=storage.getItem('sonar.theme.v1');if(value==='light'||value==='dark')return value;}catch{}return systemDark?'dark':'light';}
export function favoriteCardStyle(ids,favorites,colors,theme){
 const id=ids.find(id=>favorites.includes(id));if(!id)return undefined;
 const hex=/^#[0-9a-f]{6}$/i.test(colors[id]||'')?colors[id]:'#729ca8';
 const accent=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
 const dark=theme==='dark',base=dark?[23,36,52]:[255,255,255];
 const blend=weight=>`rgb(${base.map((n,i)=>Math.round(n*(1-weight)+accent[i]*weight)).join(', ')})`;
 return {backgroundColor:blend(dark?.32:.24),borderColor:blend(dark?.70:.58),boxShadow:`inset 0 4px 0 ${blend(dark?.90:.85)}, 0 3px 10px #16365308`};
}

export const FAVORITE_PRESETS=['heart','star','clover'];
export function favoritePresetPreferences(storage,catalog){
 let data=null,active='star';try{data=JSON.parse(storage.getItem('sonar.favorite-presets.v1'));const value=storage.getItem('sonar.favorite-preset-active.v1');if(FAVORITE_PRESETS.includes(value))active=value;}catch{}
 const valid=ids=>[...new Set((Array.isArray(ids)?ids:[]).filter(id=>catalog.groups.some(g=>g.id===id)))];
 const presets=Object.fromEntries(FAVORITE_PRESETS.map(key=>[key,valid(data?.[key])]));
 if(!data||typeof data!=='object'||Array.isArray(data))presets.star=favoriteGroupSelection(storage,catalog);
 return {presets,active};
}

export function excludedGroupPreferences(storage,catalog){return [...new Set(loadSaved(storage,'sonar.excluded-groups.v1',[]).filter(id=>catalog.groups.some(g=>g.id===id)))];}
export function withoutExcludedGroups(rows,excluded){return rows.filter(row=>!row.groupIds.some(id=>excluded.includes(id)));}

export function prioritizeGroups(groups,preferred){const ids=new Set(preferred);return [...groups.filter(g=>ids.has(g.id)),...groups.filter(g=>!ids.has(g.id))];}

export const EXTERNAL_TYPES=[['song','노래·퍼포먼스'],['radio','라디오'],['variety','예능'],['interview','인터뷰'],['ad','광고·홍보'],['other','기타·미분류']];
export function externalKind(v){
 if(EXTERNAL_TYPES.some(([id])=>id===v.externalType))return v.externalType;
 const text=[v.title,...(v.subtypes||[]),...(v.tags||[])].join(' ');
 if(/라디오|radio/i.test(text))return 'radio';
 if(/광고|홍보|commercial|campaign|\bCF\b/i.test(text))return 'ad';
 if(/인터뷰|interview/i.test(text))return 'interview';
 if(/예능|variety/i.test(text))return 'variety';
 if(/퍼포먼스|커버|노래|performance|cover|it's live|리무진서비스|릴레이댄스/i.test(text))return 'song';
 return 'other';
}

export function uploadDays(rows){
 const groups=new Map();
 for(const row of rows){const date=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(row.publishedAt));if(!groups.has(date))groups.set(date,[]);groups.get(date).push(row);}
 return [...groups].sort(([a],[b])=>b.localeCompare(a)).map(([date,items])=>({date,items}));
}

export function uploadKind(row){return row.format==='live'?'live':row.format==='short'?'short':(['own','external'].includes(row.category)||row.contentTypes?.some(t=>['own','external'].includes(t)))?'long':null;}
export function uploadGroupSummary(rows,selected){
 return selected.map(id=>({id,live:[],short:[],long:[]})).map(group=>{for(const row of rows){const kind=uploadKind(row);if(kind&&row.groupIds.includes(group.id))group[kind].push(row);}return group;}).filter(group=>group.live.length+group.short.length+group.long.length);
}

export const OWN_TYPES=[['behind','비하인드'],['daily','일상·브이로그'],['variety','자체 예능'],['practice','연습·퍼포먼스'],['other','기타·미분류']];
export function ownKind(v){
 if(OWN_TYPES.some(([id])=>id===v.ownType))return v.ownType;
 const text=[v.title,...(v.subtypes||[]),...(v.tags||[])].join(' ');
 if(/behind|비하인드|making|메이킹/i.test(text))return 'behind';
 if(/vlog|브이로그|일상|휴가/i.test(text))return 'daily';
 if(/practice|연습|퍼포먼스|performance/i.test(text))return 'practice';
 if(/예능|게임|챌린지|challenge/i.test(text))return 'variety';
 return 'other';
}

export function allGroupSelection(saved,available,active){return {saved:active?[...saved]:[...new Set([...saved,...available])],selected:active?[]:[...available]};}

export function sortGroups(groups,mode='default'){
 const compare=(a,b)=>a.name.localeCompare(b.name,'en',{sensitivity:'base',numeric:true})||a.id.localeCompare(b.id);
 if(mode==='az')return [...groups].sort(compare);
 if(mode==='debut-asc'||mode==='debut-desc')return [...groups].sort((a,b)=>{const ay=Number.isInteger(a.debutYear)?a.debutYear:null,by=Number.isInteger(b.debutYear)?b.debutYear:null;if(ay===null&&by!==null)return 1;if(by===null&&ay!==null)return -1;return (ay===null?0:(mode==='debut-desc'?by-ay:ay-by))||compare(a,b);});
 return [...groups];
}

export const ARTIST_CATEGORIES=[['all','전체'],['girl','여자 아이돌'],['mixed','혼성 아이돌'],['boy','남자 아이돌'],['duo-solo','듀오·솔로']];
export function artistCategory(artist){return ['duo','solo'].includes(artist.artistType)?'duo-solo':artist.gender;}
export function artistsInCategory(artists,category){return artists.filter(a=>category==='all'||artistCategory(a)===category);}
export function recommendedArtists(artists,chosen,excluded,category='all',limit=4){return artistsInCategory(artists,category).filter(a=>!chosen.includes(a.id)&&!excluded.includes(a.id)).sort((a,b)=>(b.contentCount||0)-(a.contentCount||0)||a.name.localeCompare(b.name,'en',{sensitivity:'base'})).slice(0,limit);}

export function excludedArtistIds(artists,individual,blockedTypes,allowed,protectedIds=[]){
 return artists.filter(a=>!protectedIds.includes(a.id)&&!allowed.includes(a.id)&&(individual.includes(a.id)||blockedTypes.includes(artistCategory(a)))).map(a=>a.id);
}
export function updateGroupMembership(saved,selected,ids,enabled){
 return enabled?{saved:[...new Set([...saved,...ids])],selected:[...new Set([...selected,...ids])]}:{saved:saved.filter(id=>!ids.includes(id)),selected:selected.filter(id=>!ids.includes(id))};
}
export const DISPLAY_ARTIST_TYPES=['girl','boy','mixed','duo-solo'];
export function enabledArtistTypePreferences(storage){const ids=[...new Set(loadSaved(storage,'sonar.enabled-artist-types.v1',DISPLAY_ARTIST_TYPES).filter(id=>DISPLAY_ARTIST_TYPES.includes(id)))];return ids.length?ids:[...DISPLAY_ARTIST_TYPES];}
export function toggleArtistType(current,id){if(!DISPLAY_ARTIST_TYPES.includes(id))return current;if(current.includes(id))return current.length===1?current:current.filter(type=>type!==id);return [...current,id];}
export function visibleArtistIds(artists,ids,types,excluded=[]){const lookup=new Map(artists.map(a=>[a.id,a]));return ids.filter(id=>lookup.has(id)&&types.includes(artistCategory(lookup.get(id)))&&!excluded.includes(id));}
export function debutYearRanges(artists){const starts=[...new Set(artists.filter(a=>Number.isInteger(a.debutYear)).map(a=>Math.floor(a.debutYear/5)*5))].sort((a,b)=>a-b);return starts.map(start=>({id:String(start),label:`${start}–${start+4}`}));}
export function artistsInDebutRange(artists,range){if(range==='all')return artists;if(range==='unknown')return artists.filter(a=>!Number.isInteger(a.debutYear));const start=Number(range);return artists.filter(a=>Number.isInteger(a.debutYear)&&a.debutYear>=start&&a.debutYear<start+5);}
export function monthsAfter(value,months){
 const date=new Date(value);if(!Number.isFinite(date.getTime()))return NaN;
 const target=new Date(date);target.setUTCDate(1);target.setUTCMonth(target.getUTCMonth()+months);
 const last=new Date(Date.UTC(target.getUTCFullYear(),target.getUTCMonth()+1,0)).getUTCDate();
 target.setUTCDate(Math.min(date.getUTCDate(),last));return target.getTime();
}
export function groupActivity(group,now=Date.now()){
 const last=Date.parse(group?.lastOfficialUploadAt);if(!Number.isFinite(last)||last>now)return 'unknown';
 if(now>=monthsAfter(last,12))return 'archived';
 if(now>=monthsAfter(last,6))return 'inactive';
 return 'active';
}
export function activityLabel(group,now=Date.now()){
 const state=groupActivity(group,now);
 return {archived:'활동정지',inactive:'비활성',active:'활동 중',unknown:group?.officialSourceConnected?'업로드 확인 대기':'공식 채널 확인 대기'}[state];
}
export function activityDirectory(groups,archived=false,now=Date.now()){
 return groups.filter(g=>(groupActivity(g,now)==='archived')===archived);
}

// A duration fallback groups untagged short clips without claiming YouTube's
// unavailable vertical-video metadata. Live streams always retain their type.
export function isShortContent(video){
 if(video.format==='short'||video.category==='shorts')return true;
 if(video.format==='live'||['live','upcoming','ended'].includes(video.liveStatus))return false;
 const value=String(video.durationLabel||'').toLowerCase().replace(/^pt/,'');
 const match=value.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+(?:\.\d+)?)s)?$/);
 const seconds=match&&value?Number(match[1]||0)*3600+Number(match[2]||0)*60+Number(match[3]||0):NaN;
 return seconds>0&&seconds<=60;
}
export function modalHistory(history,target,onBack,token){
 const previous=history.state;
 history.pushState({...previous,sonarVideoModal:token},'');
 const pop=()=>{if(history.state?.sonarVideoModal!==token)onBack();};
 target.addEventListener('popstate',pop);
 return ()=>{target.removeEventListener('popstate',pop);if(history.state?.sonarVideoModal===token)history.back();};
}
