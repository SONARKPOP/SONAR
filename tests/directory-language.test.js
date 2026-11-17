import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToString} from 'react-dom/server';
import {createServer} from 'vite';
import {directoryTranslations} from '../src/directory-translations.js';

test('directory translation templates have four-language parity',()=>{
 for(const [key,values] of Object.entries(directoryTranslations)){
  assert.equal(values.length,3,key);
  const slots=value=>[...value.matchAll(/\{(\w+)\}/g)].map(match=>match[1]).sort();
  for(const value of values){assert.ok(value.trim(),key);assert.deepEqual(slots(value),slots(key),key);}
 }
});

test('active directory, expanded rows and personal profiles translate without changing native names',async()=>{
 const server=await createServer({optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true,hmr:false,ws:false,watch:null},plugins:[{name:'directory-language-css',enforce:'pre',resolveId(id){if(id.endsWith('.css'))return '\0directory-language-css';},load(id){if(id==='\0directory-language-css')return 'export default {};';}}]});
 try{
  const {default:Directory}=await server.ssrLoadModule('/src/UnifiedDirectory.jsx');
  const {default:Row}=await server.ssrLoadModule('/src/ArtistDirectoryRow.jsx');
  const {PersonProfile}=await server.ssrLoadModule('/src/PeopleDirectory.jsx');
  const {default:Filters}=await server.ssrLoadModule('/src/DirectoryFilters.jsx');
  const {LanguageContext}=await server.ssrLoadModule('/src/i18n.js');
  const artist={id:'star',name:'별',aliases:[],debutYear:2020,memberRoster:{current:['별'],former:['김고은'],evidenceUrl:'https://example.com/source'},officialLinks:[{platform:'website',url:'https://example.com'}]};
  const person={id:'person',name:'별',legalNames:{ko:'김고은',ja:'山田花子'},nationalities:['KR'],soloDebuts:[],memberships:[]};
  for(const [language,back,member,profile,result] of [['ko','영상 목록으로 돌아가기','현재 멤버','인물 프로필','결과 1 · 선호 0'],['ja','動画一覧に戻る','現メンバー','人物プロフィール','結果 1 · お気に入り 0'],['en','Return to videos','Current members','Person profile','Results 1 · Favorites 0'],['es','Volver a los vídeos','Integrantes actuales','Perfil personal','Resultados 1 · Favoritos 0']]){
   const render=element=>renderToString(React.createElement(LanguageContext.Provider,{value:language},element)).replace(/<!--[\s\S]*?-->/g,'');
   const directory=render(React.createElement(Directory,{catalog:{groups:[artist],members:[],channels:[]},clock:Date.now(),favorites:{heart:[],star:[],clover:[]},colors:{},excluded:[],protectedGroups:[],onReturnVideos(){}}));
   assert.ok(directory.includes(back),language);assert.ok(directory.includes(result),language);assert.match(directory,/>별<\/button>/);
   const row=render(React.createElement(Row,{artist,groups:new Map(),channels:[],clock:Date.now(),registeredMembers:[],favorites:{heart:new Set(['star']),star:new Set(),clover:new Set()},expanded:true,compact:true,favoritesOnly:true,onMemberOpen(){}}));
   assert.ok(row.includes(member),language);assert.match(row,/>별<\/span>/);assert.match(row,/>김고은<\/span>/);
   const html=render(React.createElement(PersonProfile,{person,groups:new Map()}));
   assert.ok(html.includes(profile),language);assert.match(html,/>별<\/span>/);assert.match(html,/lang="ko"[^>]*>김고은/);assert.match(html,/lang="ja"[^>]*>山田花子/);
   const filters=render(React.createElement(Filters,{filters:{year:'all',status:'all'},years:[['all','전체 연도']],counts:{years:{all:1234},statuses:{},saved:0},resultCount:1234,dialogRef:{current:null}}));
   if(language!=='ko')assert.doesNotMatch(filters,/명 보기|MY GROUPS만|아티스트 필터/);
   if(language!=='ko')assert.doesNotMatch(row,/관련 아티스트 검색|멤버 정보 보기|공식 채널|공식 사이트|현재 멤버|출처|선호 그룹 및 보기 설정/);
  }
 }finally{await server.close();}
});
