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
    server:{middlewareMode:true,hmr:false,ws:false,watch:null},
    plugins:[{name:'app-render-test',enforce:'pre',
      resolveId(source){if(source.endsWith('.css'))return '\0sonar-test-style';},
      load(id){if(id==='\0sonar-test-style')return 'export default {};';},
      transform(source,id){
      if(id.replaceAll('\\','/').endsWith('/src/main.jsx'))return source.replace("createRoot(document.getElementById('root')).render(<App/>);",'export {App};');
    }}],
  });
  try {
    const {App}=await server.ssrLoadModule('/src/main.jsx');
    const html=renderToString(React.createElement(App));
    assert.match(html,/SONAR/);
    assert.match(html,/LIVE STATION/);
    assert.match(html,/<details class="content-period-filter"><summary/);
    assert.doesNotMatch(html,/흩어진 순간을, 한곳에서\./);
    assert.doesNotMatch(html,/role="group" aria-label="(?:그룹|분류|형식)"/);
  } finally {
    await server.close();
    globalThis.window=previousWindow;
    globalThis.localStorage=previousStorage;
  }
});
