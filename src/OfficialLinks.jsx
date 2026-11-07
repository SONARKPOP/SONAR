import React from 'react';
import {Youtube,Instagram,Globe,Music2} from 'lucide-react';
import {officialLinksFor,OFFICIAL_PLATFORMS} from './official-links';
function CommunityIcon({platform}){
 return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">{platform==='x'?<path d="M4 3h4l12 18h-4L4 3Zm16 0L4 21" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>:platform==='weverse'?<path d="m3 7 4 11 5-10 5 10 4-11" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>:<><rect x="3" y="3" width="18" height="18" rx="6" stroke="currentColor" strokeWidth="1.6"/><path d="M9 7h3a3 3 0 0 1 0 6H9m0-6v11h4a2.5 2.5 0 0 0 0-5H9" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></>}</svg>;
}
export default function OfficialLinks({artist,channels,showYouTubeStatus=false}){
 const links=officialLinksFor(artist,channels);
 const hasYouTube=links.some(link=>link.platform==='youtube');
 return <div className="directory-source-links" aria-label={`${artist.name} 공식 채널`}>{showYouTubeStatus&&<small className="youtube-connection">{hasYouTube?'YouTube 연결':'YouTube 확인 대기'}</small>}{links.map(link=>{const label=`${artist.name} ${OFFICIAL_PLATFORMS[link.platform]} 공식 채널${link.label?' · '+link.label:''}`;const Icon={youtube:Youtube,instagram:Instagram,website:Globe,tiktok:Music2}[link.platform];return <a key={link.platform+link.url} data-platform={link.platform} href={link.url} target="_blank" rel="noopener noreferrer" title={label} aria-label={`${label} (새 탭)`}>{Icon?<Icon size={16} aria-hidden="true"/>:<CommunityIcon platform={link.platform}/>}</a>;})}</div>;
}
