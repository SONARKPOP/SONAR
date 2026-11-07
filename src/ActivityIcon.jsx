import React,{useState,useRef,useId} from 'react';
import {createPortal} from 'react-dom';
import {Flame,Ship,Waves,Anchor,WifiOff} from 'lucide-react';
import {activityView} from './youtube-activity';
const icons={flame:Flame,ship:Ship,waves:Waves,anchor:Anchor,'wifi-off':WifiOff};
export default function ActivityIcon({group,clock}){
 const [position,setPosition]=useState(null),ref=useRef(null),id=useId(),view=activityView(group,clock);
 if(!view)return null;
 const Icon=icons[view.icon],text=`${view.state} · Last upload: ${view.age} · Last 7 days: ${view.uploads7d}`;
 const show=()=>{const box=ref.current.getBoundingClientRect();setPosition({left:Math.max(8,Math.min(window.innerWidth-200,box.left)),top:box.bottom+7});};
 return <span ref={ref} className="youtube-activity-icon" style={{color:view.color}} tabIndex={0} role="img" aria-label={text} aria-describedby={position?id:undefined} data-no-translate onMouseEnter={show} onMouseLeave={()=>setPosition(null)} onFocus={show} onClick={event=>{event.preventDefault();event.stopPropagation();show();}} onKeyDown={event=>{if(['Enter',' '].includes(event.key)){event.preventDefault();event.stopPropagation();show();}if(event.key==='Escape')setPosition(null);}} onBlur={()=>setPosition(null)}><Icon size={15} aria-hidden="true"/>{position&&createPortal(<span id={id} className="youtube-activity-tooltip" style={position} role="tooltip" data-open="true" data-no-translate><strong>{view.state}</strong><span>Last upload: {view.age}</span><span>Last 7 days: {view.uploads7d}</span></span>,document.body)}</span>;
}
