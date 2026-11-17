import test from 'node:test';
import assert from 'node:assert/strict';
import {stationChannels} from '../src/station-directory.js';
test('station directory uses registered official channels without live status or fresh feed',()=>{
 const channels=[{id:'bibi-official',official:true,platformId:'UC8GmeiLd5xjh2j5VmdePWQw',groupIds:['bibi']}];
 assert.equal(stationChannels(channels,{query:'BIBI'})[0].url,'https://www.youtube.com/channel/UC8GmeiLd5xjh2j5VmdePWQw/streams');
 assert.equal(stationChannels(channels,{excluded:['bibi']}).length,0);
 assert.equal(stationChannels([{...channels[0],official:false}]).length,0);
 assert.equal(stationChannels(channels,{query:'unknown'}).length,0);
});
