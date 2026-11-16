import React,{lazy,Suspense} from 'react';
const AnalysisPage=lazy(()=>import('./AnalysisPage'));
export default function AnalysisRoute(props){
 return <Suspense fallback={<p role="status" className="analysis-note">분석 화면을 준비하는 중…</p>}><AnalysisPage {...props}/></Suspense>;
}
