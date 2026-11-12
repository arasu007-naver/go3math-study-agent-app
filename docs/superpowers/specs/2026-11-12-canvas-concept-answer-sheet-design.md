# 캔버스 개념·해답 통합 시트 설계

- 날짜: 2026-11-12
- 브랜치: `design/ui-redesign-stage4`
- 상태: 승인대기 (사용자 스펙 검토 전)
- 성격: 단계 4의 "모양만 바꾼다" 규칙 밖의 동작 변경. D2–D4처럼 사용자가 정한 예외다.

## 1. 목적

캔버스 툴바에 따로 있던 '해답'(또는 '답안 예시')과 '개념' 버튼을 하나로 합치고, 한 bottom sheet 안에서 탭으로 오가게 한다. 개념 설명은 모달이 아니라 시트 안 WebView에 바로 보여준다.

사용자 결정(대화 기록):

| 질문 | 결정 |
|---|---|
| 1안(좌우 50% 분할) vs 2안(상단 탭) | 2안, 상단 '개념'·'해답' 탭 |
| 개념 설명 표시 | 모달이 아니라 칩 아래 WebView (1·2안 공통 규칙) |
| 시트를 열 때 탭 | 마지막에 쓴 탭, 처음엔 해답 |
| 적용 화면 | 캔버스 세 화면 모두 |
| 툴바 버튼 이름 | 세 화면 모두 '개념·해답' |

2안을 고른 이유: 해답 페이지는 수식 줄이 넓어(태블릿에서 한 줄 약 1100px) 반폭이면 줄바꿈되거나 작아진다. 개념 쪽은 칩 세 줄과 설명이 들어가야 해 50–70% 높이의 반폭으론 모자란다. 탭은 이미 dock에서 쓰는 공용 `Chip`(role=tab) 패턴이다.

## 2. 적용 범위

| 화면 | 지금 버튼 | 지금 시트 내용 | 바뀐 뒤 해답 탭 이름 |
|---|---|---|---|
| `app/notebook.tsx` | 해답 | 해답 WebView | 해답 |
| `app/hotline-class.tsx` | 답안 예시 | 문제 이미지 + 해답 WebView 좌우 | 답안 예시 |
| `app/topic-live-class.tsx` | 답안 예시 | 해답 WebView | 답안 예시 |

`src/kit/canvas/note-canvas/topic-notebook.tsx`는 어느 라우트에도 연결되지 않아 범위 밖이다. `CanvasChrome`의 개념 버튼이 빠지면 이 컴포넌트에서도 빠지지만 화면에 나타나지 않으므로 영향이 없다.

## 3. 설계

### 3.1 툴바

- 각 화면의 `canvasAction('answer', …)`를 `canvasAction('study', '개념·해답', 'book-outline', open)` 하나로 바꾼다. 자리는 기존 해답 버튼 자리(notebook: 목록과 내 풀이 사이, 라이브 수업: 화면 버튼 끝).
- `CanvasChrome`은 개념 버튼(`conceptSearch`)과 개념 `BottomSheetModal`을 더 이상 만들지 않는다. `ConceptLookupPanel` import도 빠진다. 툴바에는 화면이 넘긴 `actions`만 들어간다.

### 3.2 공용 시트 `CanvasStudySheet` (`src/kit/canvas/CanvasStudySheet.tsx`, 신규)

- props: `ref`(BottomSheetModal ref를 그대로 넘김), `answerLabel: string`, `answer: ReactNode`.
- 화면은 열 때 `ref.current?.present()`를 부른다. 지금의 해답 시트 ref를 그대로 쓴다.
- 시트 맨 위 줄: 공용 `Chip` 두 개 `[개념] [answerLabel]`, `accessibilityRole="tab"`, 선택 상태를 `selected`로 보고한다. 순서는 개념이 왼쪽.
- 활성 탭 state는 이 컴포넌트 안의 `useState`로 둔다. 초기값 `'answer'`. 시트를 닫았다 다시 열어도 컴포넌트가 화면에 남아 있으므로 마지막 탭이 유지된다. 저장소(MMKV 등)에는 쓰지 않는다. 화면을 떠나면 초기화된다.
- 여는 높이: `present()` 직후 활성 탭이 해답이면 index 0(50%), 개념이면 index 1(70%)로 연다. Gate B Q4(해답 시트 50%)와 기존 개념 시트(70%)를 그대로 따른다. 열린 뒤 탭을 바꿔도 높이는 바꾸지 않는다.
  - 구현: `BottomSheetModal`의 `index` prop을 활성 탭에서 계산해 넘긴다(`index={tab === 'concept' ? 1 : 0}`). `present()` 시점의 값이 쓰인다.
- 두 탭 내용은 시트가 열려 있는 동안 둘 다 마운트하고, 비활성 탭은 `display: 'none'`으로 숨긴다. 해답으로 돌아와도 WebView를 다시 불러오지 않고, 고른 개념도 남는다.
- 시트 설정은 지금 캔버스 시트와 같다: `snapPoints={CANVAS_SHEET_SNAPS}`, `bottomInset={useCanvasSheetBottomInset()}`, `enableDynamicSizing={false}`, `enableContentPanningGesture={false}`, `handleComponent={SheetHandle}`.
- 시트 본문은 `BottomSheetView`가 아니라 `flex: 1`인 `View`다(b029a03, BottomSheetView는 내용 높이만큼만 커져 높이 없는 WebView가 0이 된다).

### 3.3 각 화면

- notebook: 해답 `BottomSheetModal`과 그 안의 해답 WebView 블록을 `<CanvasStudySheet ref={bottomSheetModalRef} answerLabel="해답" answer={…기존 해답 내용…} />`으로 바꾼다. 내 풀이 시트는 그대로.
- hotline-class: 기존 `answerRow`(문제 이미지 pane + 해답 WebView pane) 블록을 그대로 `answer`로 넘긴다. `answerLabel="답안 예시"`.
- topic-live-class: 기존 해답 WebView 블록을 `answer`로 넘긴다. `answerLabel="답안 예시"`.
- 해답 URL(`UNITANSWER` 등), 로딩 처리(`pageLoadProgress` opacity), 데이터 흐름은 바꾸지 않는다.

### 3.4 개념 설명을 패널 안에 (`src/kit/concepts/ConceptLookupPanel.tsx`)

`ConceptLookupPanel`은 `CanvasChrome`에서만 쓰인다(dock은 쓰지 않는다). 그래서 패널을 직접 바꾼다.

- 개념 설명 `Modal`(현재 171–196행)과 그 스타일(backdrop, detailCard, detailHeader, detailFooter, confirmBtn 등)을 지운다. 닫기 버튼도 없어진다.
- 과목 칩 줄과 단원 칩 줄은 그대로.
- 구분선 아래 개념 영역을 위아래로 나눈다.
  - 위: 개념 칩 목록 `ScrollView`. 높이 상한은 개념 영역의 약 40%(`maxHeight: '40%'`).
  - 아래: 설명 영역, 남은 높이를 `flex: 1`로 채운다. `MathJaxWrapper iPath/titleStatement/statement fontSize={15} color="#1f2937" fullView`, 지금 모달과 같은 값.
- 아무 개념도 고르지 않았을 때 설명 영역 문구: "개념을 누르면 여기에 설명이 나옵니다." (`emptyText` 스타일).
- 다른 칩을 누르면 설명이 바뀐다. 고른 칩은 지금처럼 `chipOn`으로 강조한다.
- 섹션 라벨 "💡 개념 목록 (터치하여 설명 보기)"는 그대로 둔다.
- 색은 기존 주황 계열 그대로. 새 토큰을 만들지 않는다.
- 파일 머리 주석의 "누르면 개념 설명 모달", "검색 패널의 '개념' 탭으로 쓴다"는 현재 동작에 맞게 고친다.

## 4. 바꾸지 않는 것

- 해답이 없는 문제에서 빈 해답 시트가 열리는 문제(4a 이전부터).
- 개념 데이터 API와 fetcher.
- 내 풀이 시트, 목록 시트, 전체 지우기 확인, 펜 속성 팝오버.
- 의존성, Pretendard, 토큰, Ink·MMKV 값.

## 5. 테스트

자동 테스트(jest-expo, RNTL v14):

- `__tests__/canvasStudySheet.test.tsx` (신규)
  - 처음 열면 해답 탭이 선택되고 해답 내용이 보이며, 개념 내용은 숨겨져 있다.
  - 개념 탭을 누르면 개념 내용이 보이고 해답 내용은 숨겨지되 언마운트되지 않는다.
  - 탭 선택이 다시 렌더한 뒤에도 유지된다(마지막 탭).
  - 시트 `index`가 해답일 때 0, 개념일 때 1이다.
  - 스냅·inset·`enableDynamicSizing=false`·`enableContentPanningGesture=false`, 본문이 `BottomSheetView`가 아닌 `flex:1` View.
- `__tests__/conceptLookupPanel.test.tsx` (신규 또는 기존 파일 확장)
  - 개념 칩을 누르면 설명이 패널 안에 그려지고 `Modal`은 렌더되지 않는다.
  - 고르기 전에는 안내 문구가 보인다.
- `__tests__/notebookSheetModal.test.tsx` (수정)
  - 툴바에 '개념·해답'이 있고, 따로 된 '해답' 툴바 버튼과 '개념' 버튼이 없다. (목록 카드의 '해답' Chip 2개는 그대로라 기존 "해답 3개" 기대값을 2로 바꾼다.)
  - 해답 시트 관련 기존 기대(스냅, inset, flex View 본문)는 `CanvasStudySheet` 기준으로 옮긴다.
- `__tests__/canvasSheetSnaps.test.ts` (수정)
  - hotline·topic-live 소스에 `CanvasStudySheet`와 `answerLabel="답안 예시"`, `'개념·해답'`이 있고 `'답안 예시', 'eye-outline'` 툴바 버튼이 없다.
- `CanvasChrome` 관련 기존 테스트에서 개념 버튼·개념 시트 기대가 있으면 제거하고, 툴바에 화면 actions만 들어가는지 확인한다.

실기기(태블릿 HA1V33DF):

- notebook에서 개념·해답 버튼 → 해답 탭 50% → 개념 탭 → 칩 선택 → 설명이 패널 안에 → 해답 탭으로 돌아와 해답이 다시 불러오지 않고 보임 → 닫고 다시 열면 개념 탭 70%.
- hotline-class, topic-live-class는 라이브 수업이 있어야 열 수 있어 실기기 미확인으로 남긴다.

## 6. 위험

- `display: 'none'`으로 숨긴 해답 WebView가 Android에서 레이아웃 0이 되어 다시 보일 때 내용이 비어 보일 수 있다. 실기기 확인 항목에 넣었고, 그러면 숨김을 `opacity: 0` + `pointerEvents="none"` + absolute 겹침으로 바꾼다.
- `index` prop을 탭에 따라 바꾸는 방식이 gorhom 5.2.14에서 이미 열린 시트를 움직이지 않는지 확인이 필요하다. 움직이면 `present()` 직후 `snapToIndex`로 바꾼다.
