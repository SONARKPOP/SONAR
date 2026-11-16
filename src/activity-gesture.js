export function gestureSnapshot(points,offset,count){
 const [first,second]=[...points.values()];
 return {x:first?.x??0,y:first?.y??0,offset,count,size:points.size,distance:second?Math.hypot(second.x-first.x,second.y-first.y):0};
}
export function gestureViewport(points,baseline,width,length){
 const [first,second]=[...points.values()];
 if(!first||!baseline||baseline.size!==points.size)return null;
 const clampCount=n=>Math.max(Math.min(4,length),Math.min(length,n));
 const distance=second?Math.hypot(second.x-first.x,second.y-first.y):0;
 const count=second&&baseline.distance>0&&distance>0?clampCount(Math.round(baseline.count*baseline.distance/distance)):baseline.count;
 const offset=second?baseline.offset:baseline.offset+Math.round((first.x-baseline.x)/Math.max(1,width)*count);
 return {count,offset:Math.max(0,Math.min(Math.max(0,length-count),offset))};
}
