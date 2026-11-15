import React,{useEffect,useRef} from 'react';
import {createPortal} from 'react-dom';
import {Ban,Biohazard,Grip,X} from 'lucide-react';
import {localize,useLanguage} from './i18n';
export function ArtistPolicyDialog({pending,onCancel,onConfirm}){
 const language=useLanguage(),cancel=useRef(null);
 useEffect(()=>{if(!pending)return;const previous=document.activeElement;cancel.current?.focus();return()=>{if(previous?.isConnected)previous.focus();};},[pending]);
 if(!pending)return null;
 const hard=pending.kind==='hard',Icon=hard?Biohazard:Ban;
 return createPortal(localize(<div className="unified-artists policy-confirm-backdrop" onClick={e=>e.stopPropagation()}><section className="policy-confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="artist-policy-title" aria-describedby="artist-policy-description" onKeyDown={e=>{
  if(e.key==='Escape'){e.stopPropagation();onCancel();}
  if(e.key==='Tab'){const buttons=[...e.currentTarget.querySelectorAll('button')];if(e.shiftKey&&document.activeElement===buttons[0]){e.preventDefault();buttons.at(-1).focus();}else if(!e.shiftKey&&document.activeElement===buttons.at(-1)){e.preventDefault();buttons[0].focus();}}
 }}><Icon className={hard?'policy-toxic':'policy-ban'} size={26}/><h3 id="artist-policy-title"><span data-no-translate>{pending.name}</span> · {hard?'절대차단할까요?':'금지할까요?'}</h3>
 <p id="artist-policy-description">{hard?'선호 아티스트가 함께 출연해도 이 개인·그룹이 포함된 영상은 숨깁니다. 차단 목록의 같은 아이콘을 누르면 해제할 수 있습니다.':'이 아티스트의 선호 지정을 해제하고 전체 보기에서 제외합니다. 다른 선호 아티스트와 함께 출연한 영상은 표시될 수 있습니다. 같은 아이콘을 눌러 해제할 수 있습니다.'}</p>
 <div><button ref={cancel} type="button" onClick={onCancel}>취소</button><button type="button" className="policy-confirm-action" onClick={onConfirm}>{hard?'절대차단':'금지하기'}</button></div></section></div>,language),document.body);
}
export function PreferenceDragHandle({panelRef,onClose}){
 const language=useLanguage(),drag=useRef(null);
 return localize(<header className="preference-drag-handle" onPointerDown={e=>{
  if(e.button!==0||e.target.closest('button'))return;const panel=panelRef.current,box=panel.getBoundingClientRect();
  drag.current={id:e.pointerId,startX:e.clientX,startY:e.clientY,x:Number(panel.dataset.dragX||0),y:Number(panel.dataset.dragY||0),box};e.currentTarget.setPointerCapture(e.pointerId);
 }} onPointerMove={e=>{
  const d=drag.current;if(!d||d.id!==e.pointerId)return;
  const x=Math.max(d.x-d.box.left+8,Math.min(d.x+window.innerWidth-d.box.right-8,d.x+e.clientX-d.startX));
  const y=Math.max(d.y-d.box.top+8,Math.min(d.y+window.innerHeight-d.box.bottom-8,d.y+e.clientY-d.startY));
  const panel=panelRef.current;panel.dataset.dragX=x;panel.dataset.dragY=y;panel.style.transform=`translate(${x}px,${y}px)`;
 }} onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}}><span><Grip size={15}/>선호그룹 관리</span><button type="button" className="icon-button" aria-label="닫기" onClick={onClose}><X size={19}/></button></header>,language);
}
