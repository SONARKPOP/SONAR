export async function parseDataResponse(response,path){
 if(!response.ok)throw new Error(`데이터를 불러오지 못했습니다: ${path} (HTTP ${response.status})`);
 const text=await response.text();
 if(/^\s*</.test(text))throw new Error(`데이터 파일 대신 웹페이지가 반환되었습니다: ${path}. 최신 미리보기를 다시 열거나 실행 중인 SONAR 서버를 재시작해주세요.`);
 try{return JSON.parse(text);}catch{throw new Error(`데이터 파일 형식이 올바르지 않습니다: ${path}. 데이터를 다시 갱신해주세요.`);}
}

export function createDataClient({base='./',fetcher=(...args)=>fetch(...args),snapshot=()=>globalThis.__SONAR_SNAPSHOT__}={}){
 const cache=new Map();
 let catalog;
 async function request(path){
  // Empty registered artists have no content to download yet. In particular,
  // newly added directory entries must not break the populated group indexes.
  const group=path.match(/^groups\/([^/]+)\.json$/)?.[1];
  if(group&&catalog?.groups.some(g=>g.id===group&&g.contentCount===0))return {schemaVersion:1,items:[],events:[]};
  const embedded=snapshot();
  let value;
  if(embedded){
   if(!Object.hasOwn(embedded,path))throw new Error(`미리보기에서 데이터 파일을 찾을 수 없습니다: ${path}. 최신 미리보기를 다시 열어주세요.`);
   value=embedded[path];
  }else{
   value=await parseDataResponse(await fetcher(`${base}data/${path}`,{cache:'no-store',headers:{Accept:'application/json'}}),path);
  }
  if(path==='catalog.json')catalog=value;
  return value;
 }
 function json(path){
  if(!cache.has(path))cache.set(path,request(path).catch(error=>{cache.delete(path);throw error;}));
  return cache.get(path);
 }
 return {json,cache};
}
