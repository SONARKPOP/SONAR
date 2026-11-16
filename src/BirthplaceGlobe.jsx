import React,{useEffect,useRef,useState} from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import {useLanguage} from './i18n';
import {mapCopy,mapPopupText,mapControlLabels} from './map-copy';
// Lazy module: the browser engine initializes only inside the mounting effect.
export default function BirthplaceGlobe({features,world,onSelect,view,counts,resetKey=0}){
 const language=useLanguage();
 const container=useRef(null),mapRef=useRef(null),latest=useRef({onSelect,features,counts,language}),[error,setError]=useState(''),[ready,setReady]=useState(false);
 latest.current={onSelect,features,counts,language};
 useEffect(()=>{
  let cancelled=false,map,observer,popup;
  import('maplibre-gl').then(module=>{
   if(cancelled)return;
   const gl=module.default||module;
   try{
    map=new gl.Map({container:container.current,locale:mapControlLabels(latest.current.language),style:{version:8,projection:{type:'globe'},sources:{},layers:[{id:'ocean',type:'background',paint:{'background-color':'#dcecf2'}}]},center:[115,25],zoom:1.15,minZoom:0,maxZoom:14,attributionControl:false,dragRotate:true,touchZoomRotate:true,scrollZoom:true,keyboard:true,renderWorldCopies:false});
    mapRef.current=map;
    map.addControl(new gl.NavigationControl({visualizePitch:true}),'top-right');
    map.addControl(new gl.AttributionControl({compact:false,customAttribution:['<a href="https://www.naturalearthdata.com/">Natural Earth</a>','<a href="https://sgis.kostat.go.kr/">SGIS</a> · <a href="https://github.com/vuski/admdongkor">vuski/admdongkor CC BY 4.0</a>']}),'bottom-right');
    map.on('load',()=>{
     if(cancelled)return;
     map.setProjection({type:'globe'});
     map.addSource('world',{type:'geojson',data:world});
     map.addLayer({id:'land',type:'fill',source:'world',paint:{'fill-color':'#ccd9dc','fill-opacity':.9}});
     map.addLayer({id:'coast',type:'line',source:'world',paint:{'line-color':'#8faeb9','line-width':.6}});
     map.addSource('people-regions',{type:'geojson',data:latest.current.features,generateId:true});
     map.addLayer({id:'people-regions',type:'fill',source:'people-regions',paint:{'fill-color':['interpolate',['linear'],['coalesce',['get','count'],0],0,'#d3e0e3',1,'#72c9cd',10,'#278d9c',100,'#0c5369'],'fill-opacity':['case',['>', ['coalesce',['get','count'],0],0],.85,.18]}});
     map.addLayer({id:'region-outlines',type:'line',source:'people-regions',paint:{'line-color':'#ffffff','line-width':['interpolate',['linear'],['zoom'],0,.2,7,.8,12,1.3],'line-opacity':.7}});
     popup=new gl.Popup({closeButton:false,closeOnClick:false,maxWidth:'320px'});
     map.on('mousemove','people-regions',e=>{
      const f=e.features?.[0];if(!f)return;map.getCanvas().style.cursor='pointer';
      const key=f.properties.mapKey,info=latest.current.counts.get(key);
      const content=document.createElement('div');content.setAttribute('data-no-translate','true');content.textContent=mapPopupText(f.properties.label||f.properties.name||key,info||[],latest.current.language);
      popup.setLngLat(e.lngLat).setDOMContent(content).addTo(map);
     });
     map.on('mouseleave','people-regions',()=>{map.getCanvas().style.cursor='';popup.remove();});
     map.on('click','people-regions',e=>{const key=e.features?.[0]?.properties.mapKey;if(key)latest.current.onSelect(key);});
     setReady(true);
    });
    map.on('error',event=>{if(!map.loaded()&&!cancelled)setError(event.error?.message||'지도 그래픽을 시작하지 못했습니다.');});
    observer=new ResizeObserver(()=>map.resize());observer.observe(container.current);
   }catch(e){setError(e.message||'지도 그래픽을 시작하지 못했습니다.');}
  }).catch(e=>{if(!cancelled)setError(e.message);});
  return()=>{cancelled=true;observer?.disconnect();popup?.remove();map?.remove();mapRef.current=null;};
 },[]);
 useEffect(()=>{if(ready)mapRef.current?.getSource('people-regions')?.setData(features);},[ready,features]);
 useEffect(()=>{if(!ready)return;const labels=mapControlLabels(language),root=container.current;for(const [selector,key] of [['.maplibregl-ctrl-zoom-in','NavigationControl.ZoomIn'],['.maplibregl-ctrl-zoom-out','NavigationControl.ZoomOut'],['.maplibregl-ctrl-compass','NavigationControl.ResetBearing'],['.maplibregl-ctrl-attrib-button','AttributionControl.ToggleAttribution']]){const button=root?.querySelector(selector);if(button){button.title=labels[key];button.setAttribute('aria-label',labels[key]);}}mapRef.current?.getCanvas().setAttribute('aria-label',labels['Map.Title']);},[ready,language]);
 useEffect(()=>{if(!ready)return;const map=mapRef.current;if(view==='korea')map.fitBounds([[124,33],[131.9,43]],{padding:35,duration:750});else map.flyTo({center:[115,25],zoom:1.15,pitch:0,bearing:0,duration:750});},[ready,view,resetKey]);
 return <div className="birthplace-globe-wrap"><div ref={container} className="birthplace-globe" role="region" aria-label={mapCopy('globeAria',language)}/>{!ready&&!error&&<p role="status" className="birthplace-globe-status">{mapCopy('loading',language)}</p>}{error&&<p role="alert" className="birthplace-globe-error">{mapCopy('graphicsError',language)}</p>}</div>;
}
