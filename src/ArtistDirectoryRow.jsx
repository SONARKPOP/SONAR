import React from 'react';
import {Ban,Check,ChevronDown,Heart,Plus,ShieldCheck,Sprout,Star} from 'lucide-react';
import ActivityIcon from './ActivityIcon';
import OfficialLinks from './OfficialLinks';
import {careerTagsFor,koreanArtistName,lastKnownUpload,legacyGroupState,LEGACY_LABELS} from './directory';

const PRESETS=[['heart','하트',Heart],['star','별',Star],['clover','새싹',Sprout]];
const dateFormat=new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul'});

export default function ArtistDirectoryRow({artist,detailsId,groups,channels,clock,saved,favorites,color,locked,
 excluded,allowed,expanded,connected,onExpand,onSave,onFavorite,onExclude,onAllow,onCareerSearch}){
 const name=artist.name;
 const korean=koreanArtistName(artist);
 const tags=careerTagsFor(artist,groups);
 const selectedPresets=PRESETS.filter(([key])=>favorites[key].has(artist.id));
 const legacy=legacyGroupState(artist,clock);
 const visibleLegacy=legacy&&legacy!=='long-dormant'?LEGACY_LABELS[legacy]:null;
 const lastUpload=expanded?lastKnownUpload(artist,clock):null;
 const summary=[artist.debutYear||'데뷔 미확인',visibleLegacy,...tags.map(tag=>tag.label),
                connected?'YouTube 연결':'YouTube 확인 대기'].filter(Boolean).join(' · ');
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
    <p className="directory-row-summary" title={summary}>{summary}</p>
   </div>
   <div className="directory-row-actions">
    <button type="button" className="directory-control directory-icon directory-save-icon"
     aria-label={`${name} MY GROUPS ${saved?'제거':'추가'}`} aria-pressed={saved} onClick={()=>onSave(artist.id)}>
     {saved?<Check size={17}/>:<Plus size={17}/>}
    </button>
    <button type="button" className="directory-control directory-icon directory-expand-icon"
     aria-label={`${name} ${expanded?'상세 닫기':'상세 보기'}`} aria-expanded={expanded}
     aria-controls={expanded?detailsId:undefined} onClick={()=>onExpand(artist.id)}><ChevronDown size={17}/></button>
   </div>
  </div>
  {expanded&&<div className="directory-row-details" id={detailsId}>
   <div className="directory-row-detail-meta">
    <small>{lastUpload===null?'마지막 공식 업로드 확인 대기':`마지막 공식 업로드 ${dateFormat.format(lastUpload)}`}</small>
    {legacy==='long-dormant'&&<small>{LEGACY_LABELS[legacy]}</small>}
   </div>
   <OfficialLinks artist={artist} channels={channels} showYouTubeStatus/>
   {tags.some(tag=>!['solo','redebut'].includes(tag.id))&&<div className="directory-career-tags">
    {tags.filter(tag=>!['solo','redebut'].includes(tag.id)).map(tag=><button type="button" key={tag.id}
     data-no-translate onClick={()=>onCareerSearch(groups.get(tag.id)?.name||tag.id)}>{tag.label}</button>)}
   </div>}
   <div className="editor-group-policies">
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
