import React,{useRef} from 'react';
import {Check,X} from 'lucide-react';
import ActivityIcon from './ActivityIcon';
import {koreanArtistName} from './directory';
import {activityLabel,groupActivity} from './lib';

export default function SidebarGroupRow({group,clock,checked,saved,badges,color,swiped,onSwipe,onToggle,onRemove}){
 const gesture=useRef(null),suppressClick=useRef(0);
 const korean=koreanArtistName(group);
 const startSwipe=event=>{
  if(!saved||!event.isPrimary||event.button!==0||(event.pointerType==='mouse'&&!window.matchMedia('(max-width:760px)').matches))return;
  gesture.current={x:event.clientX,y:event.clientY,id:event.pointerId};
  if(event.pointerType==='mouse')event.currentTarget.setPointerCapture(event.pointerId);
 };
 const endSwipe=event=>{
  const start=gesture.current;
  gesture.current=null;
  if(start?.id!==event.pointerId)return;
  const dx=event.clientX-start.x,dy=event.clientY-start.y;
  if(Math.abs(dx)<36||Math.abs(dx)<1.4*Math.abs(dy))return;
  suppressClick.current=Date.now()+350;
  onSwipe(dx<0?group.id:null);
 };
 const toggle=()=>{
  if(Date.now()<suppressClick.current)return;
  if(swiped){onSwipe(null);return;}
  onToggle(group.id);
 };
 return <div className="mygroup-item" data-swiped={swiped||undefined}>
  <button type="button" className="mygroup-select" data-favorite={badges.length>0||undefined}
   style={badges.length?{'--favorite-accent':color||'#729ca8'}:undefined} aria-pressed={checked} onClick={toggle}
   title={checked?'모아보기에서 선택 해제':saved?'모아보기에 포함':'MY GROUPS에 저장하고 모아보기에 포함'}
   onPointerDown={startSwipe} onPointerUp={endSwipe} onPointerCancel={()=>{gesture.current=null;}}>
   <span className="mygroup-check" aria-hidden="true">{checked&&<Check size={14}/>}</span>
   <span className="mygroup-title" data-no-translate>{group.name}<ActivityIcon group={group} clock={clock}/>
    {!group.youtubeActivity&&['inactive','archived'].includes(groupActivity(group,clock))&&<small className="sidebar-activity">{activityLabel(group,clock)}</small>}
    {korean&&<small className="artist-korean-name" lang="ko">{korean}</small>}
   </span>
   {badges.length>0&&<span className="mygroup-badges" aria-hidden="true">{badges.map(([key,,Icon])=><Icon key={key} data-preset={key} size={11} fill={key==='clover'?'none':'currentColor'}/>)}</span>}
   {group.contentCount===0&&<span className="mygroup-pending-dot" title="수집 대기"/>}
  </button>
  {saved&&<button type="button" className="mygroup-remove-action" aria-label={`${group.name} MY GROUPS에서 제거`}
   onClick={()=>onRemove(group.id)}><X size={15}/><span>제거</span></button>}
 </div>;
}
