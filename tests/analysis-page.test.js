import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
test('analysis route keeps navigation, tolerates missing artifacts and renders truthful expandable counts',async()=>{
 const server=await createServer({optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true,hmr:false,ws:false,watch:null}});
 try{
  const {default:Page}=await server.ssrLoadModule('/src/AnalysisPage.jsx');
  const {default:Activity}=await server.ssrLoadModule('/src/ActivityAnalysis.jsx');
  const catalog={groups:[],members:[],updatedAt:'2026-11-16T00:00:00Z'};
  const html=renderToStaticMarkup(React.createElement(Page,{catalog,load:async()=>null,favorites:{}}));
  assert.match(html,/음악 크레딧/);assert.match(html,/출생지 지도/);assert.match(html,/PCA/);
  const data={asOf:catalog.updatedAt,artists:[{artistId:'g',windows:{30:{official:null,officialObserved:2,observedUploads:2,confirmed:null,inferred:null,member:null}}}]};
  const activity=renderToStaticMarkup(React.createElement(Activity,{data,artists:[{id:'g',name:'Example'}]}));
  assert.match(activity,/≥/);assert.match(activity,/Example/);assert.match(activity,/아티스트 검색/);
 }finally{await server.close();}
});
