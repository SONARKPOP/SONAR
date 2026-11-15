import test from 'node:test';
import assert from 'node:assert/strict';
import {clampPlayer, initialPlayer} from '../src/playerGeometry.js';
test('player starts at the top and fits desktop and mobile viewports',()=>{
 for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:320,height:240}]){
  const rect=initialPlayer(viewport);
  assert.equal(rect.y,8);
  assert.ok(rect.width<=1100);
  assert.ok(rect.x>=8&&rect.x+rect.width<=viewport.width-8);
  assert.ok(rect.y+rect.height<=viewport.height-8);
 }
});
test('drag and resize remain reachable after viewport shrink',()=>{
 const rect=clampPlayer({x:1400,y:800,width:1100,height:700},{width:390,height:500});
 assert.deepEqual(rect,{x:8,y:8,width:374,height:484});
 const small=clampPlayer({x:-200,y:-80,width:1,height:1},{width:390,height:500});
 assert.deepEqual(small,{x:8,y:8,width:280,height:220});
});
test('transient zero viewport never produces negative or nonfinite coordinates',()=>{
 const rect=clampPlayer({x:Infinity,y:NaN,width:NaN,height:-50},{width:0,height:0});
 for(const value of Object.values(rect))assert.ok(Number.isFinite(value)&&value>=0);
});
test('desktop initial media keeps 16:9 with controls inside sixty percent of viewport',()=>{
 for(const viewport of [{width:1440,height:900},{width:1920,height:1080}]){
  const rect=initialPlayer(viewport);
  assert.ok(rect.height<=viewport.height*0.6);
  assert.equal(rect.height,(rect.width-24)*9/16+112);
 }
});

test('portrait default is taller than wide and preserves room for controls',()=>{
 for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
  const rect=initialPlayer(viewport,9/16);
  assert.ok(rect.height>rect.width);
  assert.ok(rect.y+rect.height<=viewport.height-8);
  assert.ok(Math.abs((rect.width-24)/(rect.height-150)-9/16)<0.001);
 }
});
