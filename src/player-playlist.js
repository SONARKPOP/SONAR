export function videoAspect(video){
 const raw=video?.aspectRatio;
 const ratio=typeof raw==='string'&&raw.includes(':')?Number(raw.split(':')[0])/Number(raw.split(':')[1]):Number(raw);
 if(Number.isFinite(ratio)&&ratio>0)return ratio;
 const width=Number(video?.videoWidth||video?.width),height=Number(video?.videoHeight||video?.height);
 if(width>0&&height>0)return width/height;
 if(['portrait','vertical'].includes(video?.orientation)||/세로\s*(?:캠|라이브|영상)|\bvertical\b/i.test(video?.title||'')||video?.format==='short'||video?.category==='shorts')return 9/16;
 return 16/9;
}
export function videoQueue(rows,current){
 const seen=new Set();const queue=rows.filter(row=>!row.platform||row.platform==='youtube').filter(row=>{const id=row.id||row.platformId;if(!id||seen.has(id))return false;seen.add(id);return true;});
 return queue.some(row=>row.id===current.id)?queue:[current];
}
export function adjacentVideos(queue,id){
 const index=queue.findIndex(row=>row.id===id);
 return {index,previous:index>0?queue[index-1]:null,next:index>=0&&index<queue.length-1?queue[index+1]:null};
}
export function swipeDirection(start,end){
 if(!start||!end)return 0;
 const dx=end.x-start.x,dy=end.y-start.y;
 return Math.abs(dy)>=55&&Math.abs(dy)>Math.abs(dx)*1.4?(dy<0?1:-1):0;
}
