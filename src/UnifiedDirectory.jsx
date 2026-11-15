import React,{useId,useMemo,useState} from 'react';
import {ArrowUp,Ban,ChevronDown,Heart,Search,Biohazard,SlidersHorizontal,Sprout,Star} from 'lucide-react';
import ArtistDirectoryRow from './ArtistDirectoryRow';
import {AlphabetIndex,PersonProfile} from './PeopleDirectory';
import OfficialLinks from './OfficialLinks';
import AgencyHistory from './AgencyHistory';
import {personDirectory,personMatches} from './person-directory';
import {uniquePeople} from './artist-insights';
import {ArtistPolicyDialog} from './ArtistPolicyDialog';
import {artistInitials} from './directory-shortcuts';
import {ACTIVITY_META,activityView} from './youtube-activity';
import ActivityIcon,{ActivityGlyph} from './ActivityIcon';
import {localize,useLanguage} from './i18n';
import './directory-compact.css';
import './unified-artists.css';
const PRESETS=[['heart','하트',Heart],['star','별',Star],['clover','새싹',Sprout]];
export default function UnifiedDirectory({catalog,clock,favorites,colors,excluded,protectedGroups,onFavorite,onExclude,hardBlocked=[],onHardBlock,onColor,editor=false}){
 const language=useLanguage(),instance=useId();
 const [filtersOpen,setFiltersOpen]=useState(false),[pending,setPending]=useState(null),[notice,setNotice]=useState(null);
 const [kind,setKind]=useState('groups'),[query,setQuery]=useState(''),[initial,setInitial]=useState(''),[status,setStatus]=useState('all'),[year,setYear]=useState('all'),[scope,setScope]=useState('all'),[presets,setPresets]=useState([]),[expanded,setExpanded]=useState(''),[role,setRole]=useState('all');
 const directory=useMemo(()=>personDirectory(catalog),[catalog]);
 const all=useMemo(()=>kind==='groups'?(catalog?.groups||[]).filter(g=>g.artistType!=='solo'):uniquePeople(directory),[catalog,directory,kind]);
 const favoriteSets=useMemo(()=>Object.fromEntries(PRESETS.map(([key])=>[key,new Set(favorites[key])])),[favorites]);
 const artists=row=>kind==='groups'?[row.id]:[row.id,...row.soloIds];
 const hasPreset=(row,key)=>artists(row).some(id=>favoriteSets[key].has(id));
 const activity=row=>activityView(kind==='groups'?row:row.soloArtists[0],clock)?.state||'unknown';
 const base=all.filter(row=>(kind==='groups'?[row.name,row.nameKo,...row.aliases||[]].some(text=>String(text||'').toLowerCase().includes(query.toLowerCase())):personMatches(row,query))&&(!initial||artistInitials(row).includes(initial))&&
  (scope!=='active'||['SURGE','SAILING','COASTING','ANCHORED'].includes(activity(row)))&&(!presets.length||presets.some(key=>hasPreset(row,key)))&&
  (scope==='blocked'?artists(row).some(id=>hardBlocked.includes(id)):scope==='excluded'?artists(row).some(id=>excluded.includes(id)):!artists(row).some(id=>hardBlocked.includes(id)))&&
  (role==='all'||(role==='solo'?row.soloIds?.length:row.memberships?.length)));
 const years=[...new Set(all.map(row=>Math.floor((row.debutYear||Number(row.memberships?.[0]?.debutYear)||0)/5)*5).filter(Boolean))].sort();
 const rows=base.filter(row=>(status==='all'||activity(row)===status)&&(query||year==='all'||Math.floor((row.debutYear||row.memberships?.[0]?.debutYear||0)/5)*5===Number(year))).sort((a,b)=>a.name.localeCompare(b.name,'ko',{numeric:true}));
 const openPerson=(groupId,name)=>{
  const person=directory.members.find(p=>p.memberships.some(g=>g.groupId===groupId)&&[p.name,p.nameKo,...p.aliases].includes(name));
  if(!person)return false;
  setKind('people');setQuery(person.name);setInitial('');setStatus('all');setYear('all');setScope('all');setPresets([]);setExpanded(person.id);return true;
 };
 const reset=()=>{setQuery('');setInitial('');setStatus('all');setYear('all');setScope('all');setPresets([]);setRole('all');};
 const requestPolicy=(row,kind)=>{
  const ids=[...new Set(artists(row))],current=kind==='hard'?hardBlocked:excluded,callback=kind==='hard'?onHardBlock:onExclude;
  const existing=ids.filter(id=>current.includes(id));
  if(existing.length){existing.forEach(id=>callback(id));setNotice({name:row.name,text:kind==='hard'?'절대차단을 해제했습니다.':'금지를 해제했습니다.'});return;}
  setPending({name:row.name,kind,ids:kind==='hard'?[row.personId||row.id]:ids});
 };
 const confirmPolicy=()=>{if(!pending)return;pending.ids.forEach(id=>(pending.kind==='hard'?onHardBlock:onExclude)(id));setNotice({name:pending.name,text:pending.kind==='hard'?'절대차단을 적용했습니다.':'금지를 적용했습니다.'});setPending(null);};
 return localize(<section className="unified-artists artist-index directory-compact" aria-label={editor?'선호 관리':'전체 아티스트 목록'}>
  <header className="unified-heading"><div><small>SONAR ARCHIVE</small><h2>{editor?'선호 관리':'아티스트'} <small>{all.length}</small></h2></div><a href="#collection">영상으로</a></header>
  <nav className="artist-index-tabs" aria-label="아티스트 목록 구분">{[['groups','그룹'],['people','개인']].map(([id,label])=><button key={id} aria-pressed={kind===id} onClick={()=>{setKind(id);reset();setExpanded('');}}>{label}<small>{id==='groups'?(catalog?.groups||[]).filter(g=>g.artistType!=='solo').length:uniquePeople(directory).length}</small></button>)}</nav>
  <label className="search directory-search"><Search size={16}/><input aria-label="아티스트 검색" placeholder="활동명 · 본명 · 출신 그룹 검색" value={query} onChange={e=>{setQuery(e.target.value);setInitial('');}}/></label>
  <div className="directory-filter-toolbar"><div className="unified-filter-row directory-primary-filters" aria-label="목록 범위">{[['all','전체'],['active','활동']].map(([id,label])=><button key={id} aria-pressed={scope===id&&!presets.length} onClick={()=>{setScope(id);setPresets([]);}}>{label}</button>)}
   {PRESETS.map(([key,label,Icon])=><button key={key} data-preset={key} aria-label={label} aria-pressed={presets.includes(key)} onClick={()=>{setScope('all');setPresets(s=>s.includes(key)?s.filter(k=>k!==key):[...s,key]);}}><Icon size={15}/><small>{all.filter(row=>hasPreset(row,key)).length}</small></button>)}
   <button aria-label="금지 목록" aria-pressed={scope==='excluded'} onClick={()=>{setScope(scope==='excluded'?'all':'excluded');setPresets([]);setStatus('all');setYear('all');setInitial('');setQuery('');}}><Ban size={15}/></button>
   <button className="policy-toxic" aria-label="절대 차단" aria-pressed={scope==='blocked'} onClick={()=>{setScope(scope==='blocked'?'all':'blocked');setPresets([]);setStatus('all');setYear('all');setInitial('');setQuery('');}}><Biohazard size={15}/></button></div>
   <button className="directory-filter-toggle" aria-expanded={filtersOpen} aria-controls={`${instance}-filters`} onClick={()=>setFiltersOpen(open=>!open)}><SlidersHorizontal size={14}/>필터{[status!=='all',year!=='all',Boolean(initial),role!=='all'].filter(Boolean).length>0&&<small>{[status!=='all',year!=='all',Boolean(initial),role!=='all'].filter(Boolean).length}</small>}<ChevronDown size={13}/></button></div>
  <div id={`${instance}-filters`} className="directory-filter-expansion" hidden={!filtersOpen}>
  <div className="unified-filter-row unified-activity" aria-label="YouTube 활동 상태 필터">{['all',...Object.keys(ACTIVITY_META),'unknown'].map(state=><button key={state} aria-pressed={status===state} style={ACTIVITY_META[state]?{'--toggle-accent':ACTIVITY_META[state].color}:undefined} onClick={()=>setStatus(status===state?'all':state)}>{ACTIVITY_META[state]?<ActivityGlyph icon={ACTIVITY_META[state].icon} size={18}/>:state==='unknown'?'?':'∑'}<span>{state==='all'?base.length:base.filter(row=>activity(row)===state).length}</span><small data-no-translate={Boolean(ACTIVITY_META[state])}>{state==='all'?'전체 상태':state==='unknown'?'미확인':state==='LOST SIGNAL'?'NO SIGNAL':state}</small></button>)}</div>
  {kind==='people'&&<div className="unified-filter-row">{[['all','전체 개인'],['member','그룹 멤버'],['solo','솔로 활동']].map(([id,label])=><button key={id} aria-pressed={role===id} onClick={()=>setRole(id)}>{label}</button>)}</div>}
  <AlphabetIndex value={initial} onChange={setInitial}/>
  <div className="unified-filter-row" aria-label="데뷔 연도"><button aria-pressed={year==='all'} onClick={()=>setYear('all')}>전체 연도</button>{years.map(start=><button key={start} aria-pressed={year===String(start)} onClick={()=>setYear(year===String(start)?'all':String(start))}>{start}–{start+4}</button>)}</div>
  <button className="directory-filter-reset" onClick={reset}>필터 초기화</button></div>
  <p className="unified-results" role="status">결과 <b>{rows.length}</b> · 선호 <b>{protectedGroups.length}</b></p>
  <div className="unified-list">{rows.map(row=>{
   const open=expanded===row.id,blocked=artists(row).some(id=>hardBlocked.includes(id)),fav=PRESETS.some(([key])=>hasPreset(row,key));
   const policyId=kind==='groups'?row.id:row.personId||row.id;
   if(kind==='groups')return <ArtistDirectoryRow key={row.id} artist={row} detailsId={`${instance}-${row.id}`} groups={directory.groups} channels={catalog.channels} clock={clock} compact favoritesOnly
    favorites={favoriteSets} color={colors[row.id]} locked={fav} excluded={excluded.includes(row.id)} expanded={open} hardBlocked={blocked} onHardBlock={()=>requestPolicy(row,'hard')}
    registeredMembers={(catalog.members||[]).filter(m=>m.groupId===row.id).map(m=>m.name)} connected={(catalog.channels||[]).some(c=>c.official&&c.groupIds?.includes(row.id)&&!c.unavailableReason)}
    onExpand={id=>setExpanded(expanded===id?'':id)} onFavorite={onFavorite} onExclude={()=>requestPolicy(row,'soft')} onMemberOpen={openPerson} onCareerSearch={setQuery}
    extraDetails={<AgencyHistory artist={row}/>} onColor={onColor}/>;
   return <article key={row.id} className="unified-person-row" data-favorite={fav||undefined} style={fav?{'--directory-favorite-color':colors[policyId]||'#729ca8'}:undefined}>
    <div className="person-index-heading"><span className="directory-row-favorites">{PRESETS.filter(([key])=>hasPreset(row,key)).map(([key,,Icon])=><Icon key={key} data-preset={key} size={13} fill={key==='clover'?'none':'currentColor'}/>)}</span><button className="person-name-button" aria-expanded={open} onClick={()=>setExpanded(open?'':row.id)}><span data-no-translate>{row.name}</span>{row.nameKo&&row.nameKo!==row.name&&<small data-no-translate>{row.nameKo}</small>}</button><ActivityIcon group={row.soloArtists[0]} clock={clock}/>
     <div className="person-index-actions">{row.soloArtists.map(artist=><OfficialLinks key={artist.id} artist={artist} channels={catalog.channels} platforms={['youtube']}/>)}<button className="directory-control" aria-label="상세 보기" aria-expanded={open} onClick={()=>setExpanded(open?'':row.id)}><ChevronDown size={16}/></button></div></div>
    {open&&<div className="unified-person-details"><div className="unified-filter-row">{PRESETS.map(([key,label,Icon])=><button key={key} data-preset={key} aria-label={label} aria-pressed={hasPreset(row,key)} onClick={()=>onFavorite(key,policyId)}><Icon size={16}/></button>)}<button aria-label="개별 제외" aria-pressed={excluded.includes(policyId)} onClick={()=>requestPolicy(row,'soft')}><Ban size={16}/></button><button className="policy-toxic" aria-label="절대 차단" aria-pressed={blocked} onClick={()=>requestPolicy(row,'hard')}><Biohazard size={16}/></button>{fav&&<input type="color" aria-label="선호 색상" value={colors[policyId]||'#729ca8'} onChange={e=>onColor(policyId,e.target.value)}/>}</div>
     <PersonProfile person={{...row,channels:catalog.channels}} groups={directory.groups} onGroup={id=>{setKind('groups');reset();setQuery(directory.groups.get(id)?.name||'');setExpanded(id);}}/>
     <AgencyHistory artist={row}/>{row.soloArtists.map(artist=><OfficialLinks key={artist.id} artist={artist} channels={catalog.channels}/>)}</div>}
   </article>;
  })}</div>{!rows.length&&<p className="empty">조건에 맞는 아티스트가 없습니다.</p>}
  {notice&&<div className="artist-policy-notice" role="status"><span data-no-translate>{notice.name}</span> · {notice.text}<button onClick={()=>setNotice(null)} aria-label="닫기">×</button></div>}
  <ArtistPolicyDialog pending={pending} onCancel={()=>setPending(null)} onConfirm={confirmPolicy}/>
  <button className="unified-top" onClick={()=>document.querySelector('.unified-artists')?.scrollIntoView({block:'start',behavior:'smooth'})}><ArrowUp size={16}/>맨 위로</button>
 </section>,language);
}
