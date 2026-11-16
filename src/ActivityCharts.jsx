import React,{useRef,useState} from 'react';
import {gestureSnapshot,gestureViewport} from './activity-gesture';
import {ACTIVITY_TYPES,activitySeries,activityTypeCounts} from './analysis-data';
export default function ActivityCharts({row,days,asOf}){
 const [bucket,setBucket]=useState('day'),[metric,setMetric]=useState('observedUploads'),[count,setCount]=useState(12),[offset,setOffset]=useState(0);
 const gesture=useRef(new Map()),baseline=useRef(null);
 const series=activitySeries(row,row.seriesDays||400,bucket,asOf,metric),end=Math.max(count,series.length-offset),visible=series.slice(Math.max(0,end-count),end),max=Math.max(1,...visible.map(p=>p.value??0));
 const move=n=>setOffset(v=>Math.max(0,Math.min(Math.max(0,series.length-count),v+n)));
 const zoom=n=>setCount(v=>Math.max(4,Math.min(series.length,Math.round(v*n))));
 function start(e){
  if((e.pointerType==='mouse'&&e.button!==0)||e.target.closest('button,input,select,a'))return;
  gesture.current.set(e.pointerId,{x:e.clientX,y:e.clientY});baseline.current=gestureSnapshot(gesture.current,offset,count);
 }
 function drag(e){
  if(!gesture.current.has(e.pointerId))return;
  gesture.current.set(e.pointerId,{x:e.clientX,y:e.clientY});
  const b=baseline.current;if(!b)return;
  if(gesture.current.size===1&&Math.hypot(e.clientX-b.x,e.clientY-b.y)<5)return;
  if(!e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.setPointerCapture(e.pointerId);
  const next=gestureViewport(gesture.current,b,e.currentTarget.clientWidth,series.length);
  if(next){setCount(next.count);setOffset(next.offset);}
 }
 function stop(e){
  gesture.current.delete(e.pointerId);
  baseline.current=gesture.current.size?gestureSnapshot(gesture.current,offset,count):null;
 }
 const types=activityTypeCounts(row.windows[String(days)].types);
 return <section className="activity-detail" aria-label={`${row.name} 활동량 상세`}>
 <div className="analysis-controls"><label>집계 단위<select value={bucket} onChange={e=>{setBucket(e.target.value);setCount(12);setOffset(0);}}><option value="day">일별</option><option value="week">주별</option><option value="month">월별</option></select></label><label>업로드 추이<select value={metric} onChange={e=>setMetric(e.target.value)}><option value="observedUploads">관측 업로드</option><option value="official">공식 채널 기록</option></select></label><button onClick={()=>move(count)} disabled={offset>=series.length-count}>이전</button><button onClick={()=>move(-count)} disabled={!offset}>최근</button><button aria-label="기간 확대" onClick={()=>zoom(.75)}>＋</button><button aria-label="기간 축소" onClick={()=>zoom(1.25)}>−</button><button onClick={()=>{setCount(12);setOffset(0);}}>최근 12구간</button></div>
 <p className="analysis-note">좌우로 드래그해 이전 날짜를 보고 두 손가락으로 확대·축소합니다. 빗금은 미확인, ≥는 일부만 관측된 합계입니다. 수집 범위가 확인된 공식 기간에만 0을 표시합니다.</p>
 <div className="activity-timeline" onPointerDown={start} onPointerMove={drag} onPointerUp={stop} onPointerCancel={stop} onLostPointerCapture={stop} onPointerLeave={e=>{if(!e.currentTarget.hasPointerCapture(e.pointerId))stop(e);}}>
 <div className="activity-timeline-bars" role="img" aria-label={`${row.name} ${visible[0]?.date||''}부터 ${visible.at(-1)?.date||''}까지 업로드 막대 그래프`}>
 {visible.map(p=><div className={`activity-timeline-bin ${p.value===null?'unknown':''}`} key={p.date} title={`${p.date}: ${p.value===null?'미확인':`${p.partial?'≥ ':''}${p.value}`}`}><span className="activity-timeline-number">{p.value===null?'—':`${p.partial?'≥':''}${p.value}`}</span><div className="activity-timeline-track">{p.value!==null&&<i style={{height:`${p.value/max*100}%`}}/>}</div><span className="activity-timeline-date">{p.date}</span></div>)}
 </div></div>
 <p className="analysis-note">보관된 기록 최대 {row.seriesDays||400}일을 탐색합니다. 과거 자료가 없는 구간은 미확인으로 남습니다. 외부 출연 확인 {row.confirmed??'—'}개 · 추정 {row.inferred??'—'}개</p>
 <dl className="activity-type-numbers">{Object.entries(ACTIVITY_TYPES).map(([key,label])=><div key={key}><dt>{label}</dt><dd>{types[key]??0}</dd></div>)}</dl>
 <p className="analysis-note">유형은 중복 없이 집계합니다. Shorts → LIVE → 음악방송 → 라디오 → 음악 → 공식·외부 순입니다.</p>
 <details><summary>개인 활동 · {row.member??'—'}개</summary>{row.windows[String(days)].members?.length?<ul>{row.windows[String(days)].members.map(m=><li key={m.memberId}>{m.name} · {m.count}개</li>)}</ul>:<p>멤버별 ID 연결 자료가 없습니다.</p>}<p className="analysis-note">명시된 멤버 ID를 기준으로 집계하며, 여러 멤버가 연결된 영상은 각 멤버에 포함됩니다.</p></details>
 <p>공식 일평균 {row.officialPerDayMean?.toFixed(2)??'—'}개 · 일별 업로드 표준편차 {row.officialPerDayStdDev?.toFixed(2)??'—'}</p><p>개별 업로드 {row.observedUploads}개 · 출연 묶음 확인 {row.linkedAppearanceEvents}건 · 출연 연결 대기 {row.unlinkedAppearanceUploads}개</p><p className="analysis-note">명시된 출연·이벤트 ID만 묶습니다. 제목 유사성으로 합치지 않습니다.</p>
 </section>;
}
