import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
import React from 'react';

test('real player pointer handlers drag, pinch, cancel, and retain video children',async()=>{
 const previousWindow=globalThis.window;
 const slots=[];let cursor=0;
 globalThis.window={innerWidth:1400,innerHeight:900};
 globalThis.__playerHooks={
  useState(initial){const index=cursor++;if(!(index in slots))slots[index]=typeof initial==='function'?initial():initial;return[slots[index],next=>{slots[index]=typeof next==='function'?next(slots[index]):next;}];},
  useRef(initial){const index=cursor++;return slots[index]??= {current:initial};},
  useEffect(){cursor++;},
 };
 const server=await createServer({server:{middlewareMode:true,hmr:false,ws:false,watch:null},plugins:[{
  name:'player-pointer-test',enforce:'pre',
  resolveId(source){if(source.endsWith('.css'))return '\0player-style';},
  load(id){if(id==='\0player-style')return 'export default {};';},
  transform(source,id){if(id.replaceAll('\\','/').endsWith('/src/AdjustablePlayer.jsx'))return source.replace("import React, {useEffect, useRef, useState} from 'react';","import React from 'react';const {useEffect,useRef,useState}=globalThis.__playerHooks;");},
 }]});
 try{
  const {default:Player}=await server.ssrLoadModule('/src/AdjustablePlayer.jsx');
  const iframe=React.createElement('iframe',{key:'stable-video',src:'about:blank'});
  const render=()=>{cursor=0;return Player({children:iframe}).props.children[1];};
  let tree=render();const start=tree.props.style;
  assert.deepEqual(tree.props.children[1].map(handle=>handle.props['data-player-resize']),['nw','ne','sw','se']);
  const capture={setPointerCapture(){}};
  const target={closest(selector){return selector==='[data-player-drag]'?{}:null;}};
  const event=(id,x,y)=>({pointerId:id,clientX:x,clientY:y,button:0,target,currentTarget:capture,preventDefault(){}});
  tree.props.onPointerDown(event(1,300,40));
  tree.props.onPointerMove(event(1,350,70));tree=render();
  assert.equal(tree.props.style.left,start.left+50);assert.equal(tree.props.style.top,start.top+30);
  tree.props.onPointerDown(event(2,450,70));
  const beforePinch=tree.props.style.width;
  tree.props.onPointerMove(event(2,500,70));tree=render();
  assert.ok(tree.props.style.width>beforePinch,'two fingers grow the player');
  assert.equal(tree.props.children[0],iframe,'video element is retained through geometry renders');
  tree.props.onPointerCancel(event(2,500,70));
  tree.props.onPointerCancel(event(1,350,70));tree=render();
  assert.equal(tree.props['data-adjusting'],false);
  const stopped=tree.props.style;
  tree.props.onPointerMove(event(1,900,500));tree=render();
  assert.deepEqual(tree.props.style,stopped,'cancelled pointer no longer moves the player');
 }finally{await server.close();globalThis.window=previousWindow;delete globalThis.__playerHooks;}
});
