import React,{useEffect,useId,useMemo,useRef,useState} from 'react';
import {ArrowUp,ChevronDown,Heart,Search,Sprout,Star} from 'lucide-react';
import OfficialLinks from './OfficialLinks';
import ActivityIcon from './ActivityIcon';
import {INITIAL_ROWS,artistInitials} from './directory-shortcuts';
import {initialSections,legalNamesFor,nationalityView,personMatches} from './person-directory';
import './artist-index.css';

const membershipLabels={current:'현재 멤버',former:'이전 멤버','last-known':'마지막 활동 멤버',linked:'소속 이력',unknown:'소속 상태 미확인'};
const presets=[['heart','하트',Heart],['star','별',Star],['clover','새싹',Sprout]];
const dateLabel=(date,year)=>date?date.replaceAll('-','.'):year?`${year}년 · 일자 미확인`:'미확인';
const safeSource=url=>{try{return new URL(url).protocol==='https:';}catch{return false;}};

export function AlphabetIndex({value,onChange}){
 return <nav className="artist-alphabet" aria-label="이름 첫 글자">
  <button type="button" aria-pressed={!value} onClick={()=>onChange('')}>전체</button>
  {INITIAL_ROWS.map(([label,letters])=><div className="artist-alphabet-row" key={label} role="group" aria-label={label}>
   {letters.map(letter=><button type="button" key={letter} aria-pressed={value===letter} onClick={()=>onChange(value===letter?'':letter)}>{letter==='기호'?'#':letter}</button>)}
  </div>)}
 </nav>;
}

export function PersonProfile({person,groups,onGroup}){
 const legal=legalNamesFor(person);
 const nationalities=(person.nationalities||[]).map(nationalityView);
 const place=person.birthPlace;
 const birthplace=typeof place==='string'?place:place?[place.countryCode?nationalityView(place.countryCode).name:place.country,place.region,place.city].filter(Boolean).join(' · '):'';
 const fields=[['활동명',person.nameKo&&person.nameKo!==person.name?<><span data-no-translate>{person.name}</span> · <span lang="ko" data-no-translate>{person.nameKo}</span></>:person.name],
  ['본명',legal.length?legal.map((name,index)=><span className="person-legal-name" key={name.lang+index} lang={name.lang==='und'?undefined:name.lang} data-no-translate>{name.text}</span>):'미확인'],
  ['생년월일',dateLabel(person.birthDate)],
  ['국적',nationalities.length?nationalities.map((nation,index)=><span className="person-nationality" key={nation.code+index}><span aria-hidden="true">{nation.flag}</span>{nation.name}</span>):'미확인'],
  ['출생 지역',birthplace||'미확인'],
  ['솔로 데뷔',person.soloDebuts.length?person.soloDebuts.map(debut=><span className="person-debut" key={debut.artistId}><span data-no-translate>{debut.name}</span> · {dateLabel(debut.date,debut.year)}</span>):'확인된 솔로 데뷔 정보 없음']];
 return <section className="person-profile" aria-label={`${person.name} 개인 프로필`}>
  {person.identityPending&&<p className="person-profile-notice">기존 멤버 ID 연결을 확인 중입니다. 다른 인물과 임의로 합치지 않습니다.</p>}
  {person.profileConflicts?.length>0&&<p className="person-profile-notice">일부 프로필 값이 출처 간 달라 기존 등록 정보를 유지하고 있습니다. 추가 확인이 필요합니다.</p>}
  <dl className="person-profile-fields">{fields.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
  <div className="person-membership-history"><h4>그룹 소속·출신 이력</h4>
   {person.memberships.length?person.memberships.map(relation=>{
    const group=groups.get(relation.groupId);
    return <div className="person-membership" key={relation.groupId}>
     <div><button type="button" className="directory-tag" data-no-translate onClick={()=>onGroup?.(relation.groupId)}>{relation.name}</button><span>{membershipLabels[relation.status]||'소속 상태 미확인'}</span></div>
     <small>그룹 데뷔 {dateLabel(relation.debutDate,relation.debutYear)}{relation.joinedAt&&` · 합류 ${dateLabel(relation.joinedAt)}`}{relation.leftAt&&` · 탈퇴 ${dateLabel(relation.leftAt)}`}</small>
     {group&&<div className="person-group-source"><span>그룹 공식</span><OfficialLinks artist={group} channels={person.channels||[]}/></div>}
    </div>;
   }):<p className="person-profile-note">확인된 그룹 소속 이력 없음</p>}
  </div>
  {Object.values(person.profileSources||{}).some(source=>safeSource(source?.sourceUrl))&&<div className="person-profile-sources"><small>프로필 출처</small>{Object.entries(person.profileSources).filter(([,source])=>safeSource(source?.sourceUrl)).map(([field,source])=><a key={field} href={source.sourceUrl} target="_blank" rel="noopener noreferrer">{({birthDate:'생년월일',legalNames:'본명',nationalities:'국적',birthPlace:'출생지'})[field]||'공식 프로필'}</a>)}</div>}
  <p className="person-profile-note">확인된 정보만 표시합니다. 본명은 공식 원어 표기를 유지하며, 미확인 날짜·국적·출생지는 추정하지 않습니다.</p>
 </section>;
}

export default function PeopleDirectory({data,mode,targetPerson,channels,clock,onGroup,options}){
 const [query,setQuery]=useState(''),[initial,setInitial]=useState(''),[scope,setScope]=useState('all'),[expanded,setExpanded]=useState('');
 const instance=useId(),top=useRef(null);
 const all=mode==='solo'?data.solos:data.members;
 const rows=useMemo(()=>all.map(person=>mode==='solo'?{...person,name:person.soloArtists[0]?.name||person.name}:person)
  .filter(person=>personMatches(person,query)&&(!initial||artistInitials(person).includes(initial))&&
   (scope==='all'||(scope==='from-group'?person.memberships.length>0:person.memberships.length===0)))
  .sort((a,b)=>a.name.localeCompare(b.name,'ko',{numeric:true})),[all,query,initial,scope,mode]);
 useEffect(()=>{if(targetPerson){setQuery('');setInitial('');setScope('all');setExpanded(targetPerson);}},[targetPerson]);
 useEffect(()=>{
  if(!targetPerson||expanded!==targetPerson)return;
  const button=document.getElementById(`${instance}-person-${targetPerson}`);
  button?.scrollIntoView({block:'center'});button?.focus({preventScroll:true});
 },[targetPerson,expanded,instance]);
 const groups=data.groups;
 const toTop=()=>{top.current?.scrollIntoView({block:'start'});};
 return <section className="directory-compact people-directory" aria-label={mode==='solo'?'솔로 아티스트 목록':'전체 개별 멤버 목록'} ref={top}>
  <header className="directory-compact-heading"><h2>{mode==='solo'?'솔로 아티스트':'개별 멤버'} <small>{all.length}</small></h2></header>
  <label className="search directory-search"><Search size={16}/><input value={query} aria-label="멤버·솔로·본명·출신 그룹 검색" placeholder="활동명 · 본명 · 출신 그룹 검색" onChange={e=>{setQuery(e.target.value);setInitial('');}}/></label>
  <AlphabetIndex value={initial} onChange={setInitial}/>
  {mode==='solo'&&<div className="people-scope" role="group" aria-label="솔로 활동 유형">{[['all','전체 솔로'],['from-group','그룹 출신·병행'],['standalone','그룹 이력 미등록']].map(([id,label])=><button type="button" className="directory-control" key={id} aria-pressed={scope===id} onClick={()=>setScope(id)}>{label}<small>{id==='all'?all.length:all.filter(person=>(person.memberships.length>0)===(id==='from-group')).length}</small></button>)}</div>}
  <p className="people-coverage">검색 결과 {rows.length}명 · {mode==='solo'?'그룹 멤버와 같은 인물 ID를 공유합니다.':'구조화된 멤버 정보가 등록된 인물만 표시합니다.'}</p>
  {initialSections(rows,initial).map(({letter,items})=><section className="artist-letter-section" key={letter} aria-label={letter+' 이름 목록'}>
   <header><h3>{letter==='기호'?'#':letter}</h3><button type="button" onClick={toTop}><ArrowUp size={12}/>맨 위로</button></header>
   {items.map(person=>{
    const artist=person.soloArtists[0],open=expanded===person.id;
    const ownProfiles=[...(person.officialLinks?.length?[{id:person.personId,name:person.name,officialLinks:person.officialLinks}]:[]),...person.soloArtists];
    const favorite=artist&&options.protectedGroups.includes(artist.id);
    return <article className="person-index-row" key={person.id} data-person-id={person.personId||undefined} data-favorite={favorite||undefined} style={favorite?{'--directory-favorite-color':options.colors?.[artist.id]||'#729ca8'}:undefined}>
     <div className="person-index-heading"><div className="person-name-area"><button type="button" className="person-name-button" id={`${instance}-person-${person.id}`} aria-expanded={open} aria-controls={open?`${instance}-details-${person.id}`:undefined} onClick={()=>setExpanded(open?'':person.id)}><span data-no-translate>{person.name}</span>{person.nameKo&&person.nameKo!==person.name&&<small data-no-translate>{person.nameKo}</small>}</button>{artist&&<ActivityIcon group={artist} clock={clock}/>}</div>
      <div className="person-index-actions">{ownProfiles.map(profile=><OfficialLinks key={profile.id} artist={profile} channels={channels} platforms={['youtube']}/>)}<button type="button" className="directory-control directory-icon" aria-label={`${person.name} ${open?'상세 닫기':'상세 보기'}`} aria-expanded={open} onClick={()=>setExpanded(open?'':person.id)}><ChevronDown size={16}/></button></div>
     </div>
     {open&&<div className="person-index-details" id={`${instance}-details-${person.id}`}><div className="person-all-links">{ownProfiles.map(profile=><OfficialLinks key={profile.id} artist={profile} channels={channels}/>)}</div>
      <PersonProfile person={{...person,channels}} groups={groups} onGroup={onGroup}/>
      {artist&&<div className="person-solo-actions" role="group" aria-label={artist.name+' 선호·저장 설정'}><button type="button" className="directory-control" aria-pressed={options.saved.includes(artist.id)} onClick={()=>options.onToggleGroup(artist.id)}>{options.saved.includes(artist.id)?'MY GROUPS 저장됨':'MY GROUPS 추가'}</button>
       {presets.map(([key,label,Icon])=><button type="button" className="directory-control" key={key} data-preset={key} aria-label={`${artist.name} ${label} 선호`} aria-pressed={options.favorites[key].includes(artist.id)} onClick={()=>options.onFavorite(key,artist.id)}><Icon size={16}/></button>)}
       <button type="button" className="directory-control" disabled={options.protectedGroups.includes(artist.id)} aria-pressed={options.excluded.includes(artist.id)} onClick={()=>options.onExclude(artist.id)}>개별 제외</button>
       <button type="button" className="directory-control" disabled={options.protectedGroups.includes(artist.id)} aria-pressed={options.protectedGroups.includes(artist.id)||options.allowed.includes(artist.id)} onClick={()=>options.onAllow(artist.id)}>예외 허용</button>
      </div>}
     </div>}
    </article>;
   })}
  </section>)}
  {!rows.length&&<div className="empty">조건에 맞는 등록 인물이 없습니다.<button type="button" className="directory-control" onClick={()=>{setQuery('');setInitial('');setScope('all');}}>검색 초기화</button></div>}
 </section>;
}
