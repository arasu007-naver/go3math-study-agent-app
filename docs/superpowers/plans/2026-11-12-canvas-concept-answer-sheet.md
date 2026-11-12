# 캔버스 개념·해답 통합 시트 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 캔버스 세 화면의 '해답/답안 예시'와 '개념' 버튼을 '개념·해답' 하나로 합치고, 한 bottom sheet 안에서 탭으로 오가며, 개념 설명은 모달 없이 패널 안 WebView에 보여준다.

**Architecture:** 새 공용 컴포넌트 `CanvasStudySheet`가 탭 칩·개념 패널·해답 슬롯을 가진 시트를 그리고, 각 라우트는 기존 해답 시트 자리에 이것을 두고 자기 해답 내용을 넘긴다. `CanvasChrome`은 자체 개념 버튼과 개념 시트를 버린다. `ConceptLookupPanel`은 설명 `Modal`을 버리고 칩 아래 설명 영역을 갖는다.

**Tech Stack:** Expo SDK 54, RN 0.81, React 19.1, TypeScript, @gorhom/bottom-sheet 5.2.14, jest-expo + RNTL v14.

**Spec:** `docs/superpowers/specs/2026-11-12-canvas-concept-answer-sheet-design.md`

## Global Constraints

- 새 의존성 없음. Pretendard 유지. react-native-paper·다크 모드·새 스타일 시스템·새 토큰 없음. Ink·MMKV 값 변경 없음.
- 활성 탭은 컴포넌트 state로만 둔다. 저장소에 쓰지 않는다.
- 툴바 버튼: `canvasAction('study', '개념·해답', 'book-outline', open)`, 세 화면 모두.
- 탭 라벨: '개념' + notebook '해답' / hotline·topic-live '답안 예시'. 순서는 개념이 왼쪽.
- 초기 탭은 해답. 여는 높이: 해답 index 0(50%), 개념 index 1(70%).
- 시트 설정: `snapPoints={CANVAS_SHEET_SNAPS}`, `bottomInset={useCanvasSheetBottomInset()}`, `enableDynamicSizing={false}`, `enableContentPanningGesture={false}`, `handleComponent={SheetHandle}`, 본문은 `flex: 1`인 `View`(BottomSheetView 아님).
- 개념 설명: `MathJaxWrapper iPath titleStatement statement fontSize={15} color="#1f2937" fullView`. 빈 상태 문구: `개념을 누르면 여기에 설명이 나옵니다.`
- 해답 URL·로딩 처리·데이터 흐름 변경 없음. 내 풀이·목록 시트 변경 없음.
- Git: 워크트리에서 git 명령은 한 호출에 하나. 푸시·PR 없음. 개인정보 캡처와 `docs/ui-redesign/captures/04/`는 커밋하지 않는다.
- 커밋 메시지 끝: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`

## Review Focus

1. 개념을 고른 뒤 과목·단원을 바꾸면 이전 단원의 설명이 남지 않고 빈 상태 문구로 돌아가야 한다(모달 시절엔 모달이 떠 있는 동안 단원을 못 바꿨다). → Task 1 테스트.
2. 해답 탭으로 돌아왔을 때 해답 WebView가 다시 마운트되지 않아야 한다(다시 불러오면 로딩 화면이 또 뜬다). → Task 2 테스트.
3. 시트를 개념 탭에서 닫고 다시 열면 70%로, 해답 탭에서 닫으면 50%로 열려야 한다. → Task 2 테스트.
4. `answerUrl`이 없을 때(현재 문제 없음) 해답 탭이 비어도 시트·탭은 정상이어야 한다. 기존 동작 그대로, 라우트가 `answerUrl &&`를 유지한다.
5. 숨긴 해답 WebView가 Android에서 다시 보일 때 비는지, 열린 시트에서 탭을 바꿀 때 시트가 움직이는지(스펙 §6). → Task 6 실기기.

## Rulings (스펙 대비)

- 스펙 §3.2의 `ref` prop은 `sheetRef: RefObject<BottomSheetModal | null>`라는 일반 prop으로 받는다. forwardRef 없이 이름이 분명하다. 비용: 이름 하나.
- 스펙 §2·§3.3은 topic-live-class 시트를 "해답 WebView"라고 했지만 실제 코드는 hotline과 같은 `answerRow`(문제 이미지 + 해답) 좌우 배치다. 두 라이브 화면 모두 기존 `answerRow` 블록을 그대로 넘긴다. 비용: 없음(기존 내용 유지가 스펙 의도).

---

### Task 1: 개념 설명을 패널 안에 (`ConceptLookupPanel`)

**Files:**
- Modify: `src/kit/concepts/ConceptLookupPanel.tsx` (머리 주석 1–5행, 개념 영역 131–169행, 모달 171–196행, 스타일 237–243행)
- Create: `__tests__/conceptLookupPanel.test.tsx`

**Interfaces:**
- Consumes: 없음.
- Produces: `ConceptLookupPanel({ fetchers?: ConceptFetchers })` — 시그니처 변경 없음.

- [ ] **Step 1: Write the failing tests** in `__tests__/conceptLookupPanel.test.tsx`

Mock `../src/kit/math/MathJaxWrapper` as a `Text`: `testID="concept-detail"` and text `` `${p.titleStatement}|${p.statement}` `` when `p.fullView`, otherwise `testID="concept-chip-text"` and text `p.statement`. Fixture fetchers: subjects `[{ id: 1, title: '수학I' }]`; chapters `[{ id: 10, chapterName: '지수' }, { id: 11, chapterName: '로그' }]`; concepts for 10 → `[{ id: 100, rawTitle: '지수법칙', rawStatement: 'a^m a^n', imgPath: '' }]`, for 11 → `[{ id: 110, rawTitle: '로그 정의', rawStatement: 'log_a b', imgPath: '' }]`.

```tsx
it('shows the empty hint before a concept is picked', async () => {
  await render(<ConceptLookupPanel fetchers={fakeFetchers} />);
  await screen.findByText('지수법칙');
  expect(screen.getByText('개념을 누르면 여기에 설명이 나옵니다.')).toBeTruthy();
  expect(screen.queryByTestId('concept-detail')).toBeNull();
});

it('draws the picked concept inside the panel, with no Modal', async () => {
  await render(<ConceptLookupPanel fetchers={fakeFetchers} />);
  await fireEvent.press(await screen.findByText('지수법칙'));
  expect(screen.getByTestId('concept-detail').props.children).toBe('지수법칙|a^m a^n');
  expect(screen.UNSAFE_queryByType(Modal)).toBeNull();
  expect(screen.queryByText('닫기')).toBeNull();
});

it('clears the explanation when the chapter changes (review focus 1)', async () => {
  await render(<ConceptLookupPanel fetchers={fakeFetchers} />);
  await fireEvent.press(await screen.findByText('지수법칙'));
  await fireEvent.press(screen.getByText('로그'));
  await screen.findByText('로그 정의');
  expect(screen.queryByTestId('concept-detail')).toBeNull();
  expect(screen.getByText('개념을 누르면 여기에 설명이 나옵니다.')).toBeTruthy();
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx jest __tests__/conceptLookupPanel.test.tsx`
Expected: test 1 FAIL (no hint text), test 2 FAIL (detail is inside a Modal / 닫기 exists), test 3 FAIL.

- [ ] **Step 3: Implement in `ConceptLookupPanel.tsx`**

- Delete the `Modal` block and the styles `backdrop`, `detailCard`, `detailHeader`, `detailBadge`, `detailFooter`, `confirmBtn`, `confirmBtnText`; drop `Modal` from the import.
- Concept section: the chip `ScrollView` gets `style={styles.conceptList}` with `conceptList: { flexGrow: 0, maxHeight: '40%' }`; below it a `View style={styles.detail}` (`flex: 1`) that renders `MathJaxWrapper` with the Global Constraints values when `selected`, else `<Text style={styles.emptyText}>개념을 누르면 여기에 설명이 나옵니다.</Text>`.
- In the chapter-change effect (`chapterId`), add `setSelected(null)`.
- Header comment: replace "누르면 개념 설명 모달" with "누르면 칩 아래에 개념 설명", and "검색 패널의 '개념' 탭으로 쓴다" with "캔버스 개념·해답 시트의 '개념' 탭으로 쓴다".

- [ ] **Step 4: Run to verify they pass**

Run: `npx jest __tests__/conceptLookupPanel.test.tsx`
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add src/kit/concepts/ConceptLookupPanel.tsx __tests__/conceptLookupPanel.test.tsx
git commit -m "feat(ui): concept explanation shows under the chips instead of a modal"
```

---

### Task 2: 공용 시트 `CanvasStudySheet`

**Files:**
- Create: `src/kit/canvas/CanvasStudySheet.tsx`
- Create: `__tests__/canvasStudySheet.test.tsx`

**Interfaces:**
- Consumes: `ConceptLookupPanel` (Task 1), `Chip` from `src/ui/Chip`, `CANVAS_SHEET_SNAPS` and `useCanvasSheetBottomInset` from `./FloatingToolbar`, `SheetHandle` from `src/ui/SheetHandle`.
- Produces:
  ```ts
  export function CanvasStudySheet(props: {
    sheetRef: RefObject<BottomSheetModal | null>;
    answerLabel: string;   // '해답' | '답안 예시'
    answer: ReactNode;
  }): JSX.Element
  ```
  Tab chips have `accessibilityRole="tab"`, labels `개념` and `answerLabel`. Tab bodies carry `testID="study-tab-concept"` and `testID="study-tab-answer"`.

- [ ] **Step 1: Write the failing tests** in `__tests__/canvasStudySheet.test.tsx`

Mock `@gorhom/bottom-sheet` so `BottomSheetModal` pushes props to `mockSheetProps` and returns `p.children`; `BottomSheetView` returns children. Mock `../src/kit/concepts/ConceptLookupPanel` → `{ ConceptLookupPanel: () => <Text>concept-panel</Text> }`. Mock safe-area insets `bottom: 20` as in `notebookSheetModal.test.tsx`. Answer content: a component that increments a module-level `mountCount` in `useEffect(() => { mountCount++ }, [])` and renders `<Text>answer-body</Text>`.

```tsx
beforeEach(() => { mountCount = 0; });
const last = () => mockSheetProps[mockSheetProps.length - 1];
const hidden = (id: string) => StyleSheet.flatten(screen.getByTestId(id).props.style).display === 'none';
const ui = () => <CanvasStudySheet sheetRef={createRef()} answerLabel="해답" answer={<Answer />} />;

it('starts on the answer tab at 50%', async () => {
  await render(ui());
  expect(screen.getByRole('tab', { name: '해답' }).props.accessibilityState).toMatchObject({ selected: true });
  expect(hidden('study-tab-answer')).toBe(false);
  expect(hidden('study-tab-concept')).toBe(true);
  expect(last().index).toBe(0);
});

it('switching to 개념 hides the answer without unmounting it and opens next time at 70%', async () => {
  await render(ui());
  await fireEvent.press(screen.getByRole('tab', { name: '개념' }));
  expect(hidden('study-tab-concept')).toBe(false);
  expect(hidden('study-tab-answer')).toBe(true);
  expect(last().index).toBe(1);
  await fireEvent.press(screen.getByRole('tab', { name: '해답' }));
  expect(screen.getByText('answer-body')).toBeTruthy();
  expect(mountCount).toBe(1);
});

it('keeps the last tab across re-renders', async () => {
  const { rerender } = await render(ui());
  await fireEvent.press(screen.getByRole('tab', { name: '개념' }));
  await rerender(ui());
  expect(screen.getByRole('tab', { name: '개념' }).props.accessibilityState).toMatchObject({ selected: true });
});

it('uses the canvas sheet settings and a flex View body', async () => {
  const { BottomSheetView } = require('@gorhom/bottom-sheet');
  await render(ui());
  const p = last();
  expect(p.snapPoints).toEqual(['50%', '70%']);
  expect(p.bottomInset).toBe(layout.toolbarH + 20);
  expect(p.enableDynamicSizing).toBe(false);
  expect(p.enableContentPanningGesture).toBe(false);
  expect(p.children.type).not.toBe(BottomSheetView);
  expect(StyleSheet.flatten(p.children.props.style).flex).toBe(1);
});

it('labels the answer tab with answerLabel', async () => {
  await render(<CanvasStudySheet sheetRef={createRef()} answerLabel="답안 예시" answer={null} />);
  expect(screen.getByRole('tab', { name: '답안 예시' })).toBeTruthy();
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx jest __tests__/canvasStudySheet.test.tsx`
Expected: FAIL — cannot find module `../src/kit/canvas/CanvasStudySheet`.

- [ ] **Step 3: Implement `CanvasStudySheet` in `src/kit/canvas/CanvasStudySheet.tsx`**

`const [tab, setTab] = useState<'concept' | 'answer'>('answer')`; `index={tab === 'concept' ? 1 : 0}`; body `View style={{ flex: 1 }}` → tab row (`flexDirection: 'row'`, `gap: space.sm`, `paddingHorizontal: space.md`, `paddingBottom: space.sm`; chips as in `DiaryPanel.tsx:110`) → two `View`s with `flex: 1`, the inactive one adding `display: 'none'`. One-line header comment pointing to the spec.

- [ ] **Step 4: Run to verify they pass**

Run: `npx jest __tests__/canvasStudySheet.test.tsx`
Expected: 5 passed.

- [ ] **Step 5: Commit**

```bash
git add src/kit/canvas/CanvasStudySheet.tsx __tests__/canvasStudySheet.test.tsx
git commit -m "feat(ui): CanvasStudySheet with 개념 and 해답 tabs in one canvas sheet"
```

---

### Task 3: notebook 화면

**Files:**
- Modify: `app/notebook.tsx:250` (toolbar action), `app/notebook.tsx:254-281` (answer sheet); imports at line 4 and 13 if they become unused
- Modify: `__tests__/notebookSheetModal.test.tsx:114-116, 215-235`

**Interfaces:**
- Consumes: `CanvasStudySheet({ sheetRef, answerLabel, answer })` (Task 2).
- Produces: nothing new.

- [ ] **Step 1: Update the tests first**

- Line 114–116: comment becomes `// 2 in problem list cards; the toolbar button is now 개념·해답`, expectation `toBe(2)`.
- New test in the `canvas sheets (Gate B Q4)` describe:
  ```tsx
  it('toolbar has one 개념·해답 button and no separate 해답 or 개념 button', async () => {
    await render(<NotebookScreen />);
    expect(screen.getByText('개념·해답')).toBeTruthy();
    expect(screen.queryByText('해답')).toBeNull();
    expect(screen.queryByText('개념')).toBeNull();
  });
  ```
- The two existing sheet tests stay as they are: `lastSheets(2)` is now `[CanvasStudySheet's modal, workouts modal]` and both still hold.

- [ ] **Step 2: Run to verify the new test fails**

Run: `npx jest __tests__/notebookSheetModal.test.tsx`
Expected: the new test and the `toBe(2)` test FAIL (toolbar still shows 해답).

- [ ] **Step 3: Implement**

- Line 250 → `canvasAction('study', '개념·해답', 'book-outline', handlePresentModalPress)`.
- Replace the answer `BottomSheetModal … </BottomSheetModal>` block with `<CanvasStudySheet sheetRef={sheetRef} answerLabel="해답" answer={…the existing <View style={styles.bottomContainerStyle}> block, unchanged…} />`.
- Leave the workouts sheet alone. Remove imports only if unused after the change (`BottomSheetModal` is still used by the workouts sheet and the ref type).

- [ ] **Step 4: Run to verify they pass**

Run: `npx jest __tests__/notebookSheetModal.test.tsx`
Expected: 9 passed.

- [ ] **Step 5: Commit**

```bash
git add app/notebook.tsx __tests__/notebookSheetModal.test.tsx
git commit -m "feat(ui): notebook canvas opens 개념·해답 sheet from one toolbar button"
```

---

### Task 4: 라이브 수업 두 화면

**Files:**
- Modify: `app/hotline-class.tsx:180` (action), `:230-260` (sheet), imports
- Modify: `app/topic-live-class.tsx:187` (action), `:238-268` (sheet), imports
- Modify: `__tests__/canvasSheetSnaps.test.ts:13-23`

**Interfaces:**
- Consumes: `CanvasStudySheet` (Task 2).
- Produces: nothing new.

- [ ] **Step 1: Rewrite the source test** for both routes (these routes have no render test):

```ts
test.each(['app/hotline-class.tsx', 'app/topic-live-class.tsx'])('%s opens the merged 개념·해답 sheet', (f) => {
  const src = read(f);
  expect(src).toMatch(/canvasAction\('study', '개념·해답', 'book-outline'/);
  expect(src).not.toMatch(/'eye-outline'/);
  expect(src).toMatch(/<CanvasStudySheet[\s\S]*sheetRef=\{sheetRef\}[\s\S]*answerLabel="답안 예시"/);
  expect(src).not.toMatch(/<BottomSheetModal/);
  expect(src).toMatch(/styles\.answerRow/);
});
```

Sheet snap/inset/body rules are now pinned once in `canvasStudySheet.test.tsx` (Task 2); keep the `CANVAS_SHEET_SNAPS` value test at line 9–11.

- [ ] **Step 2: Run to verify it fails**

Run: `npx jest __tests__/canvasSheetSnaps.test.ts`
Expected: 2 FAIL (routes still use `'eye-outline'` and `<BottomSheetModal`).

- [ ] **Step 3: Implement in both routes**

- Action → `canvasAction('study', '개념·해답', 'book-outline', () => sheetRef.current?.present())`.
- Replace the `BottomSheetModal` block with `<CanvasStudySheet sheetRef={sheetRef} answerLabel="답안 예시" answer={…the existing <View style={styles.answerRow}> block, unchanged…} />`.
- Imports: keep `BottomSheetModal` as a type import for `useRef<BottomSheetModal>` (`import type { BottomSheetModal } from '@gorhom/bottom-sheet'`); drop `CANVAS_SHEET_SNAPS`, `useCanvasSheetBottomInset`, `SheetHandle`, `sheetBottomInset` and `styles.sheetBody` if they become unused.

- [ ] **Step 4: Run to verify it passes, and type-check**

Run: `npx jest __tests__/canvasSheetSnaps.test.ts`
Expected: 3 passed.
Run: `npx tsc --noEmit`
Expected: no new errors in the two route files (compare against the error count before the change if the baseline is not clean).

- [ ] **Step 5: Commit**

```bash
git add app/hotline-class.tsx app/topic-live-class.tsx __tests__/canvasSheetSnaps.test.ts
git commit -m "feat(ui): live class canvases open 개념·답안 예시 in one sheet"
```

---

### Task 5: `CanvasChrome`에서 개념 버튼·시트 제거

**Files:**
- Modify: `src/kit/canvas/CanvasChrome.tsx:1, 8, 59-65, 82-84, 104, 121-141`
- Modify: `__tests__/canvasChromeClearModal.test.tsx:192-200`

**Interfaces:**
- Consumes: nothing.
- Produces: `CanvasChrome` props unchanged; the toolbar receives exactly `actions ?? []`.

- [ ] **Step 1: Replace the `concept sheet (Gate B Q4)` describe** with:

```tsx
describe('CanvasChrome - no own concept button or sheet (개념·해답 merge)', () => {
  it('passes only the screen actions to the toolbar and renders no sheet', async () => {
    mockSheetProps.length = 0;
    await render(
      <CanvasChrome actions={[canvasAction('list', '목록', 'albums-outline', () => {})]} tools={[canvasTool('save', '저장')]} onSelectTool={() => {}} />
    );
    expect(screen.getByText('목록')).toBeTruthy();
    expect(screen.queryByText('개념')).toBeNull();
    expect(mockSheetProps).toHaveLength(0);
  });
});
```

(Import `canvasAction` alongside `canvasTool`; remove the now-unused `lastSheets` and `layout` import.)

- [ ] **Step 2: Run to verify it fails**

Run: `npx jest __tests__/canvasChromeClearModal.test.tsx`
Expected: the new test FAILS (개념 present, one sheet rendered); the other 6 pass.

- [ ] **Step 3: Implement**

Remove the `BottomSheetModal`/`BottomSheetView` import, the `ConceptLookupPanel` import, `CANVAS_SHEET_SNAPS` and `useCanvasSheetBottomInset` from the FloatingToolbar import, `conceptSheet`, `sheetBottomInset`, `search`, the sheet JSX, the `styles` object, the line-59 comment, and the doc-comment sentence about the search button. `actions={actions ?? []}`.

- [ ] **Step 4: Run the whole suite and type-check**

Run: `npx jest`
Expected: all suites pass (note `floatingToolbar.test.tsx` builds its own `개념` action and stays valid).
Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 5: Commit**

```bash
git add src/kit/canvas/CanvasChrome.tsx __tests__/canvasChromeClearModal.test.tsx
git commit -m "refactor(ui): CanvasChrome drops its own concept button and sheet"
```

---

### Task 6: 태블릿 확인과 기록

**Files:**
- Modify: `docs/ui-redesign/04-pilot/4b-notes.md` (append a section `## 개념·해답 통합 시트 (2026-11-12)`)

- [ ] **Step 1: Reload the dev client on HA1V33DF** (Metro already running on 8081) and open a notebook canvas (user logs in; Claude does not type credentials).

- [ ] **Step 2: Walk the spec §5 device path** with `node <scratchpad>/ui.mjs`: 개념·해답 → 해답 tab at 50% with the answer visible → 개념 tab → pick a chip → explanation in the panel → change unit → hint returns → back to 해답, answer still visible without the loader → close → reopen opens on 개념 at 70%. Screenshot each to the scratchpad (not committed).

Expected: every step as written. If the answer is blank after returning (spec §6 risk 1), switch the inactive tab from `display: 'none'` to `StyleSheet.absoluteFill` + `opacity: 0` + `pointerEvents="none"`, update the Task 2 `hidden` helper to check `opacity === 0`, and re-run. If the open sheet moves when switching tabs (risk 2), compute the open index into a ref read by an `onPresent` wrapper calling `snapToIndex` instead of the `index` prop, and update the Task 2 index test. Ledger either change as a ruling.

- [ ] **Step 3: Record results** in the notes section: what was checked on the device, which risk (if any) fired and the fix, and "hotline-class·topic-live-class: 실기기 미확인 (라이브 수업 필요)".

- [ ] **Step 4: Commit**

```bash
git add docs/ui-redesign/04-pilot/4b-notes.md
git commit -m "docs(ui-redesign): 개념·해답 sheet device check notes"
```
