import test from 'node:test';
import assert from 'node:assert/strict';
import {activityView,ACTIVITY_META} from '../src/youtube-activity.js';
const now=Date.parse('2026-11-07T12:00:00Z'),day=86400000;
const group=(age,count=1)=>({youtubeActivity:{activity_status:'COASTING',checked_at:new Date(now).toISOString(),last_upload_at:new Date(now-age).toISOString(),uploads:Array.from({length:count},(_,i)=>({id:String(i),at:new Date(now-age).toISOString()}))}});
test('all five icons and exact transitions use English names',()=>{
 assert.equal(activityView(group(0,3),now).state,'SURGE');
 assert.equal(activityView(group(3*day),now).state,'SAILING');
 assert.equal(activityView(group(3*day+1),now).state,'COASTING');
 assert.equal(activityView(group(90*day),now).state,'ANCHORED');
 assert.equal(activityView(group(365*day),now).state,'LOST SIGNAL');
 assert.equal(Object.keys(ACTIVITY_META).length,5);
});
test('unknown and stale data have no icon; duplicate IDs count once',()=>{
 assert.equal(activityView({},now),null);
 const g=group(0,1);g.youtubeActivity.uploads.push(g.youtubeActivity.uploads[0]);
 assert.equal(activityView(g,now).uploads7d,1);
 assert.equal(activityView(g,now+25*3600000),null);
});
