import test from 'node:test';
import assert from 'node:assert/strict';
import {careerTagsFor,directoryResults,koreanArtistName,matchesArtistName,matchesDirectoryScope,DIRECTORY_ACTIVITY_STATES} from '../src/directory.js';
const groups=[{id:'weeekly',name:'Weeekly',aliases:[],gender:'girl',debutYear:2020,lastOfficialUploadAt:'2024-01-01'}, {id:'lunedi',name:'LUNEDI',aliases:['Monday'],artistType:'solo',gender:'girl',debutYear:2025,relatedGroupIds:['weeekly'],previousGroupIds:['weeekly'],lastOfficialUploadAt:'2026-11-01'}, {id:'boy',name:'Boy group',aliases:[],gender:'boy',debutYear:2022,lastOfficialUploadAt:'2026-11-01'}];
test('directory separates archive but name search overrides type, year and default visibility',()=>{
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
test('directory scopes separate confirmed legacy groups from upload age at 90 days',()=>{
 const now=Date.parse('2026-11-07T00:00:00Z');
 const upload=days=>({lastOfficialUploadAt:new Date(now-days*86400000).toISOString()});
 assert(matchesDirectoryScope(upload(89),'recent',now));
 assert(!matchesDirectoryScope(upload(90),'recent',now));
 assert(matchesDirectoryScope(upload(90),'dormant',now));
 assert(matchesDirectoryScope(upload(800),'dormant',now));
 assert(!matchesDirectoryScope(upload(800),'legacy',now));
 for(const groupStatus of ['hiatus','disbanded']){
  const artist={...upload(800),groupStatus};
  assert(matchesDirectoryScope(artist,'legacy',now));
  assert(matchesDirectoryScope(artist,'all',now));
  assert(!matchesDirectoryScope(artist,'dormant',now));
 }
 assert(matchesDirectoryScope({},'all',now));
 assert(!matchesDirectoryScope({},'recent',now));
});
test('an explicit type or year selection can narrow a name search',()=>{
 const opts={query:'weeekly',narrowSearch:true,status:'all'};
 assert.deepEqual(directoryResults(groups,{...opts,type:'duo-solo'}).map(g=>g.id),['lunedi']);
 assert.deepEqual(directoryResults(groups,{...opts,year:'2020'}).map(g=>g.id),['weeekly']);
});
test('names display a distinct Korean label and match names and aliases in either language',()=>{
 const artist={name:'Hearts2Hearts',nameKo:'하츠투하츠',aliases:['하투하','H2H']};
 assert.equal(koreanArtistName(artist),'하츠투하츠');
 assert.equal(koreanArtistName({name:'리센느',aliases:['리센느','RESCENE']}),'');
 assert.equal(koreanArtistName({name:'RESCENE',aliases:['RESCENE','리센느']}),'리센느');
 for(const query of ['하츠 투 하츠','HEARTS 2 HEARTS','하투하','h2h'])assert(matchesArtistName(artist,query));
 assert(!matchesArtistName(artist,'하투하츠'));
});
test('the five directory filters agree with the live activity icon, without guessing missing states',()=>{
 const now=Date.parse('2026-11-07T00:00:00Z'),date=days=>new Date(now-days*86400000).toISOString();
 const artists=DIRECTORY_ACTIVITY_STATES.map((state,index)=>({id:state,name:state,gender:'girl',debutYear:2024,
  youtubeActivity:{activity_status:state,checked_at:date(0),last_upload_at:date([0,1,20,120,380][index])}}));
 const stale={id:'stale',name:'Stale',youtubeActivity:{...artists[0].youtubeActivity,checked_at:date(2)}};
 artists.push(stale,{id:'legacy',name:'Legacy',lastOfficialUploadAt:date(400)});
 for(const status of DIRECTORY_ACTIVITY_STATES)assert.deepEqual(directoryResults(artists,{now,status}).map(g=>g.id),[status]);
 assert.deepEqual(directoryResults(artists,{now,query:'signal',status:'LOST SIGNAL'}).map(g=>g.id),['LOST SIGNAL']);
 assert.deepEqual(directoryResults(artists,{now,query:'signal',status:'SAILING'}),[]);
 assert.deepEqual(directoryResults(artists,{now,status:'unknown'}).map(g=>g.id),['legacy','stale']);
});
