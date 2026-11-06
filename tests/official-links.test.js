import test from 'node:test';
import assert from 'node:assert/strict';
import {officialLinksFor,validOfficialLink} from '../src/official-links.js';
test('official shortcuts retain reviewed platforms and omit unresolved, unavailable or unrelated YouTube channels',()=>{
 const artist={id:'a',officialLinks:[{platform:'weverse',url:'https://weverse.io/a'},{platform:'berriz',url:'https://link.berriz.in/web/main/a'},{platform:'x',url:'https://x.com/a'}]};
 const channels=[{id:'ok',official:true,groupIds:['a'],platformId:'UC123'},{official:true,groupIds:['a'],platformId:'UC404',unavailableReason:'channel-not-found'},{official:true,groupIds:['a'],handle:'@pending'},{official:false,groupIds:['a'],platformId:'UCexternal'},{official:true,groupIds:['b'],platformId:'UCother'}];
 assert.deepEqual(officialLinksFor(artist,channels).map(l=>l.platform),['youtube','weverse','berriz','x']);
});
test('invalid links and duplicate destinations cannot become official shortcuts',()=>{
 for(const url of ['javascript:alert(1)','http://x.com/a','https://x.com.evil.test/a','https://user:pass@x.com/a'])assert.equal(validOfficialLink({platform:'x',url}),false);
 const link={platform:'x',url:'https://x.com/a'};
 assert.equal(officialLinksFor({id:'a',officialLinks:[link,link,{platform:'weverse',url:'https://example.com/a'}]}).length,1);
});

