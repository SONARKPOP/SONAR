import test from 'node:test';
import assert from 'node:assert/strict';
import {createDataClient,parseDataResponse} from '../src/data.js';
import {readFileSync,readdirSync} from 'node:fs';
import {resolve,relative} from 'node:path';
test('HTTP 200 SPA fallback HTML produces an actionable file-specific error',async()=>{
 await assert.rejects(parseDataResponse(new Response('<!doctype html><html></html>'),'groups/new.json'),error=>error.message.includes('groups/new.json')&&!error.message.includes('Unexpected token'));
});
test('embedded snapshot loads directly without depending on the page URL or network',async()=>{
 const embedded={'catalog.json':{groups:[{id:'a',contentCount:1}]},'groups/a.json':{items:[{id:'video'}]}};
 const client=createDataClient({snapshot:()=>embedded,fetcher:()=>{throw Error('network should not be used');}});
 await client.json('catalog.json');
 assert.equal((await client.json('groups/a.json')).items.length,1);
 await assert.rejects(client.json('content/missing.json'),/content\/missing.json/);
});
test('new collection-pending groups do not request unavailable empty indexes',async()=>{
 const client=createDataClient({snapshot:()=>({'catalog.json':{groups:[{id:'new',contentCount:0}]}})});
 await client.json('catalog.json');
 assert.deepEqual((await client.json('groups/new.json')).items,[]);
});
test('failed fetch can be retried and is not retained as a rejected cache entry',async()=>{
 let attempts=0;
 const client=createDataClient({snapshot:()=>undefined,fetcher:async()=>++attempts===1?new Response('<!doctype html>'):new Response('{"items":[]}')});
 await assert.rejects(client.json('groups/a.json'));
 assert.deepEqual(await client.json('groups/a.json'),{items:[]});
 assert.equal(attempts,2);
});
test('all shipped groups load from the embedded snapshot with every canonical reference present',async()=>{
 const root=resolve('public/data'),embedded={};
 function visit(directory){for(const entry of readdirSync(directory,{withFileTypes:true})){const path=resolve(directory,entry.name);if(entry.isDirectory())visit(path);else if(entry.name.endsWith('.json'))embedded[relative(root,path).replaceAll('\\','/')]=JSON.parse(readFileSync(path,'utf8'));}}
 visit(root);
 const client=createDataClient({snapshot:()=>embedded,fetcher:()=>{throw Error('network must not run');}});
 const catalog=await client.json('catalog.json');
 const indexes=await Promise.all(catalog.groups.map(g=>client.json(`groups/${g.id}.json`)));
 const ids=new Set(indexes.flatMap(index=>index.items.map(v=>v.id)));
 assert.ok(ids.size>0);
 for(const id of ids)assert.equal((await client.json(`content/${id}.json`)).id,id);
});
