# 출연 판별과 소속 정보

사용자 용어는 **그룹 구성원 목록**, **인물 프로필**, **소속 이력**입니다. 기존 내부 ID와 필드 이름은 호환성을 위해 유지합니다.

## 출연 상태

| 상태 | 표시·집계 |
|---|---|
| `confirmed` | 출연 확인. 실제 근거 URL을 갖춘 게시자 크레딧·편집 검토를 사용합니다. |
| `inferred` | 출연 추정. 제목의 명확한 이름과 문맥을 사용하며 기존 추정 출연 집계에 포함합니다. |
| `needs_review` | 판별 필요. 해당 인물 연결을 기본 검색·활동량에서 제외합니다. |
| `mention` | 단순 언급·원곡자 등. 해당 출연 연결에 사용하지 않습니다. |
| `other-person` | 검토 결과 다른 인물. 기존 후보를 제외하고 지정한 인물 ID로 연결할 수 있습니다. |

공식 업로드 수는 채널 소유에 기반한 기존 통계입니다. 업로드 수와 실제 출연 확인은 다르며, 공식 채널이라는 이유만으로 멤버 전원이 출연 확인 처리되지는 않습니다.

명확한 제목 이름의 추정 연결을 추가하므로 기존보다 추정·개인 활동이 증가할 수 있습니다. 추정 집계 공식 자체는 유지합니다. 판별 필요·단순 언급은 제외하며, 영상 ID 중복 제거를 유지합니다.

## 관리 방법

공개 편집 페이지는 제공하지 않습니다. `public/data/appearance-review.json`은 읽기 전용 검토 목록입니다. 다른 출연자가 확인된 영상은 기존 원본 레코드를 재사용하고, 일반 목록에 연결할 수 없는 영상만 `public/data/review-content/`에 보관합니다.

```powershell
python -m collectors.appearance_review list --state needs_review
python -m collectors.appearance_review decide VIDEO_ID:person:PERSON_ID --state inferred --reason "문맥 대조 결과"
python -m collectors.appearance_review decide VIDEO_ID:person:PERSON_ID --state confirmed --reason "게시자 출연 크레딧 확인" --evidence-url https://publisher.example/actual-evidence
python -m collectors.appearance_review decide VIDEO_ID:person:PERSON_ID --state mention --reason "원곡자 언급"
python -m collectors.appearance_review decide VIDEO_ID:person:PERSON_ID --state other-person --target-id CORRECT_PERSON_ID --reason "동명이인 대조"
python -m collectors.groups sync
```

예시 URL과 ID는 실제 검토한 값으로 바꿔야 합니다. 확인 상태에는 실제 근거 URL이 필요합니다. 검토 결과는 `config/appearance-decisions.json`으로 저장하며 저장소 변경·배포 절차로 반영합니다. 판별 사유, 일치 구간, 출처 제목을 보존합니다. 소속 기간이 부족한 인물 단독 제목은 인물 식별과 영상의 소속 연결을 별도로 검토해야 합니다.

## 소속 태그

`config/affiliation-display.json`은 대표 표시·우선순위·개인별 예외를 관리합니다. 숨김은 소속 이력 삭제가 아닙니다. 영상의 `careerGroupIds`는 공개 시점까지 확인 가능한 관계이며, 실제 출연 그룹과 분리합니다. `displayCareerGroupIds`는 대표 표시용입니다. 이후 소속은 과거 영상에 전파하지 않습니다. 날짜를 모르면 확인 자료의 기준일까지 거슬러 추정하지 않습니다.

## 검증 범위

자동 테스트와 제목 대조는 영상 전체 시청 검증을 뜻하지 않습니다. 별도 공식 채널 피드 대조는 수집 목록 누락을 찾기 위한 제한된 표본이며 전체 기간·전체 출연 정확도의 보증이 아닙니다. 국적은 출생지의 대체값이 아니며 지도 집계에서 분리합니다.
