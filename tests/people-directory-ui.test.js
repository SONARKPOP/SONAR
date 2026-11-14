import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToString} from 'react-dom/server';
import {createServer} from 'vite';

test('person details retain native names, multiple flags and separate group and solo dates',async()=>{
 const server=await createServer({optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true,hmr:false,ws:false,watch:null},plugins:[{
  name:'person-style-test',enforce:'pre',resolveId(id){if(id.endsWith('.css'))return '\0person-style';},load(id){if(id==='\0person-style')return 'export default {};';}
 }]});
 try{
  const {PersonProfile}=await server.ssrLoadModule('/src/PeopleDirectory.jsx');
  const {default:Row}=await server.ssrLoadModule('/src/ArtistDirectoryRow.jsx');
  const {default:Directory}=await server.ssrLoadModule('/src/ArtistDirectory.jsx');
  const person={id:'m',personId:'m',name:'Stage',legalNames:{ja:'公式名',en:'Official Name'},nationalities:['JP','US'],birthDate:'2000-01-02',
   birthPlace:{countryCode:'JP',region:'地域'},memberships:[{groupId:'g',name:'Group',status:'former',debutDate:'2015-03-04'}],
   soloDebuts:[{artistId:'solo',name:'Stage',date:'2024-05-06'}]};
  const html=renderToString(React.createElement(PersonProfile,{person,groups:new Map()})).replace(/<!--[\s\S]*?-->/g,'');
  assert.match(html,/lang="ja"[^>]*>公式名/);assert.match(html,/🇯🇵/);assert.match(html,/日本|일본/);assert.match(html,/미국/);
  assert.match(html,/2015\.03\.04/);assert.match(html,/2024\.05\.06/);assert.match(html,/이전 멤버/);
  const group={id:'g',name:'Group',aliases:[],gender:'girl',debutYear:2015,memberRoster:{current:['Current'],former:['Former']}};
  const favorites={heart:new Set(),star:new Set(),clover:new Set()};
  const row=renderToString(React.createElement(Row,{artist:group,detailsId:'details',groups:new Map([['g',group]]),compact:true,expanded:true,registeredMembers:[],favorites,onMemberOpen:()=>true,
   channels:[{id:'c',official:true,groupIds:['g'],platformId:'UC'+'a'.repeat(22)}],clock:Date.now(),connected:true}));
  assert.match(row,/현재 멤버/);assert.match(row,/탈퇴 멤버/);assert.match(row,/Current 멤버 정보 보기/);assert.match(row,/youtube\.com\/channel/);
  const directory=renderToString(React.createElement(Directory,{catalog:{groups:[group,{id:'solo',name:'Solo',artistType:'solo',aliases:[],gender:'girl'}],members:[],channels:[]},clock:Date.now(),
   saved:[],favorites:{heart:[],star:[],clover:[]},colors:{},excluded:[],allowed:[],protectedGroups:[]}));
  assert.match(directory,/개별 멤버/);assert.match(directory,/솔로 아티스트/);assert.match(directory,/전체 그룹/);
  const pending=renderToString(React.createElement(Directory,{catalog:null,clock:Date.now(),saved:[],favorites:{heart:[],star:[],clover:[]},colors:{},excluded:[],allowed:[],protectedGroups:[]}));
  assert.match(pending,/목록을 불러오는 중/);
 }finally{await server.close();}
});
