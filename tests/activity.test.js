import test from 'node:test';
import assert from 'node:assert/strict';
import {groupActivity,activityDirectory,monthsAfter,filterContent} from '../src/lib.js';
const now=Date.parse('2026-11-05T12:00:00Z');
test('activity uses exact six and twelve calendar month boundaries',()=>{
 assert.equal(groupActivity({lastOfficialUploadAt:'2026-05-05T12:00:01Z'},now),'active');
 assert.equal(groupActivity({lastOfficialUploadAt:'2026-05-05T12:00:00Z'},now),'inactive');
 assert.equal(groupActivity({lastOfficialUploadAt:'2025-11-05T12:00:01Z'},now),'inactive');
 assert.equal(groupActivity({lastOfficialUploadAt:'2025-11-05T12:00:00Z'},now),'archived');
 assert.equal(groupActivity({lastOfficialUploadAt:'2026-11-04'},now),'active');
});
test('missing, invalid and future dates are unknown, not archived',()=>{
 for(const date of [undefined,null,'broken','2027-01-01'])assert.equal(groupActivity({lastOfficialUploadAt:date},now),'unknown');
});
test('month end and leap year dates clamp and archived records stay recoverable',()=>{
 assert.equal(new Date(monthsAfter('2024-02-29T12:00:00Z',12)).toISOString(),'2025-02-28T12:00:00.000Z');
 assert.equal(new Date(monthsAfter('2026-08-31T12:00:00Z',6)).toISOString(),'2027-02-28T12:00:00.000Z');
 const groups=[{id:'old',lastOfficialUploadAt:'2025-01-01'},{id:'unknown'},{id:'new',lastOfficialUploadAt:'2026-11-01'}];
 assert.deepEqual(activityDirectory(groups,false,now).map(g=>g.id),['unknown','new']);
 assert.deepEqual(activityDirectory(groups,true,now).map(g=>g.id),['old']);
 assert.equal(groups.length,3);
});
test('shorts including legacy category records appear only under Shorts across video tabs',()=>{
 const base={groupIds:['a'],title:'x',tags:[],subtypes:[],memberIds:[],channelName:'c',publishedAt:'2026-01-01',contentTypes:['own','external','music']};
 const rows=[{...base,id:'normal',format:'video',category:'own'},{...base,id:'short',format:'short',category:'own'},{...base,id:'legacy',format:'video',category:'shorts'}];
 for(const category of ['home','own','external','music'])assert.deepEqual(filterContent(rows,{category}).map(v=>v.id),['normal']);
 assert.deepEqual(filterContent(rows,{category:'shorts'}).map(v=>v.id),['short','legacy']);
 assert.deepEqual(filterContent(rows,{category:'home',format:'short'}),[]);
});
