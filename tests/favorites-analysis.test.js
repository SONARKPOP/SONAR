import test from 'node:test';
import assert from 'node:assert/strict';
import {hardBlockContent,softBlockContent,favoriteContent,agencyHistory,comparisonRows,uniquePeople,fullAge,groupDemographics,browsingArtistIds,visibleLiveRows,favoriteArtistIds} from '../src/artist-insights.js';
test('hard block suppresses favorite co-stars and individual appearances',()=>{
 const rows=[{id:'a',groupIds:['favorite','blocked']},{id:'b',groupIds:['favorite'],memberIds:['person']},{id:'c',groupIds:['favorite']},{id:'d',individualActivity:{artistId:'solo',memberIds:['person']}}];
 assert.deepEqual(hardBlockContent(rows,['blocked','person']).map(v=>v.id),['c']);
});
test('agency history only accepts sourced records and never invents dates',()=>{
 assert.deepEqual(agencyHistory({agencyHistory:[{name:'A',status:'current',sourceUrl:'https://a.example/profile'},{name:'B',status:'former',sourceUrl:'javascript:bad'},{name:'C'}]}),[{name:'A',status:'current',sourceUrl:'https://a.example/profile'}]);
});
test('personal directory merges using stable IDs, never display names',()=>{
 assert.equal(uniquePeople({members:[{id:'a',name:'same'}],solos:[{id:'a'},{id:'b',name:'same'}]}).length,2);
});
test('comparison keeps unknown official counts unknown and inferred separate',()=>{
 const data={generatedAt:new Date().toISOString(),artists:[{artistId:'g',officialUploads:{canCompare:false,counts:{uploads_7d:9}},externalAppearances:{confirmedCounts:{uploads_7d:2},inferredCounts:{uploads_7d:3}}}]};
 const [row]=comparisonRows(data,[{id:'g',name:'G'}],'uploads_7d');
 assert.equal(row.official,null);assert.equal(row.confirmed,2);assert.equal(row.inferred,3);
});
test('soft exclusion permits favorite co-stars but hard block takes precedence',()=>{
 const rows=[{id:'a',groupIds:['blocked','favorite']},{id:'b',groupIds:['blocked','other']},{id:'c',groupIds:['other']}];
 assert.deepEqual(softBlockContent(rows,['blocked'],['favorite']).map(v=>v.id),['a','c']);
 assert.deepEqual(softBlockContent(hardBlockContent(rows,['blocked']),['blocked'],['favorite']).map(v=>v.id),['c']);
});
test('personal favorites do not leak every other member of the parent group',()=>{
 const rows=[{id:'a',groupIds:['group'],memberIds:['person']},{id:'b',groupIds:['group'],memberIds:['other']}];
 assert.deepEqual(favoriteContent(rows,['person'],{groups:[{id:'group'}]}).map(v=>v.id),['a']);
});
test('expired official snapshot cannot appear as a current comparison',()=>{
 const data={generatedAt:'2026-01-01T00:00:00Z',artists:[{artistId:'g',officialUploads:{canCompare:true,checkedAt:'2026-01-01T00:00:00Z',counts:{uploads_7d:5}},externalAppearances:{confirmedCounts:{uploads_7d:2}}}]};
 assert.equal(comparisonRows(data,[{id:'g'}],'uploads_7d',Date.parse('2026-01-01T12:00:00Z'))[0].official,5);
 assert.equal(comparisonRows(data,[{id:'g'}],'uploads_7d',Date.parse('2026-01-03T12:00:00Z'))[0].official,null);
 assert.equal(comparisonRows(data,[{id:'g'}],'uploads_7d',Date.parse('2026-01-03T12:00:00Z'))[0].confirmed,null);
});
test('demographics require exact dates and label partial current-member coverage',()=>{
 assert.equal(fullAge('2000-11-16','2026-11-15'),25);
 assert.equal(fullAge('2000-11-15','2026-11-15'),26);
 assert.equal(fullAge('2000','2026-11-15'),null);
 assert.equal(fullAge('2000-02-31','2026-11-15'),null);
 const group={id:'g',name:'Group',debutDate:'2020-11-15',memberRoster:{current:['A','B'],former:['C']}};
 const people=[{id:'a',aliases:['A'],birthDate:'2000-11-15',memberships:[{groupId:'g',status:'current'}]},{id:'b',aliases:['B'],memberships:[{groupId:'g',status:'current'}]},{id:'c',aliases:['C'],birthDate:'1990-01-01',memberships:[{groupId:'g',status:'former'}]}];
 const row=groupDemographics([group],people,'2026-11-15')[0];
 assert.equal(row.knownBirthDates,1);assert.equal(row.currentMembers,2);assert.equal(row.meanCurrentAge,26);assert.equal(row.meanDebutAge,null);
});
test('favorites share one scope policy without removing temporarily muted groups',()=>{
 const catalog={groups:[{id:'a',gender:'girl'},{id:'b',gender:'girl'},{id:'c',gender:'mixed'}],members:[{id:'person',groupId:'a'}]};
 assert.deepEqual(favoriteArtistIds(catalog,['person']),['a']);
 const policy={types:['girl','mixed'],favoriteIds:['person','b'],favoritesOnly:true,muted:['b']};
 assert.deepEqual(browsingArtistIds(catalog,policy),['a']);
 assert.deepEqual(browsingArtistIds(catalog,{...policy,muted:[]}),['a','b']);
 assert.deepEqual(policy.favoriteIds,['person','b']);
});
test('LIVE NOW follows enabled types independently of favorite filters and shares hard blocks',()=>{
 const catalog={groups:[{id:'a',gender:'girl'},{id:'b',gender:'mixed'}]};
 const lives=[{id:'a',groupIds:['a']},{id:'b',groupIds:['b']},{id:'joint',groupIds:['a','b']}];
 assert.deepEqual(visibleLiveRows(lives,catalog,{types:['girl'],favorites:[]}).map(v=>v.id),['a','joint']);
 assert.deepEqual(visibleLiveRows(lives,catalog,{types:['girl'],favorites:['a'],hardBlocked:['b']}).map(v=>v.id),['a']);
});
test('active browsing includes ANCHORED and excludes LOST SIGNAL',()=>{
 const now=Date.parse('2026-11-15T12:00:00Z'),snapshot=(days,state)=>({activity_status:state,checked_at:new Date(now).toISOString(),last_upload_at:new Date(now-days*86400000).toISOString(),valid_until:new Date(now+86400000).toISOString(),uploads:[]});
 const catalog={groups:[{id:'anchor',gender:'girl',youtubeActivity:snapshot(100,'ANCHORED')},{id:'lost',gender:'girl',youtubeActivity:snapshot(400,'LOST SIGNAL')}]};
 assert.deepEqual(browsingArtistIds(catalog,{types:['girl'],activeOnly:true,now}),['anchor']);
});
test('soft group ban retains only a separately favorited member appearance',()=>{
 const rows=[{id:'favorite-person',groupIds:['g'],memberIds:['person-a']},{id:'other-person',groupIds:['g'],memberIds:['person-b']}];
 assert.deepEqual(softBlockContent(rows,['g'],['person-a']).map(row=>row.id),['favorite-person']);
 assert.deepEqual(hardBlockContent(rows,['g']).map(row=>row.id),[]);
});
