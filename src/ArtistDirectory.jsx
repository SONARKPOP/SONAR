import React,{useEffect,useMemo,useRef,useState} from 'react';
import {ArrowUp,ArrowDownUp,ChevronLeft,ListChecks,Search,SlidersHorizontal,X} from 'lucide-react';
import {debutYearRanges} from './lib';
import {directoryResults,isArtistSearch,matchesDirectoryScope} from './directory';
import {officialLinksFor} from './official-links';
import ArtistDirectoryRow from './ArtistDirectoryRow';
import DirectoryFilters,{DEFAULT_DIRECTORY_FILTERS,DIRECTORY_SCOPES} from './DirectoryFilters';
import './directory-compact.css';

const TYPES=[['all','전체'],['girl','여자'],['boy','남자'],['mixed','혼성'],['duo-solo','듀오·솔로']];
const SORTS=[['az','이름 A–Z'],['debut-desc','데뷔 최신순'],['debut-asc','데뷔 오래된순']];
const EMPTY=[];

export default function ArtistDirectory({catalog,clock,saved,favorites,colors,excluded,allowed,protectedGroups,
 onToggleGroup,onBulkGroups,onFavorite,onExclude,onAllow}){
 const [query,setQuery]=useState(''),[type,setType]=useState('all'),[sort,setSort]=useState('az');
 const [filters,setFilters]=useState(DEFAULT_DIRECTORY_FILTERS);
 const [expanded,setExpanded]=useState(''),[editing,setEditing]=useState(false);
 const [undo,setUndo]=useState(null),[showTop,setShowTop]=useState(false);
 const filterDialog=useRef(null);
 useEffect(()=>{
  const update=()=>setShowTop(window.scrollY>400);
  update();
  window.addEventListener('scroll',update,{passive:true});
  return()=>window.removeEventListener('scroll',update);
 },[]);
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
  return rows.filter(group=>(!filters.savedOnly||savedIds.has(group.id))&&matchesDirectoryScope(group,filters.scope,clock));
 },[groups,query,type,filters,sort,clock,savedIds]);
 const savedCount=results.filter(group=>savedIds.has(group.id)).length;
 const updateFilters=patch=>{setExpanded('');setFilters(previous=>({...previous,...patch}));};
 const resetFilters=()=>updateFilters(DEFAULT_DIRECTORY_FILTERS);
 const search=value=>{
  if(!isArtistSearch(query)&&isArtistSearch(value)){
   setType('all');updateFilters({year:'all'});
  }
  setExpanded('');setQuery(value);
 };
 const chips=[
  filters.scope!=='all'&&[DIRECTORY_SCOPES.find(([id])=>id===filters.scope)[1],()=>updateFilters({scope:'all'})],
  filters.status!=='all'&&[filters.status==='unknown'?'상태 미확인':filters.status,()=>updateFilters({status:'all'})],
  filters.year!=='all'&&[years.find(([id])=>id===filters.year)?.[1]||filters.year,()=>updateFilters({year:'all'})],
  filters.savedOnly&&['MY GROUPS만',()=>updateFilters({savedOnly:false})],
 ].filter(Boolean);
 const updateResults=enabled=>{
  const ids=results.filter(group=>savedIds.has(group.id)!==enabled).map(group=>group.id);
  if(ids.length)setUndo({count:ids.length,enabled,restore:onBulkGroups(ids,enabled)});
 };
 const showFilters=event=>{
  const dialog=filterDialog.current;
  const box=event.currentTarget.getBoundingClientRect();
  dialog.style.setProperty('--directory-filter-right',`${Math.max(12,window.innerWidth-box.right)}px`);
  dialog.style.setProperty('--directory-filter-top',`${box.bottom+8}px`);
  dialog.showModal();
 };
 return <section className="artist-directory-page directory-compact" aria-label="전체 아티스트 목록">
  <header className="directory-compact-heading">
   <a href="#collection"><ChevronLeft size={16}/><span>영상으로</span></a>
   <h2>전체 아티스트 <small>{groups.length}</small></h2>
  </header>
  <div className="directory-search">
   <label className="search"><Search size={17}/><input value={query} onChange={event=>search(event.target.value)}
    placeholder="아티스트·출신 그룹 검색" aria-label="전체 아티스트 검색"/></label>
   {query&&<button type="button" className="directory-control directory-icon" aria-label="검색 지우기" onClick={()=>search('')}><X size={16}/></button>}
  </div>
  <nav className="directory-type-tabs" aria-label="목록 아티스트 유형">
   {TYPES.map(([id,label])=><button type="button" key={id} aria-pressed={type===id}
    onClick={()=>{setExpanded('');setType(id);}}>{label}</button>)}
  </nav>
  <div className="directory-list-toolbar">
   <strong aria-live="polite">결과 {results.length}명</strong>
   <div className="directory-toolbar-actions">
    <label className="directory-control directory-sort"><ArrowDownUp size={14}/><span>정렬</span>
     <select value={sort} onChange={event=>setSort(event.target.value)} aria-label="아티스트 목록 정렬">
      {SORTS.map(([id,label])=><option key={id} value={id}>{label}</option>)}
     </select>
    </label>
    <button type="button" className="directory-control" aria-haspopup="dialog" onClick={showFilters}>
     <SlidersHorizontal size={15}/>필터{chips.length>0&&<small className="directory-filter-count">{chips.length}</small>}
    </button>
    <button type="button" className="directory-control" aria-expanded={editing} aria-controls={editing?'directory-bulk-panel':undefined}
     onClick={()=>setEditing(value=>!value)}><ListChecks size={15}/><span>목록 편집</span></button>
   </div>
  </div>
  {chips.length>0&&<div className="directory-applied-chips" aria-label="적용된 아티스트 필터">
   {chips.map(([label,remove])=><button type="button" key={label} aria-label={`${label} 필터 해제`} onClick={remove}><span>{label}</span><X size={12}/></button>)}
   <button type="button" className="directory-chip-reset" onClick={resetFilters}>초기화</button>
  </div>}
  {editing&&<div className="directory-bulk-panel" id="directory-bulk-panel">
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
  <div className="directory-rows">
   {results.map(artist=><ArtistDirectoryRow key={artist.id} artist={artist} groups={groupMap} channels={channels} clock={clock}
    saved={savedIds.has(artist.id)} favorites={favoriteIds} color={colors[artist.id]} locked={lockedIds.has(artist.id)}
    excluded={excluded.includes(artist.id)} allowed={allowed.includes(artist.id)} expanded={expanded===artist.id}
    connected={connected.has(artist.id)} onExpand={id=>setExpanded(current=>current===id?'':id)}
    onSave={id=>{setUndo(null);onToggleGroup(id);}} onFavorite={onFavorite} onExclude={onExclude}
    onAllow={onAllow} onCareerSearch={search}/>)}
  </div>
  {!catalog?<p role="status">아티스트 목록을 불러오는 중…</p>:!results.length&&<div className="empty">
   조건에 맞는 아티스트가 없습니다.
   {chips.length>0&&<button type="button" className="directory-control" onClick={resetFilters}>필터 초기화</button>}
  </div>}
  <DirectoryFilters dialogRef={filterDialog} filters={filters} years={years} update={updateFilters} reset={resetFilters} resultCount={results.length}/>
  {showTop&&<button type="button" className="directory-back-top"
   onClick={()=>window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})}
   aria-label="맨 위로 가기"><ArrowUp size={17}/><span>맨 위로</span></button>}
 </section>;
}
