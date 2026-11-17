import StationDirectory from './StationDirectory';
import ContentPeriodFilter from './ContentPeriodFilter';
import useFilterHistory from './useFilterHistory';
import FeedbackLink from './FeedbackLink';
import React,{useEffect,useMemo,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Search,Plus,X,Radio,Home,Music2,Clapperboard,Layers,CalendarDays,Play,ArrowUpRight,ChevronLeft,ChevronRight,Menu,Disc3,Star,Moon,Sun,Heart,Sprout,Smartphone,Copy,Tv,Minus,Maximize2} from 'lucide-react';
import {PAGE_SIZE,filterContent,commonChannels,activeLives,monthKey,favoriteColorPreferences,favoriteCardStyle,themePreference,favoritePresetPreferences,excludedGroupPreferences,EXTERNAL_TYPES,uploadDays,uploadKind,uploadGroupSummary,OWN_TYPES,ARTIST_CATEGORIES,artistCategories,excludedArtistIds,loadSaved,DISPLAY_ARTIST_TYPES,modalHistory} from './lib';
import './style.css';
import './activity-ui.css';
import './video-viewer.css';
import UnifiedDirectory from './UnifiedDirectory';
import AdjustablePlayer from './AdjustablePlayer';
import ShortSwipeArea from './ShortSwipeArea';
import {videoAspect,videoQueue,adjacentVideos,playlistKeyDirection} from './player-playlist';
import {PreferenceDragHandle} from './ArtistPolicyDialog';
import FavoritesSidebar from './FavoritesSidebar';
import {ACTIVE_BROWSE_STATES} from './youtube-activity';
import AnalysisPage from './AnalysisRoute';
import {hardBlockContent,softBlockContent,favoriteContent,favoriteArtistIds,browsingArtistIds,visibleLiveRows,bulkViewingChecks} from './artist-insights';
import VideoCard from './VideoCard';
import ContentSections from './ContentSections';
import {WorkspaceNavigation,ContentSearch,HomeOverview,ExternalExplorer} from './BrowseWorkspace';
import {createDataClient} from './data';
import {videoSourceUrl,mergePlatformRows,currentChzzkLives} from './platforms';
import {useGroupVideos} from './useGroupVideos';
import {archiveRequest,balancedPreview} from './browse';
import {LANGUAGES,LanguageContext,localize,readScreenPreference,translate,formatMessage} from './i18n';
import './ui-polish.css';
const base=import.meta.env.BASE_URL;
const {json,cache}=createDataClient({base});
const presetOptions=[['heart','하트',Heart],['star','별',Star],['clover','새싹',Sprout]];
const menus=[['all','전체',Layers],['music','MUSIC',Music2],['broadcast','음악방송',Tv],['radio','RADIO',Radio],['own','자체콘텐츠',Clapperboard],['external','외부콘텐츠',Layers],['shorts','쇼츠',Play],['station','라이브스테이션',Disc3],['uploads','업로드달력',CalendarDays]];
function scrollToVideos(){requestAnimationFrame(()=>{const target=document.getElementById('collection');if(!target)return;const bounds=document.querySelector('.adjustable-player')?.getBoundingClientRect();target.style.scrollMarginTop=`${bounds&&bounds.top<=48?bounds.bottom+12:12}px`;target.scrollIntoView({block:'start'});});}
function DataRefreshTime({value}){
 const date=new Date(value||'');
 if(!Number.isFinite(date.getTime()))return null;
 const options={timeZone:'Asia/Seoul',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'};
 const clock=new Intl.DateTimeFormat('ko-KR',options).format(date);
 const full=new Intl.DateTimeFormat('ko-KR',{...options,year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
 return <details className="data-refresh-time"><summary>갱신 {clock} KST</summary><time dateTime={value}>{full} KST</time></details>;
}
function App(){
 const [directoryPage,setDirectoryPage]=useState(()=>window.location.hash==='#artists');
 const [recordsPage,setRecordsPage]=useState(()=>window.location.hash==='#records');
 const [contentSection,setContentSection]=useState(''),[broadcaster,setBroadcaster]=useState('');
 const [analysisPage,setAnalysisPage]=useState(()=>window.location.hash==='#analysis');
 const [favoriteScope,setFavoriteScope]=useState(()=>readScreenPreference('sonar.favorite-scope.v1',['all','active'],'all'));
 const [activeBrowseStates,setActiveBrowseStates]=useState(()=>loadSaved({getItem:key=>localStorage.getItem(key)},'sonar.active-browse-states.v1',ACTIVE_BROWSE_STATES).filter(state=>ACTIVE_BROWSE_STATES.includes(state)));
 useEffect(()=>{try{localStorage.setItem('sonar.active-browse-states.v1',JSON.stringify(activeBrowseStates));}catch{}},[activeBrowseStates]);
 const [mutedArtists,setMutedArtists]=useState(()=>loadSaved({getItem:key=>localStorage.getItem(key)},'sonar.muted-artists.v1',[]));
 const [hardBlocked,setHardBlocked]=useState(()=>loadSaved({getItem:key=>localStorage.getItem(key)},'sonar.hard-blocked.v1',[]));
 useEffect(()=>{try{localStorage.setItem('sonar.hard-blocked.v1',JSON.stringify(hardBlocked));localStorage.setItem('sonar.muted-artists.v1',JSON.stringify(mutedArtists));localStorage.setItem('sonar.favorite-scope.v1',favoriteScope);}catch{}},[hardBlocked,mutedArtists,favoriteScope]);
 const [groupsPage,setGroupsPage]=useState(()=>window.location.hash==='#groups');
 useEffect(()=>{const sync=()=>{setRecordsPage(window.location.hash==='#records');setAnalysisPage(window.location.hash==='#analysis');setDirectoryPage(window.location.hash==='#artists');setGroupsPage(window.location.hash==='#groups');};window.addEventListener('hashchange',sync);return()=>window.removeEventListener('hashchange',sync);},[]);
 const enabledArtistTypes=DISPLAY_ARTIST_TYPES;
 const [language,setLanguage]=useState(()=>readScreenPreference('sonar.language.v1',['ko','ja','en','es'],'ko'));
 const [collapsed,setCollapsed]=useState(()=>readScreenPreference('sonar.sidebar.v1',['expanded','collapsed'],'expanded')==='collapsed');
 useEffect(()=>{document.documentElement.lang=language;try{localStorage.setItem('sonar.language.v1',language);localStorage.setItem('sonar.sidebar.v1',collapsed?'collapsed':'expanded');}catch{}},[language,collapsed]);
 const [catalog,setCatalog]=useState(null),[feed,setFeed]=useState({items:[]}),[error,setError]=useState(''),[retry,setRetry]=useState(0),[clock,setClock]=useState(Date.now());
 const [platformVideos,setPlatformVideos]=useState([]),[chzzkFeed,setChzzkFeed]=useState({items:[]});
 const [preferencesReady,setPreferencesReady]=useState(false);
 const [category,setCategory]=useState('home'),[query,setQuery]=useState(''),[channel,setChannel]=useState(''),[member,setMember]=useState(''),[subtype,setSubtype]=useState(''),[format,setFormat]=useState('');
 const sidebarSearchRef=useRef(null);
 const [livePanel,setLivePanel]=useState(false);
 const liveStatusRef=useRef(null),liveStatusButtonRef=useRef(null);
 const [uploadExpansion,setUploadExpansion]=useState('');
 const [filterGroup,setFilterGroup]=useState('');
 const [archiveYear,setArchiveYear]=useState(''),[archiveMonth,setArchiveMonth]=useState(''),[externalType,setExternalType]=useState(''),[ownType,setOwnType]=useState('');
 const [page,setPage]=useState(1),[indexRetry,setIndexRetry]=useState(0);
 const [archiveProgress,setArchiveProgress]=useState({key:'',pages:0,months:0});
 const [includeIndividual]=useState(()=>readScreenPreference('sonar.individual-activity.v1',['on','off'],'on')==='on');
 useEffect(()=>{try{localStorage.setItem('sonar.individual-activity.v1',includeIndividual?'on':'off');}catch{}},[includeIndividual]);
 const [add,setAdd]=useState(false),[playing,setPlaying]=useState(null),[mobile,setMobile]=useState(false);
 const [favoritePresets,setFavoritePresets]=useState({heart:[],star:[],clover:[]});
 const [viewPresets,setViewPresets]=useState(()=>loadSaved({getItem:key=>localStorage.getItem(key)},'sonar.favorite-view.v1',[]).filter(key=>['heart','star','clover'].includes(key)));
 useEffect(()=>{try{localStorage.setItem('sonar.favorite-view.v1',JSON.stringify(viewPresets));}catch{}},[viewPresets]);
 const [favoriteColors,setFavoriteColors]=useState({});
 const [individualExcluded,setIndividualExcluded]=useState([]),[blockedTypes,setBlockedTypes]=useState([]),[allowedGroups,setAllowedGroups]=useState([]);
 const protectedGroups=useMemo(()=>[...new Set(Object.values(favoritePresets).flat())],[favoritePresets]);
 const excludedGroups=useMemo(()=>excludedArtistIds(catalog?.groups||[],individualExcluded,blockedTypes,allowedGroups,favoriteArtistIds(catalog,protectedGroups)),[catalog,individualExcluded,blockedTypes,allowedGroups,protectedGroups]);
 const favoriteIdsForView=useMemo(()=>[...new Set(viewPresets.flatMap(key=>favoritePresets[key]))],[viewPresets,favoritePresets]);
 const selected=useMemo(()=>browsingArtistIds(catalog,{types:enabledArtistTypes,excluded:excludedGroups,muted:mutedArtists,hardBlocked,favoriteIds:favoriteIdsForView,favoritesOnly:Boolean(viewPresets.length),activeOnly:favoriteScope==='active',activeStates:activeBrowseStates,now:clock}),[catalog,enabledArtistTypes,excludedGroups,hardBlocked,mutedArtists,viewPresets,favoriteIdsForView,favoriteScope,activeBrowseStates,clock]);
 useFilterHistory({category,query,channel,member,subtype,format,filterGroup,archiveYear,archiveMonth,externalType,ownType,contentSection,broadcaster,favoriteScope,viewPresets,mutedArtists,activeBrowseStates},snapshot=>{
  const setters={category:setCategory,query:setQuery,channel:setChannel,member:setMember,subtype:setSubtype,format:setFormat,filterGroup:setFilterGroup,archiveYear:setArchiveYear,archiveMonth:setArchiveMonth,externalType:setExternalType,ownType:setOwnType,contentSection:setContentSection,broadcaster:setBroadcaster,favoriteScope:setFavoriteScope,viewPresets:setViewPresets,mutedArtists:setMutedArtists,activeBrowseStates:setActiveBrowseStates};
  for(const [key,setter]of Object.entries(setters))if(Object.hasOwn(snapshot,key))setter(snapshot[key]);
 },preferencesReady);
 const toggleHardBlocked=id=>setHardBlocked(ids=>ids.includes(id)?ids.filter(value=>value!==id):[...ids,id]);
 useEffect(()=>{if(filterGroup&&catalog&&!catalog.groups.some(g=>g.id===filterGroup)){setFilterGroup('');setMember('');}},[catalog,filterGroup]);

 const [theme,setTheme]=useState(()=>themePreference({getItem:key=>localStorage.getItem(key)},window.matchMedia?.('(prefers-color-scheme: dark)').matches));
 useEffect(()=>{document.documentElement.dataset.theme=theme;try{localStorage.setItem('sonar.theme.v1',theme);}catch{}},[theme]);
 const modalRef=useRef(null),previousFocus=useRef(null);
 const hasPlayer=Boolean(playing);
 useEffect(()=>{if(!hasPlayer)return;return modalHistory(window.history,window,()=>setPlaying(null),`sonar-player-${Date.now()}`);},[hasPlayer]);
 useEffect(()=>{if(!add)return;return modalHistory(window.history,window,()=>setAdd(false),`sonar-editor-${Date.now()}`);},[add]);
 useEffect(()=>{
  if(!add)return;
  previousFocus.current=document.activeElement;
  modalRef.current?.focus();
  const key=event=>{
   const modal=modalRef.current;
   if(!modal||modal.querySelector('dialog[open]'))return;
   if(event.key==='Escape')setAdd(false);
   if(event.key!=='Tab')return;
   const focusable=[...modal.querySelectorAll('button,input,select,a,iframe,[tabindex="0"]')]
    .filter(element=>!element.disabled&&element.getClientRects().length>0);
   if(!focusable.length)return;
   const first=focusable[0],last=focusable.at(-1);
   if(event.shiftKey&&(document.activeElement===first||document.activeElement===modal)){
    event.preventDefault();last.focus();
   }else if(!event.shiftKey&&document.activeElement===last){
    event.preventDefault();first.focus();
   }
  };
  document.addEventListener('keydown',key);
  return()=>{document.removeEventListener('keydown',key);previousFocus.current?.focus();};
 },[add]);
 useEffect(()=>{let cancelled=false;Promise.all([json('catalog.json'),json('live.json').catch(()=>({items:[]}))]).then(([c,l])=>{if(cancelled)return;c={...c,groups:c.groups.filter(g=>g.directoryVisibility!=='agency-only')};const favorites=favoritePresetPreferences({getItem:key=>localStorage.getItem(key)},c);setFavoritePresets(favorites.presets);setFavoriteColors(favoriteColorPreferences({getItem:key=>localStorage.getItem(key)},c));setIndividualExcluded(excludedGroupPreferences({getItem:key=>localStorage.getItem(key)},c));setBlockedTypes(loadSaved({getItem:key=>localStorage.getItem(key)},'sonar.blocked-artist-types.v1',[]).filter(id=>ARTIST_CATEGORIES.some(([key])=>key===id&&key!=='all')));setAllowedGroups(loadSaved({getItem:key=>localStorage.getItem(key)},'sonar.allowed-groups.v1',[]).filter(id=>c.groups.some(g=>g.id===id)));setCatalog(c);setFeed(l);setPreferencesReady(true);}).catch(e=>{if(!cancelled){setError(e.message);}});return()=>{cancelled=true;};},[retry]);
 useEffect(()=>{
  let stopped=false;
  const refresh=()=>{
   cache.delete('chzzk-live.json');
   json('chzzk-live.json').then(value=>{if(!stopped)setChzzkFeed(value);}).catch(()=>{});
  };
  json('platform-content.json').then(value=>{if(!stopped)setPlatformVideos(value.items||[]);}).catch(()=>{});
  refresh();
  const timer=setInterval(refresh,60000);
  return()=>{stopped=true;clearInterval(timer);};
 },[]);
 useEffect(()=>{const timer=setInterval(()=>{setClock(Date.now());cache.delete('live.json');json('live.json').then(setFeed).catch(()=>{});},60000);return()=>clearInterval(timer);},[]);
 useEffect(()=>{let cancelled=false;const refresh=()=>{cache.delete('catalog.json');json('catalog.json').then(value=>{if(cancelled)return;setCatalog(previous=>{if(previous?.updatedAt===value.updatedAt)return previous;for(const key of cache.keys())if(key.startsWith('groups/')||key.startsWith('browse/')||key==='latest.json')cache.delete(key);return {...value,groups:value.groups.filter(group=>group.directoryVisibility!=='agency-only')};});}).catch(()=>{});};const timer=setInterval(refresh,300000);return()=>{cancelled=true;clearInterval(timer);};},[]);
 useEffect(()=>{if(!preferencesReady)return;try{
  localStorage.setItem('sonar.favorite-presets.v1',JSON.stringify(favoritePresets));
  localStorage.setItem('sonar.favorite-colors.v1',JSON.stringify(favoriteColors));
  localStorage.setItem('sonar.excluded-groups.v1',JSON.stringify(individualExcluded));
 }catch{/* Browsing still works when storage is unavailable. */}},[favoritePresets,favoriteColors,individualExcluded,preferencesReady]);
 const indexGroups=filterGroup&&selected.includes(filterGroup)?[filterGroup]:selected;
 const indexKey=indexGroups.join(',');
 const browse=catalog?.browse;
 const browseKey=[indexKey,category,archiveYear,archiveMonth,query,channel,member,subtype,format,externalType,ownType,includeIndividual].join('|');
 const progress=archiveProgress.key===browseKey?archiveProgress:{pages:0,months:0};
 const request=archiveRequest(browse,indexGroups,category,archiveYear,archiveMonth,progress);
 const indexesEnabled=Boolean(catalog)&&!directoryPage&&!groupsPage&&!analysisPage&&!recordsPage&&category!=='station';
 const {rows:youtubeRows,failed:indexFailures,loading:indexLoading}=useGroupVideos(json,request.paths,{
  enabled:indexesEnabled,version:catalog?.updatedAt,retry:indexRetry
 });
 const platformLives=useMemo(()=>currentChzzkLives(chzzkFeed,clock),[chzzkFeed,clock]);
 const rows=useMemo(()=>favoriteContent(softBlockContent(hardBlockContent(mergePlatformRows(youtubeRows,[...platformVideos,...platformLives]),hardBlocked,catalog||{}),[...excludedGroups,...individualExcluded.filter(id=>!protectedGroups.includes(id)&&!allowedGroups.includes(id))],protectedGroups),viewPresets.length?favoriteIdsForView:[],catalog||{}),[youtubeRows,platformVideos,platformLives,hardBlocked,catalog,excludedGroups,individualExcluded,protectedGroups,allowedGroups,viewPresets,favoriteIdsForView]);
 const loading=!catalog&&!error||indexesEnabled&&indexLoading&&!rows.length;
 const artistNames=useMemo(()=>new Map((catalog?.groups||[]).map(group=>[
  group.id,[group.name,group.nameKo,group.nameEn,...(group.aliases||[])].filter(Boolean)
 ])),[catalog]);
 useEffect(()=>{setPage(1);},[selected.join(','),category,query,channel,member,subtype,format,archiveYear,archiveMonth,externalType,ownType,filterGroup,includeIndividual,contentSection,broadcaster]);
 const livePolicy=useMemo(()=>({types:enabledArtistTypes,hardBlocked,excluded:excludedGroups,favorites:protectedGroups}),[enabledArtistTypes,hardBlocked,excludedGroups,protectedGroups]);
 const filtered=useMemo(()=>selected.length?filterContent(rows,{groups:filterGroup?[filterGroup]:selected,category,query,channel,member,subtype,format,year:archiveYear,month:archiveMonth,includeIndividual,artistNames,externalType:category==='external'?externalType:'',ownType:category==='own'?ownType:'',section:contentSection,broadcaster}):[],[rows,selected,category,query,channel,member,subtype,format,archiveYear,archiveMonth,externalType,ownType,filterGroup,includeIndividual,artistNames,contentSection,broadcaster]);
 const sectionRows=useMemo(()=>filterContent(rows,{groups:filterGroup?[filterGroup]:selected,category,query,member,year:archiveYear,month:archiveMonth,includeIndividual,artistNames,section:contentSection}),[rows,selected,category,query,member,archiveYear,archiveMonth,includeIndividual,artistNames,filterGroup,contentSection]);
 const calendarRows=filtered.filter(v=>uploadKind(v));
 const compactBrowse=Boolean(browse)&&category!=='station'&&category!=='uploads';
 const shownCount=request.limit+progress.pages*12;
 const byId=new Map(filtered.map(video=>[video.id,video]));
 const firstRows=progress.pinnedIds?.map(id=>byId.get(id)).filter(Boolean)||
  (request.preview?balancedPreview(filtered,indexGroups,request.limit,category==='shorts'?3:4,includeIndividual):[]);
 const firstIds=new Set(firstRows.map(video=>video.id));
 const pageRows=compactBrowse?[...firstRows,...filtered.filter(video=>!firstIds.has(video.id))].slice(0,shownCount):
  filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
 const showMore=Boolean(browse)&&(request.hasMore||(compactBrowse&&filtered.length>shownCount));
 const moreVideos=()=>setArchiveProgress({
  key:browseKey,pages:progress.pages+1,pinnedIds:pageRows.map(video=>video.id),months:(category==='uploads'||filtered.length<=shownCount)&&request.hasMore?
   (request.monthCount||0)+1:progress.months
 });
 const lives=catalog?visibleLiveRows([...activeLives(feed,catalog.channels,clock),...platformLives],catalog,livePolicy):[];
 useEffect(()=>{if(!livePanel)return;const dismiss=e=>{if(!liveStatusRef.current?.contains(e.target))setLivePanel(false);};const escape=e=>{if(e.key==='Escape'){setLivePanel(false);liveStatusButtonRef.current?.focus();}};document.addEventListener('pointerdown',dismiss);document.addEventListener('keydown',escape);return()=>{document.removeEventListener('pointerdown',dismiss);document.removeEventListener('keydown',escape);};},[livePanel]);
 useEffect(()=>{if(!lives.length)setLivePanel(false);},[lives.length]);
 const channels=useMemo(()=>selected.length?commonChannels(filterContent(
  rows,
  {groups:filterGroup?[filterGroup]:selected,category:'external',query,member,subtype,format,
   year:archiveYear,month:archiveMonth,includeIndividual,artistNames,externalType,section:contentSection}
 ),filterGroup?[filterGroup]:selected):[],
 [rows,selected,filterGroup,query,member,subtype,format,archiveYear,archiveMonth,includeIndividual,artistNames,externalType,contentSection]);
 const archiveYears=useMemo(()=>{
  const groups=(catalog?.groups||[]).filter(group=>indexGroups.includes(group.id));
  const years=groups.flatMap(group=>group.archiveYears||[]);
  return [...new Set(years.length?years:rows.map(video=>monthKey(video.publishedAt).slice(0,4)))].sort().reverse();
 },[catalog,indexKey,rows]);
 const toggleFavorite=(key,id)=>{
  if(!favoritePresets[key].includes(id))setIndividualExcluded(ids=>ids.filter(value=>value!==id));
  setFavoritePresets(p=>({...p,[key]:p[key].includes(id)?p[key].filter(value=>value!==id):[...p[key],id]}));
 };
 const toggleExcluded=id=>{if(!individualExcluded.includes(id)){setAllowedGroups(ids=>ids.filter(value=>value!==id));setFavoritePresets(p=>Object.fromEntries(Object.entries(p).map(([key,ids])=>[key,ids.filter(value=>value!==id)])));}setIndividualExcluded(ids=>ids.includes(id)?ids.filter(value=>value!==id):[...ids,id]);};
 const openGroups=()=>setAdd(true);
 const openGroupEditor=openGroups;
 const go=id=>{if(directoryPage||groupsPage||analysisPage||recordsPage)window.location.hash='collection';if(id==='uploads'&&!archiveYear&&!archiveMonth){const newest=[...rows].sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt))[0];const period=monthKey(newest?.publishedAt||Date.now());setArchiveYear(period.slice(0,4));setArchiveMonth(period.slice(5,7));}setCategory(id);setContentSection('');setBroadcaster('');setOwnType('');setExternalType('');setChannel('');setMember('');setSubtype('');setFormat('');setMobile(false);};
 const [embedLoading,setEmbedLoading]=useState(false);
 const [playerMinimized,setPlayerMinimized]=useState(false);
 const [playerRows,setPlayerRows]=useState([]);
 const allowedPlayerRows=useMemo(()=>hardBlockContent(playerRows,hardBlocked,catalog||{}),[playerRows,hardBlocked,catalog]);
 const adjacent=adjacentVideos(allowedPlayerRows,playing?.id);
 const playerAspect=videoAspect(playing);
 const stepVideo=direction=>{const video=direction>0?adjacent.next:adjacent.previous;if(video){setPlayerMinimized(false);setEmbedLoading(!video.demo);setPlaying(video);setShareStatus('');}};
 useEffect(()=>{if(!playing||playing.demo)return;const link=document.createElement('link');link.rel='preconnect';link.href='https://www.youtube-nocookie.com';document.head.appendChild(link);return()=>link.remove();},[playing?.id]);
 useEffect(()=>{if(!playing||playerAspect>=1)return;const key=event=>{const direction=playlistKeyDirection(event);if(direction){event.preventDefault();stepVideo(direction);}};document.addEventListener('keydown',key);return()=>document.removeEventListener('keydown',key);},[playing?.id,playerAspect,adjacent.previous?.id,adjacent.next?.id]);
 const [shareStatus,setShareStatus]=useState('');
 const shareTimer=useRef(null);
 useEffect(()=>()=>clearTimeout(shareTimer.current),[]);
 const copyVideoUrl=async()=>{try{await navigator.clipboard.writeText(`https://www.youtube.com/watch?v=${encodeURIComponent(playing.platformId)}`);setShareStatus('영상 주소를 복사했습니다.');}catch{setShareStatus('복사하지 못했습니다. YouTube에서 열어 주소를 복사해주세요.');}clearTimeout(shareTimer.current);shareTimer.current=setTimeout(()=>setShareStatus(''),4000);};
 const open=v=>{
  if(v.platform&&v.platform!=='youtube'){
   const url=videoSourceUrl(v);
   if(url)window.open(url,'_blank','noopener,noreferrer');
   return;
  }
  setPlayerRows(videoQueue(pageRows.some(row=>row.id===v.id)?pageRows:calendarRows.some(row=>row.id===v.id)?calendarRows:lives,v));
  setMobile(false);setPlayerMinimized(false);if(v.id!==playing?.id){setEmbedLoading(!v.demo);setPlaying(v);setShareStatus('');}};
 const groupsById=useMemo(()=>new Map((catalog?.groups||[]).map(group=>[group.id,group])),[catalog]);
 const groupName=id=>groupsById.get(id)?.name||id;
 const calendarGroupName=group=>{
  const names=group.related.size?[...group.related].map(id=>'前 '+groupName(id)):
   (catalog?.members||[]).filter(member=>member.groupId===group.id&&group.members.has(member.id)).map(member=>member.name);
  return groupName(group.id)+(names.length?' ('+names.join(', ')+')':'');
 };
 const artistDirectoryProps={
  catalog,clock,hardBlocked,onHardBlock:toggleHardBlocked,
  onColor:(id,color)=>setFavoriteColors(colors=>({...colors,[id]:color})),
  favorites:favoritePresets,colors:favoriteColors,excluded:individualExcluded,protectedGroups,
  onFavorite:toggleFavorite,onExclude:toggleExcluded,
  onReturnVideos:()=>{setAdd(false);window.location.hash='collection';scrollToVideos();},
  onVideos:row=>{
   const gid=(catalog?.groups||[]).some(g=>g.id===row.id)?row.id:row.memberships?.find(h=>h.status==='current')?.groupId||row.memberships?.[0]?.groupId||row.soloIds?.[0];
   if(!gid||hardBlocked.includes(row.id)||hardBlocked.includes(gid)||excludedGroups.includes(gid))return;
   setAdd(false);go('home');setFavoriteScope('all');setViewPresets([]);setMutedArtists(ids=>ids.filter(id=>id!==gid));setQuery('');setArchiveYear('');setArchiveMonth('');setFilterGroup(gid);setMember(catalog.members.some(m=>m.id===row.id)?row.id:'');
   window.location.hash='collection';scrollToVideos();
  },
 };
 const memberName=id=>catalog?.members.find(m=>m.id===id)?.name||id;
 return <LanguageContext.Provider value={language}>{localize(<div className={`app-shell${collapsed?' sidebar-collapsed':''}`} data-player-minimized={playing?playerMinimized:undefined}>
 <button className="mobile-menu icon-button" aria-label="메뉴 열기" onClick={()=>setMobile(!mobile)}><Menu/></button>
 {mobile&&<button className="sidebar-scrim" aria-label="메뉴 닫기" onClick={()=>setMobile(false)}/>}
 <aside className={mobile?'sidebar is-open':'sidebar'}><button className="sidebar-collapse" aria-label={collapsed?'사이드바 펼치기':'사이드바 접기'} title={collapsed?'사이드바 펼치기':'사이드바 접기'} aria-expanded={!collapsed} onClick={()=>setCollapsed(s=>!s)}>{collapsed?<ChevronRight size={18}/>:<ChevronLeft size={18}/>}</button><a className="brand" href="#collection" onClick={e=>{e.preventDefault();go('home');}}><span className="brand-symbol"><Radio size={23}/></span>SONAR<span className="brand-dot">●</span></a><p className="brand-caption"><span>Search · Organize · Navigate</span><span>Archive · Replay</span></p>
 <div className="sidebar-tools"><label className="search sidebar-search"><Search size={17}/><input ref={sidebarSearchRef} aria-label="영상 채널 태그 검색" placeholder="영상, 채널, 태그 검색" value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')setMobile(false);}}/>{query&&<button className="icon-button" aria-label="검색 지우기" onClick={()=>setQuery('')}><X size={15}/></button>}</label><button className="sidebar-search-open" aria-label="영상 채널 태그 검색" title="영상 채널 태그 검색" onClick={()=>{setCollapsed(false);requestAnimationFrame(()=>sidebarSearchRef.current?.focus());}}><Search size={18}/></button><button className="theme-toggle sidebar-theme-toggle" onClick={()=>setTheme(t=>t==='dark'?'light':'dark')} aria-pressed={theme==='dark'} aria-label={theme==='dark'?'주간 모드로 전환':'야간 모드로 전환'} title={theme==='dark'?'주간 모드':'야간 모드'}>{theme==='dark'?<Sun size={18}/>:<Moon size={18}/>}</button></div><div className="language-switch" aria-label="Language">{LANGUAGES.map(([code,label])=><button key={code} aria-label={{ko:'한국어',ja:'日本語',en:'English',es:'Español'}[code]} lang={code} aria-pressed={language===code} onClick={()=>setLanguage(code)}>{label}</button>)}</div><button className="collapsed-groups" aria-label="그룹 추가하기" title="그룹 추가하기" onClick={openGroups}><Plus size={20}/></button><a className="artist-directory-link" href="#artists" aria-label="전체 아티스트 목록" title="전체 아티스트 목록" onClick={()=>setMobile(false)}><Layers size={15}/><span>전체 아티스트 목록</span></a><button type="button" className="artist-directory-link sidebar-records-shortcut" onClick={()=>go('uploads')}><CalendarDays size={15}/><span>업로드달력</span></button><a className="artist-directory-link" href="#analysis" onClick={()=>setMobile(false)}><Layers size={15}/><span>분석</span></a><section className="live-section"><h2><span className="live-dot"/> LIVE NOW <span className="counter">{lives.length}</span></h2>{lives.length?lives.map(v=><button key={v.id} className="live-link" onClick={()=>open(v)}><Radio size={15}/>{v.title}</button>):<div className="live-empty"><Radio size={18}/><span>지금은 잠시 쉬어가는 중<small>공식 채널의 라이브만 모아요</small></span></div>}</section>
 <FavoritesSidebar catalog={catalog?{...catalog,groups:catalog.groups.filter(g=>enabledArtistTypes.some(type=>artistCategories(g).includes(type)))}:null} favorites={favoritePresets} colors={favoriteColors} scope={favoriteScope} onBulkCheck={(ids,checked)=>setMutedArtists(current=>bulkViewingChecks(current,ids,checked))} onScope={setFavoriteScope} activeStates={activeBrowseStates} onActiveStates={setActiveBrowseStates} tagGroup={filterGroup} onClearTagGroup={()=>setFilterGroup('')} presets={viewPresets} onPresets={setViewPresets} disabled={mutedArtists} onToggle={id=>setMutedArtists(ids=>ids.includes(id)?ids.filter(value=>value!==id):[...ids,id])} hardBlocked={hardBlocked} excluded={excludedGroups} clock={clock} onEdit={openGroupEditor}/>


 <div className="sidebar-bottom"><FeedbackLink/><div className="voyage-mini"><Disc3 size={23}/><span className="sonar-on-label">SONAR ON</span></div><small>SONAR · FAN-MADE ARCHIVE<br/>콘텐츠의 바다를 탐색하는 소나</small></div></aside>
 <main><h1 className="sr-only">SONAR · 비공식 K-POP 팬페이지</h1>
 {playing&&<AdjustablePlayer aspectRatio={playerAspect} minimized={playerMinimized} labels={{player:translate('영상 플레이어',language),resize:translate('플레이어 크기 조절. 방향키로 조절',language)}}>
  <div className="docked-player-heading" data-player-drag tabIndex={0} role="group" aria-label="제목줄을 끌어 이동 · 두 손가락으로 크기 조절" title="제목줄을 끌어 이동 · 두 손가락으로 크기 조절">
   <h2 data-no-translate title={playing.title}>{playing.title}</h2>
   <button type="button" className="icon-button" aria-label="이전 영상" title="이전 영상" disabled={!adjacent.previous} onClick={()=>stepVideo(-1)}><ChevronLeft size={18}/></button>
   <button type="button" className="icon-button" aria-label="다음 영상" title="다음 영상" disabled={!adjacent.next} onClick={()=>stepVideo(1)}><ChevronRight size={18}/></button>
   <button type="button" className="icon-button" aria-expanded={!playerMinimized} aria-controls="docked-video" aria-label={playerMinimized?'플레이어 펼치기':'플레이어 최소화'} title={playerMinimized?'플레이어 펼치기':'플레이어 최소화'} onClick={()=>setPlayerMinimized(value=>!value)}>{playerMinimized?<Maximize2 size={17}/>:<Minus size={19}/>}</button>
   <button type="button" className="icon-button" aria-label="영상 닫기" onClick={()=>setPlaying(null)}><X size={19}/></button>
  </div>
  <div id="docked-video" className="docked-player-media" inert={playerMinimized}>
  {playing.demo?<div className="sample-preview"><Disc3 size={40}/><p>샘플 영상입니다.</p></div>:
   <div className="video-player-frame" aria-busy={embedLoading}>
    <iframe key={playing.id} title={playing.title}
     src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(playing.platformId)}?autoplay=1&playsinline=1&rel=0&controls=1`}
     onLoad={()=>setEmbedLoading(false)} referrerPolicy="strict-origin-when-cross-origin"
     allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen/>
    {embedLoading&&<div className="player-loading" role="status">{playing.thumbnail&&<img src={playing.thumbnail} alt=""/>}<span>YouTube 플레이어를 불러오는 중…</span></div>}
   </div>}
  </div>
  {!playerMinimized&&playerAspect<1&&<ShortSwipeArea onStep={stepVideo} hasPrevious={Boolean(adjacent.previous)} hasNext={Boolean(adjacent.next)}/>}
  <div className="docked-player-tools">
   <label className="search docked-player-search"><Search size={16}/>
    <input aria-label="영상 채널 태그 검색" placeholder="영상, 채널, 태그 검색" value={query} onChange={e=>setQuery(e.target.value)}/>
    {query&&<button type="button" className="icon-button" aria-label="검색 지우기" onClick={()=>setQuery('')}><X size={15}/></button>}
   </label>
   {!playing.demo&&!playerMinimized&&<div className="video-actions">
    <a className="youtube-link" target="_blank" rel="noreferrer" href={`https://www.youtube.com/watch?v=${encodeURIComponent(playing.platformId)}`}>YouTube에서 보기 <ArrowUpRight size={14}/></a>
    <button type="button" className="video-share-button" onClick={copyVideoUrl}><Copy size={14}/>주소 복사</button>
   </div>}
   <span className="video-share-status" role="status">{shareStatus}</span>
  </div>
 </AdjustablePlayer>}
 <div className="main-content">

 <div className="fan-page-note"><span>FAN PAGE</span><p>비공식 K-POP 팬페이지 · 아티스트·소속사와 무관한 팬 제작 아카이브입니다.</p>{lives.length>0&&<div className="top-live-status" ref={liveStatusRef}><button type="button" ref={liveStatusButtonRef} className="live-status-trigger" aria-expanded={livePanel} aria-controls="top-live-panel" aria-label={formatMessage('현재 진행 중인 공식 라이브 {count}개 보기',{count:lives.length},language)} onClick={()=>setLivePanel(s=>!s)}><span className="live-status-dot" aria-hidden="true"/><span data-no-translate>LIVE ON</span><span className="live-status-count">{lives.length}</span></button>{livePanel&&<section id="top-live-panel" className="live-status-panel" aria-label="현재 진행 중인 라이브"><div className="live-status-heading"><strong>LIVE NOW</strong><small>{formatMessage('{count}개 진행 중',{count:lives.length},language)}</small></div>{lives.map(v=><button type="button" className="live-status-entry" key={v.id} onClick={()=>{setLivePanel(false);open(v);}}><Radio size={17}/><span><b data-no-translate>{v.groupIds.map(groupName).join(' · ')}</b><small data-no-translate>{v.title}</small></span><Play size={14}/></button>)}</section>}</div>}<DataRefreshTime value={catalog?.contentUpdatedAt}/></div>
 <WorkspaceNavigation menus={menus} language={language} page={recordsPage||analysisPage?'analysis':groupsPage?'groups':directoryPage?'artists':'content'} category={category} onGo={go} onGroups={()=>{window.location.hash='groups';setMobile(false);}}/>
 {recordsPage?(catalog?<AnalysisPage key="records" mode="records" catalog={catalog} load={json} favorites={favoritePresets}/>:<div className="empty">활동 기록을 불러오는 중…</div>):analysisPage?(catalog?<AnalysisPage key="analysis" catalog={catalog} load={json} favorites={favoritePresets}/>:<div className="empty">아티스트 목록을 불러오는 중…</div>):groupsPage||directoryPage?(catalog?<UnifiedDirectory {...artistDirectoryProps} editor={groupsPage}/>:<div className="empty" role="status">{error||'그룹 목록을 불러오는 중…'}</div>):<section className="library" id="collection">{category==='station'?<StationDirectory channels={catalog?.channels||[]} excluded={hardBlocked}/>:<>
 {category==='home'&&<HomeOverview selectedCount={selected.length} videoCount={filtered.length} favoriteCount={protectedGroups.length} onGo={go} onGroups={()=>{window.location.hash='groups';}}/>}<div className="section-title"><div><h2>{category==='uploads'?'업로드 달력':category==='home'?'최신 콘텐츠':menus.find(m=>m[0]===category)?.[1]}<span>{category==='uploads'?calendarRows.length:filtered.length}</span></h2><p>{member?memberName(member):filterGroup?groupName(filterGroup):selected.length?selected.length>3?`${selected.slice(0,3).map(groupName).join(' · ')} 외 ${selected.length-3}개`:selected.map(groupName).join(' · '):'보고 싶은 그룹의 체크박스를 켜주세요'}</p></div><span className="sort-label">최신 업로드순 ↓</span></div>
 {<ContentSections category={category} section={contentSection} onSection={setContentSection} rows={sectionRows} broadcaster={broadcaster} onBroadcaster={setBroadcaster} channel={channel} onChannel={setChannel}/>}
 <ContentSearch query={query} onChange={setQuery}/>
 <div className="compact-filters content-period-controls">
 <ContentPeriodFilter years={archiveYears} year={archiveYear} month={archiveMonth} onYear={setArchiveYear} onMonth={setArchiveMonth}/>
 {(archiveYear||archiveMonth||filterGroup||member||subtype||format||channel||externalType||ownType||contentSection||broadcaster)&&<div className="applied-filter-tags" aria-label="선택한 필터">{[[contentSection,contentSection,()=>setContentSection('')],[broadcaster,broadcaster,()=>{setBroadcaster('');setChannel('');}],[archiveYear,archiveYear,()=>setArchiveYear('')],[archiveMonth,`${Number(archiveMonth)}월`,()=>setArchiveMonth('')],[filterGroup,groupName(filterGroup),()=>{setFilterGroup('');setMember('');}],[member,memberName(member),()=>setMember('')],[subtype,subtype,()=>setSubtype('')],[format,{video:'영상',short:'쇼츠',live:'라이브'}[format],()=>setFormat('')],[channel,channels.find(c=>c.id===channel)?.name||channel,()=>setChannel('')],[externalType,EXTERNAL_TYPES.find(([id])=>id===externalType)?.[1],()=>setExternalType('')],[ownType,OWN_TYPES.find(([id])=>id===ownType)?.[1],()=>setOwnType('')]].filter(([value])=>value).map(([value,label,remove],index)=><button key={index} onClick={remove}><span>{label}</span><X size={11}/></button>)}<button className="clear-all-filters" onClick={()=>{setArchiveYear('');setArchiveMonth('');setFilterGroup('');setMember('');setSubtype('');setFormat('');setChannel('');setExternalType('');setOwnType('');setContentSection('');setBroadcaster('');}}>초기화</button></div>}
 </div><>
 {category==='external'&&<ExternalExplorer showTypes={false} types={EXTERNAL_TYPES} type={externalType} channel={channel} channels={channels}
  onType={id=>{setExternalType(id);setChannel('');}} onChannel={setChannel}/>}
 {indexesEnabled&&indexFailures.length>0&&<div className="index-notice" role="status"><span>{indexFailures.length}개 영상 목록을 불러오지 못했습니다.</span><button type="button" onClick={()=>setIndexRetry(value=>value+1)}>다시 시도</button></div>}
 {indexesEnabled&&indexLoading&&rows.length>0&&<p className="index-loading-note" role="status">{request.preview?'선택 그룹의 최신 영상을 불러오는 중…':'이전 영상을 불러오는 중…'}</p>}
 {browse&&request.preview&&!loading&&indexesEnabled&&<p className="index-loading-note">
  {formatMessage('최근 {days}일 우선',{days:browse.days},language)}{request.wide?'':' · 부족한 항목은 이전 기록 포함'} · {formatMessage('{count}개 표시',{count:pageRows.length},language)}
 </p>}
 {loading?<div className="empty" role="status">흩어진 순간들을 모아오는 중…</div>:error?<div className="empty" role="alert">{error}<button onClick={()=>{cache.clear();setRetry(x=>x+1);setIndexRetry(x=>x+1);setError('');}}>다시 시도</button></div> :category==='uploads'?<div className="upload-calendar"><p className="upload-calendar-note">업로드 날짜 · 한국 시간 · 음악·라이브 우선 분류 · 콘텐츠 3분 이상 / 숏폼 3분 미만</p>{!calendarRows.length?<div className="empty">선택한 기간에 업로드된 영상이 없어요.</div>:uploadDays(calendarRows).map(day=><section className="upload-day" key={day.date}><div className="upload-day-heading"><time dateTime={day.date}>{day.date}</time><span>{day.items.length}</span></div><div className="upload-day-groups">{uploadGroupSummary(day.items,selected,includeIndividual,groupsById,calendarRows).map(group=><div className="upload-group-summary" key={group.id} style={favoriteCardStyle([group.id],protectedGroups,favoriteColors,theme)}><div className="upload-group-line"><b className="upload-group-name" data-no-translate><span className="upload-group-presets">{presetOptions.filter(([key])=>favoritePresets[key].includes(group.id)).map(([key,name,Icon])=><span key={key} data-preset={key} role="img" aria-label={`${name} 선호그룹`} title={`${name} 선호그룹`}><Icon size={14} aria-hidden="true" fill={key==='clover'?'none':'currentColor'}/></span>)}</span><span>{calendarGroupName(group)}</span></b><div className="upload-type-counts">{[['live','라이브방송',Radio],['music','음악활동',Music2],['content','콘텐츠',Clapperboard],['short','숏폼',Smartphone]].map(([kind,label,Icon])=>{const key=`${day.date}-${group.id}-${kind}`;return <button key={kind} className={`upload-type upload-type-${kind}`} disabled={!group[kind].length} title={`${label} · ${group[kind].length}`} aria-label={`${groupName(group.id)} ${label} · ${group[kind].length}`} aria-expanded={uploadExpansion===key} onClick={()=>setUploadExpansion(s=>s===key?'':key)}><Icon size={16}/><span>{group[kind].length}</span><span className="sr-only">{label}</span></button>;})}</div></div>{group.unknown.length>0&&<details className="upload-classification-pending"><summary>{formatMessage('길이·유형 확인 중 {count}개',{count:group.unknown.length},language)}</summary>{group.unknown.map(v=><button type="button" key={v.id} className="upload-entry" onClick={()=>open(v)}><span data-no-translate>{v.title}</span><Play size={15}/></button>)}</details>}{['live','music','content','short'].map(kind=>uploadExpansion===`${day.date}-${group.id}-${kind}`&&<div className="upload-expanded" key={kind}>{group[kind].map(v=><button key={v.id} className="upload-entry" onClick={()=>{open(v);}}><time>{v.publishedAt.length===10?'—':new Date(v.publishedAt).toLocaleTimeString({ko:'ko-KR',ja:'ja-JP',en:'en-US',es:'es-ES'}[language],{timeZone:'Asia/Seoul',hour:'2-digit',minute:'2-digit',hour12:false})}</time><span><b data-no-translate>{v.title}</b><small data-no-translate>{v.channelName}</small></span><Play size={15}/></button>)}</div>)}</div>)}</div></section>)}</div>:!pageRows.length?<div className="empty">{selected.length?'조건에 맞는 영상이 없어요.':'표시할 그룹을 선택해주세요.'}<small>{selected.length?'그룹이나 필터를 바꿔보세요.':'왼쪽 MY GROUPS에서 체크하거나 그룹을 추가해주세요.'}</small>{!selected.length&&<button className="empty-add-group" onClick={openGroups}><Plus size={15}/> 그룹 추가하기</button>}</div>:<div className="video-grid">{pageRows.map((video,index)=><VideoCard key={video.id} video={video} index={index} number={index+1+(page-1)*PAGE_SIZE}
 groupsById={groupsById} style={favoriteCardStyle([...video.groupIds,...video.memberIds||[]],protectedGroups,favoriteColors,theme)} station={category==='station'}
 onOpen={open} onSearch={setQuery} onGroupSelect={id=>{setFilterGroup(id);setMember('');}} memberName={memberName}
 onMemberSelect={id=>{go('live');setFilterGroup(catalog?.members.find(member=>member.id===id)?.groupId||'');setMember(id);}}/>)}</div>}
 {!loading&&(showMore||pageRows.length>6)&&<div className="archive-load-more">{showMore&&<button type="button" disabled={indexLoading} onClick={moreVideos}>이전 영상 더 보기</button>}{pageRows.length>6&&<button type="button" onClick={()=>document.getElementById('collection')?.scrollIntoView({block:'start'})}>맨 위로</button>}</div>}
 {(!compactBrowse&&category!=='uploads')&&filtered.length>PAGE_SIZE&&<div className="pagination"><button aria-label="이전 페이지" disabled={page===1} onClick={()=>setPage(p=>p-1)}><ChevronLeft size={18}/></button><span>{page} <small>/ {Math.ceil(filtered.length/PAGE_SIZE)}</small></span><button aria-label="다음 페이지" disabled={page>=Math.ceil(filtered.length/PAGE_SIZE)} onClick={()=>setPage(p=>p+1)}><ChevronRight size={18}/></button><small>{formatMessage('페이지당 {count}개',{count:PAGE_SIZE},language)}</small></div>}</>
</>}</section>}<footer>SONAR <span>흩어진 K-POP 콘텐츠를 찾아 모으는 곳, SONAR.</span><small>Fan-made · 영상 저작권은 각 권리자에게 있습니다.</small></footer></div></main>
 {add&&<div className="modal-backdrop" onClick={()=>setAdd(false)}><section className="modal group-editor-modal" role="dialog" aria-modal="true" aria-label="선호그룹 관리" tabIndex={-1} ref={modalRef} onClick={e=>e.stopPropagation()}><PreferenceDragHandle panelRef={modalRef} onClose={()=>setAdd(false)}/>{catalog&&<UnifiedDirectory {...artistDirectoryProps} editor/>}</section></div>}

 </div>,language)}</LanguageContext.Provider>;
}
createRoot(document.getElementById('root')).render(<App/>);
