import React,{useRef} from 'react';
import {ChevronsUpDown} from 'lucide-react';
import {swipeDirection} from './player-playlist.js';
import {localize,useLanguage} from './i18n';
export default function ShortSwipeArea({onStep,hasPrevious,hasNext}){
 const language=useLanguage(),start=useRef(null);
 const step=direction=>{if(direction>0?hasNext:hasPrevious)onStep(direction);};
 return localize(<div className="player-short-swipe" role="group" tabIndex={0} aria-label="쇼츠 이동: 위로 스와이프하면 다음 영상, 아래로 스와이프하면 이전 영상" onPointerDown={event=>{
  if(event.button!==0||event.isPrimary===false){start.current=null;return;}
  start.current={id:event.pointerId,x:event.clientX,y:event.clientY};event.currentTarget.setPointerCapture(event.pointerId);
 }} onPointerUp={event=>{
  const point=start.current;start.current=null;if(!point||point.id!==event.pointerId)return;
  const direction=swipeDirection(point,{x:event.clientX,y:event.clientY});if(direction)step(direction);
 }} onPointerCancel={()=>{start.current=null;}} onLostPointerCapture={()=>{start.current=null;}} onKeyDown={event=>{
  if(event.key==='ArrowUp'||event.key==='ArrowDown'){event.preventDefault();step(event.key==='ArrowUp'?1:-1);}
 }}><ChevronsUpDown size={15}/><span>위로 다음 · 아래로 이전</span></div>,language);
}
