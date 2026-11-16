import React,{useRef} from 'react';
import {ChevronsUpDown,ChevronLeft,ChevronRight} from 'lucide-react';
import {swipeDirection,playlistKeyDirection} from './player-playlist.js';
import {localize,useLanguage} from './i18n';
export default function ShortSwipeArea({onStep,hasPrevious,hasNext}){
 const language=useLanguage(),start=useRef(null);
 const step=direction=>{if(direction>0?hasNext:hasPrevious)onStep(direction);};
 return localize(<div className="player-short-swipe" role="group" tabIndex={0} aria-label="쇼츠 이동: 위로 스와이프하면 다음 영상, 아래로 스와이프하면 이전 영상" onPointerDown={event=>{
  if(event.target.closest('button')||event.button!==0||event.isPrimary===false){start.current=null;return;}
  start.current={id:event.pointerId,x:event.clientX,y:event.clientY};event.currentTarget.setPointerCapture(event.pointerId);
 }} onPointerUp={event=>{
  const point=start.current;start.current=null;if(!point||point.id!==event.pointerId)return;
  const direction=swipeDirection(point,{x:event.clientX,y:event.clientY});if(direction)step(direction);
 }} onPointerCancel={()=>{start.current=null;}} onLostPointerCapture={()=>{start.current=null;}} onKeyDown={event=>{
  const direction=playlistKeyDirection(event);if(direction){event.preventDefault();event.stopPropagation();step(direction);}
 }}><button type="button" aria-label="이전 쇼츠" disabled={!hasPrevious} onClick={()=>step(-1)}><ChevronLeft size={17}/><span>이전</span></button><span className="short-swipe-hint"><ChevronsUpDown size={15}/><span>스와이프 · 방향키</span></span><button type="button" aria-label="다음 쇼츠" disabled={!hasNext} onClick={()=>step(1)}><span>다음</span><ChevronRight size={17}/></button></div>,language);
}
