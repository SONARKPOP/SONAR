export const PLATFORM_LABELS={youtube:'YouTube',chzzk:'CHZZK',weverse:'Weverse',berriz:'Berriz',mnet:'Mnet',naver:'NAVER'};
const HOSTS={chzzk:['chzzk.naver.com'],naver:['tv.naver.com'],weverse:['weverse.io'],
 berriz:['berriz.in','link.berriz.in'],mnet:['www.mnetplus.world','mnetplus.world']};

export function videoSourceUrl(video){
 const platform=video.platform||'youtube';
 if(platform==='youtube')return video.platformId?'https://www.youtube.com/watch?v='+encodeURIComponent(video.platformId):null;
 try{
  const url=new URL(video.sourceUrl);
  return url.protocol==='https:'&&!url.username&&!url.password&&HOSTS[platform]?.includes(url.hostname)?url.href:null;
 }catch{return null;}
}

export function mergePlatformRows(youtube,other){
 const ids=new Set(youtube.map(video=>video.platformId));
 return [...youtube,...other.filter(video=>!(video.duplicateYouTubeIds||[]).some(id=>ids.has(id)))];
}

export function currentChzzkLives(feed,now){
 const at=Date.parse(feed.updatedAt);
 return Number.isFinite(at)&&now-at<=30*60*1000&&at<=now+60000?(feed.items||[]).filter(video=>video.official&&video.platform==='chzzk'&&videoSourceUrl(video)):[];
}
