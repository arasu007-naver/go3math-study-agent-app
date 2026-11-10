# UI Redesign Stage 4a — Learning-Screen Shell Pilot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `IconButton`, `Tag`, a danger tone on `Button` and keyboard avoidance in `Sheet`, then move the learning-screen shell (chat rail, agent card, Stage, canvas sheets and modals, quiz modal, study-note sheet) onto the shared components and Gate B sheet rules without changing behavior.

**Architecture:** New parts live in `src/ui/` and read only `theme.ts`. Screens swap their local pressables for `Button`/`Chip`/`IconButton`/`Tag`/`Dialog`. Canvas sheets share one exported snap constant and a `bottomInset` that stops above `FloatingToolbar`. `SheetHost` moves from RN `Modal` + scrim to a backdrop-less gorhom `BottomSheetModal`, keeping the widget's `dismissRef` / `finishedFor` event guard.

**Tech Stack:** Expo SDK 54, RN 0.81, TypeScript, jest-expo + RNTL v14 (async `render`/`fireEvent`), `@gorhom/bottom-sheet` ^5.2.14, `@expo/vector-icons` Ionicons, `react-native-safe-area-context`.

**Spec:** `docs/superpowers/specs/2026-11-10-ui-redesign-stage4a-design.md` (Korean; binding authority)

## Global Constraints

- Branch `design/ui-redesign-stage4` in worktree `.claude/worktrees/ui-redesign-stage4`, base `8c0bce1`. No push, PR, merge or deploy unless the user says so. Do not touch `d0a5d1c`. Never touch the main checkout (its uncommitted `PRODUCT.md` and the other session's files stay out). Never bare `git stash`.
- `git diff --stat 8c0bce1 -- app src package.json` may list only files in spec §4 table plus `src/ui/{Button,Sheet,IconButton,Tag,theme}.tsx|ts` and `src/kit/canvas/note-canvas/canvas-utils.ts`. `package.json` unchanged.
- `app/`, `src/`: visuals, styles and shared components only. No logic, protocol (`study_note_saved`, `study_note_dismissed`, `closeSheet`), storage, permission or route-meaning change. Button labels, accessibility labels and handlers stay as they are, except the one copy change: "보내는 중..." → `Button` loading spinner.
- One new token only: `colors.dangerSoft = palette.danger[50]`. Existing theme values unchanged.
- Ink stored values `orange, blue, black, red, green` and MMKV values unchanged; only visible labels become 주황·파랑·검정·빨강·초록.
- Exceptions that stay: pen-width swatches, `FloatingToolbar` tool buttons, `PencilFab`, `EdgeHandle`, `SheetHandle`, `ChatRail` chat item, `PlaybackToolbar`, WebView/HTML strings (`MathJaxWrapper color=…`, `DRAWING_CANVAS_HTML`), ink colors.
- Pretendard; no `react-native-paper`; no dark mode; no new styling system; no dependency.
- Status words only: `미착수 | 진행 | 승인대기 | 완료 | blocked`.
- Baselines at `8c0bce1`: `npm run typecheck` → exit 0. `npx jest` → 3 suites / 3 tests failing (`canvasSize`, `notices`, `timeline`), 255 passing. After every task the failing set is exactly those three; the pass count only grows.
- Screen files (Tasks 6–10) are not edited until the user has delivered real-iPad "before" captures or said to skip (spec §9). Tasks 2–5 may run before that.
- Captures showing personal data are never committed. Claude never types account credentials. Simulator shots are named `sim-…` and are never reported as real-device evidence.

**Plan-level ruling (refines spec §5, ledger it in Task 10):** spec §5 says `onDismiss` always calls `dismissRef.current?.()` and relies on `finishedFor`. That would emit `study_note_dismissed` when the *session* closes the sheet without the widget finishing (today that emits nothing, the Modal just unmounts). So `onDismiss` calls `dismissRef` only when the dismissal was not caused by `state.sheet` going null. Android back is not handled by gorhom v5, so `SheetHost` adds a `BackHandler` listener while a sheet is shown that calls the modal's `dismiss()`.

## Review Focus

1. Session closes the study-note sheet itself (`state.sheet` → null without a widget finish) → no `study_note_dismissed` emitted. Test in Task 10.
2. Android hardware back while the study-note sheet is open → sheet closes, `study_note_dismissed` once; back with no sheet → not consumed. Test in Task 10.
3. `taskId` changes while the sheet is open (same `componentId`) → `present()` is not called a second time; the form remounts via `key`. Test in Task 10.
4. Quiz answer send fails or is slow → submit button busy while `isSubmitting`, ✕ and 지우기 disabled for the same span (today's `disabled={isSubmitting}`). Test in Task 9.
5. Bookmarked problem in the list modal → 책갈피됨 button disabled and pressing it does not call `addBookmark` again. Test in Task 8.

---

### Task 1: Shot list and "before" capture request

**Files:**
- Create: `docs/ui-redesign/04-pilot/shot-list.md`

- [ ] **Step 1: Write `shot-list.md`** (Korean). Table columns: `#`, 화면, 준비할 상태, 파일 이름 (before/after). Rows exactly the spec §9 list: rail이 Stage 위에 있는 채팅 화면; 에이전트 지시 카드; 캔버스(툴바); 전체 지우기 확인; 해답 시트 보기(50%); 해답 시트 넓게(70%); 내 풀이 시트; 개념 검색 시트; 문제 목록 모달; 선생님 메모 토스트; 퀴즈 모달; 학습장 시트; 학습장 시트(키보드 열림); 펜 색 팝오버. File names `docs/ui-redesign/captures/04/ipad-<screen>-before.png` / `-after.png`, `<screen>` in kebab-case English (e.g. `chat-rail`, `answer-sheet-wide`). Notes: device iPad, both orientations only where the row says so; 데이터가 필요한 화면은 사용자가 테스트 계정으로 로그인; 개인정보가 보이면 커밋하지 않음; 시뮬레이터는 `sim-ipad-…`, Gate D 근거 아님.
- [ ] **Step 2: Commit**

```bash
git add docs/ui-redesign/04-pilot/shot-list.md
git commit -m "docs(ui-redesign): add stage 4a shot list"
```

- [ ] **Step 3: Ask the user** for the "before" captures (link the shot list) and continue with Tasks 2–5 meanwhile. Ledger: `Task 1: before-captures requested`.

### Task 2: `dangerSoft` token + `Button` danger tone

**Files:**
- Modify: `src/ui/theme.ts` (`colors`), `src/ui/Button.tsx`
- Test: `__tests__/uiTokens.test.ts`, `__tests__/uiButton.test.tsx`

**Interfaces:**
- Produces: `colors.dangerSoft`; `ButtonProps` = `(Base & { variant: 'primary' | 'danger'; tone?: never }) | (Base & { variant: 'secondary' | 'text'; tone?: 'default' | 'danger' })`, `Base` = today's props minus `variant`.

- [ ] **Step 1: Failing tests.** `uiTokens`: `expect(colors.dangerSoft).toBe(palette.danger[50])`. `uiButton`: `text tone=danger` → label color `colors.danger`, pressed bg `colors.dangerSoft`; `secondary tone=danger` → bg `colors.card`, border and label `colors.danger`, pressed bg `colors.dangerSoft`; `secondary tone=danger disabled` → today's `DISABLED.secondary` look; `tone="default"` equals no tone; a `// @ts-expect-error` line rendering `<Button variant="primary" tone="danger" …/>`. Read pressed style the way existing pressed tests in `uiButton.test.tsx` do.
- [ ] **Step 2: Run** `npx jest __tests__/uiTokens.test.ts __tests__/uiButton.test.tsx` — Expected: new tests FAIL (`dangerSoft` undefined / colors mismatch).
- [ ] **Step 3: Implement.** Add `dangerSoft: palette.danger[50]` next to `danger` in `colors`. In `Button`, pick the look from a `DANGER_TONE: Record<'secondary' | 'text', Look>` when `tone === 'danger'` and not disabled; `DISABLED` unchanged.
- [ ] **Step 4: Run** the two suites, then `npm run typecheck` — Expected: PASS, exit 0 (the `@ts-expect-error` is consumed).
- [ ] **Step 5: Commit** `feat(ui): add danger tone to Button and dangerSoft token`.

### Task 3: `IconButton`

**Files:**
- Create: `src/ui/IconButton.tsx`
- Modify: `__tests__/uiDrift.test.ts` (`FILES` += `src/ui/IconButton.tsx`)
- Test: `__tests__/uiIconButton.test.tsx`

**Interfaces:**
- Consumes: `IoniconName`, `LayoutStyle`, `pickLayout` from `src/ui/Button.tsx`.
- Produces: `export function IconButton(props: { icon: IoniconName; accessibilityLabel: string; onPress(): void; size?: 'md' | 'sm'; selected?: boolean; disabled?: boolean; accessibilityHint?: string; style?: LayoutStyle })`.

- [ ] **Step 1: Failing tests:** md → `minWidth`/`minHeight` `layout.hit`, icon size `layout.footerIcon`; sm → `layout.controlSm`, icon size 18, `hitSlop` each side `(layout.hit - layout.controlSm) / 2`; default icon color `colors.subtle`; selected → bg `colors.accentSoft`, icon `colors.accentText`, `accessibilityState` `{ selected: true, disabled: false }`; pressed bg `colors.accentSoftPress`; disabled → icon `colors.disabled`, `onPress` not called; role `button`; `// @ts-expect-error` without `accessibilityLabel`; `style={{ backgroundColor: 'red' }}` is a `@ts-expect-error`. Drift test now includes the file.
- [ ] **Step 2: Run** `npx jest __tests__/uiIconButton.test.tsx __tests__/uiDrift.test.ts` — Expected: FAIL (module not found).
- [ ] **Step 3: Implement** `IconButton` as a circular `Pressable` (`radius.pill`) with an `Ionicons`; transparent base bg.
- [ ] **Step 4: Run** both suites + `npm run typecheck` — Expected: PASS.
- [ ] **Step 5: Commit** `feat(ui): add IconButton`.

### Task 4: `Tag`

**Files:**
- Create: `src/ui/Tag.tsx`
- Modify: `__tests__/uiDrift.test.ts` (`FILES` += `src/ui/Tag.tsx`)
- Test: `__tests__/uiTag.test.tsx`

**Interfaces:**
- Produces: `export function Tag(props: { label: string | number; tone?: 'neutral' | 'accent' | 'unread' })`.

- [ ] **Step 1: Failing tests:** neutral (default) → bg `colors.cardMuted`, text `colors.subtle`; accent → `accentSoft`/`accentText`; unread → `colors.unread`/`colors.onAccent`, `minWidth: 20`; all → `type.caption` font size, `radius.pill`, `paddingHorizontal: space.sm`, `paddingVertical: space.xxs`; `label={120}` renders `"120"`; `screen.queryByRole('button')` is null.
- [ ] **Step 2: Run** `npx jest __tests__/uiTag.test.tsx __tests__/uiDrift.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement** a `View` + `Text` (no `Pressable`), `String(label)`.
- [ ] **Step 4: Run** both + typecheck — Expected: PASS.
- [ ] **Step 5: Commit** `feat(ui): add Tag`.

### Task 5: `Sheet` keyboard avoidance

**Files:**
- Modify: `src/ui/Sheet.tsx`, `docs/ui-redesign/03-tokens-components.md` (§3.4: replace the "키보드는 아직 피하지 않는다" line with "카드는 `KeyboardAvoidingView`(iOS `padding`, Android `height`) 안에 있다(단계 4a)")
- Test: `__tests__/uiDialog.test.tsx`

- [ ] **Step 1: Failing test** in `uiDialog`: the Dialog title's nearest `KeyboardAvoidingView` ancestor exists (`UNSAFE_getByType(KeyboardAvoidingView)` contains the title), its `behavior` is `'padding'` on iOS (jest-expo default platform); scrim "닫기" is **not** inside it.
- [ ] **Step 2: Run** `npx jest __tests__/uiDialog.test.tsx` — Expected: FAIL.
- [ ] **Step 3: Implement:** inside `root`, keep the scrim as is; wrap the card in `<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} pointerEvents="box-none">` centered like `root`.
- [ ] **Step 4: Run** `npx jest __tests__/uiDialog.test.tsx __tests__/uiStateView.test.tsx` + typecheck — Expected: PASS.
- [ ] **Step 5: Commit** `feat(ui): keep Sheet card above the keyboard`.

### Task 6: Rail and agent shell

**Gate:** "before" captures received or the user said skip. If neither, stop and ask (this is a user decision, not a stall).

**Files:**
- Modify: `src/agent/tablet/ChatRail.tsx`, `src/agent/InstructionCard.tsx`, `src/agent/tablet/ChatTimeline.tsx`, `src/host/Stage.tsx`
- Test: `__tests__/chatRail.test.ts` (add), `__tests__/shellComponents.test.tsx` (new)

**Interfaces:**
- Consumes: `IconButton` (Task 3), `Tag` (Task 4), `Button` (Task 2).
- Produces: `export const RAIL_BG: string` in `ChatRail.tsx`.

- [ ] **Step 1: Failing tests.** `chatRail.test.ts`: `expect(RAIL_BG).toBe('rgba(255, 255, 255, 0.88)')` (from `colors.card` + `layout.railOpacity`). `shellComponents.test.tsx`: `InstructionCard` with choices `[{id:'a',label:'풀기'},{id:'b',label:'나중에'}]` → `풀기` button bg `colors.accent`, `나중에` bg `colors.card`, pressing `나중에` calls `onChoice('b')`; with no choices → `확인` (bg `colors.card`) calls `onDismiss`. `ChatTimeline` summary card renders its tag via `Tag` (`UNSAFE_getByType(Tag).props.tone === 'accent'`, same label text). `Stage` toggle is an `IconButton` with label `내 책갈피` (and `문제 목록` in bookmarks view) and pressing it calls `session.showLocalComponent('problem_list', { source: { kind: 'bookmarks' } })`. Reuse the mocks of the existing `chatTimeline` test for the timeline render.
- [ ] **Step 2: Run** `npx jest __tests__/chatRail.test.ts __tests__/shellComponents.test.tsx` — Expected: FAIL.
- [ ] **Step 3: Implement.** `ChatRail`: `RAIL_BG` built from `colors.card` hex + `layout.railOpacity` (a small local hex→rgba function); rail `backgroundColor: RAIL_BG`, no view `opacity`; dock items → `<IconButton icon={it.icon} accessibilityLabel={it.label} selected={on} disabled={it.disabled} accessibilityHint={…same} onPress={…same} />`; chat item and drag handle unchanged. `InstructionCard`: first choice `Button variant="primary"`, others and `확인` `Button variant="secondary"`, `size="md"`, `title={c.label}`; drop now-unused styles. `ChatTimeline`: badge `Text` → `<Tag tone="accent" label={…} />`, drop `badge` style. `Stage`: `Pressable` → `IconButton` (same icon names, labels, onPress; `size="md"`).
- [ ] **Step 4: Run** the two suites, `npx jest __tests__/chatTimeline.test.ts`, typecheck — Expected: PASS.
- [ ] **Step 5: Commit** `feat(ui): move rail and agent shell to shared components`.

### Task 7: Canvas sheets in two steps

**Files:**
- Modify: `src/kit/canvas/FloatingToolbar.tsx` (export), `src/kit/canvas/CanvasChrome.tsx` (concept sheet), `app/notebook.tsx` (answer + workouts sheets), `app/hotline-class.tsx`, `app/topic-live-class.tsx` (answer sheet)
- Test: `__tests__/notebookSheetModal.test.tsx`, `__tests__/canvasChromeClearModal.test.tsx`, `__tests__/canvasSheetSnaps.test.ts` (new)

**Interfaces:**
- Produces: `export const CANVAS_SHEET_SNAPS = ['50%', '70%'] as const` in `FloatingToolbar.tsx` (pass as `[...CANVAS_SHEET_SNAPS]` if gorhom's type needs a mutable array). `CONCEPT_SHEET_SNAPS` is removed.

- [ ] **Step 1: Failing tests.** Change the gorhom mock in `notebookSheetModal` and `canvasChromeClearModal` to record props: `BottomSheetModal: (p: any) => { mockSheetProps.push(p); return null; }` (keep `BottomSheetView`). Mock `react-native-safe-area-context`'s `useSafeAreaInsets` to `{ top: 0, bottom: 20, left: 0, right: 0 }` only if the suite does not already provide insets. Notebook: two sheets, both `snapPoints` `['50%','70%']`, `index` 0, `bottomInset` `layout.toolbarH + 20`, `enableContentPanningGesture` false, `enableDynamicSizing` false. CanvasChrome: concept sheet `snapPoints` `['50%','70%']`, `index` 1, same `bottomInset`. `canvasSheetSnaps.test.ts`: `CANVAS_SHEET_SNAPS` equals `['50%','70%']`; source of `app/hotline-class.tsx` and `app/topic-live-class.tsx` contains `snapPoints={` with `CANVAS_SHEET_SNAPS`, `index={0}`, `bottomInset=` and no `height / 2` (these routes have no render test; a source check is the cheapest pin).
- [ ] **Step 2: Run** `npx jest __tests__/notebookSheetModal.test.tsx __tests__/canvasChromeClearModal.test.tsx __tests__/canvasSheetSnaps.test.ts` — Expected: new assertions FAIL, old ones still pass.
- [ ] **Step 3: Implement.** In each sheet: `snapPoints`, `index`, `enableDynamicSizing={false}`, `enableContentPanningGesture={false}`, `bottomInset={layout.toolbarH + insets.bottom}` (`useSafeAreaInsets`). `BottomSheetView style={{ flex: 1 }}`; content containers drop `height: height / 2`, `height / 2 - 64`, `height / 2 - 108` for `flex: 1`; workout card width `width / 3 - 18` and the list width stay.
- [ ] **Step 4: Run** the three suites + typecheck — Expected: PASS.
- [ ] **Step 5: Commit** `feat(ui): two-step canvas sheets that stop above the toolbar`.

### Task 8: Canvas modals and labels

**Files:**
- Modify: `src/kit/canvas/CanvasChrome.tsx` (clear confirm), `app/notebook.tsx` (list modal + colors), `app/hotline-class.tsx`, `app/topic-live-class.tsx` (toast + colors), `src/kit/canvas/note-canvas/hotline-class-canvas.tsx`, `topic-live-canvas.tsx`, `notebook.tsx` (memo ✕, ink labels), `src/kit/canvas/note-canvas/canvas-utils.ts` (`INK_LABELS`)
- Test: `__tests__/canvasChromeClearModal.test.tsx`, `__tests__/notebookSheetModal.test.tsx`, `__tests__/inkLabels.test.ts` (new)

**Interfaces:**
- Consumes: `Dialog`, `Button`, `Chip`, `IconButton`.
- Produces: `export const INK_LABELS: Record<(typeof strokeColors)[number], string> = { orange: '주황', blue: '파랑', black: '검정', red: '빨강', green: '초록' }` in `canvas-utils.ts` (values from `docs/ui-redesign/02-roles.json` `names`).

- [ ] **Step 1: Failing tests.** `canvasChromeClearModal`: after pressing `전체 지우기`, header `전체 지우기` (role header) and the existing message; `확인` → `onSelectTool('clearBoard')` once; `취소` and the scrim `닫기` → not called; the `확인` button bg is `colors.danger`. `notebookSheetModal`: list modal `교체`, `책갈피`, `닫기` are `Button`s with `minHeight` `layout.controlSm` for 교체/책갈피; `해답` is a `Chip` (`accessibilityState.selected` false, then true after press with label `문제`); bookmarked item's `책갈피됨` has `accessibilityState.disabled` true and a second press does not call `mockAddBookmark` again (Review Focus 5). `inkLabels.test.ts`: keys of `INK_LABELS` equal `strokeColors`; the three canvas sources contain `title={INK_LABELS[` and no `title={color}`, and still contain `setCanvasStrokeColor(color)` (the stored value is what is passed); hotline/topic sources contain `accessibilityLabel="메모 닫기"` and no `✕`.
- [ ] **Step 2: Run** `npx jest __tests__/canvasChromeClearModal.test.tsx __tests__/notebookSheetModal.test.tsx __tests__/inkLabels.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement.** `CanvasChrome`: `Modal` block → `<Dialog visible={clearConfirmVisible} title="전체 지우기" message="…same…" onDismiss={() => setClearConfirmVisible(false)} cancel={{}} confirm={{ title: '확인', variant: 'danger', onPress: handleConfirmClear }} />`; delete `backdrop`/`dialog*` styles and unused imports. `app/notebook.tsx` list modal: `교체` → `Button secondary sm`; `책갈피`/`책갈피됨` → `Button secondary sm disabled={isBookmarked}`; `해답`/`문제` → `<Chip label={isShowingAnswer ? '문제' : '해답'} selected={isShowingAnswer} onPress={…same} />`; `닫기` → `Button secondary sm`; `'#FFF'` → `colors.card`, `'#000'` shadow → `...shadow.float`, `rgba(0, 0, 0, 0.5)` → `colors.scrim`. Hotline/topic routes: `toastText` → `...type.bodyStrong, color: colors.onAccent`; `fontSize: 12` → `...type.caption`; `'#FFF'` → `colors.card`, `rgba(0, 0, 0, 0.5)` → `colors.scrim`. Canvases: memo ✕ `TouchableOpacity` → `<IconButton size="sm" icon="close" accessibilityLabel="메모 닫기" onPress={…same} />`; ink swatch `title={INK_LABELS[color]}` (hotline/topic keep their local `strokeColors`, typed against `INK_LABELS`). `MathJaxWrapper color="#ea580c"` stays.
- [ ] **Step 4: Run** the three suites + typecheck — Expected: PASS.
- [ ] **Step 5: Commit** `feat(ui): move canvas modals, memo close and ink labels to shared parts`.

### Task 9: Quiz modal

**Files:**
- Modify: `src/kit/live-class/QuizResponseModal.tsx`
- Test: `__tests__/quizResponseModal.test.tsx` (new)

- [ ] **Step 1: Failing tests** (mock `react-native-webview` and the MathJax wrapper to `() => null`, and the upload/submit dependency the component calls): ✕ is an `IconButton` labelled `퀴즈 닫기` that calls `onClose`; `지우기` is a `Button` (bg `colors.card`); submit is a `Button` (bg `colors.accent`) whose label is the existing idle title; while a submit promise is pending: submit `accessibilityState.busy` true, `퀴즈 닫기` and `지우기` disabled, no `보내는 중...` text; after the promise rejects: busy false, buttons enabled (Review Focus 4).
- [ ] **Step 2: Run** `npx jest __tests__/quizResponseModal.test.tsx` — Expected: FAIL.
- [ ] **Step 3: Implement.** Header ✕ → `IconButton size="sm" icon="close" accessibilityLabel="퀴즈 닫기" disabled={isSubmitting}`; `지우기` → `Button variant="secondary" size="md" disabled={isSubmitting}`; submit → `Button variant="primary" size="md" loading={isSubmitting}` (same `onPress`). Remaining numeric `fontSize` and hex/named colors in `styles` → the inventory §3/§4 tokens (`type.*`, `colors.*`); `MathJaxWrapper color` and `DRAWING_CANVAS_HTML` stay. Delete unused button styles.
- [ ] **Step 4: Run** the suite + typecheck — Expected: PASS.
- [ ] **Step 5: Commit** `feat(ui): move quiz modal controls to shared components`.

### Task 10: Study-note sheet

**Files:**
- Modify: `src/host/SheetHost.tsx`, `src/kit/study-note/StudyNoteForm.tsx`
- Test: `__tests__/sheetHost.test.tsx` (rewrite the Modal-specific cases), `__tests__/studyNoteForm.test.tsx`

**Interfaces:**
- Consumes: `Chip`, `Button`; `SheetWidgetProps.dismissRef` from `src/host/widgets.tsx` (unchanged).

- [ ] **Step 1: Failing tests.** In `sheetHost.test.tsx` replace gorhom with a mock: `BottomSheetModal` is a `forwardRef` that renders `children`, stores latest props in `mockModal.props`, and exposes `present: mockPresent`, `dismiss: () => { mockDismiss(); mockModal.props.onDismiss?.(); }`; `BottomSheetView` renders children; `BottomSheetTextInput` = RN `TextInput`. Keep all content tests (title, fallback title, topicHints, saved once, remount on taskId). Replace scrim/`onRequestClose` cases with: `present` called once when a sheet appears; rerender with a new `taskId` → `present` still once (Review Focus 3); `mockModal.props.onDismiss()` → `study_note_dismissed` once + `closeSheet` once, calling it twice still once; save then the host's dismiss-driven `onDismiss` → only `study_note_saved`; rerender to `snap(null)` without finishing → `mockDismiss` called and `emit` not called (Review Focus 1); `backdropComponent` undefined, `enableDynamicSizing` true, `maxDynamicContentSize` = 0.9 × window height, `keyboardBehavior` `'interactive'`, `keyboardBlurBehavior` `'restore'`, `android_keyboardInputMode` `'adjustResize'`; no `닫기` label; hardware back (`BackHandler` listener captured via `jest.spyOn(BackHandler, 'addEventListener')`) returns true and dismisses once, and the listener is removed when the sheet closes (Review Focus 2); pending-save + dismiss emits once (port the existing case to `mockModal.props.onDismiss()`). `studyNoteForm.test.tsx`: add the same `BottomSheetTextInput` mock; chips are the shared `Chip` (`UNSAFE_getAllByType(Chip)` length unchanged from today's chip count); `나중에` and the goal toggle are `Button variant="text"`; `저장` is `Button primary` with `accessibilityState.disabled` under today's disabled condition.
- [ ] **Step 2: Run** `npx jest __tests__/sheetHost.test.tsx __tests__/studyNoteForm.test.tsx` — Expected: FAIL.
- [ ] **Step 3: Implement `SheetHost`.** Keep the last shown sheet in state so content stays mounted while the sheet animates out. `useEffect` on `state.sheet`: appears (from none) → `present()`; becomes null → mark "closing by session" and `dismiss()`. `onDismiss`: if not closing-by-session → `dismissRef.current?.()`; then clear the shown sheet and the flag. `BottomSheetModal` props: no `backdropComponent`, `enableDynamicSizing`, `maxDynamicContentSize={0.9 * windowHeight}`, `handleComponent={SheetHandle}`, the three keyboard props, `animateOnMount={!reduceMotion}`, tablet `style`/container width max `TABLET_CARD_MAX_W` centered; content in `BottomSheetView` with `paddingBottom: space.md`. `BackHandler` listener only while shown: calls `dismiss()`, returns true. Ledger the plan-level ruling.
- [ ] **Step 4: Implement `StudyNoteForm`.** Delete the local `Chip`; use `src/ui/Chip` (keep each call's label, selected, role — `radio` for achievement, `checkbox` for difficulties, `button` for hints — and onPress). Goal toggle → `Button variant="text" size="sm"` (same title text), `나중에` → `Button variant="text" size="md"`, `저장` → `Button variant="primary" size="md" disabled={saveDisabled}` (same `save`). Both `TextInput` → `BottomSheetTextInput` (same props). Drop unused styles.
- [ ] **Step 5: Run** both suites, `npx jest __tests__/studyNote*`, typecheck — Expected: PASS.
- [ ] **Step 6: Commit** `feat(ui): study-note sheet as a backdrop-less bottom sheet`.

### Task 11: Inventory, docs, 4a notes

**Files:**
- Modify: `docs/ui-redesign/03-components-inventory.md`, `docs/ui-redesign/1794280544402-contituous-guide.md`
- Create: `docs/ui-redesign/04-pilot/4a-notes.md`

- [ ] **Step 1: Run** `node docs/ui-redesign/tools/check-inventory.mjs docs/ui-redesign/03-components-inventory.md .` — Expected: FAIL listing stale/missing rows for the files Tasks 6–10 touched.
- [ ] **Step 2: Update the inventory:** moved rows get their new `path:line` and status "됨"; removed pressables' rows are deleted; new hits (e.g. `IconButton`/`Tag` internals) are added as the inventory's rules say; §4 color rows of touched files updated.
- [ ] **Step 3: Run** the checker — Expected: `OK rows=<n>`.
- [ ] **Step 4: Drift check of touched files:** `git diff --name-only 8c0bce1 -- app src | xargs grep -nE "#[0-9a-fA-F]{3,8}\b|fontSize:\s*[0-9]|'(white|black)'"` — Expected: only ink-color, `MathJaxWrapper color=`, `DRAWING_CANVAS_HTML` and pen-width lines (spec §1 criterion 3). Any other line is fixed in the owning file before continuing.
- [ ] **Step 5: Scope check:** `git diff --stat 8c0bce1 -- app src package.json` — Expected: only the Global Constraints file list.
- [ ] **Step 6: Full run:** `npx jest > <workspace>/jest-final.txt 2>&1; tail -30` and `npm run typecheck` — Expected: failing suites exactly `canvasSize`, `notices`, `timeline` (3 tests); pass count > 255; typecheck exit 0.
- [ ] **Step 7: Write `4a-notes.md`** (Korean): changed files by commit, test results (Step 6 numbers), rulings, what remains (D-02 부분 해결로 열림; 4b dock panels; other session's overlapping files to merge when the user says), and the request for real-iPad "after" captures per `shot-list.md`. Guide stage table: stage 4 → `진행` (4a 완료, 4b 미착수), note Gate D after 4b.
- [ ] **Step 8: Commit** `docs(ui-redesign): update inventory and add stage 4a notes`.

After Task 11: one fresh whole-branch review (executing-plans Final Review), then ask the user for the "after" captures.
