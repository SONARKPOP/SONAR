import {useEffect,useState} from 'react';

const EMPTY={rows:[],byPath:new Map(),failed:[],loading:false};
const BATCH_SIZE=12;

export function useGroupVideos(json,paths,{enabled,version,retry}){
 const key=paths.join(',');
 const [result,setResult]=useState(EMPTY);
 useEffect(()=>{
  if(!enabled)return;
  if(!key){setResult(EMPTY);return;}
  let cancelled=false;
  const requests=key.split(',');
  setResult(previous=>({...previous,failed:[],loading:true}));
  async function load(){
   const loaded=new Map(),failed=[];
   for(let offset=0;offset<requests.length&&!cancelled;offset+=BATCH_SIZE){
    const batch=requests.slice(offset,offset+BATCH_SIZE);
    const responses=await Promise.allSettled(batch.map(path=>json(path)));
    if(cancelled)return;
    responses.forEach((response,index)=>{
     if(response.status==='fulfilled'&&Array.isArray(response.value?.items))loaded.set(batch[index],response.value.items);
     else failed.push(batch[index]);
    });
   }
   if(cancelled)return;
   setResult(previous=>{
    const byPath=new Map(requests.map(path=>[path,loaded.get(path)||previous.byPath.get(path)||[]]));
    return {rows:[...byPath.values()].flat(),byPath,failed,loading:false};
   });
  }
  load();
  return ()=>{cancelled=true;};
 },[json,key,enabled,version,retry]);
 return result;
}
