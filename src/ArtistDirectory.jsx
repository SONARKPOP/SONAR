import React,{useEffect,useId,useMemo,useRef,useState} from 'react';
import {ArrowUp,ArrowDownUp,ChevronLeft,Heart,ListChecks,Search,SlidersHorizontal,Sprout,Star,X} from 'lucide-react';
import {debutYearRanges,recommendedArtists} from './lib';
import {DIRECTORY_ACTIVITY_STATES,directoryResults,isArtistSearch,matchesDirectoryScope} from './directory';
import {ACTIVITY_META,activityView} from './youtube-activity';
import {officialLinksFor} from './official-links';
import {ActivityGlyph} from './ActivityIcon';
import ArtistDirectoryRow from './ArtistDirectoryRow';
import DirectoryFilters,{DEFAULT_DIRECTORY_FILTERS,DIRECTORY_SCOPES} from './DirectoryFilters';
import {activityRecommendations,artistInitials,INITIAL_ROWS} from './directory-shortcuts';
import './directory-compact.css';

const TYPES=[['all','전체'],['girl','여자'],['boy','남자'],['mixed','혼성'],['duo-solo','듀오·솔로']];
const SORTS=[['az','이름 A–Z'],['debut-desc','데뷔 최신순'],['debut-asc','데뷔 오래된순']];
const EMPTY=[];
const PRESETS=[['heart','하트',Heart],['star','별',Star],['clover','새싹',Sprout]];
const RECOMMEND=[['steady','꾸준히 업로드'],['hot','지금 활발'],['recent','최근 업로드']];

export default function ArtistDirectory({catalog,clock,saved,favorites,colors,excluded,allowed,protectedGroups,
 onToggleGroup,onBulkGroups,onFavorite,onExclude,onAllow,editorTitle,initialSavedOnly=false,editorSort,onEditorSort}){
 const [query,setQuery]=useState(''),[type,setType]=useState('all'),[directorySort,setDirectorySort]=useState('az');
 const sort=editorSort??directorySort;
 const setSort=onEditorSort??setDirectorySort;
 const [filters,setFilters]=useState(()=>({...DEFAULT_DIRECTORY_FILTERS,savedOnly:initialSavedOnly}));
 const [expanded,setExpanded]=useState(''),[editing,setEditing]=useState(false);
 const [undo,setUndo]=useState(null),[showTop,setShowTop]=useState(false);
 const [initialOpen,setInitialOpen]=useState(false),[initial,setInitial]=useState('');
 const [favoriteEdit,setFavoriteEdit]=useState(false),[preset,setPreset]=useState('star'),[recommend,setRecommend]=useState('steady');
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
 const results=useMemo(()=>{
  const rows=directoryResults(groups,{query,type,status:filters.status,year:filters.year,sort,now:clock,narrowSearch:true});
  const matches=rows.filter(group=>(!filters.savedOnly||savedIds.has(group.id))&&matchesDirectoryScope(group,filters.scope,clock)&&(!initial||artistInitials(group).includes(initial)));
  if(!favoriteEdit)return matches;
  const pinned=favoriteIds[preset];
  return [...matches.filter(group=>pinned.has(group.id)),...matches.filter(group=>!pinned.has(group.id))];
 },[groups,query,type,filters,sort,clock,savedIds,initial,favoriteEdit,favoriteIds,preset]);
 const recommendations=useMemo(()=>favoriteEdit?
  activityRecommendations(groups,{clock,type,mode:recommend,favorites:favoriteIds[preset],excluded}):EMPTY,
 [groups,clock,type,recommend,favoriteIds,preset,excluded,favoriteEdit]);
 const [,presetLabel,PresetIcon]=PRESETS.find(([key])=>key===preset);
 const savedCount=results.filter(group=>savedIds.has(group.id)).length;
 const activityBatches=useMemo(()=>{
  const batches=new Map(DIRECTORY_ACTIVITY_STATES.map(state=>[state,[]]));
  if(!editorTitle){
   for(const group of results)batches.get(activityView(group,clock)?.state)?.push(group);
  }
  return batches;
 },[editorTitle,results,clock]);
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
  filters.status!=='all'&&[filters.status==='unknown'?'상태 미확인':filters.status,()=>updateFilters({status:'all'})],
  filters.year!=='all'&&[years.find(([id])=>id===filters.year)?.[1]||filters.year,()=>updateFilters({year:'all'})],
  filters.savedOnly&&['MY GROUPS만',()=>updateFilters({savedOnly:false})],
 ].filter(Boolean);
 const updateResults=(enabled,groupsToUpdate=results)=>{
  const ids=groupsToUpdate.filter(group=>savedIds.has(group.id)!==enabled).map(group=>group.id);
  if(ids.length)setUndo({count:ids.length,enabled,restore:onBulkGroups(ids,enabled)});
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
   {!editorTitle&&<div className="directory-selection-toggles" role="group" aria-label="현재 결과 MY GROUPS 선택">
    {[[null,results],...activityBatches].map(([state,matches])=>{
     const count=state?matches.filter(group=>savedIds.has(group.id)).length:savedCount;
     const allSelected=matches.length>0&&count===matches.length;
     const label=state||'전체';
     const activity=ACTIVITY_META[state];
     return <button key={label} type="button" className="directory-control" disabled={!matches.length}
      style={activity?{'--toggle-accent':activity.color}:undefined}
      aria-pressed={allSelected?true:count?'mixed':false} aria-label={`${label} 그룹 선택 토글, ${matches.length}개 중 ${count}개 선택`}
      title={`${label} · ${count}/${matches.length} 선택`} onClick={()=>updateResults(!allSelected,matches)}>
      {activity?<><ActivityGlyph icon={activity.icon} size={17}/><span>{matches.length}</span></>:label}
     </button>;
    })}
   </div>}
   {editorTitle&&<button type="button" className="directory-control" aria-expanded={favoriteEdit}
    onClick={()=>{if(!favoriteEdit)updateFilters({savedOnly:false});setFavoriteEdit(value=>!value);}}>선호그룹 편집</button>}
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
   <div className="directory-favorite-options" aria-label="추천 그룹"><small>추천 그룹</small>{RECOMMEND.map(([id,label])=>
    <button key={id} type="button" className="directory-control" aria-pressed={recommend===id} onClick={()=>setRecommend(id)}>{label}</button>)}</div>
   {recommendations.length?<ul className="directory-recommendations">{recommendations.map(({artist,view})=><li key={artist.id}>
    <span><b data-no-translate>{artist.name}</b><small>{view.state} · 최근 7일 {view.uploads7d??0}개</small></span>
    <button type="button" className="directory-control directory-icon" aria-label={`${artist.name} ${presetLabel}에 담기`} onClick={()=>onFavorite(preset,artist.id)}><PresetIcon size={15}/></button>
   </li>)}</ul>:<small>추천 조건에 맞는 그룹이 없어요.</small>}
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
    {editorTitle&&<button type="button" className="directory-control" aria-expanded={editing} aria-controls={editing?bulkId:undefined}
     onClick={()=>setEditing(value=>!value)}><ListChecks size={15}/><span>일괄 작업</span></button>}
   </div>
  </div>
  {chips.length>0&&<div className="directory-applied-chips" aria-label="적용된 아티스트 필터">
   {chips.map(([label,remove])=><button type="button" key={label} aria-label={`${label} 필터 해제`} onClick={remove}><span>{label}</span><X size={12}/></button>)}
   <button type="button" className="directory-chip-reset" onClick={resetFilters}>초기화</button>
  </div>}
  {editorTitle&&editing&&<div className="directory-bulk-panel" id={bulkId}>
   <small>현재 결과 {results.length}명 중 {savedCount}명 저장</small>
   <div className="directory-bulk" role="group" aria-label="현재 목록 MY GROUPS 일괄 편집">
    <button type="button" disabled={savedCount===results.length} onClick={()=>updateResults(true)}>결과 일괄 추가</button>
    <button type="button" disabled={!savedCount} onClick={()=>updateResults(false)}>결과 일괄 제거</button>
   </div>
  </div>}
  {undo&&<div className="index-notice" role="status">
   <span>{undo.count}개 그룹을 {undo.enabled?'추가':'제거'}했습니다.</span>
   <button type="button" onClick={()=>{undo.restore?.();setUndo(null);}}>실행 취소</button>
  </div>}
  <div className="directory-rows" ref={listRef} onScroll={editorTitle?event=>setShowTop(event.currentTarget.scrollTop>220):undefined}>
   {results.map(artist=><ArtistDirectoryRow key={artist.id} artist={artist} detailsId={`${instanceId}-${artist.id}`} groups={groupMap} channels={channels} clock={clock}
    saved={savedIds.has(artist.id)} favorites={favoriteIds} color={colors[artist.id]} locked={lockedIds.has(artist.id)}
    excluded={excluded.includes(artist.id)} allowed={allowed.includes(artist.id)} expanded={expanded===artist.id}
    connected={connected.has(artist.id)} onExpand={id=>setExpanded(current=>current===id?'':id)}
    onSave={id=>{setUndo(null);onToggleGroup(id);}} onFavorite={onFavorite} onExclude={onExclude}
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
