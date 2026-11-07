import React,{useEffect,useMemo,useRef,useState,useReducer} from 'react';
import {createRoot} from 'react-dom/client';
import {Search,Plus,X,Radio,Home,Music2,Clapperboard,Layers,CalendarDays,Play,ArrowUpRight,SlidersHorizontal,ChevronLeft,ChevronRight,Menu,Check,Disc3,Star,Moon,Sun,Heart,Sprout,Ban,Smartphone,Settings2,ShieldCheck,Copy,Tv,Minus,Maximize2} from 'lucide-react';
import {PAGE_SIZE,filterContent,commonChannels,activeLives,activeStations,groupPreferences,favoriteGroupSelection,selectionReducer,monthKey,favoriteColorPreferences,favoriteCardStyle,themePreference,favoritePresetPreferences,excludedGroupPreferences,withoutExcludedGroups,prioritizeGroups,EXTERNAL_TYPES,externalKind,uploadDays,uploadKind,uploadGroupSummary,OWN_TYPES,allGroupSelection,sortGroups,ARTIST_CATEGORIES,artistsInCategory,artistCategory,artistCategories,excludedArtistIds,loadSaved,updateGroupMembership,DISPLAY_ARTIST_TYPES,enabledArtistTypePreferences,toggleArtistType,visibleArtistIds,activityDirectory,isShortContent,modalHistory} from './lib';
import './style.css';
import './activity-ui.css';
import './video-viewer.css';
import ArtistDirectory from './ArtistDirectory';
import ActivityIcon from './ActivityIcon';
import {matchesArtistName,matchesDirectoryScope} from './directory';
import SidebarGroupRow from './SidebarGroupRow';
import {isMusicBroadcast} from './broadcast';
import {createDataClient} from './data';
import {useGroupVideos} from './useGroupVideos';
import {archiveRequest,balancedPreview} from './browse';
import {restoreSubset} from './lib';
import {LANGUAGES,localize,readScreenPreference} from './i18n';
const base=import.meta.env.BASE_URL;
const {json,cache}=createDataClient({base});
const presetOptions=[['heart','하트',Heart],['star','별',Star],['clover','새싹',Sprout]];
const menus=[['home','홈',Home],['music','MUSIC',Music2],['broadcast','음악방송',Tv],['own','자체 콘텐츠',Clapperboard],['external','외부 콘텐츠',Layers],['live','라이브 영상',Radio],['station','LIVE STATION',Disc3],['shorts','Shorts',Play],['uploads','업로드 달력',CalendarDays]];
const labels={home:'흩어진 순간들을 한곳에',music:'음악이 시작되는 순간',own:'우리만의 이야기',external:'새로운 조합의 즐거움',live:'다시 만나는 라이브',shorts:'짧지만 확실한 행복',uploads:'유튜브 업로드 달력'};
function filterButtons(label,value,options,onChange){return <div className="filter-button-row"><span className="filter-row-label">{label}</span><div className="filter-button-scroll" role="group" aria-label={label}>{options.map(([id,name])=><button type="button" key={id} className="filter-choice" aria-pressed={value===id} onClick={()=>onChange(id)}>{name}</button>)}</div></div>;}
function DataRefreshTime({value}){
 const date=new Date(value||'');
 if(!Number.isFinite(date.getTime()))return null;
 const options={timeZone:'Asia/Seoul',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'};
 const clock=new Intl.DateTimeFormat('ko-KR',options).format(date);
 const full=new Intl.DateTimeFormat('ko-KR',{...options,year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
 return <details className="data-refresh-time"><summary>갱신 {clock} KST</summary><time dateTime={value}>{full} KST</time></details>;
}
function VideoArtistTags({video,groupsById,onSearch}){
 const activity=video.individualActivity;
 const soloId=activity?.artistId;
 const careerIds=activity?.groupIds||[];
 const artistIds=[...new Set([...(soloId?[soloId]:[]),...video.groupIds,...careerIds])];
 return <div className="video-artist-tags">{artistIds.map(id=>{
  const artist=groupsById.get(id);
  const name=artist?.name||id;
  if(id===soloId||artist?.artistType==='solo')return <span className="video-solo-name" key={id} data-no-translate>{name}</span>;
  const former=groupsById.get(soloId)?.previousGroupIds?.includes(id);
  return <button type="button" className="video-group-tag" key={id} data-no-translate
   aria-label={`${name}${former?' 출신':''} 검색`} onClick={()=>onSearch(name)}>{name}{former&&<small> 출신</small>}</button>;
 })}</div>;
}
function App(){
 const [directoryPage,setDirectoryPage]=useState(()=>window.location.hash==='#artists');
 useEffect(()=>{const sync=()=>setDirectoryPage(window.location.hash==='#artists');window.addEventListener('hashchange',sync);return()=>window.removeEventListener('hashchange',sync);},[]);
 const [enabledArtistTypes,setEnabledArtistTypes]=useState(()=>enabledArtistTypePreferences({getItem:key=>localStorage.getItem(key)}));
 useEffect(()=>{try{localStorage.setItem('sonar.enabled-artist-types.v1',JSON.stringify(enabledArtistTypes));}catch{}},[enabledArtistTypes]);
 const [language,setLanguage]=useState(()=>readScreenPreference('sonar.language.v1',['ko','ja','en','es'],'ko'));
 const [collapsed,setCollapsed]=useState(()=>readScreenPreference('sonar.sidebar.v1',['expanded','collapsed'],'expanded')==='collapsed');
 useEffect(()=>{document.documentElement.lang=language;try{localStorage.setItem('sonar.language.v1',language);localStorage.setItem('sonar.sidebar.v1',collapsed?'collapsed':'expanded');}catch{}},[language,collapsed]);
 const [catalog,setCatalog]=useState(null),[feed,setFeed]=useState({items:[]}),[error,setError]=useState(''),[retry,setRetry]=useState(0),[clock,setClock]=useState(Date.now());
 const [saved,setSaved]=useState([]),[preferencesReady,setPreferencesReady]=useState(false);
 const [selection,dispatchSelection]=useReducer(selectionReducer,{selected:[]});
 const rawSelected=selection.selected;
 const [category,setCategory]=useState('home'),[query,setQuery]=useState(''),[channel,setChannel]=useState(''),[member,setMember]=useState(''),[subtype,setSubtype]=useState(''),[format,setFormat]=useState('');
 const [openFilter,setOpenFilter]=useState('');
 const sidebarSearchRef=useRef(null);
 const [livePanel,setLivePanel]=useState(false);
 const liveStatusRef=useRef(null),liveStatusButtonRef=useRef(null);
 const compactFilterRef=useRef(null),filterTriggerRefs=useRef({});
 const closeFilter=()=>{setOpenFilter('');filterTriggerRefs.current[openFilter]?.focus();};
 useEffect(()=>{if(!openFilter)return;const dismiss=e=>{if(!compactFilterRef.current?.contains(e.target))setOpenFilter('');};const escape=e=>{if(e.key==='Escape'){setOpenFilter('');filterTriggerRefs.current[openFilter]?.focus();}};document.addEventListener('pointerdown',dismiss);document.addEventListener('keydown',escape);return()=>{document.removeEventListener('pointerdown',dismiss);document.removeEventListener('keydown',escape);};},[openFilter]);
 const [editingGroups,setEditingGroups]=useState(false),[groupSort,setGroupSort]=useState(()=>readScreenPreference('sonar.group-sort.v1',['default','az','debut-asc','debut-desc'],'default'));
 useEffect(()=>{try{localStorage.setItem('sonar.group-sort.v1',groupSort);}catch{}},[groupSort]);
 const [uploadExpansion,setUploadExpansion]=useState('');
 const [filterGroup,setFilterGroup]=useState('');
 const [archiveYear,setArchiveYear]=useState(''),[archiveMonth,setArchiveMonth]=useState(''),[externalType,setExternalType]=useState(''),[ownType,setOwnType]=useState('');
 const [page,setPage]=useState(1),[indexRetry,setIndexRetry]=useState(0);
 const [archiveProgress,setArchiveProgress]=useState({key:'',pages:0,months:0});
 const [includeIndividual,setIncludeIndividual]=useState(()=>readScreenPreference('sonar.individual-activity.v1',['on','off'],'on')==='on');
 const [onlyChecked,setOnlyChecked]=useState(false);
 const [swipedGroup,setSwipedGroup]=useState(null),[sidebarUndo,setSidebarUndo]=useState(null);
 useEffect(()=>{try{localStorage.setItem('sonar.individual-activity.v1',includeIndividual?'on':'off');}catch{}},[includeIndividual]);
 const [myGroupQuery,setMyGroupQuery]=useState('');
 const [add,setAdd]=useState(false),[groupQuery,setGroupQuery]=useState(''),[playing,setPlaying]=useState(null),[mobile,setMobile]=useState(false);
 const [artistTab,setArtistTab]=useState('all');
 const [viewSettings,setViewSettings]=useState(false),[settingsPage,setSettingsPage]=useState('favorites');
 const [favoritePresets,setFavoritePresets]=useState({heart:[],star:[],clover:[]}),[activePreset,setActivePreset]=useState('star');
 const [viewPresets,setViewPresets]=useState(['star']);
 const favoriteGroups=favoritePresets[activePreset],FavoriteIcon=presetOptions.find(p=>p[0]===activePreset)[2];
 const [favoriteColors,setFavoriteColors]=useState({});
 const [individualExcluded,setIndividualExcluded]=useState([]),[blockedTypes,setBlockedTypes]=useState([]),[allowedGroups,setAllowedGroups]=useState([]),[excludeMode,setExcludeMode]=useState(false);
 const protectedGroups=useMemo(()=>[...new Set(Object.values(favoritePresets).flat())],[favoritePresets]);
 const excludedGroups=useMemo(()=>excludedArtistIds(catalog?.groups||[],individualExcluded,blockedTypes,allowedGroups,protectedGroups),[catalog,individualExcluded,blockedTypes,allowedGroups,protectedGroups]);
 const selected=useMemo(()=>visibleArtistIds(catalog?.groups||[],rawSelected,enabledArtistTypes,excludedGroups),[catalog,rawSelected,enabledArtistTypes,excludedGroups]);
 useEffect(()=>{if(filterGroup&&!selected.includes(filterGroup)){setFilterGroup('');setMember('');}},[selected,filterGroup]);

 const [exclusionList,setExclusionList]=useState('blocked');
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
 useEffect(()=>{let cancelled=false;Promise.all([json('catalog.json'),json('live.json').catch(()=>({items:[]}))]).then(([c,l])=>{if(cancelled)return;c={...c,groups:c.groups.filter(g=>g.directoryVisibility!=='agency-only')};const preferences=groupPreferences({getItem:key=>localStorage.getItem(key)},c);setSaved(preferences.saved);dispatchSelection({type:"hydrate",selected:preferences.selected});const favorites=favoritePresetPreferences({getItem:key=>localStorage.getItem(key)},c);setFavoritePresets(favorites.presets);setActivePreset(favorites.active);setViewPresets([]);setFavoriteColors(favoriteColorPreferences({getItem:key=>localStorage.getItem(key)},c));setIndividualExcluded(excludedGroupPreferences({getItem:key=>localStorage.getItem(key)},c));setBlockedTypes(loadSaved({getItem:key=>localStorage.getItem(key)},'sonar.blocked-artist-types.v1',[]).filter(id=>ARTIST_CATEGORIES.some(([key])=>key===id&&key!=='all')));setAllowedGroups(loadSaved({getItem:key=>localStorage.getItem(key)},'sonar.allowed-groups.v1',[]).filter(id=>c.groups.some(g=>g.id===id)));try{setExcludeMode(localStorage.getItem('sonar.exclude-mode.v1')==='true');}catch{}setCatalog(c);setFeed(l);setPreferencesReady(true);}).catch(e=>{if(!cancelled){setError(e.message);}});return()=>{cancelled=true;};},[retry]);
 useEffect(()=>{const timer=setInterval(()=>{setClock(Date.now());cache.delete('live.json');json('live.json').then(setFeed).catch(()=>{});},60000);return()=>clearInterval(timer);},[]);
 useEffect(()=>{let cancelled=false;const refresh=()=>{cache.delete('catalog.json');json('catalog.json').then(value=>{if(cancelled)return;setCatalog(previous=>{if(previous?.updatedAt===value.updatedAt)return previous;for(const key of cache.keys())if(key.startsWith('groups/')||key.startsWith('browse/')||key==='latest.json')cache.delete(key);return {...value,groups:value.groups.filter(group=>group.directoryVisibility!=='agency-only')};});}).catch(()=>{});};const timer=setInterval(refresh,300000);return()=>{cancelled=true;clearInterval(timer);};},[]);
 useEffect(()=>{if(!preferencesReady)return;try{localStorage.setItem('sonar.groups.v2',JSON.stringify(saved));localStorage.setItem('sonar.selected.v2',JSON.stringify(rawSelected));localStorage.setItem('sonar.favorite-presets.v1',JSON.stringify(favoritePresets));localStorage.setItem('sonar.favorite-preset-active.v1',activePreset);localStorage.setItem('sonar.favorite-colors.v1',JSON.stringify(favoriteColors));localStorage.setItem('sonar.excluded-groups.v1',JSON.stringify(individualExcluded));localStorage.setItem('sonar.blocked-artist-types.v1',JSON.stringify(blockedTypes));localStorage.setItem('sonar.allowed-groups.v1',JSON.stringify(allowedGroups));localStorage.setItem('sonar.exclude-mode.v1',String(excludeMode));localStorage.removeItem('sonar.previous-selected.v1');}catch{/* Browsing still works when storage is unavailable. */}},[saved,rawSelected,favoritePresets,activePreset,favoriteColors,individualExcluded,blockedTypes,allowedGroups,excludeMode,preferencesReady]);
 const indexGroups=filterGroup&&selected.includes(filterGroup)?[filterGroup]:selected;
 const indexKey=indexGroups.join(',');
 const browse=catalog?.browse;
 const browseKey=[indexKey,category,archiveYear,archiveMonth,query,channel,member,subtype,format,externalType,ownType,includeIndividual].join('|');
 const progress=archiveProgress.key===browseKey?archiveProgress:{pages:0,months:0};
 const request=archiveRequest(browse,indexGroups,category,archiveYear,archiveMonth,progress);
 const indexesEnabled=Boolean(catalog)&&!directoryPage&&category!=='station';
 const {rows,failed:indexFailures,loading:indexLoading}=useGroupVideos(json,request.paths,{
  enabled:indexesEnabled,version:catalog?.updatedAt,retry:indexRetry
 });
 const loading=!catalog&&!error||indexesEnabled&&indexLoading&&!rows.length;
 const artistNames=useMemo(()=>new Map((catalog?.groups||[]).map(group=>[
  group.id,[group.name,group.nameKo,group.nameEn,...(group.aliases||[])].filter(Boolean)
 ])),[catalog]);
 useEffect(()=>{setPage(1);},[selected.join(','),category,query,channel,member,subtype,format,archiveYear,archiveMonth,externalType,ownType,filterGroup,includeIndividual]);
 const stations=useMemo(()=>catalog?withoutExcludedGroups(activeStations(feed,catalog.channels,clock),excludedGroups).filter(v=>v.groupIds.some(id=>artistCategories(catalog.groups.find(g=>g.id===id)||{}).some(type=>enabledArtistTypes.includes(type)))):[],[catalog,feed,clock,excludedGroups,enabledArtistTypes]);
 const filtered=useMemo(()=>selected.length?filterContent(excludeMode?withoutExcludedGroups(category==='station'?stations:rows,excludedGroups):(category==='station'?stations:rows),{groups:filterGroup?[filterGroup]:selected,category,query,channel,member,subtype,format,year:archiveYear,month:archiveMonth,includeIndividual,artistNames,externalType:category==='external'?externalType:'',ownType:category==='own'?ownType:''}):[],[rows,stations,selected,category,query,channel,member,subtype,format,excludeMode,excludedGroups,archiveYear,archiveMonth,externalType,ownType,filterGroup,includeIndividual,artistNames]);
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
 const lives=catalog?withoutExcludedGroups(activeLives(feed,catalog.channels,clock),excludedGroups).filter(v=>v.groupIds.some(id=>artistCategories(catalog.groups.find(g=>g.id===id)||{}).some(type=>enabledArtistTypes.includes(type)))):[];
 useEffect(()=>{if(!livePanel)return;const dismiss=e=>{if(!liveStatusRef.current?.contains(e.target))setLivePanel(false);};const escape=e=>{if(e.key==='Escape'){setLivePanel(false);liveStatusButtonRef.current?.focus();}};document.addEventListener('pointerdown',dismiss);document.addEventListener('keydown',escape);return()=>{document.removeEventListener('pointerdown',dismiss);document.removeEventListener('keydown',escape);};},[livePanel]);
 useEffect(()=>{if(!lives.length)setLivePanel(false);},[lives.length]);
 const externalRows=rows.filter(v=>!isMusicBroadcast(v)&&(v.category==='external'||v.contentTypes?.includes('external'))&&(!externalType||externalKind(v)===externalType)&&(!excludeMode||!v.groupIds.some(id=>excludedGroups.includes(id))));
 const channels=commonChannels(externalRows,selected);
 const archiveYears=useMemo(()=>{
  const groups=(catalog?.groups||[]).filter(group=>indexGroups.includes(group.id));
  const years=groups.flatMap(group=>group.archiveYears||[]);
  return [...new Set(years.length?years:rows.map(video=>monthKey(video.publishedAt).slice(0,4)))].sort().reverse();
 },[catalog,indexKey,rows]);
 const availableAllGroups=useMemo(()=>{
  const groups=activityDirectory(catalog?.groups||[],false,clock).filter(group=>!matchesDirectoryScope(group,'legacy',clock));
  return visibleArtistIds(groups,groups.map(group=>group.id),enabledArtistTypes,excludedGroups);
 },[catalog,clock,enabledArtistTypes,excludedGroups]);
 const allGroupsAdded=excludeMode&&availableAllGroups.length>0&&selected.length===availableAllGroups.length&&availableAllGroups.every(id=>selected.includes(id));
 const toggleAllGroups=()=>{const next=allGroupSelection(saved,availableAllGroups,allGroupsAdded);setExcludeMode(!allGroupsAdded);setSaved(next.saved);dispatchSelection({type:'change',ids:next.selected});setViewPresets([]);};
 const allowFavoriteArtist=id=>{setIndividualExcluded(s=>s.filter(g=>g!==id));};
 const toggleFavorite=(key,id)=>{if(!favoritePresets[key].includes(id))allowFavoriteArtist(id);setFavoritePresets(p=>({...p,[key]:p[key].includes(id)?p[key].filter(g=>g!==id):[...p[key],id]}));};
 const toggleExcluded=id=>{if(protectedGroups.includes(id))return;const enabled=!individualExcluded.includes(id);if(enabled)setAllowedGroups(s=>s.filter(g=>g!==id));setIndividualExcluded(s=>enabled?[...s,id]:s.filter(g=>g!==id));};
 const toggleAllowedArtist=id=>{if(protectedGroups.includes(id))return;const enabled=!allowedGroups.includes(id);if(enabled)setIndividualExcluded(s=>s.filter(g=>g!==id));setAllowedGroups(s=>enabled?[...s,id]:s.filter(g=>g!==id));};
 const toggleBlockedType=type=>{const next=blockedTypes.includes(type)?blockedTypes.filter(t=>t!==type):[...blockedTypes,type];setBlockedTypes(next);if(!next.length)setExclusionList('all');};

 useEffect(()=>{
  if(!excludeMode||!catalog)return;
  setSaved(current=>availableAllGroups.every(id=>current.includes(id))?current:[...new Set([...current,...availableAllGroups])]);
  dispatchSelection({type:'change',ids:availableAllGroups});
 },[catalog,excludeMode,availableAllGroups]);

 const toggle=id=>{
  setViewPresets([]);setExcludeMode(false);
  if(!rawSelected.includes(id))setSaved(current=>current.includes(id)?current:[...current,id]);
  dispatchSelection({type:"toggle",id});
 };
 const openGroups=()=>{setExclusionList('blocked');setArtistTab('all');setEditingGroups(false);setViewSettings(false);setGroupQuery('');setAdd(true);};
 const openGroupEditor=()=>{openGroups();setEditingGroups(true);};
 const editMembership=(ids,enabled)=>{const next=updateGroupMembership(saved,rawSelected,ids,enabled);setSaved(next.saved);setViewPresets([]);setExcludeMode(false);dispatchSelection({type:'change',ids:next.selected});};
 const toggleSavedGroup=id=>editMembership([id],!saved.includes(id));
 const editDirectoryGroups=(ids,enabled)=>{
  const snapshot={saved,selected:rawSelected};
  editMembership(ids,enabled);
  return ()=>{
   setExcludeMode(false);setViewPresets([]);
   setSaved(current=>restoreSubset(current,snapshot.saved,ids));
   dispatchSelection({type:'restore',ids,previous:snapshot.selected});
  };
 };

 const openViewSettings=()=>{openGroups();setViewSettings(true);setSettingsPage('favorites');};

 const go=id=>{if(directoryPage)window.location.hash='collection';if(id==='uploads'&&!archiveYear&&!archiveMonth){const newest=[...rows].sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt))[0];const period=monthKey(newest?.publishedAt||Date.now());setArchiveYear(period.slice(0,4));setArchiveMonth(period.slice(5,7));}setOpenFilter('');setCategory(id);setOwnType('');setExternalType('');setChannel('');setMember('');setSubtype('');setFormat('');setMobile(false);};
 const [embedLoading,setEmbedLoading]=useState(false);
 const [playerMinimized,setPlayerMinimized]=useState(false);
 const [playerPosition,setPlayerPosition]=useState('top');
 const [playerSize,setPlayerSize]=useState('medium');
 useEffect(()=>{if(!playing||playing.demo)return;const link=document.createElement('link');link.rel='preconnect';link.href='https://www.youtube-nocookie.com';document.head.appendChild(link);return()=>link.remove();},[playing?.id]);
 const [shareStatus,setShareStatus]=useState('');
 const shareTimer=useRef(null);
 useEffect(()=>()=>clearTimeout(shareTimer.current),[]);
 const copyVideoUrl=async()=>{try{await navigator.clipboard.writeText(`https://www.youtube.com/watch?v=${encodeURIComponent(playing.platformId)}`);setShareStatus('영상 주소를 복사했습니다.');}catch{setShareStatus('복사하지 못했습니다. YouTube에서 열어 주소를 복사해주세요.');}clearTimeout(shareTimer.current);shareTimer.current=setTimeout(()=>setShareStatus(''),4000);};
 const open=v=>{setMobile(false);setPlayerMinimized(false);if(v.id!==playing?.id){setEmbedLoading(!v.demo);setPlaying(v);setShareStatus('');}};
 const groupsById=useMemo(()=>new Map((catalog?.groups||[]).map(group=>[group.id,group])),[catalog]);
 const groupName=id=>groupsById.get(id)?.name||id;
 const visibleSaved=useMemo(()=>visibleArtistIds(catalog?.groups||[],saved,enabledArtistTypes,excludedGroups),
  [catalog,saved,enabledArtistTypes,excludedGroups]);
 const checkedIds=useMemo(()=>new Set(selected),[selected]);
 const orderedSaved=useMemo(()=>{
  const groups=visibleSaved.map(id=>groupsById.get(id));
  return groupSort==='default'?prioritizeGroups(groups,selected):sortGroups(groups,groupSort);
 },[visibleSaved,groupsById,groupSort,selected]);
 const matchingGroups=orderedSaved.filter(group=>(!onlyChecked||checkedIds.has(group.id))&&matchesArtistName(group,myGroupQuery));
 const removeSidebarGroup=id=>{
  const restore=editDirectoryGroups([id],false);
  setSwipedGroup(null);setSidebarUndo(()=>restore);
 };
 const artistDirectory=artistsInCategory(catalog?.groups||[],artistTab);
 const artistDirectoryProps={
  catalog,clock,saved,favorites:favoritePresets,colors:favoriteColors,excluded:individualExcluded,
  allowed:allowedGroups,protectedGroups,onToggleGroup:toggleSavedGroup,onBulkGroups:editDirectoryGroups,
  onFavorite:toggleFavorite,onExclude:toggleExcluded,onAllow:toggleAllowedArtist,
 };
 const memberName=id=>catalog?.members.find(m=>m.id===id)?.name||id;
 return localize(<div className={`app-shell${collapsed?' sidebar-collapsed':''}`} data-player-position={playing?playerPosition:undefined} data-player-minimized={playing?playerMinimized:undefined}>
 <button className="mobile-menu icon-button" aria-label="메뉴 열기" onClick={()=>setMobile(!mobile)}><Menu/></button>
 {mobile&&<button className="sidebar-scrim" aria-label="메뉴 닫기" onClick={()=>setMobile(false)}/>}
 <aside className={mobile?'sidebar is-open':'sidebar'}><button className="sidebar-collapse" aria-label={collapsed?'사이드바 펼치기':'사이드바 접기'} title={collapsed?'사이드바 펼치기':'사이드바 접기'} aria-expanded={!collapsed} onClick={()=>setCollapsed(s=>!s)}>{collapsed?<ChevronRight size={18}/>:<ChevronLeft size={18}/>}</button><a className="brand" href="#collection" onClick={e=>{e.preventDefault();go('home');}}><span className="brand-symbol"><Radio size={23}/></span>SONAR<span className="brand-dot">●</span></a><p className="brand-caption"><span>Search · Organize · Navigate</span><span>Archive · Replay</span></p>
 <div className="sidebar-tools"><label className="search sidebar-search"><Search size={17}/><input ref={sidebarSearchRef} aria-label="영상 채널 태그 검색" placeholder="영상, 채널, 태그 검색" value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')setMobile(false);}}/>{query&&<button className="icon-button" aria-label="검색 지우기" onClick={()=>setQuery('')}><X size={15}/></button>}</label><button className="sidebar-search-open" aria-label="영상 채널 태그 검색" title="영상 채널 태그 검색" onClick={()=>{setCollapsed(false);requestAnimationFrame(()=>sidebarSearchRef.current?.focus());}}><Search size={18}/></button><button className="theme-toggle sidebar-theme-toggle" onClick={()=>setTheme(t=>t==='dark'?'light':'dark')} aria-pressed={theme==='dark'} aria-label={theme==='dark'?'주간 모드로 전환':'야간 모드로 전환'} title={theme==='dark'?'주간 모드':'야간 모드'}>{theme==='dark'?<Sun size={18}/>:<Moon size={18}/>}</button></div><div className="language-switch" aria-label="Language">{LANGUAGES.map(([code,label])=><button key={code} aria-label={{ko:'한국어',ja:'日本語',en:'English',es:'Español'}[code]} lang={code} aria-pressed={language===code} onClick={()=>setLanguage(code)}>{label}</button>)}</div><button className="collapsed-groups" aria-label="그룹 추가하기" title="그룹 추가하기" onClick={openGroups}><Plus size={20}/></button><a className="artist-directory-link" href="#artists" aria-label="전체 아티스트 목록" title="전체 아티스트 목록" onClick={()=>setMobile(false)}><Layers size={15}/><span>전체 아티스트 목록</span></a><div className="sidebar-artist-types" role="group" aria-label="표시할 아티스트 유형"><button type="button" aria-pressed={enabledArtistTypes.length===DISPLAY_ARTIST_TYPES.length} onClick={()=>setEnabledArtistTypes([...DISPLAY_ARTIST_TYPES])}>전체</button>{DISPLAY_ARTIST_TYPES.map(id=><button key={id} aria-pressed={enabledArtistTypes.includes(id)} disabled={enabledArtistTypes.length===1&&enabledArtistTypes.includes(id)} title={enabledArtistTypes.length===1&&enabledArtistTypes.includes(id)?'최소 한 유형은 켜져 있어야 합니다.':undefined} onClick={()=>setEnabledArtistTypes(s=>toggleArtistType(s,id))}>{{girl:'여자',boy:'남자',mixed:'혼성','duo-solo':'듀오·솔로'}[id]}</button>)}</div><section className="live-section"><h2><span className="live-dot"/> LIVE NOW <span className="counter">{lives.length}</span></h2>{lives.length?lives.map(v=><button key={v.id} className="live-link" onClick={()=>open(v)}><Radio size={15}/>{v.title}</button>):<div className="live-empty"><Radio size={18}/><span>지금은 잠시 쉬어가는 중<small>공식 채널의 라이브만 모아요</small></span></div>}</section>
 <section className="mygroups-section"><h2>MY GROUPS<button className="mygroups-edit-toggle" onClick={openGroupEditor}>편집</button></h2>

 <div className="favorite-presets" aria-label="선호그룹 프리셋"><button className="all-groups-toggle" title="제외 그룹을 뺀 전체 선택 · 다시 누르면 선택 해제" aria-label={allGroupsAdded?'전체 선택 해제':'제외 그룹 빼고 전체 보기'} aria-pressed={allGroupsAdded} disabled={!catalog} onClick={toggleAllGroups}>전체</button>{presetOptions.map(([key,name,Icon])=><button key={key} data-preset={key} aria-label={`${name} 프리셋 (${favoritePresets[key].length}개 그룹)`} aria-pressed={viewPresets.includes(key)} title={`${name} 프리셋 선택 (${favoritePresets[key].length}개 그룹)`} onClick={()=>{setExcludeMode(false);setActivePreset(key);const next=viewPresets.includes(key)?viewPresets.filter(k=>k!==key):[...viewPresets,key];setViewPresets(next);const ids=[...new Set(next.flatMap(k=>favoritePresets[k]))];setSaved(s=>[...new Set([...s,...ids])]);dispatchSelection({type:'change',ids});}}><Icon size={18} fill={key==='clover'?'none':'currentColor'}/></button>)}</div>
 <div className="mygroups-count"><span>저장 {visibleSaved.length}개 · 선택 {visibleSaved.filter(id=>checkedIds.has(id)).length}개</span><button type="button" aria-pressed={onlyChecked} onClick={()=>{setSwipedGroup(null);setOnlyChecked(value=>!value);}}><SlidersHorizontal size={13}/>선택 그룹만</button></div>
 <div className="mygroups-search"><label className="search"><Search size={14}/><input aria-label="MY GROUPS 검색" placeholder="그룹 검색 · 한글 / 영문" value={myGroupQuery} onChange={e=>{setSwipedGroup(null);setMyGroupQuery(e.target.value);}}/></label>{myGroupQuery&&<button type="button" aria-label="그룹 검색 지우기" onClick={()=>setMyGroupQuery('')}><X size={14}/></button>}</div>
 {sidebarUndo&&<div className="mygroups-count mygroups-undo" role="status"><span>그룹을 제거했어요.</span><button type="button" onClick={()=>{sidebarUndo();setSidebarUndo(null);}}>실행 취소</button></div>}
 {myGroupQuery.trim()?<p className="mygroups-search-count" aria-live="polite">{matchingGroups.length?matchingGroups.length+'개 검색 결과':'검색 결과가 없어요.'}</p>:
 catalog&&!matchingGroups.length&&<p className="mygroups-search-count">{onlyChecked&&visibleSaved.length?'선택한 그룹이 없어요.':saved.length?'현재 유형에 표시할 그룹이 없어요.':'그룹을 추가하면 여기에 표시됩니다.'}</p>}
 <div className={matchingGroups.length>10?'mygroups-items mygroups-items-scroll':'mygroups-items'}>
  {matchingGroups.map(group=><SidebarGroupRow key={group.id} group={group} clock={clock} checked={checkedIds.has(group.id)}
   badges={presetOptions.filter(([key])=>favoritePresets[key].includes(group.id))} color={favoriteColors[group.id]}
   swiped={swipedGroup===group.id} onSwipe={setSwipedGroup} onToggle={id=>{setSwipedGroup(null);setSidebarUndo(null);toggle(id);}} onRemove={removeSidebarGroup}/>)}
 </div>
<button className="add-group" onClick={openGroups}><Plus size={15}/> 그룹 추가하기</button><button className="view-settings-open" onClick={openViewSettings}><Settings2 size={14}/> 보기 설정</button></section>

 <div className="sidebar-bottom"><div className="voyage-mini"><Disc3 size={23}/><span className="sonar-on-label">SONAR ON</span></div><small>SONAR · FAN-MADE ARCHIVE<br/>콘텐츠의 바다를 탐색하는 소나</small></div></aside>
 <main><h1 className="sr-only">SONAR · 비공식 K-POP 팬페이지</h1>
 {playing&&<section className="docked-player" data-size={playerSize} aria-label="영상 플레이어">
  <div className="docked-player-heading">
   <h2 data-no-translate title={playing.title}>{playing.title}</h2>
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
  <div className="docked-player-tools">
   <label className="search docked-player-search"><Search size={16}/>
    <input aria-label="영상 채널 태그 검색" placeholder="영상, 채널, 태그 검색" value={query} onChange={e=>setQuery(e.target.value)}/>
    {query&&<button type="button" className="icon-button" aria-label="검색 지우기" onClick={()=>setQuery('')}><X size={15}/></button>}
   </label>
   {!playerMinimized&&<div className="docked-player-options">
    <select aria-label="플레이어 위치" value={playerPosition} onChange={e=>setPlayerPosition(e.target.value)}>
     <option value="top">상단</option><option value="bottom-left">왼쪽 아래</option><option value="bottom-right">오른쪽 아래</option>
    </select>
    <select aria-label="플레이어 크기" value={playerSize} onChange={e=>setPlayerSize(e.target.value)}>
     <option value="small">작게</option><option value="medium">보통</option><option value="large">크게</option>
    </select>
   </div>}
   {!playing.demo&&!playerMinimized&&<div className="video-actions">
    <a className="youtube-link" target="_blank" rel="noreferrer" href={`https://www.youtube.com/watch?v=${encodeURIComponent(playing.platformId)}`}>YouTube에서 보기 <ArrowUpRight size={14}/></a>
    <button type="button" className="video-share-button" onClick={copyVideoUrl}><Copy size={14}/>주소 복사</button>
   </div>}
   <span className="video-share-status" role="status">{shareStatus}</span>
  </div>
 </section>}
 <div className="main-content">

 <div className="fan-page-note"><span>FAN PAGE</span><p>비공식 K-POP 팬페이지 · 아티스트·소속사와 무관한 팬 제작 아카이브입니다.</p>{lives.length>0&&<div className="top-live-status" ref={liveStatusRef}><button type="button" ref={liveStatusButtonRef} className="live-status-trigger" aria-expanded={livePanel} aria-controls="top-live-panel" aria-label={`현재 진행 중인 공식 라이브 ${lives.length}개 보기`} onClick={()=>setLivePanel(s=>!s)}><span className="live-status-dot" aria-hidden="true"/><span data-no-translate>LIVE ON</span><span className="live-status-count">{lives.length}</span></button>{livePanel&&<section id="top-live-panel" className="live-status-panel" aria-label="현재 진행 중인 라이브"><div className="live-status-heading"><strong>LIVE NOW</strong><small>{lives.length}개 진행 중</small></div>{lives.map(v=><button type="button" className="live-status-entry" key={v.id} onClick={()=>{setLivePanel(false);open(v);}}><Radio size={17}/><span><b data-no-translate>{v.groupIds.map(groupName).join(' · ')}</b><small data-no-translate>{v.title}</small></span><Play size={14}/></button>)}</section>}</div>}<DataRefreshTime value={catalog?.contentUpdatedAt}/></div>
 {directoryPage?<ArtistDirectory {...artistDirectoryProps}/>:<section className="library" id="collection"><div className="content-navigation"><nav className="content-tabs" aria-label="콘텐츠 종류">{menus.map(([id,name,Icon])=><button key={id} type="button" aria-current={category===id?'page':undefined} onClick={()=>go(id)} className={category===id?'content-tab active':'content-tab'}><Icon size={18}/><span>{name}</span></button>)}</nav></div><div className="section-title"><div><h2>{category==='uploads'?'업로드 달력':category==='home'?'모아보기':menus.find(m=>m[0]===category)?.[1]}<span>{category==='uploads'?calendarRows.length:filtered.length}</span></h2><p>{selected.length?selected.length>3?`${selected.slice(0,3).map(groupName).join(' · ')} 외 ${selected.length-3}개`:selected.map(groupName).join(' · '):'보고 싶은 그룹의 체크박스를 켜주세요'}</p></div><span className="sort-label">최신 업로드순 ↓</span></div>
 <div className="compact-filters" ref={compactFilterRef}><div className="compact-filter-toolbar"><div className="compact-filter-primary">{[['period',archiveYear||archiveMonth?[archiveYear,archiveMonth&&`${Number(archiveMonth)}월`].filter(Boolean).join(' · '):'전체 기간',CalendarDays],['group',filterGroup?groupName(filterGroup):'전체 그룹',Layers],['member',member?memberName(member):'멤버',Heart]].map(([id,label,Icon])=><button key={id} ref={el=>{filterTriggerRefs.current[id]=el;}} className="compact-filter-trigger" aria-expanded={openFilter===id} aria-controls={`filter-popover-${id}`} disabled={id==='member'&&!filterGroup} title={id==='member'&&!filterGroup?'그룹을 먼저 선택':undefined} onClick={()=>setOpenFilter(s=>s===id?'':id)}><Icon size={14}/><span>{label}</span><ChevronRight size={12} className={openFilter===id?'picker-chevron is-open':'picker-chevron'}/></button>)}</div><button ref={el=>{filterTriggerRefs.current.details=el;}} className="compact-filter-trigger compact-details-trigger" aria-expanded={openFilter==='details'} aria-controls="filter-popover-details" onClick={()=>setOpenFilter(s=>s==='details'?'':'details')}><SlidersHorizontal size={14}/><span>상세 필터</span>{[subtype,format,channel,externalType,ownType].filter(Boolean).length>0&&<small>{[subtype,format,channel,externalType,ownType].filter(Boolean).length}</small>}</button></div>

 {openFilter&&<div className="filter-popover" id={`filter-popover-${openFilter}`} role="region" aria-label={{period:'기간별 보기',group:'그룹 선택',member:'멤버 선택',details:'상세 필터'}[openFilter]}><div className="filter-popover-heading"><b>{{period:'기간별 보기',group:'그룹 선택',member:'멤버 선택',details:'상세 필터'}[openFilter]}</b><button className="icon-button" aria-label="닫기" onClick={closeFilter}><X size={16}/></button></div>
 {openFilter==='period'&&<>{filterButtons('연도',archiveYear,[['','전체 연도'],...archiveYears.map(y=>[y,`${y}년`])],id=>{setArchiveYear(id);closeFilter();})}{filterButtons('월',archiveMonth,[['','전체 월'],...Array.from({length:12},(_,i)=>[String(i+1).padStart(2,'0'),`${i+1}월`])],id=>{setArchiveMonth(id);closeFilter();})}<small className="filter-panel-note">업로드 날짜 · 한국 시간 기준</small></>}
 {openFilter==='group'&&filterButtons('그룹',filterGroup,[['','전체 그룹'],...(catalog?.groups||[]).filter(g=>selected.includes(g.id)).map(g=>[g.id,g.name])],id=>{setFilterGroup(id);setMember('');closeFilter();})}
 {openFilter==='member'&&filterGroup&&<>{filterButtons('멤버',member,[['','멤버 전체'],...(catalog?.members||[]).filter(m=>m.groupId===filterGroup).map(m=>[m.id,m.name])],id=>{setMember(id);closeFilter();})}<small className="member-tag-policy">확인된 이름만 태그 · 미확인 영상은 미분류</small></>}
 {openFilter==='details'&&<div className="individual-filter"><button type="button" role="switch" aria-checked={includeIndividual} onClick={()=>setIncludeIndividual(value=>!value)}><span className="switch-track" aria-hidden="true"/>멤버 단독 활동 포함</button></div>}
 {openFilter==='details'&&<div className="compact-detail-options" onClick={e=>{if(e.target.closest('button'))closeFilter();}}>{category==='own'&&<div className="external-type-tabs" aria-label="자체 콘텐츠 분류"><button className={!ownType?'chip selected':'chip'} onClick={()=>setOwnType('')}>전체</button>{OWN_TYPES.map(([id,name])=><button key={id} className={ownType===id?'chip selected':'chip'} onClick={()=>setOwnType(id)}>{name}</button>)}</div>}
 {category==='external'&&<><div className="external-type-tabs" aria-label="외부 콘텐츠 분류"><button className={!externalType?'chip selected':'chip'} onClick={()=>{setExternalType('');setChannel('');}}>전체</button>{EXTERNAL_TYPES.map(([id,name])=><button key={id} className={externalType===id?'chip selected':'chip'} onClick={()=>{setExternalType(id);setChannel('');}}>{name}</button>)}</div><div className="channel-tabs" aria-label="프로그램 및 채널"><button className={!channel?'chip selected':'chip'} onClick={()=>setChannel('')}>전체 채널</button>{channels.map(c=><button className={channel===c.id?'chip selected':'chip'} key={c.id} onClick={()=>setChannel(c.id)}>{c.groups.size>1?'✳ ':''}{c.name} <small>{c.count}</small></button>)}</div></>}
 {filterButtons('분류',subtype,[['','모든 세부 분류'],...[...new Set(rows.flatMap(v=>v.subtypes))].map(t=>[t,t])],setSubtype)}{filterButtons('형식',format,[['','모든 형식'],['video','영상'],...(category==='shorts'||category==='uploads'?[['short','쇼츠']]:[]),['live','라이브']],setFormat)}</div>}
 </div>}
 {(archiveYear||archiveMonth||filterGroup||member||subtype||format||channel||externalType||ownType)&&<div className="applied-filter-tags" aria-label="선택한 필터">{[[archiveYear,archiveYear,()=>setArchiveYear('')],[archiveMonth,`${Number(archiveMonth)}월`,()=>setArchiveMonth('')],[filterGroup,groupName(filterGroup),()=>{setFilterGroup('');setMember('');}],[member,memberName(member),()=>setMember('')],[subtype,subtype,()=>setSubtype('')],[format,{video:'영상',short:'쇼츠',live:'라이브'}[format],()=>setFormat('')],[channel,channels.find(c=>c.id===channel)?.name||channel,()=>setChannel('')],[externalType,EXTERNAL_TYPES.find(([id])=>id===externalType)?.[1],()=>setExternalType('')],[ownType,OWN_TYPES.find(([id])=>id===ownType)?.[1],()=>setOwnType('')]].filter(([value])=>value).map(([value,label,remove],index)=><button key={index} onClick={remove}><span>{label}</span><X size={11}/></button>)}<button className="clear-all-filters" onClick={()=>{setArchiveYear('');setArchiveMonth('');setFilterGroup('');setMember('');setSubtype('');setFormat('');setChannel('');setExternalType('');setOwnType('');setOpenFilter('');}}>초기화</button></div>}
 </div><>
 {indexesEnabled&&indexFailures.length>0&&<div className="index-notice" role="status"><span>{indexFailures.length}개 영상 목록을 불러오지 못했습니다.</span><button type="button" onClick={()=>setIndexRetry(value=>value+1)}>다시 시도</button></div>}
 {indexesEnabled&&indexLoading&&rows.length>0&&<p className="index-loading-note" role="status">{request.preview?'선택 그룹의 최신 영상을 불러오는 중…':'이전 영상을 불러오는 중…'}</p>}
 {browse&&request.preview&&!loading&&indexesEnabled&&<p className="index-loading-note">
  최근 {browse.days}일 우선{request.wide?'':' · 부족한 항목은 이전 기록 포함'} · {pageRows.length}개 표시
 </p>}
 {loading?<div className="empty" role="status">흩어진 순간들을 모아오는 중…</div>:error?<div className="empty" role="alert">{error}<button onClick={()=>{cache.clear();setRetry(x=>x+1);setIndexRetry(x=>x+1);setError('');}}>다시 시도</button></div> :category==='uploads'?<div className="upload-calendar"><p className="upload-calendar-note">유튜브 업로드 날짜 · 한국 시간 · 롱폼은 자체·외부 콘텐츠</p>{!calendarRows.length?<div className="empty">선택한 기간에 업로드된 영상이 없어요.</div>:uploadDays(calendarRows).map(day=><section className="upload-day" key={day.date}><div className="upload-day-heading"><time dateTime={day.date}>{day.date}</time><span>{day.items.length}</span></div><div className="upload-day-groups">{uploadGroupSummary(day.items,selected,includeIndividual).map(group=><div className="upload-group-summary" key={group.id} style={favoriteCardStyle([group.id],protectedGroups,favoriteColors,theme)}><div className="upload-group-line"><b className="upload-group-name" data-no-translate><span className="upload-group-presets">{presetOptions.filter(([key])=>favoritePresets[key].includes(group.id)).map(([key,name,Icon])=><span key={key} data-preset={key} role="img" aria-label={`${name} 선호그룹`} title={`${name} 선호그룹`}><Icon size={14} aria-hidden="true" fill={key==='clover'?'none':'currentColor'}/></span>)}</span><span>{groupName(group.id)}</span></b><div className="upload-type-counts">{[['live','LIVE',Radio],['short','Shorts',Smartphone],['long','롱폼',Clapperboard]].map(([kind,label,Icon])=>{const key=`${day.date}-${group.id}-${kind}`;return <button key={kind} className={`upload-type upload-type-${kind}`} disabled={!group[kind].length} title={`${label} · ${group[kind].length}`} aria-label={`${groupName(group.id)} ${label} · ${group[kind].length}`} aria-expanded={uploadExpansion===key} onClick={()=>setUploadExpansion(s=>s===key?'':key)}><Icon size={16}/><span>{group[kind].length}</span><span className="sr-only">{label}</span></button>;})}</div></div>{['live','short','long'].map(kind=>uploadExpansion===`${day.date}-${group.id}-${kind}`&&<div className="upload-expanded" key={kind}>{group[kind].map(v=><button key={v.id} className="upload-entry" onClick={()=>{open(v);}}><time>{new Date(v.publishedAt).toLocaleTimeString({ko:'ko-KR',ja:'ja-JP',en:'en-US',es:'es-ES'}[language],{timeZone:'Asia/Seoul',hour:'2-digit',minute:'2-digit',hour12:false})}</time><span><b data-no-translate>{v.title}</b><small data-no-translate>{v.channelName}</small></span><Play size={15}/></button>)}</div>)}</div>)}</div></section>)}</div>:!pageRows.length?<div className="empty">{selected.length?'조건에 맞는 영상이 없어요.':'표시할 그룹을 선택해주세요.'}<small>{selected.length?'그룹이나 필터를 바꿔보세요.':'왼쪽 MY GROUPS에서 체크하거나 그룹을 추가해주세요.'}</small>{!selected.length&&<button className="empty-add-group" onClick={openGroups}><Plus size={15}/> 그룹 추가하기</button>}</div>:<div className="video-grid">{pageRows.map((v,i)=><article className="video-card" style={favoriteCardStyle(v.groupIds,[...new Set(Object.values(favoritePresets).flat())],favoriteColors,theme)} key={v.id}><button className={`thumbnail tone-${i%6}`} onClick={()=>open(v)} aria-label={`${v.title} 보기`}>{v.thumbnail?<img src={v.thumbnail} loading="lazy" alt="" onError={e=>{e.currentTarget.style.display='none';}}/>:<div className="sample-art"><span className="sample-word">{groupName(v.groupIds[0])}</span><span className="sample-type">{v.subtypes[0]}<br/><b>{String(i+1+(page-1)*24).padStart(2,'0')}</b></span><Disc3 size={85}/></div>}<span className="category-badge">{category==='station'?'LIVE STATION':v.demo?'SAMPLE':isMusicBroadcast(v)?'음악방송':isShortContent(v)?(v.format==='short'||v.category==='shorts'?'쇼츠':'짧은 클립'):v.format==='live'?'라이브':v.subtypes[0]}</span><span className="play-circle"><Play size={21} fill="currentColor"/></span><span className="duration">{v.durationLabel||'VIDEO'}</span></button><div className="video-meta"><VideoArtistTags video={v} groupsById={groupsById} onSearch={setQuery}/><small>{new Date(v.publishedAt).toLocaleDateString('ko-KR')}</small></div><button className="video-title" data-no-translate onClick={()=>open(v)}>{v.title}</button><p className="channel-name">{v.channelName}<span> · {isMusicBroadcast(v)?'음악방송':isShortContent(v)?(v.format==='short'||v.category==='shorts'?'쇼츠':'짧은 클립'):v.format==='live'?'라이브':v.subtypes[0]}</span></p>{v.format==='live'&&<div className="card-member-tags">{v.memberIds.length?v.memberIds.map(id=><button key={id} onClick={()=>{go('live');setFilterGroup(catalog?.members.find(m=>m.id===id)?.groupId||'');setMember(id);}}>{memberName(id)}</button>):<span>미분류</span>}</div>}</article>)}</div>}
 {!loading&&(showMore||pageRows.length>6)&&<div className="archive-load-more">{showMore&&<button type="button" disabled={indexLoading} onClick={moreVideos}>이전 영상 더 보기</button>}{pageRows.length>6&&<button type="button" onClick={()=>document.getElementById('collection')?.scrollIntoView({block:'start'})}>맨 위로</button>}</div>}
 {(!compactBrowse&&category!=='uploads')&&filtered.length>PAGE_SIZE&&<div className="pagination"><button aria-label="이전 페이지" disabled={page===1} onClick={()=>setPage(p=>p-1)}><ChevronLeft size={18}/></button><span>{page} <small>/ {Math.ceil(filtered.length/PAGE_SIZE)}</small></span><button aria-label="다음 페이지" disabled={page>=Math.ceil(filtered.length/PAGE_SIZE)} onClick={()=>setPage(p=>p+1)}><ChevronRight size={18}/></button><small>페이지당 {PAGE_SIZE}개</small></div>}</>
</section>}<footer>SONAR <span>흩어진 K-POP 콘텐츠를 찾아 모으는 곳, SONAR.</span><small>Fan-made · 영상 저작권은 각 권리자에게 있습니다.</small></footer></div></main>
 {add&&<div className="modal-backdrop" onClick={()=>setAdd(false)}><section className={viewSettings?"modal":"modal group-editor-modal"} role="dialog" aria-modal="true" aria-label={viewSettings?'보기 설정':editingGroups?'MY GROUPS 편집':'그룹 추가하기'} tabIndex={-1} ref={modalRef} onClick={e=>e.stopPropagation()}><button className="modal-close icon-button" aria-label="닫기" onClick={()=>setAdd(false)}><X/></button>{viewSettings?<><p className="eyebrow">VIEW PREFERENCES</p><h2>보기 설정</h2><div className="view-settings-tabs"><button aria-pressed={settingsPage==='favorites'} onClick={()=>setSettingsPage('favorites')}>선호 목록</button><button aria-pressed={settingsPage==='exclusions'} onClick={()=>{setExclusionList('all');setSettingsPage('exclusions');}}>제외 설정</button></div><label className="search group-search"><Search size={17}/><input autoFocus placeholder="그룹 이름 검색" aria-label="아티스트 검색" value={groupQuery} onChange={e=>setGroupQuery(e.target.value)}/></label><nav className="artist-category-tabs" aria-label="아티스트 유형">{ARTIST_CATEGORIES.map(([id,label])=><button key={id} aria-pressed={artistTab===id} onClick={()=>setArtistTab(id)}>{label}<small>{artistsInCategory(catalog?.groups||[],id).length}</small></button>)}</nav>{settingsPage==='favorites'?<><div className="settings-preset-selector">{presetOptions.map(([key,name,Icon])=><button key={key} data-preset={key} aria-pressed={activePreset===key} onClick={()=>setActivePreset(key)}><Icon size={17} fill={key==='clover'?'none':'currentColor'}/><span>{name}</span><small>{favoritePresets[key].length}</small></button>)}</div><div className="view-settings-list">{sortGroups(artistDirectory.filter(g=>matchesArtistName(g,groupQuery)),groupSort).map(g=><div className="view-setting-row" key={g.id}><button className="setting-membership" aria-pressed={favoritePresets[activePreset].includes(g.id)} onClick={()=>toggleFavorite(activePreset,g.id)}><FavoriteIcon size={16} fill={activePreset==='clover'?'none':favoritePresets[activePreset].includes(g.id)?'currentColor':'none'}/><b data-no-translate>{g.name}<ActivityIcon group={g} clock={clock}/></b>{favoritePresets[activePreset].includes(g.id)&&<Check size={14}/>}</button>{Object.values(favoritePresets).some(ids=>ids.includes(g.id))&&<input type="color" className="group-color" aria-label={`${g.name} 선호 색상`} value={favoriteColors[g.id]||'#729ca8'} onChange={e=>setFavoriteColors(c=>({...c,[g.id]:e.target.value}))}/>}</div>)}</div></>:<><section className="exclusion-policy-panel"><h3>유형별 제외</h3><div className="blocked-type-controls">{ARTIST_CATEGORIES.filter(([id])=>id!=='all').map(([id,name])=><button key={id} aria-pressed={blockedTypes.includes(id)} onClick={()=>toggleBlockedType(id)}><Ban size={14}/><span>{name}</span><small>{blockedTypes.includes(id)?'유형 전체 제외':'허용'}</small></button>)}</div></section><div className="exclusion-list-tabs">{[['all','전체'],['individual','개별 제외'],...((blockedTypes.length||allowedGroups.length||protectedGroups.length)?[['exceptions','예외 허용']]:[])].map(([id,name])=><button key={id} aria-pressed={exclusionList===id} onClick={()=>setExclusionList(id)}>{name}</button>)}</div><div className="view-settings-list">{sortGroups(artistDirectory.filter(g=>matchesArtistName(g,groupQuery)).filter(g=>exclusionList==='individual'?individualExcluded.includes(g.id):exclusionList==='exceptions'?(blockedTypes.includes(artistCategory(g))||allowedGroups.includes(g.id)||protectedGroups.includes(g.id)):true),groupSort).map(g=><div className="exclusion-setting-row" key={g.id}><div><b data-no-translate>{g.name}<ActivityIcon group={g} clock={clock}/></b><small>{protectedGroups.includes(g.id)?'선호그룹 · 자동 예외 허용':allowedGroups.includes(g.id)?'예외 허용':individualExcluded.includes(g.id)?'개별 제외됨':excludedGroups.includes(g.id)?'유형 전체 제외됨':allowedGroups.includes(g.id)&&blockedTypes.includes(artistCategory(g))?'유형 제외의 예외로 허용됨':'표시 허용'}</small></div><div className="exclusion-row-actions"><button disabled={protectedGroups.includes(g.id)} title={protectedGroups.includes(g.id)?'선호그룹은 자동 예외 허용됩니다.':undefined} aria-pressed={!protectedGroups.includes(g.id)&&individualExcluded.includes(g.id)} onClick={()=>toggleExcluded(g.id)}><Ban size={13}/> 개별 제외</button>{<button disabled={protectedGroups.includes(g.id)} aria-pressed={protectedGroups.includes(g.id)||allowedGroups.includes(g.id)} title={protectedGroups.includes(g.id)?'선호그룹은 자동 예외 허용됩니다.':undefined} onClick={()=>toggleAllowedArtist(g.id)}><Check size={13}/> 예외 허용</button>}</div></div>)}</div></>}</>:<ArtistDirectory {...artistDirectoryProps}
  editorTitle={editingGroups?'MY GROUPS 편집':'그룹 추가하기'} initialSavedOnly={editingGroups}
  editorSort={groupSort} onEditorSort={setGroupSort}/>}
  {viewSettings&&<div className="simple-group-dialog-footer"><span>변경 즉시 반영</span><button onClick={()=>setAdd(false)}>닫기</button></div>}</section></div>}
 </div>,language);
}
createRoot(document.getElementById('root')).render(<App/>);
