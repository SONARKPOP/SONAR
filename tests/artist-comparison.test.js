import test from 'node:test';
import assert from 'node:assert/strict';
import {artistRelations, compareArtistContent} from '../src/artist-comparison.js';

test('relationships can be followed in both directions and retain their meaning', () => {
 const old={id:'old'}, solo={id:'solo',previousGroupIds:['old','missing','old'],relatedGroupIds:['old','current']}, current={id:'current'};
 const groups=[old,solo,current];
 assert.deepEqual(artistRelations(groups,'old'),[{artist:solo,label:'이 그룹 출신'}]);
 assert.deepEqual(artistRelations(groups,'solo'),[{artist:old,label:'이전 소속 그룹'},{artist:current,label:'연결된 그룹'}]);
 assert.deepEqual(artistRelations(groups,'current'),[{artist:solo,label:'연결된 솔로 활동'}]);
});

test('comparison deduplicates shared videos and counts overlapping types in KST', () => {
 const shared={id:'shared',publishedAt:'2026-01-31T15:00:00Z',groupIds:['a','b'],category:'music',format:'short',contentTypes:['own','external']};
 const older={...shared,id:'older',publishedAt:'2026-01-31T14:59:59Z',groupIds:['a']};
 const demo={...shared,id:'demo',demo:true};
 const result=compareArtistContent([shared,shared,older,demo],['a','b'],{year:'2026',month:'02'});
 assert.deepEqual(result.totals,[{total:1,music:1,own:1,external:1,live:0,shorts:1},{total:1,music:1,own:1,external:1,live:0,shorts:1}]);
 assert.deepEqual(result.months,[{month:'2026-02',counts:[1,1]}]);
 assert.deepEqual(result.shared,[shared]);
});

test('comparison includes the start of the rolling window and excludes future items', () => {
 const row=(id,publishedAt)=>({id,publishedAt,groupIds:['a']});
 const result=compareArtistContent([
  row('start','2026-01-01T00:00:00Z'),
  row('before','2025-12-31T23:59:59Z'),
  row('future','2026-04-01T00:00:01Z'),
 ],['a','b'],{recent:true,now:Date.parse('2026-04-01T00:00:00Z')});
 assert.equal(result.totals[0].total,1);
 assert.deepEqual(result.months.map(entry=>entry.counts),[[1,0],[0,0],[0,0],[0,0]]);
});
