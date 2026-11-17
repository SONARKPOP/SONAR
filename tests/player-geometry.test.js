import test from 'node:test';
import assert from 'node:assert/strict';
import {clampPlayer, initialPlayer, fitPlayer, resizePlayer} from '../src/playerGeometry.js';
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

test('mobile portrait defaults retain 9:16 media and corners can resize freely',()=>{
 for(const viewport of [{width:390,height:844},{width:320,height:568},{width:844,height:390}]){
  const rect=fitPlayer({x:8,y:8,width:900,height:900},viewport,9/16,150);
  assert.ok(Math.abs((rect.width-24)/(rect.height-150)-9/16)<0.001);
  assert.ok(rect.width<=viewport.width-16&&rect.height<=viewport.height-16);
  const smaller=resizePlayer(rect,-60,0,viewport,9/16,150);
  assert.ok(smaller.width<rect.width);
  assert.equal(smaller.height,rect.height);
  const vertical=resizePlayer(rect,0,-60,viewport,9/16,150);
  if(rect.height>220)assert.ok(vertical.height<rect.height);
 }
});

test('all four resize corners anchor the opposite corner',()=>{
 const rect={x:200,y:150,width:400,height:500},viewport={width:1000,height:1000};
 for(const corner of ['nw','ne','sw','se']){
  const next=resizePlayer(rect,20,30,viewport,9/16,150,corner);
  assert.equal(corner.includes('w')?next.x+next.width:next.x,corner.includes('w')?rect.x+rect.width:rect.x);
  assert.equal(corner.includes('n')?next.y+next.height:next.y,corner.includes('n')?rect.y+rect.height:rect.y);
 }
});
