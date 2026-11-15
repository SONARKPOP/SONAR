import React,{useState} from 'react';
import {ACTIVITY_TYPES,activitySeries} from './analysis-data';
export default function ActivityCharts({row,days,asOf}){
 const [bucket,setBucket]=useState('day'),[metric,setMetric]=useState('observedUploads');
 const series=activitySeries(row,days,bucket,asOf,metric),known=series.filter(p=>p.value!==null),max=Math.max(1,...known.map(p=>p.value));
 const width=760,height=210,x=i=>42+i/Math.max(1,series.length-1)*(width-64),y=n=>height-28-n/max*(height-55);
 const parts=[];let segment=[];
 series.forEach((p,i)=>{if(p.value===null){if(segment.length)parts.push(segment);segment=[];}else segment.push([x(i),y(p.value)]);});if(segment.length)parts.push(segment);
 const bars=row.windows[String(days)].types,barMax=Math.max(1,...Object.values(bars));
 return <section className="activity-detail" aria-label={`${row.name} 활동량 상세`}>
  <div className="analysis-controls"><label>집계 단위<select value={bucket} onChange={e=>setBucket(e.target.value)}><option value="day">일별</option><option value="week">주별</option><option value="month">월별</option></select></label><label>선 그래프<select value={metric} onChange={e=>setMetric(e.target.value)}><option value="observedUploads">관측 업로드</option><option value="official">공식 채널 기록</option></select></label></div>
  <p className="analysis-note">빈 날짜는 미확인으로 선을 끊습니다. 주·월은 관측값의 합계이며, 공식 수집 범위가 확인된 기간만 빈 날짜를 0으로 표시합니다.</p>
  {known.length?<svg className="analysis-line-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${row.name} ${days}일 업로드 추이`}>
   {[0,max/2,max].map(n=><g key={n}><line x1="42" x2={width-20} y1={y(n)} y2={y(n)} stroke="currentColor" opacity=".13"/><text x="35" y={y(n)+4} textAnchor="end">{n.toFixed(n%1?1:0)}</text></g>)}
   {parts.map((points,i)=><polyline key={i} points={points.map(p=>p.join(',')).join(' ')} fill="none" stroke="#63a6d4" strokeWidth="2.5"/>)}
   {series.map((p,i)=>p.value!==null?<circle key={p.date} cx={x(i)} cy={y(p.value)} r="3.5" fill={p.partial?'#eab308':'#63a6d4'}><title>{p.date}: {p.partial?'관측 하한 ':''}{p.value}</title></circle>:null)}
   {series.filter((_,i)=>i===0||i===series.length-1||i===Math.floor(series.length/2)).map(p=><text key={p.date} x={x(series.indexOf(p))} y={height-7} textAnchor="middle">{p.date}</text>)}
  </svg>:<p>이 기간에 확인된 시계열 자료가 없습니다.</p>}
  <div className="analysis-type-bars">{Object.entries(ACTIVITY_TYPES).map(([key,label])=><div key={key}><span>{label}</span><div><i style={{width:`${bars[key]/barMax*100}%`}}/></div><b>{bars[key]}</b></div>)}</div>
  <p className="analysis-note">유형 막대는 관측 영상만 집계하며 Shorts → LIVE → 음악방송 → 라디오 → 음악 → 기타 순으로 한 번씩 분류합니다.</p>
  <p>공식 일평균 {row.officialPerDayMean?.toFixed(2)??"—"}개 · 일별 업로드 표준편차 {row.officialPerDayStdDev?.toFixed(2)??"—"} · 수집 범위가 확인된 기간만 계산합니다.</p><p>개별 업로드 {row.observedUploads}개 · 출연 묶음 확인 {row.linkedAppearanceEvents}건 · 출연 연결 대기 {row.unlinkedAppearanceUploads}개</p>
  <p className="analysis-note">출연·이벤트 ID가 명시된 파생 영상만 묶습니다. 제목이 비슷하다는 이유로 같은 출연으로 합치지 않습니다. 출연 연결 대기가 있으면 총 출연 수는 미확정입니다.</p>
 </section>;
}
