import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createServer} from 'vite';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

test('real credits preserve distinct roles, deduplicate repeated release and render provenance',async()=>{
  const server=await createServer({optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true,hmr:false,ws:false,watch:null}});
  try{
    const {default:MusicCredits,musicSongRows}=await server.ssrLoadModule('/src/MusicCredits.jsx');
    const data=JSON.parse(readFileSync(new URL('../config/music-credits.json',import.meta.url),'utf8'));
    const rows=musicSongRows(data);
    assert.equal(rows.length,350);
    assert.equal(rows[0].releases.length,2);
    assert.equal(rows[0].recordings.length,1);
    assert.equal(rows[0].roles.lyricist.length,4);
    assert.equal(rows[0].roles.composer.length,3);
    assert.equal(rows[0].roles.producer,null);
    assert.equal(musicSongRows(data,'  BOY MATTHEWS ').length,1);
    assert.equal(musicSongRows(data,'nonexistent').length,0);
    const html=renderToStaticMarkup(React.createElement(MusicCredits,{data,catalog:{groups:[{id:'twice',name:'TWICE'}]}}));
    assert.match(html,/TWICE/);
    assert.match(html,/미확인/);
    assert.match(html,/MusicBrainz/);
    assert.match(html,/공식 검증 아님/);
    const expanded=renderToStaticMarkup(React.createElement(MusicCredits,{data}));
    assert.match(expanded,/나무위키 1차 수집/);
    assert.match(expanded,/유통사 게재 크레딧/);
    assert.match(expanded,/https:\/\/music\.bugs\.co\.kr\/album\/17460776/);
    assert.doesNotThrow(()=>renderToStaticMarkup(React.createElement(MusicCredits)));
  }finally{await server.close();}
});
