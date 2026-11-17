import test from 'node:test';
import assert from 'node:assert/strict';
import {filterContent,externalKind,commonChannels,uploadDays,uploadKind,uploadGroupSummary,ownKind} from '../src/lib.js';
const row=(id,extra={})=>({id,groupIds:['a'],category:'own',format:'video',title:'title',channelName:'channel',channelId:'c',tags:[],subtypes:[],memberIds:[],publishedAt:'2025-12-31T15:05:00Z',...extra});
test('archive year and month use KST and intersect other filters',()=>{
 const rows=[row('new'),row('old',{publishedAt:'2025-12-31T14:59:00Z'})];
 assert.deepEqual(filterContent(rows,{year:'2026',month:'01'}).map(v=>v.id),['new']);
 assert.deepEqual(filterContent(rows,{year:'2026',month:'12'}),[]);
 assert.equal(filterContent(rows,{month:'12'}).length,1);
});
test('own/external tags can overlap while broad own category intersects filters',()=>{
 const tagged=row('tagged',{category:'music',contentTypes:['own','external'],ownType:'behind'});
 assert.equal(filterContent([tagged],{category:'own',ownType:'behind'}).length,1);
 assert.equal(filterContent([tagged],{category:'external'}).length,1);
 assert.equal(filterContent([tagged],{category:'own',ownType:'daily'}).length,0);
 assert.equal(ownKind(row('vlog',{title:'브이로그'})),'daily');
});
test('live archive filters by format independently of original category',()=>{
 const rows=[row('live',{format:'live'}),row('normal')];
 assert.deepEqual(filterContent(rows,{category:'live'}).map(v=>v.id),['live']);
});
test('related Shorts overlap own and Shorts while home excludes them',()=>{
 const rows=[row('normal',{contentTypes:['own']}),row('short',{category:'shorts',format:'short',contentTypes:['own']}),row('legacy-short',{category:'own',format:'short',contentTypes:['own']})];
 assert.deepEqual(filterContent(rows,{category:'own'}).map(v=>v.id),['normal','short','legacy-short']);
 assert.deepEqual(filterContent(rows,{category:'shorts'}).map(v=>v.id),['short','legacy-short']);
 assert.equal(filterContent(rows,{category:'home'}).length,1);
});
test('upload calendar groups records by Korean publication date',()=>{
 const rows=[row('a'),row('b',{publishedAt:'2025-12-31T14:59:00Z'}),row('c')];
 const days=uploadDays(rows);
 assert.deepEqual(days.map(day=>day.date),['2026-01-01','2025-12-31']);
 assert.deepEqual(days[0].items.map(row=>row.id),['a','c']);
});
test('calendar separates live, music, content and duration-based short form',()=>{
 const rows=[row('own',{durationSeconds:180}),row('external',{durationLabel:'PT4M',category:'external',groupIds:['a','b']}),row('short',{format:'short',category:'shorts'}),row('live',{format:'live'}),row('music',{category:'music'})];
 const groups=uploadGroupSummary(rows,['a','b','empty']);
 assert.deepEqual(groups.map(g=>g.id),['a']);
 assert.deepEqual(groups[0].content.map(v=>v.id),['own','external']);
 assert.equal(groups[0].short.length,1);assert.equal(groups[0].live.length,1);
 assert.equal(uploadKind(rows[4]),'music');
 assert.equal(uploadKind(row('unknown')),null);
 assert.equal(uploadGroupSummary([row('unknown')],['a'])[0].unknown[0].id,'unknown');
 assert.equal(uploadKind(row('179',{durationSeconds:179})),'short');
 assert.equal(uploadKind(row('180',{durationSeconds:180})),'content');
 assert.equal(uploadKind(row('music-short',{category:'music',durationSeconds:60})),'music');
 assert.equal(uploadKind(row('broadcast',{category:'broadcast',durationSeconds:240})),'music');
 assert.equal(uploadKind(row('broadcast-short',{contentTabs:['broadcast'],durationSeconds:60})),'music');
 assert.equal(uploadKind(row('broadcast-live',{category:'broadcast',format:'live'})),'live');
 assert.equal(uploadGroupSummary([row('stage',{category:'broadcast',durationSeconds:240})],['a'])[0].music[0].id,'stage');
});
test('external dimensions use explicit classification first and unknown stays unclassified',()=>{
 assert.equal(externalKind(row('x',{title:'라디오 방송'})),'radio');
 assert.equal(externalKind(row('x',{title:'인터뷰',externalType:'ad'})),'ad');
 assert.equal(externalKind(row('x')),'other');
 const rows=[row('one',{category:'external',externalType:'radio',programId:'p',programName:'Show'}),row('two',{category:'external',externalType:'variety',programId:'q'})];
 assert.deepEqual(filterContent(rows,{category:'external',channel:'p',externalType:'radio'}).map(v=>v.id),['one']);
 assert.deepEqual(commonChannels(rows,['a']).map(c=>c.id).sort(),['p','q']);
});

test('radio precedence stays intact and stages remain isolated from home',()=>{
 const rows=[row('stage',{contentTabs:['home','broadcast']}),row('radio',{contentTabs:['radio'],format:'short'}),
  row('teaser',{contentTabs:['teaser','shorts'],format:'short'}),row('interview',{contentTabs:['broadcast','external']})];
 assert.deepEqual(filterContent(rows,{category:'home'}).map(v=>v.id),[]);
 assert.deepEqual(filterContent(rows,{category:'radio'}).map(v=>v.id),['radio']);
 assert.deepEqual(filterContent(rows,{category:'shorts'}).map(v=>v.id),['radio','teaser']);
 assert.deepEqual(filterContent(rows,{category:'broadcast'}).map(v=>v.id),['stage','interview']);
});
