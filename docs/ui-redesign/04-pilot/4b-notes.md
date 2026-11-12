# 단계 4b 기록 — dock 패널

- 상태: **승인대기**. 4a·4b 모두 끝났고, 단계 4 전체로 Gate D를 실기기 캡처로 받는다.
- 브랜치: `design/ui-redesign-stage4` (4b 기준 `f791a77`). push·PR은 하지 않았다.
- 설계: `docs/superpowers/specs/2026-11-12-ui-redesign-stage4b-design.md` (`9959e0b`, `73e3eaf`), 계획: `docs/superpowers/plans/2026-11-12-ui-redesign-stage4b.md` (`27aaae4`).

## 1. 바뀐 것 (커밋별)

| 커밋 | 내용 |
|---|---|
| `89db669` | 합치기: 세션 "Diary Dock 풀이 구분선 추가"의 `62095a5`(풀이 구분선, 문제별 '가자!!!', 풀이 기록의 task 추적). 사용자 지시로 합쳤다(D8) |
| `4de57c2` | 타임라인 카드(D1): 주황 띠 → 얇은 구분선, 이모지 → Ionicons(`splitLeadingIcon`), 글자·색 토큰, 학습장·가자!!! → `Button`. 날짜 자리는 그대로 |
| `121245c` | 검색 dock: 탭 → `Chip`(role=tab), **개념 탭 삭제(D2)**, 탭 목록에 없는 프리셋·저장값은 '2026'(D3) |
| `957d336` | 기출 검색: 공용 `Chip`(계열 radio, 나머지 checkbox), **연도·시행월·번호 "선택" 버튼이 그 행을 비운다(D4)**, 계열 라벨은 글자, 가자!!! → `Button` |
| `db2b781` | 실황 수업: 개수 배지 → `Tag tone="unread"` |
| `ea1d16e` | 내 정보: 세 동작 → `Button text`(로그아웃은 구분선 뒤 위험 톤), 이름 변경 → `Dialog`, 태블릿 순서 카드 → 동작 → 사서함(D7), MyInfo·사서함 토큰 |
| `8f24940` | Diary: 날 탭 → `Chip` + 닫기 `IconButton`(D5), 풀이 목록 뒤로 → `Button text`, 달력 화살표 → `IconButton`, 개수 배지 → `Tag`, 책갈피 추가·답안 예시 → `Button secondary`, 문제별 가자!!! → `Button primary`(D6), 구분선 문제 사이 `lineStrong`·풀이 사이 `line`(D6a), 공지 토큰 |
| (이 커밋) | 인벤토리 67행, 캡처 목록 4b, 이 기록, 가이드 단계 표 |

## 2. "시각만 바꾼다"의 예외

- **D2**: 검색 dock의 개념 탭을 없앴다. 개념 검색은 캔버스 개념 시트(`CanvasChrome`)에서만 쓴다. `ConceptLookupPanel`은 그대로다.
- **D3**: 저장된 `'concept'`(`lastAgenda`)은 지우지 않고 '2026'으로 연다. `registry.ts`는 이미 research 프리셋을 `recent|pre|mentor`로 막고 있어 바꾸지 않았다.
- **D4**: 기출 검색 행 "선택" 버튼은 새 동작이다(그 행만 `[]`, 쿼리 빌더·저장값 그대로).
- 합친 `62095a5`의 동작 변화(task 발급·taskId 저장, 문제별 가자!!!)는 그 세션의 작업이다. 4b는 그 위에서 모양만 바꿨다.

## 3. 검증

- `npx jest`: 54 묶음 중 53 통과, 334 중 333 통과. 실패는 기존 `canvasSize` 하나(`notices`는 4b 뒤 통과한다).
- `npm run typecheck`: 오류 없음.
- `node docs/ui-redesign/tools/check-inventory.mjs docs/ui-redesign/03-components-inventory.md .` → `OK rows=67`.
- `__tests__/dockDrift.test.ts`: 4b가 손댄 dock 파일 12개에 hex·이름 색·숫자 `fontSize`가 없다.
- `git diff --stat 89db669 -- app src package.json`: 설계 §4의 12개 파일만.
- 이 검증은 모두 jest·정적 검사다. 실기기에서 본 것은 아직 없다.

## 4. 실행 중 내린 결정

- 타임라인 접근성 라벨은 이모지를 뗀 제목으로 만든다(`기출 검색 학습하기`). 부제의 맨 앞 이모지도 아이콘으로 바꾼다(책갈피 부제의 📆). 모르는 이모지(🥸)는 글자 그대로.
- 내 정보 버튼은 `debounceMs={0}`(전처럼 바로 반응, 바쁠 때 비활성은 그대로).
- 사서함·공지의 굵은 주황 띠 구분선도 타임라인처럼 1px `colors.line`으로 바꿨다(설계의 "토큰만"에 해당하는 토큰 값).
- Diary 날 탭의 접근성 라벨은 "<M월/D일> 풀이" → 탭 글자 "<M월/D일>"(공용 `Chip`에 라벨 prop이 없다. role=tab이 탭임을 알린다).
- 달력 기록 있는 날 테두리 `'blue'` → `colors.accent`, 숫자 `'orange'` → `accentText`, 다른 달 `'gray'` → `disabled`.
- 기출 검색 알림 글자는 1안대로 `colors.danger`.

## 5. 남은 것

- **실기기 확인이 필요한 위험**: Diary 탭 줄이 `Chip` 높이(32)로 낮아진 것, 기출 검색 행 비우기 버튼이 칩 줄을 밀어 줄바꿈이 늘어나는 것, 내 정보 dock에서 사서함이 동작 버튼 아래로 간 것, 타임라인 카드의 아이콘 정렬.
- **D-02**는 dock 패널까지 옮겨 단계 4 범위에서는 닫는다. 문제 목록(`ProblemListPanel`·`ProblemActionRow`)·`ConceptLookupPanel`·`PlaybackToolbar`는 단계 5.
- 다른 세션이 main 체크아웃에 남긴 미커밋 변경(`ProblemListPanel`의 AnswerBubble 등)은 이 브랜치에 없다.

## 개념·해답 통합 시트 (2026-11-12)

설계 `docs/superpowers/specs/2026-11-12-canvas-concept-answer-sheet-design.md`, 계획 `docs/superpowers/plans/2026-11-12-canvas-concept-answer-sheet.md`. 단계 4의 "모양만 바꾼다" 밖의 동작 변경(사용자 결정). D2의 "개념 검색은 캔버스 개념 시트(`CanvasChrome`)" 자리는 이제 `CanvasStudySheet`의 개념 탭이다.

- 실기기(태블릿 HA1V33DF, notebook): 툴바 '개념·해답' 하나(목록과 내 풀이 사이) → 해답 탭 50%, 해답 보임 → 개념 탭: 칩과 안내 문구 → 칩 선택 시 설명이 칩 아래에(모달 없음) → 해답 탭으로 돌아오면 다시 불러오지 않고 바로 보임 → 개념 탭에서 닫고 다시 열면 개념 탭 70%.
- 위험 1(숨긴 해답 WebView가 비는 것): 나지 않았다.
- 위험 2(탭 전환 때 열린 시트가 움직이는 것): 났다. 여는 높이를 `onDismiss`에서만 정하도록 고쳤다(테스트 "switching tabs does not move the open sheet…"). 실기기에서 탭을 바꿔도 시트가 그대로인 것을 다시 봤다.
- 시트를 닫으면 고른 개념은 지워진다(시트가 닫힐 때 내용을 언마운트한다). 탭 전환 동안은 남는다.
- 단원을 바꾸면 설명이 지워지는 것은 jest로만 확인했다.
- hotline-class·topic-live-class: 실기기 미확인 (라이브 수업 필요).
- `npx jest`: 346 중 345 통과, 실패는 기존 `canvasSize` 하나. 타입 검사 오류 없음.

## 6. Gate D 요청

단계 4 전체(4a + 4b)의 "후" 캡처를 실기기에서 이 브랜치 빌드로 찍어 주기를 요청한다: `shot-list.md`의 1–14(4a)와 15–22(4b). 데이터가 필요한 화면은 사용자가 테스트 계정으로 로그인한다. 개인정보가 보이는 캡처는 커밋하지 않는다. 시뮬레이터 캡처는 근거로 쓰지 않는다.
