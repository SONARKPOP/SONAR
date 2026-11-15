import React,{useEffect,useMemo,useState} from 'react';
import {BarChart3} from 'lucide-react';
import {agencyHistory,comparisonRows,uniquePeople,groupDemographics,favoriteArtistIds} from './artist-insights';
import {personDirectory,nationalityView} from './person-directory';
import {localize,useLanguage} from './i18n';
import './unified-artists.css';
export default function AnalysisPage({catalog,load,favorites}){
 const language=useLanguage(),[data,setData]=useState(null),[failed,setFailed]=useState(false),[window,setWindow]=useState('uploads_7d'),[scope,setScope]=useState('all'),[kind,setKind]=useState('all');
 useEffect(()=>{let stopped=false;load('activity-comparison.json').then(value=>{if(!stopped)setData(value);}).catch(()=>{if(!stopped)setFailed(true);});return()=>{stopped=true;};},[load,catalog.updatedAt]);
 const ids=new Set(favoriteArtistIds(catalog,Object.values(favorites).flat()));
 const artists=catalog.groups.filter(artist=>(scope==='all'||ids.has(artist.id))&&(kind==='all'||(kind==='solo')===(artist.artistType==='solo')));
 const rows=useMemo(()=>comparisonRows(data,artists,window).sort((a,b)=>(b.official??-1)-(a.official??-1)||(b.confirmed??-1)-(a.confirmed??-1)),[data,artists,window]);
 const max=Math.max(1,...rows.flatMap(row=>[row.official||0,row.confirmed||0]));
 const people=uniquePeople(personDirectory(catalog));
 const demographics=groupDemographics(artists,people).filter(row=>row.knownBirthDates);
 const nationalities=new Map();
 for(const person of people)for(const country of new Set((person.nationalities||[]).map(value=>nationalityView(value,language)).map(value=>value.code||value.name))){nationalities.set(country,(nationalities.get(country)||0)+1);}
 const agencyGroups=new Map();
 for(const artist of catalog.groups)for(const agency of agencyHistory(artist).filter(a=>a.status==='current')){
  if(!agencyGroups.has(agency.agencyId||agency.name))agencyGroups.set(agency.agencyId||agency.name,{name:agency.name,ids:new Set()});
  agencyGroups.get(agency.agencyId||agency.name).ids.add(artist.id);
 }
 return localize(<section className="analysis-page unified-artists"><header className="unified-heading"><div><small>SONAR INSIGHTS</small><h2><BarChart3 size={23}/> 활동량·분석</h2></div></header>
  <p>공식 업로드와 외부 출연은 별도 집계합니다.</p>
  <div className="unified-filter-row">{[['favorites','선호그룹'],['all','전체']].map(([id,label])=><button key={id} aria-pressed={scope===id} onClick={()=>setScope(id)}>{label}</button>)}{[['uploads_24h','24시간'],['uploads_3d','3일'],['uploads_7d','7일'],['uploads_14d','14일']].map(([id,label])=><button key={id} aria-pressed={window===id} onClick={()=>setWindow(id)}>{label}</button>)}</div>
  <div className="unified-filter-row">{[['all','전체 아티스트'],['group','그룹'],['solo','솔로 활동']].map(([id,label])=><button key={id} aria-pressed={kind===id} onClick={()=>setKind(id)}>{label}</button>)}</div>
  <p className="analysis-note">외부 출연은 수집된 아카이브 기준입니다. 미수집·만료 통계는 —로 표시합니다.</p>
  {data?.generatedAt&&<p className="analysis-note"><span>집계 시각</span> <time dateTime={data.generatedAt}>{new Intl.DateTimeFormat(language,{dateStyle:'medium',timeStyle:'medium',timeZone:'Asia/Seoul'}).format(new Date(data.generatedAt))} KST</time></p>}
  {failed&&<p role="status">비교 데이터가 아직 없습니다. 다음 수집 후 표시됩니다.</p>}
  <div className="analysis-table-wrap"><table className="analysis-table"><caption>공식 업로드 · 확인된 외부 출연 · 추정 출연</caption><thead><tr>{['아티스트','공식 업로드','확인된 외부 출연','추정 출연','멤버 단독 활동'].map(text=><th key={text} scope="col">{text}</th>)}</tr></thead><tbody>{rows.map(row=><tr key={row.id}><th scope="row" data-no-translate>{row.name}</th>{['official','confirmed','inferred','member'].map(key=><td key={key}><span className={'analysis-bar '+key} style={{'--bar-width':`${(row[key]||0)/max*100}%`}}/><b>{row[key]??'—'}</b></td>)}</tr>)}</tbody></table></div>
  {!rows.length&&<p>선호 아티스트를 추가하거나 전체를 선택하세요.</p>}
  <section className="analysis-profile"><h3>프로필 데이터 범위</h3><div className="analysis-metrics"><div><b>{people.length}</b><span>개인 ID</span></div><div><b>{people.filter(p=>p.birthDate).length}</b><span>생년월일 확인</span></div><div><b>{catalog.groups.filter(g=>agencyHistory(g).length).length}</b><span>소속사 이력 확인</span></div></div><p>확인된 정보만 분석에 사용합니다.</p></section>
  <section className="analysis-profile"><h3>멤버 연령</h3><p>일부 멤버만 확인된 평균은 그룹 전체를 대표하지 않습니다. 데뷔 당시 합류가 확인된 경우만 데뷔 평균을 계산합니다.</p><div className="analysis-table-wrap"><table className="analysis-table"><thead><tr>{['그룹','생년월일 확인 / 현재 멤버','현재 평균 만 나이','데뷔 평균 만 나이','연령 차이'].map(label=><th key={label} scope="col">{label}</th>)}</tr></thead><tbody>{demographics.map(row=><tr key={row.id}><th data-no-translate scope="row">{row.name}</th><td>{row.knownBirthDates} / {row.currentMembers}</td><td>{row.meanCurrentAge??'—'}</td><td>{row.meanDebutAge??'—'}</td><td>{row.ageRange??'—'}</td></tr>)}</tbody></table></div></section>
  <section className="analysis-agencies"><h3>등록 개인 국적 구성</h3><p className="analysis-note">복수 국적은 각 국적에 포함합니다. 미확인 국적은 제외합니다.</p>{[...nationalities].sort((a,b)=>b[1]-a[1]).map(([code,count])=>{const country=nationalityView(code,language);return <div key={code}><b>{country.flag} {country.name}</b><span>{count}</span></div>;})}</section>
  <section className="analysis-agencies"><h3>현재 소속사별 등록 아티스트</h3>{[...agencyGroups.values()].sort((a,b)=>b.ids.size-a.ids.size).map(row=><div key={row.name}><b data-no-translate>{row.name}</b><span>{row.ids.size}</span></div>)}</section>
 </section>,language);
}
