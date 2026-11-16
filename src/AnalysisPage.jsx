import React,{lazy,Suspense,useEffect,useState} from 'react';
import {BarChart3} from 'lucide-react';
import {uniquePeople,favoriteArtistIds,analysisDate,comparisonRows} from './artist-insights';
import {personDirectory} from './person-directory';
import {localize,useLanguage,formatMessage} from './i18n';
import ActivityAnalysis from './ActivityAnalysis';
import ProfileStatistics from './ProfileStatistics';
const BirthplaceMaps=lazy(()=>import('./BirthplaceMaps'));
import AnalysisArtistFilters from './AnalysisArtistFilters';
import {ANALYSIS_TABS,analysisDataFiles,analysisYearOptions,filterAnalysisArtists} from './analysis-filters';
import {ACTIVE_BROWSE_STATES,activityView} from './youtube-activity';
import './unified-artists.css';
import './analysis.css';
export default function AnalysisPage({catalog,load,favorites={},mode="analysis",now=Date.now()}){
 const language=useLanguage(),[data,setData]=useState({}),[failed,setFailed]=useState([]),[tab,setTab]=useState(mode==='records'?'activity':'profiles'),[filters,setFilters]=useState({scope:'all',kind:'all',year:'',step:1,states:[]}),[legacyWindow,setLegacyWindow]=useState('uploads_14d');
 useEffect(()=>{setTab(mode==='records'?'activity':'profiles');},[mode]);
 useEffect(()=>{let stopped=false;setFailed([]);Promise.allSettled(Object.entries(analysisDataFiles(tab)).map(async([key,file])=>{try{const value=await load(file);if(!stopped)setData(previous=>({...previous,[key]:value}));}catch{if(!stopped)setFailed(previous=>[...previous,key]);}}));return()=>{stopped=true;};},[load,catalog.updatedAt,tab]);
 const ids=favoriteArtistIds(catalog,Object.values(favorites).flat()),base=filterAnalysisArtists(catalog.groups,{favoriteIds:filters.scope==='all'?null:ids,kind:filters.kind});
 const byYear=filterAnalysisArtists(base,{year:filters.year,step:filters.step}),artists=tab==='profiles'?filterAnalysisArtists(byYear,{states:filters.states,now}):base,people=uniquePeople(personDirectory(catalog));
 const stateCounts=Object.fromEntries(ACTIVE_BROWSE_STATES.map(state=>[state,byYear.filter(a=>activityView(a,now)?.state===state).length]));
 const asOf=data.activity?.asOf||catalog.contentUpdatedAt||catalog.updatedAt,date=analysisDate(asOf);
 const legacy=comparisonRows(data.legacy,artists,legacyWindow);
 return localize(<section className="analysis-page unified-artists"><header className="unified-heading"><div><small>SONAR INSIGHTS</small><h2><BarChart3 size={23}/> 분석</h2></div></header><nav className="analysis-controls" aria-label="분석 화면">{ANALYSIS_TABS.map(([id,label])=><button type="button" key={id} aria-pressed={tab===id} onClick={()=>setTab(id)}>{label}</button>)}</nav><AnalysisArtistFilters filters={filters} onChange={setFilters} profile={tab==='profiles'} years={analysisYearOptions(base,filters.step)} stateCounts={stateCounts} total={artists.length}/><p className="analysis-note">{formatMessage('집계 기준 {date} KST · 미확인 값은 —로 표시합니다.',{date:asOf?new Date(asOf).toLocaleString(language,{timeZone:'Asia/Seoul'}):'—'},language)}</p>
 {failed.includes(tab)&&<p role="status">해당 분석 자료를 불러오지 못했습니다. 기존 자료는 유지됩니다.</p>}
 {tab==='activity'&&<><ActivityAnalysis data={data.activity} artists={artists}/><details><summary>기존 단기 비교 통계</summary><select aria-label="단기 집계 기간" value={legacyWindow} onChange={e=>setLegacyWindow(e.target.value)}>{[["uploads_24h","24시간"],["uploads_3d","3일"],["uploads_14d","14일"]].map(([id,label])=><option key={id} value={id}>{label}</option>)}</select>{legacy.filter(r=>[r.official,r.confirmed,r.inferred,r.member].some(v=>v>0)).map(r=><p key={r.id}>{formatMessage('{name} · 공식 {official} · 외부 확인 {confirmed} · 추정 {inferred} · 개인 {member}',{name:r.name,official:r.official??'—',confirmed:r.confirmed??'—',inferred:r.inferred??'—',member:r.member??'—'},language)}</p>)}</details></>}
 {tab==='profiles'&&<ProfileStatistics artists={artists} people={people} date={date}/>}
 {tab==='maps'&&<Suspense fallback={<p role="status">지도를 준비하는 중…</p>}><BirthplaceMaps catalog={{...catalog,groups:artists}}/></Suspense>}
 </section>,language);
}
