import test from 'node:test';
import assert from 'node:assert/strict';
import {PROFILE_COLUMNS,PROFILE_COLUMNS_KEY,normalizeProfileColumns,loadProfileColumns,saveProfileColumns,moveProfileColumn,visibleProfileColumns,profileColumnGroups} from '../src/profile-columns.js';
import {profileColumnTranslations} from '../src/profile-column-translations.js';
test('column normalization rejects unknown keys and duplicates and keeps artist visible',()=>{
 const state=normalizeProfileColumns({order:['agency','agency','unknown'],hidden:['name','label','label','unknown']});
 assert.equal(state.order.length,PROFILE_COLUMNS.length);assert.equal(state.order[0],'agency');assert.deepEqual(state.hidden,['label']);assert.ok(visibleProfileColumns(state).some(c=>c.key==='name'));
 assert.deepEqual(normalizeProfileColumns(null),normalizeProfileColumns({order:'broken',hidden:{}}));
});
test('reorder preserves hidden columns and creates correct contiguous header groups',()=>{
 const initial=normalizeProfileColumns({hidden:['label']});const next=moveProfileColumn(initial,'meanCurrentAge','agency');
 assert.deepEqual(initial,normalizeProfileColumns({hidden:['label']}));assert.equal(next.order[1],'meanCurrentAge');assert.deepEqual(next.hidden,['label']);
 const groups=profileColumnGroups(visibleProfileColumns(next));assert.deepEqual(groups.filter(g=>g.group==='나이').map(g=>g.columns.length),[1,3]);
 assert.deepEqual(moveProfileColumn(next,'bad','name'),next);
});
test('preferences use an isolated key and tolerate corrupt or unavailable storage',()=>{
 const values=new Map([['favorites','keep']]);const storage={getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)};
 const state=moveProfileColumn(normalizeProfileColumns({hidden:['agency']}),'debutDate','name');saveProfileColumns(storage,state);assert.deepEqual(loadProfileColumns(storage),state);assert.equal(values.get('favorites'),'keep');assert.ok(values.has(PROFILE_COLUMNS_KEY));
 values.set(PROFILE_COLUMNS_KEY,'{');assert.deepEqual(loadProfileColumns(storage),normalizeProfileColumns());assert.doesNotThrow(()=>saveProfileColumns({setItem(){throw Error();}},state));assert.deepEqual(loadProfileColumns({getItem(){throw Error();}}),normalizeProfileColumns());
});
test('all new interface labels include Japanese English and Spanish',()=>{for(const values of Object.values(profileColumnTranslations)){assert.equal(values.length,3);assert.ok(values.every(value=>typeof value==='string'&&value.length));}});
test('table renders saved visibility order and accessible mobile reorder controls',async()=>{
 const {createServer}=await import('vite'),React=await import('react'),{renderToStaticMarkup}=await import('react-dom/server');
 const server=await createServer({configFile:false,optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true,hmr:false,ws:false,watch:null},plugins:[{name:'column-test-style',enforce:'pre',resolveId(source){if(source.endsWith('.css'))return '\0column-test-style';},load(id){if(id==='\0column-test-style')return 'export default {};';}}]});
 const oldWindow=globalThis.window;
 try{
  const state=moveProfileColumn(normalizeProfileColumns({hidden:['agency','label']}),'debutDate','name');globalThis.window={localStorage:{getItem:()=>JSON.stringify(state)}};
  const {default:Profile}=await server.ssrLoadModule('/src/ProfileStatistics.jsx');
  const html=renderToStaticMarkup(React.createElement(Profile,{artists:[{id:'example',name:'UNCHANGED NAME',debutDate:'2020-01-01'}],people:[],date:'2021-01-01'}));
  const table=html.slice(html.indexOf('<table'),html.indexOf('</table>'));
  assert.ok(table.indexOf('데뷔일')<table.indexOf('아티스트</button>')||table.indexOf('데뷔일')<table.indexOf('아티스트<span'));
  assert.doesNotMatch(table,/profile-affiliation-cell/);assert.match(table,/draggable="true"/);assert.match(table,/aria-sort="ascending"/);assert.match(table,/data-no-translate="true"/);assert.match(html,/아티스트 왼쪽으로 이동/);assert.match(html,/type="checkbox" disabled=""/);
 }finally{if(oldWindow===undefined)delete globalThis.window;else globalThis.window=oldWindow;await server.close();}
});

