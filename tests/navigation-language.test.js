import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import {UI_TRANSLATIONS,formatMessage,translate} from '../src/i18n.js';
const tokens=value=>[...value.matchAll(/\{(\w+)\}/g)].map(m=>m[1]).sort();
test('every interface dictionary entry has JA/EN/ES text and preserves placeholder names',()=>{
 for(const [key,values]of Object.entries(UI_TRANSLATIONS)){
  assert.equal(values.length,3,key);
  for(const value of values){assert.equal(typeof value,'string',key);assert.ok(value||['년','월','개','명'].includes(key),key);assert.deepEqual(tokens(value),tokens(key),key);assert.doesNotMatch(value,/[가-힣]/,key);}
 }
 assert.match(formatMessage('{name} 검색',{name:'별'},'en'),/별/);
 assert.equal(formatMessage('{count}개 아티스트',{count:0},'en'),'0 artists');
});
test('navigation, filters, feedback, cards and sidebar render in four languages without translating identities',async()=>{
 const oldWindow=globalThis.window;globalThis.window={innerWidth:1400,innerHeight:900};
 const server=await createServer({optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true,hmr:false,ws:false,watch:null}});
 try{
  const {LanguageContext}=await server.ssrLoadModule('/src/i18n.js');
  const {default:Filters}=await server.ssrLoadModule('/src/AnalysisArtistFilters.jsx');
  const {default:Sections}=await server.ssrLoadModule('/src/ContentSections.jsx');
  const {default:Feedback}=await server.ssrLoadModule('/src/FeedbackLink.jsx');
  const {default:Card}=await server.ssrLoadModule('/src/VideoCard.jsx');
  const {default:Sidebar}=await server.ssrLoadModule('/src/SidebarGroupRow.jsx');
  const {default:Player}=await server.ssrLoadModule('/src/AdjustablePlayer.jsx');
  const now=Date.parse('2026-11-17T12:00:00Z'),group={id:'b',name:'별',youtubeActivity:{activity_status:'SAILING',last_upload_at:'2026-11-16T12:00:00Z',checked_at:'2026-11-17T11:00:00Z',valid_until:'2026-11-17T13:00:00Z',uploads_7d:2}};
  const video={id:'youtube__test',platform:'youtube',platformId:'abcdefghijk',title:'홈',channelName:'전체 채널',channelId:'bae-ten-americano',groupIds:['b'],memberIds:['p'],subtypes:[],format:'live',category:'own',publishedAt:'2026-11-17T00:00:00Z'};
  const noop=()=>{},render=(Component,props,language)=>renderToStaticMarkup(React.createElement(LanguageContext.Provider,{value:language},React.createElement(Component,props)));
  for(const [language,yearLabel,feedbackLabel,channelLabel]of [['ko','1년','개선 의견 보내기','전체 채널'],['ja','1年','改善意見を送る','すべてのチャンネル'],['en','1 year','Send feedback','All channels'],['es','1 año','Enviar sugerencias','Todos los canales']]){
   const filters=render(Filters,{filters:{scope:'all',kind:'all',year:'',step:1,states:[]},onChange:noop,profile:true,years:[],stateCounts:{SAILING:1},total:1},language);
   assert.ok(filters.includes(yearLabel));assert.match(filters,/SURGE/);assert.match(filters,/ANCHORED/);if(language!=='ko')assert.doesNotMatch(filters,/[가-힣]/);
   const feedback=render(Feedback,{},language);assert.ok(feedback.includes(feedbackLabel));assert.doesNotMatch(feedback,/\/edit/);
   const sections=render(Sections,{category:'radio',section:'',rows:[video],broadcaster:'SBS',channel:'',onSection:noop,onBroadcaster:noop,onChannel:noop},language);
   assert.ok(sections.includes(channelLabel));assert.match(sections,/data-no-translate="true">전체 채널/);
   const card=render(Card,{video,groupsById:new Map([['b',group]]),memberName:()=> '별',onMemberSelect:noop,onOpen:noop,onSearch:noop},language);
   assert.match(card,/>홈<\/button>/);assert.match(card,/data-no-translate="true" title="전체 채널">전체 채널/);assert.match(card,/>별</);assert.doesNotMatch(card,/>Star</);
   const sidebar=render(Sidebar,{group,clock:now,checked:true,badges:[],onToggle:noop,onSwipe:noop},language);
   assert.match(sidebar,/>별</);assert.match(sidebar,/SAILING/);if(language!=='ko')assert.doesNotMatch(sidebar,/모아보기|마지막 업로드|최근 7일/);
   const player=render(Player,{labels:{player:translate('영상 플레이어',language),resize:translate('플레이어 크기 조절. 방향키로 조절',language)},children:React.createElement('iframe',{title:'원문영상',src:'about:blank'})},language);
   assert.ok(player.includes(translate('영상 플레이어',language)));assert.match(player,/title="원문영상"/);
  }
 }finally{await server.close();globalThis.window=oldWindow;}
});
test('the actual application starts in each saved language with localized navigation',async()=>{
 const oldWindow=globalThis.window,oldStorage=globalThis.localStorage;
 globalThis.window={location:{hash:'#collection'},matchMedia:()=>({matches:false})};
 const server=await createServer({optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true,hmr:false,ws:false,watch:null},plugins:[{name:'four-language-app-export',enforce:'pre',transform(source,id){if(id.replaceAll('\\','/').endsWith('/src/main.jsx'))return source.replace("createRoot(document.getElementById('root')).render(<App/>);",'export {App};');}}]});
 try{
  const {App}=await server.ssrLoadModule('/src/main.jsx');
  for(const [language,analysis,calendar]of [['ko','분석','업로드달력'],['ja','分析','アップロードカレンダー'],['en','Analysis','Upload calendar'],['es','Análisis','Calendario de subidas']]){
   globalThis.localStorage={getItem:key=>key==='sonar.language.v1'?language:null};
   const html=renderToStaticMarkup(React.createElement(App));
   assert.ok(html.includes(analysis),language);assert.ok(html.includes(calendar),language);assert.match(html,/SONAR/);assert.match(html,/MY GROUPS/);
   if(language!=='ko')assert.deepEqual(html.match(/[가-힣][^<>"]*/g)||[],[],language);
  }
 }finally{await server.close();globalThis.window=oldWindow;globalThis.localStorage=oldStorage;}
});
