# 그룹 데뷔 연도 정렬

정확한 데뷔일이나 선공개 발매일 순서는 사용하지 않고 공식 활동 시작의 연도만 관리합니다. `config/groups/<id>.json`의 `debutYear`는 정수 또는 null이며 새 그룹에 값이 없으면 ‘데뷔 연도 미확인’으로 표시하고 연도 정렬의 마지막에 배치합니다. 같은 연도 안에서는 이름순으로 정렬합니다. 날짜를 영상 업로드 시점에서 추측하지 않습니다.

현재 등록한 연도와 확인 자료:

| 그룹 | 연도 | 자료 |
| --- | --- | --- |
| RESCENE | 2024 | [KBS WORLD](https://world.kbs.co.kr/service/contents_view.htm?board_code=&board_seq=449638&id=&lang=e&menu_cate=enternews&page=23) |
| KiiiKiii | 2025 | [Marie Claire Korea](https://www.marieclairekorea.com/celebrity/2025/03/kiiikiii-2/) |
| USPEER | 2025 | [OSEN](https://www2.osen.co.kr/article/G1112881262) |
| Hearts2Hearts | 2025 | [SM 공식 실적 발표](https://cdn2.smentertainment.com/wp-content/uploads/2025/05/1Q25_ScriptENG_CEO-Message_250507_vF-1.pdf) |
| TUIDE | 2026 | [Apple Music 데뷔 EP 소개](https://music.apple.com/us/album/tune-play-ep/6795782851) |
| HITGS | 2025 | [iMBC 데뷔 쇼케이스](https://enews.imbc.com/News/RetrieveNewsInfo/459017) |
| UNCHILD | 2026 | [High Up 공식 프로필](https://www.highup-ent.com/en/unchild/) |
| HEART OF WOMAN | 2026 | [JTBC](https://news.jtbc.co.kr/article/NB12324472) |
| MEOVV | 2024 | [Universal Music](https://www.universal-music.co.jp/meovv/news/2024-09-06/) |
| aespa / IVE / LE SSERAFIM / NewJeans | 2020 / 2021 / 2022 / 2022 | [한류 관련 기록 자료](https://www.archivecenter.net/kaitArchive/attach/120000/126777/20250312102047487.pdf) |
| TWICE | 2015 | [KBS WORLD](https://world.kbs.co.kr/service/contents_view.htm?board_seq=364940) |
| BLACKPINK | 2016 | [TIME](https://time.com/5562946/blackpink-k-pop-everything-to-know/) |

정렬 선택은 `sonar.group-sort.v1`에 저장하며, 편집 창과 사이드바 목록에 함께 적용합니다. 기본순에서는 기존 그룹 순서와 설정 창의 선호 우선 정렬을 사용합니다. 이름 정렬은 현재 등록된 영문 표기 기준이며 한글 음역순으로 재분류하지 않습니다.

편집은 별도 레이어 창입니다. 브라우저 팝업 창이나 새 탭을 열지 않으므로 로컬 HTML 미리보기에서도 사용할 수 있습니다. 목록 추가/제거는 선택 즉시 반영하고 저장합니다. 선호·제외·색상은 기존 정책대로 누르는 즉시 저장됩니다.
