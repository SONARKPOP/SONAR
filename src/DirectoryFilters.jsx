import React from 'react';
import {X} from 'lucide-react';
import {DIRECTORY_ACTIVITY_STATES} from './directory';
import {ACTIVITY_META} from './youtube-activity';

export const DIRECTORY_SCOPES=[
 ['all','전체 아티스트'],['recent','최근 업로드'],['dormant','장기 미업로드'],['legacy','레거시'],
];
export const DEFAULT_DIRECTORY_FILTERS={scope:'all',status:'all',year:'all',savedOnly:false};
const RECENT_STATES=['SURGE','SAILING','COASTING'];
const DORMANT_STATES=['ANCHORED','LOST SIGNAL'];

function statusOptions(scope){
 const states=scope==='recent'?RECENT_STATES:scope==='dormant'?DORMANT_STATES:DIRECTORY_ACTIVITY_STATES;
 return [['all','전체 상태'],...states.map(state=>[state,state]),['unknown','상태 미확인']];
}

function Choices({label,options,value,onChange,color=false}){
 return <fieldset className="directory-filter-section">
  <legend>{label}</legend>
  <div className="directory-filter-choices">
   {options.map(([id,text])=><button type="button" key={id} aria-pressed={value===id} onClick={()=>onChange(id)}>
    {color&&ACTIVITY_META[id]&&<i className="directory-status-dot" style={{'--activity-color':ACTIVITY_META[id].color}} aria-hidden="true"/>}
    <span data-no-translate={ACTIVITY_META[id]?true:undefined}>{text}</span>
   </button>)}
  </div>
 </fieldset>;
}

export default function DirectoryFilters({titleId,dialogRef,filters,years,update,reset,resultCount}){
 const chooseScope=scope=>{
  const status=statusOptions(scope).some(([value])=>value===filters.status)?filters.status:'all';
  update({scope,status});
 };
 return <dialog ref={dialogRef} className="directory-filter-dialog" aria-labelledby={titleId}
  onClick={event=>{if(event.target===event.currentTarget)dialogRef.current.close();}}>
  <div className="directory-filter-panel">
   <header className="directory-filter-header">
    <h3 id={titleId}>아티스트 필터</h3>
    <button type="button" className="directory-control directory-icon" aria-label="필터 닫기" onClick={()=>dialogRef.current.close()}><X size={18}/></button>
   </header>
   <div className="directory-filter-body">
    <Choices label="목록 범위" options={DIRECTORY_SCOPES} value={filters.scope} onChange={chooseScope}/>
    <p className="directory-filter-help">공식 업로드 기준 · 최근 90일 미만, 장기 90일 이상. 레거시는 확인된 활동 중단·해체 그룹입니다.</p>
    <Choices label="YouTube 활동 상태" options={statusOptions(filters.scope)} value={filters.status} onChange={status=>update({status})} color/>
    <Choices label="데뷔 연도" options={years} value={filters.year} onChange={year=>update({year})}/>
    <label className="directory-saved-filter"><input type="checkbox" checked={filters.savedOnly} onChange={event=>update({savedOnly:event.target.checked})}/> MY GROUPS만</label>
   </div>
   <footer className="directory-filter-footer">
    <button type="button" className="directory-control" onClick={reset}>초기화</button>
    <button type="button" className="directory-control directory-control-primary" onClick={()=>dialogRef.current.close()}>{resultCount}명 보기</button>
   </footer>
  </div>
 </dialog>;
}
