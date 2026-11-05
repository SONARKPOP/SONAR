# 우선 운영 그룹 · 2026-11-05

우선 표시/기본 선택/수집 대상은 아래 9개 그룹입니다. 기존 6개 그룹은 지원 검색 목록에는 유지하지만 수집과 기본 선택은 꺼두었습니다. 모든 그룹의 샘플 생성 스위치는 꺼져 있습니다.

| 순서 | 그룹 | 내부 ID | 공식 소스 핸들 | 현재 실제 영상 |
| --- | --- | --- | --- | --- |
| 1 | RESCENE · 리센느 | rescene | @RESCENE_official | 기존 API 수집 5개 |
| 2 | KiiiKiii · 키키 | kiiikiii | @KiiiKiii_starship | 기존 API 수집 5개 |
| 3 | USPEER · 유스피어 | uspeer | @USPEEROFFICIAL | 기존 API 수집 5개 |
| 4 | Hearts2Hearts · 하츠투하츠 | hearts2hearts | @hearts2hearts.official | 기존 API 수집 5개 |
| 5 | TUIDE · 튜이드 | tuide | @TUIDE_official | 수집 대기 |
| 6 | HITGS · 힛지스 | hitgs | @HITGS_offcl | 수집 대기 |
| 7 | UNCHILD · 언차일드 | unchild | @official_unchild | 수집 대기 |
| 8 | HEART OF WOMAN · 하트오브우먼 | heart-of-woman | @heartofwoman_officl | 수집 대기 |
| 9 | MEOVV · 미야오 | meovv | @MEOVV_OFFICIAL | 수집 대기 |

새 그룹을 등록했다고 실제 영상을 임의로 만들지 않습니다. 현재 공개 데이터는 기존 네 그룹에서 API로 수집한 20개이며 샘플 영상/예시 일정은 0개입니다. API 키를 저장하지 않았으므로 이번 수정에서 새 그룹의 실수집은 실행하지 않았습니다. 새 다섯 채널의 API 채널 해석도 대기 상태입니다.

## 신규 그룹 프로필 근거

- TUIDE: [멤버가 직접 쓴 Melon 프로필](https://www.melon.com/musicstory/informView.htm?mstorySeq=17194), [ABD 공식 프로필](https://abolddream.com/ko/tuide/profile/). 서희·서연·엘레나·지아·사키·세아·이하늬의 표기를 등록했습니다. 채널 핸들은 공식 영상 설명의 안내와 대조했습니다.
- HITGS: [공식 채널 MV 설명](https://www.youtube.com/watch?v=3ensCfpaUWI), [MBC PLUS 공식 직캠 명칭](https://mbcplus.com/web/clip/youtubeView.do?seq=127457), [공식 이벤트 판매 항목](https://muvve.cafe24.com/product/detail.html?product_no=680). 비비·서진·서희·혜린·이유로 등록했습니다. 단일 소속사 프로필 페이지에서 전체 구성 확인까지 완료한 것은 아닙니다.
- UNCHILD: [High Up 공식 프로필](https://www.highup-ent.com/unchild/)의 여섯 멤버 표기를 기준으로 등록했습니다. 일부 최근 콘텐츠는 다섯 명만 열거하므로 현재 활동/출연 인원을 추정하지 않습니다. 구체적인 영상에 제목으로 명시되지 않은 멤버는 태그하지 않습니다.
- HEART OF WOMAN: [음원 서비스의 앨범 소개/멤버별 촬영 자료](https://www.genie.co.kr/magazine/subMain?ctid=1&mgz_seq=16532), [공식 채널 영상 설명](https://www.youtube.com/watch?v=7ariO6iM3nw). 지현·채이·아인·리리·류인을 등록했습니다. 일반 영어 HOW는 그룹 별칭으로 등록하지 않았습니다.
- MEOVV: [THEBLACKLABEL 공식 프로필](https://en.tblshop.com/meovv/profile.html), [KBS 소개와 공식 계정 안내](https://world.kbs.co.kr/service/contents_view.htm?board_seq=458339&id=&lang=j&menu_cate=artist&page=1). 수인·가원·안나·나린·엘라로 등록했습니다.

## 멤버 분류 원칙

제목의 이름/해시태그 또는 수동 설정만 사용하고 공통 설명의 멤버 목록은 무시합니다. ‘서희/SEOHEE’처럼 여러 그룹에 있는 이름은 공식 그룹 또는 제목에서 명시된 그룹 문맥 안에서만 연결합니다. 외부 채널에서 그룹 없이 동명이인 이름만 등장하면 미분류입니다. ‘이유’처럼 일반 명사로도 쓰는 이름은 명시적 해시태그를 우선합니다. 실제 출연 확인이나 얼굴 인식으로 보증하지 않습니다.

## 기존 이용자와 새 이용자

새 방문자는 9개 그룹이 기본 선택됩니다. 저장된 관심 목록은 덮어쓰지 않습니다. 선택 도구는 ‘그룹 추가하기’ 창 안에만 있습니다. 전체 선택은 검색 결과와 무관하게 등록된 전체 그룹을 선택하고, 전체 선택 취소는 모두 해제합니다. 선호그룹 선택은 별표를 켜거나 끄는 즉시 저장되는 목록을 불러옵니다. 선택 완료를 눌러 반영하며 창을 닫으면 변경하지 않습니다. 영상이 없는 그룹은 ‘수집 대기’로 표시됩니다.

## 다음 실수집 실행

프로젝트의 **UPDATE-ACTUAL.cmd**를 더블클릭하고 실행 창에 API 키를 숨김 입력하세요. 키는 저장하지 않습니다. 공식 소스별 최신 10개까지 별도 검수 폴더에 먼저 수집한 뒤, 보수적인 태그 규칙으로 실제 데이터에 합칩니다. 중복 ID는 한 번만 저장하고 기존 실제 영상은 유지합니다. 샘플은 합치지 않습니다. 이 실행은 외부 채널/신규 라이브 검색까지 수행하는 전체 수집이 아닙니다.

```sh
python -m collectors.update_actual --prompt-key --limit 10
```

성공하면 로컬 사이트를 새로고침하거나 갱신된 SONAR-actual-preview.html을 다시 열어 확인하세요. 전체 수집·라이브·공통 외부 채널은 이후 별도 점검하며, 공개 배포는 여전히 미실행 상태입니다.
