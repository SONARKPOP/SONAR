// Geographic labels identify places, not personal facts. Wikidata structured data: CC0.
// Reviewed 2026-11-16; country mapping provenance is separate from artist birthplace evidence.
export const GEOGRAPHIC_ALIASES=[
 ['TH','Q1861',['방콕','Bangkok','กรุงเทพมหานคร']],
 ['JP','Q1490',['도쿄도','도쿄','Tokyo','東京都']],
 ['JP','Q80434',['아이치현','愛知県']],
 ['JP','Q122723',['오사카부','大阪府']],
 ['JP','Q127513',['가나가와현','神奈川県']],
 ['JP','Q123258',['후쿠오카현','福岡県']],
 ['JP','Q128186',['사이타마현','埼玉県']],
 ['JP','Q130290',['효고현','兵庫県']],
 ['TW','Q1867',['타이베이시','타이베이','Taipei','臺北市','台北市']],
 ['CN','Q956',['베이징시','베이징','Beijing','北京市']],
 ['US','Q99',['캘리포니아주','캘리포니아 주','California']],
 ['US','Q782',['하와이주','하와이','Hawaii']],
 ['HK','Q8646',['홍콩','Hong Kong','香港']],
 ['MO','Q14773',['마카오','Macau','Macao','澳門']],
 ['SG','Q334',['싱가포르','Singapore','新加坡']]
].map(([country,id,aliases])=>({country,aliases,sourceUrl:`https://www.wikidata.org/wiki/${id}`,checkedAt:'2026-11-16',license:'CC0'})).concat({
 country:'AU',aliases:['빅토리아주 멜버른','빅토리아 주 멜버른','뉴사우스웨일스 주 시드니','뉴사우스웨일스주 시드니','퀸즐랜드 브리즈번'],
 sourceUrl:'https://www.abs.gov.au/statistics/people/population/regional-population/2023-24',checkedAt:'2026-11-18'
});
