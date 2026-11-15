import React from 'react';
import {artistProfileRows,peopleForArtists,agencyHistory} from './artist-insights';
import {nationalityView} from './person-directory';
export default function ProfileStatistics({artists,people,date}){
 const scoped=peopleForArtists(artists,people),rows=artistProfileRows(artists,people,date),countries=new Map(),agencies=new Map();
 for(const p of scoped)for(const n of new Set((p.nationalities||[]).map(v=>nationalityView(v).name)))countries.set(n,(countries.get(n)||0)+1);
 for(const a of artists)for(const h of agencyHistory(a).filter(h=>h.status==='current'))agencies.set(h.name,(agencies.get(h.name)||0)+1);
 const cols=[['currentMembers','현재'],['formerMembers','이전'],['knownBirthDates','생일 확인'],['meanCurrentAge','평균'],['medianCurrentAge','중앙'],['minCurrentAge','최저'],['maxCurrentAge','최고'],['currentAgeStdDev','표준편차'],['meanDebutAge','데뷔 평균'],['yearsSinceDebut','데뷔 경과년'],['soloActivityMembers','솔로 활동']];
 return <section><p>기준일 {date} · 중복을 제거한 개인 {scoped.length}명 · 생년월일 등록 {scoped.filter(p=>p.birthDate).length}명</p><p className="analysis-note">나이는 확인된 생년월일만 사용합니다. 데뷔 당시 소속이 확인되지 않으면 데뷔 평균에서 제외합니다. 현재·과거 멤버와 그룹·솔로 데뷔는 별도로 계산합니다. 위키 최초 수집값이 포함되며 공식 검증 완료를 뜻하지 않습니다.</p><div className="analysis-table-wrap"><table className="analysis-table"><thead><tr><th>아티스트</th><th>생일 확인율</th>{cols.map(([key,label])=><th key={key}>{label}</th>)}</tr></thead><tbody>{rows.map(r=><tr key={r.id}><th>{r.name}</th><td>{r.birthDateCoverage==null?'—':`${Math.round(r.birthDateCoverage*100)}%`}</td>{cols.map(([key])=><td key={key}>{r[key]??'—'}</td>)}</tr>)}</tbody></table></div><div className="analysis-distributions"><section><h3>국적 분포</h3><p>복수 국적은 각각 포함합니다. 출생지와 별개입니다.</p>{[...countries].sort((a,b)=>b[1]-a[1]).map(([n,c])=><p key={n}>{n} <b>{c}</b></p>)}</section><section><h3>현재 소속사 구성</h3>{[...agencies].sort((a,b)=>b[1]-a[1]).map(([n,c])=><p key={n}>{n} <b>{c}</b></p>)}</section></div></section>;
}
