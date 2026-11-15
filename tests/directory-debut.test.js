import test from 'node:test';
import assert from 'node:assert/strict';
import {debutValue,personDebut} from '../src/directory-debut.js';
import React from 'react';
import {renderToString} from 'react-dom/server';
import {createServer} from 'vite';

test('debut labels retain supplied dates and year-only precision',()=>{
 assert.equal(debutValue('2020-04-08',2020),'2020-04-08');
 assert.equal(debutValue(null,2020),'2020');
 assert.equal(debutValue(null,null),'');
 assert.equal(debutValue('unconfirmed',2019),'2019');
});
test('personal debut prefers recorded first debut and distinguishes group and solo dates',()=>{
 const person={firstDebutDate:'2012-03-04',memberships:[{debutDate:'2010-01-02'}],soloDebuts:[{date:'2018-05-06'}]};
 assert.deepEqual(personDebut(person),{label:'데뷔',value:'2012-03-04'});
 delete person.firstDebutDate;
 assert.deepEqual(personDebut(person),{label:'그룹 데뷔',value:'2010-01-02'});
 assert.deepEqual(personDebut({soloDebuts:[{year:2017}]}),{label:'솔로 데뷔',value:'2017'});
 assert.equal(personDebut({memberships:[],soloDebuts:[]}),null);
});

test('compact directory keeps debut beside names and exposes video navigation',async()=>{
 const server=await createServer({optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true,hmr:false,ws:false,watch:null},plugins:[{name:'debut-css',enforce:'pre',resolveId(id){if(id.endsWith('.css'))return '\0debut-css';},load(id){if(id==='\0debut-css')return 'export default {};';}}]});
 try{
  const {default:Directory}=await server.ssrLoadModule('/src/UnifiedDirectory.jsx');
  const groups=[{id:'dated',name:'Exact Date',artistType:'group',debutYear:2020,debutDate:'2020-05-06',aliases:[]},{id:'year',name:'Year Only',artistType:'group',debutYear:2018,aliases:[]}];
  const html=renderToString(React.createElement(Directory,{catalog:{groups,members:[],channels:[]},favorites:{heart:[],star:[],clover:[]},colors:{},excluded:[],protectedGroups:[],clock:Date.now(),onVideos(){},onReturnVideos(){}}));
  assert.match(html,/directory-return-videos[^]*영상 목록으로 돌아가기/);
  assert.match(html,/Exact Date<\/button><\/h3><span class="directory-debut"/);
  assert.match(html,/<time dateTime="2020-05-06"[^>]*>2020-05-06<\/time>/);
  assert.match(html,/<time dateTime="2018"[^>]*>2018<\/time>/);
  assert.doesNotMatch(html,/2018-01-01/);
  assert.equal((html.match(/class="directory-control directory-video-link"/g)||[]).length,2);
 }finally{await server.close();}
});
