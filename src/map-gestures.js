import {useEffect,useRef} from 'react';
const WIDTH=960,HEIGHT=500;
const bounded=(value,min,max)=>Math.max(min,Math.min(max,value));
export function panMap(transform,delta){
 const zoom=bounded(transform.zoom,1,6),limits=[WIDTH*(zoom-1)/2+WIDTH/3,HEIGHT*(zoom-1)/2+HEIGHT/3];
 return {zoom,pan:transform.pan.map((value,i)=>bounded(value+delta[i],-limits[i],limits[i]))};
}
export function zoomMap(transform,nextZoom,point=[WIDTH/2,HEIGHT/2]){
 const zoom=bounded(nextZoom,1,6),scale=zoom/transform.zoom,center=[WIDTH/2,HEIGHT/2];
 return panMap({zoom,pan:transform.pan.map((value,i)=>(value+center[i]-point[i])*scale+point[i]-center[i])},[0,0]);
}
export function pinchMap(transform,startCenter,center,startDistance,distance){
 const next=zoomMap(transform,transform.zoom*(startDistance>0?distance/startDistance:1),startCenter);
 return panMap(next,center.map((n,i)=>n-startCenter[i]));
}
export function useMapGestures(zoom,pan,onChange,ready=true){
 const ref=useRef(null),live=useRef({zoom,pan}),change=useRef(onChange);
 live.current={zoom,pan};change.current=onChange;
 useEffect(()=>{
  const svg=ref.current;if(!svg||!ready)return;
  const points=new Map();let phase=null,suppressUntil=0,moved=false;
  const point=event=>{const p=svg.createSVGPoint();p.x=event.clientX;p.y=event.clientY;const matrix=svg.getScreenCTM();return matrix?p.matrixTransform(matrix.inverse()):{x:0,y:0};};
  const values=()=>[...points.values()];
  const center=ps=>[(ps[0].x+ps[1].x)/2,(ps[0].y+ps[1].y)/2];
  const distance=ps=>Math.hypot(ps[0].x-ps[1].x,ps[0].y-ps[1].y);
  const begin=()=>{const ps=values();phase=ps.length?{transform:{zoom:live.current.zoom,pan:[...live.current.pan]},point:ps[0],center:ps.length===2?center(ps):null,distance:ps.length===2?distance(ps):0}:null;};
  const apply=value=>{live.current=value;change.current(value);};
  const down=event=>{if(event.button!==0&&event.pointerType!=='touch'||points.size>=2)return;points.set(event.pointerId,point(event));if(points.size===2){moved=true;suppressUntil=Date.now()+350;}begin();};
  const move=event=>{if(!points.has(event.pointerId)||!phase)return;points.set(event.pointerId,point(event));const ps=values();let next;
   if(ps.length===2){next=pinchMap(phase.transform,phase.center,center(ps),phase.distance,distance(ps));suppressUntil=Date.now()+350;}
   else {const delta=[ps[0].x-phase.point.x,ps[0].y-phase.point.y];if(!moved&&Math.hypot(...delta)*svg.getBoundingClientRect().width/WIDTH<=5)return;moved=true;next=panMap(phase.transform,delta);suppressUntil=Date.now()+350;}
   if(!svg.hasPointerCapture(event.pointerId))svg.setPointerCapture(event.pointerId);
   svg.dataset.dragging='true';event.preventDefault();apply(next);
  };
  const end=event=>{if(event.type==='lostpointercapture'&&event.target!==svg)return;if(!points.delete(event.pointerId))return;if(moved)suppressUntil=Date.now()+350;if(svg.hasPointerCapture(event.pointerId))svg.releasePointerCapture(event.pointerId);begin();if(!points.size){delete svg.dataset.dragging;moved=false;}};
  const click=event=>{if(Date.now()<suppressUntil){event.preventDefault();event.stopPropagation();}};
  const wheel=event=>{event.preventDefault();const at=point(event),delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?svg.getBoundingClientRect().height:1);apply(zoomMap(live.current,live.current.zoom*Math.exp(-delta*.0015),[at.x,at.y]));};
  svg.addEventListener('pointerdown',down);svg.addEventListener('pointermove',move,{passive:false});svg.addEventListener('pointerup',end);svg.addEventListener('pointercancel',end);svg.addEventListener('lostpointercapture',end);svg.addEventListener('click',click,true);svg.addEventListener('wheel',wheel,{passive:false});
  return()=>{for(const [name,fn,capture] of [['pointerdown',down],['pointermove',move],['pointerup',end],['pointercancel',end],['lostpointercapture',end],['click',click,true],['wheel',wheel]])svg.removeEventListener(name,fn,Boolean(capture));};
 },[ready]);
 return ref;
}
