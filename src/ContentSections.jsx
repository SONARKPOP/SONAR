import React from 'react';
import {MUSIC_SECTIONS,CONTENT_SECTIONS,broadcasterFacets} from './content-sections';
import './content-sections.css';
export default function ContentSections({category,section,onSection,rows,broadcaster,onBroadcaster,channel,onChannel}){
 const options=category==='music'?MUSIC_SECTIONS:['own','external'].includes(category)?CONTENT_SECTIONS:['broadcast','radio'].includes(category)?[['','전체'],['teaser','Teaser']]:[];
 const stations=['broadcast','radio'].includes(category)?broadcasterFacets(rows,category):[];
 const selected=stations.find(s=>s.id===broadcaster),channels=selected?[...selected.channels.values()]:[];
 if(!options.length&&!stations.length)return null;
 return <section className="content-subnavigation" aria-label="콘텐츠 하위 분류">{options.length>0&&<div className="content-subtabs" role="group" aria-label="영상 종류">{options.map(([id,label])=><button type="button" key={id} aria-pressed={section===id} onClick={()=>onSection(id)}>{label}</button>)}</div>}{stations.length>0&&<><div className="content-subtabs" role="group" aria-label="방송사"><button type="button" aria-pressed={!broadcaster} onClick={()=>{onBroadcaster('');onChannel('');}}>전체 방송사</button>{stations.map(s=><button type="button" key={s.id} aria-pressed={broadcaster===s.id} onClick={()=>{onBroadcaster(s.id);onChannel('');}}>{s.label}<small>{s.count}</small></button>)}</div>{selected&&<div className="content-subtabs content-channel-subtabs" role="group" aria-label="방송사 채널"><button type="button" aria-pressed={!channel} onClick={()=>onChannel('')}>전체 채널</button>{channels.map(c=><button type="button" key={c.id} aria-pressed={channel===c.id} onClick={()=>onChannel(c.id)}>{c.name}<small>{c.count}</small></button>)}</div>}</>}{['own','external'].includes(category)&&<p>Short는 길이 기준입니다. 관련 Shorts도 함께 보이며, LIVE는 길이와 별도로 분류합니다.</p>}</section>;
}
