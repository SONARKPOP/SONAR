import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToString} from 'react-dom/server';
import {createServer} from 'vite';
import {workspaceTranslations} from '../src/workspace-translations.js';
import {favoritePresetPreferences,favoriteColorPreferences} from '../src/lib.js';
test('four-language dictionary is complete and personal favorite IDs survive reload',()=>{
 for(const [key,values] of Object.entries(workspaceTranslations)){assert.equal(values.length,3,key);assert.ok(values.every(v=>typeof v==='string'&&v.length),key);}
 const store={getItem:key=>key==='sonar.favorite-presets.v1'?JSON.stringify({heart:['person','g','invalid'],star:[],clover:[]}):null};
 assert.deepEqual(favoritePresetPreferences(store,{groups:[{id:'g'}],members:[{id:'person'}]}).presets.heart,['person','g']);
 assert.equal(favoriteColorPreferences({getItem:()=>JSON.stringify({person:'#abcdef'})},{groups:[{id:'g'}],members:[{id:'person'}]}).person,'#abcdef');
});
test('new directory renders two identity tabs and exposed filters in four languages',async()=>{
 const server=await createServer({optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true,hmr:false,ws:false,watch:null},plugins:[{name:'unified-css',enforce:'pre',resolveId(id){if(id.endsWith('.css'))return '\0unified-css';},load(id){if(id==='\0unified-css')return 'export default {};';}}]});
 try{
  const {default:Directory}=await server.ssrLoadModule('/src/UnifiedDirectory.jsx');
  const {default:Sidebar}=await server.ssrLoadModule('/src/FavoritesSidebar.jsx');
  const {LanguageContext}=await server.ssrLoadModule('/src/i18n.js');
  const props={catalog:{groups:[{id:'g',name:'Original Artist',aliases:[],artistType:'group',debutYear:2020,memberRoster:{current:['Member'],former:['Former']}}],members:[{id:'p',groupId:'g',name:'Member',aliases:[]}],channels:[]},favorites:{heart:['g'],star:[],clover:[]},colors:{},excluded:[],protectedGroups:['g'],clock:Date.now(),onFavorite(){},onExclude(){},onHardBlock(){},onColor(){}};
  for(const [language,label] of [['ko','개인'],['ja','個人'],['en','People'],['es','Personas']]){
   const html=renderToString(React.createElement(LanguageContext.Provider,{value:language},React.createElement(Directory,props)));
   assert.ok(html.includes(label),language);assert.match(html,/Original Artist/);assert.doesNotMatch(html,/선택그룹 편집|저장 그룹|개별 멤버<|솔로 아티스트</);assert.doesNotMatch(html,/<details/);assert.match(html,/NO SIGNAL/);
   assert.match(html,/directory-filter-expansion" hidden=""/);assert.match(html,/lucide-biohazard/);assert.doesNotMatch(html,/lucide-skull/);
  }
  const sidebar=renderToString(React.createElement(Sidebar,{catalog:props.catalog,favorites:props.favorites,colors:{},scope:'all',onScope(){},presets:[],onPresets(){},disabled:[],onToggle(){},hardBlocked:[],excluded:[],clock:Date.now(),onEdit(){}}));
  assert.equal((sidebar.match(/선호그룹 관리/g)||[]).length,1);assert.match(sidebar,/mygroups-heading[^]*MY GROUPS[^]*favorite-management[^]*선호그룹 관리/);assert.doesNotMatch(sidebar,/add-group/);
 }finally{await server.close();}
});
