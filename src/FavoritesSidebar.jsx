import React,{useState} from 'react';
import {Heart,Sprout,Star} from 'lucide-react';
import SidebarGroupRow from './SidebarGroupRow';
import {activityView} from './youtube-activity';
import {localize,useLanguage} from './i18n';
const PRESETS=[['heart','하트',Heart],['star','별',Star],['clover','새싹',Sprout]];
export default function FavoritesSidebar({catalog,favorites,colors,scope,onScope,presets,onPresets,disabled,onToggle,hardBlocked,excluded,clock,onEdit}){
 const language=useLanguage(),[swiped,setSwiped]=useState(null);
 const groups=(catalog?.groups||[]).filter(group=>!hardBlocked.includes(group.id)&&!excluded.includes(group.id));
 const inPreset=(group,key)=>favorites[key].includes(group.id)||(group.relatedMemberIds||[]).some(id=>favorites[key].includes(id))||(catalog?.members||[]).some(person=>person.groupId===group.id&&favorites[key].includes(person.id));
 const rows=groups.filter(g=>(!presets.length||presets.some(key=>inPreset(g,key)))&&(scope!=='active'||['SURGE','SAILING','COASTING'].includes(activityView(g,clock)?.state)));
 return localize(<section className="mygroups-section favorite-sidebar"><div className="mygroups-heading"><h2>MY GROUPS</h2><button onClick={onEdit}>편집</button></div>
  <div className="favorite-sidebar-filters">{[['all','전체'],['active','활동중']].map(([id,label])=><button key={id} aria-pressed={scope===id&&!presets.length} onClick={()=>{onScope(id);onPresets([]);}}>{label}<small>{id==='all'?groups.length:groups.filter(g=>['SURGE','SAILING','COASTING'].includes(activityView(g,clock)?.state)).length}</small></button>)}
   {PRESETS.map(([key,label,Icon])=><button key={key} data-preset={key} aria-label={label} aria-pressed={presets.includes(key)} onClick={()=>{onScope('all');onPresets(presets.includes(key)?presets.filter(id=>id!==key):[...presets,key]);}}><Icon size={17}/><small>{favorites[key].length}</small></button>)}</div>
  <div className="favorite-sidebar-items">{rows.map(group=><SidebarGroupRow key={group.id} group={group} clock={clock} checked={!disabled.includes(group.id)} saved={false} badges={PRESETS.filter(([key])=>inPreset(group,key))} color={colors[group.id]} swiped={swiped===group.id} onSwipe={setSwiped} onToggle={onToggle}/>)}</div>
  {!rows.length&&<p>표시할 선호그룹이 없어요.</p>}<button className="add-group" onClick={onEdit}>선호 관리</button>
 </section>,language);
}
