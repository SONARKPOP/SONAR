import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {browsingArtistIds,bulkViewingChecks} from '../src/artist-insights.js';
const now=Date.parse('2026-11-16T12:00:00Z');
const snapshot=state=>{const days={SURGE:0.04,SAILING:1,COASTING:30,ANCHORED:100}[state],at=new Date(now-days*86400000).toISOString();return {activity_status:state,checked_at:new Date(now).toISOString(),last_upload_at:at,valid_until:new Date(now+86400000).toISOString(),uploads:Array.from({length:state==='SURGE'?3:1},(_,i)=>({id:String(i),at}))};};
const catalog={groups:['SURGE','SAILING','COASTING','ANCHORED'].map((state,i)=>({id:'g'+i,name:'Artist-'+i,gender:'girl',youtubeActivity:snapshot(state)})),members:[]};

test('bulk viewing checks affect visible targets only and preserve stored preferences',()=>{
 const muted=['hidden','g1'],targets=['g1','g3'],favorites={heart:['g1'],star:['g3'],clover:[]};
 const before=JSON.stringify({catalog,favorites,muted,targets});
 assert.deepEqual(bulkViewingChecks(muted,targets,false),['hidden','g1','g3']);
 assert.deepEqual(bulkViewingChecks(muted,targets,true),['hidden']);
 assert.deepEqual(bulkViewingChecks(muted,[],false),muted);
 assert.equal(JSON.stringify({catalog,favorites,muted,targets}),before);
 assert.deepEqual(browsingArtistIds(catalog,{types:['girl'],muted:bulkViewingChecks([],catalog.groups.map(g=>g.id),false),now}),[]);
});
test('active browsing can combine selected states without changing presets or mute settings',()=>{
 assert.deepEqual(browsingArtistIds(catalog,{types:['girl'],activeOnly:true,activeStates:['SAILING','ANCHORED'],now}),['g1','g3']);
 assert.deepEqual(browsingArtistIds(catalog,{types:['girl'],activeOnly:true,activeStates:[],now}),[]);
 assert.equal(browsingArtistIds(catalog,{types:['girl'],activeOnly:true,now}).length,4);
});
test('sidebar exposes the tag filter, four expanded states and usable Shorts buttons',async()=>{
 const server=await createServer({optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true,hmr:false,ws:false,watch:null}});
 try{
  const {default:Sidebar}=await server.ssrLoadModule('/src/FavoritesSidebar.jsx');
  const props={catalog,favorites:{heart:['g1'],star:[],clover:[]},colors:{},scope:'active',presets:[],activeStates:['SAILING','ANCHORED'],disabled:[],hardBlocked:[],excluded:[],clock:now};
  const html=renderToStaticMarkup(React.createElement(Sidebar,{...props,tagGroup:'g1'}));
  assert.match(html,/전체 체크<\/button>/);assert.match(html,/전체 체크 해제<\/button>/);
  assert.match(html,/영상 태그 필터/);assert.match(html,/영상 태그 필터 해제/);assert.match(html,/sidebar-activity-choices/);assert.match(html,/Artist-1/);assert.match(html,/Artist-3/);assert.doesNotMatch(html,/Artist-0/);assert.doesNotMatch(html,/Artist-2/);
  const {default:Swipe}=await server.ssrLoadModule('/src/ShortSwipeArea.jsx');
  const shorts=renderToStaticMarkup(React.createElement(Swipe,{hasPrevious:false,hasNext:true,onStep:()=>{}}));
  assert.match(shorts,/aria-label="이전 쇼츠" disabled/);assert.match(shorts,/aria-label="다음 쇼츠"/);assert.match(shorts,/스와이프 · 방향키/);
 }finally{await server.close();}
});
