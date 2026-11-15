import React, {useEffect, useRef, useState} from 'react';
import {clampPlayer, initialPlayer} from './playerGeometry.js';
import './adjustable-player.css';

const viewport=()=>({width:window.innerWidth,height:window.innerHeight});
export default function AdjustablePlayer({children,minimized=false,labels={},aspectRatio=16/9}){
 const [rect,setRect]=useState(()=>initialPlayer(viewport(),aspectRatio));
 const [active,setActive]=useState(false);
 const [compactHeight,setCompactHeight]=useState(112);
 const element=useRef(null), geometry=useRef(rect), pointers=useRef(new Map()), gesture=useRef(null);
 geometry.current=rect;
 const update=next=>setRect(minimized?{...clampPlayer({...next,height:compactHeight},viewport(),compactHeight),height:next.height}:clampPlayer(next,viewport()));
 useEffect(()=>{if(!minimized)setRect(current=>clampPlayer(current,viewport()));},[minimized]);
 useEffect(()=>{setRect(current=>{const next=initialPlayer(viewport(),aspectRatio);return clampPlayer({...next,x:current.x+(current.width-next.width)/2,y:current.y},viewport());});},[aspectRatio]);
 const beginGesture=mode=>{
  const points=[...pointers.current.values()];
  gesture.current={mode,rect:{...geometry.current},point:points[0],center:points.length>1?{x:(points[0].x+points[1].x)/2,y:(points[0].y+points[1].y)/2}:null,distance:points.length>1?Math.hypot(points[1].x-points[0].x,points[1].y-points[0].y):0};
 };
 const down=e=>{
  if(e.button!==0||e.target.closest('a,input,select,textarea')|| (e.target.closest('button')&&!e.target.closest('[data-player-resize]')))return;
  const resize=e.target.closest('[data-player-resize]');
  if(!resize&&!e.target.closest('[data-player-drag]'))return;
  if(pointers.current.size>=2)return;
  e.preventDefault();
  e.currentTarget.setPointerCapture(e.pointerId);
  pointers.current.set(e.pointerId,{x:e.clientX,y:e.clientY});
  beginGesture(resize?'resize':'move');setActive(true);
 };
 const move=e=>{
  if(!pointers.current.has(e.pointerId))return;
  pointers.current.set(e.pointerId,{x:e.clientX,y:e.clientY});
  const g=gesture.current,points=[...pointers.current.values()];
  if(points.length===2&&g.distance>0){
   const scale=Math.hypot(points[1].x-points[0].x,points[1].y-points[0].y)/g.distance;
   const center={x:(points[0].x+points[1].x)/2,y:(points[0].y+points[1].y)/2};
   update({width:g.rect.width*scale,height:g.rect.height*scale,x:center.x+(g.rect.x-g.center.x)*scale,y:center.y+(g.rect.y-g.center.y)*scale});
  }else{
   const dx=e.clientX-g.point.x,dy=e.clientY-g.point.y;
   update(g.mode==='resize'?{...g.rect,width:g.rect.width+dx,height:g.rect.height+dy}:{...g.rect,x:g.rect.x+dx,y:g.rect.y+dy});
  }
 };
 const end=e=>{
  if(!pointers.current.delete(e.pointerId))return;
  if(element.current?.hasPointerCapture(e.pointerId))element.current.releasePointerCapture(e.pointerId);
  if(pointers.current.size)beginGesture('move');else{gesture.current=null;setActive(false);}
 };
 useEffect(()=>{
  const resize=()=>setRect(current=>clampPlayer(current,viewport()));
  window.addEventListener('resize',resize);return()=>window.removeEventListener('resize',resize);
 },[]);
 useEffect(()=>{
  if(!minimized||!element.current)return;
  const measure=()=>{const height=element.current?.getBoundingClientRect().height;if(height>0)setCompactHeight(height);};
  measure();
  if(typeof ResizeObserver==='undefined')return;
  const observer=new ResizeObserver(measure);observer.observe(element.current);
  return()=>observer.disconnect();
 },[minimized]);
 const keyboard=e=>{
  if(!e.target.matches('[data-player-drag], [data-player-resize]'))return;
  const delta={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];
  if(!delta)return;
  e.preventDefault();
  const step=e.shiftKey?40:10,[dx,dy]=delta.map(n=>n*step),current=geometry.current;
  update(e.target.matches('[data-player-resize]')?{...current,width:current.width+dx,height:current.height+dy}:{...current,x:current.x+dx,y:current.y+dy});
 };
 const top=minimized?Math.min(rect.y,Math.max(8,window.innerHeight-compactHeight-8)):rect.y;
 const reserveTop=top<=48?top+(minimized?compactHeight:rect.height)+12:0;
 return <><div className="player-top-reserve" aria-hidden="true" style={{height:reserveTop,flexShrink:0}}/><section ref={element} className="docked-player adjustable-player" aria-label={labels.player||'영상 플레이어'} data-adjusting={active} data-minimized={minimized} data-orientation={aspectRatio<1?'portrait':'landscape'} style={{left:rect.x,top,width:rect.width,height:minimized?'auto':rect.height}} onPointerDown={down} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end} onKeyDown={keyboard}>
  {children}
  {!minimized&&<button type="button" className="player-resize-handle" data-player-resize aria-label={labels.resize||'플레이어 크기 조절. 방향키로 조절'} title={labels.resize||'드래그하여 크기 조절'}><span aria-hidden="true">◢</span></button>}
 </section></>;
}
