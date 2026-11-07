import React,{useEffect,useId,useMemo,useRef,useState} from 'react';
import {ArrowUp,ArrowDownUp,ChevronLeft,Heart,ListChecks,Search,SlidersHorizontal,Sprout,Star,X} from 'lucide-react';
import {debutYearRanges,recommendedArtists} from './lib';
import {DIRECTORY_ACTIVITY_STATES,directoryResults,isArtistSearch,matchesDirectoryActivity,matchesDirectoryScope} from './directory';
import {ACTIVITY_META,activityView} from './youtube-activity';
import {officialLinksFor} from './official-links';
import {ActivityGlyph} from './ActivityIcon';
import ArtistDirectoryRow from './ArtistDirectoryRow';
import DirectoryFilters,{DEFAULT_DIRECTORY_FILTERS,DIRECTORY_SCOPES} from './DirectoryFilters';
import {artistInitials,INITIAL_ROWS} from './directory-shortcuts';
import './directory-compact.css';

const TYPES=[['all','전체'],['girl','여자'],['boy','남자'],['mixed','혼성'],['duo-solo','듀오·솔로']];
const SORTS=[['az','이름 A–Z'],['debut-desc','데뷔 최신순'],['debut-asc','데뷔 오래된순']];
const EMPTY=[];
const PRESETS=[['heart','하트',Heart],['star','별',Star],['clover','새싹',Sprout]];
const RECOMMEND=['SURGE','SAILING','COASTING'];

function ActivityFilterButton({state,count,status,onChange}){
 const active=status===state;
 const label=state==='all'?'전체':state;
 const activity=ACTIVITY_META[state];
 return <button type="button" className="directory-control" disabled={Boolean(activity)&&!count&&!active}
  style={activity?{'--toggle-accent':activity.color}:undefined}
  aria-pressed={active} aria-label={`${label} 활동 필터, ${count}개`}
  title={`${label} · ${count}개`} onClick={()=>onChange(active?'all':state)}>
  {activity?<><ActivityGlyph icon={activity.icon} size={17}/><span>{count}</span></>:label}
 </button>;
}

export default function ArtistDirectory({catalog,clock,saved,favorites,colors,excluded,allowed,protectedGroups,
 onToggleGroup,onBulkGroups,onFavorite,onExclude,onAllow,editorTitle,initialSavedOnly=false,editorSort,onEditorSort,
 selected=EMPTY,onBulkSelection}){
 const [query,setQuery]=useState(''),[type,setType]=useState('all'),[directorySort,setDirectorySort]=useState('az');
 const sort=editorSort??directorySort;
 const setSort=onEditorSort??setDirectorySort;
 const [filters,setFilters]=useState(()=>({...DEFAULT_DIRECTORY_FILTERS,savedOnly:initialSavedOnly}));
 const [expanded,setExpanded]=useState(''),[editing,setEditing]=useState(false);
 const [undo,setUndo]=useState(null),[showTop,setShowTop]=useState(false);
 const [initialOpen,setInitialOpen]=useState(false),[initial,setInitial]=useState('');
 const [editMode,setEditMode]=useState(''),[preset,setPreset]=useState('star');
 const favoriteEdit=editMode==='favorites',selectionEdit=editMode==='selection';
 const filterDialog=useRef(null);
 const listRef=useRef(null);
 const instanceId=useId();
 const bulkId=`${instanceId}-directory-bulk`;
 const initialsId=`${instanceId}-directory-initials`;
 useEffect(()=>{
  if(editorTitle)return;
  const update=()=>setShowTop(window.scrollY>400);
  update();
  window.addEventListener('scroll',update,{passive:true});
  return()=>window.removeEventListener('scroll',update);
 },[editorTitle]);
 const groups=catalog?.groups||EMPTY,channels=catalog?.channels||EMPTY;
 const groupMap=useMemo(()=>new Map(groups.map(group=>[group.id,group])),[groups]);
 const savedIds=useMemo(()=>new Set(saved),[saved]);
 const selectedIds=useMemo(()=>new Set(selected),[selected]);
 const excludedIds=useMemo(()=>new Set(excluded),[excluded]);
 const lockedIds=useMemo(()=>new Set(protectedGroups),[protectedGroups]);
 const favoriteIds=useMemo(()=>Object.fromEntries(Object.entries(favorites).map(([key,ids])=>[key,new Set(ids)])),[favorites]);
 const connected=useMemo(()=>{
  const byGroup=new Map();
  for(const source of channels){
   if(!source.official||!source.platformId||source.unavailableReason)continue;
   for(const id of source.groupIds||[]){
    if(!byGroup.has(id))byGroup.set(id,[]);
    byGroup.get(id).push(source);
   }
  }
  return new Set(groups.filter(group=>officialLinksFor(group,byGroup.get(group.id)).some(link=>link.platform==='youtube')).map(group=>group.id));
 },[groups,channels]);
 const years=useMemo(()=>[['all','전체 연도'],...debutYearRanges(groups).map(({id,label})=>[id,label]),['unknown','연도 미확인']],[groups]);
 const {status,scope,year,savedOnly}=filters;
 const baseResults=useMemo(()=>{
  const rows=directoryResults(groups,{query,type,status:'all',year,sort,now:clock,narrowSearch:true});
  return rows.filter(group=>(!(selectionEdit||savedOnly)||savedIds.has(group.id))&&matchesDirectoryScope(group,scope,clock)&&(!initial||artistInitials(group).includes(initial)));
 },[groups,query,type,scope,year,savedOnly,selectionEdit,sort,clock,savedIds,initial]);
 const results=useMemo(()=>{
  const recommendationFilter=favoriteEdit&&RECOMMEND.includes(status);
  const matches=status==='all'?baseResults:baseResults.filter(group=>
   (!recommendationFilter||!excludedIds.has(group.id))&&matchesDirectoryActivity(group,status,clock));
  if(!favoriteEdit)return matches;
  const pinned=favoriteIds[preset];
  return [...matches.filter(group=>pinned.has(group.id)),...matches.filter(group=>!pinned.has(group.id))];
 },[baseResults,status,clock,favoriteEdit,excludedIds,favoriteIds,preset]);
 const editingIds=selectionEdit?selectedIds:savedIds;
 const editedCount=results.filter(group=>editingIds.has(group.id)).length;
 const activityCounts=useMemo(()=>{
  const counts=new Map(DIRECTORY_ACTIVITY_STATES.map(state=>[state,0]));
  if(!editorTitle||favoriteEdit){
   for(const group of baseResults){
    if(favoriteEdit&&excludedIds.has(group.id))continue;
    const state=activityView(group,clock)?.state;
    if(counts.has(state))counts.set(state,counts.get(state)+1);
   }
  }
  return counts;
 },[editorTitle,favoriteEdit,baseResults,clock,excludedIds]);
 const suggestions=editorTitle&&!saved.length&&!results.length?recommendedArtists(groups,saved,excluded):EMPTY;
 const updateFilters=patch=>{setExpanded('');setFilters(previous=>({...previous,...patch}));};
 const resetFilters=()=>updateFilters(DEFAULT_DIRECTORY_FILTERS);
 const search=value=>{
  if(!isArtistSearch(query)&&isArtistSearch(value)){
   setType('all');updateFilters({year:'all',...(editorTitle?{savedOnly:false}:{})});
  }
  setExpanded('');setInitial('');setQuery(value);
 };
 const chips=[
  filters.scope!=='all'&&[DIRECTORY_SCOPES.find(([id])=>id===filters.scope)[1],()=>updateFilters({scope:'all'})],
  status!=='all'&&(editorTitle||!ACTIVITY_META[status])&&[status==='unknown'?'상태 미확인':status,()=>updateFilters({status:'all'})],
  filters.year!=='all'&&[years.find(([id])=>id===filters.year)?.[1]||filters.year,()=>updateFilters({year:'all'})],
  filters.savedOnly&&['MY GROUPS만',()=>updateFilters({savedOnly:false})],
 ].filter(Boolean);
 const updateResults=enabled=>{
  const ids=results.filter(group=>editingIds.has(group.id)!==enabled).map(group=>group.id);
  if(ids.length)setUndo({count:ids.length,enabled,selectionEdit,restore:(selectionEdit?onBulkSelection:onBulkGroups)(ids,enabled)});
 };
 const changeActivity=status=>{updateFilters({status});listRef.current?.scrollTo({top:0});};
 const toggleEdit=mode=>{
  setExpanded('');setUndo(null);
  if(editMode!==mode&&mode==='favorites')updateFilters({savedOnly:false});
  setEditMode(editMode===mode?'':mode);
 };
 const showFilters=event=>{
  const dialog=filterDialog.current;
  const box=event.currentTarget.getBoundingClientRect();
  dialog.style.setProperty('--directory-filter-right',`${Math.max(12,window.innerWidth-box.right)}px`);
  dialog.style.setProperty('--directory-filter-top',`${box.bottom+8}px`);
  dialog.showModal();
 };
 return <section className={`artist-directory-page directory-compact${editorTitle?' directory-editor':''}`} aria-label={editorTitle||'전체 아티스트 목록'}>
  <header className="directory-compact-heading">
   {editorTitle?<h2>{editorTitle} <small>{saved.length}개 저장</small></h2>:<>
    <a href="#collection"><ChevronLeft size={16}/><span>영상으로</span></a>
    <h2>전체 아티스트 <small>{groups.length}</small></h2>
   </>}
  </header>
  <div className="directory-search">
   <label className="search"><Search size={17}/><input value={query} onChange={event=>search(event.target.value)}
    placeholder="아티스트·출신 그룹 검색" aria-label={editorTitle?'그룹 검색':'전체 아티스트 검색'}/></label>
   {query&&<button type="button" className="directory-control directory-icon" aria-label="검색 지우기" onClick={()=>search('')}><X size={16}/></button>}
  </div>
  <nav className="directory-type-tabs" aria-label="목록 아티스트 유형">
   {TYPES.map(([id,label])=><button type="button" key={id} aria-pressed={type===id}
    onClick={()=>{setExpanded('');setType(id);}}>{label}</button>)}
  </nav>
  <div className="directory-shortcuts">
   <button type="button" className="directory-control" aria-expanded={initialOpen} aria-controls={initialsId} onClick={()=>setInitialOpen(value=>!value)}>이름 첫 글자{initial?' · '+initial:''}</button>
   {!editorTitle&&<div className="directory-selection-toggles" role="group" aria-label="YouTube 활동 상태 필터">
    {[['all',baseResults.length],...activityCounts].map(([state,count])=>
     <ActivityFilterButton key={state} state={state} count={count} status={status} onChange={changeActivity}/>)}
   </div>}
   {editorTitle&&<button type="button" className="directory-control" aria-pressed={favoriteEdit}
    onClick={()=>toggleEdit('favorites')}>선호그룹 편집</button>}
   {initialSavedOnly&&<button type="button" className="directory-control" aria-pressed={selectionEdit}
    onClick={()=>toggleEdit('selection')}>선택그룹 편집</button>}
  </div>
  <nav className="directory-initials" id={initialsId} aria-label="이름 첫 글자로 찾기" hidden={!initialOpen}>
   {INITIAL_ROWS.map(([label,letters],row)=><div key={label} className="directory-initial-row" role="group" aria-label={label}>
    {(row===0?['',...letters]:letters).map(letter=><button key={letter} className="directory-control" type="button"
     aria-pressed={initial===letter} onClick={()=>{setInitial(letter);setSort('az');setExpanded('');listRef.current?.scrollTo({top:0});}}>{letter||'전체'}</button>)}
   </div>)}
  </nav>
  {favoriteEdit&&<div className="directory-favorite-panel">
   <div className="directory-favorite-options" aria-label="담을 선호 목록"><small>담을 곳</small>{PRESETS.map(([key,label,Icon])=>
    <button key={key} type="button" className="directory-control" aria-pressed={preset===key} onClick={()=>setPreset(key)}><Icon size={14}/>{label}</button>)}</div>
   <div className="directory-favorite-options"><small>추천 그룹</small>
    <div className="directory-selection-toggles directory-recommendation-toggles" role="group" aria-label="추천 그룹 활동 필터">{RECOMMEND.map(state=>
     <ActivityFilterButton key={state} state={state} count={activityCounts.get(state)} status={status} onChange={changeActivity}/>)}</div>
   </div>
  </div>}
  <div className="directory-list-toolbar">
   <strong aria-live="polite">결과 {results.length}명</strong>
   <div className="directory-toolbar-actions">
    <label className="directory-control directory-sort"><ArrowDownUp size={14}/><span>정렬</span>
     <select value={sort} onChange={event=>setSort(event.target.value)} aria-label="아티스트 목록 정렬">
      {editorTitle&&<option value="default">기본순</option>}
      {SORTS.map(([id,label])=><option key={id} value={id}>{label}</option>)}
     </select>
    </label>
    <button type="button" className="directory-control" aria-haspopup="dialog" onClick={showFilters}>
     <SlidersHorizontal size={15}/>필터{chips.length>0&&<small className="directory-filter-count">{chips.length}</small>}
    </button>
    {editorTitle&&!selectionEdit&&<button type="button" className="directory-control" aria-expanded={editing} aria-controls={editing?bulkId:undefined}
     onClick={()=>setEditing(value=>!value)}><ListChecks size={15}/><span>일괄 작업</span></button>}
   </div>
  </div>
  {chips.length>0&&<div className="directory-applied-chips" aria-label="적용된 아티스트 필터">
   {chips.map(([label,remove])=><button type="button" key={label} aria-label={`${label} 필터 해제`} onClick={remove}><span>{label}</span><X size={12}/></button>)}
   <button type="button" className="directory-chip-reset" onClick={resetFilters}>초기화</button>
  </div>}
  {(!editorTitle||editing||selectionEdit)&&<div className="directory-bulk-panel" id={bulkId}>
   <small>현재 결과 {results.length}명 중 {editedCount}명 {selectionEdit?'선택':'저장'}</small>
   <div className="directory-bulk" role="group" aria-label="현재 결과 MY GROUPS 일괄 선택">
    <button type="button" disabled={editedCount===results.length} onClick={()=>updateResults(true)}>{editorTitle&&!selectionEdit?'결과 일괄 추가':'결과 전체 선택'}</button>
    <button type="button" disabled={!editedCount} onClick={()=>updateResults(false)}>{editorTitle&&!selectionEdit?'결과 일괄 제거':'결과 전체 해제'}</button>
   </div>
  </div>}
  {undo&&<div className="index-notice" role="status">
   <span>{undo.count}개 그룹을 {undo.selectionEdit?(undo.enabled?'선택':'선택 해제'):(undo.enabled?'추가':'제거')}했습니다.</span>
   <button type="button" onClick={()=>{undo.restore?.();setUndo(null);}}>실행 취소</button>
  </div>}
  <div className="directory-rows" ref={listRef} onScroll={editorTitle?event=>setShowTop(event.currentTarget.scrollTop>220):undefined}>
   {results.map(artist=><ArtistDirectoryRow key={artist.id} artist={artist} detailsId={`${instanceId}-${artist.id}`} groups={groupMap} channels={channels} clock={clock}
    saved={editingIds.has(artist.id)} selectionEdit={selectionEdit} favorites={favoriteIds} color={colors[artist.id]} locked={lockedIds.has(artist.id)}
    excluded={excluded.includes(artist.id)} allowed={allowed.includes(artist.id)} expanded={expanded===artist.id}
    connected={connected.has(artist.id)} onExpand={id=>setExpanded(current=>current===id?'':id)}
    onSave={id=>{setUndo(null);if(selectionEdit)onBulkSelection([id],!selectedIds.has(id));else onToggleGroup(id);}} onFavorite={onFavorite} onExclude={onExclude}
    onAllow={onAllow} onCareerSearch={search} quickPreset={favoriteEdit?PRESETS.find(([key])=>key===preset):null}/>)}
  </div>
  {!catalog?<p role="status">아티스트 목록을 불러오는 중…</p>:!results.length&&<div className="empty">
   조건에 맞는 아티스트가 없습니다.
   {chips.length>0&&<button type="button" className="directory-control" onClick={resetFilters}>필터 초기화</button>}
  </div>}
  {suggestions.length>0&&<div className="directory-applied-chips" aria-label="추천 아티스트">
   {suggestions.map(artist=><button type="button" key={artist.id} onClick={()=>onToggleGroup(artist.id)}>{artist.name} 추가</button>)}
  </div>}
  <DirectoryFilters titleId={`${instanceId}-directory-filter-title`} dialogRef={filterDialog} filters={filters} years={years} update={updateFilters} reset={resetFilters} resultCount={results.length}/>
  {showTop&&<button type="button" className={`directory-back-top${editorTitle?' directory-editor-top':''}`}
   onClick={()=>(editorTitle?listRef.current:window)?.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})}
   aria-label="맨 위로 가기"><ArrowUp size={17}/><span>맨 위로</span></button>}
 </section>;
}
