import React,{lazy,Suspense,useEffect,useMemo,useState} from 'react';
import {geoEqualEarth,geoMercator,geoPath} from 'd3-geo';
import {personDirectory,nationalityView} from './person-directory';
import {uniquePeople,peopleForArtists} from './artist-insights';
import {createBirthplaceGazetteer,geographyRows,geographySummary,geographyRegionKey,filterBirthplaceRows} from './birthplace-data';
import './birthplace-maps.css';
import {useMapGestures} from './map-gestures';
import {useLanguage,localize,formatMessage} from './i18n';
import {mapCopy,mapPopupText} from './map-copy';
const mapUrl=name=>`${import.meta.env.BASE_URL}data/maps/${name}.geojson`;
const BirthplaceGlobe=lazy(()=>import('./BirthplaceGlobe.jsx'));
export default function BirthplaceMaps({catalog}){
 const language=useLanguage(),t=key=>mapCopy(key,language),message=(key,values)=>formatMessage(key,values,language),number=value=>new Intl.NumberFormat(language).format(value);
 const [engine,setEngine]=useState('globe'),[worldLevel,setWorldLevel]=useState('adm1'),[detailAssets,setDetailAssets]=useState({}),[detailError,setDetailError]=useState(''),[resetKey,setResetKey]=useState(0);
 const [nationalityFallback,setNationalityFallback]=useState(true),[assets,setAssets]=useState(null),[error,setError]=useState(''),[view,setView]=useState('world'),[level,setLevel]=useState('adm3'),[query,setQuery]=useState(''),[kind,setKind]=useState('all'),[groupId,setGroupId]=useState(''),[selected,setSelected]=useState(''),[zoom,setZoom]=useState(1),[pan,setPan]=useState([0,0]);
 useEffect(()=>{const abort=new AbortController();Promise.all(['world','korea-sido','korea-sigungu'].map(name=>fetch(mapUrl(name),{signal:abort.signal}).then(r=>{if(!r.ok)throw Error('지도 파일을 불러오지 못했습니다.');return r.json();}))).then(setAssets).catch(e=>{if(e.name!=='AbortError')setError('지도 파일을 불러오지 못했습니다.');});return()=>abort.abort();},[]);
 useEffect(()=>{const name=view==='world'&&worldLevel==='adm1'?'world-adm1':view==='korea'&&level==='adm3'?'korea-adm3':null;if(!name||detailAssets[name])return;const abort=new AbortController();setDetailError('');fetch(mapUrl(name),{signal:abort.signal}).then(r=>{if(!r.ok)throw Error('세부 경계 파일을 불러오지 못했습니다. 상위 지역으로 표시합니다.');return r.json();}).then(data=>setDetailAssets(old=>({...old,[name]:data}))).catch(e=>{if(e.name!=='AbortError')setDetailError('세부 경계 파일을 불러오지 못했습니다. 상위 지역으로 표시합니다.');});return()=>abort.abort();},[view,worldLevel,level,detailAssets]);
 const mapRef=useMapGestures(zoom,pan,next=>{setZoom(next.zoom);setPan(next.pan);},Boolean(assets)&&engine==='flat');
 const people=useMemo(()=>peopleForArtists(catalog.groups,uniquePeople(personDirectory(catalog))),[catalog]);
 const gazetteer=useMemo(()=>assets?createBirthplaceGazetteer(...assets):null,[assets]);
 const allRows=useMemo(()=>gazetteer?geographyRows(people,gazetteer,{nationalityFallback}):[],[people,gazetteer,nationalityFallback]);
 const rows=useMemo(()=>filterBirthplaceRows(allRows,{query,kind,groupId}),[allRows,query,kind,groupId]);
 const summary=geographySummary(rows);
 const effectiveLevel=view==='world'?(worldLevel==='adm1'&&!detailAssets['world-adm1']?'country':worldLevel):(level==='adm3'&&!detailAssets['korea-adm3']?'sigungu':level);
 const counts=useMemo(()=>{const result=new Map();for(const row of rows){const key=geographyRegionKey(row.location,{view,level:effectiveLevel});if(key){if(!result.has(key))result.set(key,[]);result.get(key).push(row);}}return result;},[rows,view,effectiveLevel]);
 const features=useMemo(()=>{
  if(!assets)return null;
  const countries=assets[0].features.filter(f=>view==='world'||['KR','KP'].includes(f.properties.ISO_A2_EH||f.properties.ISO_A2)).map(f=>{const code=f.properties.ISO_A2_EH||f.properties.ISO_A2;return {...f,properties:{...f.properties,mapKey:code,label:nationalityView(code,language).name}};});
  const province=assets[1].features.map(f=>({...f,properties:{...f.properties,mapKey:'kr1:'+f.properties.name,label:f.properties.name}}));
  const district=assets[2].features.map(f=>({...f,properties:{...f.properties,mapKey:'kr2:'+f.properties.name,label:f.properties.name}}));
  const extra=view==='world'?(worldLevel==='adm1'?detailAssets['world-adm1']?.features||[]:[]):[...province,...(level==='sigungu'||level==='adm3'?district:[]),...(level==='adm3'?detailAssets['korea-adm3']?.features||[]:[])];
  return {type:'FeatureCollection',features:[...countries,...extra].map(f=>({...f,properties:{...f.properties,label:f.properties.label||f.properties.name,count:counts.get(f.properties.mapKey)?.length||0}}))};
 },[assets,view,level,worldLevel,detailAssets,counts,language]);
 const path=useMemo(()=>features?geoPath((view==='world'?geoEqualEarth():geoMercator()).fitExtent([[12,12],[948,488]],features)):null,[features,view]);
 const keyFor=f=>f.properties.mapKey;
 const matching=key=>counts.get(key)||[];
 const selection=selected==='unknown'?rows.filter(r=>!r.location.country||r.location.basis==='nationality'):selected?rows.filter(r=>[r.location.country,r.location.adm1Id,r.location.adm2Id,r.location.adm3Id].includes(selected)):view==='korea'?rows.filter(r=>['KR','KP'].includes(r.location.country)):rows;
 const switchView=value=>{setView(value);setSelected('');setZoom(1);setPan([0,0]);};
 const choose=key=>{if(view==='world'&&['KR','KP'].includes(key)){switchView('korea');if(key==='KP')setSelected('KP');}else setSelected(key);};
 const regionLabel=key=>{const location=matching(key)[0]?.location;const name=features?.features.find(f=>f.properties.mapKey===key)?.properties.label||location?.ward||location?.district||location?.adm1Name||(/^[A-Z]{2}$/.test(key)?nationalityView(key,language).name:key.replace(/^kr[123]:/,''));return key.startsWith('adm1:')?`${nationalityView(location?.country||key.split(':')[1],language).name} · ${name}`:name;};
 const groups=(catalog?.groups||[]).filter(g=>kind==='all'||(kind==='solo'?g.artistType==='solo':g.artistType!=='solo'));
 return localize(<section className="birthplace-maps" aria-label="출생지 지도">
  <header><div><h2>출생지 · 국적 지도</h2><p>출생지와 국적 기준 국가를 구분해 살펴보세요.</p></div><div className="birthplace-tabs"><button aria-pressed={view==='world'} onClick={()=>switchView('world')}>세계</button><button aria-pressed={view==='korea'} onClick={()=>switchView('korea')}>대한민국 · 한반도</button></div></header>
  <div className="birthplace-filters"><input aria-label="출생지 인물 검색" placeholder="이름 · 그룹 · 출생지 검색" value={query} onChange={e=>setQuery(e.target.value)}/><select aria-label="활동 구분" value={kind} onChange={e=>{setKind(e.target.value);setGroupId('');}}><option value="all">전체 아티스트</option><option value="group">그룹 소속 인물</option><option value="solo">솔로 활동 인물</option></select><select aria-label="그룹 선택" value={groupId} onChange={e=>setGroupId(e.target.value)}><option value="">모든 그룹 / 솔로</option>{groups.map(g=><option data-no-translate key={g.id} value={g.id}>{g.name}</option>)}</select></div>
  <label className="birthplace-fallback-switch"><input type="checkbox" checked={nationalityFallback} onChange={e=>setNationalityFallback(e.target.checked)}/> 출생지 미확인 인물도 국적 국가에 표시</label>
  <div className="birthplace-stats"><span>{message('인물 {count}명',{count:summary.people})}</span><span>{message('출생 국가·지역 확인 {count}명',{count:summary.birthplace})}</span><span>{message('국적 기준 보완 {count}명',{count:summary.nationality})}</span><button onClick={()=>setSelected('unknown')}>{message('출생지 미확인 {count}명',{count:summary.unresolvedBirthplace})}</button></div>
  {error?<p role="alert">{error}</p>:!assets?<p role="status">지도를 불러오는 중…</p>:<>
   <div className="birthplace-map-tools">
    <button aria-pressed={engine==='globe'} onClick={()=>setEngine('globe')}>{t('globe')}</button><button aria-pressed={engine==='flat'} onClick={()=>setEngine('flat')}>{t('flat')}</button>
    {view==='world'?<select aria-label={t('worldDetail')} value={worldLevel} onChange={e=>{setWorldLevel(e.target.value);setSelected('');}}><option value="country">{t('country')}</option><option value="adm1">{t('adm1')}</option></select>:<select aria-label="대한민국 지도 상세 수준" value={level} onChange={e=>{setLevel(e.target.value);setSelected('');}}><option value="sido">시·도</option><option value="sigungu">시·군·구</option><option value="adm3">{t('adm3')}</option></select>}
    {engine==='flat'&&<><button aria-label="지도 확대" onClick={()=>setZoom(z=>Math.min(6,z*1.4))}>＋</button><button aria-label="지도 축소" onClick={()=>setZoom(z=>Math.max(1,z/1.4))}>−</button></>}
    <button onClick={()=>{setZoom(1);setPan([0,0]);setResetKey(k=>k+1);}}>원래 크기</button>
   </div>
   {detailError&&<p role="status">{detailError}</p>}
   {engine==='globe'?<Suspense fallback={<p role="status">{t('loading')}</p>}><BirthplaceGlobe features={features} world={assets[0]} counts={counts} view={view} onSelect={choose} resetKey={resetKey}/></Suspense>:<div className="birthplace-canvas"><svg ref={mapRef} viewBox="0 0 960 500" aria-label={view==='world'?'세계 출생지·국적 지도':'한반도 전체 출생 지역 지도'}><g transform={`translate(${480+pan[0]},${250+pan[1]}) scale(${zoom}) translate(-480,-250)`}>{features.features.map((f,i)=>{const key=keyFor(f),items=matching(key),label=f.properties.label;return <path key={`${key}-${i}`} d={path(f)||''} fill={items.length?`hsl(186 65% ${Math.max(28,68-Math.log2(items.length+1)*6)}%)`:'var(--birthplace-land)'} className={key===selected?'selected':''} tabIndex={0} role="button" aria-label={message('{place} · {count}명',{place:label,count:items.length})} onClick={()=>choose(key)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose(key);}}}><title data-no-translate>{mapPopupText(label,items,language,12)}</title></path>;})}</g></svg></div>}
   <p className="birthplace-note">드래그로 이동 · 휠 또는 두 손가락으로 확대·축소합니다. 색이 진할수록 인물이 많습니다. 국적 기준 보완은 출생 인원 통계와 별개입니다. 복수 국적은 각 국가에 표시합니다. 지역을 선택하면 목록이 열립니다. 대한민국을 선택하면 북한 지역까지 포함한 한반도 지도로 이동합니다. 북한은 국가 경계로만 표시하며 상세 행정구역은 미수집입니다. 일부 작은 국가·지역은 기본 지도에 경계가 없어 아래 목록으로 표시합니다.</p>
   <p className="birthplace-note">{t('fallbackNote')}</p>
   <div className="birthplace-region-list" aria-label="지역별 인원">{[...counts.keys()].filter(key=>view==='world'||key.startsWith('kr')||['KR','KP'].includes(key)).sort((a,b)=>matching(b).length-matching(a).length).map(key=><button key={key} aria-pressed={selected===key} onClick={()=>choose(key)}><span data-no-translate>{regionLabel(key)}</span> <b>{number(matching(key).length)}</b>{matching(key).some(r=>r.location.basis==='nationality')&&<small>{message('국적 {count}명',{count:matching(key).filter(r=>r.location.basis==='nationality').length})}</small>}</button>)}</div>
  </>}
  <div className="birthplace-results"><h3>{selected==='unknown'?'출생국 미확인':selected==='KP'?'북한 지역':selected?<span data-no-translate>{regionLabel(selected)}</span>:view==='korea'?'한반도 관련 인물':'전체 인물'} <small>{message('{count}명',{count:selection.length})}</small></h3>{selected&&<button onClick={()=>setSelected('')}>지역 선택 해제</button>}<ul>{selection.map(({person,location})=><MapPersonRow key={`${person.id}-${location.country||'unknown'}-${location.basis}`} person={person} location={location}/>)}</ul>{!selection.length&&<p>이 조건에 해당하는 인물이 없습니다.</p>}</div>
  <footer>출생지는 국적·거주지·고향과 다릅니다. 미확인 지역은 임의 배치하지 않습니다. 지도는 행정구역 집계이며 개인의 출생 주소를 표시하지 않습니다.<br/>{'세계:'} <a data-no-translate href="https://www.naturalearthdata.com/about/terms-of-use/" target="_blank" rel="noreferrer">Natural Earth (Public Domain)</a> · {'한국:'} <a data-no-translate href="https://sgis.kostat.go.kr" target="_blank" rel="noreferrer">통계청 SGIS (공공누리 1유형)</a> / <a data-no-translate href="https://github.com/vuski/admdongkor" target="_blank" rel="noreferrer">vuski/admdongkor (CC BY 4.0)</a> · {message('{date} 경계를 시·도 / 시·군·구 / 읍·면·동으로 단순화',{date:new Intl.DateTimeFormat(language,{year:'numeric',month:'short',day:'numeric',timeZone:'UTC'}).format(new Date('2025-01-01T00:00:00Z'))})}</footer>
 </section>,language);
}

export function MapPersonRow({person:p,location:l}){
 const language=useLanguage();
 return localize(<li><strong data-no-translate>{p.name}</strong><span>{p.memberships?.length?<span data-no-translate>{p.memberships.map(g=>g.name).join(' · ')}</span>:'솔로'}</span><span>{l.basis==='nationality'?<><span data-no-translate>{nationalityView(l.country,language).flag} {nationalityView(l.country,language).name}</span> · {'국적 기준 · 출생지 미확인'}{l.originalBirthPlace&&<> (<span data-no-translate>{l.originalBirthPlace}</span>)</>}</>:l.raw?<span data-no-translate>{l.raw}</span>:'출생지 미확인'}{l.country==='KR'&&!l.district&&<> · {'시·군·구 미확인'}</>}{l.administrativeChange&&<small className="birthplace-admin-change">{'출생 당시:'} <span data-no-translate>{l.administrativeChange.before}</span> → {'현재 지도:'} <span data-no-translate>{l.administrativeChange.after}</span></small>}</span><small>{l.basis==='nationality'?'국적 기준 · 출생지 미확인':l.uncertain?'출생지 출처 검토 필요':'출생지 공식 출처 확인'}{l.source?.verificationStatus==='namuwiki_collected'&&<> · {'위키 수집'}</>}</small>{/^https:\/\//.test(l.source?.sourceUrl||'')&&<a href={l.source.sourceUrl} target="_blank" rel="noreferrer">{l.basis==='nationality'?'국적 출처':'출생지 출처'}</a>}{l.geographySource&&<a href={l.geographySource.sourceUrl} target="_blank" rel="noreferrer">지명 연결 근거</a>}{l.administrativeChange?.sourceUrl&&<a href={l.administrativeChange.sourceUrl} target="_blank" rel="noreferrer">행정구역 변경 근거</a>}</li>,language);
}
