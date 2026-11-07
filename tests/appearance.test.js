import test from 'node:test';
import assert from 'node:assert/strict';
import {favoriteColorPreferences,favoriteCardStyle,themePreference} from '../src/lib.js';
test('group colors are distinct and stored valid choices survive',()=>{
 const catalog={groups:Array.from({length:19},(_,i)=>({id:`g${i}`}))};
 const colors=favoriteColorPreferences({getItem:()=>null},catalog);
 assert.equal(new Set(Object.values(colors)).size,19);
 const saved=favoriteColorPreferences({getItem:()=>'{"g0":"#ff0000","g1":"bad"}'},catalog);
 assert.equal(saved.g0,'#ff0000');assert.equal(saved.g1,colors.g1);
});
test('only favorites tint cards and saturated choices remain subtle in both themes',()=>{
 assert.equal(favoriteCardStyle(['a'],[],{a:'#ff0000'},'light'),undefined);
 const light=favoriteCardStyle(['a'],['a'],{a:'#ff0000'},'light');
 assert.equal(light.backgroundColor,'rgb(255, 217, 217)');
 assert.equal(light.borderColor,'rgb(255, 158, 158)');
 assert.match(light.boxShadow,/inset 0 4px 0/);
 const dark=favoriteCardStyle(['a'],['a'],{a:'#ff0000'},'dark');
 assert.equal(dark.backgroundColor,'rgb(69, 29, 42)');
 assert.match(dark.boxShadow,/inset 0 4px 0/);
});
test('theme respects saved preference then system and handles blocked storage',()=>{
 assert.equal(themePreference({getItem:()=>'light'},true),'light');
 assert.equal(themePreference({getItem:()=>null},true),'dark');
 assert.equal(themePreference({getItem:()=>{throw Error();}},false),'light');
});
