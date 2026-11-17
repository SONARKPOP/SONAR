import sys,json,collections
from pathlib import Path
sys.path.insert(0,'work/map-tools')
from shapely.geometry import shape,mapping
from shapely.ops import unary_union
from shapely import make_valid
root=Path('public/data/maps')
source=json.loads(Path('work/korea-admin-source.geojson').read_text(encoding='utf-8-sig'))
old=json.loads((root/'korea-adm3.geojson').read_text(encoding='utf-8-sig'))
meta={f['properties']['mapKey']:f['properties'] for f in old['features']}
provinces=collections.defaultdict(list);districts=collections.defaultdict(list);wards=collections.defaultdict(list);province_codes={};district_codes={}
for f in source['features']:
 p=f['properties'];m=meta.get('kr3:'+p['adm_cd2'])
 if not m:continue
 geom=make_valid(shape(f['geometry']))
 provinces[m['sido']].append(geom);districts[m['district']].append(geom)
 province_codes[m['sido']]=p['sido'];district_codes[m['district']]=p['sgg']
 wards[m['district']].append({'type':'Feature','properties':m,'geometry':mapping(geom)})
def write(name,features):
 (root/(name+'.geojson')).write_text(json.dumps({'type':'FeatureCollection','features':features},ensure_ascii=False,separators=(',',':')),encoding='utf-8')
province_features=[{'type':'Feature','properties':{'name':name,'label':name,'country':'KR','level':1,'mapKey':'kr1:'+name},'geometry':mapping(unary_union(geoms))} for name,geoms in provinces.items()]
write('KR-adm1-hi',province_features)
children=collections.defaultdict(list)
for name,geoms in districts.items():
 sido=next(m['sido'] for m in meta.values() if m['district']==name)
 children[sido].append({'type':'Feature','properties':{'name':name,'sido':sido,'country':'KR','level':2,'mapKey':'kr2:'+name},'geometry':mapping(unary_union(geoms))})
adm2={};adm3={}
for sido,features in children.items():
 name='KR-adm2-'+province_codes[sido];write(name,features);adm2['kr1:'+sido]=name+'.geojson'
for district,features in wards.items():
 name='KR-adm3-'+district_codes[district];write(name,features);adm3['kr2:'+district]=name+'.geojson'
manifest=json.loads((root/'country-adm1-manifest.json').read_text(encoding='utf-8'))
manifest['countries']['KR']='KR-adm1-hi.geojson'
manifest['koreaDetail']={'adm2':adm2,'adm3':adm3,'source':'work/korea-admin-source.geojson; SGIS / vuski/admdongkor 2025-01-01 snapshot','sourceUrl':'https://github.com/vuski/admdongkor/blob/master/ver20250101/HangJeongDong_ver20250101.geojson','license':'SGIS KOGL Type 1; admdongkor CC BY 4.0; LICENSE-KOREA.txt','simplification':'none; polygon unions and validity repair only'}
(root/'country-adm1-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
print('Original-precision KR ADM1',len(province_features),'ADM2 shards',len(adm2),'ADM3 shards',len(adm3))
