import test from 'node:test';
import assert from 'node:assert/strict';
import {isContinuousLive} from '../src/live-policy.js';
import {activeLives,filterContent} from '../src/lib.js';
test('continuous music stations are hidden while ordinary fan and concert lives remain',()=>{
 const row={id:'station',title:'BIBI STATION 📻',format:'live',liveStatus:'live',actualStartTime:'2026-11-06T00:00:00Z',channelId:'bibi',groupIds:['bibi'],memberIds:[],tags:[],subtypes:[],publishedAt:'2026-11-06T00:00:00Z'};
 const fan={...row,id:'fan',title:'오늘 같이 얘기해요 보이는 라디오'};
 const concert={...row,id:'concert',title:'BIBI Concert Live'};
 const now=Date.parse('2026-11-06T01:00:00Z');
 assert(isContinuousLive(row));assert(!isContinuousLive(fan));assert(!isContinuousLive(concert));
 assert(!isContinuousLive({...row,format:'video',liveStatus:'none'}));
 assert.deepEqual(activeLives({updatedAt:new Date(now).toISOString(),items:[row,fan,concert]},[{id:'bibi',official:true,groupIds:['bibi']}],now).map(v=>v.id),['fan','concert']);
 assert.deepEqual(filterContent([row,fan],{category:'live'}).map(v=>v.id),['fan']);
});
