import test from 'node:test';
import assert from 'node:assert/strict';
import {fractionalAge,groupDemographics,artistProfileRows} from '../src/artist-insights.js';
import {profileRows,sortProfileRows,affiliationRows,affiliationCategories,formatDebutElapsed} from '../src/profile-statistics.js';

test('debut mean retains fractions and excludes members without dated debut membership',()=>{
 const group={id:'g',debutDate:'2020-07-02',memberRoster:{current:['a','late']}};
 const people=[{id:'a',birthDate:'2000-01-01',memberships:[{groupId:'g',status:'current',joinedAt:'2020-01-01'}]},{id:'late',birthDate:'1990-01-01',memberships:[{groupId:'g',status:'current',joinedAt:'2021-01-01'}]},{id:'unknown',birthDate:'1999-01-01',memberships:[{groupId:'g',status:'current'}]}];
 const row=groupDemographics([group],people,'2026-01-01')[0];
 assert.equal(row.meanDebutAge,20.5);assert.equal(row.debutAgeKnown,1);
 assert.equal(fractionalAge('2000-01-01','2020-01-01'),20);
 assert.equal(fractionalAge('2000','2020-01-01'),null);
 assert.equal(fractionalAge('2000-02-31','2020-01-01'),null);
 assert.equal(fractionalAge('2021-01-01','2020-01-01'),null);
});

test('partial membership date is not evidence that a member was present on exact debut day',()=>{
 const [row]=groupDemographics([{id:'g',debutDate:'2020-07-02'}],[{id:'p',birthDate:'2000-01-01',memberships:[{groupId:'g',status:'current',joinedAt:'2020'}]}],'2026-01-01');
 assert.equal(row.meanDebutAge,null);
});

test('debut display preserves date precision and elapsed days never invents a January date',()=>{
 const rows=profileRows([{id:'year',name:'Year',debutDate:'2020'},{id:'date',name:'Date',debutDate:'2020-01-01'},{id:'solo',name:'Solo',artistType:'solo',debutDate:'2019',soloDebutDate:'2020-01-01'}],[],'2021-01-01');
 assert.equal(rows[0].debutDate,'2020');assert.equal(rows[0].yearsSinceDebut,null);assert.equal(rows[0].daysSinceDebut,null);
 assert.equal(rows[1].daysSinceDebut,366);assert.equal(formatDebutElapsed(rows[1]),'1.00년 (366일)');
 assert.equal(rows[2].debutDate,'2020-01-01');
});

test('source-backed affiliations preserve status and agency/label roles including same named companies',()=>{
 const sourceUrl='https://example.com/proof';
 const artist={agencyHistory:[{name:'Same',agencyId:'same',status:'current',sourceUrl},{name:'Same',agencyId:'same',role:'label',status:'current',sourceUrl},{name:'Old',role:'agency',status:'former',sourceUrl},{name:'Unsafe',role:'label',status:'current',sourceUrl:'javascript:alert(1)'}]};
 const rows=affiliationRows(artist);
 assert.deepEqual(rows.map(r=>[r.name,r.role,r.status]),[['Same','agency','current'],['Same','label','current'],['Old','agency','former']]);
 assert.deepEqual(affiliationCategories(artist),{agency:'same',label:'same'});
 assert.deepEqual(affiliationCategories({agencyHistory:[...artist.agencyHistory,{name:'Second',status:'current',sourceUrl}]}),{agency:null,label:'same'});
});

test('artist search matches aliases and column ordering is numeric both directions with null last',()=>{
 const rows=[{id:'a',name:'Alpha',aliases:['에이'],meanCurrentAge:20},{id:'b',name:'Beta',meanCurrentAge:9},{id:'c',name:'Gamma',meanCurrentAge:null}];
 assert.deepEqual(sortProfileRows(rows,{key:'meanCurrentAge',direction:'asc'}).map(r=>r.id),['b','a','c']);
 assert.deepEqual(sortProfileRows(rows,{key:'meanCurrentAge',direction:'desc'}).map(r=>r.id),['a','b','c']);
 assert.deepEqual(sortProfileRows(rows,{query:'에이'}).map(r=>r.id),['a']);
 assert.equal(rows[0].id,'a');
});

test('top-level and nested affiliation evidence is combined without role/status loss',()=>{
 const sourceUrl='https://example.com/proof';
 const row={name:'Shared',agencyId:'shared',status:'current',sourceUrl};
 const artist={agencyHistory:[row],personProfile:{agencyHistory:[row,{...row,role:'label'},{...row,status:'former'}]}};
 assert.deepEqual(affiliationRows(artist).map(r=>[r.role,r.status]),[['agency','current'],['label','current'],['agency','former']]);
});

test('profile table renders grouped sortable headers, role-specific evidence and precise debut values',async()=>{
 const {createServer}=await import('vite'),React=await import('react'),{renderToStaticMarkup}=await import('react-dom/server');
 const server=await createServer({configFile:false,optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true,hmr:false,ws:false,watch:null},plugins:[{name:'profile-test-style',enforce:'pre',resolveId(source){if(source.endsWith('.css'))return '\0profile-test-style';},load(id){if(id==='\0profile-test-style')return 'export default {};';}}]});
 try{
  const {default:ProfileStatistics}=await server.ssrLoadModule('/src/ProfileStatistics.jsx');
  const html=renderToStaticMarkup(React.createElement(ProfileStatistics,{artists:[{id:'g',name:'Group',debutDate:'2020-01-01',agencyHistory:[{name:'Agency A',sourceUrl:'https://example.com/a',status:'current'},{name:'Label B',role:'label',sourceUrl:'https://example.com/b',status:'former'}]}],people:[],date:'2021-01-01'}));
  assert.match(html,/colSpan="2">소속<\/th>/);assert.match(html,/colSpan="4">나이<\/th>/);
  assert.match(html,/아티스트 검색/);assert.match(html,/aria-sort="ascending"/);
  assert.match(html,/2020-01-01/);assert.match(html,/1\.00년 \(366일\)/);
  assert.match(html,/>Agency A<\/a>/);assert.match(html,/>Label B<\/a>/);
  assert.doesNotMatch(html,/<th[^>]*>생일 확인(?:율)?<\/th>/);
 }finally{await server.close();}
});
