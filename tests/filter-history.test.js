import test from 'node:test';
import assert from 'node:assert/strict';
import {createFilterHistory} from '../src/filter-history.js';
import {modalHistory} from '../src/lib.js';
test('Back and Forward restore filters without creating another history entry',()=>{
 const target=new EventTarget(),stack=[{other:'keep'}];let i=0,restored;
 const history={get state(){return stack[i]},replaceState(s){stack[i]=s},pushState(s){stack.splice(++i);stack.push(s)},back(){i--;target.dispatchEvent(new Event('popstate'))},forward(){i++;target.dispatchEvent(new Event('popstate'))}};
 const control=createFilterHistory(history,target,{category:'home',query:''},s=>restored=s);
 control.record({category:'home',query:'aespa'});
 control.record({category:'home',query:'aespa live'},true);
 control.record({category:'music',query:'aespa'});
 history.back();assert.equal(restored.category,'home');
 control.record(restored);assert.equal(stack.length,3);
 history.back();assert.equal(restored.query,'');assert.equal(history.state.other,'keep');
 history.forward();assert.equal(restored.query,'aespa live');
 control.dispose();
});
test('closing a player after filtering preserves the current filter and removes its modal marker',()=>{
 const target=new EventTarget(),stack=[{}];let i=0,restored;
 const history={get state(){return stack[i]},replaceState(s){stack[i]=s},pushState(s){stack.splice(++i);stack.push(s)},back(){i--;target.dispatchEvent(new Event('popstate'))}};
 const filters=createFilterHistory(history,target,{query:''},s=>restored=s);
 const close=modalHistory(history,target,()=>{},'player');
 filters.record({query:'IVE'});close();
 assert.equal(history.state.sonarFilters.query,'IVE');assert.equal(history.state.sonarVideoModal,undefined);
 history.back();assert.equal(restored.query,'');filters.dispose();
});
