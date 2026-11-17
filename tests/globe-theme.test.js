import test from 'node:test';
import assert from 'node:assert/strict';
import {applyGlobeTheme,globeFillColor,globeLineColor,globePalette,observeGlobeTheme} from '../src/globe-theme.js';

test('theme paints all administrative levels without changing viewport, data or counts',()=>{
 const paints=new Map(),map={getLayer:()=>true,setPaintProperty:(id,key,value)=>paints.set(id+':'+key,value)};
 for(const theme of ['light','dark','light']){
  applyGlobeTheme(map,theme);
  assert.equal(paints.get('ocean:background-color'),globePalette(theme).ocean);
  assert.equal(paints.size,9);
  for(let level=0;level<=3;level++){
   assert.deepEqual(paints.get('regions-'+level+':fill-color'),globeFillColor(theme));
   assert.deepEqual(paints.get('outlines-'+level+':line-color'),globeLineColor(theme));
  }
 }
 assert.notEqual(globePalette('light').ocean,globePalette('dark').ocean);
 assert.deepEqual(globeFillColor('light').filter(x=>typeof x==='number'),globeFillColor('dark').filter(x=>typeof x==='number'));
 assert.doesNotThrow(()=>applyGlobeTheme({getLayer:()=>false},'dark'));
});

test('saved dark theme and subsequent site toggles propagate, with observer cleanup',()=>{
 let theme='dark',notify,options,disconnected=false;const seen=[],root={getAttribute:()=>theme};
 class Observer{constructor(callback){notify=callback;}observe(target,value){assert.equal(target,root);options=value;}disconnect(){disconnected=true;}}
 const stop=observeGlobeTheme(root,value=>seen.push(value),Observer);
 assert.deepEqual(seen,['dark']);assert.deepEqual(options,{attributes:true,attributeFilter:['data-theme']});
 theme='light';notify();theme='dark';notify();assert.deepEqual(seen,['dark','light','dark']);
 stop();assert.equal(disconnected,true);
});
