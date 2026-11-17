// Boundary failure never removes the country person list. Failed requests remain retryable.
export async function loadCountryDetail({country,rows,assetName,cache={},fetcher=fetch,url=name=>name,signal}){
 const people=[...new Map(rows.filter(r=>r.location.country===country).map(r=>[r.person.id,r])).values()];
 if(!assetName)return {people,detail:null,error:null};
 if(cache[assetName])return {people,detail:cache[assetName],error:null};
 try{const response=await fetcher(url(assetName),{signal});if(!response.ok)throw Error('boundary-load-failed');const detail=await response.json();if(detail?.type!=='FeatureCollection'||!Array.isArray(detail.features))throw Error('invalid-boundary');return {people,detail,error:null};}
 catch(error){if(error.name==='AbortError')throw error;return {people,detail:null,error};}
}
