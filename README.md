# SONAR · 흩어진 순간들을 한곳에

K-POP 아티스트의 흩어진 YouTube 영상을 모아보는 웹사이트입니다. React + Vite + Tailwind CSS, Python 표준 라이브러리 수집기, GitHub Actions 정기 수집과 GitHub Pages 배포 설정을 포함합니다. 로그인·댓글·게시판·커뮤니티는 없습니다.

## 바로 실행

Node.js 24 권장(최소 22.12), pnpm 11.25.0, Python 3.12 이상을 사용합니다. Python 추가 패키지는 필요 없습니다.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

표시된 로컬 주소(기본 http://127.0.0.1:5173/)로 접속합니다. 프로젝트의 index.html은 직접 열지 마세요. Windows에서는 `START-SONAR.cmd`를 사용할 수 있습니다.

한 파일로 바로 열어보려면 프로젝트 바깥의 `SONAR-actual-preview.html`을 엽니다. 현재 실제 데이터가 포함되어 API 키 없이 탐색할 수 있습니다. 썸네일과 YouTube 재생에는 인터넷이 필요합니다.

## 현재 데이터

실제 API 영상 90개, 샘플 영상 0개입니다. 현재 형식은 일반 영상 77개, 라이브 8개, Shorts 5개입니다. 우선 그룹은 RESCENE, KiiiKiii, USPEER, Hearts2Hearts, TUIDE, HITGS, UNCHILD, HEART OF WOMAN, MEOVV입니다. 등록된 전체 지원 아티스트는 19개이며 아직 영상이 없는 그룹은 수집 대기로 표시합니다.

현재 공개 데이터는 공식 채널 영상이므로 외부 콘텐츠 탭은 비어 있을 수 있습니다. 실제 외부 출연 영상을 수집·확인하기 전까지 샘플로 채우지 않습니다. 영상 전체를 시청해 출연 멤버를 확인했다는 뜻은 아닙니다.

## 화면 기능

- 사이드바는 LIVE NOW → MY GROUPS 순서입니다. 접기 버튼으로 좁게 표시하고 다시 펼칠 수 있습니다. 모바일에서는 메뉴 버튼으로 열고 닫습니다.
- KR / JP / EN / ES로 주요 화면 문구를 전환합니다. 그룹·영상명은 원문을 유지합니다. 언어와 사이드바 상태, 야간 모드는 브라우저에 저장합니다.
- 콘텐츠 메뉴는 목록 위의 홈 / MUSIC / 자체 콘텐츠 / 외부 콘텐츠 / 라이브 영상 / Shorts / 업로드 달력 버튼입니다. 주간·야간에 맞게 색상이 달라집니다.
- 연도와 월을 각각 고르며, 전체 연도에서 월만 선택할 수도 있습니다. 업로드 시각을 한국 시간으로 환산하며 다른 필터와 AND로 결합합니다.
- 자체/외부 구분은 `contentTypes`와 태그로 관리합니다. 중복 태그가 가능하고 MUSIC·라이브·Shorts 형식을 함께 유지합니다.
- 자체 콘텐츠는 비하인드 / 일상·브이로그 / 자체 예능 / 연습·퍼포먼스 / 기타·미분류의 큰 분류를 사용합니다.
- 외부 콘텐츠는 큰 분류 → 프로그램/채널 순서로 탐색합니다. 함께 출연한 그룹 수가 많은 프로그램/채널이 먼저 표시됩니다.
- 라이브 영상은 실제 방송 이력과 저장된 라이브 형식을 이용합니다. 카드의 ‘기타’ 표시는 ‘라이브’로 바뀌며, 확인된 멤버 태그로 찾을 수 있습니다. LIVE NOW는 공식 채널의 실제 진행 중 방송만 표시합니다.
- 외부 행사 일정 수집은 제거했습니다. 업로드 달력은 유튜브 게시일 기준이며 날짜별 그룹과 LIVE / Shorts / 롱폼 아이콘·개수를 표시합니다. 롱폼은 자체·외부 태그가 있는 일반 영상입니다. 아이콘을 누르면 영상 목록이 펼쳐집니다.
- 그룹 선택은 OR, 다른 필터와는 AND입니다. 영상은 플랫폼+영상 ID로 한 번만 저장하며 그룹별 JSON만 필요에 따라 읽습니다. 카드 페이지당 24개, 썸네일 지연 로딩, 클릭 후 플레이어 로딩을 사용합니다.

## MY GROUPS와 선호 프리셋

그룹 추가하기 버튼은 목록 위아래에 있으며 10개 초과 시 목록 안에서 스크롤합니다. 전체 켜기/끄기는 체크만 바꾸고, 전체 그룹 제거는 사이드바 목록을 비웁니다. 체크가 하나도 없으면 영상도 표시하지 않습니다.

All은 설정에서 금지한 그룹을 뺀 전체 그룹을 추가·선택합니다. 다시 누르면 체크만 해제하고 그룹 목록은 유지합니다. 하트·별·새싹 프리셋은 각각 저장하며 위쪽 아이콘을 중복 선택하면 해당 그룹들을 합쳐 봅니다.

각 그룹명 앞 아이콘으로 프리셋을 바로 저장·해제합니다. 선호 카드에는 그룹별 차분한 색상과 얇은 띠가 표시되고, 그룹 추가하기에서 색상을 바꿀 수 있습니다. 선호그룹은 자동 예외로 보호되며 금지할 수 없습니다. 금지 지정·해제는 그룹 추가하기 안에서만 합니다. 설정 위쪽 금지 버튼은 제외 그룹만 보여줍니다.

설정의 하트·별·새싹을 고르면 해당 프리셋 그룹을 먼저 표시하고, 나머지 그룹은 아래에 유지합니다. ×는 MY GROUPS와 세 프리셋에서 해당 그룹을 제거합니다. All/전체 그룹 제거로 목록을 비워도 프리셋과 수집 데이터는 유지합니다. localStorage는 브라우저마다 별도이며 자동 동기화하지 않습니다.

## 프로젝트 구조

```text
src/                    React UI, 필터, 언어 문구, 스타일
collectors/             YouTube 수집, 그룹 관리, 태그, 검수·미리보기 도구
config/groups/          그룹별 멤버·공식 채널 등록
config/channels.json    공통 외부 채널
config/overrides.json   직접 확인한 영상 태그 수정
config/taxonomy.json    콘텐츠 분류와 형식
public/data/catalog.json          그룹·멤버·채널 메타데이터
public/data/groups/<id>.json      그룹별 얇은 영상 인덱스
public/data/content/<id>.json     중복 없는 영상 원본 레코드
public/data/latest.json           최신 영상 인덱스
public/data/live.json             공식 진행 중 라이브
.github/workflows/sonar.yml       수집·검사·정적 배포
tests/                  JavaScript/Python 검사
```

`events`는 이전 JSON과의 호환성을 위해 빈 배열만 유지합니다. 공식 달력 수집기나 행사 일정 UI는 포함하지 않습니다.

## YouTube API와 실제 영상 갱신

1. Google Cloud 프로젝트에서 YouTube Data API v3를 사용 설정합니다.
2. API 키를 만들고 해당 API로 제한합니다. 서버/Python 수집용 키를 브라우저 코드에 넣지 않습니다.
3. 로컬에서는 환경 변수 `YOUTUBE_API_KEY` 또는 `UPDATE-ACTUAL.cmd`의 숨김 입력을 사용합니다. 키를 채팅이나 소스에 적지 않습니다. 숨김 입력 키는 저장하지 않습니다.
4. GitHub에서는 Settings → Secrets and variables → Actions에 `YOUTUBE_API_KEY`를 등록합니다.

```sh
python -m collectors.update_actual --prompt-key --limit 10
python -m collectors.youtube
python -m collectors.youtube --refresh-live
```

`update_actual`은 우선 공식 채널의 최근 영상으로 검수 데이터를 만들고 기존 실제 영상과 합칩니다. 공통 외부 채널까지 수집하려면 전체 수집기 `collectors.youtube`을 사용합니다. 제목에 명확히 나온 멤버만 자동 태그하며, 동명이인·설명란 명단은 보수적으로 처리합니다.

그룹 추가는 `MANAGE-GROUPS.cmd` 또는 `python -m collectors.groups --help`를 사용합니다. 등록 후 `python -m collectors.groups validate`, `python -m collectors.groups sync`로 검증·재색인합니다. 새 그룹은 확인한 공식 채널과 멤버 정보를 입력하고 수집을 활성화해야 합니다.

외부 큰 분류와 프로그램은 영상 override에 `externalType`, `programId`, `programName`을 지정합니다. 자체 큰 분류는 `ownType`, 자체/외부 중복 지정은 `contentTypes: ["own", "external"]`을 사용합니다. 자세한 내용은 [태그·기간 설명](docs/ARCHIVE.md)과 [멤버 태그 원칙](docs/MEMBER-TAGS.md)을 참고하세요.

## GitHub Pages 배포

대상 저장소는 https://github.com/SONARKPOP/SONAR 입니다. 연결된 GitHub 앱 인증으로 게시하며 채팅에 공유된 자격 증명을 사용하지 않습니다. Secret·Pages 설정과 API 예산은 docs/GITHUB-DEPLOYMENT.md를 참고하세요.

1. GitHub에서 새 저장소를 만들고 프로젝트 내용을 `main`에 올립니다. node_modules, .env, review, API 키는 올리지 않습니다.
2. GitHub CLI를 사용한다면 `gh auth login`으로 대화형 인증 후 저장소를 연결합니다.
3. Actions Secret에 `YOUTUBE_API_KEY`를 등록합니다.
4. 저장소 Settings → Pages → Source를 GitHub Actions로 지정합니다.
5. Actions의 SONAR 워크플로를 실행합니다. 수집도 원하면 `collect=true`를 선택합니다.

워크플로는 6시간마다 전체 유지보수를 실행합니다. 짧은 수집 회차에서는 확인 시간이 된 공식 채널의 최신 업로드를 살피고, 발견한 라이브 상태는 10분 주기로 확인합니다. GitHub 예약 실행이나 Pages 배포는 지연될 수 있습니다.

## 검사와 빌드

```sh
pnpm test
python -m unittest discover -s tests -p 'test_*.py' -v
pnpm build
python -m collectors.export_preview ../SONAR-actual-preview.html
```

의존성은 이미 설치된 상태에서 현재 변경을 검사했습니다. 실제 실행 결과는 VALIDATION.md에 기록합니다. 새 API 요청 성공이나 실제 화면 시각 검사를 빌드 성공으로 대체해 주장하지 않습니다.

### 그룹 → 멤버 필터 및 쇼츠 표시
영상 목록에서는 그룹을 먼저 고르면 해당 그룹 멤버만 선택할 수 있습니다. 그룹을 바꾸거나 MY GROUPS에서 현재 필터 그룹을 끄면 멤버 필터를 초기화합니다. 쇼츠 카드와 일반 분류의 기타 값은 쇼츠로 표시합니다. 기존 세부 태그가 있으면 유지하며 멤버를 임의로 추가하지 않습니다.

필터는 기간 → 세부 분류·영상 형식 → 그룹·멤버의 세 줄로 표시합니다. 각 영역의 초기화는 해당 영역에만 적용됩니다.

기간·분류·형식·그룹·멤버 필터는 드롭다운 대신 선택 버튼으로 표시합니다. 긴 버튼 줄은 가로 스크롤하며, 그룹을 선택해야 멤버 버튼이 나타납니다.

현재 필터는 접힌 상단 바(기간·그룹·멤버·상세 필터)와 적용 조건 태그로 구성합니다. 버튼을 누를 때만 선택 목록을 띄우고 선택 후 접습니다. 바깥 클릭 또는 Escape로 닫을 수 있으며, 세부 분류·형식·자체/외부 분류는 상세 필터 안에 있습니다.

자체 콘텐츠 탭에서는 자체 태그가 있어도 쇼츠를 제외합니다. 쇼츠 탭은 실제 short 형식 또는 shorts 분류를 기준으로 표시하며 홈과 업로드 달력에서는 기존처럼 함께 볼 수 있습니다.

최상단 헤더는 제거했습니다. 검색과 주야간 전환은 사이드바 언어 버튼 위에 있으며 접은 상태에서도 아이콘으로 접근합니다. 본문과 index.html에 비공식 팬페이지를 명시했고 하단 문구는 SONAR ON입니다. UI 점검 결과는 docs/UI-REVIEW.md를 참고하세요.

MY GROUPS는 기본 보기와 편집을 분리합니다. 기본 보기에서는 그룹 줄 전체를 눌러 선택·해제하고 저장된 선호 표시는 읽기 전용으로 보입니다. 편집에서만 선호·금지·삭제 및 전체 켜기/끄기/제거를 조작합니다. 전체를 다시 누르면 체크만 해제하며 목록과 프리셋은 유지됩니다.

MY GROUPS의 편집은 별도 레이어 창에서 수행합니다. 기본순·데뷔 연도 오름/내림차순·이름 A–Z 정렬을 제공하고 사이드바에도 적용하며 정렬 선택을 저장합니다. 데뷔 연도 자료와 미확인 값 처리는 docs/DEBUT-YEARS.md를 참고하세요.

공개 목록과 자동 수집은 여자 그룹, 혼성 그룹, 솔로를 대상으로 합니다. 듀오는 여자 또는 혼성 그룹으로 표시합니다. 외부 채널 영상에 지원 대상과 남자 그룹이 함께 출연하면 지원 대상 태그로 영상이 남습니다.

유형별 제외·개별 제외·유형 예외 허용을 별도로 관리합니다. 편집 창 금지 탭에서 유형을 차단하고 그룹 설정에서 일부를 허용할 수 있습니다. 선호그룹과 수동 예외 허용이 금지보다 우선합니다. 그룹 줄은 이름/선택/설정만 기본 표시합니다. 상세 정책과 JSON 오류 조치는 docs/EXCLUSIONS.md를 참고하세요.


### 간소화된 그룹 관리 (현재 구성)
MY GROUPS의 편집/그룹 추가하기는 검색·유형·정렬·목록 추가/제거만 다룹니다. 선택 즉시 MY GROUPS와 영상 목록에 반영되며 적용 버튼은 없습니다. 닫기는 변경을 되돌리지 않습니다. 다른 그룹의 체크 상태는 유지합니다. 추천은 목록이 비었거나 검색 결과가 없을 때만 나타납니다.

별도 보기 설정에서 선호 목록과 제외 설정을 나눠 관리합니다. 선호 프리셋을 고른 뒤 그룹 줄을 눌러 등록·해제하고, 색상도 여기에서 수정합니다. 제외 설정은 유형별 전체 제외와 개별 제외를 구분하며 유형 전체 제외가 있을 때만 예외 허용을 표시합니다. 모든 선택은 즉시 반영·저장됩니다.


### 현재 그룹 선택·예외 정책
LIVE NOW 위의 여자·남자·혼성·듀오/솔로 버튼을 여러 개 켤 수 있고 최소 하나는 유지합니다. 꺼진 유형은 LIVE NOW·MY GROUPS·영상에서 숨기지만 저장한 목록은 보존합니다. 하트·별·새싹은 그룹 편집 창에서도 즉시 설정할 수 있습니다. 선호 목록 중 하나라도 포함된 그룹은 무조건 자동 예외 허용이며 금지할 수 없습니다. 그룹 편집 창에서 개별 금지·수동 예외도 지정합니다. 최신 정책은 docs/EXCLUSIONS.md를 따릅니다.

그룹 검색 아래의 데뷔 연도 버튼은 5년 범위(2005–2009, 2010–2014 등)로 목록을 좁힙니다. 유형과 이름 검색을 함께 적용할 수 있으며 이 필터를 바꿔도 저장된 그룹 선택은 바뀌지 않습니다.


### 자동 수집 API 예산
새 라이브 검색은 SURGE·SAILING 공식 채널을 순환합니다. 검색 한도는 최근 24시간 80회, 실행당 20회입니다. 일반 조회는 최근 24시간 8,000단위, 실행당 600회로 제한합니다. GitHub Actions 수동 실행의 `Enable temporary 24-hour read budget` 옵션으로 24시간 동안 일반 조회 상한을 9,000단위로 올릴 수 있습니다.


### 그룹 디렉터리와 업로드 활동 상태
사용자가 제공한 2020~2026년 데뷔 목록 175개를 등록했습니다. 기존 항목 포함 181개이며, 처음 추가된 162개는 확인 대기로 등록한 뒤, 공식 채널 검토를 거쳐 연결합니다. 현재 결과는 docs/OFFICIAL-SOURCES.json을 기준으로 합니다. 목록 등록은 자동수집 활성화와 다릅니다. 검증한 공식 YouTube 소스를 config/groups/<id>.json에 연결하고 collectionEnabled를 켜면 수집에 포함됩니다. 기존 우선 9개 그룹 자동수집은 유지합니다. 입력 목록과 출처는 docs/2020-ONWARD-DIRECTORY.json에 있습니다.

활동 상태는 공식 그룹 채널의 마지막 공개 업로드(lastOfficialUploadAt)만 기준으로 계산합니다. 외부 출연·샘플은 제외하고 쇼츠·라이브 업로드는 포함합니다. 6개월 이상은 비활성, 12개월 이상은 활동정지 그룹 목록으로 분리합니다. 이는 SONAR의 업로드 기준이며 실제 해체나 공식 활동중단 판정이 아닙니다. 기록이 없으면 확인 대기로 남고 새 공식 업로드가 수집되면 자동 복귀합니다. 활동정지 목록은 편집창에서 명시적으로 열어야 표시되며 저장된 선택·선호 설정이나 영상은 삭제하지 않습니다.

그룹 편집의 전체 선택은 현재 일반/활동정지 목록에서 제외 설정을 존중하며 검색·데뷔연도와 관계없이 선택합니다. 전체 해제는 모든 저장 그룹을 해제하되 선호·제외 설정은 보존합니다. 현재 목록 선택/해제는 검색·유형·연도에 맞는 항목만 변경합니다. 홈·음악·자체·외부 영상은 분류된 쇼츠를 제외하고 Shorts 탭에서 볼 수 있습니다. 업로드 달력은 기존 쇼츠 업로드 요약을 유지합니다. YouTube API가 직접적인 Shorts 여부를 제공하지 않으므로 태그 없는 1분 이하 일반 영상도 Shorts 탭에 짧은 클립이라는 별도 표시로 함께 모읍니다. 라이브는 길이와 관계없이 제외하며 원본 데이터의 형식은 덮어쓰지 않습니다. 1~3분 세로 Shorts 중 태그가 없는 영상은 추가 판별이 필요합니다.

영상 팝업은 브라우저 방문 기록과 연결됩니다. 뒤로가기는 현재 영상 팝업을 닫고 목록을 보존합니다. 닫기·Esc·배경 클릭으로 닫아도 팝업용 기록을 되돌려 불필요한 뒤로가기 단계가 쌓이지 않습니다.
그룹 편집·추가·보기 설정 창도 영상 팝업과 동일하게 뒤로가기로 닫힙니다. 즉시 반영된 그룹/선호/제외 설정은 되돌리지 않습니다.


### 공식 채널 연결 검토 (2026-11-06)
신규 162개 항목을 모두 검색·검토해 89개 공식 그룹 채널의 근거 링크를 확보하고 연결했습니다. 기존에 채널이 등록돼 있던 aespa·IVE·LE SSERAFIM·NewJeans도 수집을 활성화해 총 102개 그룹이 수집 대상입니다. 기본 선택은 기존 9개를 유지합니다. 나머지 73개는 팬 채널·동명이인·공용 채널·삭제/비공개·근거 부족 등을 구분하기 위해 확인 대기로 남깁니다. 확인하지 못한 사실을 채널이 없다는 확정 판정으로 사용하지 않습니다.

소스의 expectedChannelNames는 API로 처음 채널을 식별할 때 이름을 대조합니다. 채널이 없거나 업로드 목록이 404이면 해당 소스만 건너뛰고 보유 영상을 유지합니다. 키·쿼터 오류는 전체 수집을 중단하며, 실패한 공개 데이터는 배포하지 않습니다. public/data/collection-report.json에 수집 기록 수와 확인이 필요한 소스를 남깁니다. 멤버 이름은 추가로 추측하지 않습니다.

그룹 자동 태깅은 제목만 사용합니다. EPISODE·PRECIOUS·CLASSy·VVS처럼 일상 표현과 겹치는 이름은 공식 그룹 채널 소유 관계 또는 수동 검수로만 연결해 일반 단어나 설명란 때문에 그룹이 잘못 붙지 않게 합니다.

공식 채널의 마지막 업로드가 7일 미만이면 한국 시간 06:00, 15:00, 18:00, 20:00, 22:00, 23:00, 00:10 전후 15분에 채널별로 확인합니다. 7~15일 미만은 06:00, 22:00, 00:10 전후 15분, 15~30일 미만은 자정 전후 하루 1회입니다. 이후 30일, 90일, 180일, 365일, 730일 경계부터 각각 3일, 7일, 15일, 30일, 90일 간격으로 분산 확인합니다. 임시 일반 조회 모드에서 예산이 남으면 최근 7일 이내의 SURGE, SAILING, COASTING 채널을 저녁에 추가 확인합니다. 방문자의 그룹 선택은 YouTube API를 호출하지 않습니다.

2026-11-06 ?? ??: ?? ?? ?? ? ?? ?? 4,819?, ?? 478? ??, ??? ?? ID 0?. lilli lilli? ??? ?? 404? ?? ??. Python 56??JavaScript 49? ?? ? ????? ??. ??? ?? ??? ??? ?? ??? ???? ??? ??????. ?? NMIXX ?? ?? ? ?? ?? ???? ??? ?? ???? ??????.


## Expanded artist directory (2026-11-06)

The catalog now covers 501 artist profiles: boy-group debuts from 2020 onward, girl-group debuts from 2007 onward, plus requested female solo/pop artists. Idol solo profiles appear in both girl-idol and duo/solo tabs using one stable profile ID. Explicit solo uploads may link to their parent groups without duplicating canonical videos or re-registering shared YouTube channels. Existing default 9 selections remain unchanged.

Directory registration does not imply an official channel has been verified or a complete discography collected. Dedicated publisher references are enabled selectively; pending sources remain disconnected and fan/reupload/gossip sources remain excluded. See docs/ARTIST-DIRECTORY.md and docs/ARTIST-EXPANSION-2026-11.json for scope and evidence. Activity dates for a shared group source count only uploads explicitly linked to the solo artist.
# Girl-group YouTube activity

Five English icon states are calculated from independently collected official uploads: SURGE, SAILING, COASTING, ANCHORED and LOST SIGNAL. Unknown or incomplete data has no icon. Actual group disbandment is a separate, nullable registry field. See [activity rules, cache, database and review workflow](docs/YOUTUBE-ACTIVITY.md).

Run `python -m collectors.channel_activity` with `YOUTUBE_API_KEY` configured, then `python -m collectors.groups sync`. Run `python -m collectors.channel_database` for the full source/evidence census. GitHub Actions uses the existing secret and persistent API budget; no key belongs in a source file. `python -m collectors.channel_candidates` adds review-only candidates, never automatically verified official channels.


Use python -m collectors.channel_review to refresh the channel review queue in public/data/channel-review.json. To inspect one candidate, supply its artist ID and YouTube handle. After verifying dedicated artist ownership, add --apply --evidence URL to record the evidence, and add --official-evidence for an artist or agency source. The review command uses the same environment variable for the API key.

### 나무위키 보조 프로필 조사

GitHub Actions Secret에 `NAMUWIKI_API_KEY`를 등록합니다. 키는 수집기 환경 변수로만 전달되며 `VITE_` 환경 변수나 공개 JSON에 넣지 않습니다. 기본 전체 수집(6시간 주기)에서 최대 12개 아티스트를 조사하며, 요청 간격 2.1초와 7일 캐시를 적용합니다. 로컬 실행은 `python -m collectors.namuwiki --limit 12`입니다.

결과는 `public/data/namuwiki-research.json`의 후보·비교 상태로 저장합니다. 누락 필드가 많은 여성 그룹·솔로부터 순환 조회하고, 기존 공식 값과 다르면 `conflict`로 남깁니다. 조사 장부의 Wikidata/Fandom 생년월일과 같아도 보조 검증이며 자동으로 기존 프로필을 덮어쓰지 않습니다. API 키 누락·401·403·429·네트워크 오류는 `source_unavailable`이고, 아티스트나 채널 없음 판정이 아닙니다. 외부 서비스가 실패해도 YouTube 수집·배포는 계속합니다.

전체 여성 채널 조사 결과와 미해결 사유는 [조사 보고서](docs/FEMALE-CHANNEL-SURVEY.md), 데이터 구조는 `config/channel-survey.json`과 생성된 `public/data/artist-channel-survey.json`을 참고합니다. 물리 채널은 UC ID로 중복 제거하고 인물은 기존 멤버 ID를 재사용합니다. 개인 프로필과 그룹 활동 주체를 구분하며, 원본 영상은 기존 platform+video ID로 한 번만 보관합니다.

### 치지직 및 공식 원본 링크 설정

GitHub Actions 저장소 시크릿에 CHZZK_CLIENT_ID와 CHZZK_CLIENT_SECRET을 설정합니다. 이어 config/platform-content.json의 chzzkChannels에 공식 근거를 확인한 channelId, groupIds, evidenceUrl을 등록합니다. 정기 실행은 치지직 Open API의 채널 조회와 진행 중인 라이브 목록을 사용합니다. 라이브 조회는 회차당 최대 10페이지이며, 등록 채널이 없으면 API 호출을 건너뜁니다.

videos에는 검수한 원본 링크를 등록할 수 있습니다. platform, externalId, sourceUrl, evidenceUrl, title, publishedAt, channelId, channelName, groupIds를 입력합니다. 확인한 YouTube 미러 ID는 duplicateYouTubeIds에 넣습니다. 공식 공개 Open API에서 치지직 다시보기·클립의 조회 및 임베드 방법이 확인될 때까지 이 콘텐츠는 검수한 원본 링크로 연결합니다. 네이버 온스테이지도 검수된 네이버TV 원본 링크를 같은 방식으로 다룹니다.
