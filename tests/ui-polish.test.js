import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import {ACTIVITY_META} from '../src/youtube-activity.js';
import {uiPolishTranslations} from '../src/ui-polish-translations.js';

test('compact period exposes an independent year, every month and an accessible reset in all languages',async()=>{
 const server=await createServer({optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true,hmr:false,ws:false,watch:null}});
 try{
  const {default:Period}=await server.ssrLoadModule('/src/ContentPeriodFilter.jsx');
  const {LanguageContext}=await server.ssrLoadModule('/src/i18n.js');
  for(const language of ['ko','ja','en','es']){
   const props={years:['2026','2025'],year:'2025',month:'07',onYear(){},onMonth(){}};
   const tree=React.createElement(LanguageContext.Provider,{value:language},React.createElement(Period,props));
   const html=renderToStaticMarkup(tree);
   assert.match(html,/<select[^>]+><option value="">/);
   assert.match(html,/<option value="2025" selected="">2025/);
   assert.equal((html.match(/aria-pressed=/g)||[]).length,13);
   assert.equal((html.match(/aria-pressed="true"/g)||[]).length,1);
   assert.match(html,/2025 · /);
   assert.doesNotMatch(html,/aria-label=""/);
   assert.match(html,new RegExp(language==='ko'?'기간 초기화':uiPolishTranslations['기간 초기화'][{ja:0,en:1,es:2}[language]]));
   if(language!=='ko')assert.doesNotMatch(html,/[가-힣]/);
  }
  const empty=renderToStaticMarkup(React.createElement(Period,{onYear(){},onMonth(){}}));
  assert.match(empty,/disabled=""/);
  assert.match(empty,/class="compact-period-all" aria-pressed="true"/);
 }finally{await server.close();}
});

test('anchored has distinct neutral theme colors and system typography makes no font requests',async()=>{
 assert.match(ACTIVITY_META.ANCHORED.color,/^var\(--activity-anchored,/);
 assert.equal(ACTIVITY_META.SURGE.color,'#ef4444');
 const css=await readFile(new URL('../src/ui-polish.css',import.meta.url),'utf8');
 assert.match(css,/:root\{[^}]*--activity-anchored:#475569/);
 assert.match(css,/:root\[data-theme="dark"\]\{[^}]*--activity-anchored:#d1d5db/);
 assert.doesNotMatch(css,/@import|https?:|@font-face/);
 assert.match(css,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
 for(const translations of Object.values(uiPolishTranslations))assert.equal(translations.length,3);
});
