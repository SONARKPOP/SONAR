import React from 'react';
import {agencyHistory} from './artist-insights';
import {localize,useLanguage} from './i18n';
export default function AgencyHistory({artist}){
 const language=useLanguage(),rows=agencyHistory(artist);
 return localize(<section className="agency-history"><h4>소속사 이력</h4>{rows.length?<dl>{['current','former'].map(status=><div key={status}><dt>{status==='current'?'현재 소속사':'이전 소속사'}</dt><dd>{rows.filter(row=>row.status===status).length?rows.filter(row=>row.status===status).map((row,index)=><span key={row.agencyId||row.name+index}><a href={row.sourceUrl} target="_blank" rel="noopener noreferrer" data-no-translate>{row.name}</a>{(row.startDate||row.endDate)&&<small>{row.startDate||'?'} – {row.endDate||'…'}</small>}</span>):'미확인'}</dd></div>)}</dl>:<p>검증된 소속사 이력 없음</p>}</section>,language);
}
