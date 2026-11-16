import test from 'node:test';
import assert from 'node:assert/strict';
import {zoomMap,panMap,pinchMap} from '../src/map-gestures.js';
import {nationalityView} from '../src/person-directory.js';
import {resolveBirthplace,geographyLabel} from '../src/birthplace-data.js';
test('wheel zoom preserves the geographic point below the pointer',()=>{
 const initial={zoom:2,pan:[10,-5]},point=[600,200],next=zoomMap(initial,3,point);
 const base=point.map((n,i)=>(n-[480,250][i]-initial.pan[i])/initial.zoom);
 const rendered=base.map((n,i)=>[480,250][i]+next.pan[i]+n*next.zoom);
 assert.deepEqual(rendered,point);assert.equal(next.zoom,3);
});
test('pinch scales at its initial center and follows two-finger movement',()=>{
 const next=pinchMap({zoom:1,pan:[0,0]},[480,250],[500,260],100,200);assert.deepEqual(next,{zoom:2,pan:[20,10]});
 assert.equal(zoomMap({zoom:1,pan:[0,0]},100).zoom,6);assert.equal(zoomMap({zoom:2,pan:[0,0]},0).zoom,1);
 assert.ok(panMap({zoom:1,pan:[0,0]},[10000,10000]).pan[0]<10000);
});
test('conventional Taiwan/China labels keep separate country identities and raw strings intact',()=>{
 assert.equal(nationalityView('중화민국').code,'TW');assert.equal(nationalityView({code:'TW',name:'중화민국'}).name,'대만');assert.equal(nationalityView('중화인민공화국').name,'중국');
 assert.equal(resolveBirthplace({birthPlace:'중화민국 타이베이시'}).countryCode,'TW');assert.equal(resolveBirthplace({birthPlace:'중화인민공화국 베이징시'}).countryCode,'CN');assert.equal(geographyLabel('중화민국 타이베이'),'대만 타이베이');
});
