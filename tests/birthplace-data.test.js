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
