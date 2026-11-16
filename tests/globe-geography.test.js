import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {resolveBirthplace,geographyRows,geographyRegionKey} from '../src/birthplace-data.js';
import {nationalityView} from '../src/person-directory.js';
import {mapCopy,MAP_COPY} from '../src/map-copy.js';
test('India and Indonesia use whole country names and exact ISO codes',()=>{
 for(const [name,code] of [['인도','IN'],['India','IN'],['인도네시아','ID'],['Indonesia','ID'],['INDONESIA','ID'],['ID','ID'],['IN','IN']])assert.equal(nationalityView(name).code,code);
 for(const [birthPlace,code] of [['인도네시아','ID'],['인도네시아 반둥','ID'],['Indonesia Bandung','ID'],['인도 뉴델리','IN'],['India New Delhi','IN']])assert.equal(resolveBirthplace({birthPlace}).countryCode,code);
 const row=geographyRows([{id:'id',nationalities:['인도네시아']}])[0];assert.equal(row.location.country,'ID');assert.equal(row.location.basis,'nationality');
});
test('structured US, China and Japan regions resolve only within their explicit birth country',()=>{
 const source={sourceUrl:'https://example.org/birthplace',verificationStatus:'namuwiki_collected'};
 for(const [countryCode,region,expected] of [['US','California','adm1:US:US-CA'],['CN','Guangdong','adm1:CN:CN-GD'],['JP','Aichi','adm1:JP:JP-23']]){
  const place=resolveBirthplace({birthPlace:{countryCode,region},profileSources:{birthPlace:source}});
  assert.equal(place.adm1Id,expected);assert.equal(place.precision,'region');assert.equal(place.source,source);assert.equal(place.uncertain,true);assert.equal(place.coordinates,undefined);
 }
 assert.equal(resolveBirthplace({birthPlace:{countryCode:'CN',region:'California'}}).adm1Id,undefined);
 assert.equal(resolveBirthplace({birthPlace:{countryCode:'US',city:'Los Angeles'}}).region,null);
 assert.equal(resolveBirthplace({nationalities:['JP'],birthPlace:'Aichi'}).adm1Id,undefined);
});
test('Korean ADM3 matches published administrative names, with safe upper-level fallbacks',()=>{
 const full=resolveBirthplace({birthPlace:'서울특별시 종로구 사직동'});
 assert.equal(full.adm3Id,'kr3:1111053000');assert.equal(full.precision,'ward');
 const district=resolveBirthplace({birthPlace:'서울특별시 종로구'});
 assert.equal(district.adm2Id,'kr2:서울특별시 종로구');assert.equal(district.adm3Id,undefined);
 const unknown=resolveBirthplace({birthPlace:'서울특별시 알수없는구 알수없는동'});
 assert.equal(unknown.adm1Id,'kr1:서울특별시');assert.equal(unknown.adm2Id,undefined);assert.equal(unknown.adm3Id,undefined);
 assert.equal(resolveBirthplace({birthPlace:'사직동'}).countryCode,null);
 assert.equal(geographyRegionKey(full,{view:'korea',level:'adm3'}),full.adm3Id);
 assert.equal(geographyRegionKey(district,{view:'korea',level:'adm3'}),district.adm2Id);
 assert.equal(geographyRegionKey(unknown,{view:'korea',level:'adm3'}),unknown.adm1Id);
});
test('nationality-only facts never acquire ADM1 or ADM3 positions',()=>{
 const row=geographyRows([{id:'us',nationalities:['US']}])[0];
 assert.equal(geographyRegionKey(row.location,{view:'world',level:'adm1'}),'US');assert.equal(row.location.adm1Id,undefined);
 assert.equal(geographyRegionKey({country:'KR',basis:'nationality',adm3Id:'untrusted'},{view:'korea',level:'adm3'}),'KR');
});
test('local globe geometries contain real regional polygons and stable map keys',()=>{
 const read=name=>JSON.parse(fs.readFileSync(new URL('../public/data/maps/'+name+'.geojson',import.meta.url)));
 const world=read('world-adm1');assert.ok(world.features.length>4000);
 for(const key of ['adm1:US:US-CA','adm1:CN:CN-GD','adm1:JP:JP-23'])assert.ok(world.features.some(f=>f.properties.mapKey===key&&['Polygon','MultiPolygon'].includes(f.geometry.type)));
 const korea=read('korea-adm3');assert.ok(korea.features.length>3000);assert.ok(korea.features.some(f=>f.properties.mapKey==='kr3:1111053000'));
 assert.equal(new Set(korea.features.map(f=>f.properties.mapKey)).size,korea.features.length);
});
test('new globe controls have complete Korean, Japanese, English and Spanish copy',()=>{
 for(const [key,values] of Object.entries(MAP_COPY)){assert.equal(values.length,4);for(const lang of ['ko','ja','en','es'])assert.ok(mapCopy(key,lang));}
});
