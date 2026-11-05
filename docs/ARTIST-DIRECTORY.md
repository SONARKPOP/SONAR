# 아티스트 유형과 추천

그룹 추가·편집 창은 전체 / 여자 아이돌 / 혼성 아이돌 / 남자 아이돌 / 듀오·솔로를 제공합니다. 등록 JSON의 `gender`는 `girl`, `boy`, `mixed`, `artistType`은 `group`, `duo`, `solo`입니다. 기존 그룹에 artistType이 없으면 group으로 처리합니다. duo/solo 구분이 성별보다 우선하므로 IU는 여자 그룹에 중복 표시되지 않고 AKMU도 혼성 그룹과 듀오에 중복 표시되지 않습니다.

‘추천 아티스트’는 현재 유형에서 아직 선택하지 않았고 제외 목록에도 없는 등록 아티스트를 최대 4개 제안합니다. 실제 콘텐츠가 있는 항목을 먼저 표시하고 이후 이름순입니다. 취향 추정·인기 순위·외부 영상 자동 출연 검증을 의미하지 않습니다. +는 MY GROUPS와 현재 보기에 즉시 추가합니다. 추천 영역은 목록이 비었거나 검색 결과가 없을 때만 표시합니다.

각 탭의 ‘현재 목록 선택/해제’는 현재 유형과 검색 조건에 맞는 항목에만 적용합니다. 다른 탭에서 선택한 항목은 유지합니다. 선호 프리셋은 세 유형을 넘어 함께 저장할 수 있습니다.

## 이번에 추가한 실제 아티스트 등록

- BOYNEXTDOOR: 남자 그룹, 공식 채널 @boynextdoor_official. [HYBE JAPAN 공식 보도자료](https://prtimes.jp/main/html/rd/p/000000697.000045862.html), [프로필 참고](https://en.wikipedia.org/wiki/BoyNextDoor).
- KARD: 혼성 그룹, 공식 채널 @KARD. [공식 채널 영상의 소개](https://www.youtube.com/watch?v=30yA85J7mdg), [프로필 참고](https://en.wikipedia.org/wiki/Kard_(group)).
- AKMU: 혼성 듀오, 공식 채널 @officialAKMU. [지니 공식 채널 안내](https://www.genie.co.kr/magazine/subMain?ctid=1&mgz_seq=9355), [프로필 참고](https://en.wikipedia.org/wiki/AKMU).
- IU: 솔로, 공식 채널 @dlwlrma. [채널 정보](https://channeldb.com/c/%40dlwlrma), [팬 아카이브의 공식 채널 안내](https://iutsc.com/video-directory-links/).

이는 실제 아티스트와 채널의 디렉터리 등록입니다. 영상이나 멤버 목록을 임의로 생성하지 않았습니다. 기본 선택·자동 수집은 꺼져 있으며 각 그룹 JSON은 수집 대기 상태입니다. 우선 9개 그룹의 수집 범위는 그대로입니다. 등록 후에도 수집 설정을 활성화하고 실제 API로 가져오기 전에는 새 영상이 생기지 않습니다.

새 아티스트 등록 시 CLI의 `add` 명령에 `--gender boy` 또는 `--gender mixed`, `--artist-type duo` 또는 `--artist-type solo`를 지정할 수 있습니다. 기존 wizard는 기본 여자 그룹 등록 방식이며 다른 유형은 CLI 또는 검증된 JSON import를 사용합니다. 지원 플랫폼은 여전히 YouTube입니다.
