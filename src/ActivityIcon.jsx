import React,{useState,useRef,useId} from 'react';
import {createPortal} from 'react-dom';
import {Flame,Ship,Waves,Anchor,WifiOff} from 'lucide-react';
import {activityView} from './youtube-activity';
import {useLanguage,formatMessage} from './i18n';
const icons={flame:Flame,ship:Ship,waves:Waves,anchor:Anchor,'wifi-off':WifiOff};
export function ActivityGlyph({icon,size=15}){
 const Icon=icons[icon];
 return <Icon size={size} aria-hidden="true"/>;
}
export default function ActivityIcon({group,clock}){
 const language=useLanguage();
 const [position,setPosition]=useState(null),ref=useRef(null),id=useId(),view=activityView(group,clock);
 if(!view)return null;
 const minutes=Math.floor(((clock??Date.now())-Date.parse(view.lastUpload))/60000),unit=minutes>=1440?'day':minutes>=60?'hour':'minute';
 const elapsed=new Intl.RelativeTimeFormat(language,{numeric:'auto'}).format(-Math.floor(minutes/(unit==='day'?1440:unit==='hour'?60:1)),unit);
 const values={state:view.state,elapsed,count:view.uploads7d},text=formatMessage('{state} · 마지막 업로드: {elapsed} · 최근 7일: {count}',values,language);
 const show=()=>{const box=ref.current.getBoundingClientRect();setPosition({left:Math.max(8,Math.min(window.innerWidth-200,box.left)),top:Math.max(8,Math.min(window.innerHeight-90,box.bottom+7))});};
 return <span ref={ref} className="youtube-activity-icon" style={{color:view.color}} tabIndex={0} role="img" aria-label={text} aria-describedby={position?id:undefined} data-no-translate onMouseEnter={show} onMouseLeave={()=>setPosition(null)} onFocus={show} onClick={event=>{event.preventDefault();event.stopPropagation();show();}} onKeyDown={event=>{if(['Enter',' '].includes(event.key)){event.preventDefault();event.stopPropagation();show();}if(event.key==='Escape')setPosition(null);}} onBlur={()=>setPosition(null)}><ActivityGlyph icon={view.icon}/>{position&&createPortal(<span id={id} className="youtube-activity-tooltip" style={position} role="tooltip" data-open="true" data-no-translate><strong>{view.state}</strong><span>{formatMessage('마지막 업로드: {elapsed}',values,language)}</span><span>{formatMessage('최근 7일: {count}',values,language)}</span></span>,document.body)}</span>;
}
