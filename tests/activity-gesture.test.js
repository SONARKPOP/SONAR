import test from 'node:test';
import assert from 'node:assert/strict';
import {gestureSnapshot,gestureViewport} from '../src/activity-gesture.js';
test('diagonal pinch uses Euclidean distance and preserves finite bounds',()=>{
 const points=new Map([[1,{x:0,y:0}],[2,{x:30,y:40}]]),baseline=gestureSnapshot(points,5,12);
 assert.equal(baseline.distance,50);points.set(2,{x:60,y:80});
 assert.deepEqual(gestureViewport(points,baseline,600,400),{count:6,offset:5});
});
test('removing a finger resets pan baseline without a jump',()=>{
 const points=new Map([[1,{x:10,y:0}],[2,{x:40,y:0}]]);
 points.delete(2);const baseline=gestureSnapshot(points,7,12);
 assert.deepEqual(gestureViewport(points,baseline,120,400),{count:12,offset:7});
 points.set(1,{x:30,y:0});assert.deepEqual(gestureViewport(points,baseline,120,400),{count:12,offset:9});
 points.clear();assert.equal(gestureViewport(points,baseline,120,400),null);
});
test('coincident pinch points and viewport edges remain finite',()=>{
 const points=new Map([[1,{x:0,y:0}],[2,{x:0,y:0}]]),baseline=gestureSnapshot(points,390,12);
 assert.deepEqual(gestureViewport(points,baseline,0,400),{count:12,offset:388});
 points.delete(2);assert.equal(gestureViewport(points,baseline,120,400),null);
});
