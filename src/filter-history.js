const key=value=>JSON.stringify(value);
export function createFilterHistory(history,target,initial,onRestore){
 let current=key(initial);
 history.replaceState({...history.state,sonarFilters:initial},'');
 const pop=()=>{
  const snapshot=history.state?.sonarFilters;
  if(!snapshot||key(snapshot)===current)return;
  current=key(snapshot);onRestore(snapshot);
 };
 target.addEventListener('popstate',pop);
 return {
  record(snapshot,replace=false){if(key(snapshot)===current)return;current=key(snapshot);history[replace?'replaceState':'pushState']({...history.state,sonarFilters:snapshot},'');},
  dispose(){target.removeEventListener('popstate',pop);},
 };
}
