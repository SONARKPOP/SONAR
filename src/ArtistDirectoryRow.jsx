import React from 'react';
import {Ban,Check,ChevronDown,Heart,Plus,ShieldCheck,Biohazard,Sprout,Star,Play} from 'lucide-react';
import {debutValue} from './directory-debut';
import {localize,useLanguage,translate,formatMessage} from './i18n';
import ActivityIcon from './ActivityIcon';
import OfficialLinks from './OfficialLinks';
import {careerTagsFor,koreanArtistName,lastKnownUpload,legacyGroupState,LEGACY_LABELS} from './directory';

const PRESETS=[['heart','하트',Heart],['star','별',Star],['clover','새싹',Sprout]];


export default function ArtistDirectoryRow({artist,detailsId,groups,channels,clock,saved,selectionEdit,favorites,color,locked,
 excluded,allowed,expanded,connected,registeredMembers,onExpand,onSave,onFavorite,onExclude,onAllow,onCareerSearch,quickPreset,compact=false,onMemberOpen,favoritesOnly=false,hardBlocked=false,onHardBlock,extraDetails,onColor,onVideos}){
 const language=useLanguage();
 const message=(key,values)=>formatMessage(key,values,language);
 const dateFormat=new Intl.DateTimeFormat(language,{timeZone:'Asia/Seoul'});
 const name=artist.name;
 const debut=debutValue(artist.debutDate,artist.debutYear);
 const korean=koreanArtistName(artist);
 const tags=careerTagsFor(artist,groups,language);
 const tagItems=tags.map(tag=>tag.affiliation?<button type="button" className="directory-tag" key={tag.id}
  onClick={()=>onCareerSearch(tag.label)} aria-label={message('{name} 관련 아티스트 검색',{name:tag.label})}><span data-no-translate>{tag.label}</span></button>:
  <span className="directory-tag" key={tag.id}>{tag.label}</span>);
 const selectedPresets=PRESETS.filter(([key])=>favorites[key].has(artist.id));
 const legacy=legacyGroupState(artist,clock);
 const visibleLegacy=translate(LEGACY_LABELS[legacy],language);
 const lastUpload=lastKnownUpload(artist,clock);
 const summary=[artist.debutYear||translate('데뷔 미확인',language),lastUpload===null?null:dateFormat.format(lastUpload),visibleLegacy].filter(Boolean).join(' · ');
 const roster=artist.memberRoster;
 const memberSections=artist.artistType==='solo'?[]:[
  [roster?.lineup==='last'?'마지막 활동 멤버':roster?'현재 멤버':'등록 멤버 · 일부',roster?.current||registeredMembers,roster?.evidenceUrl],
  ['탈퇴 멤버',roster?.former||[],roster?.formerEvidenceUrl],
 ];
 const [quickId,quickLabel,QuickIcon]=quickPreset||[];
 return localize(<article className={`directory-list-row${compact?' directory-index-row':''}`} data-favorite={locked||undefined}
  style={locked?{'--directory-favorite-color':color||'#729ca8'}:undefined}>
  <div className="directory-row-main">
   <div className="directory-row-text">
    <div className="directory-row-name">
     {selectedPresets.length>0&&<span className="directory-row-favorites" aria-label={selectedPresets.map(([,label])=>translate(label,language)).join(', ')}>
      {selectedPresets.map(([key,,Icon])=><Icon key={key} size={11} data-preset={key} aria-hidden="true" fill={key==='clover'?'none':'currentColor'}/>)}
     </span>}
     <h3 title={name} data-no-translate>{compact?<button type="button" className="directory-name-button" aria-expanded={expanded} aria-controls={expanded?detailsId:undefined} onClick={()=>onExpand(artist.id)}>{name}</button>:name}</h3>
     {debut&&<span className="directory-debut"><span>{artist.artistType==='solo'?'솔로 데뷔':'데뷔'}</span> <time dateTime={debut} data-no-translate>{debut}</time></span>}
     <ActivityIcon group={artist} clock={clock}/>
     {korean&&<small lang="ko" title={korean} data-no-translate>{korean}</small>}

    </div>
    {!compact&&<div className="directory-row-meta">
     <p className="directory-row-summary" title={summary}>{summary}</p>
     {!connected&&legacy!=='channel-unavailable'&&<span className="directory-source-pending">YouTube 확인 대기</span>}
    </div>}
    {!compact&&tags.length>0&&<div className="directory-row-tags" aria-label="아티스트 태그">
     {tagItems}
    </div>}
   </div>
   <div className="directory-row-actions">
    {onVideos&&<button type="button" className="directory-control directory-video-link" onClick={()=>onVideos(artist)}><Play size={13}/><span>영상</span></button>}
    {compact&&!connected&&<span className="directory-source-state" role="img" title={legacy==='channel-unavailable'?'YouTube 연결 불가':'YouTube 공식 채널 확인 대기'} aria-label={legacy==='channel-unavailable'?'YouTube 연결 불가':'YouTube 공식 채널 확인 대기'}>YT?</span>}
    {QuickIcon&&<button type="button" className="directory-control directory-icon" data-preset={quickId}
     aria-label={message('{name} {preset} 선호 지정',{name,preset:translate(quickLabel,language)})} aria-pressed={favorites[quickId].has(artist.id)}
     onClick={()=>onFavorite(quickId,artist.id)}><QuickIcon size={16}/></button>}
    <OfficialLinks artist={artist} channels={channels} platforms={compact?['youtube']:undefined}/>
    {!favoritesOnly&&<button type="button" className="directory-control directory-icon directory-save-icon"
     aria-label={message('{name} {action}',{name,action:translate(selectionEdit?(saved?'영상 선택 해제':'영상 선택'):(saved?'MY GROUPS 제거':'MY GROUPS 추가'),language)})} aria-pressed={saved} onClick={()=>onSave(artist.id)}>
     {saved?<Check size={17}/>:<Plus size={17}/>}
    </button>}
    <button type="button" className="directory-control directory-icon directory-expand-icon"
     aria-label={message(expanded?'{name} 상세 닫기':'{name} 상세 보기',{name})} aria-expanded={expanded}
     aria-controls={expanded?detailsId:undefined} onClick={()=>onExpand(artist.id)}><ChevronDown size={17}/></button>
   </div>
  </div>
  {expanded&&<div className="directory-row-details" id={detailsId}>
   <div className="directory-row-detail-main">
    {roster?.hasUnverifiedChanges&&<p className="person-profile-note">위키 최초 수집 정보가 포함됩니다. 필드별 출처를 확인해 주세요. 미확인 정보는 추정하지 않습니다.</p>}
    {compact&&<><p className="directory-index-summary">{summary}{!connected&&<> · <span>YouTube 확인 대기</span></>}</p><OfficialLinks artist={artist} channels={channels}/>
     {tags.length>0&&<div className="directory-row-tags">{tagItems}</div>}</>}
    {memberSections.some(([,names])=>names.length>0)&&<h4>그룹 구성원 목록</h4>}{memberSections.filter(([,names])=>names.length>0).map(([label,names,evidence])=>
     <div className="directory-member-section" key={label} role="group" aria-label={label}>
      <div className="directory-member-label">
       <small>{label}</small>
       {evidence&&<a href={evidence} target="_blank" rel="noopener noreferrer" aria-label={message('{label} 출처 (새 탭)',{label:translate(label,language)})}>출처</a>}
      </div>
      <div className="directory-row-tags">{names.map(name=><button type="button" className="directory-tag" key={name}
       onClick={()=>{if(!onMemberOpen?.(artist.id,name))onCareerSearch(name);}} aria-label={message(onMemberOpen?'{name} 멤버 정보 보기':'{name} 관련 아티스트 검색',{name})}><span data-no-translate>{name}</span></button>)}</div>
     </div>)}
    {extraDetails}
   </div>
   <div className="editor-group-policies" role="group" aria-label="선호 그룹 및 보기 설정">
    {PRESETS.map(([key,label,Icon])=><button type="button" key={key} data-preset={key}
     aria-label={message('{name} {preset}',{name,preset:translate(label,language)})} aria-pressed={favorites[key].has(artist.id)}
     onClick={()=>onFavorite(key,artist.id)}><Icon size={16} fill={key!=='clover'&&favorites[key].has(artist.id)?'currentColor':'none'}/></button>)}
    <button type="button" className="policy-ban" aria-label={message('{name} 개별 제외',{name})}
     aria-pressed={excluded} disabled={!favoritesOnly&&locked} onClick={()=>onExclude(artist.id)}><Ban size={16}/></button>
    {favoritesOnly?<><button type="button" className="policy-toxic" aria-label="절대 차단" aria-pressed={hardBlocked} onClick={()=>onHardBlock(artist.id)}><Biohazard size={16}/></button>{locked&&<input type="color" aria-label="선호 색상" value={color||'#729ca8'} onChange={e=>onColor(artist.id,e.target.value)}/>}</>:<button type="button" className="policy-allow" aria-label={message('{name} 예외 허용',{name})}
     aria-pressed={locked||allowed} disabled={locked} onClick={()=>onAllow(artist.id)}><ShieldCheck size={16}/><span>{locked?'자동 허용':'예외'}</span></button>
    }
   </div>
  </div>}
 </article>,language);
}
