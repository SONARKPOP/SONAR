# 실제 검증 기록

검증일: 2026-11-05 (Asia/Seoul). Windows에서 제공된 Node/Python 런타임으로 실행했습니다.

| 항목 | 결과 |
| --- | --- |
| pnpm 11.25.0 install --frozen-lockfile | 성공. pnpm lockfile 포함, esbuild 설치 스크립트만 명시적으로 허용 |
| pnpm test | JavaScript 테스트 8개 통과 |
| Python unittest discover | Python 테스트 13개 통과 (외부 API는 mocked 응답) |
| Python compileall collectors | 성공 |
| pnpm build | Vite 7.3.7 프로덕션 빌드 성공, dist 생성 |
| 개발 서버 | 정상 기동, HTTP 200 응답 확인 |
| 브라우저 기본 화면 | 홈, 샘플 카드, 필터 표시 확인 |
| 그룹 검색/저장 | 한국어 별칭으로 NewJeans 검색·추가, 체크 선택, 새로고침 후 유지 확인 |
| 외부 채널/스케줄 | 외부 콘텐츠와 채널 탭 표시, 선택 그룹 일정 표시 확인 |
| 페이지 전환 | 24개 단위 다음 페이지 전환 확인 |
| 플레이어 로딩 | 상세 열기 후 iframe 0개, 명시적 재생 클릭 후 iframe 1개 확인 |
| 모바일 | 390×844 뷰포트에서 2열 카드, 숨겨진 사이드바와 열기 버튼 동작 확인. 기본 뷰포트로 복귀 |

JS 테스트는 그룹 OR / 차원 간 AND, 공유 영상 중복 제거, 채널 우선순위·중복 집계, 라이브 허용 목록과 신선도, 저장소 오류, KST 월 경계, 모든 그룹 인덱스의 canonical 참조를 검증합니다.

Python 테스트는 키 누락, 별칭 경계, 공식/외부 다중 그룹 정규화, Shorts 판단, live→ended 상태 전환, 예약 일정, override 보호, 중복 없는 게시, 삭제 데이터 제거, 페이지 토큰, 50개 배치, 전체 수집 및 라이브 갱신을 mocked API로 검증합니다.

실제 YouTube API 키가 없어 실 API 연결·쿼터·핸들 해석 성공 여부는 검증하지 않았습니다. GitHub 로그인/저장소 생성/Actions 실행/Pages 공개 배포는 수행하지 않았습니다. 대표 MV 플레이어 iframe 생성은 확인했으나 영상 전체 재생이나 모든 국가·기기의 임베드 가능 여부는 검증하지 않았습니다.

최초 설치는 Windows 권한 제한 및 pnpm의 설치 스크립트 허용 설정 때문에 중단됐고, 권한 승인과 esbuild 허용 설정 후 재실행해 성공했습니다. 최종 결과는 위 표와 같습니다.

## 바다 콘셉트 및 우선 테스트 그룹 변경

우주·레이더 문구를 바다·소나 표현으로 교체하고, 배 아래로 음파가 퍼지는 SVG와 바다색 테마를 적용했습니다. SONAR를 배 이름으로 표현하는 문구는 사용하지 않습니다. 이후 기본 관심 그룹·샘플을 RESCENE, Hearts2Hearts, KiiiKiii, USPEER로 전환했습니다. 현재 샘플은 75개 레코드와 예시 일정 4개입니다. 이전 그룹은 추가 목록에 유지하고 공식 소스의 수집은 기본 비활성화했습니다.

수정 후 Vite 프로덕션 빌드와 JS 테스트 8개가 통과했습니다. 이번 화면의 브라우저 검증은 로컬 미리보기 연결 시간 초과로 완료하지 못했습니다. 앞 표의 브라우저 검증은 이전 디자인에 대한 기록입니다.

## 그룹 등록 구조 개편 검증

그룹별 설정 10개와 공통 채널/표시 순서/분류 설정으로 분리했습니다. 기본 관심 그룹과 수집 활성 그룹은 RESCENE, Hearts2Hearts, KiiiKiii, USPEER 네 그룹입니다. 화면의 그룹 기본값 고정 코드를 제거하고 카탈로그 값을 사용하도록 연결했습니다. `MANAGE-GROUPS.cmd`와 Python wizard/add/import/set/validate/sync 명령을 추가했습니다.

- Python 테스트 **28개 통과**: 기존 수집기 + 실제 등록 명령 흐름, 기본값/수집 분리, 중복·필수값·멤버 연결·파일명·표시 순서 검증, 등록 취소, 데이터 보존, 라이브 확인 시각 보존, 지원 중단 그룹 정리, 수집 일시 중단 시 아카이브 보존.
- JavaScript 테스트 **9개 통과**: 기존 필터/인덱스 검증 + 설정 기반 기본값, 저장된 선택 유지, 명시적으로 비운 목록 유지, 지원 중단 그룹 제거, 저장소 접근 실패 처리.
- 그룹 설정 validate/sync 성공: 지원 그룹 10개 / 기본 선택 4개 / 수집 활성 그룹 4개.
- Vite 프로덕션 빌드 성공. Python compileall 성공.
- 임시 그룹을 별도 테스트 디렉터리에 등록해 공개 카탈로그·그룹 인덱스가 생성되고 설정 변경이 반영되는 것을 확인했습니다. 배포용 설정에 가짜 그룹은 남기지 않았습니다.

실제 API 연결과 스마트폰 실기기 검증은 수행하지 않았습니다. 긴 그룹명 처리와 모바일 터치 영역을 코드에 보완했지만, 브라우저 연결 제한으로 변경 후 시각 검증은 완료하지 못했습니다.

## 네 그룹 프로필 대조 및 실제 연결 준비

2026-11-05 공개 소속사/레이블/음원 서비스 프로필과 네 그룹의 24명 표시 이름을 대조했습니다. 근거와 채널별 미확인 범위는 docs/GROUP_AUDIT.md에 기록했습니다. USPEER 채널 핸들의 직접 공식 출처 연결과 모든 그룹의 실제 API 채널 해석은 아직 검증하지 않았습니다.

Hearts2Hearts 그룹/멤버 별칭을 보완하고 MAY/IAN처럼 일반 영문과 혼동되는 표기의 자동 태그를 보수적으로 처리했습니다. 숨김 키 입력이 가능한 CONNECT-YOUTUBE.cmd와 소량 수집용 collectors.preflight를 추가했습니다. 기본 5개씩 공식 채널 최근 업로드만 별도 review 폴더에 수집하고 공개 샘플을 교체하지 않습니다.

변경 후 Python **34개**, JavaScript **9개** 테스트 및 프로덕션 빌드가 통과했습니다. 신규 테스트는 소량 수집 범위·보고서 생성·공개 데이터 보존·API 실패 시 부분 결과 미게시·키 누락 시 네트워크 호출 전 종료·멤버 표기 변형·오태그 방지를 검증합니다. API 응답은 모두 테스트 대역입니다.

환경변수 존재 여부만 확인한 결과 YOUTUBE_API_KEY는 설정되어 있지 않았습니다. 실제 키 값은 읽어 출력하거나 파일에 저장하지 않았습니다. 실제 API 호출과 전체 데이터 전환은 미실행 상태입니다.

## 실제 데이터 전환 및 9개 우선 그룹

이후 사용자가 실행한 소량 수집 보고서에서 네 공식 채널 각각 5개, 총 20개의 실 API 수집 성공을 확인했습니다. 해당 스냅샷을 제목 기반 멤버 태그로 재분류하여 공개 데이터에 반영했습니다. 현재 demo=false, 실제 영상 20개, 샘플 영상 0개, 일정/예시 일정 0개입니다. 멤버 태그가 있는 영상 3개, 미분류 17개이며 영상 전체 시청 검증을 했다는 표시는 없습니다. MV Reaction은 자체 콘텐츠/리액션으로 수정했습니다.

추가로 TUIDE, HITGS, UNCHILD, HEART OF WOMAN, MEOVV를 등록해 우선 그룹을 9개로 확대했습니다. 지원 그룹은 기존 보조 그룹까지 총 15개입니다. 새 다섯 그룹의 API 수집은 이번 실행 환경에 키가 없어 미실행 상태로 남겨두고, UI에서 수집 대기로 표시합니다. 모든 샘플 생성 플래그는 false입니다.

변경 후 Python **40개**, JavaScript **9개** 테스트와 Vite 빌드가 통과했습니다. 같은 이름을 가진 튜이드/힛지스의 멤버를 공식 그룹 문맥 안에서만 연결하는 검사, 그룹 없는 동명이인 미분류, 일반 명사 ‘이유’ 오태그 방지, 병합 시 기존 실제 영상 유지, 샘플 미포함을 검증했습니다. 외부 API는 기존 보고서를 확인한 것 외에 새로 호출하지 않았습니다.

UPDATE-ACTUAL.cmd는 한 번의 숨김 키 입력으로 9개 활성 공식 소스의 최근 10개씩 수집→검수 규칙 적용→기존 실제 영상 병합을 수행하도록 준비했습니다. 새 채널 API 성공 여부는 이 도구 실행 후 확인해야 합니다. 전체 영상 시청·스마트폰 실기기·공개 배포 검증은 완료되지 않았습니다.

SONAR-actual-preview.html은 실제 JSON을 포함한 로컬 스냅샷으로 생성했습니다. 자동 브라우저는 file 프로토콜 열기를 보안 정책상 거부하여 직접 화면 캡처 검증은 수행하지 않았습니다. 원래 개발용 index.html과 달리 이 스냅샷은 데이터 요청을 내장 JSON으로 처리하도록 별도 내보내기 도구를 사용합니다.

## 이전 선택·전체 선택 도구

‘우선 그룹 모두 추가’를 제거하고 ‘이전 선택 그룹’ 복원 기능으로 교체했습니다. MY GROUPS와 그룹 추가 창에 전체 선택/전체 선택 취소도 추가했습니다. 전체 선택의 범위는 MY GROUPS에 추가한 그룹입니다. 이전 선택은 별도 localStorage 키로 저장하며, 첫 변경 전에는 복원 버튼이 비활성화됩니다.

JavaScript **14개 테스트**와 프로덕션 빌드가 통과했습니다. 개별 체크·그룹 제거·전체 선택·해제 후 이전 상태 복원, 빈 이전 선택, 동일 상태 중복 적용 시 기록 보존, 새로고침용 저장값 복원과 지원 중단 그룹 제거를 검증했습니다. 실제 데이터 20개와 샘플 0개는 변경하지 않았습니다. 미리보기 HTML을 새 빌드로 갱신했으며 이번 UI의 브라우저 시각 검증은 수행하지 않았습니다.

후속 수정: MY GROUPS의 선택 도구는 제거하고, 그룹 추가하기 창 안에만 전체 선택/전체 선택 취소/선호그룹 선택을 배치했습니다. 전체 선택 범위는 등록된 전체 지원 그룹입니다. 창 안에서 임시로 선택한 뒤 선택 완료 시 적용하고 닫으면 취소합니다. 선호그룹은 이전 선택을 불러옵니다. 수정 후 JS 테스트 14개와 빌드가 다시 통과했으며 실제 데이터와 샘플 수는 유지했습니다.

최신 수정: 이전 선택 기능을 제거하고 별표와 명시적인 ‘선호그룹 저장’으로 별도 목록을 관리합니다. ‘선호그룹 선택’은 저장된 선호 목록만 적용하고, 전체 선택/해제 및 MY GROUPS 체크는 선호 목록을 바꾸지 않습니다. 이전 기록은 선호 목록으로 이전하지 않고 폐기합니다. JavaScript 12개 테스트와 빌드가 통과했으며 저장 목록의 독립성·저장소 오류·미지원 그룹 제거를 검증했습니다. 실제 영상 20개/샘플 0개는 유지했습니다.

별표 즉시 저장 변경: 별표 토글이 저장된 선호 상태를 직접 갱신하도록 연결하고, 별도 저장 버튼과 임시 선호 상태를 제거했습니다. 별표 변경은 창 닫기와 독립적이며, 그룹 선택의 선택 완료 동작은 유지했습니다. 변경 후 빌드 및 기존 JavaScript 12개 테스트를 실행했습니다.

## 낮은 헤더와 시각 정돈

큰 홈 배너를 제거하고, 작은 배 그림·SONAR ON·두 줄 소개를 높이 80px의 상단 바에 통합했습니다. 모바일은 검색창을 다음 줄에 배치합니다. 네이비 사이드바, 밝은 바탕과 얇은 카드 테두리, 은은한 그림자, 텍스트 크기/간격으로 정돈했습니다. 변경 후 프로덕션 빌드가 성공했으며 실제 데이터 스냅샷을 다시 생성했습니다. 이번 시각 변경은 자동 브라우저로 캡처 검증하지 못했으므로 실제 화면 확인은 미리보기 파일에서 해야 합니다.

Appearance update: 15 JavaScript tests passed; Vite production build passed; self-contained preview regenerated. Python unchanged. Visual browser inspection not performed.

Favorite card contrast: stronger tint and border with 4px inset color stripe in both themes. 15 JavaScript tests and production build passed; preview regenerated.

Header maritime mark replaced with compact original vector; day/night colors and mobile sizing added. Production build passed; preview regenerated. Browser visual inspection not performed.

MY GROUPS quick controls: select all saved, clear selection, select saved favorites (adding missing favorites to sidebar). Existing modal retained. Selection tests 3 passed; build and snapshot export passed.

Sidebar row update: empty selection yields empty videos/events and no latest-index fallback; per-row favorite and remove controls. Selection tests 3 passed; build and preview export passed. Browser inspection not performed.

Three favorite presets: heart/star/clover with independent persisted memberships, legacy star migration and active preset persistence. 16 JavaScript tests passed; production build and 109-file preview export passed. Browser visual inspection not performed.

All group toggle, colored icon presets, sprout migration via existing clover key, top/bottom add controls, 10-row scroll viewport. Selection tests 4 passed; production build and preview export passed.

Group picker: preset selectors fixed to single three-column row; each group has independent heart/star/sprout controls. Shared color available for membership in any preset. Responsive single-column group rows below 650px. Production build and snapshot export passed; browser inspection not performed.

Added explicit clear MY GROUPS button (presets retained), independent prefix icons replacing initials in sidebar and modal, sidebar preset union multi-select. Build and export passed. Browser inspection not performed.

Excluded groups: persisted block list, all-except-excluded action with strict content/event exclusion, and Ban tab for explicitly viewing excluded groups. 17 JS tests passed before Ban UI addition; final production build and 109-file export passed. Browser inspection not performed.

All now uses supported groups minus excluded list; repeat clears list. Outside Ban tab and separate action removed; settings-only exclusion. 5 selection tests passed; production build and preview export passed.

Group settings Ban control moved directly after sprout alongside preset icons; existing toggle handler retained. Production build and snapshot export passed.

Settings top selector now heart/star/sprout/Ban in one row. Ban toggles excluded-only settings list; per-row Ban clears membership. Production build and export passed.

Settings preset sorting: selected heart/star/sprout members first, all other groups retained below in catalog order. Sorting test plus 5 selection tests passed; build and preview export passed.

Mutual exclusion: enabling Ban clears all three favorite memberships; enabling any favorite clears Ban in sidebar and settings. Favorites may still overlap each other. Production build and preview export passed.

Content navigation moved from sidebar to collection-level horizontal icon buttons, active category via aria-current, mobile horizontal scrolling and dark-theme colors. Production build and 109-file preview export passed; browser inspection not performed.

## 2026-11-05 최종 통합 확인
- 기간별 연도/월 필터(KST), 별도 라이브 탭, 비독점 자체/외부 태그 및 자체 큰 분류 5개, 외부 분류→프로그램/채널 연결.
- 외부 행사 달력/수집기는 제거. 유튜브 업로드 달력은 날짜별 그룹 LIVE/Shorts/롱폼 개수와 펼침 목록 제공.
- 사이드바 접기 및 KR/JP/EN/ES 주요 UI 전환, 주간/야간 탭 색상 조정.
- 라이브 카드 멤버 태그 및 빠른 필터. 실제 8개 라이브 중 1개만 현재 제목 기반 멤버 태그가 있으며 7개는 미분류 유지. 센플릭스의 정적 멤버 목록/필터 방식만 참고했고 타 사이트의 멤버 배정을 복사하지 않음.
- 실제 영상 90, 샘플 0, 라이브 8의 subtypes는 라이브. 기존 데이터만 재색인했으며 추가 YouTube 요청은 실행하지 않음.
- JavaScript: 26/26 통과. Python: 43/43 통과. 그룹 설정: 지원 15 / 기본 9 / 수집 9 검증 통과. Vite production build 성공. 독립 HTML 미리보기 109개 JSON 포함.
- 의존성은 기존 설치분 사용. 이번 변경에서 새 설치는 수행하지 않음. 브라우저 시각 검사 및 GitHub 게시는 수행하지 않음.

Group-first member dropdown with disabled member selector until group chosen, live chips scoped to group, reset on group changes. Short generic subtype converted to 쇼츠; card badge follows short format. JS 26 passed, Python 44 passed, build/export passed. No browser visual inspection.

Filter layout separated into period, classification/format, and group/member rows. Independent reset actions. Production build and 109-file snapshot export passed. No new tests for this layout-only change.

All primary dropdown filters replaced with labeled button rows, aria-pressed selection state, horizontal overflow, independent resets and light/dark colors. Group-first member behavior retained. Production build and snapshot export passed; browser inspection not performed.

Compact filter UI: four toolbar triggers, mutually exclusive anchored popovers, selection-close behavior, outside-pointer/Escape dismissal, trigger focus restoration, removable applied-condition tags and clear-all. Own/external detail buttons moved into details popup. Production build and 109-file preview export passed. No browser visual inspection.

Own content excludes short format/shorts category despite own origin tags. Shorts tab also matches format for legacy records. JavaScript 27/27 passed; production build and preview export passed.

Removed top header; moved search/theme above sidebar languages with collapsed-mode access. Added visible unofficial fan-page notice and index title/meta. Sidebar motto now SONAR ON. Favorite tint uses union of all presets; empty selection shows useful group action. JS 27 passed; build and snapshot export passed. UI audit saved; no browser visual inspection.

MY GROUPS simplified: full-row selection, selected background/check, passive preset badges, edit-only membership/block/delete and bulk controls. All second click clears selection but retains saved groups; regression test added. JS 28 passed; production build and snapshot export passed. No browser visual inspection.

Group editing moved out of sidebar to dedicated modal. Debut year metadata validated and sourced for 15 groups; alphabetical and debut asc/desc sorting persists and applies to dialog/sidebar. Unknown years sort last. JS 29 passed, Python 44 passed; final registry sync/build/export passed. No browser visual inspection or API calls.

Artist category tabs and add-mode suggestions added. Four real directory entries added with collection/default/sample off: BOYNEXTDOOR, KARD, AKMU, IU. Registry 19 supported/9 defaults/9 collecting, existing 90 videos retained. Type precedence and recommendation exclusions tested. JS 31 passed, Python 45 passed, build and 113-file preview export passed. No new API collection, no browser visual inspection.

JSON fallback fix: direct embedded-snapshot data client, no requests for catalog-confirmed empty indexes, file-specific HTML-response errors, optional detail failures do not blank grid. Audit: 19 group indexes and 90 canonical records, missing 0. Independent category blocks/individual blocks/allow exceptions, new-artist inheritance and precedence tested. Group settings moved into expandable wrap-friendly panels. JS 37/37 passed; Vite build/export passed with 113 embedded JSON files. Original error URL was not provided; browser reproduction/visual inspection not performed.

Simplified group management: membership-only editor with search/category/sort and immediate add/remove. Separate View settings dialog for Favorites and Exclusions, exception controls only when category blocks exist. No apply button; all state changes persist via existing storage effect. Suggestions only for empty collection/search. Membership regression test confirms other group checks survive edits. JS 38 passed; build and 113-file standalone export passed. No browser visual inspection.

Latest behavior: artist display-type buttons above LIVE NOW, multi-select with at least one active, gates LIVE NOW/MY GROUPS/video data while preserving raw saved selection. Favorites always protected from individual/category bans, explicit exceptions also override bans. Inline editor presets and ban/allow buttons restored; changes immediate. Debut range buttons filter in five-year buckets with exact boundary tests. JS 42/42 passed, production build and 113-file snapshot export passed. No browser visual inspection.


GitHub integration (2026-11-05): published to SONARKPOP/SONAR with connected GitHub authentication. Added rolling quota ledger, bounded retry accounting and rotating live discovery; Python 50 tests, JavaScript 42 tests and production build passed locally. GitHub run 42042053088 also passed frozen dependency installation, registry validation/sync, both test suites, build and Pages deployment. Public URL: https://SONARKPOP.github.io/SONAR/. Direct public-site access and browser visual inspection were unavailable in this environment. Actual key validation is separate from deployment.

Actual API integration: workflow_dispatch run 42042429631 passed collection, build and deployment. Collector published 478 real records and committed data as 8cec254e640c46431084e8f1d3dc3fa9b0ea1f4d. API key was read only by Actions from its secret. Local snapshot still contains its prior 90 records; online repository is authoritative for the newly collected data.
