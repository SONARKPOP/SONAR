import React from 'react';
import {X} from 'lucide-react';
import {DIRECTORY_ACTIVITY_STATES} from './directory';
import {ACTIVITY_META} from './youtube-activity';
import {ActivityGlyph} from './ActivityIcon';

export const DEFAULT_DIRECTORY_FILTERS={status:'all',year:'all',savedOnly:false};
const STATUS_OPTIONS=[['all','전체 상태'],...DIRECTORY_ACTIVITY_STATES.map(state=>[state,state]),['unknown','상태 미확인']];

function Choices({label,options,value,onChange,counts,color=false}){
 return <fieldset className="directory-filter-section">
  <legend>{label}</legend>
  <div className="directory-filter-choices">
   {options.map(([id,text,help])=><button type="button" key={id} aria-pressed={value===id} title={help} onClick={()=>onChange(id)}>
    {color&&ACTIVITY_META[id]&&<span className="directory-option-activity" style={{color:ACTIVITY_META[id].color}}><ActivityGlyph icon={ACTIVITY_META[id].icon} size={14}/></span>}
    <span data-no-translate={ACTIVITY_META[id]?true:undefined}>{text}</span>
    <small className="directory-option-count">{counts[id]}</small>
   </button>)}
  </div>
 </fieldset>;
}

export default function DirectoryFilters({titleId,dialogRef,filters,years,counts,selectionEdit,update,reset,resultCount,inline=false}){
 const options=<>
  {!inline&&<Choices label="YouTube 활동 상태" options={STATUS_OPTIONS} value={filters.status} onChange={status=>update({status})} counts={counts.statuses} color/>}
  <Choices label="데뷔 연도" options={years} value={filters.year} onChange={year=>update({year})} counts={counts.years}/>
 </>;
 const savedToggle=!selectionEdit&&<label className="directory-saved-filter"><input type="checkbox" checked={filters.savedOnly} onChange={event=>update({savedOnly:event.target.checked})}/> MY GROUPS만 <small className="directory-option-count">{counts.saved}</small></label>;
 if(inline)return <div className="directory-inline-filters" role="group" aria-label="아티스트 필터">
  {options}
  <div className="directory-inline-actions">{savedToggle}<button type="button" className="directory-control" onClick={reset}>필터 초기화</button></div>
 </div>;
 return <dialog ref={dialogRef} className="directory-filter-dialog" aria-labelledby={titleId}
  onClick={event=>{if(event.target===event.currentTarget)dialogRef.current.close();}}>
  <div className="directory-filter-panel">
   <header className="directory-filter-header">
    <h3 id={titleId}>아티스트 필터</h3>
    <button type="button" className="directory-control directory-icon" aria-label="필터 닫기" onClick={()=>dialogRef.current.close()}><X size={18}/></button>
   </header>
   <div className="directory-filter-body">
    {options}
    {savedToggle}
   </div>
   <footer className="directory-filter-footer">
    <button type="button" className="directory-control" onClick={reset}>초기화</button>
    <button type="button" className="directory-control directory-control-primary" onClick={()=>dialogRef.current.close()}>{resultCount}명 보기</button>
   </footer>
  </div>
 </dialog>;
}
