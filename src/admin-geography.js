// Administrative boundary history is separate from an individual's profile evidence.
const rules=[
 {before:'충청북도 청원군 부용면 부강리',after:'세종특별자치시 부강면 부강리',effectiveFrom:'2012-07-01',sourceUrl:'https://www2.sejong.go.kr/sejongmaeul/archive/collection/ArchiveCollectionView.do?con_id=2892'},
 {before:'경상북도 군위군',after:'대구광역시 군위군',effectiveFrom:'2023-07-01',sourceUrl:'https://mcouncil.daegu.go.kr/attach/bbs/policy/8d171f90439e614caa8521f459046092.pdf'},
 {before:'인천광역시 남구',after:'인천광역시 미추홀구',effectiveFrom:'2018-07-01',sourceUrl:'https://www.law.go.kr/LSW/lsInfoR.do?ancYnChk=0&chrClsCd=010202&efYd=20180701&lsiSeq=202767'},
 {before:'경상남도 마산시',after:'경상남도 창원시',effectiveFrom:'2010-07-01',sourceUrl:'https://www.changwon.go.kr/cwportal/10310/10429/10432.web?amode=view&gcode=1011&idx=664742'},
 {before:'경상남도 진해시',after:'경상남도 창원시',effectiveFrom:'2010-07-01',sourceUrl:'https://www.changwon.go.kr/cwportal/10310/10429/10432.web?amode=view&gcode=1011&idx=664742'}
];
const starts=(text,name)=>text===name||text.startsWith(name+' ')||text.startsWith(name+'(');
export function administrativePlace(raw,gazetteer){
 const text=String(raw||'').normalize('NFKC').trim().replace(/\s+/g,' '),historical=text.split(/\(\s*(?:現|현|현재)\s*/)[0].trim();
 const rule=rules.find(r=>starts(historical,r.before));
 if(rule)return {text:rule.after+historical.slice(rule.before.length),change:{...rule,kind:'official-boundary-mapping',verificationStatus:'official-mapping'}};
 const current=text.match(/\(\s*(?:現|현|현재)\s*([^)]*)\)/)?.[1]?.trim();
 if(current){
  if(gazetteer.regions.some(r=>starts(current,r.name)))return {text:current,change:{before:historical,after:current,kind:'source-current-label',verificationStatus:'source-described'}};
  return {text:historical,review:{current,reason:'current label is not recognized by bundled map boundaries'}};
 }
 return {text};
}
