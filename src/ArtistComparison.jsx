import React,{useEffect,useMemo,useState} from 'react';
import {artistRelations,compareArtistContent,comparisonMetrics} from './artist-comparison.js';
import {monthKey} from './lib.js';

export default function ArtistComparison({catalog,artist,clock,loadData,onArtist,onVideo}){
 const [targetId,setTargetId]=useState('');
 const [period,setPeriod]=useState('recent');
 const [year,setYear]=useState('');
 const [month,setMonth]=useState('');
 const [loaded,setLoaded]=useState(null);
 const [retry,setRetry]=useState(0);
 const groups=catalog.groups;
 const target=groups.find(group=>group.id===targetId&&group.id!==artist.id);
 const relations=useMemo(()=>artistRelations(groups,artist.id),[groups,artist.id]);
 const options=useMemo(()=>groups.filter(group=>group.id!==artist.id).sort((a,b)=>a.name.localeCompare(b.name)),[groups,artist.id]);
 const pair=useMemo(()=>target?[artist,target]:[],[artist,target]);
 useEffect(()=>{
  if(!pair.length)return;
  let active=true;
  Promise.all(pair.map(group=>loadData('groups/'+encodeURIComponent(group.id)+'.json')))
   .then(data=>{if(active)setLoaded({pair,retry,rows:data.flatMap(group=>group.items)});})
   .catch(()=>{if(active)setLoaded({pair,retry,error:true});});
  return()=>{active=false;};
 },[pair,retry,loadData]);
 const current=loaded?.pair===pair&&loaded.retry===retry?loaded:null;
 const result=useMemo(()=>current?.rows?compareArtistContent(current.rows,pair.map(group=>group.id),{
  recent:period==='recent',year:period==='custom'?year:'',month:period==='custom'?month:'',now:clock,
 }):null,[current,pair,period,year,month,clock]);
 const years=useMemo(()=>[...new Set((current?.rows||[]).flatMap(video=>!video.demo&&Number.isFinite(Date.parse(video.publishedAt))?[monthKey(video.publishedAt).slice(0,4)]:[]))].sort().reverse(),[current]);
 function selectTarget(id){
  setTargetId(id);
  setYear('');
  setMonth('');
 }
 return <section className="artist-comparison" aria-label="아티스트 관계망 및 콘텐츠 비교">
  <div className="artist-comparison-controls">
   <label>기준 아티스트<select value={artist.id} onChange={e=>onArtist(e.target.value)}>
    {[artist,...options].sort((a,b)=>a.name.localeCompare(b.name)).map(group=><option key={group.id} value={group.id} data-no-translate>{group.name}</option>)}
   </select></label>
   <label>비교 아티스트<select value={target?.id||''} onChange={e=>selectTarget(e.target.value)}>
    <option value="">아티스트 선택</option>{options.map(group=><option key={group.id} value={group.id} data-no-translate>{group.name}</option>)}
   </select></label>
   <label>기간<select value={period} onChange={e=>setPeriod(e.target.value)}><option value="recent">최근 90일</option><option value="all">전체 기간</option><option value="custom">연·월 선택</option></select></label>
   {period==='custom'&&<>
    <label>연도<select value={year} onChange={e=>setYear(e.target.value)}><option value="">전체 연도</option>{years.map(value=><option key={value}>{value}</option>)}</select></label>
    <label>월<select value={month} onChange={e=>setMonth(e.target.value)}><option value="">전체 월</option>{Array.from({length:12},(_,i)=><option key={i} value={String(i+1).padStart(2,'0')}>{i+1}월</option>)}</select></label>
   </>}
  </div>
  <div className="artist-analysis-columns">
  <section className="artist-analysis-card">
   <h3>아티스트 관계망</h3>
   <strong data-no-translate>{artist.name}</strong>
   {relations.length?<ul className="artist-relations">{relations.map(({artist:related,label})=><li key={related.id+label}>
    <div><small>{label}</small><button type="button" onClick={()=>onArtist(related.id)} data-no-translate>{related.name}</button></div>
    <button type="button" aria-label={related.name+' 비교 대상으로 선택'} aria-pressed={target?.id===related.id} onClick={()=>selectTarget(related.id)}>비교</button>
   </li>)}</ul>:<p>등록된 관계가 없습니다.</p>}
  </section>
  <section className="artist-analysis-card">
  <h3>콘텐츠 비교</h3>
  <p>SONAR 수집 영상 기준 · 유형 중복 집계 · 업로드 시각은 한국 시간 기준</p>
  {!target?<p>비교할 아티스트를 선택하세요.</p>:!current?<p role="status">비교 데이터를 불러오는 중…</p>:current.error?<div role="alert">비교 데이터를 불러오지 못했습니다. <button type="button" onClick={()=>setRetry(value=>value+1)}>다시 시도</button></div>:result&&<>
   <table className="artist-comparison-table">
    <caption>콘텐츠 유형별 수집 건수</caption>
    <thead><tr><th scope="col">콘텐츠 유형</th>{pair.map(group=><th key={group.id} scope="col"><span data-no-translate>{group.name}</span>{group.contentCount===0&&<small>수집 대기</small>}</th>)}</tr></thead>
    <tbody>{comparisonMetrics.map(([key,label])=><tr key={key}><th scope="row">{label}</th>{result.totals.map((total,index)=><td key={pair[index].id}>{total[key]}</td>)}</tr>)}</tbody>
   </table>
   <table className="artist-comparison-table">
    <caption>월별 업로드 추이</caption>
    <thead><tr><th scope="col">업로드 월</th>{pair.map(group=><th key={group.id} scope="col" data-no-translate>{group.name}</th>)}</tr></thead>
    <tbody>{result.months.length?result.months.map(entry=><tr key={entry.month}><th scope="row">{entry.month}</th>{entry.counts.map((count,index)=><td key={pair[index].id}>{count}</td>)}</tr>):<tr><td colSpan={3}>선택한 기간에 수집된 영상이 없습니다.</td></tr>}</tbody>
   </table>
   <details className="artist-shared-videos"><summary>공통 태그 영상 {result.shared.length}개</summary>
    {result.shared.length?<ul>{result.shared.map(video=><li key={video.id}><button type="button" onClick={()=>onVideo(video)} data-no-translate>{video.title}</button></li>)}</ul>:<p>선택한 기간에 공통 태그 영상이 없습니다.</p>}
   </details>
  </>}
  </section>
  </div>
 </section>;
}
