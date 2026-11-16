// The world dataset supplies the northern outline; detailed Korean polygons retain their original IDs.
export function koreaMapCollection(world,southern){
 const north=world?.features?.find(f=>(f.properties.ISO_A2_EH||f.properties.ISO_A2)==='KP');
 return {type:'FeatureCollection',features:[...(southern?.features||[]),...(north?[{...north,properties:{...north.properties,_country:'KP',name:'북한 지역 · 상세 행정구역 미수집'}}]:[])]};
}
