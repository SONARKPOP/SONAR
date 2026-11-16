# SONAR corrections and map coverage — 2026-11-16

## Playback and filtering

- Shorts have visible previous/next controls, intentional vertical swipe, and page-level arrow keys. Search/edit controls and the player's move/resize handles retain their own keys. Keys pressed inside the cross-origin YouTube frame retain YouTube behavior.
- Artist chips remain clickable after the user's correction. They now set an exact artist-ID condition, with the active condition and clear button in MY GROUPS and the existing applied-filter area.
- MY GROUPS uses one label/icon row plus a smaller count below. Activity opens all four states by default and supports OR selection among SURGE, SAILING, COASTING and ANCHORED. Existing favorites, mute preferences and IDs are unchanged; state choices use a new storage key.
- Sidebar horizontal overflow is disabled. Vertical scroll remains available with hidden tracks.

## Appearance accuracy

Hangul aliases now require token/particle boundaries and use cached patterns. Ordinary words such as 테이블, artist names such as 소유미, and 엑스러브 do not establish EvoL, SOYOU or LUV appearances. A one-character member alias needs group context. Nickname-style titles such as 해방촌 아이유 do not establish IU appearances.

Retained records are reclassified for specifically reviewed artist policies. The registry preserves that policy flag; publication applies the same cleanup so later collectors cannot reintroduce stale tags. Explicit editorial participation evidence and manual overrides remain protected. A reviewed guest-only challenge-title pattern distinguishes Davichi channel ownership from actual participation. The supplied LUCY clip and IU nickname clips also have explicit overrides.

Local group indexes were checked: 9PW-1Gf73h8 (Davichi), 5_d-NXiz7kg and yfNDuvFpQMI (IU), 4fl6QrhsbWo (EvoL), c-zHDiw4jRE (SOYOU/SISTAR), 08BnmP1eTjU (CLC/SORN), and 72U7zb-JxMs (LUV) no longer have the reported false associations.

## 배성재의 텐

The documented CHZZK Open API supports live discovery, but a documented program-VOD search/collection API was not confirmed. Existing CHZZK functionality remains unchanged. The requested YouTube fallback is `UC5AvCi0P9NtXsdLfzzfXgJw` / `@im_americano`, marked as a reviewed program partner, not an artist's official channel. The previous `bae-ten` / `@Bae_ten` source is explicitly excluded from collection and public indexes. Historical fallback uploads use the existing bounded archive pipeline; this change does not claim that every historical episode has been collected.

Sources: https://chzzk.gitbook.io/chzzk/chzzk-api/live , https://www.youtube.com/channel/UC5AvCi0P9NtXsdLfzzfXgJw , https://programs.sbs.co.kr/radio/ten/main

## Geography

Minnie already existed as `gidle-minnie`; her recorded birthplace was Bangkok, which the old country resolver did not recognize. A source-linked geographic alias table restores country resolution without creating another person. Reviewed foreign place labels restore 119 records. Nationality-only map overlays remain separate from birthplace facts and cannot assign a city/province. Multiple citizenships count once per person in coverage and once in each associated country.

Current audit: 1,955 distinct persons; 1,334 resolved birth countries, 429 nationality-only overlays and 192 unresolved countries. These are data-resolution counts, not official-biography verification counts. See geography-restored-20261116.json for source-linked records.

Park Chorong's original Cheongwon/Buyong/Bugang birthplace is retained and mapped to Sejong using the municipal boundary-history source. Other supported cases include Incheon Nam-gu → Michuhol-gu, Gunwi → Daegu, and Masan/Jinhae → Changwon. Only the specifically verified part of old Buyong-myeon is mapped to Sejong; the rest of old Cheongwon is not blindly reassigned. Source-provided current names are separately identified and only used when present in the bundled boundary index. Unrecognized current names remain in review. See admin-geography-restored-20261116.json; map boundaries are dated 2025-01-01.

Conventional display names are 대만 / 중국; raw source values and separate TW/CN identities are preserved. The Korea view includes the northern outline from the existing licensed world dataset, retaining detailed southern provinces/districts. Northern subnational detail is unavailable and explicitly labeled. Birth-country records and statistics remain distinct.

Maps support drag, cursor-anchored wheel zoom and two-finger pinch/pan. Button and keyboard alternatives remain. Gesture math, country identities, Minnie, Chorong, partial-boundary exclusions and northern extent have automated regression coverage. Interactive browser preview could not be opened in this environment; physical mobile touch testing is not claimed.

## Validation

pnpm test: 131 passed. Python unittest discovery with existing optional dump dependencies: 188 passed, no skips. Production build passed (1,700 modules). Supplied false-attribution cases were also checked against the rebuilt real group indexes. Existing preferences and artist/member IDs were preserved.

