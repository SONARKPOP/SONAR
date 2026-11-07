import rules from '../config/activity-rules.json' with {type:'json'};
export const ACTIVITY_META={SURGE:{color:'#ef4444',icon:'flame'},SAILING:{color:'#22c55e',icon:'ship'},COASTING:{color:'#eab308',icon:'waves'},ANCHORED:{color:'#f97316',icon:'anchor'},'LOST SIGNAL':{color:'#94a3b8',icon:'wifi-off'}};
// Counts are collected from complete official upload scans, never card samples.
export function activityView(group,now=Date.now()){
 const data=group?.youtubeActivity;
 if(!data||data.activity_status==='UNKNOWN'||!ACTIVITY_META[data.activity_status])return null;
 const checked=Date.parse(data.checked_at),last=Date.parse(data.last_upload_at);
 if(!Number.isFinite(checked)||!Number.isFinite(last)||checked>now||last>now||now-checked>rules.staleHours*3600000)return null;
 const elapsed=Math.max(0,Math.floor((now-last)/1000));
 const age=elapsed<3600?`${Math.floor(elapsed/60)}m ago`:elapsed<86400?`${Math.floor(elapsed/3600)}h ago`:`${Math.floor(elapsed/86400)}d ago`;
 // Re-evaluate rolling windows and age transitions between collection runs.
 const times=[...new Map((data.uploads||[]).map(v=>[v.id,Date.parse(v.at)])).values()].filter(at=>Number.isFinite(at)&&at<=now);
 const count=days=>times.filter(at=>now-at<=days*86400000).length;
 const days=(now-last)/86400000;
 let state=data.activity_status;
 if(days>=rules.lostSignalDays)state='LOST SIGNAL';
 else if(days>=rules.anchoredDays)state='ANCHORED';
 else if(data.uploads){
  if(days<=rules.surge.lastUploadHours/24&&(count(1)>=rules.surge.hours24||count(3)>=rules.surge.days3||count(5)>=rules.surge.days5))state='SURGE';
  else if(days<=rules.sailing.lastUploadDays||count(7)>=rules.sailing.days7||count(14)>=rules.sailing.days14)state='SAILING';
  else state='COASTING';
 }
 return {state,...ACTIVITY_META[state],lastUpload:data.last_upload_at,age,uploads7d:data.uploads?count(7):data.uploads_7d};
}
