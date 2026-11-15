import test from 'node:test';
import assert from 'node:assert/strict';
import {hardBlockContent} from '../src/artist-insights.js';
import {videoAspect,videoQueue,adjacentVideos,swipeDirection} from '../src/player-playlist.js';
test('portrait uses explicit dimensions first and Shorts defaults to 9:16',()=>{
 assert.equal(videoAspect({format:'short'}),9/16);
 assert.equal(videoAspect({format:'short',width:1920,height:1080}),16/9);
 assert.equal(videoAspect({aspectRatio:'9:16'}),9/16);
 assert.equal(videoAspect({durationLabel:'30s',format:'video'}),16/9);
 assert.equal(videoAspect({orientation:'portrait'}),9/16);
 assert.equal(videoAspect({format:'video',title:'[4K] 세로캠'}),9/16);
 assert.equal(videoAspect({format:'video',title:'Vertical live'}),9/16);
 assert.equal(videoAspect({format:'video',title:'[세로 직캠] stage'}),9/16);
 assert.equal(videoAspect({format:'video',title:'MV 세로버전'}),9/16);
});
test('player keeps displayed order, deduplicates and bounds previous/next',()=>{
 const rows=[{id:'b',platform:'youtube'},{id:'a',platform:'youtube'},{id:'a',platform:'youtube'},{id:'external',platform:'chzzk'}];
 const queue=videoQueue(rows,rows[0]);assert.deepEqual(queue.map(v=>v.id),['b','a']);
 assert.equal(adjacentVideos(queue,'b').previous,null);assert.equal(adjacentVideos(queue,'b').next.id,'a');assert.equal(adjacentVideos(queue,'a').next,null);
 assert.deepEqual(videoQueue(rows,{id:'live'}),[{id:'live'}]);assert.equal(adjacentVideos(queue,'gone').next,null);
});
test('swipes require intentional vertical movement and ignore tap, horizontal or cancel',()=>{
 assert.equal(swipeDirection({x:0,y:100},{x:4,y:10}),1);assert.equal(swipeDirection({x:0,y:0},{x:5,y:90}),-1);
 assert.equal(swipeDirection({x:0,y:0},{x:90,y:60}),0);assert.equal(swipeDirection({x:0,y:0},{x:0,y:15}),0);assert.equal(swipeDirection(null,{x:0,y:90}),0);
});

test('new hard blocks also exclude cached playlist neighbors',()=>{
 const rows=[{id:'a',groupIds:['safe'],memberIds:[]},{id:'b',groupIds:['blocked'],memberIds:[]},{id:'c',groupIds:['safe'],memberIds:[]}];
 const allowed=hardBlockContent(rows,['blocked'],{groups:[{id:'safe'},{id:'blocked'}],members:[]});
 assert.equal(adjacentVideos(allowed,'a').next.id,'c');
});
