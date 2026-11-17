import test from 'node:test';
import assert from 'node:assert/strict';
import {filterContent,matchesContentTab,videoMatchesArtist} from '../src/lib.js';
import {archiveRequest} from '../src/browse.js';
test('All includes music shows, radio and Shorts without admitting continuous stations',()=>{
 for(const v of [{musicBroadcast:true},{contentTabs:['radio']},{format:'short'},{contentTabs:['music']}])assert.equal(matchesContentTab(v,'all'),true);
 assert.equal(matchesContentTab({title:'BIBI STATION',format:'live'},'all'),false);
 const request=archiveRequest({limits:{all:24},months:[],groupTabs:{}},Array.from({length:10},(_,i)=>String(i)),'all','','',{months:0});
 assert.deepEqual(request.paths,['browse/all.json']);
});
test('former-group search metadata is distinct from appearance IDs and remains filterable',()=>{
 const v={id:'mashiro-video',title:'메이딘 마시로',channelName:'Studio',groupIds:['madein'],careerGroupIds:['kep1er'],memberIds:['mashiro'],tags:[],subtypes:[],format:'video',category:'external',publishedAt:'2026-11-17T00:00:00Z'};
 assert.equal(videoMatchesArtist(v,'kep1er'),true);assert.equal(videoMatchesArtist(v,'kep1er',false),false);
 assert.equal(filterContent([v],{groups:['kep1er'],category:'all'}).length,1);
 assert.equal(filterContent([v],{query:'케플러',category:'all',artistNames:new Map([['kep1er',['케플러']]])}).length,1);
 assert.deepEqual(v.groupIds,['madein']);
});
