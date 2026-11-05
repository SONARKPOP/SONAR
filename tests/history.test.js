import test from 'node:test';
import assert from 'node:assert/strict';
import {isShortContent,modalHistory} from '../src/lib.js';
test('untagged clips are grouped with Shorts without swallowing live or unknown lengths',()=>{
 for(const durationLabel of ['1s','59s','1m','PT60S'])assert.equal(isShortContent({format:'video',durationLabel}),true);
 for(const durationLabel of ['61s','1m1s','1h','VIDEO','0s',undefined])assert.equal(isShortContent({format:'video',durationLabel}),false);
 assert.equal(isShortContent({format:'live',durationLabel:'20s'}),false);
 assert.equal(isShortContent({format:'video',liveStatus:'ended',durationLabel:'20s'}),false);
 assert.equal(isShortContent({format:'short',durationLabel:'2m30s'}),true);
});
function browser(){
 const target=new EventTarget(),stack=[{page:'collection'}];let index=0;
 const history={get state(){return stack[index]},pushState(state){stack.splice(++index);stack.push(state)},back(){if(index){index--;target.dispatchEvent(new Event('popstate'))}},get depth(){return index}};
 return {target,history};
}
test('browser Back closes video modal once and preserves the previous page state',()=>{
 const {history,target}=browser();let closed=0;
 const dispose=modalHistory(history,target,()=>closed++,'video');
 assert.equal(history.depth,1);history.back();assert.equal(closed,1);assert.deepEqual(history.state,{page:'collection'});
 dispose();assert.equal(history.depth,0);assert.equal(closed,1);
});
test('explicit dismissal removes its history entry and listener without accumulating Back steps',()=>{
 const {history,target}=browser();let closed=0;
 for(let i=0;i<3;i++){const dispose=modalHistory(history,target,()=>closed++,String(i));dispose();assert.equal(history.depth,0);}
 assert.equal(closed,0);
});
