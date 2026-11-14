import React from 'react';
import './my-groups.css';

export default function MyGroupControls({view,presets,activePresets,counts,ready,onView,onPreset,onEdit}){
 return <>
  <h2>MY GROUPS<button type="button" className="mygroups-edit-toggle" onClick={onEdit}>편집</button></h2>
  <div className="favorite-presets sidebar-group-views" role="group" aria-label="MY GROUPS 목록과 프리셋">
   <button type="button" aria-label={`등록된 전체 그룹 (${counts.registered}개)`} title="등록된 그룹 목록"
    aria-pressed={view==='all'} disabled={!ready} onClick={()=>onView('all')}>전체<small>{counts.registered}</small></button>
   <button type="button" aria-label={`선택 그룹 (${counts.listed}개)`} title="선택 목록에 담긴 그룹"
    aria-pressed={view==='selected'} disabled={!ready} onClick={()=>onView('selected')}>선택<small>{counts.listed}</small></button>
   {presets.map(([key,name,Icon])=><button type="button" key={key} data-preset={key}
    aria-label={`${name} 프리셋 (${counts.presets[key]}개 그룹)`} aria-pressed={activePresets.includes(key)}
    title={`${name} 프리셋 선택 (${counts.presets[key]}개 그룹)`} onClick={()=>onPreset(key)}>
    <Icon size={15} fill={key==='clover'?'none':'currentColor'}/><small>{counts.presets[key]}</small>
   </button>)}
  </div>
  <div className="mygroups-count mygroups-status" aria-live="polite">
   <strong>영상 켜짐 {counts.enabled}개</strong>
   <span>선택 목록 {counts.listed}개 · 저장 {counts.saved}개 · 선호 {counts.favorites}개</span>
  </div>
 </>;
}
