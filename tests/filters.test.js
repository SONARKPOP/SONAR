import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {filterContent,dedupe,commonChannels,activeLives,loadSaved,PAGE_SIZE,monthKey,groupPreferences} from '../src/lib.js';
const row=(id,groups,extra={})=>({id,groupIds:groups,title:id,channelName:'Studio',tags:['MV'],category:'music',memberIds:[],subtypes:['MV'],format:'video',channelId:'studio',publishedAt:'2026-11-05',...extra});
test('groups use OR; other dimensions use AND',()=>{
 const rows=[row('a',['aespa']),row('b',['ive']),row('c',['aespa','ive'],{category:'own'}),row('d',['twice'])];
 assert.deepEqual(filterContent(rows,{groups:['aespa','ive'],category:'music',query:'mv',subtype:'MV',format:'video'}).map(x=>x.id),['a','b']);
 assert.equal(filterContent(rows,{groups:['aespa'],member:'unknown'}).length,0);
});
test('shared content is returned once',()=>assert.equal(dedupe([row('shared',['aespa','ive']),row('shared',['aespa','ive'])]).length,1));
test('common appearance channels precede single-group channels',()=>{
 const rows=[row('a',['aespa','ive'],{category:'external'}),row('b',['ive'],{category:'external',channelId:'other'})];
 assert.equal(commonChannels(rows,['aespa','ive'])[0].id,'studio');
 assert.equal(commonChannels([rows[0],rows[0]],['aespa','ive'])[0].count,1);
});
test('live gate excludes external, ended, sample and stale streams',()=>{
 const start='2026-11-05T00:00:00Z',now=Date.parse(start);
 const v={id:'a',channelId:'official',groupIds:['aespa'],liveStatus:'live',actualStartTime:start};
 const channels=[{id:'official',official:true,groupIds:['aespa']}];
 const feed={updatedAt:start,items:[v,{...v,actualEndTime:start},{...v,demo:true},{...v,channelId:'external'},{...v,groupIds:['ive']}]};
 assert.equal(activeLives(feed,channels,now).length,1);
 assert.equal(activeLives(feed,channels,now+31*60000).length,0);
 assert.equal(activeLives({...feed,updatedAt:'invalid'},channels,now).length,0);
});
test('corrupt/blocked local storage falls back',()=>{
 assert.deepEqual(loadSaved({getItem:()=>'{broken'},'k',['aespa']),['aespa']);
 assert.deepEqual(loadSaved({getItem:()=>{throw Error('blocked');}},'k',[]),[]);
});
test('KST schedule month includes UTC previous-month boundary',()=>{
 assert.equal(monthKey('2026-10-31T23:30:00Z'),'2026-11');
});
test('all shipped group indexes resolve to a unique canonical record',()=>{
 const data=new URL('../public/data/',import.meta.url);
 for(const name of readdirSync(new URL('groups/',data))){
  const index=JSON.parse(readFileSync(new URL(`groups/${name}`,data),'utf8'));
  assert.equal(dedupe(index.items).length,index.items.length);
  for(const v of index.items){const canonical=JSON.parse(readFileSync(new URL(`content/${v.id}.json`,data),'utf8'));assert.equal(canonical.id,v.id);assert.ok(v.groupIds.includes(name.slice(0,-5)));}
 }
});
test('sample selection has more than one full page and canonical records are platform keyed',()=>{
 const data=new URL('../public/data/',import.meta.url);
 const records=JSON.parse(readFileSync(new URL('latest.json',data),'utf8')).items;
 const catalog=JSON.parse(readFileSync(new URL('catalog.json',data),'utf8'));
 assert.ok(PAGE_SIZE>=20&&PAGE_SIZE<=30);
 assert.ok(records.slice(0,PAGE_SIZE).length<=PAGE_SIZE);
 for(const v of records)assert.equal(v.id,`${v.platform}__${v.platformId}`);
});
test('defaults come from catalog; saved and explicitly empty selections survive',()=>{
 const catalog={groups:[{id:'rescene'},{id:'uspeer'},{id:'added-later'}],defaultGroupIds:['added-later','missing']};
 assert.deepEqual(groupPreferences({getItem:()=>null},catalog),{saved:['added-later'],selected:['added-later']});
 const storage={getItem:key=>key==='sonar.groups.v2'?JSON.stringify(['rescene','missing']):key==='sonar.selected.v2'?JSON.stringify(['rescene','uspeer','missing']):null};
 assert.deepEqual(groupPreferences(storage,catalog),{saved:['rescene'],selected:['rescene']});
 const wide={getItem:key=>key==='sonar.view-checked.v1'?'["rescene","uspeer"]':storage.getItem(key)};
 assert.deepEqual(groupPreferences(wide,catalog),{saved:['rescene'],selected:['rescene','uspeer']});
 assert.deepEqual(groupPreferences({getItem:()=>JSON.stringify([])},catalog),{saved:[],selected:[]});
 assert.deepEqual(groupPreferences({getItem:()=>{throw Error('denied');}},catalog),{saved:['added-later'],selected:['added-later']});
});
