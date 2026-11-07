import React,{useEffect,useMemo,useState} from 'react';
import {Search,Heart,Star,Sprout,Ban,ShieldCheck,Check,Plus,ArrowUpRight,ChevronLeft,ChevronRight,ArrowUp} from 'lucide-react';
import {ARTIST_CATEGORIES,groupActivity,activityLabel,debutYearRanges,favoriteCardStyle} from './lib';
import {careerTagsFor,directoryResults,DIRECTORY_ACTIVITY_STATES,isArtistSearch,koreanArtistName,legacyGroupState,LEGACY_LABELS,matchesDirectoryActivity} from './directory';
import OfficialLinks from './OfficialLinks';
import ActivityIcon from './ActivityIcon';
const presets=[['heart','하트',Heart],['star','별',Star],['clover','새싹',Sprout]];
import {ACTIVITY_META} from './youtube-activity';
const states=[['general','일반 그룹'],...DIRECTORY_ACTIVITY_STATES.map(state=>[state,state]),['unknown','상태 미확인'],['all','전체 상태']];
const EMPTY_GROUPS=[];
export default function ArtistDirectory({catalog,clock,saved,favorites,colors,theme,excluded,allowed,protectedGroups,onToggleGroup,onBulkGroups,onFavorite,onExclude,onAllow}){
 const [legacy,setLegacy]=useState(false),[savedOnly,setSavedOnly]=useState(false),[undo,setUndo]=useState(null);
 const [query,setQuery]=useState(''),[type,setType]=useState('all'),[status,setStatus]=useState('general'),[year,setYear]=useState('all'),[sort,setSort]=useState('az'),[showTop,setShowTop]=useState(false);
 useEffect(()=>{const update=()=>setShowTop(window.scrollY>400);update();window.addEventListener('scroll',update,{passive:true});return()=>window.removeEventListener('scroll',update);},[]);
 const groups=catalog?.groups||EMPTY_GROUPS;
 const searching=isArtistSearch(query);
 const legacyStates=useMemo(()=>new Map(groups.map(group=>[group.id,legacyGroupState(group,clock)])),[groups,clock]);
 const savedIds=useMemo(()=>new Set(saved),[saved]);
 const scope=useMemo(()=>{
  const candidates=directoryResults(groups,{query,type,status:'all',year,sort,now:clock});
  return candidates.filter(group=>(!savedOnly||savedIds.has(group.id))&&(legacy?Boolean(legacyStates.get(group.id)):searching||!legacyStates.get(group.id)));
 },[groups,query,type,year,sort,clock,legacy,savedOnly,savedIds,searching,legacyStates]);
 const byStatus=useMemo(()=>Object.fromEntries(states.map(([id])=>[id,(id==='all'||(id==='general'&&(searching||legacy)))?scope:scope.filter(group=>matchesDirectoryActivity(group,id,clock))])),[scope,searching,clock,legacy]);
 const results=byStatus[status];
 const resultIds=results.map(g=>g.id),savedCount=resultIds.filter(id=>savedIds.has(id)).length;
 const updateResults=enabled=>{
  const ids=resultIds.filter(id=>savedIds.has(id)!==enabled);
  if(!ids.length)return;
  const restore=onBulkGroups(ids,enabled);
  setUndo({count:ids.length,enabled,restore});
 };
 return <section className="artist-directory-page" aria-label="전체 아티스트 목록">
  <header className="directory-heading"><div><p className="eyebrow">ARTIST DIRECTORY</p><h2>전체 아티스트 <small>{groups.length}</small></h2><p>등록된 아티스트와 활동 상태를 둘러보고 바로 편집하세요.</p></div><a href="#collection"><ChevronLeft size={15}/>영상으로 돌아가기</a></header>
  <div className="directory-tools"><label className="search"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="그룹·솔로·이전 그룹 이름 검색" aria-label="전체 아티스트 검색"/></label><select value={sort} onChange={e=>setSort(e.target.value)} aria-label="아티스트 목록 정렬"><option value="az">이름 A–Z</option><option value="debut-desc">데뷔 최신순</option><option value="debut-asc">데뷔 오래된순</option></select></div>
  <nav className="directory-filters" aria-label="목록 아티스트 유형">{ARTIST_CATEGORIES.map(([id,label])=><button key={id} aria-pressed={type===id} onClick={()=>setType(id)}>{label}<small>{groups.filter(g=>directoryResults([g],{type:id,status:'all'}).length).length}</small></button>)}</nav>
  <div className="directory-filters" aria-label="목록 범위"><button type="button" aria-pressed={!legacy} onClick={()=>{setLegacy(false);setStatus('general');}}>일반 목록</button><button type="button" aria-pressed={legacy} onClick={()=>{setLegacy(true);setStatus('all');}}>레거시 그룹 <small>{[...legacyStates.values()].filter(Boolean).length}</small></button><button type="button" aria-pressed={savedOnly} onClick={()=>setSavedOnly(value=>!value)}>MY GROUPS만</button></div>
  <nav className="directory-filters" aria-label="목록 활동 상태">{states.map(([id,label])=><button key={id} aria-pressed={status===id} onClick={()=>setStatus(id)}>{ACTIVITY_META[id]&&<i className="directory-status-dot" style={{'--activity-color':ACTIVITY_META[id].color}} aria-hidden="true"/>}<span data-no-translate={ACTIVITY_META[id]?true:undefined}>{label}</span><small>{byStatus[id].length}</small></button>)}</nav>
  <div className="directory-filters" aria-label="목록 데뷔 연도"><button aria-pressed={year==='all'} onClick={()=>setYear('all')}>전체 연도</button>{debutYearRanges(groups).map(range=><button key={range.id} aria-pressed={year===range.id} onClick={()=>setYear(range.id)}>{range.label}</button>)}</div>
  <p className="directory-policy">YouTube 업로드 활동을 표시합니다. 실제 해체·활동 중단 여부와는 별개입니다. {searching&&<b>검색은 모든 유형·연도를 대상으로 합니다. 활동 상태로 검색 결과를 좁힐 수 있습니다.</b>}</p>
  <div className="directory-result-heading"><div><strong>{results.length}개 아티스트</strong><small className="directory-selection-count" aria-live="polite"> · MY GROUPS {savedCount}개</small></div><div className="directory-bulk" role="group" aria-label="현재 목록 MY GROUPS 일괄 편집"><button type="button" disabled={savedCount===results.length} onClick={()=>updateResults(true)}>결과 일괄 추가</button><button type="button" disabled={!savedCount} onClick={()=>updateResults(false)}>결과 일괄 제거</button></div></div>
  {undo&&<div className="index-notice" role="status"><span>{undo.count}개 그룹을 {undo.enabled?'추가':'제거'}했습니다.</span><button type="button" onClick={()=>{undo.restore?.();setUndo(null);}}>실행 취소</button></div>}
  <div className="directory-grid">{results.map(g=>{const tags=careerTagsFor(g,groups),locked=protectedGroups.includes(g.id),korean=koreanArtistName(g);return <article className="directory-artist" key={g.id} style={favoriteCardStyle([g.id],protectedGroups,colors,theme)}><div className="directory-artist-title"><h3 data-no-translate>{g.name}<ActivityIcon group={g} clock={clock}/>{korean&&<small className="artist-korean-name" lang="ko">{korean}</small>}</h3><button className="directory-save" aria-label={`${g.name} MY GROUPS ${saved.includes(g.id)?'제거':'추가'}`} aria-pressed={saved.includes(g.id)} onClick={()=>{setUndo(null);onToggleGroup(g.id);}}>{saved.includes(g.id)?<Check size={15}/>:<Plus size={15}/>}<span>MY GROUPS</span></button></div><p className={`directory-activity status-${groupActivity(g,clock)}`}>{g.debutYear||'데뷔 연도 미확인'}{legacyStates.get(g.id)&&<span className="legacy-status">{LEGACY_LABELS[legacyStates.get(g.id)]}</span>}{!g.youtubeActivity&&<> · {activityLabel(g,clock)}</>}</p><div className="directory-career-tags">{tags.map(t=><button key={t.id} data-no-translate onClick={()=>{if(t.id!=='solo'&&t.id!=='redebut')setQuery(groups.find(a=>a.id===t.id)?.name||t.id);}}>{t.label}</button>)}</div>{g.lastOfficialUploadAt&&<small className="directory-last-upload">마지막 공식 업로드 {new Date(g.lastOfficialUploadAt).toLocaleDateString('ko-KR',{timeZone:'Asia/Seoul'})}</small>}<OfficialLinks artist={g} channels={catalog?.channels||[]} showYouTubeStatus/><div className="editor-group-policies">{presets.map(([key,name,Icon])=><button key={key} data-preset={key} aria-label={`목록 ${g.name} ${name}`} aria-pressed={favorites[key].includes(g.id)} title={name} onClick={()=>onFavorite(key,g.id)}><Icon size={16} fill={key!=='clover'&&favorites[key].includes(g.id)?'currentColor':'none'}/></button>)}<button className="policy-ban" aria-label={`목록 ${g.name} 개별 제외`} aria-pressed={!locked&&excluded.includes(g.id)} disabled={locked} title={locked?'선호그룹 · 자동 예외 허용':'개별 제외'} onClick={()=>onExclude(g.id)}><Ban size={16}/></button><button className="policy-allow" aria-label={`목록 ${g.name} 예외 허용`} aria-pressed={locked||allowed.includes(g.id)} disabled={locked} onClick={()=>onAllow(g.id)}><ShieldCheck size={16}/><span>{locked?'자동 허용':'예외'}</span></button></div></article>;})}</div>
  {!catalog?<p role="status">아티스트 목록을 불러오는 중…</p>:!results.length&&<p className="empty">조건에 맞는 아티스트가 없습니다.</p>}
  {showTop&&<button type="button" className="directory-back-top" onClick={()=>window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})} aria-label="맨 위로 가기"><ArrowUp size={17}/><span>맨 위로</span></button>}
 </section>;
}
