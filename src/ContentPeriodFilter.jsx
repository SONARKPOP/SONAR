import React,{useId} from 'react';
import {CalendarDays,ChevronDown,RotateCcw} from 'lucide-react';
import {useLanguage,translate} from './i18n';
import {uiPolishTranslations} from './ui-polish-translations';

export default function ContentPeriodFilter({years=[],year='',month='',onYear,onMonth}){
 const language=useLanguage(),id=useId();
 const t=text=>uiPolishTranslations[text]?.[{ja:0,en:1,es:2}[language]]??translate(text,language);
 const monthName=value=>new Intl.DateTimeFormat(language,{month:'short',timeZone:'UTC'}).format(new Date(Date.UTC(2000,Number(value)-1,1)));
 const summary=[year,month&&monthName(month)].filter(Boolean).join(' · ')||t('전체 기간');
 return <details className="content-period-filter compact-period">
  <summary aria-label={`${t('기간 선택')}: ${summary}`}><CalendarDays size={15} aria-hidden="true"/><span>{t('기간')}</span><small>{summary}</small><ChevronDown size={14} aria-hidden="true"/></summary>
  <div className="compact-period-panel">
   <div className="compact-period-year"><label htmlFor={id}>{t('연도')}</label><select id={id} value={year} onChange={event=>onYear(event.target.value)}><option value="">{t('전체 연도')}</option>{years.map(value=><option key={value} value={value}>{value}</option>)}</select><button type="button" className="compact-period-reset" aria-label={t('기간 초기화')} title={t('기간 초기화')} disabled={!year&&!month} onClick={()=>{onYear('');onMonth('');}}><RotateCcw size={15}/></button></div>
   <div className="compact-period-months" role="group" aria-label={t('월 선택')}><button type="button" className="compact-period-all" aria-pressed={!month} onClick={()=>onMonth('')}>{t('전체 월')}</button>{Array.from({length:12},(_,index)=>{const value=String(index+1).padStart(2,'0');return <button key={value} type="button" aria-pressed={Number(month)===index+1} onClick={()=>onMonth(value)}>{monthName(value)}</button>;})}</div>
  </div>
 </details>;
}
