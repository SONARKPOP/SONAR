import React from 'react';
import {Layers,Search,Users,X} from 'lucide-react';
import './browse-workspace.css';

export function WorkspaceNavigation({menus,page,category,onGo,onGroups}){
 return <nav className="workspace-navigation" aria-label="SONAR 화면">
  {menus.map(([id,name,Icon])=><button type="button" key={id} aria-current={page==='content'&&category===id?'page':undefined}
   onClick={()=>onGo(id)}><Icon size={16}/><span>{name}</span></button>)}
  <button type="button" aria-current={page==='groups'?'page':undefined} onClick={onGroups}><Users size={16}/><span>MY GROUPS</span></button>
 </nav>;
}

export function ContentSearch({query,onChange}){
 return <label className="workspace-content-search"><Search size={17}/><input value={query} onChange={e=>onChange(e.target.value)}
  aria-label="현재 콘텐츠 검색" placeholder="영상 제목, 채널, 태그 검색"/>
  {query&&<button type="button" aria-label="현재 콘텐츠 검색 지우기" onClick={()=>onChange('')}><X size={16}/></button>}
 </label>;
}

export function HomeOverview({selectedCount,videoCount,favoriteCount,onGroups}){
 return <section className="workspace-overview" aria-label="홈 콘텐츠 요약">
  <div><small>SONAR ON</small><h3>흩어진 순간을, 한곳에서.</h3><p>선택한 그룹의 최신 콘텐츠를 이어서 탐색하세요.</p></div>
  <div className="workspace-overview-stats"><button type="button" onClick={onGroups}><b>{selectedCount}</b><span>영상 표시 그룹</span></button>
   <span><b>{videoCount}</b><span>불러온 결과</span></span><button type="button" onClick={onGroups}><b>{favoriteCount}</b><span>선호 그룹</span></button></div>
 </section>;
}

export function ExternalExplorer({types,type,channel,channels,onType,onChannel}){
 return <section className="external-explorer" aria-label="외부 출연 탐색">
  <div className="workspace-explorer-heading"><h3><Layers size={16}/>출연 유형·채널 탐색</h3><small>불러온 영상 기준 · 공통 출연 채널 우선</small></div>
  <div className="workspace-types" role="group" aria-label="외부 출연 유형">
   {[['','전체'],...types].map(([id,label])=><button type="button" key={id} aria-pressed={type===id} onClick={()=>onType(id)}>{label}</button>)}
  </div>
  <div className="workspace-channels" role="group" aria-label="외부 프로그램 및 채널">
   <button type="button" className="workspace-channel" aria-pressed={!channel} onClick={()=>onChannel('')}><b>전체 채널</b><span>{channels.length}개 탐색</span></button>
   {channels.map(item=><button type="button" className="workspace-channel" key={item.id} aria-pressed={channel===item.id} onClick={()=>onChannel(item.id)}>
    <b data-no-translate>{item.name}</b><span>{item.count}개 영상{item.groups.size>1&&<em>공통 출연 {item.groups.size}그룹</em>}</span>
   </button>)}
  </div>
  {!channels.length&&<p className="workspace-muted">현재 조건의 외부 출연 영상이 아직 없습니다. 그룹이나 기간을 바꿔보세요.</p>}
 </section>;
}
