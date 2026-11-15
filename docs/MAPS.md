# Birthplace maps

`BirthplaceMaps` accepts `{catalog}` and uses `uniquePeople(personDirectory(catalog))` for both world and Korea views. Each identity counts once per filter, including linked solo careers. The pure `resolveBirthplace(person)` export supports the analysis page without a component import.

Only `birthPlace` establishes location. `profileSources.birthPlace` is retained intact; wiki or missing official evidence remains marked for review. Nationality, residence and hometown are never substituted. Raw text is preserved. Exact administrative names and boundary-separated prefixes establish country/region. Bare ambiguous city/district names remain unknown. Korean city/district matching is scoped to its province; unmapped detail falls back only to a known province. Foreign locations currently aggregate at country level when an explicit country name/code matches. Foreign province-only text remains unmapped. No personal coordinate/address points are generated or displayed.

## Local assets and licensing

- `public/data/maps/world.geojson`: Natural Earth 1:110m admin-0 countries, downloaded from https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson . Public domain: https://www.naturalearthdata.com/about/terms-of-use/ . Equal Earth projection uses `d3-geo`: https://d3js.org/d3-geo/cylindrical#geoEqualEarth . Natural Earth depicts de facto boundaries; a boundary depiction is not a claim of sovereignty.
- `korea-sido.geojson` / `korea-sigungu.geojson`: 17 province and 252 municipality/district polygons derived from https://github.com/vuski/admdongkor/blob/master/ver20250101/HangJeongDong_ver20250101.geojson . Source geometry is published by vuski/admdongkor from Statistics Korea SGIS (https://sgis.kostat.go.kr). Upstream SGIS KOGL Type 1 attribution and derivative CC BY 4.0 attribution are preserved visibly in the component. Full dataset notice is bundled in `LICENSE-KOREA.txt`; source license https://github.com/vuski/admdongkor/blob/master/LICENSE-DATA and https://www.kogl.or.kr/info/licenseType1.do . SONAR merged dong polygons by province / municipality names and simplified at 0.0005 degrees, preserving topology. This is the explicitly labeled 2025-01-01 boundary snapshot, not an assertion of current or historical birth-year boundaries. No fabricated geometry or remote runtime map CDN.
- `src/birthplace-gazetteer.js`: exact name index generated from those local assets, including ISO country aliases and explicit Korean province renamings. No guessed geographic coordinates.

The Korea source's municipality labels combine non-autonomous city/district names (for example `수원시권선구`). Text matching should normalize that administrative formatting, while preserving the original birthplace display. Country/region counts can be higher than district counts because finer locations remain unknown.

## Verification

`node --test tests/birthplace-data.test.js` covers missing data, nationality isolation, ambiguous locations, region-only precision, structured fields, evidence status, and combined filters. A production build checks JSX integration. The map provides keyboard-selectable regions, a text count alternative, search, group/solo and selected artist filters, scale and directional controls, and a Korea transition. Personal location sources remain available on each list row.
