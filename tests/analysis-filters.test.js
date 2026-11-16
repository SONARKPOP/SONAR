import test from 'node:test';
import assert from 'node:assert/strict';
import {analysisYearOptions,filterAnalysisArtists,analysisDataFiles} from '../src/analysis-filters.js';
const now=Date.parse('2026-11-17T00:00:00Z');
const artist=(id,year,state='SAILING')=>({id,name:id,debutYear:year,artistType:'group',youtubeActivity:{activity_status:state,last_upload_at:new Date(now-({SURGE:1,SAILING:2,COASTING:30,ANCHORED:100,'LOST SIGNAL':400}[state])*86400000).toISOString(),checked_at:new Date(now-3600000).toISOString(),valid_until:new Date(now+3600000).toISOString()}});
const rows=[artist('a',2020,'SURGE'),artist('b',2024,'SAILING'),artist('c',2025,'COASTING'),artist('d',2010,'ANCHORED'),artist('e',null,'LOST SIGNAL'),{...artist('solo',2008),artistType:'solo',soloDebutDate:'2023-08-01'}];
test('one-year and five-year options use artist debut, including solo debut and unknown years',()=>{
 assert.deepEqual(analysisYearOptions(rows,5).map(v=>[v.id,v.count]),[['2025',1],['2020',3],['2010',1],['unknown',1]]);
 assert.deepEqual(analysisYearOptions(rows,1).map(v=>v.id),['2025','2024','2023','2020','2010','unknown']);
});
test('year and state combine with favorites/type using AND; multiple states use OR',()=>{
 const before=JSON.stringify(rows);
 assert.deepEqual(filterAnalysisArtists(rows,{year:'2020',step:5,states:['SURGE','SAILING'],favoriteIds:['a','b','d'],kind:'group',now}).map(v=>v.id),['a','b']);
 assert.deepEqual(filterAnalysisArtists(rows,{year:'2024',step:1,now}).map(v=>v.id),['b']);
 assert.deepEqual(filterAnalysisArtists(rows,{year:'2020',step:5,kind:'solo',now}).map(v=>v.id),['solo']);
 assert.deepEqual(filterAnalysisArtists(rows,{year:'unknown',now}).map(v=>v.id),['e']);
 assert.equal(JSON.stringify(rows),before);
});
test('active states exclude stale/unknown signals and no state selection preserves all artists',()=>{
 const stale={...rows[0],id:'stale',youtubeActivity:{...rows[0].youtubeActivity,valid_until:new Date(now-1).toISOString()}};
 const unknown={id:'unknown',name:'unknown'};
 assert.deepEqual(filterAnalysisArtists([...rows,stale,unknown],{states:['ANCHORED'],now}).map(v=>v.id),['d']);
 assert.equal(filterAnalysisArtists([...rows,stale,unknown],{now}).length,8);
 assert.deepEqual(filterAnalysisArtists(rows,{favoriteIds:[],now}),[]);
});
test('unfinished analysis artifacts are never requested, activity loads only on its tab',()=>{
 assert.deepEqual(analysisDataFiles('profiles'),{});assert.deepEqual(analysisDataFiles('maps'),{});
 assert.deepEqual(analysisDataFiles('credits'),{});assert.deepEqual(analysisDataFiles('advanced'),{});
 assert.deepEqual(analysisDataFiles('activity'),{activity:'analysis-activity.json',legacy:'activity-comparison.json'});
});
