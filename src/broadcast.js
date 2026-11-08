import rules from '../config/broadcast.json' with {type:'json'};
const variety=new RegExp(rules.varietyPattern,'i'),stage=new RegExp(rules.stagePattern,'i');
export function isMusicBroadcast(video){return Array.isArray(video.contentTabs)?video.contentTabs.includes('broadcast'):rules.channelIds.includes(video.channelId)&&!variety.test(video.title||'')&&stage.test(video.title||'');}
