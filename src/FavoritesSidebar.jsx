import React,{useState} from 'react';
import {Heart,Sprout,Star,Flame,Ship,Waves,Anchor,X} from 'lucide-react';
import SidebarGroupRow from './SidebarGroupRow';
import {activityView,ACTIVE_BROWSE_STATES,ACTIVITY_META} from './youtube-activity';
import {localize,useLanguage} from './i18n';
const PRESETS=[['heart','하트',Heart],['star','별',Star],['clover','새싹',Sprout]];
const STATE_ICONS={SURGE:Flame,SAILING:Ship,COASTING:Waves,ANCHORED:Anchor};
export default function FavoritesSidebar({catalog,favorites,colors,scope,onScope,presets,onPresets,activeStates=ACTIVE_BROWSE_STATES,onActiveStates=()=>{},tagGroup='',onClearTagGroup=()=>{},onBulkCheck=()=>{},disabled,onToggle,hardBlocked,excluded,clock,onEdit}){
 const language=useLanguage(),[swiped,setSwiped]=useState(null);
 const groups=(catalog?.groups||[]).filter(group=>!hardBlocked.includes(group.id)&&!excluded.includes(group.id));
 const inPreset=(group,key)=>favorites[key].includes(group.id)||(group.relatedMemberIds||[]).some(id=>favorites[key].includes(id))||(catalog?.members||[]).some(person=>person.groupId===group.id&&favorites[key].includes(person.id));
 const counts=Object.fromEntries(ACTIVE_BROWSE_STATES.map(state=>[state,groups.filter(g=>activityView(g,clock)?.state===state).length]));
 const rows=groups.filter(g=>(!presets.length||presets.some(key=>inPreset(g,key)))&&(scope!=='active'||activeStates.includes(activityView(g,clock)?.state)));
 const filterName=catalog?.groups?.find(g=>g.id===tagGroup)?.name||tagGroup;
 return localize(<section className="mygroups-section favorite-sidebar"><div className="mygroups-heading"><h2>MY GROUPS</h2><button className="favorite-management" onClick={onEdit}>선호그룹 관리</button></div>
  {tagGroup&&<div className="sidebar-tag-filter" role="status"><span>영상 태그 필터<strong data-no-translate>{filterName}</strong></span><button type="button" aria-label="영상 태그 필터 해제" onClick={onClearTagGroup}><X size={14}/></button></div>}
  <div className="favorite-sidebar-filters">{[['all','전체'],['active','활동']].map(([id,label])=><button key={id} type="button" aria-pressed={scope===id&&!presets.length} aria-expanded={id==='active'?scope==='active':undefined} aria-controls={id==='active'?'sidebar-activity-choices':undefined} onClick={()=>{onScope(id);onPresets([]);if(id==='active')onActiveStates([...ACTIVE_BROWSE_STATES]);}}><span>{label}</span><small>{id==='all'?groups.length:Object.values(counts).reduce((a,b)=>a+b,0)}</small></button>)}
   {PRESETS.map(([key,label,Icon])=><button key={key} type="button" data-preset={key} aria-label={label} aria-pressed={presets.includes(key)} onClick={()=>{onScope('all');onPresets(presets.includes(key)?presets.filter(id=>id!==key):[...presets,key]);}}><Icon size={17}/><small>{favorites[key].length}</small></button>)}</div>
  {scope==='active'&&<div id="sidebar-activity-choices" className="sidebar-activity-choices" role="group" aria-label="활동 상태 중복 선택">{ACTIVE_BROWSE_STATES.map(state=>{const Icon=STATE_ICONS[state];return <button type="button" key={state} aria-label={`${state} ${counts[state]}개`} title={state} aria-pressed={activeStates.includes(state)} style={{'--state-color':ACTIVITY_META[state].color}} onClick={()=>onActiveStates(activeStates.includes(state)?activeStates.filter(id=>id!==state):[...activeStates,state])}><Icon size={15}/><span>{counts[state]}</span><small>{state}</small></button>;})}</div>}
  <div className="sidebar-bulk-checks" role="group" aria-label="현재 목록의 영상 표시 일괄 변경"><button type="button" title="현재 목록의 모든 그룹 영상을 표시합니다" disabled={!rows.length} onClick={()=>onBulkCheck(rows.map(g=>g.id),true)}>전체 체크</button><button type="button" title="저장·선호 설정을 유지하고 현재 목록의 그룹 영상만 숨깁니다" disabled={!rows.length} onClick={()=>onBulkCheck(rows.map(g=>g.id),false)}>전체 체크 해제</button></div>
  <div className="favorite-sidebar-items">{rows.map(group=><SidebarGroupRow key={group.id} group={group} clock={clock} checked={!disabled.includes(group.id)} saved={false} badges={PRESETS.filter(([key])=>inPreset(group,key))} color={colors[group.id]} swiped={swiped===group.id} onSwipe={setSwiped} onToggle={onToggle}/>)}</div>
  {!rows.length&&<p>조건에 맞는 그룹이 없어요.</p>}
 </section>,language);
}
