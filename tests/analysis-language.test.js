import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import {analysisTranslations,formatAnalysisDate} from '../src/analysis-translations.js';
import {formatDebutElapsed} from '../src/profile-statistics.js';

const placeholders=value=>[...value.matchAll(/\{(\w+)\}/g)].map(m=>m[1]).sort();
test('analysis translations cover three languages and preserve interpolation fields',()=>{
 for(const [key,values] of Object.entries(analysisTranslations)){
  assert.equal(values.length,3,key);
  for(const value of values){assert.ok(value.trim(),key);assert.deepEqual(placeholders(value),placeholders(key),key);}
 }
});
test('localized analysis dates retain year-only precision and elapsed values retain digits',()=>{
 assert.equal(formatAnalysisDate('2020','es'),'2020');
 assert.equal(formatAnalysisDate('2020-01-02','en'),'01/02/2020');
 assert.equal(formatAnalysisDate('2020-01-02','es'),'02/01/2020');
 assert.equal(formatAnalysisDate('2020-01','en'),'01/2020');
 const row={yearsSinceDebut:1.25,daysSinceDebut:456};
 assert.equal(formatDebutElapsed(row),'1.25년 (456일)');
 assert.equal(formatDebutElapsed(row,'ja'),'1.25年 (456日)');
 assert.equal(formatDebutElapsed(row,'en'),'1.25 years (456 days)');
 assert.equal(formatDebutElapsed(row,'es'),'1,25 años (456 días)');
});

test('profile and activity screens render all four languages while preserving names, links and chart data',async()=>{
 const server=await createServer({configFile:false,optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true,hmr:false,ws:false,watch:null},plugins:[{name:'analysis-language-style',enforce:'pre',resolveId(source){if(source.endsWith('.css'))return '\0analysis-language-style';},load(id){if(id==='\0analysis-language-style')return 'export default {};';}}]});
 try{
  const {LanguageContext}=await server.ssrLoadModule('/src/i18n.js');
  const {default:Profile}=await server.ssrLoadModule('/src/ProfileStatistics.jsx');
  const {default:Activity}=await server.ssrLoadModule('/src/ActivityAnalysis.jsx');
  const {default:Charts}=await server.ssrLoadModule('/src/ActivityCharts.jsx');
  const sourceUrl='https://example.com/profile?lang=ko';
  const artist={id:'g',name:'평균',debutDate:'2020-01-02',memberRoster:{current:['p']},agencyHistory:[{name:'나이',status:'former',role:'label',sourceUrl},{name:'소속사',status:'current',sourceUrl}]};
  const people=[{id:'p',name:'원문멤버',birthDate:'2000-01-01',nationalities:[{code:'KR',name:'대한민국'}],memberships:[{groupId:'g',status:'current',joinedAt:'2019-01-01'}]}];
  const window={observedUploads:1200,official:1100,confirmed:2,inferred:1,member:3,types:{music:1,unclassified:0},members:[{memberId:'p',name:'소속사',count:3}]};
  const row={artistId:'g',id:'g',name:'평균',...window,external:3,knownInactiveDays:7,officialPerDayMean:1.25,officialPerDayStdDev:.25,linkedAppearanceEvents:2,unlinkedAppearanceUploads:1,seriesDays:30,windows:{'30':window},series:[{date:'2026-11-17',observedUploads:1200,official:1100}]};
  const expected={ko:['아티스트 검색','집계 단위','활동량 아티스트 검색'],ja:['アーティスト検索','集計単位','活動量のアーティスト検索'],en:['Search artists','Time grouping','Search activity by artist'],es:['Buscar artistas','Unidad de agrupación','Buscar actividad por artista']};
  for(const language of ['ko','ja','en','es']){
   const render=(Component,props)=>renderToStaticMarkup(React.createElement(LanguageContext.Provider,{value:language},React.createElement(Component,props)));
   const profile=render(Profile,{artists:[artist],people,date:'2026-11-17'}),activity=render(Activity,{artists:[artist],data:{asOf:'2026-11-17T00:00:00Z',artists:[row]}}),chart=render(Charts,{row,days:30,asOf:'2026-11-17T00:00:00Z'});
   assert.ok(profile.includes(expected[language][0]),language);
   assert.ok(chart.includes(expected[language][1]),language);
   assert.ok(activity.includes(expected[language][2]),language);
   assert.match(profile,/data-no-translate="true">평균<\/th>/);
   assert.ok(profile.includes(sourceUrl));assert.match(profile,/data-no-translate="true"[^>]*>나이<\/a>/);
   assert.match(chart,/data-no-translate="true">소속사<\/span>/);
   assert.ok(chart.includes('LIVE'));assert.ok(chart.includes('Shorts'));
   if(language!=='ko'){
    const emptyProfile=render(Profile,{artists:[],people:[],date:'2026-11-17'}),emptyActivity=render(Activity,{artists:[],data:{asOf:'2026-11-17T00:00:00Z',artists:[]}}),unknownChart=render(Charts,{row:{...row,windows:{'30':{...window,members:[]}}},days:30,asOf:'2026-11-17T00:00:00Z'});
    for(const html of [profile,activity,chart,emptyProfile,emptyActivity,unknownChart])assert.doesNotMatch(html.replaceAll('평균','').replaceAll('소속사','').replaceAll('나이',''),/[가-힣]/,language);
   }
   assert.ok(profile.includes(language==='es'?'02/01/2020':language==='en'?'01/02/2020':language==='ja'?'2020/01/02':'2020-01-02'));
   assert.ok(activity.includes(language==='es'?'1200':'1,200'));
  }
 }finally{await server.close();}
});
