import policy from '../config/live-policy.json' with {type:'json'};
const continuous=new RegExp(policy.continuousTitlePattern,'i');
export function isContinuousLive(video){return (video.format==='live'||video.liveStatus==='live')&&continuous.test(video.title||'');}
