import test from 'node:test';
import assert from 'node:assert/strict';
import {careerTagsFor,directoryResults} from '../src/directory.js';
const groups=[{id:'weeekly',name:'Weeekly',aliases:[],gender:'girl',debutYear:2020,lastOfficialUploadAt:'2024-01-01'}, {id:'lunedi',name:'LUNEDI',aliases:['Monday'],artistType:'solo',gender:'girl',debutYear:2025,relatedGroupIds:['weeekly'],previousGroupIds:['weeekly'],lastOfficialUploadAt:'2026-11-01'}, {id:'boy',name:'Boy group',aliases:[],gender:'boy',debutYear:2022,lastOfficialUploadAt:'2026-11-01'}];
test('directory separates archive but searching overrides type, year and activity filters',()=>{
 const opts={now:Date.parse('2026-11-06'),type:'girl',year:'2005-2009'};
 assert.deepEqual(directoryResults(groups,{...opts,query:'Boy group'}).map(g=>g.id),['boy']);
 assert.deepEqual(directoryResults(groups,{now:opts.now,status:'archived'}).map(g=>g.id),['weeekly']);
 assert(!directoryResults(groups,{now:opts.now}).some(g=>g.id==='weeekly'));
});
test('career tags show solo and previous group once; parent-name search finds solo',()=>{
 assert.deepEqual(careerTagsFor(groups[1],groups).map(t=>t.label),['솔로','Weeekly 출신']);
 assert.deepEqual(directoryResults(groups,{query:'weeekly'}).map(g=>g.id).sort(),['lunedi','weeekly']);
 assert.deepEqual(careerTagsFor({previousGroupIds:['weeekly']},groups).map(t=>t.label),['재데뷔','Weeekly 출신']);
});
