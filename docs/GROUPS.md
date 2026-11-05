# 그룹 추가·관리

이용자의 **MY GROUPS 추가**는 등록된 지원 그룹을 내 목록에 넣는 기능입니다. 이 문서는 **운영자가 SONAR에 새로운 지원 그룹을 등록**하는 방법입니다. API 키나 GitHub 로그인은 그룹 등록에 필요하지 않습니다.

## 가장 쉬운 등록

Windows에서 프로젝트의 `MANAGE-GROUPS.cmd`를 더블클릭하세요. 그룹 ID, 표시 이름, 한국어/영어 별칭, 공식 YouTube 채널 주소를 입력하면 전체 설정을 검증하고 등록 전 내용을 보여줍니다. `y`로 저장하면 공개 카탈로그와 그룹 인덱스까지 갱신됩니다. 브라우저를 새로고침하면 그룹 추가 검색에 나타납니다. 기본 선택과 수집은 자동으로 켜지지 않습니다.

다른 환경에서는 `python -m collectors.groups wizard`를 실행합니다. Python 3.12+만 필요합니다. 멤버는 추측해서 생성하지 않으며, 등록 후 그룹 파일의 `members`에 검증한 정보를 추가하세요.

## 한 줄로 등록

아래 예제는 설명용 그룹과 핸들입니다. 실제로 등록할 그룹 정보로 바꿔 실행하세요.

```sh
python -m collectors.groups add --id example-group --name "Example Group" --alias "예시 그룹" --youtube "https://www.youtube.com/@example_group"
```

`@handle` 또는 `UC...` 채널 ID도 받습니다. 영상/재생목록 URL은 거부합니다. 이 단계는 형식과 중복만 검사하며 네트워크 호출이나 공식 여부 자동 검증은 하지 않습니다. 공식 계정은 운영자가 원본 출처에서 확인하고 수집을 켜세요.

## 네 가지 독립 설정

| 설정 | 역할 | 신규 등록 기본값 |
| --- | --- | --- |
| supported | 지원 그룹 검색 목록에 표시 | true |
| defaultSelected | 처음 방문한 이용자의 기본 관심/선택 그룹 | false |
| collectionEnabled | 공식 소스 수집 및 외부 채널 별칭 매칭 대상 | false |
| sampleEnabled | 샘플 재생성 시 이 그룹의 데모 생성 | false |

기존 이용자가 저장한 선택은 기본 그룹을 바꿔도 덮어쓰지 않습니다. 지원 중단된 그룹과 삭제된 그룹은 저장 목록에서 제거합니다. 빈 관심 목록과 전체 선택 해제도 그대로 유지합니다.

```sh
python -m collectors.groups set example-group --default-selected true
python -m collectors.groups set example-group --collect true
python -m collectors.groups set example-group --sample true
python -m collectors.groups set example-group --default-selected false --collect false --sample false --supported false
```

채널 자체의 `collectionEnabled`도 true여야 수집합니다. 기본 등록 도구는 채널 스위치를 true로 만들되 그룹 수집 스위치를 false로 두므로, 그룹의 `--collect true`를 명시적으로 실행해야 실제 수집에 포함됩니다. 공유 외부 채널은 한 번만 등록하고 활성 그룹의 이름/멤버 별칭에 맞춰 연결합니다.

수집을 끄면 이미 저장된 아카이브는 유지하고 새 업로드를 가져오지 않습니다. 해당 소스의 진행 중 라이브는 계속 진행 중이라고 표시하지 않습니다. 지원 중단은 별도 설정이며, 지원을 끄면 공개 목록과 해당 그룹 인덱스에서 제외합니다.

## 파일 구조

```text
config/
  groups/
    rescene.json
    hearts2hearts.json
    kiiikiii.json
    uspeer.json
    ...
  channels.json     공통 외부 출연 채널
  settings.json     그룹 표시 순서
  taxonomy.json     대분류·세부 분류·형식
  overrides.json    영상별 수동 태그·일정
```

각 그룹 파일에 이름/별칭/멤버/그룹 전용 공식 채널/네 가지 설정을 함께 보관합니다. 파일 이름과 `id`는 같아야 합니다. `settings.json`에 없는 신규 그룹은 기존 목록 뒤에 이름순으로 표시됩니다. 순서를 바꾸려면 `groupOrder`에 ID를 넣으세요. 화면 코드와 수집기 코드를 수정할 필요가 없습니다.

그룹 파일 예제:

```json
{
  "id": "example-group",
  "name": "Example Group",
  "aliases": ["Example Group", "예시 그룹"],
  "gender": "girl",
  "platforms": ["youtube"],
  "supported": true,
  "defaultSelected": false,
  "collectionEnabled": false,
  "sampleEnabled": false,
  "members": [
    {"id":"example-group-member","groupId":"example-group","name":"멤버명","aliases":["멤버명","MEMBER"]}
  ],
  "channels": [
    {"id":"example-group-official","platform":"youtube","handle":"@example_group","name":"Example Group","official":true,"groupIds":["example-group"],"collectionEnabled":true}
  ]
}
```

외부에서 준비한 그룹 파일은 `python -m collectors.groups import 경로/그룹.json`으로 신규 등록합니다. 이미 등록된 그룹을 덮어쓰지 않습니다. 기존 그룹은 파일을 수정한 뒤 아래 검증/갱신 명령을 실행하세요.

## 검증과 반영

```sh
python -m collectors.groups list
python -m collectors.groups validate
python -m collectors.groups sync
```

등록 도구의 add/import/set은 검증 후 sync까지 자동 실행합니다. 직접 파일을 편집한 경우 validate와 sync를 실행해야 합니다. 검사 실패 시 신규 파일을 저장하지 않습니다. 검사 대상: 필수 항목, ID 형식·중복, 그룹 별칭 충돌, 멤버 연결, 채널 ID/핸들 중복, 공식 소스의 그룹 연결, 설정 타입과 모순, 지원하지 않는 플랫폼의 수집 활성화.

`sync`는 기존 영상·일정을 유지하면서 카탈로그·그룹 인덱스를 재생성합니다. 지원 목록에서 제거한 그룹의 연결과 사용하지 않는 인덱스는 정리합니다. YouTube API 호출을 하지 않으며 라이브를 새로 확인한 것처럼 시각을 갱신하지 않습니다. 새 그룹의 실제 영상은 다음 수집 성공 후 표시됩니다.

```sh
python -m collectors.youtube
```

데모 영상이 필요하면 sampleEnabled를 켠 다음 **샘플 모드로 전환하는 명령**을 실행합니다. 이 명령은 실제 수집 데이터를 샘플로 교체하므로 운영 데이터에 무심코 실행하지 마세요.

```sh
python -m collectors.sample
```

GitHub Actions는 빌드 전에 설정 검증과 카탈로그 sync를 실행합니다. 새 그룹 등록 파일을 커밋하면 다음 배포에 지원 목록이 반영됩니다. 실제 수집에는 GitHub Secrets의 API 키와 명시적인 수집 활성화가 필요합니다.

## 선택 편의 기능

선택 도구는 **그룹 추가하기 창 안에만** 있습니다.

- 그룹 이름/체크: 이번에 MY GROUPS에 적용할 그룹 선택.
- 별표 켜기: 즉시 선호그룹에 저장.
- 별표 끄기: 즉시 선호그룹에서 제거.
- 선호그룹 선택: 저장된 별표 목록만 현재 선택으로 불러오기.
- 전체 선택 / 전체 선택 취소: 등록된 모든 그룹 선택/해제. 선호그룹 목록은 변경하지 않음.
- 선택 완료: 현재 그룹 선택을 MY GROUPS에 적용.

별도의 선호그룹 저장 버튼은 없습니다. 별표 변경은 창을 닫거나 새로고침해도 유지됩니다. 닫기/ESC는 적용 전의 임시 그룹 선택만 취소하며 별표 변경은 되돌리지 않습니다. 선호 목록은 저장한 브라우저/기기에서 유지됩니다. 이전 선택 기능은 없습니다.
