import rules from '../config/content-hierarchy.json' with {type:'json'};
const regex=key=>new RegExp(rules[key],'i');
const teaser=regex('teaserPattern'),musicTeaser=regex('musicTeaserPattern'),cover=regex('coverPattern'),dance=regex('dancePattern'),mv=regex('mvPattern'),related=regex('musicRelatedPattern');
export const MUSIC_SECTIONS=[['','전체'],['teaser','Teaser'],['mv','MV'],['cover','커버'],['dance','안무']];
export const CONTENT_SECTIONS=[['','전체'],['long','Long · 45분 이상'],['regular','Regular · 5~45분'],['short','Short · 5분 미만'],['live','LIVE'],['teaser','Teaser']];
export function durationSeconds(video){
 if(Number.isFinite(video.durationSeconds)&&video.durationSeconds>=0)return video.durationSeconds;
 const raw=String(video.durationLabel||video.duration||'').trim(),colon=raw.match(/^(?:(\d+):)?(\d{1,2}):(\d{2})$/);
 if(colon)return Number(colon[1]||0)*3600+Number(colon[2])*60+Number(colon[3]);
 const iso=raw.match(/^(?:PT)?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?$/i);
 return iso&&iso.slice(1).some(Boolean)?Number(iso[1]||0)*3600+Number(iso[2]||0)*60+Number(iso[3]||0):null;
}
export function teaserType(video){
 const text=[video.title,...video.subtypes||[]].join(' ');
 if(!teaser.test(text)&&!video.contentTabs?.includes('teaser')&&!video.teaserType)return '';
 return !related.test(text)&&(musicTeaser.test(text)||video.category==='music')?'music':'content';
}
export function musicType(video){
 const text=[video.title,...video.subtypes||[]].join(' '),type=teaserType(video);
 if(type)return type==='music'?'teaser':'';if(related.test(text))return '';
 if(dance.test(text))return 'dance';if(cover.test(text))return 'cover';if(mv.test(text))return 'mv';return '';
}
export function contentLength(video){
 if(video.format==='live')return 'live';if(teaserType(video))return 'teaser';
 const seconds=durationSeconds(video);return seconds===null?'':seconds>=rules.longSeconds?'long':seconds>=rules.regularSeconds?'regular':'short';
}
export function contentSectionMatches(video,category,section){
 if(!section)return true;
 if(category==='music')return musicType(video)===section;
 if(['own','external'].includes(category))return contentLength(video)===section;
 if(['broadcast','radio'].includes(category))return section!=='teaser'||teaserType(video)==='content';
 return true;
}
export function broadcasterFor(video,category='broadcast'){
 const id=video.channelId||'',name=video.channelName||'',text=id+' '+name;
 if(category==='broadcast'&&(id==='kfn-wimun'||new RegExp(rules.eventPublisherPattern,'i').test(name)))return 'events';
 return rules.broadcasters.find(b=>b.ids.includes(id)||new RegExp(b.pattern,'i').test(text))?.id||'other';
}
export function broadcasterFacets(rows,category){
 const groups=new Map();for(const row of rows){const id=broadcasterFor(row,category),item=groups.get(id)||{id,label:id==='events'?'행사·공연':rules.broadcasters.find(b=>b.id===id)?.label||'기타 채널',count:0,channels:new Map()};item.count++;const channel=item.channels.get(row.channelId)||{id:row.channelId,name:row.channelName,count:0};channel.count++;item.channels.set(channel.id,channel);groups.set(id,item);}
 return [...groups.values()].sort((a,b)=>a.id==='other'?1:b.id==='other'?-1:b.count-a.count);
}
