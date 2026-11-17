const palettes={
 light:{ocean:'#dcecf2',land:'#d3e0e3',one:'#72c9cd',ten:'#278d9c',hundred:'#0c5369',border:'#ffffff',hover:'#e87325'},
 dark:{ocean:'#0b1725',land:'#263c4d',one:'#3b7c89',ten:'#59b6bf',hundred:'#b0e7dc',border:'#7895a7',hover:'#f4c078'}
};
export const globePalette=theme=>palettes[theme==='dark'?'dark':'light'];
export function globeFillColor(theme){const p=globePalette(theme);return ['interpolate',['linear'],['coalesce',['get','count'],0],0,p.land,1,p.one,10,p.ten,100,p.hundred];}
export function globeLineColor(theme){const p=globePalette(theme);return ['case',['boolean',['feature-state','hover'],false],p.hover,p.border];}
export function applyGlobeTheme(map,theme){
 if(map.getLayer('ocean'))map.setPaintProperty('ocean','background-color',globePalette(theme).ocean);
 for(let level=0;level<=3;level++){
  if(map.getLayer('regions-'+level))map.setPaintProperty('regions-'+level,'fill-color',globeFillColor(theme));
  if(map.getLayer('outlines-'+level))map.setPaintProperty('outlines-'+level,'line-color',globeLineColor(theme));
 }
}
export function observeGlobeTheme(root,onChange,Observer=globalThis.MutationObserver){
 const update=()=>onChange(root?.getAttribute('data-theme')==='dark'?'dark':'light');
 update();
 if(!root||!Observer)return ()=>{};
 const observer=new Observer(update);observer.observe(root,{attributes:true,attributeFilter:['data-theme']});
 return ()=>observer.disconnect();
}
