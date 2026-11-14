import test from 'node:test';
import assert from 'node:assert/strict';
import {personDirectory,nationalityView,legalNamesFor,personMatches} from '../src/person-directory.js';

test('unloaded catalog keeps all directory views empty without crashing',()=>{
 assert.equal(personDirectory(null).members.length,0);
 assert.equal(personDirectory(null).solos.length,0);
});

test('member and solo views reuse the same person without name-based merging',()=>{
 const catalog={groups:[{id:'g',name:'Group',debutYear:2010},{id:'s',name:'Solo',artistType:'solo',relatedMemberIds:['m'],relatedGroupIds:['g'],debutYear:2020},
  {id:'indie',name:'Indie',artistType:'solo'}],members:[{id:'m',name:'Same',groupId:'g',birthDate:'2000-01-02'},
  {id:'m2',name:'Same',groupId:'g',membershipHistory:[{groupId:'g',status:'former'}]}]};
 const data=personDirectory(catalog);
 assert.equal(data.members.length,2);assert.equal(data.solos.length,2);
 assert.equal(data.solos.find(p=>p.soloIds.includes('s')).personId,'m');
 assert.equal(data.solos.find(p=>p.soloIds.includes('s')).birthDate,'2000-01-02');
 assert.equal(data.solos.find(p=>p.soloIds.includes('indie')).personId,'indie');
 assert.equal(data.members.find(p=>p.personId==='m2').memberships[0].status,'former');
 assert.equal(data.solos.find(p=>p.personId==='m').soloDebuts[0].date,null);
 assert.equal(data.solos.find(p=>p.personId==='m').soloDebuts[0].year,2020);
 assert.equal(personMatches(data.members[0],'Group'),true);
});

test('dual nationality and official native names preserve language and no guesses',()=>{
 assert.deepEqual(nationalityView('JP'),{code:'JP',flag:'🇯🇵',name:'일본'});
 assert.equal(nationalityView('unknown').flag,'');
 const names=legalNamesFor({legalNames:{ja:'湊﨑紗夏',en:'Minatozaki Sana'},preferredLegalNameLanguages:['ja','en']});
 assert.deepEqual(names.map(v=>v.lang),['ja','en']);assert.equal(names[0].text,'湊﨑紗夏');
 assert.deepEqual(legalNamesFor({name:'Stage'}),[]);
});

test('sourced solo profile fills missing member fields without replacing identity or known birth date',()=>{
 const catalog={groups:[{id:'g',name:'Group'},{id:'s',name:'Solo',artistType:'solo',relatedMemberIds:['m'],
  personProfile:{id:'different',birthDate:'1999-01-01',legalNames:{ja:'公式名'},nationalities:['JP']}}],
  members:[{id:'m',name:'Stage',groupId:'g',birthDate:'2000-01-02'}]};
 const before=JSON.stringify(catalog),row=personDirectory(catalog).solos[0];
 assert.equal(row.personId,'m');assert.equal(row.id,'m');assert.equal(row.birthDate,'2000-01-02');
 assert.equal(row.legalNames.ja,'公式名');assert.deepEqual(row.nationalities,['JP']);
 assert.equal(JSON.stringify(catalog),before);
});
