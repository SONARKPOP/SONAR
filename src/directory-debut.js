// Preserve supplied precision: a year is never expanded to January 1.
export function debutValue(date,year){
 const value=String(date||'');
 if(/^\d{4}(-\d{2}){0,2}$/.test(value))return value;
 return /^\d{4}$/.test(String(year||''))?String(year):'';
}
export function personDebut(person){
 const first=debutValue(person.firstDebutDate,person.firstDebutYear)||debutValue(person.debutDate,person.debutYear);
 if(first)return {label:'데뷔',value:first};
 const candidates=[...(person.memberships||[]).map(row=>({label:'그룹 데뷔',value:debutValue(row.debutDate,row.debutYear)})),
  ...(person.soloDebuts||[]).map(row=>({label:'솔로 데뷔',value:debutValue(row.date,row.year)}))].filter(row=>row.value);
 return candidates.sort((a,b)=>a.value.localeCompare(b.value))[0]||null;
}
