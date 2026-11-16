import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {geoMercator,geoPath} from 'd3-geo';
import {resolveBirthplace,filterBirthplaceRows} from '../src/birthplace-data.js';
test('birthplace matches exact Korean province and longest district prefix, retaining evidence',()=>{
 const source={sourceUrl:'https://example.org/person',verificationStatus:'namuwiki_collected'};
 const p=resolveBirthplace({birthPlace:'경기도 수원시 권선구 구운동',profileSources:{birthPlace:source}});
 assert.equal(p.countryCode,'KR');assert.equal(p.regionCode,'경기도');assert.equal(p.city,'경기도 수원시권선구');
 assert.equal(p.source,source);assert.equal(p.uncertain,true);
});
test('country and region precision never invent city coordinates',()=>{
 const p=resolveBirthplace({birthPlace:'서울특별시'});
 assert.equal(p.precision,'region');assert.equal(p.city,null);assert.equal(p.coordinates,undefined);
 assert.equal(resolveBirthplace({birthPlace:'Japan'}).countryCode,'JP');
});
test('nationality, hometown and residence cannot establish birthplace',()=>{
 const p=resolveBirthplace({nationalities:['KR'],hometown:'서울특별시',residence:'부산광역시'});
 assert.equal(p.countryCode,null);assert.equal(p.precision,'unknown');assert.equal(p.reason,'missing');
});
test('ambiguous and unmapped city names remain unknown',()=>{
 for(const birthPlace of ['중구','광주','광주시','CA','Springfield','부산광역시가 아닌 어딘가'])assert.equal(resolveBirthplace({birthPlace}).countryCode,null);
 const p=resolveBirthplace({birthPlace:'경기도 미확인시'});assert.equal(p.regionCode,'경기도');assert.equal(p.city,null);
});
test('structured location and field-specific source remain independent',()=>{
 const p=resolveBirthplace({birthPlace:{countryCode:'US',region:'California',city:'Los Angeles'},profileSources:{nationalities:{verificationStatus:'official_verified'}}});
 assert.equal(p.countryCode,'US');assert.equal(p.precision,'country');assert.equal(p.source,null);assert.equal(p.uncertain,true);
});
test('filters preserve person counts and combine group and solo membership',()=>{
 const rows=[{person:{id:'one',name:'One',aliases:[],memberships:[{groupId:'g',name:'Band'}],soloIds:['s']},location:{raw:'Seoul'}},{person:{id:'two',name:'Two',aliases:[],memberships:[],soloIds:[]},location:{raw:''}}];
 assert.equal(filterBirthplaceRows(rows,{kind:'solo',groupId:'g',query:'Band'}).length,1);
 assert.equal(filterBirthplaceRows(rows,{groupId:'missing'}).length,0);
});
test('locally bundled Korea boundaries project into a meaningful regional map',()=>{
 const data=JSON.parse(fs.readFileSync(new URL('../public/data/maps/korea-sido.geojson',import.meta.url)));
 assert.equal(data.features.length,17);
 const path=geoPath(geoMercator().fitSize([960,500],data));
 const seoul=data.features.find(f=>f.properties.name==='서울특별시');
 const [[left,top],[right,bottom]]=path.bounds(seoul);
 assert.ok(right-left>5&&right-left<200);assert.ok(bottom-top>5&&bottom-top<200);
 assert.ok(left>=0&&top>=0&&right<=960&&bottom<=500);
 const districts=JSON.parse(fs.readFileSync(new URL('../public/data/maps/korea-sigungu.geojson',import.meta.url)));
 assert.ok(districts.features.length>200);
});
import {geographyRows,geographySummary} from '../src/birthplace-data.js';
test('Bangkok and reviewed foreign administrative labels establish geography independently of nationality',()=>{
 for(const [birthPlace,country] of [['방콕','TH'],['도쿄도','JP'],['아이치현 나고야시','JP'],['타이베이시','TW'],['캘리포니아 주 로스앤젤레스','US']]){
  const location=resolveBirthplace({birthPlace,nationalities:['KR']});assert.equal(location.countryCode,country);assert.ok(location.geographySource.sourceUrl.startsWith('https://www.wikidata.org/'));
 }
});
test('nationality overlay keeps uncertain birthplace separate and never invents an administrative region',()=>{
 const person={id:'p',nationalities:['TH'],profileSources:{nationalities:{sourceUrl:'https://source.example'}}};
 const row=geographyRows([person])[0];assert.equal(row.location.basis,'nationality');assert.equal(row.location.country,'TH');assert.equal(row.location.region,null);assert.equal(row.location.district,null);assert.equal(row.location.source,person.profileSources.nationalities);assert.equal(person.birthPlace,undefined);
 assert.equal(resolveBirthplace(person).countryCode,null);
 assert.equal(geographyRows([person],undefined,{nationalityFallback:false})[0].location.country,null);
});
test('dual citizenship is shown per country but counted as one person, without overriding known birthplace',()=>{
 const rows=geographyRows([{id:'dual',nationalities:['KR','US','US']},{id:'known',birthPlace:'Japan',nationalities:['KR']}]);
 assert.equal(rows.filter(r=>r.person.id==='dual').length,2);assert.deepEqual(geographySummary(rows),{people:2,birthplace:1,nationality:1,unknown:0,unresolvedBirthplace:1});
 assert.equal(rows.find(r=>r.person.id==='known').location.country,'JP');
});
test('registered Minnie is restored to Thailand without creating a new person ID',()=>{
 const catalog=JSON.parse(fs.readFileSync(new URL('../public/data/catalog.json',import.meta.url)));
 const person=catalog.members.find(p=>p.id==='gidle-minnie');assert.ok(person);assert.equal(resolveBirthplace(person).countryCode,'TH');assert.equal(geographyRows([person])[0].location.basis,'birthplace');
});
import {koreaMapCollection} from '../src/korea-map.js';
test('Korea view includes both geographic outlines while preserving original region identities',()=>{
 const world=JSON.parse(fs.readFileSync(new URL('../public/data/maps/world.geojson',import.meta.url)));
 const south=JSON.parse(fs.readFileSync(new URL('../public/data/maps/korea-sido.geojson',import.meta.url)));
 const combined=koreaMapCollection(world,south);
 assert.equal(combined.features.length,18);assert.equal(combined.features.filter(f=>f.properties._country==='KP').length,1);assert.equal(south.features.length,17);
 assert.equal(combined.features[0],south.features[0]);
});
test('Chorong maps to Sejong and later administrative names preserve historical birthplace text',()=>{
 const catalog=JSON.parse(fs.readFileSync(new URL('../public/data/catalog.json',import.meta.url)));
 const chorong=catalog.members.find(p=>p.name==='박초롱');assert.ok(chorong);
 const location=resolveBirthplace(chorong);assert.equal(location.regionCode,'세종특별자치시');assert.match(location.raw,/청원군/);assert.match(location.administrativeChange.sourceUrl,/sejong\.go\.kr/);
 assert.equal(resolveBirthplace({birthPlace:'인천광역시 남구 용현동'}).city,'인천광역시 미추홀구');
 assert.equal(resolveBirthplace({birthPlace:'경상북도 군위군'}).regionCode,'대구광역시');
 assert.notEqual(resolveBirthplace({birthPlace:'충청북도 청원군 부용면 외천리'}).regionCode,'세종특별자치시');
});
test('small territories remain discoverable even when the base world geometry omits them',()=>{
 for(const [birthPlace,country] of [['홍콩','HK'],['마카오','MO'],['싱가포르','SG']])assert.equal(resolveBirthplace({birthPlace}).countryCode,country);
 assert.equal(geographyRows([{id:'hk',nationalities:['HK']}])[0].location.country,'HK');
 assert.equal(geographyRows([{id:'unknown',nationalities:['ZZ']}])[0].location.country,null);
});
