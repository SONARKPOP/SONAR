import React,{lazy,Suspense} from 'react';
import {localize,useLanguage} from './i18n';
const AnalysisPage=lazy(()=>import('./AnalysisPage'));
export default function AnalysisRoute(props){
 const language=useLanguage();
 return <Suspense fallback={localize(<p role="status" className="analysis-note">분석 화면을 준비하는 중…</p>,language)}><AnalysisPage {...props}/></Suspense>;
}
