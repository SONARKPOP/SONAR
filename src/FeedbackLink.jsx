import React from 'react';
import {MessageSquare,ArrowUpRight} from 'lucide-react';
import settings from '../config/feedback.json';
import {localize,useLanguage} from './i18n';
export function feedbackUrl(value){
 try{const url=new URL(value);return url.protocol==='https:'&&((url.hostname==='docs.google.com'&&url.pathname.startsWith('/forms/')&&url.pathname.endsWith('/viewform'))||url.hostname==='forms.gle')?url.href:null;}catch{return null;}
}
export default function FeedbackLink({responseUrl=settings.responseUrl}={}){
 const language=useLanguage();
 const url=feedbackUrl(responseUrl);
 return localize(<div className="sidebar-feedback">{url?<a href={url} target="_blank" rel="noreferrer"><MessageSquare size={15}/><span>개선 의견 보내기</span><ArrowUpRight size={13}/></a>:<button type="button" disabled title="Google Forms 응답 링크를 연결하면 이용할 수 있습니다"><MessageSquare size={15}/><span>개선 의견 · 준비 중</span></button>}<small>의견은 사이트에 공개되지 않습니다.</small></div>,language);
}
