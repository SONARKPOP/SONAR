import React from 'react';
import {Ban,Check,ChevronDown,Heart,Plus,ShieldCheck,Sprout,Star} from 'lucide-react';
import ActivityIcon from './ActivityIcon';
import OfficialLinks from './OfficialLinks';
import {careerTagsFor,koreanArtistName,lastKnownUpload,legacyGroupState,LEGACY_LABELS} from './directory';

const PRESETS=[['heart','하트',Heart],['star','별',Star],['clover','새싹',Sprout]];
const dateFormat=new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul'});

export default function ArtistDirectoryRow({artist,detailsId,groups,channels,clock,saved,selectionEdit,favorites,color,locked,
 excluded,allowed,expanded,connected,registeredMembers,onExpand,onSave,onFavorite,onExclude,onAllow,onCareerSearch,quickPreset}){
 const name=artist.name;
 const korean=koreanArtistName(artist);
 const tags=careerTagsFor(artist,groups);
 const selectedPresets=PRESETS.filter(([key])=>favorites[key].has(artist.id));
 const legacy=legacyGroupState(artist,clock);
 const visibleLegacy=LEGACY_LABELS[legacy];
 const lastUpload=expanded?lastKnownUpload(artist,clock):null;
 const summary=[artist.debutYear||'데뷔 미확인',visibleLegacy].filter(Boolean).join(' · ');
 const roster=artist.memberRoster;
 const memberSections=[
  [roster?'현재 멤버':'등록 멤버',roster?.current||registeredMembers],
  ['탈퇴 멤버',roster?.former||[]],
 ];
 const [quickId,quickLabel,QuickIcon]=quickPreset||[];
 return <article className="directory-list-row" data-favorite={locked||undefined}
  style={locked?{'--directory-favorite-color':color||'#729ca8'}:undefined}>
  <div className="directory-row-main">
   <div className="directory-row-text">
    <div className="directory-row-name">
     <h3 title={name} data-no-translate>{name}</h3>
     {korean&&<small lang="ko" title={korean} data-no-translate>{korean}</small>}
     <ActivityIcon group={artist} clock={clock}/>
     {selectedPresets.length>0&&<span className="directory-row-favorites" aria-label={selectedPresets.map(([,label])=>label).join(', ')}>
      {selectedPresets.map(([key,,Icon])=><Icon key={key} size={11} data-preset={key} aria-hidden="true" fill={key==='clover'?'none':'currentColor'}/>)}
     </span>}
    </div>
    <div className="directory-row-meta">
     <p className="directory-row-summary" title={summary}>{summary}</p>
     {!connected&&legacy!=='channel-unavailable'&&<span className="directory-source-pending">YouTube 확인 대기</span>}
    </div>
    {tags.length>0&&<div className="directory-row-tags" aria-label="아티스트 태그">
     {tags.map(tag=>tag.affiliation?<button type="button" className="directory-tag" key={tag.id}
      onClick={()=>onCareerSearch(tag.label)} aria-label={tag.label+' 관련 아티스트 검색'} data-no-translate>{tag.label}</button>:
      <span className="directory-tag" key={tag.id}>{tag.label}</span>)}
    </div>}
   </div>
   <div className="directory-row-actions">
    {QuickIcon&&<button type="button" className="directory-control directory-icon" data-preset={quickId}
     aria-label={`${name} ${quickLabel} 선호 지정`} aria-pressed={favorites[quickId].has(artist.id)}
     onClick={()=>onFavorite(quickId,artist.id)}><QuickIcon size={16}/></button>}
    <button type="button" className="directory-control directory-icon directory-save-icon"
     aria-label={`${name} ${selectionEdit?(saved?'영상 선택 해제':'영상 선택'):(saved?'MY GROUPS 제거':'MY GROUPS 추가')}`} aria-pressed={saved} onClick={()=>onSave(artist.id)}>
     {saved?<Check size={17}/>:<Plus size={17}/>}
    </button>
    <button type="button" className="directory-control directory-icon directory-expand-icon"
     aria-label={`${name} ${expanded?'상세 닫기':'상세 보기'}`} aria-expanded={expanded}
     aria-controls={expanded?detailsId:undefined} onClick={()=>onExpand(artist.id)}><ChevronDown size={17}/></button>
   </div>
  </div>
  {expanded&&<div className="directory-row-details" id={detailsId}>
   <div className="directory-row-detail-main">
    <div className="directory-row-detail-meta">
     <small>{lastUpload===null?'마지막 공식 업로드 확인 대기':`마지막 공식 업로드 ${dateFormat.format(lastUpload)}`}</small>
    </div>
    <OfficialLinks artist={artist} channels={channels}/>
    {artist.artistType!=='solo'&&memberSections.filter(([,names])=>names.length>0).map(([label,names])=>
     <div className="directory-member-section" key={label} role="group" aria-label={label}>
      <small>{label}</small>
      <div className="directory-row-tags">{names.map(name=><button type="button" className="directory-tag" key={name}
       onClick={()=>onCareerSearch(name)} aria-label={name+' 관련 아티스트 검색'} data-no-translate>{name}</button>)}</div>
     </div>)}
   </div>
   <div className="editor-group-policies" role="group" aria-label="선호 그룹 및 보기 설정">
    {PRESETS.map(([key,label,Icon])=><button type="button" key={key} data-preset={key}
     aria-label={`${name} ${label}`} aria-pressed={favorites[key].has(artist.id)}
     onClick={()=>onFavorite(key,artist.id)}><Icon size={16} fill={key!=='clover'&&favorites[key].has(artist.id)?'currentColor':'none'}/></button>)}
    <button type="button" className="policy-ban" aria-label={`${name} 개별 제외`}
     aria-pressed={!locked&&excluded} disabled={locked} onClick={()=>onExclude(artist.id)}><Ban size={16}/></button>
    <button type="button" className="policy-allow" aria-label={`${name} 예외 허용`}
     aria-pressed={locked||allowed} disabled={locked} onClick={()=>onAllow(artist.id)}><ShieldCheck size={16}/><span>{locked?'자동 허용':'예외'}</span></button>
   </div>
  </div>}
 </article>;
}
