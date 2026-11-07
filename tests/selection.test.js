import test from 'node:test';
import assert from 'node:assert/strict';
import {selectionReducer,listedGroupPreferences,favoriteGroupSelection,favoritePresetPreferences,excludedGroupPreferences,withoutExcludedGroups,prioritizeGroups,allGroupSelection,sortGroups,updateGroupMembership} from '../src/lib.js';

test('immediate membership changes preserve other group choices without a separate apply step',()=>{
 const added=updateGroupMembership(['a','b'],['b'],['c'],true);
 assert.deepEqual(added,{saved:['a','b','c'],selected:['b','c']});
 const removed=updateGroupMembership(added.saved,added.selected,['b'],false);
 assert.deepEqual(removed,{saved:['a','c'],selected:['c']});
 const bulk=updateGroupMembership(removed.saved,removed.selected,['c'],false);
 assert.deepEqual(bulk,{saved:['a'],selected:[]});
});

test('group sorting supports debut year and alphabet with unknown years always last',()=>{
 const rows=[{id:'c',name:'charlie',debutYear:2025},{id:'u',name:'Alpha'},{id:'b',name:'Bravo',debutYear:2024},{id:'a',name:'Alpha',debutYear:2025}];
 assert.deepEqual(sortGroups(rows,'debut-asc').map(g=>g.id),['b','a','c','u']);
 assert.deepEqual(sortGroups(rows,'debut-desc').map(g=>g.id),['a','c','b','u']);
 assert.deepEqual(sortGroups(rows,'az').map(g=>g.id),['a','u','b','c']);
 assert.equal(rows[0].id,'c');
});

test('all selection adds available groups but clearing checks preserves the saved list',()=>{
 const enabled=allGroupSelection(['excluded','a'],['a','b'],false);
 assert.deepEqual(enabled,{saved:['excluded','a','b'],selected:['a','b']});
 const cleared=allGroupSelection(enabled.saved,['a','b'],true);
 assert.deepEqual(cleared,{saved:['excluded','a','b'],selected:[]});
});

test('preset priority keeps all groups and preserves ordering within each section',()=>{
 const groups=['a','b','c','d'].map(id=>({id}));
 assert.deepEqual(prioritizeGroups(groups,['d','b']).map(g=>g.id),['b','d','a','c']);
 assert.deepEqual(prioritizeGroups(groups,[]),groups);
 assert.deepEqual(groups.map(g=>g.id),['a','b','c','d']);
});

test('excluded groups persist safely and collaborative records cannot leak through allowed groups',()=>{
 const catalog={groups:[{id:'a'},{id:'b'}]};
 assert.deepEqual(excludedGroupPreferences({getItem:()=>'["b","b","gone"]'},catalog),['b']);
 assert.deepEqual(excludedGroupPreferences({getItem:()=>{throw Error();}},catalog),[]);
 const rows=[{groupIds:['a']},{groupIds:['a','b']},{groupIds:['b']}];
 assert.deepEqual(withoutExcludedGroups(rows,['b']),[rows[0]]);
 assert.deepEqual(withoutExcludedGroups(rows,[]),rows);
});

test('three independent presets migrate legacy favorites to star and preserve empty presets',()=>{
 const catalog={groups:[{id:'a'},{id:'b'}]};
 const old={getItem:key=>key==='sonar.favorite-groups.v1'?'["a"]':null};
 assert.deepEqual(favoritePresetPreferences(old,catalog),{presets:{heart:[],star:['a'],clover:[]},active:'star'});
 const values={'sonar.favorite-presets.v1':'{"heart":["b","b","gone"],"star":[],"clover":["a"]}','sonar.favorite-preset-active.v1':'heart','sonar.favorite-groups.v1':'["a"]'};
 assert.deepEqual(favoritePresetPreferences({getItem:key=>values[key]??null},catalog),{presets:{heart:['b'],star:[],clover:['a']},active:'heart'});
});

test('checkbox and preset changes preserve listed groups until explicitly removed',()=>{
 let state={selected:['rescene'],listed:['rescene']};
 state=selectionReducer(state,{type:'change',ids:['rescene','kiiikiii','uspeer']});
 const listed=['rescene','kiiikiii','uspeer'];
 assert.deepEqual(state,{selected:listed,listed});
 state=selectionReducer(state,{type:'toggle',id:'kiiikiii'});
 assert.deepEqual(state,{selected:['rescene','uspeer'],listed});
 state=selectionReducer(state,{type:'change',ids:[]});
 assert.deepEqual(state,{selected:[],listed});
 assert.deepEqual(selectionReducer(state,{type:'toggle',id:'rescene'}),{selected:['rescene'],listed});
 const removed=selectionReducer(state,{type:'unlist',ids:['kiiikiii']});
 assert.deepEqual(removed,{selected:[],listed:['rescene','uspeer']});
 assert.deepEqual(selectionReducer(removed,{type:'restore',ids:['kiiikiii'],previous:[],previousListed:listed}),state);
});
test('selection list is restored independently of checked videos and drops unsaved IDs',()=>{
 const saved=['rescene','kiiikiii'];
 const selected=['rescene'];
 assert.deepEqual(listedGroupPreferences({getItem:()=>null},saved,selected),selected);
 const storage={getItem:()=>JSON.stringify(['kiiikiii','removed'])};
 const listed=listedGroupPreferences(storage,saved,selected);
 assert.deepEqual(selectionReducer({},{type:'hydrate',selected,listed}),{selected,listed:['kiiikiii','rescene']});
});
test('saved favorites ignore selection and obsolete previous-selection records',()=>{
 const catalog={groups:[{id:'rescene'},{id:'uspeer'}]};
 const values={'sonar.favorite-groups.v1':'["uspeer","removed","uspeer"]','sonar.selected.v2':'["rescene"]','sonar.previous-selected.v1':'["rescene"]'};
 const storage={getItem:key=>values[key]??null};
 assert.deepEqual(favoriteGroupSelection(storage,catalog),['uspeer']);
 const current=selectionReducer({selected:['rescene']},{type:'change',ids:[]});
 assert.deepEqual(favoriteGroupSelection(storage,catalog),['uspeer']);
 assert.deepEqual(selectionReducer(current,{type:'change',ids:favoriteGroupSelection(storage,catalog)}),{selected:['uspeer'],listed:['rescene','uspeer']});
 assert.equal(values['sonar.favorite-groups.v1'],'["uspeer","removed","uspeer"]');
});
test('new or invalid favorite storage stays empty instead of adopting defaults or history',()=>{
 const catalog={groups:[{id:'rescene'}],defaultGroupIds:['rescene']};
 assert.deepEqual(favoriteGroupSelection({getItem:()=>null},catalog),[]);
 assert.deepEqual(favoriteGroupSelection({getItem:()=>'broken'},catalog),[]);
 assert.deepEqual(favoriteGroupSelection({getItem:()=>{throw Error('blocked');}},catalog),[]);
 assert.deepEqual(favoriteGroupSelection({getItem:()=>JSON.stringify([])},catalog),[]);
});
