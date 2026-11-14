# SONAR 여성 아티스트 공식 채널 조사 — 2026-11-14

등록된 여성 그룹·유닛·듀오·솔로 전체를 조사 대상으로 삼았습니다. 자동 출처 조회를 전수 수행했으며, 모든 채널·인물 정보가 검증 완료됐다는 의미는 아닙니다. 실제 그룹 활동·해체 여부와 채널 존재 여부는 별개입니다.

| 대상 | 등록 수 | 채널 신원·근거 확인 | 검색 후 미해결 | 검색 전 | 전용 채널 없음 확정 |
|---|---:|---:|---:|---:|---:|
| 걸그룹·유닛 | 310 | 198 | 112 | 0 | 0 |
| 여성 듀오 | 6 | 4 | 2 | 0 | 0 |
| 여성 솔로 | 112 | 80 | 32 | 0 | 0 |
| 전체 조사 대상 | 428 | 282 | 146 | 0 | 0 |

전체 설정 프로필은 514개입니다. 남성 그룹 및 혼성 그룹은 이번 조사 대상에서 제외했습니다. 신규 전용 채널 레코드 114개, 기존 누락분 포함 새로 고정한 UC ID 164개입니다. 기존 아티스트·멤버 ID 및 기존 채널 레코드는 삭제하지 않았습니다.

## 판정 기준과 제한

- `verified`: 이번 조사에서 실제 YouTube UC ID와 등록 근거를 대조했습니다. 채널별 근거 등급 VERIFIED(공식 사이트/YouTube Official Artist Channel 헤더 등)와 SUPPORTED(독립 프로필·데이터베이스 및 실제 채널 신원 대조)를 별도 보존합니다.
- `unresolved`: 조회를 시도했지만 신원·소유·운영 채널 여부를 충분히 확정하지 못했습니다. HTTP 오류, 페이지 누락, 동명이인은 채널 없음의 근거가 아닙니다.
- `pending`: 아직 조회하지 않은 항목입니다. `no_dedicated_channel`은 명시적 근거를 검토한 경우에만 사용하며, 이번에는 없음으로 확정하지 않았습니다.
- Wikipedia/Wikidata는 영문·한글 이름을 묶어서 조회했습니다. KProfiles와 공식 링크도 조회했으나 일부 이름별 URL은 없거나 다른 인물 페이지일 수 있어 후보로만 사용했습니다.
- Fandom 일반 HTML은 403이었으나 Action API는 정상 응답했습니다. 정확한 제목 조회에 더해 미해결 대상의 검색·프로필 소속 맥락을 확인했습니다. `source_unavailable`은 접근 경로의 상태이며 아티스트 상태가 아닙니다.
- Topic·소속사/배급사 채널은 전용 운영 채널로 등록하지 않았습니다. 그룹·소속사 공용 관계는 별도 관계 테이블이며 동일 UC ID를 중복 생성하지 않습니다.
- KISS(미국 밴드), The Ark(스웨덴 밴드), Neuron Music의 동명 Swan 등 오탐을 제외했습니다. 퍼플키스 출신 Swan과 동명 가수를 합치지 않았습니다.

## 인물 및 프로필 정보

기존 멤버 고유 ID를 재사용하고 독립 솔로는 기존 아티스트 ID를 인물 ID로 사용합니다. 소속 이력과 인물 연결 근거가 부족한 솔로 3개는 새 인물로 임의 확정하지 않았습니다.
생년월일 신규 확정 등록은 0개입니다. 기존 32개 생년월일을 유지했습니다. 본명·국적·데뷔일·소속 정보의 Wikidata/Fandom 후보는 출처와 함께 분리했으며, 근거 없이 빈칸을 채우지 않았습니다. 그룹 데뷔일과 솔로 데뷔일은 서로 다른 필드입니다.

## 나무위키 보조 수집

`NAMUWIKI_API_KEY`는 GitHub Actions Secret/수집기 환경 변수로만 전달합니다. 키 발급이나 Secret 생성은 이 작업에서 수행하지 않았습니다. 기본 전체 수집 주기(6시간)마다 최대 12개, 2.1초 간격, 7일 캐시로 조회합니다. 실제 서비스 인증 성공 여부는 Actions 실행 결과로 확인해야 합니다.
덤프 후보는 기존 값 및 조사 장부의 Wikidata/Fandom 생년월일과 비교합니다. `matches_existing`, `corroborated_secondary`, `conflict`, `needs_cross_check`를 기록하며, 최신 공식 프로필 검토 전까지 canonical 데이터 자동 덮어쓰기를 하지 않습니다. 본문 전체나 개인 가족 정보를 저장하지 않습니다.

## 확인된 채널과 근거

| 아티스트 | 유형 | 채널 | 근거 등급 | 출처 |
|---|---|---|---|---|
| 2NE1 | group_official | https://www.youtube.com/channel/UCnsQjCVzmEd-YvlQZbo6zCg | VERIFIED | https://www.youtube.com/channel/UCnsQjCVzmEd-YvlQZbo6zCg · https://kpopdiscover.com/ja/official-links/ · https://www.wikidata.org/wiki/Q171885 |
| 3piece | group_official | https://www.youtube.com/channel/UCyjFCXOgWosrTfaPxr2xv7g | SUPPORTED | https://www.youtube.com/@3piece_official · https://kprofiles.com/3piece-members-profile/ · https://kpop.fandom.com/wiki/3piece |
| 3YE | group_official | https://www.youtube.com/channel/UCz39fXOBeGVe6OGUUL6v7Og | VERIFIED | https://www.youtube.com/channel/UCz39fXOBeGVe6OGUUL6v7Og · https://www.wikidata.org/wiki/Q65269682 · https://kprofiles.com/3ye-members-profile/ |
| 4MINUTE | group_official | https://www.youtube.com/channel/UC_Dm4o5UrbPr2uvM7VPUR6g | VERIFIED | https://www.youtube.com/channel/UC_Dm4o5UrbPr2uvM7VPUR6g · https://kpopdiscover.com/ja/official-links/ · https://www.wikidata.org/wiki/Q39682 |
| 4TEN | group_official | https://www.youtube.com/channel/UCGSOr1otx1IkFFoyIPcHX9A | VERIFIED | https://www.youtube.com/channel/UCGSOr1otx1IkFFoyIPcHX9A · https://kprofiles.com/4ten-members-profile/ · https://kpop.fandom.com/wiki/4TEN |
| A2O LITE | group_official | https://www.youtube.com/channel/UCw98hcIDLRffhOC1_ttd4Zg | VERIFIED | https://www.youtube.com/channel/UCw98hcIDLRffhOC1_ttd4Zg · https://kpopdiscover.com/ja/official-links/ · https://kprofiles.com/a2o-lite-members-profile/ |
| ablume | group_official | https://www.youtube.com/channel/UCKqoa0exZegOXx68Je6xVpQ | VERIFIED | https://www.youtube.com/@ablume_official · https://kprofiles.com/ablume-members-profile/ · https://kpop.fandom.com/wiki/Ablume |
| ADORA | solo_official | https://www.youtube.com/channel/UC8QgG_-2Uz_1PFOFBMYVyPg | SUPPORTED | https://www.youtube.com/channel/UC8QgG_-2Uz_1PFOFBMYVyPg · https://www.wikidata.org/wiki/Q109883832 · https://kpop.fandom.com/wiki/DJ_Suki |
| ADYA | group_official | https://www.youtube.com/channel/UC6GLQTI8PudrTb-tyk9zbDA | VERIFIED | https://www.youtube.com/channel/UC6GLQTI8PudrTb-tyk9zbDA · https://kpop.fandom.com/wiki/ADYA |
| aespa | group_official | https://www.youtube.com/channel/UC9GtSLeksfK4yuJ_g1lgQbg | VERIFIED | https://www.youtube.com/channel/UC9GtSLeksfK4yuJ_g1lgQbg · https://kpopdiscover.com/ja/official-links/ · https://www.wikidata.org/wiki/Q100877982 |
| After School | group_official | https://www.youtube.com/channel/UCa4bSotPcEV6ue9moWm9Y2Q | VERIFIED | https://www.youtube.com/channel/UCa4bSotPcEV6ue9moWm9Y2Q · https://www.wikidata.org/wiki/Q389067 |
| 에일리 | solo_official | https://www.youtube.com/channel/UCymeXjTfl8hMGN7M357oX3g | VERIFIED | https://www.youtube.com/channel/UCymeXjTfl8hMGN7M357oX3g · https://www.wikidata.org/wiki/Q487391 · https://kpop.fandom.com/wiki/Ailee |
| ALICE | group_official | https://www.youtube.com/channel/UCGra2vQ4K86AfXpnfs6RujA | SUPPORTED | https://www.youtube.com/@IOK_ALICE · https://kprofiles.com/alice-members-profile/ |
| ANS | group_official | https://www.youtube.com/channel/UCQT2CDn_eV3kpWp5lCszOAA | SUPPORTED | https://www.youtube.com/channel/UCQT2CDn_eV3kpWp5lCszOAA · https://kpop.fandom.com/wiki/ANS |
| AOA | group_official | https://www.youtube.com/channel/UCHMMStnbsv13tXigCkW_sBQ | VERIFIED | https://www.youtube.com/channel/UCHMMStnbsv13tXigCkW_sBQ · https://www.wikidata.org/wiki/Q492035 · https://kprofiles.com/aoa-members-profile/ |
| Apink | group_official | https://www.youtube.com/channel/UCmW1Pq56lA-k-GWpX1z8WPg | VERIFIED | https://www.youtube.com/channel/UCmW1Pq56lA-k-GWpX1z8WPg · https://kpopdiscover.com/ja/official-links/ · https://www.wikidata.org/wiki/Q483286 |
| APRIL | group_official | https://www.youtube.com/channel/UCzd-QY2q6hFyNb_bn9vtWQw | VERIFIED | https://www.youtube.com/channel/UCzd-QY2q6hFyNb_bn9vtWQw · https://kpop.fandom.com/wiki/APRIL · https://www.melon.com/artist/detail.htm?artistId=882818 |
| ARIAZ | group_official | https://www.youtube.com/channel/UCczq4fRpRvn--65MzYZEoWA | VERIFIED | https://www.youtube.com/channel/UCczq4fRpRvn--65MzYZEoWA · https://kpop.fandom.com/wiki/ARIAZ |
| ARTMS | group_official | https://www.youtube.com/channel/UChXC6ok0LaZIpf-50SIFf0Q | VERIFIED | https://www.youtube.com/@official_artms · https://kpopdiscover.com/ja/official-links/ · https://kprofiles.com/artms-members-profile/ |
| AtHeart | group_official | https://www.youtube.com/channel/UCgSDdHK0MNXOHv7oBC2dHXA | VERIFIED | https://www.youtube.com/channel/UCgSDdHK0MNXOHv7oBC2dHXA · https://kpopdiscover.com/ja/official-links/ · https://kprofiles.com/atheart-members-profile/ |
| AWU | group_official | https://www.youtube.com/channel/UCY2iucz_q49yPcDAYU25ykA | SUPPORTED | https://www.youtube.com/@AWUofc · https://kprofiles.com/awu-members-profile/ · https://kpop.fandom.com/wiki/AWU |
| Baby DONT Cry | group_official | https://www.youtube.com/channel/UCRjREQVSiThsjfgEGXnEBpw | VERIFIED | https://www.youtube.com/@BabyDONTCry.official · https://kpopdiscover.com/ja/official-links/ · https://kpop.fandom.com/wiki/Baby_DONT_Cry |
| BABYMONSTER | group_official | https://www.youtube.com/channel/UCqwUnggBBct-AY2lAdI88jQ | VERIFIED | https://www.youtube.com/@BABYMONSTER · https://kpopdiscover.com/ja/official-links/ · https://www.wikidata.org/wiki/Q115967938 |
| BADKIZ | group_official | https://www.youtube.com/channel/UCx35mlVZzAsYqfp4gt8p5fw | VERIFIED | https://www.youtube.com/user/badkiz2014 · https://kpop.fandom.com/wiki/BADKIZ |
| BADVILLAIN | group_official | https://www.youtube.com/channel/UCh0KpQuSJ9m0DaENZmnYwzw | VERIFIED | https://www.youtube.com/@BADVILLAIN_BPM · https://kpopdiscover.com/ja/official-links/ · https://www.wikidata.org/wiki/Q126365908 |
| 백아연 | solo_official | https://www.youtube.com/channel/UCLtN7HH_0wZHkbOCxEBMZgA | VERIFIED | https://www.youtube.com/@baekayeon_official · https://kpop.fandom.com/wiki/Baek_A_Yeon |
| 브브걸 | group_official | https://www.youtube.com/channel/UCy3LUnp2XlCR4DSZm7gA75w | VERIFIED | https://www.youtube.com/channel/UCy3LUnp2XlCR4DSZm7gA75w · https://kpopdiscover.com/ja/official-links/ · https://kprofiles.com/bbgirls-members-profile/ |
| 뷰티박스 | group_official | https://www.youtube.com/channel/UCw23FIL7lSQk_GmSEajZIfA | VERIFIED | https://www.youtube.com/channel/UCw23FIL7lSQk_GmSEajZIfA · https://www.wikidata.org/wiki/Q107491751 · https://kprofiles.com/beauty-box-members-profile/ |
| Berry Good | group_official | https://www.youtube.com/channel/UCuis1ZmbYTt5GP6yszCC0EQ | VERIFIED | https://www.youtube.com/channel/UCuis1ZmbYTt5GP6yszCC0EQ · https://kpopdiscover.com/ja/official-links/ · https://www.wikidata.org/wiki/Q18381082 |
| BESTie | group_official | https://www.youtube.com/channel/UCzAo9AuY0XacE2tvMgSHdSA | VERIFIED | https://www.youtube.com/channel/UCzAo9AuY0XacE2tvMgSHdSA · https://kpopdiscover.com/ja/official-links/ · https://www.wikidata.org/wiki/Q13813305 |
| BEWAVE | group_official | https://www.youtube.com/channel/UC3DxjskcSz2XBHI68yjsN3A | VERIFIED | https://www.youtube.com/@BEWAVE_official · https://kpop.fandom.com/wiki/BEWAVE |
| 비비 | solo_official | https://www.youtube.com/channel/UC8GmeiLd5xjh2j5VmdePWQw | VERIFIED | https://www.youtube.com/channel/UC8GmeiLd5xjh2j5VmdePWQw · https://kpop.fandom.com/wiki/BIBI · https://weverse.io/bibi/media |
| Billlie | group_official | https://www.youtube.com/channel/UCyc9sUCxELTDK9vELO5Fzeg | VERIFIED | https://www.youtube.com/channel/UCyc9sUCxELTDK9vELO5Fzeg · https://kpopdiscover.com/ja/official-links/ · https://www.wikidata.org/wiki/Q108888399 |
| BLACKPINK | group_official | https://www.youtube.com/channel/UCOmHUn--16B90oW2L6FRR3A | VERIFIED | https://www.youtube.com/channel/UCOmHUn--16B90oW2L6FRR3A · https://kpopdiscover.com/ja/official-links/ · https://www.wikidata.org/wiki/Q25056945 |
| 블랙스완 | group_official | https://www.youtube.com/channel/UCJFFWX6gUh1fdcGFGSvthQg | VERIFIED | https://www.youtube.com/channel/UCJFFWX6gUh1fdcGFGSvthQg · https://kprofiles.com/blackswan-members-profile/ |
| Blady | group_official | https://www.youtube.com/channel/UCRnMdAb11OrxmBkyaqr68xQ | SUPPORTED | https://www.youtube.com/@bladytvofficial · https://kpop.fandom.com/wiki/Blady |
| 블레스타 | group_official | https://www.youtube.com/channel/UCj4knzGMQqGNQOyXfcozJRw | SUPPORTED | https://www.youtube.com/channel/UCj4knzGMQqGNQOyXfcozJRw · https://kprofiles.com/blastar-members-profile/ · https://kpop.fandom.com/wiki/Blastar |
| BoA | solo_official | https://www.youtube.com/channel/UCYPtgd76D-o15reXD94BIoQ | VERIFIED | https://www.youtube.com/channel/UCYPtgd76D-o15reXD94BIoQ · https://www.wikidata.org/wiki/Q232449 · https://kpop.fandom.com/wiki/BoA |
| Bob Girls | group_official | https://www.youtube.com/channel/UCrQJgVBEwnbQ8NS1ecHzR6A | SUPPORTED | https://www.youtube.com/channel/UCrQJgVBEwnbQ8NS1ecHzR6A · https://kprofiles.com/bob-girls-members-profile/ · https://kpop.fandom.com/wiki/Bob_Girls |
| BONUSbaby | group_official | https://www.youtube.com/channel/UCQWTROGFzVaHDanfSk9TbCQ | SUPPORTED | https://www.youtube.com/channel/UCQWTROGFzVaHDanfSk9TbCQ · https://www.wikidata.org/wiki/Q28242736 · https://kpop.fandom.com/wiki/BONUSbaby |
| 보라미유 | solo_official | https://www.youtube.com/channel/UCEgIN0yG3PeVF4JfJ-ZG0UQ | VERIFIED | https://www.youtube.com/@Boramiyu · https://kprofiles.com/boramiyu-profile-facts/ |
| Brown Eyed Girls | group_official | https://www.youtube.com/channel/UCepFAcPmJZz46lJN5gdv1Cg | VERIFIED | https://www.youtube.com/channel/UCepFAcPmJZz46lJN5gdv1Cg · https://kpopdiscover.com/ja/official-links/ · https://www.wikidata.org/wiki/Q483253 |
| bugAboo | group_official | https://www.youtube.com/channel/UCeJi6SfLR6iZvfmWk5SIrYQ | VERIFIED | https://www.youtube.com/channel/UCeJi6SfLR6iZvfmWk5SIrYQ · https://www.wikidata.org/wiki/Q108378903 · https://kprofiles.com/bugaboo-members-profile/ |
| BURVEY | group_official | https://www.youtube.com/channel/UCTJquiE6yt23cC4D7foI4Xg | VERIFIED | https://www.youtube.com/@official_burvey · https://kprofiles.com/burvey-members-profile/ · https://kpop.fandom.com/wiki/BURVEY |
| BVNDIT | group_official | https://www.youtube.com/channel/UCNAIB6brZzCCe1QDXq0o7bQ | VERIFIED | https://www.youtube.com/channel/UCNAIB6brZzCCe1QDXq0o7bQ · https://kprofiles.com/bvndit-members-profile/ · https://kpop.fandom.com/wiki/BVNDIT |
| Candy Shop | group_official | https://www.youtube.com/channel/UC91GO3fs8uYWbJz1PBP92Ww | SUPPORTED | https://www.youtube.com/@BRAVE.CandyShop · https://www.wikidata.org/wiki/Q125171778 · https://kpop.fandom.com/wiki/Candy_Shop |
| Cherry Bullet | group_official | https://www.youtube.com/channel/UCMj-rf97DfMsZ6LbPa8Eoww | VERIFIED | https://www.youtube.com/channel/UCMj-rf97DfMsZ6LbPa8Eoww · https://kpop.fandom.com/wiki/Cherry_Bullet · https://world.kbs.co.kr/service/contents_view.htm?board_seq=412529&id=&lang=j&menu_cate=artist |
| Chocolat | group_official | https://www.youtube.com/channel/UCCxuZZ5PxIZVTsUojmfrG-w | SUPPORTED | https://www.youtube.com/user/TheRealChocolat · https://kprofiles.com/chocolat-members-profile/ · https://kpop.fandom.com/wiki/ChoColat |
| 청하 | solo_official | https://www.youtube.com/channel/UCtC14nS1y4T54RJMk4t08Uw | VERIFIED | https://www.youtube.com/channel/UCtC14nS1y4T54RJMk4t08Uw · https://kprofiles.com/chungha-profile-facts/ · https://search.naver.com/search.naver?query=%EC%B2%AD%ED%95%98%20%EC%9D%B8%EB%AC%BC%EC%A0%95%EB%B3%B4 |
| 츄 | solo_official | https://www.youtube.com/channel/UCvhVqA_5HnM7M5X6OcZlMbg | VERIFIED | https://www.youtube.com/@CHUUOfficial · https://weverse.io/chuu/highlight |
| cignature | group_official | https://www.youtube.com/channel/UCaRdmTJgO6w0esJPZUOzXrw | VERIFIED | https://www.youtube.com/channel/UCaRdmTJgO6w0esJPZUOzXrw · https://www.wikidata.org/wiki/Q84311821 · https://kprofiles.com/cignature-members-profile/ |
| CL | solo_official | https://www.youtube.com/channel/UCuX8lXIexG8dRXFx54CVm2Q | VERIFIED | https://www.youtube.com/channel/UCuX8lXIexG8dRXFx54CVm2Q · https://www.wikidata.org/wiki/Q483683 · https://kprofiles.com/cl-profile-facts/ |
| CLASSy | group_official | https://www.youtube.com/channel/UCbCyYn2M_1ccicwj-KU7t0Q | VERIFIED | https://www.youtube.com/channel/UCbCyYn2M_1ccicwj-KU7t0Q · https://kpopdiscover.com/ja/official-links/ · https://www.wikidata.org/wiki/Q111103138 |
| CLC | group_official | https://www.youtube.com/channel/UCnOTemIK0FqCe2FHbr9mWFw | VERIFIED | https://www.youtube.com/channel/UCnOTemIK0FqCe2FHbr9mWFw · https://kpopdiscover.com/ja/official-links/ · https://www.wikidata.org/wiki/Q19626731 |
| CODE ZiGU | group_official | https://www.youtube.com/channel/UCAFduvkBVGsCcDS7s0HJnHA | SUPPORTED | https://www.youtube.com/@CODEZiGU_official · https://kprofiles.com/code-zigu-members-profile/ · https://kpop.fandom.com/wiki/CODE_ZiGU |
| CRAXY | group_official | https://www.youtube.com/channel/UC-fowGyxbuwEMvmeLitbFPQ | VERIFIED | https://www.youtube.com/@CRAXY-SAI · https://kpop.fandom.com/wiki/CRAXY · https://www.kpopwise.com/2024/06/craxy-are-back-with-single-album-re.html |
| Crayon Pop | group_official | https://www.youtube.com/channel/UC88nGROvozD_D3FWojbNErA | VERIFIED | https://www.youtube.com/@crayonpopvideo · https://kpopdiscover.com/ja/official-links/ · https://www.wikidata.org/wiki/Q60157 |
| CrazAngel | group_official | https://www.youtube.com/channel/UC2ooQeVNljCwK5hJ6FRTeyg | VERIFIED | https://www.youtube.com/channel/UC2ooQeVNljCwK5hJ6FRTeyg · https://kprofiles.com/crazangel-members-profile/ · https://kpop.fandom.com/wiki/CrazAngel |
| 첫사랑 | group_official | https://www.youtube.com/channel/UCVE2m6JfuhSu6dHzB_IzpFA | SUPPORTED | https://www.youtube.com/channel/UCVE2m6JfuhSu6dHzB_IzpFA · https://www.wikidata.org/wiki/Q113240443 · https://kprofiles.com/csr-members-profile/ |
| Dal Shabet | group_official | https://www.youtube.com/channel/UCCZScmulXzGFCpnEQg7aR4w | VERIFIED | https://www.youtube.com/channel/UCCZScmulXzGFCpnEQg7aR4w · https://kpopdiscover.com/ja/official-links/ · https://www.wikidata.org/wiki/Q492146 |
| 달수빈 | solo_official | https://www.youtube.com/channel/UCNBqgJYMhqRm9HFvl2a3fzw | VERIFIED | https://www.youtube.com/channel/UCNBqgJYMhqRm9HFvl2a3fzw · https://kprofiles.com/dalsooobin-profile-facts/ · https://kpop.fandom.com/wiki/DALsooobin |
| 다비치 | group_official | https://www.youtube.com/channel/UCwZMmIVr07VLAfNcuqg9LZA | VERIFIED | https://www.youtube.com/@DAVICHIOFFICIAL · https://kpopdiscover.com/ja/official-links/ · https://www.wikidata.org/wiki/Q483209 |
| D.Holic | group_official | https://www.youtube.com/channel/UCK565peQ-vTXKH9Di0aI_eQ | VERIFIED | https://www.youtube.com/channel/UCK565peQ-vTXKH9Di0aI_eQ · https://www.wikidata.org/wiki/Q27450232 · https://kpop.fandom.com/wiki/D.Holic |
| DIA | group_official | https://www.youtube.com/channel/UCU22DE6WbPoOoXwvZBvLK7Q | VERIFIED | https://www.youtube.com/channel/UCU22DE6WbPoOoXwvZBvLK7Q · https://www.wikidata.org/wiki/Q20733515 |
| dodree | group_official | https://www.youtube.com/channel/UCDi5LcD2bYPVdA4mfaa-BKg | VERIFIED | https://www.youtube.com/@dodree_INNIT · https://kpopdiscover.com/ja/official-links/ · https://kprofiles.com/dodree-members-profile/ |
| Dreamcatcher | group_official | https://www.youtube.com/channel/UCijULR2sXLutCRBtW3_WEfA | VERIFIED | https://www.youtube.com/channel/UCijULR2sXLutCRBtW3_WEfA · https://kpopdiscover.com/ja/official-links/ · https://www.wikidata.org/wiki/Q20684822 |
| DreamNote | group_official | https://www.youtube.com/channel/UC_hB_xjVTZZ1s8__Tus0jQA | VERIFIED | https://www.youtube.com/@ime_dreamnote · https://kprofiles.com/dreamnote-members-profile/ · https://kpop.fandom.com/wiki/DreamNote |
| eite | group_official | https://www.youtube.com/channel/UCHEQRyJVe_o3tMdbKns0NtQ | SUPPORTED | https://www.youtube.com/@eite_official · https://kprofiles.com/eite-members-profile/ · https://kpop.fandom.com/wiki/Eite |
| 이젤 | solo_official | https://www.youtube.com/channel/UC8whmo5_lTEbugyP6JHG_wA | VERIFIED | https://www.youtube.com/@ejel-zip |
| EL7Z UP | group_official | https://www.youtube.com/channel/UCYl7PvnFM7QSuUXeoFwNFpA | VERIFIED | https://www.youtube.com/channel/UCYl7PvnFM7QSuUXeoFwNFpA · https://www.wikidata.org/wiki/Q121501677 · https://kprofiles.com/el7z-up-members-profile/ |
| ELKIE | member_personal | https://www.youtube.com/channel/UCXuYU9B853ZyWuAhGVRhThg | SUPPORTED | https://www.youtube.com/@ELKIEOfficial · https://kpop.fandom.com/wiki/Elkie |
| EVERGLOW | group_official | https://www.youtube.com/channel/UCbcvke2YXvSAhTXSDMEAwpA | VERIFIED | https://www.youtube.com/@everglow_offcl · https://kpopdiscover.com/ja/official-links/ · https://kprofiles.com/everglow-members-profile/ |
| EXID | group_official | https://www.youtube.com/channel/UCZDD7mbBlV-Mg-vpI6wQvSA | VERIFIED | https://www.youtube.com/channel/UCZDD7mbBlV-Mg-vpI6wQvSA · https://kprofiles.com/exid-members-profile/ · https://kpop.fandom.com/wiki/EXID |
| Favorite | group_official | https://www.youtube.com/channel/UCpJTTbU6UUbaujM3wvm_4EA | SUPPORTED | https://www.youtube.com/channel/UCpJTTbU6UUbaujM3wvm_4EA · https://www.wikidata.org/wiki/Q41253535 · https://kprofiles.com/favorite-members-profile/ |
| 페이 | member_personal | https://www.youtube.com/channel/UCtzIhbBKjQTCngwylHDi3dA | SUPPORTED | https://www.youtube.com/@feiofficial · https://kpop.fandom.com/wiki/Fei |
| 페리블루 | group_official | https://www.youtube.com/channel/UC7WtI0afwfGeXOmUf06V9Wg | SUPPORTED | https://www.youtube.com/channel/UC7WtI0afwfGeXOmUf06V9Wg · https://kprofiles.com/ferry-blue-members-profile/ · https://kpop.fandom.com/wiki/Ferry_Blue |
| Feverse | group_official | https://www.youtube.com/channel/UC3ubYqCkI3K1wzwzRVrHexg | SUPPORTED | https://www.youtube.com/@girlsreverse · https://kprofiles.com/feverse-members-profile/ · https://kpop.fandom.com/wiki/Feverse |
| FIFTY FIFTY | group_official | https://www.youtube.com/channel/UCJEER74X9kBenMT_x9iK9Mw | VERIFIED | https://www.youtube.com/@we_FiftyFifty · https://kpopdiscover.com/ja/official-links/ · https://www.wikidata.org/wiki/Q116731010 |
| FLASHE | group_official | https://www.youtube.com/channel/UCGRvpAt6D21nA8lvyUpQLDg | SUPPORTED | https://www.youtube.com/user/flashe05 · https://kpop.fandom.com/wiki/FLASHE |
| 플로리아 | group_official | https://www.youtube.com/channel/UCJyVlk9ziPyAtGLTi0Jn79g | SUPPORTED | https://www.youtube.com/channel/UCJyVlk9ziPyAtGLTi0Jn79g · https://kprofiles.com/floria-members-profile/ |
| fromis_9 | group_official | https://www.youtube.com/channel/UC8qO5racajmy4YgPgNJkVXg | SUPPORTED | https://www.youtube.com/@officialfromis9 · https://kpopdiscover.com/ja/official-links/ · https://kpop.fandom.com/wiki/Fromis_9 |
| Geenius | group_official | https://www.youtube.com/channel/UCwOSPKpkwK4ZN0NJZ7rWpIQ | SUPPORTED | https://www.youtube.com/channel/UCwOSPKpkwK4ZN0NJZ7rWpIQ · https://kprofiles.com/geenius-members-profile/ · https://kpop.fandom.com/wiki/Geenius |
| GFRIEND | group_official | https://www.youtube.com/channel/UCRDd3x33kfF0IW6g2MRUkRw | VERIFIED | https://www.youtube.com/channel/UCRDd3x33kfF0IW6g2MRUkRw · https://kpopdiscover.com/ja/official-links/ · https://www.wikidata.org/wiki/Q18733030 |
| i-dle | group_official | https://www.youtube.com/channel/UCritGVo7pLJLUS8wEu32vow | VERIFIED | https://www.youtube.com/@official_i_dle · https://kpopdiscover.com/ja/official-links/ · https://www.wikidata.org/wiki/Q51885404 |
| Girl's Day | group_official | https://www.youtube.com/channel/UCw-HcGlT9V7ErYfoAPvem4A | VERIFIED | https://www.youtube.com/channel/UCw-HcGlT9V7ErYfoAPvem4A · https://www.wikidata.org/wiki/Q497325 · https://kpop.fandom.com/wiki/Girl%27s_Day |
| Girls' Generation | group_official | https://www.youtube.com/channel/UCPENYtHg4Xhmm6oX8zaQA7Q | VERIFIED | https://www.youtube.com/@GIRLSGENERATION · https://www.wikidata.org/wiki/Q20153 · https://kpop.fandom.com/wiki/Girls%27_Generation |
| 소녀세상 | group_official | https://www.youtube.com/channel/UCPhfrW2f5BB1BYVhN8xl41Q | SUPPORTED | https://www.youtube.com/channel/UCPhfrW2f5BB1BYVhN8xl41Q · https://kprofiles.com/girls-world-members-profile/ |
| gugudan | group_official | https://www.youtube.com/channel/UCAZrFlkKqpTqn8ZISJ616xg | VERIFIED | https://www.youtube.com/channel/UCAZrFlkKqpTqn8ZISJ616xg · https://kpopdiscover.com/ja/official-links/ · https://www.wikidata.org/wiki/Q24694634 |
| GWSN | group_official | https://www.youtube.com/channel/UCUT58qBbE4Y3Y4FClOJOfrg | VERIFIED | https://www.youtube.com/channel/UCUT58qBbE4Y3Y4FClOJOfrg · https://kpopdiscover.com/ja/official-links/ · https://www.wikidata.org/wiki/Q55715778 |
| 규빈 | solo_official | https://www.youtube.com/channel/UC_LYo-XUprbXoGL1VtMJbzg | VERIFIED | https://www.youtube.com/@Gyubin · https://kprofiles.com/gyubin-profile-facts/ · https://linktr.ee/live.gyubin |
| H1-KEY | group_official | https://www.youtube.com/channel/UC0novDS2VRX59Trmbf83I3g | VERIFIED | https://www.youtube.com/@H1KEY_official · https://kpopdiscover.com/ja/official-links/ · https://kprofiles.com/h1-key-members-profile/ |
| 한로로 | solo_official | https://www.youtube.com/channel/UCrDa_5OU-rhvXqWlPx5hgKQ | VERIFIED | https://www.youtube.com/channel/UCrDa_5OU-rhvXqWlPx5hgKQ · https://www.wikidata.org/wiki/Q134958723 · https://kprofiles.com/hanroro-profile-facts/ |
| 핫펠트 | solo_official | https://www.youtube.com/channel/UC7vPYWJfBGTd8ccq6h3Vgmg | VERIFIED | https://www.youtube.com/channel/UC7vPYWJfBGTd8ccq6h3Vgmg · https://www.wikidata.org/wiki/Q483638 · https://kpop.fandom.com/wiki/HA%3ATFELT |
| HEART OF WOMAN | group_official | https://www.youtube.com/channel/UCfP7KJRAHghtG_Sn0aLi_DQ | VERIFIED | https://www.youtube.com/channel/UCfP7KJRAHghtG_Sn0aLi_DQ · https://kpopdiscover.com/ja/official-links/ · https://kprofiles.com/heart-of-woman-members-profile/ |
| Hearts2Hearts | group_official | https://www.youtube.com/channel/UC7Q3HUnJA3nvjZR2JeMn2Cw | VERIFIED | https://www.youtube.com/channel/UC7Q3HUnJA3nvjZR2JeMn2Cw · https://www.wikidata.org/wiki/Q131746784 · https://kpopdiscover.com/ja/official-links/ |
| 헤이즈 | solo_official | https://www.youtube.com/channel/UCsXigGjbC_l4ttk-oahTfVg | VERIFIED | https://www.youtube.com/channel/UCsXigGjbC_l4ttk-oahTfVg · https://www.wikidata.org/wiki/Q24855768 · https://kprofiles.com/heize-profile-facts/ |
| HELLOVENUS | group_official | https://www.youtube.com/channel/UCSshlhZx6y5hAyzPxxuSO6Q | SUPPORTED | https://www.youtube.com/user/chHelloVenus · https://kprofiles.com/hello-venus-members-profile/ · https://kpop.fandom.com/wiki/HELLOVENUS |
| HIGHTEEN | group_official | https://www.youtube.com/channel/UCjUWIhz4MBJddJpC57CMcdw | SUPPORTED | https://www.youtube.com/@highteen_official9617 · https://kpop.fandom.com/wiki/HIGHTEEN |
| HINAPIA | group_official | https://www.youtube.com/channel/UCFcmN6MJ1cAEKU3zZ317uHg | SUPPORTED | https://www.youtube.com/channel/UCFcmN6MJ1cAEKU3zZ317uHg · https://kprofiles.com/hinapia-members-profile/ · https://kpop.fandom.com/wiki/HINAPIA |
| HITGS | group_official | https://www.youtube.com/channel/UCgiJf4Qcigccr9lAXAA9hFQ | VERIFIED | https://www.youtube.com/channel/UCgiJf4Qcigccr9lAXAA9hFQ · https://kpop.fandom.com/wiki/HITGS · https://www.youtube.com/watch?v=3ensCfpaUWI |
| 핫이슈 | group_official | https://www.youtube.com/channel/UCLMPaSnZXeUHA_AeOGJhvfg | VERIFIED | https://www.youtube.com/channel/UCLMPaSnZXeUHA_AeOGJhvfg · https://kprofiles.com/hot-issue-members-profile/ · https://dbkpop.com/group/hot-issue/ |
| 화사 | solo_official | https://www.youtube.com/channel/UCiM8arBZ-GyuBFG3wy6fEgw | VERIFIED | https://www.youtube.com/channel/UCiM8arBZ-GyuBFG3wy6fEgw · https://www.wikidata.org/wiki/Q19603912 · https://kprofiles.com/hwasa-profile-facts/ |
| HYNN | solo_official | https://www.youtube.com/channel/UCYqrMvzivB3xHHe2eoVrORw | VERIFIED | https://www.youtube.com/channel/UCYqrMvzivB3xHHe2eoVrORw · https://kpop.fandom.com/wiki/HYNN · https://world.kbs.co.kr/service/contents_view.htm?board_seq=372063&lang=j |
| 효연 | solo_official | https://www.youtube.com/channel/UCy09Uze1QeJPWycuOMPhjsw | VERIFIED | https://www.youtube.com/channel/UCy09Uze1QeJPWycuOMPhjsw · https://www.wikidata.org/wiki/Q253619 |
| 효린 | solo_official | https://www.youtube.com/channel/UCNJofNT5w33_mycys970x8g | VERIFIED | https://www.youtube.com/channel/UCNJofNT5w33_mycys970x8g · https://www.wikidata.org/wiki/Q496329 |
| H//PE Princess | group_official | https://www.youtube.com/channel/UCgCA4Qj2HRVw5STi2F3DY3g | VERIFIED | https://www.youtube.com/channel/UCgCA4Qj2HRVw5STi2F3DY3g · https://kpopdiscover.com/ja/official-links/ |
| 현아 | solo_official | https://www.youtube.com/channel/UC0uTcuuOtUFwtn9aKUVGjXg | VERIFIED | https://www.youtube.com/channel/UC0uTcuuOtUFwtn9aKUVGjXg · https://www.wikidata.org/wiki/Q234066 · https://kprofiles.com/hyuna-profile/ |
| I.MET.U | group_official | https://www.youtube.com/channel/UC_eFl14xSLBlVGLTH-cCq9w | VERIFIED | https://www.youtube.com/channel/UC_eFl14xSLBlVGLTH-cCq9w · https://kpop.fandom.com/wiki/I.MET.U |
| I:MOND | group_official | https://www.youtube.com/channel/UCs2kpHLbJL-WUZnGkNf9QIw | SUPPORTED | https://www.youtube.com/channel/UCs2kpHLbJL-WUZnGkNf9QIw · https://kpop.fandom.com/wiki/I%3AMOND |
| ICHILLIN' | group_official | https://www.youtube.com/channel/UC7IR4SfiQGtmLKzSnC7CYww | VERIFIED | https://www.youtube.com/channel/UC7IR4SfiQGtmLKzSnC7CYww · https://kpopdiscover.com/ja/official-links/ · https://www.wikidata.org/wiki/Q109256946 |
| 아이씨유 | group_official | https://www.youtube.com/channel/UCMyAa2aVmJ1ScnfJxL2h1zQ | SUPPORTED | https://www.youtube.com/channel/UCMyAa2aVmJ1ScnfJxL2h1zQ · https://kprofiles.com/icu-members-profile/ · https://kpop.fandom.com/wiki/ICU |
| ifeye | group_official | https://www.youtube.com/channel/UCnQRdSArF-aqtycrmMKFQAg | VERIFIED | https://www.youtube.com/channel/UCnQRdSArF-aqtycrmMKFQAg · https://kpopdiscover.com/ja/official-links/ · https://kpop.fandom.com/wiki/Ifeye |
| iii | group_official | https://www.youtube.com/channel/UCgs7HQUD1D9wtLrfQ9qfm5g | VERIFIED | https://www.youtube.com/channel/UCgs7HQUD1D9wtLrfQ9qfm5g · https://kprofiles.com/iii-members-profile/ · https://kpop.fandom.com/wiki/Iii |
| IITERNITI | group_official | https://www.youtube.com/channel/UCSnQSjVVHs5bHKIpTJ7vqoA | SUPPORTED | https://www.youtube.com/@iiterniti · https://kpop.fandom.com/wiki/IITERNITI |
| ILLIT | group_official | https://www.youtube.com/channel/UCEpFoWeCMCo5z3EvWaz6hQQ | VERIFIED | https://www.youtube.com/@ILLIT_official · https://kpopdiscover.com/ja/official-links/ · https://www.wikidata.org/wiki/Q122179261 |
| 아일리원 | group_official | https://www.youtube.com/channel/UCpmWSme0G0rE3-H-SFL34iw | VERIFIED | https://www.youtube.com/channel/UCpmWSme0G0rE3-H-SFL34iw · https://www.wikidata.org/wiki/Q110959886 · https://kprofiles.com/ily1-members-profile/ |
| 아이린 | solo_official | https://www.youtube.com/channel/UCyDd_CdcEtQk-jbmrBhBl5w | VERIFIED | https://www.youtube.com/@IRENEsmtown · https://kpop.fandom.com/wiki/Irene_%28Red_Velvet%29 |
| IRRIS | group_official | https://www.youtube.com/channel/UCDw3HCcT01B8A037zTQoo9g | SUPPORTED | https://www.youtube.com/channel/UCDw3HCcT01B8A037zTQoo9g · https://kpop.fandom.com/wiki/IRRIS |
| ITZY | group_official | https://www.youtube.com/channel/UCDhM2k2Cua-JdobAh5moMFg | VERIFIED | https://www.youtube.com/@ITZY · https://kpopdiscover.com/ja/official-links/ · https://www.wikidata.org/wiki/Q60732823 |
| IU | solo_official | https://www.youtube.com/channel/UC3SyT4_WLHzN7JmHQwKQZww | VERIFIED | https://www.youtube.com/@dlwlrma · https://www.wikidata.org/wiki/Q20145 · https://kpop.fandom.com/wiki/IU |
| IVE | group_official | https://www.youtube.com/channel/UC-Fnix71vRP64WXeo0ikd0Q | VERIFIED | https://www.youtube.com/channel/UC-Fnix71vRP64WXeo0ikd0Q · https://kpopdiscover.com/ja/official-links/ · https://www.wikidata.org/wiki/Q109375061 |
| izna | group_official | https://www.youtube.com/channel/UCfbYNlxgLuKJXQZEhkMmaCQ | VERIFIED | https://www.youtube.com/@izna_offcl · https://kpopdiscover.com/ja/official-links/ · https://www.wikidata.org/wiki/Q127162707 |
| IZ*ONE | group_official | https://www.youtube.com/channel/UCe_oTYByLWQYCUmgmOMU_xw | VERIFIED | https://www.youtube.com/channel/UCe_oTYByLWQYCUmgmOMU_xw · https://www.wikidata.org/wiki/Q56402353 · https://kprofiles.com/izone-members-profile/ |
| 이지카이트 | solo_official | https://www.youtube.com/channel/UCkiY5F4jBF6Z0YaEF9WZVCw | VERIFIED | https://www.youtube.com/channel/UCkiY5F4jBF6Z0YaEF9WZVCw · https://kprofiles.com/izykite-profile-facts/ |
| 제니 | solo_official | https://www.youtube.com/channel/UCNYi_zGmR519r5gYdOKLTjQ | VERIFIED | https://www.youtube.com/@jennierubyjane · https://www.wikidata.org/wiki/Q26262599 |
| 전효성 | solo_official | https://www.youtube.com/channel/UCTamE9g1cVy7hz4Q1bE56cQ | VERIFIED | https://www.youtube.com/channel/UCTamE9g1cVy7hz4Q1bE56cQ · https://www.wikidata.org/wiki/Q491568 |
| 전소미 | solo_official | https://www.youtube.com/channel/UCGrZ9Yu14T53h5YLsxOXkCw | VERIFIED | https://www.youtube.com/channel/UCGrZ9Yu14T53h5YLsxOXkCw · https://www.jeonsomiofficial.com/home/ |
| Jewelry | group_official | https://www.youtube.com/channel/UCbUprAQrminyRhZ6kkyBf5g | SUPPORTED | https://www.youtube.com/channel/UCbUprAQrminyRhZ6kkyBf5g · https://kpopdiscover.com/ja/official-links/ · https://www.wikidata.org/wiki/Q490873 |
| 지수 | solo_official | https://www.youtube.com/channel/UCRE-097LGtx_Zo7LrHvkycA | VERIFIED | https://www.youtube.com/@sooyaaa__ |
| 조유리 | solo_official | https://www.youtube.com/channel/UCSEVFgCkKem_c3nIBm7F37g | VERIFIED | https://www.youtube.com/channel/UCSEVFgCkKem_c3nIBm7F37g · https://www.wikidata.org/wiki/Q56678033 |
| 정은지 | solo_official | https://www.youtube.com/channel/UCHTZl9wrDAV45L8IPS7ZYzg | VERIFIED | https://www.youtube.com/channel/UCHTZl9wrDAV45L8IPS7ZYzg · https://www.wikidata.org/wiki/Q487831 |
| 주니엘 | solo_official | https://www.youtube.com/channel/UCsmvlXuU-vTEjHwuLaLzNDw | VERIFIED | https://www.youtube.com/@officialjuniel · https://www.wikidata.org/wiki/Q487683 · https://www.youtube.com/watch?v=0UR8KpUcIEQ |
| Kandis | group_official | https://www.youtube.com/channel/UCOnqUzQeSyCLwk1Z2Bk3-uA | VERIFIED | https://www.youtube.com/channel/UCOnqUzQeSyCLwk1Z2Bk3-uA · https://kprofiles.com/kandis-members-profile/ · https://kpop.fandom.com/wiki/Kandis |
| KARA | group_official | https://www.youtube.com/channel/UCbxYZzVHUrv-AhR6KZzGo0A | VERIFIED | https://www.youtube.com/channel/UCbxYZzVHUrv-AhR6KZzGo0A · https://kpopdiscover.com/ja/official-links/ · https://kprofiles.com/kara-members-profile/ |
| 케이시 | solo_official | https://www.youtube.com/channel/UCfxrNQQDxLhBoOeOZeUolbQ | VERIFIED | https://www.youtube.com/@Kassy · https://kpop.fandom.com/wiki/Kassy |
| KEEMBO | group_official | https://www.youtube.com/channel/UCAWZzvQhJ0UI6P4ySs1q_iA | SUPPORTED | https://www.youtube.com/channel/UCAWZzvQhJ0UI6P4ySs1q_iA · https://kprofiles.com/keembo-members-profile/ · https://kpop.fandom.com/wiki/KEEMBO |
| 케이 | solo_official | https://www.youtube.com/channel/UC44P3jOFSABphClNfUWJ1OQ | VERIFIED | https://www.youtube.com/@KeiOffcl · https://kpop.fandom.com/wiki/Kei_%28Lovelyz%29 |
| KELT9b | group_official | https://www.youtube.com/channel/UCOMlpu1W4n52GthcX4rMtFw | VERIFIED | https://www.youtube.com/channel/UCOMlpu1W4n52GthcX4rMtFw · https://kprofiles.com/kelt9b-members-profile/ |
| Kep1er | group_official | https://www.youtube.com/channel/UC8whlOg70m2Yr3qSMjUhh0g | VERIFIED | https://www.youtube.com/channel/UC8whlOg70m2Yr3qSMjUhh0g · https://www.wikidata.org/wiki/Q109077000 · https://kprofiles.com/kep1er-members-profile/ |
| Keyveatz | group_official | https://www.youtube.com/channel/UCuGezLt65lqs_-aMpRmcu5g | VERIFIED | https://www.youtube.com/channel/UCuGezLt65lqs_-aMpRmcu5g · https://kpopdiscover.com/ja/official-links/ · https://kpop.fandom.com/wiki/Keyveatz |
| KiiiKiii | group_official | https://www.youtube.com/channel/UCaHwGJXFb28TekZMf7iFg5Q | VERIFIED | https://www.youtube.com/channel/UCaHwGJXFb28TekZMf7iFg5Q · https://www.wikidata.org/wiki/Q132526762 · https://kpopdiscover.com/ja/official-links/ |
| KIIRAS | group_official | https://www.youtube.com/channel/UCW8rNB6E9ykg1atcYZzozpg | VERIFIED | https://www.youtube.com/@KIIRASofficial · https://kpopdiscover.com/ja/official-links/ · https://kpop.fandom.com/wiki/KIIRAS |
| 김세정 | member_personal | https://www.youtube.com/channel/UCq5CDi36d6UPh_wlKl-0TUA | SUPPORTED | https://www.youtube.com/@OFFICIALKIMSEJEONG0828 · https://kpop.fandom.com/wiki/Kim_Sejeong |
| KISS OF LIFE | group_official | https://www.youtube.com/channel/UCvEEeBssb4XxIfWWIB8IjMw | VERIFIED | https://www.youtube.com/@KISSOFLIFE_official · https://kpopdiscover.com/ja/official-links/ · https://kprofiles.com/kiss-of-life-members-profile/ |
| 권은비 | solo_official | https://www.youtube.com/channel/UConJnFkj7YTb8FaysHfGpPw | VERIFIED | https://www.youtube.com/@KWONEUNBI_OFFICIAL · https://weverse.io/kwoneunbi/notice/36672 |
| 권진아 | solo_official | https://www.youtube.com/channel/UC5KDvE51c8EqBK8G3Lv-7-g | VERIFIED | https://www.youtube.com/@kwonjinah_official |
| LABOUM | group_official | https://www.youtube.com/channel/UCB4HIC-s6wpVvT8o1D1n7aQ | SUPPORTED | https://www.youtube.com/channel/UCB4HIC-s6wpVvT8o1D1n7aQ · https://kpopdiscover.com/ja/official-links/ · https://www.wikidata.org/wiki/Q18344661 |
| LADIES' CODE | group_official | https://www.youtube.com/channel/UC-MlYzrnfAkW3YYqEg3j_5g | SUPPORTED | https://www.youtube.com/channel/UC-MlYzrnfAkW3YYqEg3j_5g · https://kprofiles.com/ladies-code-members-profile/ · https://kpop.fandom.com/wiki/LADIES%27_CODE |
| Lapillus | group_official | https://www.youtube.com/channel/UCDi_DeMQ2EM2UbjCM62awcw | VERIFIED | https://www.youtube.com/@lapillus_official · https://www.wikidata.org/wiki/Q112620284 · https://kprofiles.com/lapillus-members-profile/ |
| LATENCY | group_official | https://www.youtube.com/channel/UC_V_FDh1B4-LS_813MjS2tA | VERIFIED | https://www.youtube.com/channel/UC_V_FDh1B4-LS_813MjS2tA · https://kpopdiscover.com/ja/official-links/ · https://kpop.fandom.com/wiki/LATENCY |
| LAYSHA | group_official | https://www.youtube.com/channel/UChF7Gn3fsJFUPArG8jy0V9g | SUPPORTED | https://www.youtube.com/@layshaofficial · https://kprofiles.com/laysha-members-profile/ · https://kpop.fandom.com/wiki/LAYSHA |
| 이채연 | solo_official | https://www.youtube.com/channel/UCVVFt4q2WczlzhOr4V2kYxA | VERIFIED | https://www.youtube.com/@official_LCY · https://kpop.fandom.com/wiki/Lee_Chaeyeon_%28singer%29 |
| 이하이 | solo_official | https://www.youtube.com/channel/UCT86dWwZWeJWGQCDzbipU-A | VERIFIED | https://www.youtube.com/channel/UCT86dWwZWeJWGQCDzbipU-A · https://www.wikidata.org/wiki/Q24945 · https://kpop.fandom.com/wiki/Lee_Hi |
| 이진아 | solo_official | https://www.youtube.com/channel/UCzEFonNtzg2oE74uqJKDApQ | VERIFIED | https://www.youtube.com/channel/UCzEFonNtzg2oE74uqJKDApQ · https://kpop.fandom.com/wiki/Lee_Jin_Ah |
| 이수정 | solo_official | https://www.youtube.com/channel/UCq9TpLVIr4uCZgo83fpnYoQ | VERIFIED | https://www.youtube.com/user/babysoulhome · https://kpop.fandom.com/wiki/Lee_Su_Jeong |
| LE SSERAFIM | group_official | https://www.youtube.com/channel/UCs-QBT4qkj_YiQw1ZntDO3g | VERIFIED | https://www.youtube.com/channel/UCs-QBT4qkj_YiQw1ZntDO3g · https://kpopdiscover.com/ja/official-links/ · https://www.wikidata.org/wiki/Q111381707 |
| LIGHTSUM | group_official | https://www.youtube.com/channel/UCeQlMQ-4cedE7SNmF5JsdsA | VERIFIED | https://www.youtube.com/@LIGHTSUMOfficial · https://kpopdiscover.com/ja/official-links/ · https://www.wikidata.org/wiki/Q107005985 |
| lilli lilli | group_official | https://www.youtube.com/channel/UCJemPsSa4T_Kh5QUlmHiuQQ | VERIFIED | https://www.youtube.com/channel/UCJemPsSa4T_Kh5QUlmHiuQQ · https://kprofiles.com/lilli-lilli-members-profile/ · https://kpop.fandom.com/wiki/Lilli_lilli |
| 리사 | member_personal | https://www.youtube.com/channel/UC35HKvKYPkri4Grd5KXl3wQ | SUPPORTED | https://www.youtube.com/@lalalalisa_m · https://kpop.fandom.com/wiki/Lisa_%28BLACKPINK%29 |
| LOONA | group_official | https://www.youtube.com/channel/UCOJplhB0wGQWv9OuRmMT-4g | VERIFIED | https://www.youtube.com/channel/UCOJplhB0wGQWv9OuRmMT-4g · https://www.wikidata.org/wiki/Q28025953 · https://kprofiles.com/loona-members-profile/ |
| Loossemble | group_official | https://www.youtube.com/channel/UCbTzy8kj_6Kik_LFD1XyN5g | VERIFIED | https://www.youtube.com/channel/UCbTzy8kj_6Kik_LFD1XyN5g · https://kpop.fandom.com/wiki/Loossemble |
| Lovelyz | group_official | https://www.youtube.com/channel/UCtF9Njo6rLI8U2ZrJ_cFzHQ | VERIFIED | https://www.youtube.com/channel/UCtF9Njo6rLI8U2ZrJ_cFzHQ · https://www.wikidata.org/wiki/Q18437003 · https://kpop.fandom.com/wiki/Lovelyz |
| LOVEONE | group_official | https://www.youtube.com/channel/UCY_SyYX765Rgy4eVtQ38bKQ | VERIFIED | https://www.youtube.com/channel/UCY_SyYX765Rgy4eVtQ38bKQ · https://kpop.fandom.com/wiki/LOVEONE |
| 루네디 | solo_official | https://www.youtube.com/channel/UCJpMlDZPUvfIlcXISH7hwmQ | VERIFIED | https://www.youtube.com/@lunedi_niverse · https://www.newswire.co.kr/newsRead.php?no=1024842 |
| m.prism | group_official | https://www.youtube.com/channel/UCDTYSXHfoA_tb3fvp8FWMYw | SUPPORTED | https://www.youtube.com/channel/UCDTYSXHfoA_tb3fvp8FWMYw · https://kprofiles.com/m-prism-members-profile/ · https://kpop.fandom.com/wiki/M.prism |
| MADEIN | group_official | https://www.youtube.com/channel/UCQZy15R31id90AlisaiOg2Q | VERIFIED | https://www.youtube.com/@MADEIN_U · https://kpopdiscover.com/ja/official-links/ · https://www.wikidata.org/wiki/Q114554468 |
| MAJORS | group_official | https://www.youtube.com/channel/UC12H1i5LInya8V8sEpjY2Bw | SUPPORTED | https://www.youtube.com/@majors1369 · https://kpop.fandom.com/wiki/MAJORS |
| 마카마카 | group_official | https://www.youtube.com/channel/UC1DGIB22hXPGj18ag-Z5cyg | SUPPORTED | https://www.youtube.com/channel/UC1DGIB22hXPGj18ag-Z5cyg · https://kprofiles.com/maka-maka-members-profile/ · https://kpop.fandom.com/wiki/MAKAMAKA |
| MAMAMOO | group_official | https://www.youtube.com/channel/UCuhAUMLzJxlP1W7mEk0_6lA | VERIFIED | https://www.youtube.com/channel/UCuhAUMLzJxlP1W7mEk0_6lA · https://kpopdiscover.com/ja/official-links/ · https://www.wikidata.org/wiki/Q17278068 |
| MAVE: | group_official | https://www.youtube.com/channel/UCOkPPNcfz_Epox8LtDfJOkQ | VERIFIED | https://www.youtube.com/channel/UCOkPPNcfz_Epox8LtDfJOkQ · https://www.wikidata.org/wiki/Q116278127 · https://kprofiles.com/mave-members-profile/ |
| MelodyDay | group_official | https://www.youtube.com/channel/UCqcEK81UWHMPyIBr-aKx3fQ | VERIFIED | https://www.youtube.com/user/melodyday225 · https://kpopdiscover.com/ja/official-links/ · https://kprofiles.com/melody-day-members-profile/ |
| MEOVV | group_official | https://www.youtube.com/channel/UCowiwt93gqGlNG4k5VDxO-w | VERIFIED | https://www.youtube.com/channel/UCowiwt93gqGlNG4k5VDxO-w · https://kpopdiscover.com/ja/official-links/ · https://www.wikidata.org/wiki/Q130084175 |
| MEPC | group_official | https://www.youtube.com/channel/UCteuLVBLJEFmxeNKQWeuxqg | VERIFIED | https://www.youtube.com/@mepc_official · https://kpop.fandom.com/wiki/MEPC |
| 이미주 | solo_official | https://www.youtube.com/channel/UCwT5rfMZil2BCpez473dbrA | VERIFIED | https://www.youtube.com/@MIJOO_official · https://kpop.fandom.com/wiki/Lee_Mi_Joo |
| MIMIIROSE | group_official | https://www.youtube.com/channel/UCl6QWaTNqfu6mUSj2Rpcl2w | VERIFIED | https://www.youtube.com/channel/UCl6QWaTNqfu6mUSj2Rpcl2w · https://www.wikidata.org/wiki/Q113670989 · https://kprofiles.com/mimiirose-members-profile/ |
| 미니마니 | group_official | https://www.youtube.com/channel/UCKDEv25BLSa7Ph2aNaBDiMQ | SUPPORTED | https://www.youtube.com/channel/UCKDEv25BLSa7Ph2aNaBDiMQ · https://www.wikidata.org/wiki/Q117435233 · https://kprofiles.com/minimani-members-profile/ |
| 공민지 | member_personal | https://www.youtube.com/channel/UCRvzFS75A4NtZvhRQAd2u0A | SUPPORTED | https://www.youtube.com/channel/UCRvzFS75A4NtZvhRQAd2u0A · https://www.wikidata.org/wiki/Q483842 |
| miss A | group_official | https://www.youtube.com/channel/UCCSqiAQFvOjjVtXkZgtKZ-g | VERIFIED | https://www.youtube.com/@missA · https://kpopdiscover.com/ja/official-links/ · https://www.wikidata.org/wiki/Q284740 |
| 미연 | member_personal | https://www.youtube.com/channel/UCIoKLG1bmpB_NxwJJ4ZjSDg | SUPPORTED | https://www.youtube.com/@m1yeon_zip · https://kpop.fandom.com/wiki/Miyeon_%28i-dle%29 |
| MOMOLAND | group_official | https://www.youtube.com/channel/UCfWtQwSgfy3tm0zUt-PWG-g | VERIFIED | https://www.youtube.com/@MOMOLAND_official · https://kpopdiscover.com/ja/official-links/ · https://kprofiles.com/momoland-members-profile/ |
| 문별 | member_personal | https://www.youtube.com/channel/UCFrAB5I66LgzOi15TF4PO6A | SUPPORTED | https://www.youtube.com/c/moonbyul2da · https://kprofiles.com/moonbyul-profile-facts/ · https://kpop.fandom.com/wiki/Moon_Byul |
| MuuTive | group_official | https://www.youtube.com/channel/UCWKQhHOxL1K6CLwRK6a9f2Q | SUPPORTED | https://www.youtube.com/@muutiveofficial · https://kpop.fandom.com/wiki/MuuTive |
| myB | group_official | https://www.youtube.com/channel/UCNp2_uViObX2iTqfN5csw0A | SUPPORTED | https://www.youtube.com/@myBmaroo · https://kpop.fandom.com/wiki/MyB |
| NATURE | group_official | https://www.youtube.com/channel/UCVwEjskMa1m7ewjy0FGEHWQ | VERIFIED | https://www.youtube.com/channel/UCVwEjskMa1m7ewjy0FGEHWQ · https://kprofiles.com/nature-members-profile/ · https://kpop.fandom.com/wiki/NATURE |
| 나연 | solo_official | https://www.youtube.com/channel/UCueKgiyoxLHQK7Yr-n5gnww | VERIFIED | https://www.youtube.com/@IM_NAYEON_0922 · https://kpop.fandom.com/wiki/Nayeon_%28TWICE%29 |
| NewJeans | group_official | https://www.youtube.com/channel/UCMki_UkHb4qSc0qyEcOHHJw | VERIFIED | https://www.youtube.com/channel/UCMki_UkHb4qSc0qyEcOHHJw · https://www.wikidata.org/wiki/Q113189277 · https://kpopdiscover.com/ja/official-links/ |
| 9MUSES | group_official | https://www.youtube.com/channel/UCJ_sOiMLKpEH39gESJCPmlw | VERIFIED | https://www.youtube.com/channel/UCJ_sOiMLKpEH39gESJCPmlw · https://kpopdiscover.com/ja/official-links/ · https://www.wikidata.org/wiki/Q498385 |
| NMIXX | group_official | https://www.youtube.com/channel/UCnUAyD4t2LkvW68YrDh7fDg | VERIFIED | https://www.youtube.com/@NMIXXOfficial · https://kpopdiscover.com/ja/official-links/ · https://www.wikidata.org/wiki/Q109307762 |
| ODD YOUTH | group_official | https://www.youtube.com/channel/UC01qd2I1K6MHpoiv9m5W2IQ | VERIFIED | https://www.youtube.com/channel/UC01qd2I1K6MHpoiv9m5W2IQ · https://kpopdiscover.com/ja/official-links/ · https://kprofiles.com/odd-youth-members-profile/ |
| OH MY GIRL | group_official | https://www.youtube.com/channel/UC-qYkzKFdekoEniRu_FS3zg | VERIFIED | https://www.youtube.com/@OHMYGIRL · https://kpopdiscover.com/ja/official-links/ · https://www.wikidata.org/wiki/Q19794854 |
| OURBIRTHDAY | group_official | https://www.youtube.com/channel/UCTKAsxI3zuPPGGrcCJOqvzg | VERIFIED | https://www.youtube.com/@OURBIRTHDAY · https://kpopdiscover.com/ja/official-links/ · https://kprofiles.com/ourbirthday-members-profile/ |
| OWIS | group_official | https://www.youtube.com/channel/UC7nzgwXgrT4Po0OEqERZ3vQ | VERIFIED | https://www.youtube.com/@owis_official · https://kprofiles.com/owis-members-profile/ · https://kpop.fandom.com/wiki/OWIS |
| 파스텔걸스 | group_official | https://www.youtube.com/channel/UCpiuypDjkKeGHEHGEQWv0Wg | SUPPORTED | https://www.youtube.com/channel/UCpiuypDjkKeGHEHGEQWv0Wg · https://kprofiles.com/pastel-girls-members-profile/ |
| PIXY | group_official | https://www.youtube.com/channel/UCZU6KD96JWS89jQLuu7FhPQ | VERIFIED | https://www.youtube.com/channel/UCZU6KD96JWS89jQLuu7FhPQ · https://kprofiles.com/pixy-members-profile/ · https://kpop.fandom.com/wiki/PIXY |
| 프레셔스 | group_official | https://www.youtube.com/channel/UCQYuaIeYuOaevmbQc_Im3Bw | VERIFIED | https://www.youtube.com/channel/UCQYuaIeYuOaevmbQc_Im3Bw · https://kprofiles.com/precious-members-profile/ · https://kpop.fandom.com/wiki/PRECIOUS |
| 프림로즈 | group_official | https://www.youtube.com/channel/UCMKXs7_6MhbceHRPbPjuMzg | VERIFIED | https://www.youtube.com/channel/UCMKXs7_6MhbceHRPbPjuMzg · https://kprofiles.com/primrose-members-profile/ · https://kpop.fandom.com/wiki/PRIMROSE |
| PRISTIN | group_official | https://www.youtube.com/channel/UCRvGVXlK9h9vLWpbVOzm_4Q | VERIFIED | https://www.youtube.com/channel/UCRvGVXlK9h9vLWpbVOzm_4Q · https://www.wikidata.org/wiki/Q26265886 · https://kpop.fandom.com/wiki/PRISTIN |
| Pungdeng-E | group_official | https://www.youtube.com/channel/UCw62uy81dCMTj2Vy7DtJYMg | SUPPORTED | https://www.youtube.com/@pungdeng2go · https://kpop.fandom.com/wiki/Pungdeng-E |
| 퍼플키스 | group_official | https://www.youtube.com/channel/UCor8nQnEdMs4eBcU-uVBQ8g | VERIFIED | https://www.youtube.com/channel/UCor8nQnEdMs4eBcU-uVBQ8g · https://www.wikidata.org/wiki/Q97780109 · https://kprofiles.com/purple-kiss-members-profile/ |
| Queenz Eye | group_official | https://www.youtube.com/channel/UCdgVLvuLUIpokhrbpd5GdUQ | VERIFIED | https://www.youtube.com/channel/UCdgVLvuLUIpokhrbpd5GdUQ · https://kpopdiscover.com/ja/official-links/ |
| QWER | group_official | https://www.youtube.com/channel/UCgD0APk2x9uBlLM0UsmhQjw | VERIFIED | https://www.youtube.com/@QWER_Band_official · https://kpopdiscover.com/ja/official-links/ · https://www.wikidata.org/wiki/Q124412677 |
| Rainbow | group_official | https://www.youtube.com/channel/UCgHmY5dcJghV7ZI3U6rh_Wg | VERIFIED | https://www.youtube.com/channel/UCgHmY5dcJghV7ZI3U6rh_Wg · https://kpopdiscover.com/ja/official-links/ · https://www.wikidata.org/wiki/Q489225 |
| Red Velvet | group_official | https://www.youtube.com/channel/UCk9GmdlDTBfgGRb7vXeRMoQ | VERIFIED | https://www.youtube.com/@RedVelvet · https://kpopdiscover.com/ja/official-links/ · https://www.wikidata.org/wiki/Q17466114 |
| RESCENE | group_official | https://www.youtube.com/channel/UCtKtCiaWRz-d3EZn2xd1mdA | VERIFIED | https://www.youtube.com/channel/UCtKtCiaWRz-d3EZn2xd1mdA · https://kpopdiscover.com/ja/official-links/ · https://www.wikidata.org/wiki/Q124856415 |
| Rocket Punch | group_official | https://www.youtube.com/channel/UCDbLcCDRjmKrNtuq6O62lng | VERIFIED | https://www.youtube.com/@RocketPunch · https://kpopdiscover.com/ja/official-links/ · https://www.wikidata.org/wiki/Q65771078 |
| Rocking doll | group_official | https://www.youtube.com/channel/UCFWkb4Z9_1NkPgdYE1ay5og | VERIFIED | https://www.youtube.com/channel/UCFWkb4Z9_1NkPgdYE1ay5og · https://kprofiles.com/rocking-doll-members-profile/ |
| 로제 | solo_official | https://www.youtube.com/channel/UCBo1hnzxV9rz3WVsv__Rn1g | VERIFIED | https://www.youtube.com/@roses_are_rosie · https://kpop.fandom.com/wiki/Ros%C3%A9 |
| 로시 | solo_official | https://www.youtube.com/channel/UCcTq_itv43G05dGVydRTJew | VERIFIED | https://www.youtube.com/@ROTHY_OFFICIAL · https://kpop.fandom.com/wiki/Rothy · https://www.youtube.com/watch?v=tbKBAWANML4 |
| 럼블지 | group_official | https://www.youtube.com/channel/UCVSJVbZSUQs_El_SntTob-A | VERIFIED | https://www.youtube.com/channel/UCVSJVbZSUQs_El_SntTob-A |
| 류수정 | member_personal | https://www.youtube.com/channel/UC7lBEp1OH6utmXAfnraXuhw | SUPPORTED | https://www.youtube.com/channel/UC7lBEp1OH6utmXAfnraXuhw · https://www.wikidata.org/wiki/Q20946085 · https://kpop.fandom.com/wiki/Ryu_Sujeong |
| 에스투잇 | group_official | https://www.youtube.com/channel/UC1MCubd-dr0m-0OfvVBpjow | SUPPORTED | https://www.youtube.com/channel/UC1MCubd-dr0m-0OfvVBpjow · https://kpopdiscover.com/ja/official-links/ · https://kprofiles.com/s2it-members-profile/ |
| SAAY | solo_official | https://www.youtube.com/channel/UCLov8P54xQsySdJxlLIFRUQ | VERIFIED | https://www.youtube.com/@SAAYworld · https://kprofiles.com/saay-profile-facts/ · https://kpop.fandom.com/wiki/SAAY |
| 산다라박 | solo_official | https://www.youtube.com/channel/UCX4uTPyZkp1d0ogkNNp8LtA | VERIFIED | https://www.youtube.com/channel/UCX4uTPyZkp1d0ogkNNp8LtA · https://www.wikidata.org/wiki/Q496170 |
| SATURDAY | group_official | https://www.youtube.com/channel/UCOWHtRSzgSyNA0MMkZdchJQ | SUPPORTED | https://www.youtube.com/channel/UCOWHtRSzgSyNA0MMkZdchJQ · https://kprofiles.com/saturday-members-profile/ · https://kpop.fandom.com/wiki/SATURDAY |
| SAVVVY | group_official | https://www.youtube.com/channel/UCNQwIgEG8lhCIL77ffA0JSg | VERIFIED | https://www.youtube.com/@savvvy_midway · https://kpop.fandom.com/wiki/SAVVVY |
| SAY MY NAME | group_official | https://www.youtube.com/channel/UC-we351yXoKcODFHiKrC84Q | VERIFIED | https://www.youtube.com/channel/UC-we351yXoKcODFHiKrC84Q · https://kpopdiscover.com/ja/official-links/ · https://kprofiles.com/say-my-name-members-profile/ |
| SECRET NUMBER | group_official | https://www.youtube.com/channel/UCIhPBu7gVRi1tnre0ZfXadg | VERIFIED | https://www.youtube.com/channel/UCIhPBu7gVRi1tnre0ZfXadg · https://www.wikidata.org/wiki/Q96274223 · https://kprofiles.com/secret-number-members-profile/ |
| SECRET | group_official | https://www.youtube.com/channel/UCN4VR0wOL9eFv6DrenH36mQ | VERIFIED | https://www.youtube.com/@offcl.secret · https://kprofiles.com/secret-members-profile/ |
| SeeYa | group_official | https://www.youtube.com/channel/UCn6SB-9q1gNfGhx9_fFxIxg | VERIFIED | https://www.youtube.com/@SEEYA_Ent_Official · https://kpopdiscover.com/ja/official-links/ |
| 서현 | member_personal | https://www.youtube.com/channel/UCcbVxBwXT6MATv14d9dfjVA | SUPPORTED | https://www.youtube.com/@SEOHYUN_OFFICIAL · https://kpop.fandom.com/wiki/Seohyun_%28Girls%27_Generation%29 |
| 설아 | member_personal | https://www.youtube.com/channel/UC6hIfm4cG58W0DLvvrrd9sQ | SUPPORTED | https://www.youtube.com/@S1EOL2A · https://kpop.fandom.com/wiki/SeolA |
| Seori | solo_official | https://www.youtube.com/channel/UCrlbUrI63PGA4nnVq0D7bwg | VERIFIED | https://www.youtube.com/channel/UCrlbUrI63PGA4nnVq0D7bwg |
| 슬기 | member_personal | https://www.youtube.com/channel/UCQIUpdrt5UOD2ykffc1wjBA | SUPPORTED | https://www.youtube.com/channel/UCQIUpdrt5UOD2ykffc1wjBA · https://www.wikidata.org/wiki/Q15934116 · https://kpop.fandom.com/wiki/Seulgi_%28Red_Velvet%29 |
| ShaFLA | group_official | https://www.youtube.com/channel/UCJOaa3zUvqfVYQfHD6tj8Ag | SUPPORTED | https://www.youtube.com/channel/UCJOaa3zUvqfVYQfHD6tj8Ag · https://www.wikidata.org/wiki/Q60588154 · https://kprofiles.com/shafla-members-profile/ |
| S.I.S | group_official | https://www.youtube.com/channel/UCD472MQkXYn_fE8r8O3Xt_w | VERIFIED | https://www.youtube.com/channel/UCD472MQkXYn_fE8r8O3Xt_w · https://www.wikidata.org/wiki/Q39433817 · https://kpop.fandom.com/wiki/S.I.S |
| SISTAR | group_official | https://www.youtube.com/channel/UCawhaBBC5fpEGm1kiLFUFDg | VERIFIED | https://www.youtube.com/channel/UCawhaBBC5fpEGm1kiLFUFDg · https://www.wikidata.org/wiki/Q223048 |
| 스카이리 | group_official | https://www.youtube.com/channel/UCForR8SMSeqReZYVdSTAewA | VERIFIED | https://www.youtube.com/channel/UCForR8SMSeqReZYVdSTAewA · https://www.wikidata.org/wiki/Q108865419 · https://kpop.fandom.com/wiki/SKYLE |
| 솔라 | member_personal | https://www.youtube.com/channel/UCNx0TXIuGVEA_TWB5H2I6Lg | SUPPORTED | https://www.youtube.com/channel/UCNx0TXIuGVEA_TWB5H2I6Lg · https://kpop.fandom.com/wiki/Solar_%28MAMAMOO%29 · https://en.wikipedia.org/wiki/Solar_(singer) |
| SOLE | solo_official | https://www.youtube.com/channel/UCap4yv9yICro1qD8WOkrYRw | VERIFIED | https://www.youtube.com/channel/UCap4yv9yICro1qD8WOkrYRw · https://kpop.fandom.com/wiki/SOLE |
| 쏠리아 | group_official | https://www.youtube.com/channel/UCDZ_7zcHWu5O1p7vs2pr1kw | SUPPORTED | https://www.youtube.com/channel/UCDZ_7zcHWu5O1p7vs2pr1kw · https://www.wikidata.org/wiki/Q115771990 · https://kpop.fandom.com/wiki/SOLIA |
| 송지은 | member_personal | https://www.youtube.com/channel/UCf9V1z6h8OTwzRHivXo85pQ | SUPPORTED | https://www.youtube.com/@ForSongJiEun · https://kpop.fandom.com/wiki/Song_Ji_Eun |
| 수진 | solo_official | https://www.youtube.com/channel/UCKdG852wkTilD2Qyd74kgqg | VERIFIED | https://www.youtube.com/@SOOJIN.OFFICIAL · https://kpop.fandom.com/wiki/Soojin_%28singer%29 |
| SORN | solo_official | https://www.youtube.com/channel/UCOzB7NB3Tr98XVwC8bLm5oA | VERIFIED | https://www.youtube.com/@PRODUSORN · https://kpop.fandom.com/wiki/Sorn |
| 소유 | member_personal | https://www.youtube.com/channel/UCs29NQY8SdvtjhxYxvy3Grg | SUPPORTED | https://www.youtube.com/@soyougi · https://kpop.fandom.com/wiki/Soyou |
| SPICA | group_official | https://www.youtube.com/channel/UCLEKTof839_2aYsDppBedxQ | SUPPORTED | https://www.youtube.com/user/spicaofficial · https://kprofiles.com/spica-members-profile/ · https://kpop.fandom.com/wiki/SPICA |
| 스타데이즈 | group_official | https://www.youtube.com/channel/UCRjGZI2kIkxwt9TRyuuEZLw | SUPPORTED | https://www.youtube.com/channel/UCRjGZI2kIkxwt9TRyuuEZLw · https://kpop.fandom.com/wiki/STARDAYS |
| STAYC | group_official | https://www.youtube.com/channel/UCod5V2dpnpJLklGvVOv5FcQ | VERIFIED | https://www.youtube.com/channel/UCod5V2dpnpJLklGvVOv5FcQ · https://kpopdiscover.com/ja/official-links/ · https://www.wikidata.org/wiki/Q101541493 |
| STELLAR | group_official | https://www.youtube.com/channel/UCDQZdWedxhJmJRkbEUeVauQ | VERIFIED | https://www.youtube.com/@officialstellar · https://kpopdiscover.com/ja/official-links/ |
| 선미 | solo_official | https://www.youtube.com/channel/UCsVpgRB8YHLWA0ZrkhtHvTA | VERIFIED | https://www.youtube.com/channel/UCsVpgRB8YHLWA0ZrkhtHvTA · https://www.wikidata.org/wiki/Q624995 · https://search.naver.com/search.naver?query=%EC%84%A0%EB%AF%B8%20%EC%9D%B8%EB%AC%BC%EC%A0%95%EB%B3%B4 |
| Sunny Days | group_official | https://www.youtube.com/channel/UC81qepIUYYf2zOyUjwMq_Ig | SUPPORTED | https://www.youtube.com/user/SunnyDayS2ify · https://kprofiles.com/sunny-days-members-profile/ |
| Sunny Hill | group_official | https://www.youtube.com/channel/UC6O78EEZNi8a42vW_vGd4LQ | VERIFIED | https://www.youtube.com/user/loenSunnyHill · https://kpopdiscover.com/ja/official-links/ · https://kprofiles.com/sunny-hill-members-profile/ |
| 선예 | member_personal | https://www.youtube.com/channel/UCa9FjC0Z0tMTLO1UAkPK5Wg | SUPPORTED | https://www.youtube.com/channel/UCa9FjC0Z0tMTLO1UAkPK5Wg · https://www.wikidata.org/wiki/Q483642 |
| 수지 | member_personal | https://www.youtube.com/channel/UC7ukOKu7-6G-m5d4hOXrhfQ | SUPPORTED | https://www.youtube.com/@Suzy · https://kpop.fandom.com/wiki/Suzy_%28singer%29 |
| 태연 | solo_official | https://www.youtube.com/channel/UCFPI8MI3zmzTlV4W-oSy-Ig | VERIFIED | https://www.youtube.com/channel/UCFPI8MI3zmzTlV4W-oSy-Ig · https://www.wikidata.org/wiki/Q233371 · https://kprofiles.com/taeyeon-profile-facts/ |
| THE ARK | group_official | https://www.youtube.com/channel/UCY31KX5E4DuT3XMYlBmGSBw | SUPPORTED | https://www.youtube.com/@OfficialTheArk · https://kpopdiscover.com/ja/official-links/ |
| 티파니 영 | solo_official | https://www.youtube.com/channel/UCSskZ5Xy7KIqauRYG_s-rLQ | VERIFIED | https://www.youtube.com/channel/UCSskZ5Xy7KIqauRYG_s-rLQ · https://www.wikidata.org/wiki/Q236355 · https://kpop.fandom.com/wiki/Tiffany |
| 트레이서 | group_official | https://www.youtube.com/channel/UCpZnxkISd-bM8j5pPlhOHjA | SUPPORTED | https://www.youtube.com/channel/UCpZnxkISd-bM8j5pPlhOHjA · https://kprofiles.com/tracer-members-profile/ |
| 트라이비 | group_official | https://www.youtube.com/channel/UCX_ISHyGPDm4esdEiubZZxQ | VERIFIED | https://www.youtube.com/channel/UCX_ISHyGPDm4esdEiubZZxQ · https://kpopdiscover.com/ja/official-links/ · https://www.wikidata.org/wiki/Q105592472 |
| 트리플아이즈 | group_official | https://www.youtube.com/channel/UCleXYDySzFYi9fu1F7XD8kQ | SUPPORTED | https://www.youtube.com/@Tripleiz · https://kpop.fandom.com/wiki/Triple_iz |
| tripleS | group_official | https://www.youtube.com/channel/UCJnL-TBcsYrF2SLs7tmiC8Q | VERIFIED | https://www.youtube.com/channel/UCJnL-TBcsYrF2SLs7tmiC8Q · https://kpopdiscover.com/ja/official-links/ · https://www.wikidata.org/wiki/Q115099831 |
| TUIDE | group_official | https://www.youtube.com/channel/UCgQ7HPx1qcmH9_lPTlWOnQw | VERIFIED | https://www.youtube.com/channel/UCgQ7HPx1qcmH9_lPTlWOnQw · https://kpopdiscover.com/ja/official-links/ · https://www.wikidata.org/wiki/Q141030335 |
| TWICE | group_official | https://www.youtube.com/channel/UCCRb6nYKaT8tzLA8CwDdUtw | VERIFIED | https://www.youtube.com/channel/UCCRb6nYKaT8tzLA8CwDdUtw · https://kpopdiscover.com/ja/official-links/ · https://www.wikidata.org/wiki/Q20645861 |
| TWICE | group_official | https://www.youtube.com/channel/UCzgxx_DM2Dcb9Y1spb9mUJA | VERIFIED | https://www.youtube.com/channel/UCzgxx_DM2Dcb9Y1spb9mUJA · https://kpopdiscover.com/ja/official-links/ · https://www.wikidata.org/wiki/Q20645861 |
| Two X | group_official | https://www.youtube.com/channel/UC0Iwqcdl4_x-l9cgLe6c3jw | SUPPORTED | https://www.youtube.com/channel/UC0Iwqcdl4_x-l9cgLe6c3jw · https://www.wikidata.org/wiki/Q7859350 |
| UDTT | group_official | https://www.youtube.com/channel/UC3zApxykkRSBYVjzF30416Q | SUPPORTED | https://www.youtube.com/channel/UC3zApxykkRSBYVjzF30416Q · https://kprofiles.com/udtt-members-profile/ · https://kpop.fandom.com/wiki/UDTT |
| UNCHILD | group_official | https://www.youtube.com/channel/UCpDgvA1XqZbA7WBiv3DMCXA | VERIFIED | https://www.youtube.com/channel/UCpDgvA1XqZbA7WBiv3DMCXA · https://kpopdiscover.com/ja/official-links/ · https://kprofiles.com/unchild-members-profile/ |
| 유니코드 | group_official | https://www.youtube.com/channel/UC7d85MyueB7wxdqw4x04atw | SUPPORTED | https://www.youtube.com/channel/UC7d85MyueB7wxdqw4x04atw · https://kpop.fandom.com/wiki/UNICODE |
| UNIS | group_official | https://www.youtube.com/channel/UCspnElmzSLPhrZJDG9v7JWw | VERIFIED | https://www.youtube.com/@UNIS_Offcl · https://kpopdiscover.com/ja/official-links/ · https://www.wikidata.org/wiki/Q124362218 |
| USPEER | group_official | https://www.youtube.com/channel/UCStX7ZS-N4xLuLiX5b_Y4lw | VERIFIED | https://www.youtube.com/channel/UCStX7ZS-N4xLuLiX5b_Y4lw · https://kprofiles.com/uspeer-members-profile/ · https://kpop.fandom.com/wiki/USPEER |
| ViV | group_official | https://www.youtube.com/channel/UCRVVdiX1ZLYuvRdY_WrS5yw | SUPPORTED | https://www.youtube.com/@viv5_official · https://kprofiles.com/viv-members-profile/ · https://kpop.fandom.com/wiki/ViV |
| VIVIZ | group_official | https://www.youtube.com/channel/UCWFMjDuWKlct0jy89k2kkRA | VERIFIED | https://www.youtube.com/channel/UCWFMjDuWKlct0jy89k2kkRA · https://kpopdiscover.com/ja/official-links/ · https://www.wikidata.org/wiki/Q108853211 |
| VVUP | group_official | https://www.youtube.com/channel/UCOCmok56Fc0yODLljdcOS9Q | VERIFIED | https://www.youtube.com/@vvup_official · https://www.wikidata.org/wiki/Q125131224 · https://kprofiles.com/vvup-members-profile/ |
| Weeekly | group_official | https://www.youtube.com/channel/UC5rp2rDRSpyKNj-QLytC-tw | VERIFIED | https://www.youtube.com/channel/UC5rp2rDRSpyKNj-QLytC-tw · https://kpopdiscover.com/ja/official-links/ · https://www.wikidata.org/wiki/Q65046002 |
| Weki Meki | group_official | https://www.youtube.com/channel/UCCGZK5dPJk6p6x2n6obqULg | VERIFIED | https://www.youtube.com/channel/UCCGZK5dPJk6p6x2n6obqULg · https://kpopdiscover.com/ja/official-links/ · https://www.wikidata.org/wiki/Q32860762 |
| We;Na | group_official | https://www.youtube.com/channel/UCpiXCVf9CaYppJQDDyiD6nA | SUPPORTED | https://www.youtube.com/channel/UCpiXCVf9CaYppJQDDyiD6nA · https://kprofiles.com/wena-members-profile/ · https://kpop.fandom.com/wiki/We%3BNa |
| 웬디 | solo_official | https://www.youtube.com/channel/UCKunGiPbDRvEq8GhnQTkh5g | VERIFIED | https://www.youtube.com/channel/UCKunGiPbDRvEq8GhnQTkh5g · https://www.wikidata.org/wiki/Q17478642 |
| 휘인 | member_personal | https://www.youtube.com/channel/UCSV4MmWtCuMN5qIBtxw5zGA | SUPPORTED | https://www.youtube.com/channel/UCSV4MmWtCuMN5qIBtxw5zGA · https://kpop.fandom.com/wiki/Whee_In · https://weverse.io/wheein/notice/25127?hl=ko |
| 휘인 | member_personal | https://www.youtube.com/channel/UCvA3GLZ5oAsG9Fa8C5qUB1A | SUPPORTED | https://www.youtube.com/channel/UCvA3GLZ5oAsG9Fa8C5qUB1A · https://kpop.fandom.com/wiki/Whee_In · https://weverse.io/wheein/notice/25127?hl=ko |
| W!TCHX | group_official | https://www.youtube.com/channel/UC6WeLJlnIhPI2Sy4rSOmM8A | SUPPORTED | https://www.youtube.com/channel/UC6WeLJlnIhPI2Sy4rSOmM8A · https://kpop.fandom.com/wiki/WiTCHX · https://kprofiles.com/wtchx-members-profile/ |
| WJSN | group_official | https://www.youtube.com/channel/UCVaIiqzfKQsi7Qw4-X8TmmA | VERIFIED | https://www.youtube.com/channel/UCVaIiqzfKQsi7Qw4-X8TmmA · https://kpopdiscover.com/ja/official-links/ · https://www.wikidata.org/wiki/Q21964258 |
| Wonder Girls | group_official | https://www.youtube.com/channel/UCTE8ueKNA54RcO6MgXif2Tg | VERIFIED | https://www.youtube.com/channel/UCTE8ueKNA54RcO6MgXif2Tg · https://kpopdiscover.com/ja/official-links/ · https://www.wikidata.org/wiki/Q476119 |
| WOOAH | group_official | https://www.youtube.com/channel/UCNeLbWtlJzTsavMC70zY0dQ | VERIFIED | https://www.youtube.com/channel/UCNeLbWtlJzTsavMC70zY0dQ · https://kpopdiscover.com/ja/official-links/ · https://www.wikidata.org/wiki/Q94615987 |
| X:IN | group_official | https://www.youtube.com/channel/UCTmx5ntaaBTrzThDw_exaMg | VERIFIED | https://www.youtube.com/channel/UCTmx5ntaaBTrzThDw_exaMg · https://www.wikidata.org/wiki/Q117354566 · https://kprofiles.com/x-in-members-profile/ |
| 최예나 | solo_official | https://www.youtube.com/channel/UCkrDEGNM3mqZXHk2MfnOjMw | VERIFIED | https://www.youtube.com/channel/UCkrDEGNM3mqZXHk2MfnOjMw · https://www.wikidata.org/wiki/Q55694544 |
| 예린 | solo_official | https://www.youtube.com/channel/UC8ApPB1oJZSBvGi-bqSPAmg | VERIFIED | https://www.youtube.com/channel/UC8ApPB1oJZSBvGi-bqSPAmg · https://www.wikidata.org/wiki/Q19657363 |
| 윤아 | member_personal | https://www.youtube.com/channel/UC8B_76tkLwQmiaJwDKFytXw | SUPPORTED | https://www.youtube.com/channel/UC8B_76tkLwQmiaJwDKFytXw · https://www.wikidata.org/wiki/Q466975 |
| YOUHA | solo_official | https://www.youtube.com/channel/UC7V_MLwiCk3ShugDV9oyskA | VERIFIED | https://www.youtube.com/channel/UC7V_MLwiCk3ShugDV9oyskA · https://kprofiles.com/youha-profile-facts/ |
| YOUNG POSSE | group_official | https://www.youtube.com/channel/UCYvGSZPvQj09LgpcziCszyA | VERIFIED | https://www.youtube.com/@YOUNGPOSSEUP · https://kpopdiscover.com/ja/official-links/ · https://kprofiles.com/young-posse-members-profile/ |
| 윤하 | solo_official | https://www.youtube.com/channel/UCmAT2nOQB0ofAhlc7_2P8GA | VERIFIED | https://www.youtube.com/channel/UCmAT2nOQB0ofAhlc7_2P8GA · https://www.wikidata.org/wiki/Q235613 |
| 유라 | solo_official | https://www.youtube.com/channel/UCrgmcWsu4pBRmEQz1l5cklQ | VERIFIED | https://www.youtube.com/channel/UCrgmcWsu4pBRmEQz1l5cklQ · https://www.wikidata.org/wiki/Q104534228 · https://kprofiles.com/youra-profile-facts/ |
| 유빈 | solo_official | https://www.youtube.com/channel/UC3zD47ZL9GpPPAkW_G6vvlw | VERIFIED | https://www.youtube.com/channel/UC3zD47ZL9GpPPAkW_G6vvlw · https://www.wikidata.org/wiki/Q496580 · https://kprofiles.com/yubin-profile-facts/ |
| 유주 | solo_official | https://www.youtube.com/channel/UCvKIvp7qTFBocvnqfP0R8rQ | VERIFIED | https://www.youtube.com/@yuju_atarea · https://kpop.fandom.com/wiki/Yuju_%28GFRIEND%29 |
| 유리 | member_personal | https://www.youtube.com/channel/UCeUXR_8AOMCji1OEaVne9aQ | SUPPORTED | https://www.youtube.com/channel/UCeUXR_8AOMCji1OEaVne9aQ · https://kprofiles.com/yuri-profile-facts/ · https://kpop.fandom.com/wiki/Yuri_%28Girls%27_Generation%29 |
| 이브 | solo_official | https://www.youtube.com/channel/UCMuK2QPg9oFJ1-veMCw3Irg | VERIFIED | https://www.youtube.com/channel/UCMuK2QPg9oFJ1-veMCw3Irg · https://www.youtube.com/watch?v=dt398bVjWOw |

## 미해결 전체 목록

세부 시도·후보·실패 주소·동명이인 제외 근거는 `config/channel-survey.json`과 배포 데이터 `artist-channel-survey.json`에 있습니다.

| ID | 아티스트 | 유형 | 사유 |
|---|---|---|---|
| 1chu | 1CHU | duo | 후보/기존 채널 신원·소유 근거 추가 확인 필요; 일부 주소 응답/ID 확인 실패 |
| 2eyes | 2EYES | group | 전용 채널 후보 미확정; 그룹·공용 채널 관계는 별도 유지 |
| 2nyne | 2NYNE | group | 후보/기존 채널 신원·소유 근거 추가 확인 필요 |
| 4l | 4L | group | 후보/기존 채널 신원·소유 근거 추가 확인 필요 |
| 4x4 | 4X4 | group | 후보/기존 채널 신원·소유 근거 추가 확인 필요; 일부 주소 응답/ID 확인 실패; 동명이인·Topic·공용 후보 제외 |
| a-future | 에이퓨처 | group | 전용 채널 후보 미확정; 그룹·공용 채널 관계는 별도 유지 |
| a-lid | 에이리드 | group | 전용 채널 후보 미확정; 그룹·공용 채널 관계는 별도 유지 |
| ahn-ye-eun | 안예은 | solo | 전용 채널 후보 미확정; 그룹·공용 채널 관계는 별도 유지 |
| alice-syndrome | 앨리스신드롬 | group | 후보/기존 채널 신원·소유 근거 추가 확인 필요; 일부 주소 응답/ID 확인 실패 |
| appleb | Apple.B | group | 전용 채널 후보 미확정; 그룹·공용 채널 관계는 별도 유지 |
| areal | 에이리얼 | group | 전용 채널 후보 미확정; 그룹·공용 채널 관계는 별도 유지; 일부 주소 응답/ID 확인 실패 |
| artbeat-v | ARTBEAT v | group | 후보/기존 채널 신원·소유 근거 추가 확인 필요 |
| astell | 아스텔 | group | 후보/기존 채널 신원·소유 근거 추가 확인 필요 |
| azer | Azer | group | 후보/기존 채널 신원·소유 근거 추가 확인 필요 |
| b-ours | B-OURS | group | 후보/기존 채널 신원·소유 근거 추가 확인 필요; 일부 주소 응답/ID 확인 실패 |
| baby-vox-rev | Baby V.O.X Re.V | group | 전용 채널 후보 미확정; 그룹·공용 채널 관계는 별도 유지 |
| babys | 베이비스 | group | 후보/기존 채널 신원·소유 근거 추가 확인 필요 |
| black-pearl | Black Pearl | group | 전용 채널 후보 미확정; 그룹·공용 채널 관계는 별도 유지 |
| bling-bling | 블링블링 | group | 전용 채널 후보 미확정; 그룹·공용 채널 관계는 별도 유지 |
| bol4 | 볼빨간사춘기 | solo | 전용 채널 후보 미확정; 그룹·공용 채널 관계는 별도 유지 |
| botopass | BOTOPASS | group | 후보/기존 채널 신원·소유 근거 추가 확인 필요 |
| bulldok | BULLDOK | group | 후보/기존 채널 신원·소유 근거 추가 확인 필요; 동명이인·Topic·공용 후보 제외 |
| bunny-t | Bunny.T | group | 후보/기존 채널 신원·소유 근거 추가 확인 필요; 일부 주소 응답/ID 확인 실패 |
| busters | BUSTERS | group | 후보/기존 채널 신원·소유 근거 추가 확인 필요 |
| byulzzi | 별찌 | group | 후보/기존 채널 신원·소유 근거 추가 확인 필요 |
| c-real | C-REAL | group | 후보/기존 채널 신원·소유 근거 추가 확인 필요 |
| chaeyoung | 채영 | solo | 후보/기존 채널 신원·소유 근거 추가 확인 필요; 동명이인·Topic·공용 후보 제외 |
| chakra | Chakra | group | 전용 채널 후보 미확정; 그룹·공용 채널 관계는 별도 유지 |
| chic-and-idle | 시크한아이들 | group | 후보/기존 채널 신원·소유 근거 추가 확인 필요 |
| choi-yu-ree | 최유리 | solo | 전용 채널 후보 미확정; 그룹·공용 채널 관계는 별도 유지 |
| clearly | 클리어리 | group | 전용 채널 후보 미확정; 그룹·공용 채널 관계는 별도 유지 |
| cookie | CooKie | group | 후보/기존 채널 신원·소유 근거 추가 확인 필요; 동명이인·Topic·공용 후보 제외 |
| d-unit | D-UNIT | group | 후보/기존 채널 신원·소유 근거 추가 확인 필요 |
| daydream | 데이드림 | group | 후보/기존 채널 신원·소유 근거 추가 확인 필요 |
| dayoung | 다영 | solo | 후보/기존 채널 신원·소유 근거 추가 확인 필요; 일부 주소 응답/ID 확인 실패 |
| diva-x | DIVA-X | group | 후보/기존 채널 신원·소유 근거 추가 확인 필요 |
| elliivyn | E11iVYN | group | 전용 채널 후보 미확정; 그룹·공용 채널 관계는 별도 유지 |
| episode | EPISODE | group | 후보/기존 채널 신원·소유 근거 추가 확인 필요; 일부 주소 응답/ID 확인 실패 |
| evol | EvoL | group | 후보/기존 채널 신원·소유 근거 추가 확인 필요 |
| fainit | 페이니티 | group | 후보/기존 채널 신원·소유 근거 추가 확인 필요; 일부 주소 응답/ID 확인 실패 |
| fanatics | FANATICS | group | 후보/기존 채널 신원·소유 근거 추가 확인 필요; 일부 주소 응답/ID 확인 실패 |
| fiestar | FIESTAR | group | 후보/기존 채널 신원·소유 근거 추가 확인 필요; 일부 주소 응답/ID 확인 실패 |
| fria | 프리아 | group | 후보/기존 채널 신원·소유 근거 추가 확인 필요 |
| fve-dolls | F-ve Dolls | group | 후보/기존 채널 신원·소유 근거 추가 확인 필요 |
| fx | f(x) | group | 후보/기존 채널 신원·소유 근거 추가 확인 필요; 동명이인·Topic·공용 후보 제외 |
| gangkiz | Gangkiz | group | 전용 채널 후보 미확정; 그룹·공용 채널 관계는 별도 유지 |
| gi | GI | group | 후보/기존 채널 신원·소유 근거 추가 확인 필요 |
| glam | GLAM | group | 후보/기존 채널 신원·소유 근거 추가 확인 필요 |
| golden-girls | 골든걸스 | group | 전용 채널 후보 미확정; 그룹·공용 채널 관계는 별도 유지 |
| good-day | GOOD DAY | group | 후보/기존 채널 신원·소유 근거 추가 확인 필요 |
| got-the-beat | GOT the beat | group | 후보/기존 채널 신원·소유 근거 추가 확인 필요; 동명이인·Topic·공용 후보 제외 |
| gp-basic | GP Basic | group | 후보/기존 채널 신원·소유 근거 추가 확인 필요; 동명이인·Topic·공용 후보 제외 |
| ham | HAM | group | 후보/기존 채널 신원·소유 근거 추가 확인 필요 |
| hashtag | Hashtag | group | 후보/기존 채널 신원·소유 근거 추가 확인 필요; 일부 주소 응답/ID 확인 실패 |
| heejin | 희진 | solo | 후보/기존 채널 신원·소유 근거 추가 확인 필요 |
| hi-l | Hi-L | group | 후보/기존 채널 신원·소유 근거 추가 확인 필요; 일부 주소 응답/ID 확인 실패 |
| hub | H.U.B | group | 후보/기존 채널 신원·소유 근거 추가 확인 필요 |
| ibi | I.B.I | group | 전용 채널 후보 미확정; 그룹·공용 채널 관계는 별도 유지 |
| ioi | I.O.I | group | 후보/기존 채널 신원·소유 근거 추가 확인 필요 |
| irion | IRION | group | 후보/기존 채널 신원·소유 근거 추가 확인 필요 |
| isak-n-jiyeon | Isak N Jiyeon | group | 전용 채널 후보 미확정; 그룹·공용 채널 관계는 별도 유지; 일부 주소 응답/ID 확인 실패 |
| jeniwery | 제니웨리 | group | 전용 채널 후보 미확정; 그룹·공용 채널 관계는 별도 유지 |
| jeong-ye-in | 정예인 | solo | 후보/기존 채널 신원·소유 근거 추가 확인 필요 |
| jessica | 제시카 | solo | 후보/기존 채널 신원·소유 근거 추가 확인 필요 |
| jia | 지아 | solo | 후보/기존 채널 신원·소유 근거 추가 확인 필요; 동명이인·Topic·공용 후보 제외 |
| jihyo | 지효 | solo | 후보/기존 채널 신원·소유 근거 추가 확인 필요; 동명이인·Topic·공용 후보 제외 |
| joy | 조이 | solo | 후보/기존 채널 신원·소유 근거 추가 확인 필요; 동명이인·Topic·공용 후보 제외 |
| jqt | JQT | group | 전용 채널 후보 미확정; 그룹·공용 채널 관계는 별도 유지 |
| juju-secret | 주주 시크릿 | duo | 후보/기존 채널 신원·소유 근거 추가 확인 필요 |
| jy | 강지영 | solo | 후보/기존 채널 신원·소유 근거 추가 확인 필요; 동명이인·Topic·공용 후보 제외 |
| kim-nam-joo | 김남주 | solo | 전용 채널 후보 미확정; 그룹·공용 채널 관계는 별도 유지 |
| kiss-and-cry | Kiss&Cry | group | 전용 채널 후보 미확정; 그룹·공용 채널 관계는 별도 유지 |
| kiss | KISS | group | 전용 채널 후보 미확정; 그룹·공용 채널 관계는 별도 유지; 동명이인·Topic·공용 후보 제외 |
| label-up | 라벨업 | group | 후보/기존 채널 신원·소유 근거 추가 확인 필요 |
| lee-bada | 이바다 | solo | 전용 채널 후보 미확정; 그룹·공용 채널 관계는 별도 유지 |
| limelight | LIMELIGHT | group | 후보/기존 채널 신원·소유 근거 추가 확인 필요 |
| lip-service | Lip Service | group | 후보/기존 채널 신원·소유 근거 추가 확인 필요; 동명이인·Topic·공용 후보 제외 |
| lipbubble | LipBubble | group | 후보/기존 채널 신원·소유 근거 추가 확인 필요; 일부 주소 응답/ID 확인 실패 |
| lpg | LPG | group | 전용 채널 후보 미확정; 그룹·공용 채널 관계는 별도 유지 |
| luli-lee | 이루리 | solo | 전용 채널 후보 미확정; 그룹·공용 채널 관계는 별도 유지 |
| lunarsolar | 루나솔라 | group | 후보/기존 채널 신원·소유 근거 추가 확인 필요 |
| luv | LUV | group | 전용 채널 후보 미확정; 그룹·공용 채널 관계는 별도 유지 |
| matilda | MATILDA | group | 후보/기존 채널 신원·소유 근거 추가 확인 필요; 일부 주소 응답/ID 확인 실패 |
| mayliz | MayLiz | group | 전용 채널 후보 미확정; 그룹·공용 채널 관계는 별도 유지; 일부 주소 응답/ID 확인 실패 |
| milk | M.I.L.K. | group | 전용 채널 후보 미확정; 그룹·공용 채널 관계는 별도 유지 |
| min | 민 | solo | 후보/기존 채널 신원·소유 근거 추가 확인 필요; 동명이인·Topic·공용 후보 제외 |
| minnie | 민니 | solo | 후보/기존 채널 신원·소유 근거 추가 확인 필요; 동명이인·Topic·공용 후보 제외 |
| miss-s | Miss S | group | 전용 채널 후보 미확정; 그룹·공용 채널 관계는 별도 유지 |
| misty | 미스티 | group | 전용 채널 후보 미확정; 그룹·공용 채널 관계는 별도 유지 |
| msftz | msftz | solo | 후보/기존 채널 신원·소유 근거 추가 확인 필요 |
| natty | 나띠 | solo | 후보/기존 채널 신원·소유 근거 추가 확인 필요 |
| navillera | NAVILLERA | group | 전용 채널 후보 미확정; 그룹·공용 채널 관계는 별도 유지 |
| neonpunch | NeonPunch | group | 후보/기존 채널 신원·소유 근거 추가 확인 필요 |
| new-l | New-L | group | 후보/기존 채널 신원·소유 근거 추가 확인 필요 |
| nicole | 니콜 | solo | 후보/기존 채널 신원·소유 근거 추가 확인 필요 |
| nwh-i | NWH:I | group | 전용 채널 후보 미확정; 그룹·공용 채널 관계는 별도 유지; 일부 주소 응답/ID 확인 실패 |
| oh-ha-young | 오하영 | solo | 전용 채널 후보 미확정; 그룹·공용 채널 관계는 별도 유지 |
| papaya | Papaya | group | 전용 채널 후보 미확정; 그룹·공용 채널 관계는 별도 유지 |
| park-bom | 박봄 | solo | 후보/기존 채널 신원·소유 근거 추가 확인 필요 |
| piggy-dolls | Piggy Dolls | group | 전용 채널 후보 미확정; 그룹·공용 채널 관계는 별도 유지 |
| playback | PLAYBACK | group | 후보/기존 채널 신원·소유 근거 추가 확인 필요; 동명이인·Topic·공용 후보 제외 |
| pop | P.O.P | group | 후보/기존 채널 신원·소유 근거 추가 확인 필요 |
| poshgirls | GG(파시걸스) | group | 전용 채널 후보 미확정; 그룹·공용 채널 관계는 별도 유지 |
| prisma | 프리즈마 | group | 후보/기존 채널 신원·소유 근거 추가 확인 필요 |
| pritti-g | 프리티지 | group | 후보/기존 채널 신원·소유 근거 추가 확인 필요 |
| punch | 펀치 | solo | 전용 채널 후보 미확정; 그룹·공용 채널 관계는 별도 유지 |
| puretty | PURETTY | group | 후보/기존 채널 신원·소유 근거 추가 확인 필요; 동명이인·Topic·공용 후보 제외 |
| purplebeck | Purplebeck | group | 후보/기존 채널 신원·소유 근거 추가 확인 필요 |
| puzzle | PUZZLE | group | 전용 채널 후보 미확정; 그룹·공용 채널 관계는 별도 유지 |
| q6ix | 큐빅스 | group | 후보/기존 채널 신원·소유 근거 추가 확인 필요 |
| queen-bz | Queen B'Z | group | 후보/기존 채널 신원·소유 근거 추가 확인 필요 |
| rania | RANIA | group | 후보/기존 채널 신원·소유 근거 추가 확인 필요; 일부 주소 응답/ID 확인 실패 |
| redsquare | REDSQUARE | group | 전용 채널 후보 미확정; 그룹·공용 채널 관계는 별도 유지; 일부 주소 응답/ID 확인 실패 |
| refund-sisters | 환불원정대 | group | 전용 채널 후보 미확정; 그룹·공용 채널 관계는 별도 유지 |
| rubber-soul | Rubber Soul | group | 전용 채널 후보 미확정; 그룹·공용 채널 관계는 별도 유지 |
| shez | She'z | group | 후보/기존 채널 신원·소유 근거 추가 확인 필요; 일부 주소 응답/ID 확인 실패; 동명이인·Topic·공용 후보 제외 |
| shinvi | Shinvi | group | 전용 채널 후보 미확정; 그룹·공용 채널 관계는 별도 유지; 일부 주소 응답/ID 확인 실패 |
| skarf | Skarf | group | 후보/기존 채널 신원·소유 근거 추가 확인 필요; 일부 주소 응답/ID 확인 실패 |
| soko-no-kimi-ni | 소코노키미니 | group | 전용 채널 후보 미확정; 그룹·공용 채널 관계는 별도 유지 |
| solaire-comet | 솔레어 코메트 | group | 전용 채널 후보 미확정; 그룹·공용 채널 관계는 별도 유지 |
| solaire-diamant | 솔레어 디아망 | group | 전용 채널 후보 미확정; 그룹·공용 채널 관계는 별도 유지 |
| sonamoo | SONAMOO | group | 후보/기존 채널 신원·소유 근거 추가 확인 필요; 일부 주소 응답/ID 확인 실패 |
| soyeon | 전소연 | solo | 후보/기존 채널 신원·소유 근거 추가 확인 필요 |
| spia | SPIA | group | 전용 채널 후보 미확정; 그룹·공용 채널 관계는 별도 유지; 일부 주소 응답/ID 확인 실패 |
| ssoa | 쏘아 | group | 전용 채널 후보 미확정; 그룹·공용 채널 관계는 별도 유지 |
| sugar | Sugar | group | 후보/기존 채널 신원·소유 근거 추가 확인 필요 |
| suran | SURAN | solo | 전용 채널 후보 미확정; 그룹·공용 채널 관계는 별도 유지 |
| swan | 수안 | solo | 후보/기존 채널 신원·소유 근거 추가 확인 필요; 일부 주소 응답/ID 확인 실패; 동명이인·Topic·공용 후보 제외 |
| tahiti | TAHITI | group | 후보/기존 채널 신원·소유 근거 추가 확인 필요 |
| tara | T-ARA | group | 후보/기존 채널 신원·소유 근거 추가 확인 필요 |
| tea-party | 티파티 | group | 전용 채널 후보 미확정; 그룹·공용 채널 관계는 별도 유지 |
| the-grace | The Grace | group | 후보/기존 채널 신원·소유 근거 추가 확인 필요; 동명이인·Topic·공용 후보 제외 |
| the-seeya | The SeeYa | group | 후보/기존 채널 신원·소유 근거 추가 확인 필요 |
| tiny-g | Tiny-G | group | 후보/기존 채널 신원·소유 근거 추가 확인 필요 |
| tzuyu | 쯔위 | solo | 후보/기존 채널 신원·소유 근거 추가 확인 필요; 동명이인·Topic·공용 후보 제외 |
| unicorn | UNICORN | group | 전용 채널 후보 미확정; 그룹·공용 채널 관계는 별도 유지 |
| vvs | VVS | group | 후보/기존 채널 신원·소유 근거 추가 확인 필요; 일부 주소 응답/ID 확인 실패 |
| wassup | WA$$UP | group | 후보/기존 채널 신원·소유 근거 추가 확인 필요; 동명이인·Topic·공용 후보 제외 |
| wsg-wannabe | WSG 워너비 | group | 후보/기존 채널 신원·소유 근거 추가 확인 필요 |
| xum | XUM | group | 후보/기존 채널 신원·소유 근거 추가 확인 필요; 일부 주소 응답/ID 확인 실패 |
| ye-eun | 장예은 | solo | 후보/기존 채널 신원·소유 근거 추가 확인 필요 |
| year7class1 | Year 7 Class 1 | group | 후보/기존 채널 신원·소유 근거 추가 확인 필요; 일부 주소 응답/ID 확인 실패 |
| yeri | 예리 | solo | 후보/기존 채널 신원·소유 근거 추가 확인 필요; 동명이인·Topic·공용 후보 제외 |
| yoo-ji-ae | 유지애 | solo | 후보/기존 채널 신원·소유 근거 추가 확인 필요 |
| yooa | 유아 | solo | 후보/기존 채널 신원·소유 근거 추가 확인 필요 |
| yuqi | 우기 | solo | 후보/기존 채널 신원·소유 근거 추가 확인 필요; 동명이인·Topic·공용 후보 제외 |
