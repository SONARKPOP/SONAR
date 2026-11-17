import test from 'node:test';
import assert from 'node:assert/strict';
import {representativeAffiliations} from '../src/affiliation-policy.js';
import {personMatches} from '../src/person-directory.js';
import {careerTagsFor} from '../src/directory.js';
const groups=[{id:'4minute',name:'4Minute'},{id:'wonder-girls',name:'Wonder Girls'},{id:'refund-sisters',name:'환불원정대'},{id:'troublemaker',name:'Trouble Maker'},{id:'civa',name:'C.I.V.A'},{id:'ibi',name:'I.B.I'},{id:'madein',name:'MADEIN'},{id:'kep1er',name:'Kep1er'}];
test('manual representative choices preserve histories and former group search',()=>{
 const person={id:'hyuna',name:'HyunA',aliases:[],memberships:[{groupId:'4minute',name:'4Minute',status:'former'},{groupId:'wonder-girls',name:'Wonder Girls',status:'former'}],soloArtists:[]};
 const before=JSON.stringify(person);
 assert.deepEqual(representativeAffiliations(person,{groups}).map(r=>r.label),['전 4Minute']);
 assert.ok(personMatches(person,'Wonder Girls'));assert.equal(JSON.stringify(person),before);
 assert.deepEqual(careerTagsFor({id:'hyuna',artistType:'solo',relatedGroupIds:['4minute','wonder-girls']},groups).map(r=>r.label),['솔로','전 4Minute']);
});
test('short-term suppression is configurable and explicit exceptions stay visible',()=>{
 const person={membershipHistory:['refund-sisters','troublemaker','civa','ibi'].map(groupId=>({groupId,status:'former'}))};
 assert.deepEqual(representativeAffiliations(person,{groups}).map(r=>r.groupId),['civa','ibi']);
 assert.deepEqual(representativeAffiliations(person,{groups,policy:{groups:{}}}).map(r=>r.groupId),['refund-sisters','troublemaker','civa','ibi']);
});
test('current affiliations precede former affiliations and prefix localizes without changing names',()=>{
 const person={memberships:[{groupId:'kep1er',status:'former'},{groupId:'madein',status:'current'}]};
 assert.deepEqual(representativeAffiliations(person,{groups}).map(r=>r.label),['MADEIN','전 Kep1er']);
 for(const [language,prefix] of [['ja','元 '],['en','Former '],['es','Ex ']])assert.equal(representativeAffiliations(person,{groups,language})[1].label,prefix+'Kep1er');
});
