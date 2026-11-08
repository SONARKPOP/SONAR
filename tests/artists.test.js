import test from 'node:test';
import assert from 'node:assert/strict';
import {artistCategory,artistsInCategory,recommendedArtists,excludedArtistIds,enabledArtistTypePreferences,toggleArtistType,visibleArtistIds,debutYearRanges,artistsInDebutRange} from '../src/lib.js';
const artists=[{id:'girl',name:'Girl',gender:'girl',contentCount:4},{id:'boy',name:'Boy',gender:'boy',contentCount:0},{id:'mixed',name:'Mixed',gender:'mixed'},{id:'duo',name:'Duo',gender:'mixed',artistType:'duo'},{id:'solo',name:'Solo',gender:'girl',artistType:'solo'}];
test('mixed duos appear as groups and solo remains a separate tab',()=>{
 assert.equal(artistCategory(artists[3]),'mixed');
 assert.deepEqual(artistsInCategory(artists,'girl').map(a=>a.id),['girl']);
 assert.deepEqual(artistsInCategory(artists,'mixed').map(a=>a.id),['mixed','duo']);
 assert.equal(artistsInCategory(artists,'duo-solo').length,1);
 assert.equal(artistsInCategory(artists,'all').length,5);
});
test('suggestions omit saved or blocked artists and honor current category',()=>{
 assert.equal(recommendedArtists(artists,[],[])[0].id,'girl');
 assert.deepEqual(recommendedArtists(artists,['duo'],['solo'],'duo-solo'),[]);
 assert.deepEqual(recommendedArtists(artists,[],[],'boy').map(a=>a.id),['boy']);
 assert.equal(recommendedArtists(artists,[],[],'all',2).length,2);
});
test('category block, individual block and allow exceptions remain independent',()=>{
 assert.deepEqual(excludedArtistIds(artists,[],['girl'],[]),['girl']);
 assert.deepEqual(excludedArtistIds(artists,[],['girl'],['girl']),[]);
 assert.deepEqual(excludedArtistIds(artists,['girl'],['girl'],['girl']),[]);
 assert.deepEqual(excludedArtistIds(artists,['boy'],[],['girl']),['boy']);
 assert.deepEqual(excludedArtistIds([...artists,{id:'new',name:'New',gender:'girl'}],[],['girl'],['girl']),['new']);
 assert.deepEqual(excludedArtistIds(artists,[],['duo-solo'],['solo']),[]);
});
test('favorite groups always override individual and category bans',()=>{
 assert.deepEqual(excludedArtistIds(artists,['girl','boy'],['girl','boy'],[],['girl']),['boy']);
 assert.deepEqual(excludedArtistIds(artists,['girl'],['girl'],[],['girl']),[]);
 assert.deepEqual(excludedArtistIds(artists,['girl'],['girl'],[],[]),['girl']);
});
test('display type toggles allow multiple types and cannot turn off the last one',()=>{
 assert.deepEqual(toggleArtistType(['girl'],'girl'),['girl']);
 assert.deepEqual(toggleArtistType(['girl'],'mixed'),['girl','mixed']);
 assert.deepEqual(toggleArtistType(['girl','mixed'],'girl'),['mixed']);
 assert.equal(enabledArtistTypePreferences({getItem:()=>'[]'}).length,3);
 assert.deepEqual(enabledArtistTypePreferences({getItem:()=>'["boy","invalid"]'}),['girl','mixed','duo-solo']);
});
test('type visibility gates checked groups while leaving original saved selection untouched',()=>{
 const raw=['girl','boy','mixed','duo','solo'];
 assert.deepEqual(visibleArtistIds(artists,raw,['girl','boy']),['girl','boy']);
 assert.deepEqual(visibleArtistIds(artists,raw,['duo-solo']),['solo']);
 assert.deepEqual(visibleArtistIds(artists,raw,['girl','boy'],['boy']),['girl']);
 assert.deepEqual(raw,['girl','boy','mixed','duo','solo']);
});
test('five-year debut buttons honor exact boundaries and isolate unconfirmed years',()=>{
 const rows=[{id:'a',debutYear:2008},{id:'b',debutYear:2020},{id:'c',debutYear:2024},{id:'d',debutYear:2025},{id:'unknown'}];
 assert.deepEqual(debutYearRanges(rows).map(r=>r.label),['2005–2009','2020–2024','2025–2029']);
 assert.deepEqual(artistsInDebutRange(rows,'2020').map(a=>a.id),['b','c']);
 assert.deepEqual(artistsInDebutRange(rows,'2025').map(a=>a.id),['d']);
 assert.deepEqual(artistsInDebutRange(rows,'unknown').map(a=>a.id),['unknown']);
 assert.equal(artistsInDebutRange(rows,'all').length,5);
});
