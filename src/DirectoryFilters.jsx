import React from 'react';
import {X} from 'lucide-react';
import {DIRECTORY_ACTIVITY_STATES} from './directory';
import {ACTIVITY_META} from './youtube-activity';
import {ActivityGlyph} from './ActivityIcon';

export const DIRECTORY_SCOPES=[
 ['all','전체 아티스트'],['recent','최근 업로드'],['intermittent','간헐 업로드'],
 ['dormant','장기 미업로드'],['legacy','레거시'],
];
export const DEFAULT_DIRECTORY_FILTERS={scope:'all',status:'all',year:'all',savedOnly:false};
const STATES_BY_SCOPE={
 recent:['SURGE','SAILING','COASTING'],
 intermittent:['COASTING','ANCHORED'],
 dormant:['ANCHORED','LOST SIGNAL'],
 legacy:['LOST SIGNAL'],
};

function statusOptions(scope){
 const states=STATES_BY_SCOPE[scope]||DIRECTORY_ACTIVITY_STATES;
 return [['all','전체 상태'],...states.map(state=>[state,state]),['unknown','상태 미확인']];
}

export function statusForDirectoryScope(scope,status){
 return statusOptions(scope).some(([value])=>value===status)?status:'all';
}

function Choices({label,options,value,onChange,counts,color=false}){
 return <fieldset className="directory-filter-section">
  <legend>{label}</legend>
  <div className="directory-filter-choices">
   {options.map(([id,text])=><button type="button" key={id} aria-pressed={value===id} onClick={()=>onChange(id)}>
    {color&&ACTIVITY_META[id]&&<span className="directory-option-activity" style={{color:ACTIVITY_META[id].color}}><ActivityGlyph icon={ACTIVITY_META[id].icon} size={14}/></span>}
    <span data-no-translate={ACTIVITY_META[id]?true:undefined}>{text}</span>
    <small className="directory-option-count">{counts[id]}</small>
   </button>)}
  </div>
 </fieldset>;
}

export default function DirectoryFilters({titleId,dialogRef,filters,years,counts,selectionEdit,update,reset,resultCount}){
 const chooseScope=scope=>update({scope,status:statusForDirectoryScope(scope,filters.status)});
 return <dialog ref={dialogRef} className="directory-filter-dialog" aria-labelledby={titleId}
  onClick={event=>{if(event.target===event.currentTarget)dialogRef.current.close();}}>
  <div className="directory-filter-panel">
   <header className="directory-filter-header">
    <h3 id={titleId}>아티스트 필터</h3>
    <button type="button" className="directory-control directory-icon" aria-label="필터 닫기" onClick={()=>dialogRef.current.close()}><X size={18}/></button>
   </header>
   <div className="directory-filter-body">
    <Choices label="목록 범위" options={DIRECTORY_SCOPES} value={filters.scope} onChange={chooseScope} counts={counts.scopes}/>
    <p className="directory-filter-help">마지막 공식 YouTube 업로드 기준 · 최근 1개월 미만 · 간헐 1~6개월 미만 · 장기 6개월~2년 미만 · 레거시 2년 이상</p>
    <Choices label="YouTube 활동 상태" options={statusOptions(filters.scope)} value={filters.status} onChange={status=>update({status})} counts={counts.statuses} color/>
    <Choices label="데뷔 연도" options={years} value={filters.year} onChange={year=>update({year})} counts={counts.years}/>
    {!selectionEdit&&<label className="directory-saved-filter"><input type="checkbox" checked={filters.savedOnly} onChange={event=>update({savedOnly:event.target.checked})}/> MY GROUPS만 <small className="directory-option-count">{counts.saved}</small></label>}
   </div>
   <footer className="directory-filter-footer">
    <button type="button" className="directory-control" onClick={reset}>초기화</button>
    <button type="button" className="directory-control directory-control-primary" onClick={()=>dialogRef.current.close()}>{resultCount}명 보기</button>
   </footer>
  </div>
 </dialog>;
}
