export const PROFILE_COLUMNS_KEY='sonar.profile-statistics.columns.v1';
export const PROFILE_COLUMNS=[
 ['name','아티스트'],['agency','소속사','소속'],['label','레이블','소속'],['currentMembers','현재','멤버 수'],['formerMembers','이전 멤버','멤버 수'],['meanCurrentAge','평균','나이'],['minCurrentAge','최저','나이'],['medianCurrentAge','중앙','나이'],['maxCurrentAge','최고','나이'],['currentAgeStdDev','나이 표준편차'],['debutDate','데뷔일'],['meanDebutAge','데뷔 평균 나이'],['yearsSinceDebut','데뷔 경과'],['soloActivityMembers','솔로 활동 멤버']
].map(([key,label,group])=>({key,label,group}));
export function normalizeProfileColumns(value){
 const keys=PROFILE_COLUMNS.map(c=>c.key),order=Array.isArray(value?.order)?[...new Set(value.order.filter(k=>keys.includes(k)))]:[];
 return {order:[...order,...keys.filter(k=>!order.includes(k))],hidden:Array.isArray(value?.hidden)?[...new Set(value.hidden.filter(k=>keys.includes(k)&&k!=='name'))]:[]};
}
export function loadProfileColumns(storage){try{return normalizeProfileColumns(JSON.parse(storage?.getItem(PROFILE_COLUMNS_KEY)||'null'));}catch{return normalizeProfileColumns();}}
export function saveProfileColumns(storage,value){try{storage?.setItem(PROFILE_COLUMNS_KEY,JSON.stringify(normalizeProfileColumns(value)));}catch{/* Private browsing or full storage must not prevent table use. */}}
export function moveProfileColumn(value,key,target){
 const next=normalizeProfileColumns(value),from=next.order.indexOf(key),to=next.order.indexOf(target);
 if(from<0||to<0||from===to)return next;
 next.order.splice(from,1);next.order.splice(to,0,key);return next;
}
export function visibleProfileColumns(value){const state=normalizeProfileColumns(value);return state.order.filter(k=>!state.hidden.includes(k)).map(k=>PROFILE_COLUMNS.find(c=>c.key===k));}
// Repeat group headings for separated runs so arbitrary leaf order stays semantically correct.
export function profileColumnGroups(columns){return columns.reduce((groups,column)=>{const last=groups.at(-1);if(column.group&&last?.group===column.group)last.columns.push(column);else groups.push({group:column.group,columns:[column]});return groups;},[]);}
