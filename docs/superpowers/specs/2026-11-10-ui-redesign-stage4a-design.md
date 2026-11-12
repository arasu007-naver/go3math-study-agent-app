# UI 디자인 개선 — 단계 4a (학습 화면 셸 파일럿) 설계

- 작성일: 2026-11-10
- 상위 스펙: `docs/design/qoolla-ui-design-improvement-spec.md` (이하 "개선 스펙") §단계 4
- 선행: 단계 2 `docs/ui-redesign/02-ia-overlay-roles.md` (Gate B, §9), 단계 3 `docs/ui-redesign/03-tokens-components.md` (Gate C, §8), 인벤토리 `docs/ui-redesign/03-components-inventory.md`
- 기준 커밋: `8c0bce1` (`design/ui-redesign-stage3`). 작업 브랜치 `design/ui-redesign-stage4`, worktree `.claude/worktrees/ui-redesign-stage4`
- 범위: 단계 4의 앞 절반(4a). 셸(채팅·rail·에이전트, 캔버스와 그 시트·모달, 학습장 시트)과 새 공용 부품. dock 패널(4b)은 별도 설계·계획. **Gate D는 4b가 끝난 뒤 단계 4 전체로 한 번 요청한다.** 4a 끝에는 사용자의 실 iPad "후" 캡처로 중간 확인을 한다.

## 1. 목표

단계 3이 만든 `Button`·`Chip`·`Dialog`와 Gate C가 더한 `IconButton`·위험 색 표현·`Tag`를 학습 화면 셸에 처음 적용한다. Gate B의 시트 규칙(캔버스 시트 2단계, 학습장 Bottom Sheet)과 rail 반투명을 코드로 옮긴다. 기능(필기, 알림, 6칸 기능, 에이전트 지시 처리)은 바꾸지 않는다.

성공 기준:

1. `src/ui/IconButton.tsx`, `src/ui/Tag.tsx`가 있고, `Button`에 `tone="danger"`가, `Sheet`에 키보드 피하기가 있다. 각 테스트가 통과하고 드리프트 가드(`uiDrift`)에 새 파일이 들어간다.
2. §4의 4a 대상 행이 모두 공용 컴포넌트로 바뀌고, 인벤토리(`03-components-inventory.md`)의 해당 행이 새 줄 번호와 "됨"으로 갱신되며 `check-inventory.mjs`가 통과한다.
3. 4a가 손댄 파일에 hex 색·이름 색(잉크 색과 WebView 문자열 제외, 인벤토리 §4.4)과 숫자 `fontSize`가 남지 않는다.
4. `SheetHost`가 scrim 없는 gorhom Bottom Sheet이고, 학습장의 `study_note_saved`·`study_note_dismissed` 이벤트는 지금과 같은 조건에서 한 번씩만 나간다.
5. 캔버스의 시트 셋(해답, 내 풀이, 개념 검색)이 `보기` 50%·`넓게` 70% 두 단계이고 툴바 위에서 멈춘다.
6. 펜 색 견본의 **표시 라벨**이 한국어(`02-ia-overlay-roles.md` §5: 주황·파랑·검정·빨강·초록)이고 저장값(`orange, blue, black, red, green`)과 MMKV 값은 그대로다.
7. jest 전체가 기준보다 나빠지지 않는다(기준: `canvasSize`, `notices`, `timeline` 3 suites·3 tests 실패, 이 브랜치 기준 255 통과). `npm run typecheck`가 깨끗하다.
8. `docs/ui-redesign/04-pilot/shot-list.md`와 `docs/ui-redesign/04-pilot/4a-notes.md`가 있다.
9. `git diff --stat 8c0bce1 -- app src package.json`에 §4 표 밖의 파일이 없다. `package.json`은 바뀌지 않는다(의존성 추가 없음).

## 2. 결정 사항 (단계 4 브레인스토밍, 2026-11-10)

| # | 질문 | 결정 |
|---|---|---|
| P1 | 단계 4를 한 계획으로 하는가 | **나눈다.** 4a = 새 부품 + 셸, 4b = dock 패널. 실 iPad 확인은 4a 뒤, Gate D는 4b 뒤 한 번 |
| P2 | main checkout의 다른 세션 미커밋 변경(`app/notebook.tsx`, `app/hotline-class.tsx`, `app/topic-live-class.tsx`, `src/host/widgets.tsx`, `src/agent/tablet/TabletAgentLayer.tsx` 등)과 겹친다 | **지금 진행하고 나중에 합친다.** 충돌은 브랜치를 합칠 때 푼다. 합치는 시점은 사용자가 정한다 |
| P3 | 실 iPad 캡처 | **사용자가 찍고 Claude가 목록을 쓴다.** "전"은 화면 파일을 바꾸기 전에 지금 빌드로, "후"는 4a가 끝난 뒤. 그 사이 리뷰용 시뮬레이터 캡처는 `sim-` 접두사로 두고 Gate D 근거로 쓰지 않는다 |
| P4 | 학습장 시트 구현 | **안 A: `@gorhom/bottom-sheet`, backdrop 없음.** 캔버스의 다른 시트와 같은 라이브러리·손잡이. 바깥 터치는 아래 화면으로 간다 |
| — | 섹션 1~3 | 사용자 승인("Looks right") |

버린 안: 학습장 시트를 RN `Modal`에서 scrim만 뺀 안(B)은 투명 `Modal`이 화면 전체 터치를 막아 "자기 영역만 덮는다"(Gate B Q5)를 지키지 못한다. 위치 지정 `View`(C)는 끌기·snap이 없어 캔버스의 다른 시트와 동작이 달라지고 키보드 피하기를 손으로 만들어야 한다.

## 3. 새 부품과 바뀌는 부품 (`src/ui/`)

### 3.1 `IconButton` (`src/ui/IconButton.tsx`, 새)

```ts
type IconButtonProps = {
  icon: IoniconName;            // Button.tsx의 타입 재사용
  accessibilityLabel: string;   // 필수
  onPress(): void;
  size?: 'md' | 'sm';           // 기본 md
  selected?: boolean;
  disabled?: boolean;
  accessibilityHint?: string;
  style?: LayoutStyle;          // Button.tsx의 타입·pickLayout 재사용
};
```

- `md`: 44 원(`layout.hit`), 아이콘 `layout.footerIcon`(22). `sm`: 32 원(`layout.controlSm`), 아이콘 18, hitSlop으로 44까지.
- 색: 기본 투명 바탕 + 아이콘 `colors.subtle`. `selected`: 바탕 `accentSoft`, 아이콘 `accentText`. 누름: `accentSoftPress`. `disabled`: 아이콘 `colors.disabled`, 누름 없음.
- 근거(아이콘 `subtle`): 지금 rail 아이콘은 `muted`(gray 500)다. rail 바탕이 0.88로 비치면 `muted`가 더 옅어 보이므로 한 단계 진한 `subtle`(gray 700)을 쓴다.
- `accessibilityRole="button"`, `accessibilityState={{ selected, disabled }}`.
- 비동기 loading은 없다(셸의 아이콘 버튼은 모두 동기 동작이다).

### 3.2 `Button`의 위험 색 표현 (`src/ui/Button.tsx`, 바뀜)

```ts
type ButtonProps =
  | (Base & { variant: 'primary' | 'danger'; tone?: never })
  | (Base & { variant: 'secondary' | 'text'; tone?: 'default' | 'danger' });
```

- `text` + `danger`: 글자 `colors.danger`, 누름 바탕 `colors.dangerSoft`.
- `secondary` + `danger`: 바탕 `card`, 테두리·글자 `colors.danger`, 누름 바탕 `colors.dangerSoft`.
- 비활성은 지금 `DISABLED` 표 그대로(톤과 무관).
- 새 토큰 하나: `colors.dangerSoft = palette.danger[50]` (`src/ui/theme.ts`). 근거: 이미 있는 팔레트 값이고, `accentSoft`가 `accent`의 누름·옅은 바탕인 것과 같은 짝이다.
- 4a에는 쓰는 곳이 없다(로그아웃·책갈피 해제는 4b·5). 부품과 테스트만 만든다.

### 3.3 `Tag` (`src/ui/Tag.tsx`, 새)

```ts
type TagProps = { label: string | number; tone?: 'neutral' | 'accent' | 'unread' }; // 기본 neutral
```

- 공통: `type.caption`, `radius.pill`, 가로 패딩 `space.sm`, 세로 `space.xxs`. 눌리지 않는다(`Pressable` 아님).
- `neutral`: 바탕 `cardMuted`, 글자 `subtle`. `accent`: 바탕 `accentSoft`, 글자 `accentText`(지금 `ChatTimeline` 태그와 같은 값). `unread`: 바탕 `colors.unread`, 글자 `onAccent`, 최소 폭 20, 가운데 정렬.
- 숫자는 `String(label)`로 그대로 보인다(99+ 줄임 없음).
- 4a에서 쓰는 곳: `ChatTimeline.tsx:126`. 숫자 배지(`LiveClassListPanel`, `RecordsCalendar`)는 4b, 개념 태그(`ConceptLookupPanel`)는 단계 5.

### 3.4 `Sheet` 키보드 피하기 (`src/ui/Sheet.tsx`, 바뀜)

- 카드 둘레를 `KeyboardAvoidingView`(iOS `padding`, Android `height`)로 감싼다. scrim은 그 밖에 둔다. `Dialog`는 자동으로 따라온다.
- `03-tokens-components.md` §3.4의 "키보드는 아직 피하지 않는다" 줄을 고친다.

### 3.5 `IconButton`·`Tag`는 드리프트 가드 대상

`__tests__/uiDrift.test.ts`의 `FILES`에 `src/ui/IconButton.tsx`, `src/ui/Tag.tsx`를 더한다.

## 4. 4a 대상 (파일별)

| 파일 | 바뀌는 것 | 인벤토리 근거 |
|---|---|---|
| `src/agent/tablet/ChatRail.tsx` | rail 바탕 `colors.card` + `opacity`가 아니라 **바탕색만** 반투명: `layout.railOpacity`로 만든 rgba(카드 흰색). 아이콘·그림자는 불투명. dock 항목(`:120`) → `IconButton md`(`selected`, `disabled`, hint 그대로). 채팅 항목(`:133`)은 예외 유지(브랜드 Study Log 아이콘과 읽지 않음 점) | §1 `ChatRail:120`, `:133`, Gate B Q3 |
| `src/agent/InstructionCard.tsx` | 첫 선택지 → `Button primary md`, 나머지 선택지와 "확인" → `Button secondary md` | §1 `:26`, `:35` |
| `src/agent/tablet/ChatTimeline.tsx` | "일간 정리" 등 태그(`:126`) → `Tag tone="accent"` | §2 |
| `src/host/Stage.tsx` | 책갈피/문제 목록 전환(`:25`) → `IconButton md`, 라벨 그대로 | §1 `Stage:25` |
| `src/kit/canvas/CanvasChrome.tsx` | 전체 지우기 확인 모달 → `Dialog`(제목 "전체 지우기", 설명 그대로, `cancel={{}}`, `confirm={{ title: '확인', variant: 'danger' }}`). 직접 그림자·`maxWidth: 380` 제거. 개념 시트 → `snapPoints` 2단계, `index` 1(넓게)로 연다, `bottomInset` | §1 `:113`, §1.1 `:118`, `:124`, Gate B Q4 |
| `src/kit/canvas/FloatingToolbar.tsx` | 캔버스 시트가 쓸 상수 `CANVAS_SHEET_SNAPS = ['50%', '70%']`를 export한다. 툴바 자체는 바뀌지 않는다 | Gate B Q4 |
| `app/notebook.tsx` | 문제 목록 모달: "교체" → `Button secondary sm`, "책갈피"/"책갈피됨" → `Button secondary sm`(됨이면 `disabled`, 제목은 그대로), "해답"/"문제" → `Chip`(`selected` = 해답을 보는 중, 라벨 그대로), "닫기" → `Button secondary sm`. 해답·내 풀이 시트 → 2단계 snap, `index` 0(보기), `bottomInset`, 내용 높이는 시트를 채운다(`height / 2 - 64` 등 고정값 제거). `'#FFF'`·`'#000'`·`rgba(0,0,0,0.5)` → 토큰 | §1.1 `:214`, `:216`, `:223`, `:236`, §4 |
| `app/hotline-class.tsx`, `app/topic-live-class.tsx` | 해답 시트 → 2단계 snap, `index` 0, `bottomInset`. 토스트 글자(`fontSize` 14 bold, `'white'`) → `type.bodyStrong` + `colors.onAccent`, 12 → `type.caption`, `'#FFF'` → `colors.card` | §3, §4 |
| `src/kit/canvas/note-canvas/hotline-class-canvas.tsx`, `topic-live-canvas.tsx` | 선생님 메모 닫기 ✕(`:705`, `:684`) → `IconButton sm`(`icon="close"`, 라벨 "메모 닫기"). 펜 색 견본의 보이는 글자 → 한국어 라벨(값은 그대로). 메모 `MathJaxWrapper color="#ea580c"`는 WebView 문자열이라 그대로(§4.4) | §1 `:705`, `:684`, §1.1 펜 색 견본, Gate B Q6 |
| `src/kit/canvas/note-canvas/notebook.tsx` | 펜 색 견본의 보이는 글자 → 한국어 라벨 | §1.1 `:104`, Gate B Q6 |
| `src/kit/live-class/QuizResponseModal.tsx` | 닫기 ✕(`:235`) → `IconButton sm`(라벨 "퀴즈 닫기"), 필기 지우기(`:273`) → `Button secondary md`, 답 보내기(`:280`) → `Button primary md`(보내는 동안 `loading`, "보내는 중..." 문구 대신 스피너). 글자 크기·색 → 인벤토리 §3·§4의 대응 토큰 | §1 `:235`, `:273`, `:280`, §3, §4 |
| `src/host/SheetHost.tsx` | §5 | §1 `SheetHost:33`, Gate B Q5 |
| `src/kit/study-note/StudyNoteForm.tsx` | 파일 내부 `Chip` 3곳(`:42`) → 공용 `Chip`, "다음 목표" 펼치기(`:183`) → `Button text sm`, "나중에"(`:208`) → `Button text md`, 저장(`:211`) → `Button primary md`(비활성 조건 그대로). `TextInput` → gorhom `BottomSheetTextInput`(값·이벤트·검사 그대로) | §1 `:42`, `:183`, `:208`, `:211` |

규칙:

- 위 표의 버튼 라벨·접근성 라벨·동작은 바꾸지 않는다. `GoButton`의 `size="small"`은 `sm`, filled/outline은 인벤토리가 정한 variant다.
- 펜 색 라벨의 원천은 `docs/ui-redesign/02-roles.json`의 `names`다. 코드에는 저장값 → 표시 라벨 표(`src/kit/canvas/note-canvas/canvas-utils.ts`에 `INK_LABELS`)를 하나 두고 세 캔버스가 같이 쓴다. 저장·동기화·MMKV에 넘기는 값은 여전히 저장값이다.
- 펜 굵기 견본, `FloatingToolbar`의 도구 버튼, `PencilFab`, `EdgeHandle`, `SheetHandle`은 예외 그대로다.
- 이모지가 그려지는 셸 컨트롤은 `PlaybackToolbar`(단계 5)뿐이라 4a에서 다루지 않는다.
- `app/hotline-class.tsx`, `app/topic-live-class.tsx`의 문제 목록 모달에는 눌리는 요소가 배경 닫기 영역뿐이다(인벤토리 예외 `:187`, `:194`). 옮길 버튼이 없다.

## 5. 학습장 시트 (`SheetHost`)

- `Modal` + scrim + `KeyboardAvoidingView`를 `BottomSheetModal`(이미 `app/_layout.tsx`에 `BottomSheetModalProvider`가 있다)로 바꾼다. `backdropComponent`를 주지 않는다(backdrop 없음).
- 크기: `enableDynamicSizing`(내용 높이), `maxDynamicContentSize` = 화면 높이의 90%(지금 `maxHeight: '90%'`와 같다). 손잡이 `SheetHandle`.
- 키보드: `keyboardBehavior="interactive"`, `keyboardBlurBehavior="restore"`, `android_keyboardInputMode="adjustResize"`.
- 폭: tablet이면 최대 560(`TABLET_CARD_MAX_W`) 가운데. phone은 전체 폭.
- 열고 닫기: `state.sheet`가 생기면 `present()`, 없어지면 `dismiss()`. 같은 시트의 props만 바뀌면 다시 열지 않는다(위젯의 `key={taskId}`가 내용을 바꾼다).
- 끌어 내려 닫기·Android 뒤로 가기: `onDismiss`에서 `dismissRef.current?.()`를 부른다. 위젯이 이미 `saved`로 끝냈으면 `finish`의 `finishedFor` 검사가 두 번째 이벤트를 막는다(지금 동작 그대로). 세션이 `closeSheet()`로 닫아 `dismiss()`가 부른 `onDismiss`도 같은 검사로 이벤트를 다시 내지 않는다.
- 접근성: scrim의 "닫기" 버튼이 없어지므로, 닫기는 `StudyNoteForm`의 "나중에" 버튼과 끌어 내리기로 한다. "나중에"는 이미 있다.
- reduce motion: gorhom의 `animateOnMount`를 reduce motion일 때 끈다(지금 `animationType` fade/slide 분기의 대응).
- 프로토콜(`study_note_saved`, `study_note_dismissed`, `closeSheet`)과 `sheetWidgets`는 바꾸지 않는다.

## 6. 캔버스 시트 2단계

- 해답·내 풀이·개념 검색 시트 모두 `snapPoints={CANVAS_SHEET_SNAPS}`(`['50%', '70%']`, Gate C §4의 `보기`·`넓게`). 해답·내 풀이는 `index={0}`(보기)으로, 개념 검색은 `index={1}`(넓게, 지금과 같음)으로 연다. 사용자는 손잡이를 끌어 두 단계를 오간다.
- `bottomInset = layout.toolbarH + insets.bottom`(`useSafeAreaInsets`). 시트 아래 끝이 툴바 위 끝에서 멈춘다(Gate B 설계 Q2). `FloatingToolbar`가 `bottom: insets.bottom`에 놓이는 것과 같은 기준이다.
- 시트 안 내용은 고정 높이(`height / 2 - 64`, `height / 2 - 108`) 대신 `flex: 1`로 채운다. 내 풀이 가로 목록의 카드 폭 계산(`width / 3 - 18`)은 그대로다.
- `enableContentPanningGesture={false}`(개념 시트에 이미 있음)를 해답·내 풀이에도 둔다. WebView·가로 목록 스크롤이 시트 끌기와 다투지 않게 하려는 것이다.

## 7. 오류·상태

- 새 부품에는 비동기 상태가 없다(`Button`의 기존 loading 제외). 답 보내기의 `loading`은 `QuizResponseModal`이 이미 가진 보내는 중 상태를 넘긴다.
- 학습장 저장 실패 처리, 퀴즈 전송 실패 처리는 지금 코드 그대로다. 4a가 바꾸는 문구는 하나다: 답 보내기의 "보내는 중..." 글자가 `Button`의 loading 스피너로 바뀐다(접근성 상태 `busy`가 같은 뜻을 전한다).

## 8. 테스트

TDD: 모든 새 동작은 실패하는 테스트를 먼저 쓴다.

- `__tests__/uiIconButton.test.tsx`: md/sm 최소 크기, sm hitSlop, selected·disabled의 `accessibilityState`, disabled면 `onPress`가 안 불림, `accessibilityLabel` 필수(타입 `@ts-expect-error`).
- `__tests__/uiTag.test.tsx`: 세 톤의 바탕·글자 토큰, 숫자 라벨, 눌리는 role이 없음.
- `__tests__/uiButton.test.tsx`(더함): `text`·`secondary` + `danger`의 글자·테두리·누름 색, `primary` + `tone`은 타입 오류(`@ts-expect-error`).
- `__tests__/uiDialog.test.tsx`(더함): 카드가 `KeyboardAvoidingView` 안에 있다.
- `__tests__/uiTokens.test.ts`(더함): `colors.dangerSoft === palette.danger[50]`.
- `__tests__/sheetHost.test.tsx`(다시 씀): 지금 테스트는 scrim "닫기"와 `onRequestClose`를 확인한다. 그 동작은 Gate B Q5로 일부러 없앤다. 새 확인: `state.sheet`가 생기면 `present`, 끌어 내린 `onDismiss`가 `study_note_dismissed`를 한 번 낸다, 저장은 `study_note_saved`를 한 번 내고 뒤따르는 `onDismiss`가 이벤트를 다시 내지 않는다, scrim·"닫기" 버튼이 없다, backdrop prop이 없다. gorhom은 children을 그리고 `present`·`dismiss`·`onDismiss`를 잡는 mock으로 바꾼다(지금 캔버스 테스트의 `() => null` mock은 내용을 그리지 않는다).
- `__tests__/canvasChromeClearModal.test.tsx`(고침): `Dialog`의 제목·버튼 라벨로 찾는다. 확인 → `onSelectTool('clearBoard')`, 취소·scrim → 지우지 않음.
- `__tests__/notebookSheetModal.test.tsx`(고침·더함): 해답·내 풀이 시트의 `snapPoints`·`index`·`bottomInset`, 목록 모달의 `Button`·`Chip` 라벨과 책갈피됨 `disabled`.
- 펜 색 라벨: `INK_LABELS`가 다섯 저장값을 모두 덮고, 견본을 눌렀을 때 넘기는 값이 저장값이다.
- 회귀: `npx jest` 전체가 기준과 같다(§1 성공 기준 7). `npm run typecheck`. `node docs/ui-redesign/tools/check-inventory.mjs docs/ui-redesign/03-components-inventory.md .`

## 9. 캡처

- `docs/ui-redesign/04-pilot/shot-list.md`: 찍을 화면, 준비할 상태, 파일 이름. 이름 규칙은 개선 스펙 §6의 `docs/ui-redesign/captures/04/ipad-<screen>-before|after.png`. 시뮬레이터는 `sim-ipad-…`.
- 목록에 넣는 화면: rail이 Stage 위에 있는 채팅 화면, 에이전트 지시 카드, 캔버스(툴바), 전체 지우기 확인, 해답 시트 보기·넓게, 내 풀이 시트, 개념 검색 시트, 문제 목록 모달, 선생님 메모 토스트, 퀴즈 모달, 학습장 시트(키보드 열림 포함), 펜 색 팝오버.
- 순서: 계획의 첫 작업이 shot-list를 쓰고 사용자에게 "전" 캡처를 요청한다. 화면 파일을 바꾸는 작업은 "전" 캡처가 들어왔거나 사용자가 건너뛰라고 한 뒤에 시작한다. 새 부품 작업(§3)은 화면을 바꾸지 않으므로 그 전에 해도 된다.
- 개인정보가 보이는 캡처는 커밋하지 않는다. 데이터가 필요한 화면은 사용자가 테스트 계정으로 로그인한다. Claude는 계정 정보를 입력하지 않는다.

## 10. 커밋

작게, 하나씩 되돌릴 수 있게: (1) shot-list, (2) `dangerSoft` + `Button` 위험 톤, (3) `IconButton`, (4) `Tag`, (5) `Sheet` 키보드, (6) rail·에이전트(`ChatRail`, `InstructionCard`, `ChatTimeline`, `Stage`), (7) 캔버스 시트 2단계, (8) 캔버스 모달·라벨(`CanvasChrome` Dialog, 목록 모달, 메모 ✕, 토스트, 펜 색 라벨), (9) 퀴즈 모달, (10) 학습장 시트(`SheetHost`, `StudyNoteForm`), (11) 인벤토리·문서·4a 노트. push·PR·병합은 사용자가 지시할 때만.

## 11. 끝

- `docs/ui-redesign/04-pilot/4a-notes.md`: 바뀐 것(파일·커밋), 테스트 결과, 남은 것(D-02는 부분 해결로 열림, 4b 범위), 사용자에게 요청하는 실 iPad "후" 캡처.
- 전체 브랜치를 새 리뷰어 한 명이 본다. 그 뒤 사용자가 "후" 캡처를 찍는다.
- 가이드(`docs/ui-redesign/1794280544402-contituous-guide.md`)의 단계 표: 4 → `진행`(4a 완료, 4b 미착수). Gate D는 4b 뒤.

## 12. 지키는 제약

- `app/`·`src/`는 시각·스타일·공용 컴포넌트만 바꾼다. 로직·프로토콜·저장·권한·라우트 의미는 바꾸지 않는다.
- Pretendard 유지, `react-native-paper` 재도입 금지, dark mode 금지, 새 스타일 체계 금지, 의존성 추가 없음.
- Tablet 판정, 6칸 기능, Landscape 제한 목록, 잉크 색 저장값, MMKV 값은 그대로다.
- 새 값은 `colors.dangerSoft` 하나(1안+근거, §3.2). 나머지는 Gate C가 받은 토큰이다.
- 단계 상태 낱말은 `미착수 | 진행 | 승인대기 | 완료 | blocked`만 쓴다.
