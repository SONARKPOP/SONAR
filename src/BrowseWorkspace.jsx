import React from 'react';
import {Layers,Search,Users,X} from 'lucide-react';
import './browse-workspace.css';
import {localize,useLanguage} from './i18n';

export function WorkspaceNavigation({menus,page,category,onGo,onGroups,onAnalysis,language='ko'}){
 return localize(<nav className="workspace-navigation" aria-label="SONAR 화면">
  {menus.map(([id,name,Icon])=><button type="button" key={id} aria-current={page==='content'&&category===id?'page':undefined}
   onClick={()=>onGo(id)}><Icon size={16}/><span>{name}</span></button>)}
  <button type="button" aria-current={page==='groups'?'page':undefined} onClick={onGroups}><Users size={16}/><span>선호 관리</span></button>
  {onAnalysis&&<button type="button" aria-current={page==='analysis'?'page':undefined} onClick={onAnalysis}><Layers size={16}/><span>활동량·분석</span></button>}
 </nav>,language);
}

export function ContentSearch({query,onChange}){
 const language=useLanguage();
 return localize(<label className="workspace-content-search"><Search size={17}/><input value={query} onChange={e=>onChange(e.target.value)}
  aria-label="현재 콘텐츠 검색" placeholder="영상 제목, 채널, 태그 검색"/>
  {query&&<button type="button" aria-label="현재 콘텐츠 검색 지우기" onClick={()=>onChange('')}><X size={16}/></button>}
 </label>,language);
}

export function HomeOverview({selectedCount,videoCount,favoriteCount,onGroups}){
 const language=useLanguage();
 return localize(<section className="workspace-overview" aria-label="홈 콘텐츠 요약">
  <div className="workspace-overview-stats"><button type="button" onClick={onGroups}><b>{selectedCount}</b><span>영상 표시 그룹</span></button>
   <span><b>{videoCount}</b><span>불러온 결과</span></span><button type="button" onClick={onGroups}><b>{favoriteCount}</b><span>선호 그룹</span></button></div>
 </section>,language);
}

export function ExternalExplorer({showTypes=true,types,type,channel,channels,onType,onChannel}){
 const language=useLanguage();
 return localize(<section className="external-explorer" aria-label="외부 출연 탐색">
  <div className="workspace-explorer-heading"><h3><Layers size={16}/>{showTypes?'출연 유형·채널 탐색':'외부 채널 탐색'}</h3><small>불러온 영상 기준 · 공통 출연 채널 우선</small></div>
  {showTypes&&<div className="workspace-types" role="group" aria-label="외부 출연 유형">
   {[['','전체'],...types].map(([id,label])=><button type="button" key={id} aria-pressed={type===id} onClick={()=>onType(id)}>{label}</button>)}
  </div>}
  <div className="workspace-channels" role="group" aria-label="외부 프로그램 및 채널">
   <button type="button" className="workspace-channel" aria-pressed={!channel} onClick={()=>onChannel('')}><b>전체 채널</b><span>{channels.length}개 탐색</span></button>
   {channels.map(item=><button type="button" className="workspace-channel" key={item.id} aria-pressed={channel===item.id} onClick={()=>onChannel(item.id)}>
    <b data-no-translate>{item.name}</b><span>{item.count}개 영상{item.groups.size>1&&<em>공통 출연 {item.groups.size}그룹</em>}</span>
   </button>)}
  </div>
  {!channels.length&&<p className="workspace-muted">현재 조건의 외부 출연 영상이 아직 없습니다. 그룹이나 기간을 바꿔보세요.</p>}
 </section>,language);
}
