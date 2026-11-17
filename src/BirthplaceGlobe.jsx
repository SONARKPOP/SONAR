import React,{useEffect,useRef,useState} from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import {geoBounds} from 'd3-geo';
import {globePalette,globeFillColor,globeLineColor,applyGlobeTheme,observeGlobeTheme} from './globe-theme';
import {geometryVertexCount} from './globe-map-model';
import {useLanguage} from './i18n';
import {mapCopy,mapControlLabels} from './map-copy';
const zoomStops={1:[2,0,4,.7,7,.8],2:[6,0,8,.75,11,.85],3:[9,0,11,.78,14,.88]};
export default function BirthplaceGlobe({features,world,onSelect,onViewport,country,region,resetKey=0}){
 const [theme,setTheme]=useState(()=>typeof document!=='undefined'&&document.documentElement.getAttribute('data-theme')==='dark'?'dark':'light');
 useEffect(()=>observeGlobeTheme(document.documentElement,setTheme),[]);
 const language=useLanguage(),container=useRef(null),mapRef=useRef(null),latest=useRef({}),selectedBounds=useRef(null),selectedComplexity=useRef({featureCount:0,vertexCount:0}),[error,setError]=useState(''),[ready,setReady]=useState(false);
 latest.current={features,onSelect,onViewport,language,region,theme};
 useEffect(()=>{let cancelled=false,map,observer,hoverId=null;
 import('maplibre-gl').then(module=>{if(cancelled)return;const gl=module.default||module;try{
 map=new gl.Map({container:container.current,locale:mapControlLabels(latest.current.language),style:{version:8,projection:{type:'globe'},sources:{},layers:[{id:'ocean',type:'background',paint:{'background-color':globePalette(latest.current.theme).ocean}}]},center:[115,25],zoom:1.15,minZoom:0,maxZoom:17,attributionControl:false,dragRotate:true,touchZoomRotate:true,scrollZoom:true,keyboard:true,renderWorldCopies:false});mapRef.current=map;
 map.addControl(new gl.NavigationControl({visualizePitch:true}),'top-right');map.addControl(new gl.AttributionControl({compact:false,customAttribution:['<a href="https://www.naturalearthdata.com/">Natural Earth Public Domain</a>','<a href="https://sgis.kostat.go.kr/">SGIS</a> · <a href="https://github.com/vuski/admdongkor">admdongkor CC BY 4.0</a>']}),'bottom-right');
 const report=()=>{if(!map||cancelled)return;const bounds=selectedBounds.current;let parentArea=0;if(bounds){try{const a=map.project(bounds[0]),b=map.project(bounds[1]);parentArea=Math.min(map.getContainer().clientWidth*map.getContainer().clientHeight,Math.abs((b.x-a.x)*(b.y-a.y)));}catch{}}
 latest.current.onViewport?.({zoom:map.getZoom(),width:map.getContainer().clientWidth,height:map.getContainer().clientHeight,parentArea,...selectedComplexity.current});};
 map.on('load',()=>{if(cancelled)return;map.setProjection({type:'globe'});
 // tolerance:0 prevents additional runtime simplification. Source precision remains finite.
 map.addSource('people-regions',{type:'geojson',data:latest.current.features,generateId:true,tolerance:0,maxzoom:18});
 for(let level=0;level<=3;level++){
 const opacity=level===0?.78:['interpolate',['linear'],['zoom'],...zoomStops[level]];
 map.addLayer({id:'regions-'+level,type:'fill',source:'people-regions',filter:['==',['get','level'],level],paint:{'fill-color':globeFillColor(latest.current.theme),'fill-opacity':opacity}});
 map.addLayer({id:'outlines-'+level,type:'line',source:'people-regions',filter:['==',['get','level'],level],paint:{'line-color':globeLineColor(latest.current.theme),'line-width':['case',['boolean',['feature-state','hover'],false],2.5,level===0?.65:1],'line-opacity':level===0?.7:['interpolate',['linear'],['zoom'],...zoomStops[level]]}});
 }
 const hits=point=>map.queryRenderedFeatures(point,{layers:['regions-3','regions-2','regions-1','regions-0']}).filter(f=>f.properties.level===0||map.getZoom()>=(f.properties.level===1?2.5:f.properties.level===2?6.5:9.5));
 map.on('mousemove',e=>{const feature=hits(e.point)[0];if(hoverId!==null)map.setFeatureState({source:'people-regions',id:hoverId},{hover:false});hoverId=feature?.id??null;if(hoverId!==null)map.setFeatureState({source:'people-regions',id:hoverId},{hover:true});map.getCanvas().style.cursor=feature?'pointer':'';});
 map.on('mouseout',()=>{if(hoverId!==null)map.setFeatureState({source:'people-regions',id:hoverId},{hover:false});hoverId=null;map.getCanvas().style.cursor='';});
 map.on('click',e=>{const feature=hits(e.point)[0];if(feature){const full=latest.current.features.features.find(f=>f.properties.mapKey===feature.properties.mapKey);if(full){selectedBounds.current=geoBounds(full);selectedComplexity.current={featureCount:latest.current.features.features.filter(f=>f.properties.level===full.properties.level).length,vertexCount:geometryVertexCount(full.geometry)};}latest.current.onSelect?.(feature.properties.mapKey,{x:e.point.x,y:e.point.y},feature.properties);}});
 map.on('moveend',report);map.on('zoomend',report);setReady(true);report();});
 map.on('error',event=>{if(!map.loaded()&&!cancelled)setError(event.error?.message||'graphics');});observer=new ResizeObserver(()=>{map.resize();if(map.loaded())report();});observer.observe(container.current);
 }catch(e){setError(e.message);}}).catch(e=>{if(!cancelled)setError(e.message);});return()=>{cancelled=true;observer?.disconnect();map?.remove();mapRef.current=null;};},[]);
 useEffect(()=>{if(ready)applyGlobeTheme(mapRef.current,theme);},[ready,theme]);
 useEffect(()=>{if(ready)mapRef.current?.getSource('people-regions')?.setData(features);},[ready,features]);
 useEffect(()=>{if(!ready)return;const labels=mapControlLabels(language),root=container.current;for(const [selector,key] of [['.maplibregl-ctrl-zoom-in','NavigationControl.ZoomIn'],['.maplibregl-ctrl-zoom-out','NavigationControl.ZoomOut'],['.maplibregl-ctrl-compass','NavigationControl.ResetBearing'],['.maplibregl-ctrl-attrib-button','AttributionControl.ToggleAttribution']]){const button=root?.querySelector(selector);if(button){button.title=labels[key];button.setAttribute('aria-label',labels[key]);}}mapRef.current?.getCanvas().setAttribute('aria-label',labels['Map.Title']);},[ready,language]);
 useEffect(()=>{if(!ready)return;const map=mapRef.current,feature=region?latest.current.features.features.find(f=>f.properties.mapKey===region):world.features.find(f=>(f.properties.ISO_A2_EH||f.properties.ISO_A2)===country);if(feature){const bounds=geoBounds(feature);selectedBounds.current=bounds;if(bounds[1][0]>bounds[0][0])map.fitBounds(bounds,{padding:55,maxZoom:region?.startsWith('kr2:')?12:region?9:6,duration:650});}else if(!country){selectedBounds.current=null;map.flyTo({center:[115,25],zoom:1.15,pitch:0,bearing:0,duration:650});}},[ready,country,region,resetKey]);
 return <div className="birthplace-globe-wrap"><div ref={container} className="birthplace-globe" role="region" aria-label={mapCopy('globeAria',language)}/>{!ready&&!error&&<p role="status" className="birthplace-globe-status">{mapCopy('loading',language)}</p>}{error&&<p role="alert" className="birthplace-globe-error">{mapCopy('graphicsError',language)}</p>}</div>;
}
