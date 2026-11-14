import React,{useState} from 'react';
import {Search,X} from 'lucide-react';
import './filter-choices.css';

export default function FilterChoices({label,value,options,onChange}){
 const [query,setQuery]=useState('');
 const needle=query.normalize('NFKC').toLowerCase().trim();
 const visible=needle?options.filter(([,name,aliases=[]])=>[name,...aliases].some(text=>String(text).normalize('NFKC').toLowerCase().includes(needle))):options;
 return <div className="filter-button-row">
  <span className="filter-row-label">{label}</span>
  {(options.length>12||query)&&<label className="filter-choice-search"><Search size={14}/>
   <input aria-label={label+' 검색'} placeholder={label+' 검색'} value={query} onChange={event=>setQuery(event.target.value)}/>
   {query&&<button type="button" aria-label={label+' 검색 지우기'} onClick={()=>setQuery('')}><X size={14}/></button>}
  </label>}
  <div className="filter-button-scroll" role="group" aria-label={label}>
   {visible.map(([id,name,aliases=[]])=>{
    const korean=aliases.find(alias=>/[가-힣]/.test(alias)&&alias!==name);
    return <button type="button" key={id} className="filter-choice" aria-pressed={value===id} onClick={()=>onChange(id)}>
     <span>{name}</span>{korean&&<small lang="ko" data-no-translate>{korean}</small>}
    </button>;
   })}
  </div>
  {!visible.length&&<small className="filter-choice-empty" role="status">검색 결과가 없습니다.</small>}
 </div>;
}
