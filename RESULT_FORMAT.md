# 측정 결과 공통 형식 (v1)

팔굽혀펴기(pushup_coach)와 윗몸일으키기(situp_coach)가 측정 1회마다 기기 저장소(IndexedDB `sessions`)에 남기는 결과 형식이다.
게이미피케이션(경험치·계급) 계층은 이 형식만 읽는다. 두 앱에 같은 문서를 둔다.

## 결과 1건

| 필드 | 형식 | 설명 |
| --- | --- | --- |
| `exercise` | `"PUSHUP"` \| `"SITUP"` | 종목 |
| `exerciseMode` | 팔굽혀펴기 `"FLOOR"`(맨땅) \| `"BAR"`(30cm 봉) / 윗몸일으키기 `"ASSIST"`(보조자) \| `"FIXED"`(기구) | 측정 환경 |
| `sessionType` | `"실시간측정"` \| `"업로드분석"` | 측정 방식 |
| `timestamp` | 숫자 (ms) | 저장 시각 |
| `dateStr` | `"YYYY.MM.DD HH:MM"` | 표시용 날짜 |
| `repCount` | 정수 | 정자세 인정 횟수 |
| `failCount` | 정수 | 부정자세 경고 건수 |
| `totalSeconds` | 정수 | 설정 시간(초) |
| `elapsedSeconds` | 정수 | 실제 측정 시간(초) |
| `faultLogs` | 배열 | 아래 기록 항목 |
| `cadetId`, `cadetName`, `recordingRes`, `videoBlob` | | 기존 필드 (게임 계층은 사용하지 않음) |

## 기록 항목 (`faultLogs[]`)

| 필드 | 형식 | 설명 |
| --- | --- | --- |
| `type` | 문자열 \| `null` | 부정자세 코드. 안내성 기록(관절 미인식 등)은 `null` |
| `isFault` | 불리언 | `true`이면 부정자세 경고 (`failCount`에 포함) |
| `sec` | 정수 | 측정 시작 후 경과 초 |
| `time` | `"MM분 SS초"` | 표시용 |
| `reason`, `detail` | 문자열 | 화면·CSV 표시용 한글 설명. **계산에 쓰지 않는다** (문구가 바뀌면 계산이 깨짐) |

## 부정자세 코드

| 종목 | 코드 | 의미 |
| --- | --- | --- |
| 팔굽혀펴기 | `SHALLOW` | 덜 내려감 |
| | `INCOMPLETE` | 팔꿈치 안 펴짐 |
| | `SAG` | 허리 숙여짐 (골반 처짐) |
| | `HIGH_HIP` | 골반 높음 (엉덩이 솟음) |
| | `WAVE` | 상체 선행 상승 (배치기) |
| | `KNEE` | 무릎 닿음 |
| 윗몸일으키기 | `NOT_UP` | 덜 올라옴 (팔꿈치-허벅지 미접촉) |
| | `NOT_DOWN` | 덜 내려감 (등 상부 미접지) |
| | `HAND` | 손 이탈 |
| | `HIP` | 엉덩이 반동 |
| | `ELBOW` | 팔꿈치 반동 |
| | `KNEE` | 무릎 각도 불량 (기구 모드, 직각 미유지) |

## 이전 기록과의 호환

v1 이전에 저장된 기록에는 `exercise`, `faultLogs[].type`이 없다. 팔굽혀펴기는 `exerciseMode`도 없다.
게임 계층은 `exercise`가 없으면 저장된 앱(DB 이름)으로 종목을 정하고, `type`이 없는 경고는 코드 미상으로 처리한다.
