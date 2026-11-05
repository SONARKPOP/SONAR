# 네 그룹 초기 데이터 점검 · 2026-11-05

이 문서는 실 API 연결 전의 초기 기록입니다. 이후 네 그룹의 API 연결에 성공해 20개 영상을 수집했고 공개 데이터에 반영했습니다. 최신 9개 그룹 현황은 [PRIORITY_GROUPS.md](PRIORITY_GROUPS.md)를 확인하세요. 멤버 태그도 이후 제목만 사용하는 더 보수적인 정책으로 변경했습니다.

지원/기본 선택/수집 활성 그룹은 RESCENE, Hearts2Hearts, KiiiKiii, USPEER입니다. 아래 공개 소속사·레이블·음원 서비스의 프로필과 설정을 대조했습니다. 생일·실명 등은 수집하지 않았습니다.

| 그룹 | 설정한 멤버 | 프로필 대조 출처 |
| --- | --- | --- |
| RESCENE | 원이, 리브, 미나미, 메이, 제나 | [Melon 아티스트 프로필](https://www.melon.com/artist/timeline.htm?artistId=3709231) |
| Hearts2Hearts | 지우, 카르멘, 유하, 스텔라, 주은, 에이나, 이안, 예온 | [Universal Music 공식 소개](https://www.universal-music.co.jp/hearts2hearts/biography/), [Melon 프로필](https://www.melon.com/artist/detail.htm?artistId=4096106) |
| KiiiKiii | 지유, 이솔, 수이, 하음, 키야 | [STARSHIP 공식 프로필](https://www.starship-ent.com/musician/kiiikiii?page=1&search=&tab=1) |
| USPEER | 시안, 소이, 서유, 다온, 채나, 로아 | [MW 공식 프로필](https://mwenter.co.kr/artist/USPEER/) |

설정의 24개 멤버 표시 이름과 위 프로필의 구성에 불일치는 발견하지 못했습니다. 이는 확인 시점의 공개 프로필 대조이며 멤버 구성 변경을 자동으로 감지하는 기능은 아닙니다.

## 채널 설정과 확인 범위

| 그룹 | 설정 핸들 | 현재 확인 범위 |
| --- | --- | --- |
| RESCENE | @RESCENE_official | [YouTube 채널](https://www.youtube.com/@RESCENE_official) 페이지 및 기존 공식 MV 링크 |
| Hearts2Hearts | @hearts2hearts.official | [SM 공식 페이지](https://www.smentertainment.com/artist/hearts2hearts/)의 YouTube 링크 대조 |
| KiiiKiii | @KiiiKiii_starship | [KBS 아티스트 소개](https://world.kbs.co.kr/service/contents_view.htm?board_seq=456292&id=&lang=j&menu_cate=artist&page=1)의 채널 링크 대조 |
| USPEER | @USPEEROFFICIAL | 기존 채널 설정 유지. MW 공식 페이지의 YouTube 영상 링크는 있으나 이번 확인에서 채널 핸들의 직접 연결까지 확정하지 않음 |

**실제 API 채널 해석·업로드 재생목록 접근은 네 그룹 모두 아직 미검증입니다.** 실행 환경에서 YOUTUBE_API_KEY가 설정되지 않았기 때문입니다. USPEER도 추정 채널 ID를 넣지 않고 핸들 기반 설정을 유지했습니다. 연결 점검 도구가 해석한 채널 ID와 실제 영상을 별도 보고서로 남기므로 운영자가 최종 확인할 수 있습니다.

## 반영한 태그 보완

- Hearts2Hearts 그룹 별칭에 Hearts 2 Hearts, H2H 추가.
- 에이나 표기 A_NA / A NA, 예온 표기 YEON / YE ON 지원.
- MAY / IAN을 `ambiguousAliases`로 지정. 설명의 일반 영어 단어로만 등장하면 태그하지 않고, 명시적인 해시태그 또는 소속 그룹이 연결된 제목의 정확한 대문자 표기를 우선합니다. 한국어 이름 매칭은 유지합니다.
- 이 규칙도 실제 출연을 보증하지 않습니다. 제목/설명에서 언급만 된 인물은 수동 검수가 필요합니다. 얼굴 인식은 하지 않습니다.

## 다음 실행

`CONNECT-YOUTUBE.cmd`를 실행해 키를 숨김 입력하면 공식 소스별 최신 업로드 최대 5개씩 별도 `review/` 폴더로 수집합니다. 공개 샘플 데이터는 유지합니다. report.json에서 채널 ID와 영상별 그룹·멤버·분류를 확인한 뒤 전체 수집으로 전환합니다. [API 연결 점검 안내](API_CHECK.md)
