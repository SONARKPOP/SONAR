import {nationalityView} from './person-directory.js';
export const uniqueMapRows=rows=>[...new Map(rows.map(row=>[row.person.id,row])).values()];
export function countryCitizens(rows,country,{query='',kind='all',groupId=''}={}){
 const q=query.normalize('NFKC').trim().toLocaleLowerCase();
 return uniqueMapRows(rows.filter(({person:p})=>(p.nationalities||[]).some(n=>nationalityView(n).code===country)&&(!groupId||p.memberships?.some(g=>g.groupId===groupId)||p.soloIds?.includes(groupId))&&(kind!=='group'||p.memberships?.length)&&(kind!=='solo'||p.soloIds?.length)&&(!q||[p.name,p.nameKo,...p.aliases||[],...p.memberships?.map(g=>g.name)||[],p.birthPlace&&JSON.stringify(p.birthPlace)].some(v=>String(v||'').normalize('NFKC').toLocaleLowerCase().includes(q))))).sort((a,b)=>String(a.person.name||'').localeCompare(String(b.person.name||''),'en')||String(a.person.id).localeCompare(String(b.person.id),'en'));
}
// Visibility depends on zoom, selected parent and screen density, never catalog counts.
export function boundaryPlan({country,region='',expanded=false,zoom=1,width=960,height=540,parentArea=0,featureCount=0,vertexCount=0,available={},koreaDetails={}}){
 const area=parentArea||width*height,withinBudget=(!featureCount||featureCount<=Math.max(1,Math.floor(area/1400)))&&(!vertexCount||vertexCount<=area/2);
 if(!country||(!expanded&&zoom<3))return {level:0,asset:null};
 if(country==='KR'&&region.startsWith('kr2:')&&zoom>=10&&area>=24000&&withinBudget)return {level:3,asset:koreaDetails.adm3?.[region]?.replace(/\.geojson$/,'')||null};
 if(country==='KR'&&region.startsWith('kr1:')&&zoom>=7&&area>=36000&&withinBudget)return {level:2,asset:koreaDetails.adm2?.[region]?.replace(/\.geojson$/,'')||null};
 return {level:1,asset:available[country]?.replace(/\.geojson$/,'')||null};
}
export function scopedBoundaryFeatures(collection,level,region){return (collection?.features||[]).filter(f=>level===2?f.properties.sido===region.slice(4):level===3?'kr2:'+f.properties.district===region:true);}
export function panelPosition(anchor,panel,viewport){return {left:Math.max(8,Math.min(anchor.x+12,viewport.width-panel.width-8)),top:Math.max(8,Math.min(anchor.y+12,viewport.height-panel.height-8))};}

export function geometryVertexCount(geometry){let count=0;const walk=coords=>{if(typeof coords?.[0]==='number')count++;else for(const child of coords||[])walk(child);};if(geometry?.type==='GeometryCollection')return geometry.geometries.reduce((n,g)=>n+geometryVertexCount(g),0);walk(geometry?.coordinates);return count;}
