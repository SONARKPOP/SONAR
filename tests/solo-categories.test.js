import test from 'node:test';
import assert from 'node:assert/strict';
import {artistsInCategory,visibleArtistIds,filterContent} from '../src/lib.js';

test('idol solo profile appears in both categories but once in All',()=>{
 const rows=[{id:'hwasa',gender:'girl',artistType:'solo',displayCategories:['girl','duo-solo']}];
 assert.equal(artistsInCategory(rows,'girl').length,1);
 assert.equal(artistsInCategory(rows,'duo-solo').length,1);
 assert.equal(artistsInCategory(rows,'all').length,1);
 assert.deepEqual(visibleArtistIds(rows,['hwasa'],['girl']),['hwasa']);
 assert.deepEqual(visibleArtistIds(rows,['hwasa'],['duo-solo']),['hwasa']);
 assert.deepEqual(visibleArtistIds(rows,['hwasa'],['boy']),[]);
});

test('selecting parent and solo does not duplicate a video',()=>{
 const v={id:'youtube__abc123DEF45',groupIds:['hwasa','mamamoo'],title:'MV',channelName:'HWASA',
  tags:[],memberIds:[],subtypes:[],category:'music',format:'video',durationLabel:'3m',publishedAt:'2026-01-01'};
 assert.equal(filterContent([v,v],{groups:['hwasa','mamamoo']}).length,1);
});
