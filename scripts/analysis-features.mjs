import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {artistProfileRows,uniquePeople,analysisDate} from '../src/artist-insights.js';
import {affiliationCategories} from '../src/profile-statistics.js';
import {personDirectory} from '../src/person-directory.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=name=>JSON.parse(fs.readFileSync(path.join(root,'public/data',name),'utf8'));
const catalog=read('catalog.json'),activity=read('analysis-activity.json'),credits=read('music-credits.json');
const asOf=activity.asOf,date=analysisDate(asOf),people=uniquePeople(personDirectory(catalog));
const stats=new Map(artistProfileRows(catalog.groups,people,date).map(row=>[row.id,row]));
const observations=new Map(activity.artists.map(row=>[row.artistId,row]));
const works=new Map(credits.works.map(w=>[w.id,w])),recordings=new Map(credits.recordings.map(r=>[r.id,r]));
const creatorCount=artist=>{
 const songs=credits.songs.filter(s=>s.artistIds.includes(artist.id));if(!songs.length)return null;
 const ids=new Set();for(const song of songs){const work=works.get(song.workId);for(const role of ['composer','lyricist'])for(const id of work?.roles?.[role]||[])ids.add(id);for(const rid of song.recordingIds||[])for(const id of recordings.get(rid)?.roles?.arranger||[])ids.add(id);}return ids.size||null;
};
const rows=catalog.groups.map(artist=>{
 const row=stats.get(artist.id),observed=observations.get(artist.id)?.windows['30'];
 const knownTypes=observed&&observed.observedUploads>0&&observed.types.unclassified===0;
 const affiliations=affiliationCategories(artist);
 return {id:artist.id,name:artist.name,kind:artist.artistType==='solo'?'solo':'group',numeric:{
  meanAge:row?.birthDateCoverage>=.7?row.meanCurrentAge:null,medianAge:row?.birthDateCoverage>=.7?row.medianCurrentAge:null,
  ageStdDev:row?.birthDateCoverage>=.7?row.currentAgeStdDev:null,yearsSinceDebut:row?.yearsSinceDebut??null,currentMembers:row?.currentMembers??null,foreignNationalityShare:row?.nationalityCoverage>=.7?row.foreignNationalityShare:null,
  uploads30d:observed?.official??null,
  // Content-type proportions of an incomplete archive are not population proportions.
  shortsShare:null,
  liveShare:null,
  musicShare:null,
  // A partial reviewed catalog cannot establish an artist's career-wide diversity or self-credit rate.
  creditDiversity:null,selfCreditShare:null},
  categorical:{...affiliations,status:artist.groupStatus&&artist.groupStatus!=='unknown'?artist.groupStatus:null,multinational:row?.nationalityCoverage>=.7?(row.foreignNationalityShare>0?'foreign-nationality-present':'KR-only'):null},
  coverage:{birthDates:row?.birthDateCoverage??null,nationalities:row?.nationalityCoverage??null,official30d:observed?.officialCoverage||'uncollected',reviewedCreatorCount:creatorCount(artist),creditCatalogComplete:false}};
});
fs.writeFileSync(path.join(root,'public/data/analysis-features.json'),JSON.stringify({schemaVersion:1,asOf,referenceDate:date,policy:{minimumProfileCoverage:.7,missing:'null',creditFeatures:'excluded until artist catalog completeness is verified'},rows},null,2)+'\n');
console.log(JSON.stringify({rows:rows.length,asOf,ageRows:rows.filter(r=>r.numeric.meanAge!==null).length,completeOfficial30d:rows.filter(r=>r.numeric.uploads30d!==null).length}));
