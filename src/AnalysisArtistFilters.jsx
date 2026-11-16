import React from 'react';
import {Flame,Ship,Waves,Anchor} from 'lucide-react';
import {ACTIVE_BROWSE_STATES,ACTIVITY_META} from './youtube-activity';
import {localize,useLanguage,translate,formatMessage} from './i18n';
import './analysis-filters.css';
const icons={SURGE:Flame,SAILING:Ship,COASTING:Waves,ANCHORED:Anchor};
export default function AnalysisArtistFilters({filters,onChange,profile,years,stateCounts,total}){
 const language=useLanguage();
 const update=patch=>onChange(current=>({...current,...patch}));
 return localize(<div className="analysis-controls analysis-artist-filters" aria-label="분석 대상 필터">
  <div className="analysis-filter-group" role="group" aria-label="선호그룹 범위">{[['all','전체'],['favorites','선호그룹']].map(([id,label])=><button type="button" key={id} aria-pressed={filters.scope===id} onClick={()=>update({scope:id})}>{label}</button>)}</div>
  {profile&&<><div className="analysis-filter-group" role="group" aria-label="데뷔 연도 필터"><select aria-label="데뷔 연도" value={filters.year} onChange={e=>update({year:e.target.value})}><option value="">전체 연도</option>{filters.year&&!years.some(y=>y.id===filters.year)&&<option value={filters.year}>{filters.year} · 0</option>}{years.map(y=><option key={y.id} value={y.id}>{y.label} · {y.count}</option>)}</select>{filters.year&&!years.some(y=>y.id===filters.year)&&<button type="button" onClick={()=>update({year:''})}>연도 해제</button>}{[1,5].map(step=><button type="button" key={step} aria-pressed={filters.step===step} onClick={()=>update({step,year:''})}>{translate(`${step}년`,language)}</button>)}</div>
   <div className="analysis-filter-group analysis-state-filters" role="group" aria-label="활동 그룹 상태"><button type="button" aria-pressed={!filters.states.length} onClick={()=>update({states:[]})}>전체 상태</button><button type="button" aria-pressed={ACTIVE_BROWSE_STATES.every(s=>filters.states.includes(s))} onClick={()=>update({states:ACTIVE_BROWSE_STATES.every(s=>filters.states.includes(s))?[]:[...ACTIVE_BROWSE_STATES]})}>활동 그룹</button>{ACTIVE_BROWSE_STATES.map(state=>{const Icon=icons[state];return <button type="button" key={state} aria-pressed={filters.states.includes(state)} style={{'--analysis-state':ACTIVITY_META[state].color}} onClick={()=>update({states:filters.states.includes(state)?filters.states.filter(s=>s!==state):[...filters.states,state]})}><Icon size={14}/><span>{state}</span><small>{stateCounts[state]||0}</small></button>;})}</div></>}
  <select aria-label="분석 대상 유형" value={filters.kind} onChange={e=>update({kind:e.target.value})}><option value="all">그룹 · 솔로</option><option value="group">그룹</option><option value="solo">솔로</option></select><span className="analysis-filter-count" role="status">{formatMessage('{count}개 아티스트',{count:total},language)}</span>
 </div>,language);
}
