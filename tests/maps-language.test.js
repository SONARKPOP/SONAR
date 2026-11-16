import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import {mapTranslations} from '../src/map-translations.js';
import {mapPopupText,mapLocationText,mapControlLabels} from '../src/map-copy.js';

test('map dictionary has three complete translations per Korean source key',()=>{
 for(const [key,translations] of Object.entries(mapTranslations)){assert.equal(translations.length,3,key);assert.ok(translations.every(value=>typeof value==='string'&&value.length>0),key);}
});
test('four-language map SSR translates controls and preserves names, source places and URLs',async()=>{
 const server=await createServer({optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true,hmr:false,ws:false,watch:null},plugins:[{name:'map-language-styles',enforce:'pre',resolveId(id){if(id.endsWith('.css'))return '\0map-language-style';},load(id){if(id==='\0map-language-style')return 'export default {};';}}]});
 try{
  const {default:MapPage,MapPersonRow}=await server.ssrLoadModule('/src/BirthplaceMaps.jsx');
  const {default:Globe}=await server.ssrLoadModule('/src/BirthplaceGlobe.jsx');
  const {LanguageContext}=await server.ssrLoadModule('/src/i18n.js');
  const person={id:'native',name:'홈',legalNames:{ja:'公式名'},memberships:[{groupId:'group',name:'세계'}]};
  const location={country:'TW',raw:'중화민국 臺北市',basis:'birthplace',uncertain:true,source:{sourceUrl:'https://example.org/native?lang=ja',verificationStatus:'namuwiki_collected'}};
  const original=JSON.stringify({person,location});
  const render=(component,props,language)=>renderToStaticMarkup(React.createElement(LanguageContext.Provider,{value:language},React.createElement(component,props)));
  const expected={ko:['출생지 · 국적 지도','이름 · 그룹 · 출생지 검색','출생지 출처 검토 필요'],ja:['出生地・国籍マップ','名前・グループ・出生地を検索','出生地の出典確認が必要'],en:['Birthplace and nationality map','Search name, group or birthplace','Birthplace source needs review'],es:['Mapa de nacimiento y nacionalidad','Buscar nombre, grupo o lugar de nacimiento','La fuente del lugar de nacimiento requiere revisión']};
  for(const language of ['ko','ja','en','es']){
   const page=render(MapPage,{catalog:{groups:[{id:'group',name:'세계'}],members:[]}},language);
   assert.ok(page.includes(expected[language][0]));assert.ok(page.includes(expected[language][1]));assert.match(page,/data-no-translate="true"[^>]*>세계/);
   const row=render(MapPersonRow,{person,location},language);
   assert.match(row,/>홈<\/strong>/);assert.match(row,/>세계<\/span>/);assert.match(row,/중화민국 臺北市/);assert.ok(row.includes(expected[language][2]));assert.ok(row.includes(location.source.sourceUrl));assert.match(row,/data-no-translate/);
   const native=render(MapPersonRow,{person:{...person,name:'公式名'},location},language);assert.match(native,/公式名/);
   const globe=render(Globe,{world:{type:'FeatureCollection',features:[]},features:{type:'FeatureCollection',features:[]},counts:new Map(),onSelect:()=>{},view:'world'},language);assert.match(globe,/role="status"/);if(language==='en')assert.match(globe,/Preparing globe/);
  }
  assert.equal(JSON.stringify({person,location}),original);
 }finally{await server.close();}
});
test('popup counts and native navigation labels switch language without changing source facts',()=>{
 const rows=[{person:{name:'홈',memberships:[{name:'세계'}]},location:{basis:'birthplace',raw:'중화민국 臺北市'}}];
 for(const language of ['ko','ja','en','es']){
  const popup=mapPopupText('臺北市',rows,language);assert.ok(popup.includes('홈 · 세계 · 중화민국 臺北市'));assert.ok(popup.includes('1'));assert.ok(popup.includes('臺北市'));
  const nationality=mapLocationText({basis:'nationality',country:'JP',originalBirthPlace:'公式名 출생지 원문'},language);assert.ok(nationality.includes('公式名 출생지 원문'));assert.ok(nationality.includes('🇯🇵'));
  const labels=mapControlLabels(language);assert.ok(labels['NavigationControl.ZoomIn']);if(language==='en'){assert.equal(labels['NavigationControl.ZoomIn'],'Zoom in');assert.match(popup,/by nationality/);assert.match(nationality,/birthplace unknown/);}
 }
 const many=mapPopupText('Region',Array.from({length:1234},()=>rows[0]),'en',0);assert.match(many,/1,234/);
});
