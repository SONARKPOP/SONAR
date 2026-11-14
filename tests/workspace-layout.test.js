import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToString} from 'react-dom/server';
import {createServer} from 'vite';

test('workspace separates saved membership from viewing and exposes external facets',async()=>{
 const server=await createServer({optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true,hmr:false,ws:false,watch:null},plugins:[{
  name:'workspace-styles',enforce:'pre',resolveId(id){if(id.endsWith('.css'))return '\0workspace-css';},load(id){if(id==='\0workspace-css')return 'export default {};';}
 }]});
 try{
  const {default:MyGroupsPage}=await server.ssrLoadModule('/src/MyGroupsPage.jsx');
  const {ExternalExplorer,WorkspaceNavigation}=await server.ssrLoadModule('/src/BrowseWorkspace.jsx');
  const html=renderToString(React.createElement(MyGroupsPage,{groups:[{id:'a',name:'Alpha'},{id:'b',name:'Beta'}],
   saved:['a','b'],checked:['a'],enabled:['a'],favorites:{heart:['b'],star:[],clover:[]},excluded:[],clock:Date.now(),
   onToggleViewing(){},onToggleSaved(){},onFavorite(){},onEdit(){}})).replace(/<!--[\s\S]*?-->/g,'');
  assert.match(html,/저장 2개/);
  assert.match(html,/영상 켜짐 1개/);
  assert.match(html,/Beta 영상 표시/);
  assert.match(html,/Beta 저장 해제/);
  assert.match(html,/저장 그룹 목록은 유지됩니다/);
  const external=renderToString(React.createElement(ExternalExplorer,{types:[['variety','예능']],type:'variety',channel:'p',
   channels:[{id:'p',name:'Program',count:3,groups:new Set(['a','b'])}],onType(){},onChannel(){}}));
  assert.match(external,/Program/);assert.match(external,/공통 출연/);assert.match(external,/불러온 영상 기준/);
  const nav=renderToString(React.createElement(WorkspaceNavigation,{menus:[['home','홈',()=>null]],page:'groups',category:'home',onGo(){},onGroups(){}}));
  assert.match(nav,/aria-current="page"[^>]*>[^]*MY GROUPS/);
 }finally{await server.close();}
});
