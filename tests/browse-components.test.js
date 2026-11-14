import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
import React from 'react';
import {renderToString} from 'react-dom/server';

test('browse components preserve platform links, filter selection and independent group counts',async()=>{
 const server=await createServer({optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true,hmr:false,ws:false,watch:null},plugins:[{
  name:'browse-component-styles',enforce:'pre',
  resolveId(source){if(source.endsWith('.css'))return '\0browse-test-style';},
  load(id){if(id==='\0browse-test-style')return 'export default {};';},
 }]});
 try{
  const {default:VideoCard}=await server.ssrLoadModule('/src/VideoCard.jsx');
  const {default:FilterChoices}=await server.ssrLoadModule('/src/FilterChoices.jsx');
  const {default:MyGroupControls}=await server.ssrLoadModule('/src/MyGroupControls.jsx');
  const card=renderToString(React.createElement(VideoCard,{video:{id:'youtube__123',platform:'youtube',platformId:'123',
   title:'Interview',groupIds:['g'],memberIds:[],subtypes:['인터뷰'],tags:[],channelName:'Original studio',
   format:'video',publishedAt:'2026-11-14T00:00:00Z'},groupsById:new Map([['g',{name:'Group'}]]),
   style:{backgroundColor:'rgb(220, 230, 240)'},onOpen:()=>{},onSearch:()=>{}}));
  assert.match(card,/youtube\.com\/watch\?v=123/);
  assert.match(card,/Original studio/);
  assert.match(card,/rgb\(220, 230, 240\)/);
  assert.match(card,/Group 검색/);
  const filters=renderToString(React.createElement(FilterChoices,{label:'그룹',value:'b',options:[['a','A'],['b','B']],onChange:()=>{}}));
  const selected=filters.match(/<button[^>]+aria-pressed="true"[^>]*>[\s\S]*?<\/button>/g);
  assert.equal(selected.length,1);
  assert.match(selected[0],/>B</);
  const controls=renderToString(React.createElement(MyGroupControls,{view:'selected',presets:[],activePresets:[],ready:true,
   counts:{registered:430,listed:27,saved:100,favorites:6,enabled:12},onView:()=>{},onPreset:()=>{},onEdit:()=>{}})).replace(/<!--[\s\S]*?-->/g,'');
  assert.match(controls,/영상 켜짐 12/);
  assert.match(controls,/선택 목록 27/);
  assert.match(controls,/저장 100/);
 }finally{await server.close();}
});
