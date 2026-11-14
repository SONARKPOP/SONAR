import React,{useState} from 'react';
import {Disc3,Play,Youtube} from 'lucide-react';
import {isMusicBroadcast} from './broadcast';
import {isShortContent} from './lib';
import {PLATFORM_LABELS,videoSourceUrl} from './platforms';
import './video-card.css';

const dateFormat=new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'});

function VideoArtistTags({video,groupsById,onSearch}){
 const soloId=video.individualActivity?.artistId;
 const careerIds=video.individualActivity?.groupIds||[];
 const ids=[...new Set([...(soloId?[soloId]:[]),...video.groupIds,...careerIds])];
 return <div className="video-artist-tags">{ids.map(id=>{
  const artist=groupsById.get(id),name=artist?.name||id;
  if(id===soloId||artist?.artistType==='solo')return <span className="video-solo-name" key={id} data-no-translate>{name}</span>;
  const former=groupsById.get(soloId)?.previousGroupIds?.includes(id);
  return <button type="button" className="video-group-tag" key={id} data-no-translate
   aria-label={`${name}${former?' 출신':''} 검색`} onClick={()=>onSearch(name)}>{name}{former&&<small> 출신</small>}</button>;
 })}</div>;
}

export default function VideoCard({video,index=0,number=index+1,groupsById,style,station=false,onOpen,onSearch,onMemberSelect,memberName}){
 const [failedImage,setFailedImage]=useState('');
 const date=new Date(video.publishedAt),sourceUrl=videoSourceUrl(video);
 const platform=video.platform||'youtube';
 let kind=video.subtypes?.[0]||'영상';
 if(station)kind='LIVE STATION';
 else if(video.demo)kind='SAMPLE';
 else if(video.contentTabs?.includes('radio'))kind='RADIO';
 else if(video.contentTabs?.includes('teaser'))kind='TEASER';
 else if(isMusicBroadcast(video))kind='음악방송';
 else if(isShortContent(video))kind=video.format==='short'||video.category==='shorts'?'쇼츠':'짧은 클립';
 else if(video.format==='live')kind='라이브';
 return <article className="video-card" style={style} data-favorite={Boolean(style)||undefined}>
  <div className="video-thumbnail-wrap">
   <button type="button" className={`thumbnail tone-${index%6}`} onClick={()=>onOpen(video)} aria-label={`${video.title} 보기`}>
    {video.thumbnail&&failedImage!==video.thumbnail?<img src={video.thumbnail} loading="lazy" decoding="async" alt="" onError={()=>setFailedImage(video.thumbnail)}/>:
     <div className="sample-art"><span className="sample-word">{groupsById.get(video.groupIds[0])?.name||video.groupIds[0]}</span>
      <span className="sample-type">{kind}<br/><b>{String(number).padStart(2,'0')}</b></span><Disc3 size={85}/></div>}
    <span className="category-badge">{kind}</span>
    <span className="play-circle"><Play size={21} fill="currentColor"/></span>
    <span className="duration">{video.durationLabel||'VIDEO'}</span>
   </button>
   {sourceUrl&&<a className="video-platform-badge" data-platform={platform} href={sourceUrl} target="_blank" rel="noopener noreferrer"
    aria-label={(PLATFORM_LABELS[platform]||platform)+' 원본 열기'}>
    {platform==='youtube'&&<Youtube size={14} aria-hidden="true"/>}<span data-no-translate>{(PLATFORM_LABELS[platform]||platform).toUpperCase()}</span>
   </a>}
  </div>
  <div className="video-meta"><VideoArtistTags video={video} groupsById={groupsById} onSearch={onSearch}/>
   <time dateTime={Number.isFinite(date.getTime())?video.publishedAt:undefined}>{Number.isFinite(date.getTime())?dateFormat.format(date):'날짜 미확인'}</time>
  </div>
  <button type="button" className="video-title" data-no-translate title={video.title} onClick={()=>onOpen(video)}>{video.title}</button>
  <p className="channel-name" data-no-translate title={video.channelName}>{video.channelName}</p>
  {video.format==='live'&&<div className="card-member-tags">{video.memberIds?.length?video.memberIds.map(id=>
   <button type="button" key={id} onClick={()=>onMemberSelect(id)}>{memberName(id)}</button>):<span>미분류</span>}</div>}
 </article>;
}
