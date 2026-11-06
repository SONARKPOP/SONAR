import test from 'node:test';
import assert from 'node:assert/strict';
import {isMusicBroadcast} from '../src/broadcast.js';
import {filterContent,commonChannels} from '../src/lib.js';
const record=(id,title,channelId='kbs-kpop',extra={})=>({id,title,channelId,channelName:'KBS Kpop',groupIds:['a'],memberIds:[],tags:[],subtypes:[],category:'external',format:'video',publishedAt:'2026-11-06T00:00:00Z',...extra});
const stage=record('stage','With - RESCENE [뮤직뱅크/Music Bank] | KBS 261106 방송');
const talk=record('talk','[뮤직뱅크] 핑크캐비닛 RESCENE 인터뷰');
test('music stages and official fancams are isolated; music-show variety stays external',()=>{
 const cam=record('cam','[MPD직캠] RESCENE - With','m2');
 assert(isMusicBroadcast(record('mbc','[예능연구소] RESCENE FullCam','mbc-kpop')));assert(isMusicBroadcast(stage));assert(isMusicBroadcast(cam));assert(!isMusicBroadcast(talk));
 for(const title of ['뮤직뱅크 대기실 인터뷰','Music Bank Behind','입덕직캠 리액션','리무진서비스 RESCENE 라이브','릴레이댄스 RESCENE'])assert(!isMusicBroadcast(record('x',title)));
 assert(!isMusicBroadcast(record('fan','RESCENE 직캠 Music Bank','unreviewed-fan')));
 const rows=[stage,talk,cam];
 assert.deepEqual(filterContent(rows,{category:'broadcast'}).map(v=>v.id),['stage','cam']);
 for(const category of ['home','external','music','shorts'])assert(!filterContent(rows,{category}).some(v=>v.id==='stage'||v.id==='cam'));
 assert.deepEqual(filterContent(rows,{category:'external'}).map(v=>v.id),['talk']);
 assert.equal(commonChannels(rows,['a'])[0].count,1);
 assert.equal(filterContent([record('short','[MPD직캠] RESCENE','m2',{format:'short'})],{category:'broadcast'}).length,1);
});
