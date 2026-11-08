import test from 'node:test';
import assert from 'node:assert/strict';
import {artistsInCategory,visibleArtistIds,filterContent} from '../src/lib.js';
import {directoryResults,legacyGroupState} from '../src/directory.js';

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

test('individual switch hides only career-linked results and still allows direct solo selection',()=>{
 const activity={artistId:'lunedi',groupIds:['weeekly'],kind:'individual'};
 const solo={id:'solo',groupIds:['lunedi'],individualActivity:activity,title:'Personal vlog',channelName:'LUNEDI',
  tags:[],memberIds:[],subtypes:[],category:'own',format:'video',publishedAt:'2026-01-01'};
 const group={...solo,id:'group',groupIds:['weeekly'],individualActivity:undefined};
 const names=new Map([['weeekly',['Weeekly','위클리']]]);
 assert.deepEqual(filterContent([solo,group],{groups:['weeekly'],includeIndividual:false}).map(v=>v.id),['group']);
 assert.equal(filterContent([solo],{groups:['weeekly'],query:'위클리',artistNames:names}).length,1);
 assert.equal(filterContent([solo],{groups:['lunedi'],includeIndividual:false}).length,1);
});

test('mixed duos are groups and legacy status is independent of upload inactivity',()=>{
 const artists=[{id:'akmu',name:'AKMU',gender:'mixed',artistType:'duo'}];
 for(const category of ['mixed','all'])assert.equal(artistsInCategory(artists,category).length,1);
 assert.equal(artistsInCategory(artists,'duo-solo').length,0);
 const now=Date.parse('2026-11-07T00:00:00Z');
 assert.equal(legacyGroupState({lastOfficialUploadAt:'2024-11-07'},now),'long-dormant');
 assert.equal(legacyGroupState({lastOfficialUploadAt:'2025-01-01'},now),null);
 assert.equal(legacyGroupState({groupStatus:'disbanded'},now),'disbanded');
 assert.equal(legacyGroupState({groupStatus:'hiatus'},now),'hiatus');
 const group={id:'weeekly',name:'Weeekly',nameKo:'위클리'};
 const solo={id:'lunedi',name:'루네디',artistType:'solo',previousGroupIds:['weeekly']};
 assert.deepEqual(directoryResults([group,solo],{query:'위클리'}).map(g=>g.id).sort(),['lunedi','weeekly']);
});
