import test from 'node:test';
import assert from 'node:assert/strict';
import {contentLength,durationSeconds,contentSectionMatches,broadcasterFor,musicType} from '../src/content-sections.js';
test('content length respects exact boundaries and unknown duration',()=>{
 assert.equal(contentLength({durationSeconds:299}),'short');assert.equal(contentLength({durationSeconds:300}),'regular');assert.equal(contentLength({durationSeconds:2700}),'long');
 assert.equal(contentLength({format:'live',durationSeconds:3}),'live');assert.equal(contentLength({}),'');assert.equal(durationSeconds({durationLabel:'1:02:03'}),3723);
});
test('music and content teasers stay under the appropriate parents',()=>{
 const music={title:'Title MV Teaser'},content={title:'자체 예능 다음화 예고'};
 assert.equal(musicType(music),'teaser');assert.equal(musicType(content),'');
 assert.equal(contentSectionMatches(content,'radio','teaser'),true);assert.equal(contentSectionMatches({title:'라디오 본편'},'radio','teaser'),false);
 assert.equal(musicType({title:'MV Behind interview'}),'');
});
test('radio fallback belongs to SBS and KFN groups as events',()=>{
 assert.equal(broadcasterFor({channelId:'bae-ten-americano'},'radio'),'SBS');assert.equal(broadcasterFor({channelId:'kfn-wimun'},'broadcast'),'events');
});
