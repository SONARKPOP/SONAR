import test from 'node:test';
import assert from 'node:assert/strict';
import {analyticsRows,activitySeries} from '../src/analysis-data.js';
test('activity ranking excludes all-zero and uncollected artists and preserves observed lower bounds',()=>{
 const make=(id,v)=>({artistId:id,windows:{30:{official:null,officialObserved:null,confirmed:null,inferred:null,member:null,...v}}});
 const data={artists:[make('none',{}),make('zero',{official:0,confirmed:0,inferred:0,member:0}),make('partial',{officialObserved:3,observedUploads:3}),make('outside',{inferred:4,observedUploads:4})]};
 const artists=['none','zero','partial','outside'].map(id=>({id,name:id}));const rows=analyticsRows(data,artists,30);
 assert.deepEqual(rows.map(r=>r.id),['outside','partial']);assert.equal(rows[1].officialPartial,true);assert.equal(analyticsRows(data,artists,30,'PARTIAL')[0].id,'partial');
});
test('unknown chart dates remain null and known official coverage can establish zero',()=>{
 const row={series:[{date:'2026-11-15',observedUploads:2,official:1}],windows:{7:{officialCoverage:'partial'}}};
 const points=activitySeries(row,7,'day','2026-11-16T00:00:00+09:00');assert.ok(points.some(p=>p.value===null));
 row.windows[7].officialCoverage='complete';assert.ok(activitySeries(row,7,'day','2026-11-16T00:00:00+09:00','official').some(p=>p.value===0));
 assert.equal(activitySeries(row,7,'month','2026-11-16T00:00:00+09:00')[0].partial,true);
});
test('type rankings reuse the same eligible artists and descend by observed category',()=>{
 const make=(id,n)=>({artistId:id,windows:{30:{official:null,officialObserved:1,observedUploads:1,types:{shorts:n}}}});
 assert.deepEqual(analyticsRows({artists:[make('a',1),make('b',4)]},[{id:'a',name:'A'},{id:'b',name:'B'}],30,'','type:shorts').map(r=>r.id),['b','a']);
});

test('external ranks merge confirmed and inferred while preserving detail',()=>{
 const data={artists:[{artistId:'a',windows:{30:{confirmed:2,inferred:3,types:{externalConfirmed:2,externalInferred:3}}}}]};
 const row=analyticsRows(data,[{id:'a',name:'A'}],30,'','external')[0];assert.equal(row.external,5);assert.equal(row.confirmed,2);assert.equal(row.inferred,3);
});
test('historic series is independent of ranking window and never extends official zero coverage',()=>{
 const row={series:[{date:'2026-01-01',observedUploads:4,official:0}],windows:{30:{series:[],officialCoverage:'complete'}}};
 const series=activitySeries(row,400,'month','2026-11-16T00:00:00+09:00');assert.equal(series.find(p=>p.date==='2026-01').value,4);
 const official=activitySeries(row,400,'day','2026-11-16T00:00:00+09:00','official');assert.equal(official.find(p=>p.date==='2026-01-01').value,null);assert.equal(official.at(-1).value,0);
});
