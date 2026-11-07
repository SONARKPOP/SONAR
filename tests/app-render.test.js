import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
import React from 'react';
import {renderToString} from 'react-dom/server';

test('real application renders its initial screen without initialization errors', async () => {
  const previousWindow=globalThis.window;
  const previousStorage=globalThis.localStorage;
  globalThis.window={location:{hash:'#collection'},matchMedia:()=>({matches:false})};
  globalThis.localStorage={getItem:()=>null};
  const server=await createServer({
    server:{middlewareMode:true,hmr:false,ws:false},
    plugins:[{name:'app-render-test',enforce:'pre',transform(source,id){
      if(id.replaceAll('\\','/').endsWith('/src/main.jsx'))return source.replace("createRoot(document.getElementById('root')).render(<App/>);",'export {App};');
    }}],
  });
  try {
    const {App}=await server.ssrLoadModule('/src/main.jsx');
    const html=renderToString(React.createElement(App));
    assert.match(html,/SONAR/);
    assert.match(html,/LIVE STATION/);
  } finally {
    await server.close();
    globalThis.window=previousWindow;
    globalThis.localStorage=previousStorage;
  }
});
