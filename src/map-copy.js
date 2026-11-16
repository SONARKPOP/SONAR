export const MAP_COPY={
 globe:['지구본','地球儀','Globe','Globo'],flat:['평면 지도','平面地図','Flat map','Mapa plano'],country:['국가','国','Country','País'],
 adm1:['주·도·현 (ADM1)','州・県 (ADM1)','State / province (ADM1)','Estado / provincia (ADM1)'],adm3:['읍·면·동 (ADM3)','邑・面・洞 (ADM3)','Town / ward (ADM3)','Municipio / barrio (ADM3)'],
 worldDetail:['세계 지도 상세 수준','世界地図の詳細度','World map detail','Detalle del mapa mundial'],
 loading:['지구본을 준비하는 중…','地球儀を準備中…','Preparing globe…','Preparando el globo…'],
 globeAria:['회전·확대 가능한 출생지 지구본','回転・拡大できる出生地の地球儀','Interactive birthplace globe','Globo interactivo de lugares de nacimiento'],
 graphicsError:['지구본을 표시할 수 없습니다. 평면 지도 또는 아래 지역 목록을 이용하세요.','地球儀を表示できません。平面地図または下の地域一覧をご利用ください。','The globe is unavailable. Use the flat map or region list below.','El globo no está disponible. Usa el mapa plano o la lista de regiones.'],
 fallbackNote:['세부 출생지가 없으면 국가 → 시·도 → 시·군·구까지만 집계합니다. 국적 기준 인물은 국가에만 표시합니다. 한국 읍·면·동은 2025년 행정동 경계이며 법정동과 이름이 다르면 상위 지역으로 표시합니다.','詳細な出生地が不明な場合は、確認済みの国・都道府県・市区郡まで集計します。国籍のみの人物は国にのみ表示します。韓国の邑・面・洞は2025年の行政洞境界で、法定洞と名称が異なる場合は上位地域に表示します。','Missing detail stays at the known country, province or district. Nationality-only entries stay at country level. Korean towns and wards use 2025 administrative boundaries; unmatched legal-neighborhood names stay at a broader level.','Si falta detalle, se conserva el país, provincia o distrito conocido. La nacionalidad solo se muestra por país. Los barrios coreanos usan límites administrativos de 2025; los nombres legales sin coincidencia se mantienen en una región más amplia.']
};
export function mapCopy(key,language='ko'){return MAP_COPY[key]?.[({ko:0,ja:1,en:2,es:3})[language]??0]||key;}
