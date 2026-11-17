import registry from '../config/station-channels.json' with {type:'json'};

// A directory of channels; no claim about current broadcast availability.
export function stationChannels(channels,{query='',excluded=[]}={}){
 const blocked=new Set(excluded),needle=query.trim().toLocaleLowerCase();
 return registry.flatMap(entry=>{
  const channel=channels.find(c=>c.id===entry.channelId&&c.official&&c.platformId);
  if(!channel||channel.groupIds?.some(id=>blocked.has(id)))return [];
  if(needle&&!`${entry.name} ${channel.name||''}`.toLocaleLowerCase().includes(needle))return [];
  return [{...entry,url:`https://www.youtube.com/channel/${channel.platformId}/streams`}];
 });
}
