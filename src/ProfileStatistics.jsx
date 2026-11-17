import React,{useState,useEffect,useRef} from 'react';
import {peopleForArtists} from './artist-insights';
import {nationalityView} from './person-directory';
import {profileRows,sortProfileRows,formatDebutElapsed} from './profile-statistics';
import './profile-statistics.css';
import {PROFILE_COLUMNS,normalizeProfileColumns,loadProfileColumns,saveProfileColumns,moveProfileColumn,visibleProfileColumns,profileColumnGroups} from './profile-columns';
import {useLanguage,localize,formatMessage} from './i18n';
import {analysisLocale,formatAnalysisDate} from './analysis-translations';

export default function ProfileStatistics({artists,people,date}){
 const language=useLanguage(),locale=analysisLocale(language),t=(key,values={})=>formatMessage(key,values,language),dateText=value=>formatAnalysisDate(value,language);
 const [query,setQuery]=useState(''),[sort,setSort]=useState({key:'name',direction:'asc'});
 const [columnState,setColumnState]=useState(()=>{try{return loadProfileColumns(window.localStorage);}catch{return normalizeProfileColumns();}});
 const draggedColumn=useRef(null),suppressSort=useRef(false);
 useEffect(()=>{try{saveProfileColumns(window.localStorage,columnState);}catch{}},[columnState]);
 const columns=visibleProfileColumns(columnState),columnGroups=profileColumnGroups(columns);
 const moveColumn=(key,target)=>setColumnState(previous=>moveProfileColumn(previous,key,target));
 const countryName=value=>{const {code,name}=nationalityView(value,language);return code&&language!=='ko'?new Intl.DisplayNames([language],{type:'region'}).of(code):name;};
 const scoped=peopleForArtists(artists,people),allRows=profileRows(artists,people,date),rows=sortProfileRows(allRows,{query,...sort}),countries=new Map(),agencies=new Map();
 for(const p of scoped)for(const n of new Set((p.nationalities||[]).map(v=>countryName(v))))countries.set(n,(countries.get(n)||0)+1);
 for(const row of allRows)for(const h of row.affiliations.filter(h=>h.role==='agency'&&h.status==='current'))agencies.set(h.name,(agencies.get(h.name)||0)+1);
 const toggle=key=>setSort(previous=>({key,direction:previous.key===key&&previous.direction==='asc'?'desc':'asc'}));
 const header=(key,label,{rowSpan=1}={})=><th key={key} rowSpan={rowSpan} scope="col" draggable onDragStart={event=>{draggedColumn.current=key;suppressSort.current=true;event.dataTransfer.setData('text/plain',key);event.dataTransfer.effectAllowed='move';}} onDragOver={event=>{if(draggedColumn.current)event.preventDefault();}} onDrop={event=>{event.preventDefault();if(draggedColumn.current)moveColumn(draggedColumn.current,key);draggedColumn.current=null;}} onDragEnd={()=>{draggedColumn.current=null;setTimeout(()=>{suppressSort.current=false;},0);}} aria-sort={sort.key===key?(sort.direction==='asc'?'ascending':'descending'):'none'}><button type="button" onClick={()=>{if(!suppressSort.current)toggle(key);}} aria-label={t(sort.key===key&&sort.direction==='asc'?'{label} 내림차순 정렬':'{label} 오름차순 정렬',{label:t(label)})}>{label}<span aria-hidden="true">{sort.key===key?(sort.direction==='asc'?' ↑':' ↓'):' ↕'}</span></button></th>;
 const number=(value,digits=0)=>value==null?'—':Number(value).toLocaleString(locale,{minimumFractionDigits:digits,maximumFractionDigits:digits});
 const affiliations=(row,role)=>{
  const matches=row.affiliations.filter(h=>h.role===role);
  return matches.length?<div className="profile-affiliations">{['current','former'].map(status=>{
   const entries=matches.filter(h=>h.status===status);
   return entries.length?<div key={status}><small>{status==='current'?'현재':language==='ko'?'이전':t('이전 소속')}</small>{entries.map((h,i)=><a key={`${h.agencyId||h.labelId||h.name}-${i}`} href={h.sourceUrl} target="_blank" rel="noopener noreferrer" data-no-translate title={[h.startDate,h.endDate].filter(Boolean).map(dateText).join(' – ')}>{h.name}</a>)}</div>:null;
  })}</div>:'—';
 };
 return localize(<section className="profile-statistics">
  <p>{t('기준일 {date} · 중복을 제거한 개인 {people}명 · 생년월일 등록 {births}명',{date:dateText(date),people:number(scoped.length),births:number(scoped.filter(p=>p.birthDate).length)})}</p>
  <p className="analysis-note">현재 나이는 확인된 생년월일의 만 나이입니다. 데뷔 평균 나이는 정확한 생일·데뷔일 사이의 소수 나이로 계산하며, 데뷔일 소속이 날짜로 확인된 멤버만 포함합니다. 현재·과거 멤버와 그룹·솔로 데뷔는 별도로 계산합니다. 소속사와 레이블은 출처에 명시된 역할을 구분합니다. 위키 최초 수집값이 포함되며 공식 검증 완료를 뜻하지 않습니다.</p>
  <div className="profile-statistics-tools"><label htmlFor="profile-artist-search">아티스트 검색</label><input id="profile-artist-search" type="search" placeholder="이름 또는 별칭" value={query} onChange={e=>setQuery(e.target.value)}/><span role="status">{t('{count}개 아티스트',{count:number(rows.length)})}</span></div>
  <details className="profile-column-picker"><summary>{t('표시할 열')}</summary><p>{t('열 제목을 드래그하거나 아래 이동 버튼으로 순서를 바꾸세요.')}</p><p className="profile-sr-only">{t('아티스트 열은 항상 표시됩니다.')}</p><ol>{columnState.order.map((key,index)=>{const column=PROFILE_COLUMNS.find(c=>c.key===key),label=[column.group&&t(column.group),t(column.label)].filter(Boolean).join(' · ');return <li key={key}><label><input type="checkbox" checked={!columnState.hidden.includes(key)} disabled={key==='name'} onChange={()=>setColumnState(previous=>({...previous,hidden:previous.hidden.includes(key)?previous.hidden.filter(k=>k!==key):[...previous.hidden,key]}))}/>{label}</label><button type="button" disabled={index===0} aria-label={t('{label} 왼쪽으로 이동',{label})} onClick={()=>moveColumn(key,columnState.order[index-1])}>←</button><button type="button" disabled={index===columnState.order.length-1} aria-label={t('{label} 오른쪽으로 이동',{label})} onClick={()=>moveColumn(key,columnState.order[index+1])}>→</button></li>;})}</ol><button type="button" onClick={()=>setColumnState(normalizeProfileColumns())}>{t('열 설정 초기화')}</button></details>
  <div className="analysis-table-wrap"><table className="analysis-table profile-statistics-table" style={{minWidth:Math.max(260,columns.length*90)}}><caption className="profile-sr-only">아티스트 프로필 통계. 열 이름을 누르면 오름차순과 내림차순을 전환합니다.</caption><thead><tr>
   {columnGroups.map((group,index)=>group.group?<th key={index} scope="colgroup" colSpan={group.columns.length}>{t(group.group)}</th>:header(group.columns[0].key,t(group.columns[0].label),{rowSpan:2}))}
  </tr><tr>{columnGroups.filter(group=>group.group).flatMap(group=>group.columns.map(column=>header(column.key,t(column.label))))}</tr></thead><tbody>
  {rows.map(r=><tr key={r.id}>{columns.map(column=>{
   const key=column.key;
   if(key==='name')return <th key={key} scope="row" data-no-translate>{r.name}</th>;
   const content=key==='agency'||key==='label'?affiliations(r,key):key==='debutDate'?dateText(r.debutDate):key==='yearsSinceDebut'?formatDebutElapsed(r,language):number(r[key],key==='currentAgeStdDev'?2:['meanCurrentAge','medianCurrentAge','meanDebutAge'].includes(key)?1:0);
   return <td key={key} className={key==='agency'||key==='label'?'profile-affiliation-cell':key==='debutDate'?'profile-date':key==='yearsSinceDebut'?'profile-elapsed':undefined}>{content}</td>;
  })}</tr>)}
  {!rows.length&&<tr><td colSpan={columns.length}>검색 결과가 없습니다.</td></tr>}
  </tbody></table></div>
  <details className="profile-coverage"><summary>계산에 포함된 관측 범위</summary><p>생일이 알려진 대상만 나이 계산에 사용하며, 빈 값은 0이 아닙니다. 연도만 확인된 데뷔일은 연도 그대로 표시하고 경과 일수나 데뷔 평균 나이를 계산하지 않습니다. 과거 멤버 수는 확인된 개인 기록 기준으로 전체 인원과 다를 수 있습니다.</p><ul>{rows.map(r=><li key={r.id}><span data-no-translate>{r.name}</span>: {t('현재 나이 {known}명 / 현재 멤버 {current}명 · 데뷔 나이 관측 {debut}명',{known:number(r.knownBirthDates),current:r.currentMembers==null?t('미확인'):number(r.currentMembers),debut:number(r.debutAgeKnown??0)})}{r.kind==='group'?' '+t('/ 데뷔일 소속 확인 {count}명',{count:number(r.debutMembershipKnown??0)}):''}</li>)}</ul></details>
  <div className="analysis-distributions"><section><h3>국적 분포</h3><p>복수 국적은 각각 포함합니다. 출생지와 별개입니다.</p>{[...countries].sort((a,b)=>b[1]-a[1]).map(([n,c])=><p key={n}><span data-no-translate>{n}</span> <b>{number(c)}</b></p>)}</section><section><h3>현재 소속사 구성</h3>{[...agencies].sort((a,b)=>b[1]-a[1]).map(([n,c])=><p key={n}><span data-no-translate>{n}</span> <b>{number(c)}</b></p>)}</section></div>
 </section>,language);
}
