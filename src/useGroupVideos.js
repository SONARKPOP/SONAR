import {useEffect,useState} from 'react';

export function useGroupVideos(json,ids,enabled,version,retry){
 const key=ids.join(',');
 const [result,setResult]=useState({rows:[],failed:[],loading:false});
 useEffect(()=>{
  if(!enabled)return;
  let cancelled=false;
  const groups=key?key.split(','):[];
  if(!groups.length){
   setResult({rows:[],failed:[],loading:false});
   return;
  }
  setResult(previous=>({...previous,failed:[],loading:true}));
  async function load(){
   const loaded=new Map(),failed=[];
   for(let offset=0;offset<groups.length&&!cancelled;offset+=8){
    const batch=groups.slice(offset,offset+8);
    const responses=await Promise.allSettled(batch.map(id=>json(`groups/${id}.json`)));
    if(cancelled)return;
    responses.forEach((response,index)=>{
     if(response.status==='fulfilled')loaded.set(batch[index],response.value.items);
     else failed.push(batch[index]);
    });
    const done=offset+batch.length===groups.length;
    setResult({rows:[...loaded.values()].flat(),failed:[...failed],loading:!done});
   }
  }
  load();
  return ()=>{cancelled=true;};
 },[json,key,enabled,version,retry]);
 return result;
}
