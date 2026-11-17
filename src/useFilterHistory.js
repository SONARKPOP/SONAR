import {useEffect,useRef} from 'react';
import {createFilterHistory} from './filter-history';

export default function useFilterHistory(snapshot,onRestore,enabled){
 const control=useRef(null),restore=useRef(onRestore),last=useRef(snapshot),queryAt=useRef(0);
 restore.current=onRestore;
 const serialized=JSON.stringify(snapshot);
 useEffect(()=>{
  if(!enabled)return;
  control.current=createFilterHistory(window.history,window,snapshot,value=>{
   queryAt.current=0;last.current=value;restore.current(value);
  });
  last.current=snapshot;
  return()=>{control.current?.dispose();control.current=null;};
 },[enabled]);
 useEffect(()=>{
  if(!control.current)return;
  const previous=last.current;last.current=snapshot;
  const queryOnly=previous.query!==snapshot.query&&Object.keys(snapshot).every(k=>k==='query'||JSON.stringify(previous[k])===JSON.stringify(snapshot[k]));
  control.current.record(snapshot,queryOnly&&Date.now()-queryAt.current<500);
  queryAt.current=queryOnly?Date.now():0;
 },[serialized,enabled]);
}
