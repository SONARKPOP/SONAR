import React,{lazy,Suspense,useEffect,useState} from 'react';
import {BarChart3} from 'lucide-react';
import {uniquePeople,favoriteArtistIds,analysisDate,comparisonRows} from './artist-insights';
import {personDirectory} from './person-directory';
import {localize,useLanguage} from './i18n';
import ActivityAnalysis from './ActivityAnalysis';
import ProfileStatistics from './ProfileStatistics';
import MusicCredits from './MusicCredits';
const BirthplaceMaps=lazy(()=>import('./BirthplaceMaps'));
import MultivariateAnalysis from './MultivariateAnalysis';
import './unified-artists.css';
import './analysis.css';
const files={activity:'analysis-activity.json',credits:'music-credits.json',advanced:'multivariate.json',legacy:'activity-comparison.json'};
export default function AnalysisPage({catalog,load,favorites={},mode="analysis",onCalendar}){
 const language=useLanguage(),[data,setData]=useState({}),[failed,setFailed]=useState([]),[tab,setTab]=useState(mode==='records'?'activity':'profiles'),[scope,setScope]=useState('all'),[kind,setKind]=useState('all'),[legacyWindow,setLegacyWindow]=useState('uploads_14d');
 useEffect(()=>{setTab(mode==='records'?'activity':'profiles');},[mode]);
 useEffect(()=>{let stopped=false;setFailed([]);Promise.allSettled(Object.entries(mode==='records'?{activity:files.activity,legacy:files.legacy}:files).map(async([key,file])=>{try{const value=await load(file);if(!stopped)setData(previous=>({...previous,[key]:value}));}catch{if(!stopped)setFailed(previous=>[...previous,key]);}}));return()=>{stopped=true;};},[load,catalog.updatedAt,mode]);
 const ids=new Set(favoriteArtistIds(catalog,Object.values(favorites).flat())),artists=catalog.groups.filter(a=>(scope==='all'||ids.has(a.id))&&(kind==='all'||(a.artistType==='solo')===(kind==='solo'))),people=uniquePeople(personDirectory(catalog));
 const asOf=data.activity?.asOf||catalog.contentUpdatedAt||catalog.updatedAt,date=analysisDate(asOf);
 const legacy=comparisonRows(data.legacy,artists,legacyWindow);
 return localize(<section className="analysis-page unified-artists"><header className="unified-heading"><div><small>SONAR INSIGHTS</small><h2><BarChart3 size={23}/> {mode==='records'?'기록 · 활동량':'분석'}</h2></div></header><nav className="analysis-controls" aria-label="분석 화면">{(mode==='records'?[['calendar','캘린더'],['activity','활동량']]:[['profiles','아티스트 통계'],['credits','음악 크레딧'],['maps','출생지 지도'],['advanced','PCA · FAMD · 군집']]).map(([id,label])=><button key={id} aria-pressed={tab===id} onClick={()=>id==='calendar'?onCalendar?.():setTab(id)}>{label}</button>)}</nav><div className="analysis-controls">{[['all','전체'],['favorites','선호그룹']].map(([id,label])=><button key={id} aria-pressed={scope===id} onClick={()=>setScope(id)}>{label}</button>)}<select aria-label="분석 대상 유형" value={kind} onChange={e=>setKind(e.target.value)}><option value="all">그룹 · 솔로</option><option value="group">그룹</option><option value="solo">솔로</option></select><span>{artists.length}개 아티스트</span></div><p className="analysis-note">집계 기준 {asOf?new Date(asOf).toLocaleString(language,{timeZone:'Asia/Seoul'}):'미확인'} KST · 미확인 값은 —로 표시합니다.</p>
 {failed.includes(tab)&&<p role="status">해당 분석 자료를 불러오지 못했습니다. 기존 자료는 유지됩니다.</p>}
 {tab==='activity'&&<><ActivityAnalysis data={data.activity} artists={artists}/>{mode==='records'&&<details><summary>기존 단기 비교 통계</summary><select aria-label="단기 집계 기간" value={legacyWindow} onChange={e=>setLegacyWindow(e.target.value)}>{[["uploads_24h","24시간"],["uploads_3d","3일"],["uploads_14d","14일"]].map(([id,label])=><option key={id} value={id}>{label}</option>)}</select>{legacy.filter(r=>[r.official,r.confirmed,r.inferred,r.member].some(v=>v>0)).map(r=><p key={r.id}>{r.name} · 공식 {r.official??'—'} · 외부 확인 {r.confirmed??'—'} · 추정 {r.inferred??'—'} · 개인 {r.member??'—'}</p>)}</details>}</>}
 {mode==='analysis'&&tab==='profiles'&&<ProfileStatistics artists={artists} people={people} date={date}/>}
 {mode==='analysis'&&tab==='credits'&&<MusicCredits data={data.credits} catalog={{...catalog,groups:artists}}/>}
 {mode==='analysis'&&tab==='maps'&&<Suspense fallback={<p role="status">지도를 준비하는 중…</p>}><BirthplaceMaps catalog={{...catalog,groups:artists}}/></Suspense>}
 {mode==='analysis'&&tab==='advanced'&&<><p className="analysis-note">고급 분석은 전체 데이터의 고정된 기준일로 계산합니다. 위 선호그룹 필터는 재학습에 사용하지 않습니다. 그룹과 솔로는 별도로 비교하며 군집은 우열을 뜻하지 않습니다.</p><MultivariateAnalysis data={data.advanced}/></>}
 </section>,language);
}
