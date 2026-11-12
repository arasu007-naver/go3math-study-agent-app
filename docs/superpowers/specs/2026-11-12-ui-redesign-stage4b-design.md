# UI 디자인 개선 — 단계 4b (dock 패널) 설계

- 작성일: 2026-11-12
- 상위 스펙: `docs/design/qoolla-ui-design-improvement-spec.md` §단계 4
- 선행: 단계 4a 설계 `docs/superpowers/specs/2026-11-10-ui-redesign-stage4a-design.md`, 4a 기록 `docs/ui-redesign/04-pilot/4a-notes.md`, Gate B `docs/ui-redesign/02-ia-overlay-roles.md` §9, Gate C `docs/ui-redesign/03-tokens-components.md` §8, 인벤토리 `docs/ui-redesign/03-components-inventory.md`
- 기준 커밋: `f791a77` (`design/ui-redesign-stage3`에 fast-forward로 합친 4a 끝). 작업 브랜치 `design/ui-redesign-stage4`, worktree `.claude/worktrees/ui-redesign-stage4`
- 범위: 단계 4의 뒤 절반. 태블릿 dock 다섯 칸(타임라인, Diary, 검색, 실황 수업, 내 정보)의 패널. **이 단계가 끝나면 단계 4 전체로 Gate D를 한 번 요청한다**(실 iPad·Android 태블릿 캡처가 근거).

## 1. 목표

4a에서 만든 공용 부품(`Button`·`Chip`·`IconButton`·`Tag`·`Dialog`)을 dock 패널에 적용하고, 남은 하드코딩 색·글자 크기를 토큰으로 옮긴다. 새 부품은 만들지 않는다. 동작·데이터·저장값은 바꾸지 않는다. 예외는 §2의 사용자 결정 D2~D4뿐이다.

성공 기준:

1. 인벤토리 §1·§1.1에서 교체 단계 4이고 아직 "4a 됨"이 아닌 행이 모두 공용 컴포넌트로 바뀌고, 해당 행이 새 줄 번호와 "4b 됨"으로 갱신되며 `check-inventory.mjs`가 통과한다.
2. 4b가 손댄 파일에 hex 색·이름 색과 숫자 `fontSize`가 남지 않는다(예외: 인벤토리 §4.4).
3. 결정 D2~D4마다 그것을 고정하는 테스트가 있다.
4. jest 전체가 기준보다 나빠지지 않는다(기준: `canvasSize`, `notices`, `timeline` 3 suites. `f791a77`에서 313 중 310 통과. 전체 실행에서만 가끔 실패하는 `TimelinePanel › shows the empty placeholder`는 따로 적는다). `npm run typecheck`가 깨끗하다.
5. `git diff --stat f791a77 -- app src package.json`에 §4 표 밖의 파일이 없다(D8로 합친 다른 세션의 커밋은 빼고 잰다). `package.json`은 바뀌지 않는다.
6. `docs/ui-redesign/04-pilot/shot-list.md`에 4b 화면이 더해지고 `docs/ui-redesign/04-pilot/4b-notes.md`가 있다.

## 2. 결정 사항 (단계 4b 브레인스토밍, 2026-11-12)

| # | 질문 | 결정 |
|---|---|---|
| P1 | 진행 방식 | **한 계획, dock마다 한 작업.** 새 부품 없음. 실기기 확인은 끝에 한 번, 이어서 Gate D. Diary 작업은 D8 때문에 맨 뒤(문서 작업 바로 앞)로 옮긴다 |
| D1 | 타임라인 카드 정리(진단 D-08) | **A안: 모양만.** 보이는 정보는 그대로. 주황 띠 → 얇은 구분선, 이모지 → Ionicons, 글자·색 토큰, 번호 나열은 `caption`·`muted`로 낮춤. **날짜는 지금 자리(버튼 위 오른쪽 정렬)에 둔다** |
| D2 | 검색 dock의 개념 탭(`ConceptLookupPanel`) | **삭제한다.** 개념 검색은 문제 풀이(캔버스)에서만 필요하다. `ConceptLookupPanel`은 캔버스 개념 시트(`CanvasChrome`)에서 그대로 쓴다. **"시각만 바꾼다" 원칙의 예외(기능 진입점 제거)** |
| D3 | 에이전트가 `category: 'concept'`로 검색을 열 때 | **'2026'(recent) 탭.** 프리셋이 탭 목록에 없으면 저장값과 같은 규칙으로 'recent'. 서버·프로토콜은 바꾸지 않는다 |
| D4 | 기출 검색 행 라벨("월 선택 ->" 등) | **연도·시행월·번호 행의 "선택" 버튼은 그 행의 선택을 비운다**(`[]`). 사용자 설명: 이 라벨은 초기화 버튼으로도 쓰인다(지금 코드에는 `onPress`가 없다). **새 동작** |
| D5 | Diary 날 탭 | 라벨 → `Chip`(role=tab), 닫기 ✕ → 옆의 `IconButton sm`. 아래 주황 밑줄은 없앤다 |
| D6 | Diary "가자!!!" | **세션 "Diary Dock 풀이 구분선 추가"의 구조를 따른다.** 그 세션이 오른쪽 아래 떠 있던 FAB를 없애고, 문제마다 마지막 풀이 아래 한 줄 오른쪽에 '가자!!!'를 두었다(`DailyRecordsList`의 `onSolve`). 4b는 그 버튼 → `Button primary sm`. FAB 관련 스타일은 4b에서 다루지 않는다(이미 없다) |
| D6a | Diary 구분선 두 가지 | 1안: 문제 묶음 사이 → `colors.lineStrong`, 같은 문제의 풀이 사이(`solution-divider`) → `colors.line`, 여백 8 유지. 근거: 지금은 둘 다 `#607D8B`라 문제 경계와 풀이 경계가 같아 보인다. 풀이 수를 세려고 넣은 선이라 문제 경계보다 한 단계 옅게 둔다 |
| D8 | 다른 세션 작업과의 순서 | "Diary Dock 풀이 구분선 추가" 세션의 변경은 main 체크아웃에 **커밋되지 않은 채** 있다(`DailyRecordsList`·`DiaryPanel`·`widgets.tsx`·`ensureTask.ts`·`notebook.tsx` 등). 4b의 Diary 작업은 그 변경이 커밋되어 사용자가 이 브랜치로 합치라고 한 뒤에 한다. 그 전까지 Diary 작업은 `blocked`이고 나머지 dock 작업을 먼저 한다 |
| D7 | 태블릿 내 정보 dock 순서 | 카드 → 동작 버튼 → 사서함(폰과 같은 순서). Gate B D-11 결정("두 기기 모두 프로필 카드 바로 아래")을 적용한다 |

## 3. 공용 부품

새 부품은 없다. 4a의 API를 그대로 쓴다.

- `Button`: `variant`, `size`, `icon`, `tone="danger"`(보조·텍스트만), `loading`, `disabled`, `expanded`, `accessibilityHint`, 배치 전용 `style`.
- `Chip`: `label`, `selected`, `onPress`, `accessibilityRole`(`button`·`tab`·`radio`·`checkbox`).
- `IconButton`: `icon`, `accessibilityLabel`(필수), `size` md·sm, `selected`, `disabled`.
- `Tag`: `tone` neutral·accent·unread.
- `Dialog`: `title`, `message`, `children`, `confirm`, `cancel`, `onDismiss`.

## 4. 바뀌는 파일

| 파일 | 바뀌는 것 | 근거 |
|---|---|---|
| `src/kit/timeline/TimelinePanel.tsx` | D1. 제목 → `type.title` + `colors.text` + Ionicons `document-text-outline`(밑줄 없음). 부제 → `type.bodyStrong` + `colors.accentText`. 월 줄 → `calendar-outline` + `type.body` + `colors.subtle`. 번호 줄 → `list-outline` + `type.caption` + `colors.muted`. 날짜 → `time-outline` + `type.caption` + `colors.muted`, 오른쪽 정렬 유지. 카드 사이 → 1px `colors.line`. 카드 바탕 → `colors.card`. 학습장 → `Button secondary sm`, 가자!!! → `Button primary sm`. 목록 끝 스피너 → `colors.accent`. 이모지는 `describeTask`가 만든 문자열에서 앞 글자를 떼지 않고, 그리는 쪽에서 아이콘과 나머지 글자로 나눈다(§5.1) | §1 `TimelinePanel:196`, `:205`, 진단 D-08 |
| `src/kit/diary/DiaryPanel.tsx` | D5 날 탭, "풀이 목록" 뒤로 → `Button text md` + `icon="chevron-back"`. 줄 번호는 D8로 합친 뒤 다시 잰다 | §1 `DiaryPanel` 행들, D8 |
| `src/kit/diary/RecordsCalendar.tsx` | 이전·다음 달 화살표 → `IconButton md`("이전 달"·"다음 달", 색은 IconButton 기본). 날짜 위 숫자 배지 → `Tag tone="unread"`. 나머지 색·글자 토큰 | §1 `RecordsCalendar:85`, `:98`, §2 배지 |
| `src/kit/diary/DailyRecordsList.tsx` | 책갈피 추가·답안 예시(GoButton) → `Button secondary sm`. D6 문제별 가자!!!(GoButton filled) → `Button primary sm`, 줄 오른쪽 정렬 그대로. D6a 구분선 두 가지. 바탕 `#FFFFFF` → `colors.card`. `onSolve`·`DiarySolveTarget`·`groupByProblem`은 그대로 | §1.1 `DailyRecordsList` 행들, D6, D6a, D8 |
| `src/kit/notices/NoticesPanel.tsx` | 색·글자 토큰만(눌리는 요소 없음) | §3, §4 |
| `src/kit/research/ResearchPanel.tsx` | D2: `CATEGORIES`에서 `concept` 삭제, `ConceptLookupPanel` import·분기 삭제, `ResearchCategory`에서 `'concept'` 삭제. 탭 3개 → `Chip`(role=tab). D3: `resolveInitialCategory`가 프리셋도 탭 목록으로 확인 | §1 `ResearchPanel:62`, D2, D3 |
| `src/host/widgets.tsx` | D2로 `ResearchCategory`가 좁아져 `props.category` 형 단언만 맞춘다(동작 변화 없음, 값 확인은 `resolveInitialCategory`가 한다). D8의 다른 세션도 이 파일을 고치므로 4b의 변경은 이 한 줄로 한정한다 | D3, D8 |
| `src/kit/exam-search/ExamSearchPanel.tsx` | 계열 행 라벨 → 글자(`type.bodyStrong`, `colors.subtle`). D4: 연도·시행월·번호 행 라벨 → `Button secondary sm` + `icon="refresh"`, 제목 "<행> 선택", hint "선택을 모두 지웁니다". 파일 안 `Chip` → 공용 `Chip`(계열 radio, 나머지 checkbox). 가자!!! → `Button primary sm`. 알림 글자 `#B45309` → 1안 `colors.danger`(근거: 글자용 warn 토큰이 없고 새 토큰을 만들지 않는다. `palette.warn[500]`은 배경용 팔레트라 직접 쓰지 않는다). 행 구분선 → `colors.line` | §1 `ExamSearchPanel:111`, §1.1 `:93`, `:103`, D4 |
| `src/kit/live-class/LiveClassListPanel.tsx` | 숫자 배지 → `Tag tone="unread"` | §2 배지 |
| `src/kit/profile/ProfileActions.tsx` | 이름 변경·프로필 이미지 변경 → `Button text md`(밑줄 없음). 구분선 뒤 마지막에 로그아웃 → `Button text md tone="danger"`. 이름 변경 모달 → `Dialog`(title "이름 변경", 입력은 children, `cancel={{}}`, confirm "저장", 비었거나 같으면 `disabled`). `NAME_MAX`, 완료 키 저장, 바쁠 때 비활성은 그대로 | §1 `ProfileActions:53`~`:100`, Gate C Q6, D-11 |
| `src/kit/profile/MyInfoPanel.tsx`, `src/kit/profile/MessageBoxPanel.tsx` | 색·글자 토큰만 | §3, §4 |
| `src/agent/tablet/TabletAgentLayer.tsx` | D7: 내 정보 dock의 세 줄 순서만 `MyInfoPanel` → `ProfileActions` → `MessageBoxPanel` | D7 |
| `__tests__/*` | §6 | — |
| `docs/ui-redesign/03-components-inventory.md` | 4b 행 갱신("4b 됨"), §1.1 GoButton 수, §5 예외 대장의 아이콘 전용 줄 | 성공 기준 1 |
| `docs/ui-redesign/04-pilot/shot-list.md`, `4b-notes.md`, 가이드 단계 표 | §7 | 성공 기준 6 |

바꾸지 않는 것: `ConceptLookupPanel`(캔버스에서 계속 씀, 단계 5), `ProblemListPanel`·`ProblemActionRow`(단계 5), `DrawerFooter`(데드 코드), 검색 쿼리 빌더(`buildThisYearQuery`·`buildPreExamQuery`)와 그 검증, MMKV 키와 값, 서버 프로토콜.

## 5. 세부 동작

### 5.1 타임라인 카드의 아이콘

`describeTask`는 지금 `📝 기출 검색`, `📆 10월`, `🔢 번호: …` 같은 문자열을 만든다. 데이터 함수는 그대로 두고, 그리는 쪽에서 맨 앞 이모지를 떼어 Ionicons로 바꾼다.

| 이모지 | Ionicons |
|---|---|
| 📝 | `document-text-outline` |
| 📆, 🗓 | `calendar-outline` |
| 🔢 | `list-outline` |
| 🕑 | `time-outline` |

모르는 이모지로 시작하는 줄은 글자 그대로 그린다(정보를 잃지 않는다). 접근성 라벨(`<제목> 학습하기`, `<제목> 학습장`)은 이모지를 뗀 제목으로 만든다.

### 5.2 기출 검색 행 비우기 (D4)

- 대상 행: 연도(모의 고사 모드에서만 보임), 시행월, 번호. 계열은 하나를 꼭 고르는 행이라 비우지 않는다.
- 누르면 그 행의 상태만 `[]`. 다른 행은 그대로. 칩을 하나씩 다 끈 것과 같은 상태라 쿼리 빌더·검증은 바뀌지 않는다.
- 저장값(`STORAGE_KEY`)은 계열만 저장하므로 비우기는 저장하지 않는다.

### 5.3 검색 초기 탭 (D2, D3)

`resolveInitialCategory(preset, store)`: `preset`이 탭 목록에 있으면 그것, 아니면 저장값이 탭 목록에 있으면 그것, 아니면 `'recent'`. 저장된 `'concept'`은 지우지 않는다(다음에 탭을 바꿀 때 덮인다).

### 5.4 Diary 날 탭 (D5)

탭 하나 = `Chip`(role=tab, `selected`) + 풀이 탭이면 오른쪽에 `IconButton sm icon="close"`(`<라벨> 탭 닫기`). 탭 줄은 가로 스크롤 그대로. 탭 줄 아래 구분선은 `colors.line`.

### 5.5 이름 변경 Dialog

저장을 누르면 지금의 `saveName` 흐름을 그대로 부른다(닫기·바쁨 표시·알림 순서 그대로). `Dialog`로 옮기면서 바뀌는 것은 겉모양과 버튼 부품뿐이다. 바깥 누르기·Android 뒤로 가기·취소는 닫기만 한다.

## 6. 테스트

새 테스트는 4a처럼 역할·라벨·testID로 찾고 스타일은 `props.style`로 읽는다(RNTL v14).

- **타임라인**: 카드에 이모지 글자가 없고 아이콘이 있다. 학습장·가자!!!가 `Button`(role button, 라벨 유지). 날짜가 그대로 그려진다. 모르는 이모지 줄은 글자 그대로.
- **Diary**(D8로 합친 뒤): 날 탭이 role tab + selected, 닫기가 "<라벨> 탭 닫기" 버튼이고 누르면 그 탭만 닫힌다. 문제마다 가자!!!가 `Button`(role button)이고 누르면 `onSolve`가 그 문제로 한 번 불린다(다른 세션의 기존 테스트가 있으면 그대로 통과). `solution-divider`가 `colors.line`, 문제 사이 구분선이 `colors.lineStrong`. 달 화살표 두 개가 라벨로 찾아지고 누르면 달이 바뀐다. 숫자 배지가 `Tag`.
- **검색**: D2 — 탭이 셋이고 "개념"이 없다. D3 — `resolveInitialCategory('concept')`와 저장값 `'concept'`이 모두 `'recent'`(기존 `research.test.ts:15` 기대값을 바꾼다). D4 — 시행월 "선택"을 누르면 시행월 칩이 모두 꺼지고 계열·번호는 그대로, 번호·연도도 같다. 계열 행에는 비우기 버튼이 없다.
- **실황 수업**: 숫자 배지가 `Tag`(unread).
- **내 정보**: 세 동작이 버튼이고 로그아웃이 마지막, 위험 톤 글자색. 이름 변경 → `Dialog`가 열리고, 같은 이름이면 저장 비활성, 새 이름 저장 시 `changeName` 한 번. 태블릿 dock 순서 카드 → 동작 → 사서함.
- 전체: `uiDrift`·`check-inventory` 통과, typecheck.

## 7. 문서와 캡처

- `shot-list.md`에 4b 화면을 더한다: dock 다섯 칸 각각, Diary 날 탭(풀이 탭 열린 상태), 기출 검색 두 모드, 이름 변경 대화상자. 이름은 4a와 같은 규칙(`ipad-<화면>-before|after.png`). Android 태블릿 캡처는 `android-` 접두사.
- `4b-notes.md`(한국어): 바뀐 것(커밋별), 테스트 숫자, 실행 중 결정, D2~D4가 시각 원칙의 예외라는 기록, 남은 것.
- 가이드 단계 표: 4 → `승인대기`(4a·4b 완료, Gate D 요청).
- Gate D 요청: 단계 4 전체(4a + 4b)의 실기기 "후" 캡처. 시뮬레이터 캡처는 근거로 쓰지 않는다. 데이터가 필요한 화면은 사용자가 테스트 계정으로 로그인한다. 개인정보가 보이는 캡처는 커밋하지 않는다.

## 8. 위험

- Diary 날 탭이 `Chip` 높이(`controlSm` 32)로 바뀌어 탭 줄이 낮아진다. 터치 영역은 4a의 `Chip`·`IconButton sm`이 정한 방식 그대로이며 실기기에서 확인한다.
- 내 정보 dock 순서가 바뀌어, 사서함이 길면 동작 버튼은 위에 남고 사서함만 길어진다(폰과 같은 모양).
- D8: 다른 세션의 변경이 늦게 합쳐지면 Diary 작업과 Gate D 요청이 함께 늦어진다. 합칠 때 `widgets.tsx`·`DailyRecordsList.tsx`가 겹치면 사용자가 합치라고 한 뒤 그 자리에서 푼다.
- D2로 검색 dock에서 개념을 찾던 사용자는 캔버스 개념 시트를 써야 한다. 4b-notes와 Gate D 요청에 적는다.
