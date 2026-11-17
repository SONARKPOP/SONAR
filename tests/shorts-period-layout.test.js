import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';

test('period and Shorts toggle remain independent siblings, with preserved Shorts filtering',async()=>{
 const server=await createServer({optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true,hmr:false,ws:false,watch:null}});
 try{
  const {default:Toggle,filterShortVideos}=await server.ssrLoadModule('/src/ShortsExcludeFilter.jsx');
  const {default:Period}=await server.ssrLoadModule('/src/ContentPeriodFilter.jsx');
  const videos=[{id:'short',format:'short'},{id:'tiny',format:'video',durationLabel:'59s'},{id:'minute',format:'video',durationLabel:'1m'},{id:'unknown',format:'video'}];
  assert.equal(filterShortVideos(videos,false),videos);
  assert.deepEqual(filterShortVideos(videos,true).map(v=>v.id),['minute','unknown']);
  const html=renderToStaticMarkup(React.createElement('div',{className:'content-period-controls'},React.createElement(Period,{onYear(){},onMonth(){}}),React.createElement(Toggle,{enabled:true,onChange(){}})));
  assert.match(html,/<\/details><button[^>]+class="shorts-exclude-filter"[^>]+aria-pressed="true"/);
 }finally{await server.close();}
});
