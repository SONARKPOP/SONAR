const finite = (value, fallback) => Number.isFinite(value) ? value : fallback;
// Keep the media ratio independent of the fixed-height title and controls.
export function fitPlayer(rect, viewport, ratio=16/9, chrome=112) {
 const vw=Math.max(1,finite(viewport.width,1)),vh=Math.max(1,finite(viewport.height,1));
 const inset=Math.min(8,vw/4,vh/4),maxW=vw-2*inset,maxH=vh-2*inset;
 const overhead=Math.min(chrome,Math.max(0,maxH-1));
 const limit=Math.max(1,Math.min(maxW,Math.max(0,maxH-overhead)*ratio+24));
 const width=Math.min(limit,Math.max(Math.min(ratio<1?160:280,limit),finite(rect.width,limit)));
 const height=Math.max(0,width-24)/ratio+overhead;
 return {width,height,x:Math.min(Math.max(inset,finite(rect.x,inset)),vw-width-inset),y:Math.min(Math.max(inset,finite(rect.y,inset)),vh-height-inset)};
}
export function resizePlayer(rect,dx,dy,viewport,ratio=16/9,chrome=112,corner='se') {
 const west=corner.includes('w'),north=corner.includes('n');
 const widthLimit=west?rect.x+rect.width-8:viewport.width-rect.x-8;
 const heightLimit=north?rect.y+rect.height-8:viewport.height-rect.y-8;
 const width=Math.min(widthLimit,Math.max(Math.min(ratio<1?120:280,widthLimit,rect.width),rect.width+dx*(west?-1:1)));
 const height=Math.min(heightLimit,Math.max(Math.min(220,heightLimit),rect.height+dy*(north?-1:1)));
 return {width,height,x:west?rect.x+rect.width-width:rect.x,y:north?rect.y+rect.height-height:rect.y};
}
export function clampPlayer(rect, viewport, minHeight = 220, minWidth = 280) {
  const vw = Math.max(1, finite(viewport.width, 1)), vh = Math.max(1, finite(viewport.height, 1));
  const inset = Math.min(8, vw / 4, vh / 4);
  const widthLimit = vw - inset * 2, heightLimit = vh - inset * 2;
  const width = Math.min(widthLimit, Math.max(Math.min(minWidth, widthLimit), finite(rect.width, 640)));
  const height = Math.min(heightLimit, Math.max(Math.min(minHeight, heightLimit), finite(rect.height, 460)));
  return { width, height, x: Math.min(Math.max(inset, finite(rect.x, inset)), vw - width - inset), y: Math.min(Math.max(inset, finite(rect.y, inset)), vh - height - inset) };
}
export function initialPlayer(viewport,aspectRatio=16/9) {
  const portrait=aspectRatio<1,chrome=portrait?150:112;
  const maximumHeight=viewport.height*(portrait?0.75:0.6);
  const width=Math.min(portrait?460:1100,viewport.width-16,Math.max(0,maximumHeight-chrome)*aspectRatio+24);
  return fitPlayer({width,height:Math.max(0,width-24)/aspectRatio+chrome,x:(viewport.width-width)/2,y:8},viewport,aspectRatio,chrome);
}
