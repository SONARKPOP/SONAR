const finite = (value, fallback) => Number.isFinite(value) ? value : fallback;
export function clampPlayer(rect, viewport, minHeight = 220) {
  const vw = Math.max(1, finite(viewport.width, 1)), vh = Math.max(1, finite(viewport.height, 1));
  const inset = Math.min(8, vw / 4, vh / 4);
  const widthLimit = vw - inset * 2, heightLimit = vh - inset * 2;
  const width = Math.min(widthLimit, Math.max(Math.min(280, widthLimit), finite(rect.width, 640)));
  const height = Math.min(heightLimit, Math.max(Math.min(minHeight, heightLimit), finite(rect.height, 460)));
  return { width, height, x: Math.min(Math.max(inset, finite(rect.x, inset)), vw - width - inset), y: Math.min(Math.max(inset, finite(rect.y, inset)), vh - height - inset) };
}
export function initialPlayer(viewport,aspectRatio=16/9) {
  const portrait=aspectRatio<1,chrome=portrait?150:112;
  const maximumHeight=viewport.height*(portrait?0.75:0.6);
  const width=Math.min(portrait?460:1100,viewport.width-16,Math.max(0,maximumHeight-chrome)*aspectRatio+24);
  return clampPlayer({width,height:Math.max(0,width-24)/aspectRatio+chrome,x:(viewport.width-width)/2,y:8},viewport);
}
