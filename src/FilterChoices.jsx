import React,{useState} from 'react';
import {Search,X} from 'lucide-react';
import './filter-choices.css';
import {localize,useLanguage,translate,formatMessage} from './i18n';

export default function FilterChoices({label,value,options,onChange}){
 const language=useLanguage();
 const preserveNames=['그룹','멤버','채널'].includes(label);
 const [query,setQuery]=useState('');
 const needle=query.normalize('NFKC').toLowerCase().trim();
 const visible=needle?options.filter(([,name,aliases=[]])=>[name,...aliases].some(text=>String(text).normalize('NFKC').toLowerCase().includes(needle))):options;
 return localize(<div className="filter-button-row">
  <span className="filter-row-label">{label}</span>
  {(options.length>12||query)&&<label className="filter-choice-search"><Search size={14}/>
   <input aria-label={formatMessage('{label} 검색',{label:translate(label,language)},language)} placeholder={formatMessage('{label} 검색',{label:translate(label,language)},language)} value={query} onChange={event=>setQuery(event.target.value)}/>
   {query&&<button type="button" aria-label={formatMessage('{label} 검색 지우기',{label:translate(label,language)},language)} onClick={()=>setQuery('')}><X size={14}/></button>}
  </label>}
  <div className="filter-button-scroll" role="group" aria-label={label}>
   {visible.map(([id,name,aliases=[]])=>{
    const korean=aliases.find(alias=>/[가-힣]/.test(alias)&&alias!==name);
    return <button type="button" key={id} className="filter-choice" aria-pressed={value===id} onClick={()=>onChange(id)}>
     <span data-no-translate={preserveNames&&id?true:undefined}>{name}</span>{korean&&<small lang="ko" data-no-translate>{korean}</small>}
    </button>;
   })}
  </div>
  {!visible.length&&<small className="filter-choice-empty" role="status">검색 결과가 없습니다.</small>}
 </div>,language);
}
