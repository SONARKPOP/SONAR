import React,{useMemo,useState} from 'react';
import {Bookmark,Heart,Search,Settings2,Sprout,Star,X} from 'lucide-react';
import {matchesArtistName} from './directory';
import ActivityIcon from './ActivityIcon';
import './my-groups-page.css';

const PRESETS=[['heart','하트',Heart],['star','별',Star],['clover','새싹',Sprout]];
const PAGE_SIZE=40;

export default function MyGroupsPage({groups,saved,checked,enabled,favorites,excluded,clock,onToggleViewing,onToggleSaved,onFavorite,onEdit,onSettings}){
 const [scope,setScope]=useState('saved'),[query,setQuery]=useState(''),[limit,setLimit]=useState(PAGE_SIZE),[showAllViewing,setShowAllViewing]=useState(false);
 const savedIds=useMemo(()=>new Set(saved),[saved]),checkedIds=useMemo(()=>new Set(checked),[checked]);
 const enabledIds=useMemo(()=>new Set(enabled),[enabled]),excludedIds=useMemo(()=>new Set(excluded),[excluded]);
 const favoriteIds=useMemo(()=>new Set(Object.values(favorites).flat()),[favorites]);
 const results=useMemo(()=>groups.filter(group=>(scope==='all'||(scope==='saved'?savedIds.has(group.id):favoriteIds.has(group.id)))&&matchesArtistName(group,query)),[groups,scope,query,savedIds,favoriteIds]);
 const viewing=groups.filter(group=>enabledIds.has(group.id));
 const updateQuery=value=>{setQuery(value);setLimit(PAGE_SIZE);};
 return <section className="mygroups-page" aria-label="MY GROUPS 관리">
  <header className="workspace-page-heading"><div><small>YOUR COLLECTION</small><h2>MY GROUPS</h2><p>저장한 그룹과 현재 콘텐츠에 표시할 그룹을 따로 관리하세요.</p></div>
   <button type="button" className="workspace-manage" onClick={onEdit}><Settings2 size={16}/>상세 편집</button></header>
  <div className="mygroups-page-summary"><span>저장 {savedIds.size}개</span><strong>영상 켜짐 {enabledIds.size}개</strong><span>선호 {favoriteIds.size}개</span></div>
  <label className="workspace-content-search"><Search size={17}/><input value={query} onChange={e=>updateQuery(e.target.value)} aria-label="MY GROUPS 아티스트 검색" placeholder="그룹 이름 · 한글 / 영문 검색"/>
   {query&&<button type="button" aria-label="그룹 검색 지우기" onClick={()=>updateQuery('')}><X size={16}/></button>}</label>
  <div className="mygroups-workspace-grid"><section className="mygroups-saved-panel" aria-label="그룹 목록">
   <nav className="workspace-types" aria-label="MY GROUPS 검색 범위">{[['all','전체 그룹',groups.length],['saved','저장한 그룹',savedIds.size],['favorites','선호그룹',favoriteIds.size]].map(([id,label,count])=>
    <button type="button" key={id} aria-pressed={scope===id} onClick={()=>{setScope(id);setLimit(PAGE_SIZE);}}>{label}<small>{count}</small></button>)}</nav>
   <div className="mygroups-list-heading"><strong>{results.length}개 그룹</strong><span>체크: 영상 표시 · 책갈피: 저장</span></div>
   <div className="mygroups-workspace-list">{results.slice(0,limit).map(group=>{
    const id=group.id,hidden=checkedIds.has(id)&&!enabledIds.has(id);
    return <article className="mygroups-workspace-row" key={id} data-viewing={enabledIds.has(id)||undefined}>
     <label className="mygroups-viewing-check"><input type="checkbox" aria-label={`${group.name} 영상 표시`} checked={checkedIds.has(id)} disabled={excludedIds.has(id)} onChange={()=>onToggleViewing(id)}/>
      <span><b data-no-translate>{group.name}<ActivityIcon group={group} clock={clock}/></b>{group.nameKo&&group.nameKo!==group.name&&<small data-no-translate>{group.nameKo}</small>}
       <small>{excludedIds.has(id)?'제외 설정됨':hidden?'유형·제외 설정으로 숨김':enabledIds.has(id)?'콘텐츠 표시 켜짐':'콘텐츠 표시 꺼짐'}</small></span></label>
     <div className="mygroups-row-actions"><div className="mygroups-row-presets">{PRESETS.map(([key,label,Icon])=><button type="button" key={key} data-preset={key} aria-pressed={favorites[key]?.includes(id)||false}
      aria-label={`${group.name} ${label} 선호`} onClick={()=>onFavorite(key,id)}><Icon size={15}/></button>)}</div>
      <button type="button" className="mygroups-save-action" aria-pressed={savedIds.has(id)} aria-label={`${group.name} ${savedIds.has(id)?'저장 해제':'저장'}`} title={savedIds.has(id)?'저장 해제':'저장'} onClick={()=>onToggleSaved(id)}><Bookmark size={16} fill={savedIds.has(id)?'currentColor':'none'}/></button>
     </div>
    </article>;
   })}</div>
   {!results.length&&<p className="workspace-muted">조건에 맞는 그룹이 없습니다. 검색어나 목록 범위를 바꿔보세요.</p>}
   {results.length>limit&&<button type="button" className="workspace-manage mygroups-more" onClick={()=>setLimit(value=>value+PAGE_SIZE)}>그룹 더 보기 · {limit}/{results.length}</button>}
  </section><aside className="mygroups-viewing-panel" aria-label="현재 콘텐츠에 표시할 그룹"><h3>현재 콘텐츠에 표시할 그룹 <small>{viewing.length}</small></h3>
   <p>체크를 꺼도 저장 그룹 목록은 유지됩니다. 책갈피는 저장 여부만 변경합니다.</p><div className="mygroups-viewing-chips">{viewing.slice(0,showAllViewing?viewing.length:12).map(group=><button type="button" key={group.id} aria-label={`${group.name} 영상 표시 끄기`} onClick={()=>onToggleViewing(group.id)}><span data-no-translate>{group.name}</span><X size={12}/></button>)}</div>
   {viewing.length>12&&<button type="button" className="mygroups-viewing-more" onClick={()=>setShowAllViewing(value=>!value)}>{showAllViewing?'간략히':`나머지 ${viewing.length-12}개 보기`}</button>}
   {!viewing.length&&<p>목록의 체크박스를 켜서 영상을 표시하세요.</p>}
   <div className="mygroups-workspace-help"><strong>선호 설정은 별도로</strong><p>하트·별·새싹은 선호 목록에 저장합니다. 제외·예외 설정은 아래 관리 버튼에서, 일괄 관리는 상세 편집에서 할 수 있습니다.</p><button type="button" className="workspace-manage" onClick={onSettings}>선호·제외 관리</button></div>
  </aside></div>
 </section>;
}
