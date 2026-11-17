import defaultPolicy from '../config/affiliation-display.json' with {type:'json'};
// Presentation policy never alters identity, membership history, or search relations.
export function affiliationDisplayPolicy(groupId,policy=defaultPolicy){return {visible:true,priority:0,...policy.groups?.[groupId]};}
export function representativeAffiliations(person,{groups=[],policy=defaultPolicy,language='ko'}={}){
 const lookup=id=>groups instanceof Map?groups.get(id):groups.find(g=>g.id===id);
 const personPolicy=policy.people?.[person.id]||person.soloIds?.map(id=>policy.people?.[id]).find(Boolean)||{};
 const history=person.memberships||person.membershipHistory||[];
 const relations=history.length?history:[...new Set([...(person.previousGroupIds||[]),...(person.relatedGroupIds||[])])].map(groupId=>({groupId,status:person.previousGroupIds?.includes(groupId)?'former':'linked'}));
 const latest=new Map();
 for(const relation of [...relations].sort((a,b)=>String(a.sourceCheckedAt||a.startDate||'').localeCompare(String(b.sourceCheckedAt||b.startDate||''))))latest.set(relation.groupId,relation);
 return [...latest.values()].filter(r=>affiliationDisplayPolicy(r.groupId,policy).visible&&(!personPolicy.representativeGroupIds||personPolicy.representativeGroupIds.includes(r.groupId))).map(r=>{
  const group=lookup(r.groupId),name=r.name||group?.nameKo||group?.name||r.groupId;
  const status=personPolicy.statusByGroupId?.[r.groupId]||r.status;
  return {...r,status,id:r.groupId,name,label:status==='former'?({ko:'전 ',ja:'元 ',en:'Former ',es:'Ex '}[language]||'Former ')+name:name,affiliation:true};
 }).sort((a,b)=>Number(b.status==='current')-Number(a.status==='current')||(affiliationDisplayPolicy(b.groupId,policy).priority-affiliationDisplayPolicy(a.groupId,policy).priority));
}
export function isRepresentativeAffiliation(groupId,person,options={}){return representativeAffiliations(person,options).some(r=>r.groupId===groupId);}
