import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';

// Exercise the real App's hook dependencies across render/effect cycles.
// Only the detail-loading effect runs here; unrelated browser effects stay inert.
function hookHarness(){
  const slots=[];let cursor=0,dirty=false,effects=[];
  const equal=(a,b)=>a&&b&&a.length===b.length&&a.every((v,i)=>Object.is(v,b[i]));
  const useState=initial=>{
    const i=cursor++;
    if(!slots[i])slots[i]={value:typeof initial==='function'?initial():initial};
    return [slots[i].value,next=>{const value=typeof next==='function'?next(slots[i].value):next;if(!Object.is(value,slots[i].value)){slots[i].value=value;dirty=true;}}];
  };
  return {
    hooks:{useState,useReducer:(reducer,initial)=>{const [value,set]=useState(initial);return[value,action=>set(old=>reducer(old,action))];},
      useRef:initial=>{const i=cursor++;return slots[i]??= {current:initial};},
      useMemo:(fn,deps)=>{const i=cursor++;if(!slots[i]||!equal(slots[i].deps,deps))slots[i]={deps,value:fn()};return slots[i].value;},
      useEffect:(fn,deps)=>{const i=cursor++;if(!equal(slots[i]?.deps,deps)){slots[i]={deps};if(fn.toString().includes('setDetails'))effects.push(fn);}}},
    async settle(App){
      for(let render=0;render<8;render++){
        cursor=0;dirty=false;effects=[];const tree=App();
        effects.forEach(effect=>effect());
        await new Promise(resolve=>setImmediate(resolve));
        if(!dirty)return tree;
      }
      assert.fail('App repeatedly reloads details instead of settling after a button click');
    },
  };
}
function text(node){if(node==null||typeof node==='boolean')return '';if(typeof node!=='object')return String(node);if(Array.isArray(node))return node.map(text).join('');return text(node.props?.children);}
function findButton(node,label){
  if(!node||typeof node!=='object')return;
  if(Array.isArray(node)){for(const child of node){const found=findButton(child,label);if(found)return found;}return;}
  // Navigation is now a hook-free presentation component; keep exercising
  // the real parent callbacks across render cycles rather than a copied menu.
  if(node.type?.name==='WorkspaceNavigation')return findButton(node.type(node.props),label);
  if(node.type==='button'&&text(node)===label)return node;
  return findButton(node.props?.children,label);
}
test('App settles after initial detail loading and repeated content-tab clicks',async()=>{
  const harness=hookHarness();
  const old={window:globalThis.window,localStorage:globalThis.localStorage,hooks:globalThis.__sonarTestHooks};
  globalThis.window={location:{hash:'#collection'},matchMedia:()=>({matches:false})};
  globalThis.localStorage={getItem:()=>null};
  globalThis.__sonarTestHooks=harness.hooks;
  const server=await createServer({server:{middlewareMode:true,hmr:false,ws:false,watch:null},plugins:[{
    name:'app-interaction-harness',enforce:'pre',
    resolveId(source){if(source.endsWith('.css'))return '\0sonar-test-style';},
    load(id){if(id==='\0sonar-test-style')return 'export default {};';},
    transform(source,id){
      const path=id.replaceAll('\\','/');
      if(path.endsWith('/src/useGroupVideos.js')){
        return source.replace("import {useEffect,useState} from 'react';",'const {useEffect,useState}=globalThis.__sonarTestHooks;');
      }
      if(!path.endsWith('/src/main.jsx'))return;
      return source.replace(/import React,\{[^}]+\} from 'react';/,"import React from 'react'; const {useEffect,useMemo,useRef,useState,useReducer}=globalThis.__sonarTestHooks;")
        .replace("createRoot(document.getElementById('root')).render(<App/>);",'export {App};');
    },
  }]});
  try{
    const {App}=await server.ssrLoadModule('/src/main.jsx');
    let tree=await harness.settle(App);
    for(const label of ['LIVE STATION','MUSIC','LIVE STATION','Shorts']){
      const button=findButton(tree,label);assert.ok(button,`Missing tab: ${label}`);
      button.props.onClick();tree=await harness.settle(App);
      assert.ok(findButton(tree,label));
    }
  }finally{await server.close();globalThis.window=old.window;globalThis.localStorage=old.localStorage;globalThis.__sonarTestHooks=old.hooks;}
});
