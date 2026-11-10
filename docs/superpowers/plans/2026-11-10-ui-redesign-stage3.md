# UI Redesign Stage 3 — Tokens, Shared Components, State Rules Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add three tokens and the shared `Button`, `Chip`, `StateView`, `Dialog` to `src/ui/` with tests, and write the inventory (with its checker), the tokens/components doc and the DESIGN.md update, ending at Gate C with no call site changed.

**Architecture:** New components live in `src/ui/` beside `theme.ts` and read only theme values; callers can pass only layout style. `Dialog` is built on the existing `src/ui/Sheet.tsx`. `GoButton` and every screen stay untouched. The inventory is a markdown table checked by a `node:test`-tested script that re-scans `app/` and `src/` for pressables.

**Tech Stack:** Expo SDK 54, React Native 0.81, TypeScript, jest-expo + `@testing-library/react-native` (async `render`/`fireEvent`), `@expo/vector-icons` Ionicons, Node `node:test` for doc tools.

**Spec:** `docs/superpowers/specs/2026-11-10-ui-redesign-stage3-design.md`

## Global Constraints

- Base commit `3846de6` on `design/ui-redesign`. No push, PR or deploy unless the user says so. Do not touch `d0a5d1c`. Keep the uncommitted `PRODUCT.md` out of every commit.
- `git diff --stat 3846de6 -- app src package.json` may list only `src/ui/Button.tsx`, `src/ui/Chip.tsx`, `src/ui/StateView.tsx`, `src/ui/Dialog.tsx`, `src/ui/theme.ts`.
- Existing values in `src/ui/theme.ts` do not change. New: `layout.controlSm = 32`, `layout.railOpacity = 0.88`, `layout.dialogMax = 400`. No new colors.
- Components read only `theme.ts`. No `color`, `textColor`, `textStyle` props. `style` accepts only `margin*`, `flex*`, `alignSelf` (type-enforced).
- No hex color literal and no `fontSize: <number>` in the four component files.
- Pretendard stays; no `react-native-paper`; no dark mode; no new styling system or dependency.
- Ink stored values `orange, blue, black, red, green` and MMKV values do not change.
- Status words only: `미착수 | 진행 | 승인대기 | 완료 | blocked`. Stage 3 ends at `승인대기`.
- Baselines (recorded at `3846de6`): `npm run typecheck` → exit 0, 0 errors. `npx jest` → `Test Suites: 3 failed, 37 passed, 40 total`; `Tests: 3 failed, 225 passed, 228 total`; failing suites `canvasSize`, `timeline`, `notices`. After every task the failing set must be exactly these three.
- Copy (Korean) fixed by the spec: Dialog cancel default `취소`; Phone card title `지금 수업 중 · {수업명}`, subtitle `문제만 볼 수 있어요. 수업 참여는 태블릿에서 해요.`

**Spec correction (rule on it, ledger it):** spec §5.2 lists `accessibilityRole?: 'button' | 'radio' | 'checkbox'`, but four existing chips use `role=tab` (`ResearchPanel.tsx:62`, `app/welcome.tsx:114`, `ConceptLookupPanel.tsx:88`, `:113`). Use `'button' | 'tab' | 'radio' | 'checkbox'` so migration preserves their semantics.

## Review Focus

1. `onPress` returns a promise that **rejects** → the button must leave loading (busy false) and become pressable again. Test in Task 2.
2. Larger system font → buttons and chips grow; they must use `minHeight`, never a fixed `height`. Test in Tasks 2 and 3.
3. A caller passes `style={{ backgroundColor: ... }}` or `color` → must be a type error. `@ts-expect-error` lines in Tasks 2 and 3, verified by `npm run typecheck`.
4. Double tap on an async Dialog confirm → `onPress` called once. Test in Task 5.
5. Inventory checker on a Windows checkout (CRLF in md, `\` in walked paths) → must still match `path:line` ids. Test in Task 6.

---

### Task 1: Tokens

**Files:**
- Modify: `src/ui/theme.ts` (the `layout` object)
- Test: `__tests__/uiTokens.test.ts`

**Interfaces:**
- Produces: `layout.controlSm: 32`, `layout.railOpacity: 0.88`, `layout.dialogMax: 400` (all `as const`).

- [ ] **Step 1: Write the failing test** `__tests__/uiTokens.test.ts`

```ts
import { layout, colors } from '../src/ui/theme';
test('stage 3 tokens', () => {
  expect(layout.controlSm).toBe(32);
  expect(layout.railOpacity).toBe(0.88);
  expect(layout.dialogMax).toBe(400);
});
test('existing tokens unchanged', () => {
  expect(layout.hit).toBe(44);
  expect(layout.chatMax).toBe(400);
  expect(colors.accent).toBe('#F97316');
  expect(colors.accentPress).toBe('#EA580C');
});
```

- [ ] **Step 2: Run** `npx jest __tests__/uiTokens.test.ts` — Expected: FAIL, `expect(received).toBe(expected)` with received `undefined` on `controlSm`.
- [ ] **Step 3: Add the three keys to `layout` in `src/ui/theme.ts`** with a one-line Korean comment each (spec §4 rationale in a few words; `railOpacity` comment says "단계 4에서 ChatRail에 적용").
- [ ] **Step 4: Run** `npx jest __tests__/uiTokens.test.ts` — Expected: PASS 2/2. Run `npm run typecheck` — Expected: exit 0.
- [ ] **Step 5: Commit** `git add src/ui/theme.ts __tests__/uiTokens.test.ts` → `feat(ui): add controlSm, railOpacity, dialogMax tokens`

### Task 2: Button + drift guard

**Files:**
- Create: `src/ui/Button.tsx`
- Test: `__tests__/uiButton.test.tsx`, `__tests__/uiDrift.test.ts`

**Interfaces:**
- Consumes: Task 1 tokens; `colors`, `type`, `radius`, `layout`, `space` from `src/ui/theme`.
- Produces:
  - `export type LayoutStyle = StyleProp<Pick<ViewStyle, 'margin' | 'marginTop' | 'marginBottom' | 'marginLeft' | 'marginRight' | 'marginHorizontal' | 'marginVertical' | 'flex' | 'flexGrow' | 'flexShrink' | 'flexBasis' | 'alignSelf'>>`
  - `export type IoniconName = ComponentProps<typeof Ionicons>['name']`
  - `export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'text'`
  - `export function Button(props: ButtonProps): JSX.Element` with `ButtonProps` exactly as spec §5.1 (`variant` required, `size?: 'md' | 'sm'` default `md`, `title`, `icon?`, `onPress(): void | Promise<unknown>`, `disabled?`, `loading?`, `debounceMs?` default 400, `accessibilityLabel?`, `accessibilityHint?`, `style?: LayoutStyle`).
  - `__tests__/uiDrift.test.ts` exports nothing; holds `const FILES = ['src/ui/Button.tsx']` that Tasks 3–5 extend.

- [ ] **Step 1: Write the failing tests** `__tests__/uiButton.test.tsx` (use `await render`, `await fireEvent.press`, `screen.getByRole('button')`):
  - `defaults the accessibility label to the title`: `getByRole('button').props.accessibilityLabel === '저장'`.
  - `ignores presses and reports busy while the promise is pending`: `onPress = jest.fn(() => new Promise(() => {}))`; press twice; `onPress` called 1 time; `accessibilityState` `{ busy: true }`.
  - `leaves loading when the promise rejects` (Review Focus 1): `onPress` rejects once then resolves; after the first press `await waitFor` busy false; mock `Date.now` past 400ms; second press calls `onPress` a 2nd time. Silence the rejection with `jest.spyOn(console, 'error')` only if it is logged.
  - `debounces presses within debounceMs`: sync `onPress`; `Date.now` mocked to 1000 then 1200 → called once; then 1500 → called twice.
  - `never calls onPress when disabled` and reports `{ disabled: true }`.
  - `shows the loading prop`: `loading` → busy true, press ignored.
  - `uses minHeight, not height` (Review Focus 2): flattened style of the pressable has `minHeight` 44 for `md`, 32 for `sm`, and `height` undefined.
  - `renders the icon` when `icon="add"` is passed (query the Ionicons element by `testID="button-icon"`).
  - Type guards (Review Focus 3), in the same file, not executed as assertions:
    ```tsx
    // @ts-expect-error variant is required
    <Button title="x" onPress={() => {}} />;
    // @ts-expect-error style is layout-only
    <Button variant="primary" title="x" onPress={() => {}} style={{ backgroundColor: 'red' }} />;
    // @ts-expect-error no color override
    <Button variant="primary" title="x" onPress={() => {}} color="red" />;
    ```
  Write `__tests__/uiDrift.test.ts`:
  - `function findDrift(source: string): string[]` — stub returning `[]` for now.
  - `drift finder catches literals`: `findDrift("a: '#FF8800', fontSize: 12, b: colors.accent")` has length 2.
  - `ui primitives have no drift`: for each of `FILES`, `findDrift(fs.readFileSync(path, 'utf8'))` equals `[]`.
- [ ] **Step 2: Run** `npx jest __tests__/uiButton.test.tsx __tests__/uiDrift.test.ts` — Expected: FAIL (`Cannot find module '../src/ui/Button'`, and the drift self-check length 0 ≠ 2).
- [ ] **Step 3: Implement `findDrift`** with the regexes `/#[0-9a-fA-F]{3,8}\b/g` and `/fontSize:\s*\d/g`, returning matched strings.
- [ ] **Step 4: Implement `Button`** in `src/ui/Button.tsx`: `Pressable` with `accessibilityRole="button"`, `accessibilityState={{ disabled, busy }}`, `hitSlop` that tops `sm` up to `layout.hit` (`(layout.hit - layout.controlSm) / 2` vertically), `radius.pill`, text `type.title` (md) / `type.bodyStrong` (sm), colors per the spec §5.1 variant table (danger pressed = `opacity: 0.85`). Loading: label kept with `opacity: 0`, `ActivityIndicator` absolutely centered, color = the variant's label color. Press guard and auto-loading as `GoButton` (`src/kit/ui/go-button.tsx:62-79`). On rejection: catch, `console.warn` the error (no unhandled rejection, not silent), then clear loading in `finally`. No scale animation. Icon: `Ionicons` size 18, `testID="button-icon"`, gap `space.xs`.
- [ ] **Step 5: Run** `npx jest __tests__/uiButton.test.tsx __tests__/uiDrift.test.ts` — Expected: PASS all. Run `npm run typecheck` — Expected: exit 0 (an unused `@ts-expect-error` would fail it, proving the guards bite).
- [ ] **Step 6: Commit** `git add src/ui/Button.tsx __tests__/uiButton.test.tsx __tests__/uiDrift.test.ts` → `feat(ui): add shared Button with drift guard`

### Task 3: Chip

**Files:**
- Create: `src/ui/Chip.tsx`
- Modify: `__tests__/uiDrift.test.ts` (`FILES` += `'src/ui/Chip.tsx'`)
- Test: `__tests__/uiChip.test.tsx`

**Interfaces:**
- Consumes: `LayoutStyle` from `src/ui/Button`.
- Produces: `export function Chip(props: { label: string; selected: boolean; onPress(): void; disabled?: boolean; accessibilityRole?: 'button' | 'tab' | 'radio' | 'checkbox'; style?: LayoutStyle }): JSX.Element`.

- [ ] **Step 1: Write the failing tests** `__tests__/uiChip.test.tsx`:
  - `reports selected and calls onPress`: `selected` → `accessibilityState.selected === true`; press → called once.
  - `defaults role to button; accepts tab`: `getByRole('button')`; with `accessibilityRole="tab"` → `getByRole('tab')`.
  - `disabled and selected` (spec §9): reports `{ selected: true, disabled: true }`, press does not call.
  - `uses minHeight 32 and no height`.
  - `// @ts-expect-error style is layout-only` with `style={{ borderColor: 'red' }}`.
  - Add `'src/ui/Chip.tsx'` to `FILES` in `uiDrift.test.ts`.
- [ ] **Step 2: Run** `npx jest __tests__/uiChip.test.tsx __tests__/uiDrift.test.ts` — Expected: FAIL, module not found / ENOENT for Chip.
- [ ] **Step 3: Implement `Chip`** per spec §5.2 values (unselected `cardMuted` + `subtle`; selected `accentSoft` + 1px `accent` border + `accentText`; pressed `accentSoftPress`; disabled `disabled` text; `radius.pill`; `type.bodyStrong`; horizontal padding `space.md`; same hitSlop rule as Button `sm`). Unselected keeps a 1px transparent border so selecting does not shift layout.
- [ ] **Step 4: Run** the two files — Expected: PASS. `npm run typecheck` — exit 0.
- [ ] **Step 5: Commit** `feat(ui): add shared selection Chip`

### Task 4: StateView

**Files:**
- Create: `src/ui/StateView.tsx`
- Modify: `__tests__/uiDrift.test.ts` (`FILES` += `'src/ui/StateView.tsx'`)
- Test: `__tests__/uiStateView.test.tsx`

**Interfaces:**
- Consumes: `Button` (Task 2).
- Produces: `export function StateView(props: { kind: 'loading' | 'empty' | 'error'; title: string; message?: string; action?: { title: string; onPress(): void | Promise<unknown> } }): JSX.Element`.

- [ ] **Step 1: Write the failing tests** `__tests__/uiStateView.test.tsx`:
  - `shows the title for each kind` (loop over the three kinds).
  - `loading shows a spinner` (`testID="state-spinner"`), empty/error do not.
  - `error action is a primary button that calls onPress`; `empty action calls onPress`; no `action` → `queryByRole('button')` is null.
  - `message renders when given`.
  - Add the file to `FILES`.
- [ ] **Step 2: Run** — Expected: FAIL, module not found.
- [ ] **Step 3: Implement**: centered column, padding `space.xl`, gap `space.sm`; title `type.title` + `colors.text`, message `type.body` + `colors.muted`, centered; spinner `ActivityIndicator` `colors.accent`; action `Button` `variant` = `primary` for error, `secondary` for empty and loading, `size="md"`. `accessibilityRole` not set on the container; title gets `accessibilityRole="header"`.
- [ ] **Step 4: Run** — Expected: PASS. `npm run typecheck` — exit 0.
- [ ] **Step 5: Commit** `feat(ui): add shared StateView for loading, empty and error`

### Task 5: Dialog

**Files:**
- Create: `src/ui/Dialog.tsx`
- Modify: `__tests__/uiDrift.test.ts` (`FILES` += `'src/ui/Dialog.tsx'`)
- Test: `__tests__/uiDialog.test.tsx`

**Interfaces:**
- Consumes: `Sheet` (`src/ui/Sheet.tsx`, unchanged: `{ visible, onDismiss, style, children }`; its scrim has `accessibilityLabel="닫기"`), `Button`.
- Produces: `export function Dialog(props: DialogProps): JSX.Element` with `DialogProps` exactly as spec §5.4.

- [ ] **Step 1: Write the failing tests** `__tests__/uiDialog.test.tsx`:
  - `renders title and message`.
  - `confirm calls confirm.onPress`.
  - `cancel calls cancel.onPress when given, otherwise onDismiss` (two renders, assert each).
  - `scrim calls onDismiss` (press `getByLabelText('닫기')`).
  - `no cancel prop → only one button`: `getAllByRole('button')` filtered to exclude the scrim has length 1.
  - `cancel title defaults to 취소`.
  - `danger confirm` renders (snapshot-free: query `getByText` of the confirm title and check its pressable's flattened `backgroundColor === colors.danger`).
  - `double tap on async confirm calls once` (Review Focus 4): pending promise, two presses → 1 call.
  - `children render between message and actions` (a `TextInput` with `accessibilityLabel="새 이름"` is found).
  - Add the file to `FILES`.
- [ ] **Step 2: Run** — Expected: FAIL, module not found.
- [ ] **Step 3: Implement**: `<Sheet visible onDismiss style={{ width: '100%', maxWidth: layout.dialogMax, padding: space.lg, gap: space.md }}>`, wrapped by a horizontal margin `layout.gutter` so it never touches screen edges; title `type.title` with `accessibilityRole="header"`, message `type.body` + `colors.subtle`; actions row `flexDirection: 'row', justifyContent: 'flex-end', gap: space.sm`; cancel `Button variant="secondary"`, confirm `Button variant={confirm.variant ?? 'primary'}`, both `md`.
- [ ] **Step 4: Run** — Expected: PASS. `npm run typecheck` — exit 0. Run `npx jest` — Expected: failing suites exactly `canvasSize`, `timeline`, `notices`; tests `3 failed`, passed = 225 + the new ones.
- [ ] **Step 5: Commit** `feat(ui): add shared Dialog on Sheet`

### Task 6: Inventory checker

**Files:**
- Create: `docs/ui-redesign/tools/check-inventory.mjs`, `docs/ui-redesign/tools/check-inventory.test.mjs`

**Interfaces:**
- Produces:
  - `export function findPressables(root: string): string[]` — walks `root/app` and `root/src`, files ending `.ts`/`.tsx`, returns `'<posix relative path>:<line>'` for each line matching `/<(Pressable|TouchableOpacity|TouchableHighlight|TouchableWithoutFeedback|Button)\b/`, sorted. Paths always use `/`.
  - `export function checkInventory({ md, hits }: { md: string; hits: string[] }): string[]` — errors, empty when valid.
  - CLI: `node docs/ui-redesign/tools/check-inventory.mjs <inventory.md> <repoRoot>` → prints `OK rows=<n>` and exits 0, or `FAIL` + errors and exits 1; with missing args prints `usage: check-inventory.mjs <inventory.md> <repoRoot>` and exits 2.
- Inventory md contract (Task 7 writes it): the table under the heading `## 1. 눌리는 요소`, up to the next `\n## `. Header row contains `파일:라인`. 7 columns: `파일:라인 | 역할 | 현재 표현 | 동작·상태 | 대상 | 예외 사유 | 교체 단계`. The id cell is `` `path:line` `` (backticks stripped). `대상` must match `/^(Button (primary|secondary|danger|text) (md|sm)|Chip|StateView|Dialog|글자|예외)$/`. `교체 단계` is `4` or `5`, except `예외` rows, which use `—` and need a non-empty `예외 사유` (not `—`).

- [ ] **Step 1: Write the failing tests** `check-inventory.test.mjs` (`node:test`, `assert/strict`, fixture md built in the test like `check-roles.test.mjs`): `valid fixture passes`; `missing row <hit>`; `stale row <id>` (row whose id is not in hits); `duplicate row <id>`; `bad target <id>`; `exception without reason <id>`; `bad stage <id>` (e.g. `3`, and `4` on an exception row); `md columns <id>`; `crlf line endings` (Review Focus 5); `findPressables` on a temp dir (`fs.mkdtempSync`) with `app/a.tsx` containing `<Pressable` on line 2 and `<View` on line 3, and `src/x/b.ts` containing `<TouchableOpacity` → returns `['app/a.tsx:2', 'src/x/b.ts:1']`; files outside `app`/`src` are ignored.
- [ ] **Step 2: Run** `node --test docs/ui-redesign/tools/check-inventory.test.mjs` — Expected: FAIL, `Cannot find module`.
- [ ] **Step 3: Implement** both functions and the CLI (normalize `\r\n`, `path.relative(...).split(path.sep).join('/')`). Error strings start exactly with the test names above.
- [ ] **Step 4: Run** the test — Expected: all pass. Also `node --test docs/ui-redesign/tools/check-roles.test.mjs` — Expected: 20/20.
- [ ] **Step 5: Commit** `docs(ui-redesign): add inventory checker for stage 3`

### Task 7: Inventory document

**Files:**
- Create: `docs/ui-redesign/03-components-inventory.md`

**Interfaces:**
- Consumes: the md contract and CLI from Task 6; rows and columns from `docs/ui-redesign/01-buttons-chips-survey.md` (line numbers there are from `76b99e3` — re-read each hit at HEAD).

- [ ] **Step 1: Run the checker against an empty skeleton** (heading `## 1. 눌리는 요소` + header row only) — Expected: `FAIL` with one `missing row` per hit (71 at `3846de6`).
- [ ] **Step 2: Fill §1, one row per hit**, using these rules:
  - 대상: filled accent/orange action → `Button primary`; bordered/outline or neutral fill → `Button secondary`; `colors.danger` action → `Button danger`; label-only or underlined → `Button text`; size `md` if the current height ≥ 38 or the row is a primary action of a form/dialog, else `sm`; selection/filter/tab chip → `Chip`; a dialog's own buttons → the matching `Button` and note `Dialog` in 역할; `GoButton` without `onPress` (`ExamSearchPanel.tsx:103`) → `글자`.
  - `예외` with reason: `PencilFab`, `EdgeHandle`, `SheetHandle` ("이미 공용, 모양 일치"), pen color/width swatches ("잉크 색 사용자 데이터·선택 견본"), cards/rows/backdrop-dismiss surfaces ("버튼이 아닌 눌리는 면"), dead-code files from diagnosis §5 ("데드 코드, 정리는 별도 결정"), the `GoButton` and in-file `Chip` definitions themselves ("공용 컴포넌트로 대체 후 삭제").
  - 교체 단계: `4` if the file renders on a stage 4 pilot surface — `src/agent/**`, `src/kit/canvas/**`, `app/notebook.tsx`, `src/host/SheetHost.tsx`, and the dock panels (`src/kit/timeline`, `diary`, `exam-search`, `profile`, `live-class`, `research`, `notices`, `study-note`); otherwise `5`.
- [ ] **Step 3: Write §2 읽기 전용 배지**: run `rg -n -i "(badge|tag|pill)\w*\s*:" app src`, read each hit, list real read-only badge `View`s as `파일:라인 | 모양 | 반복 수`, and end with one line: whether any badge repeats in ≥ 2 files (if yes, propose `Tag` for stage 4 as a Gate C note; do not build it).
- [ ] **Step 4: Write §3 글자 크기**: one row per `rg -n "fontSize:\s*\d" app src` hit as `파일:라인 | 값 | 굵기 | 토큰`. Token rule: 11 → `tabLabel`; 12 → `caption`; 13–14 → `body` (weight < 600) or `bodyStrong`; 15–17 → `title`; 18–22 → `heading`; > 22 → `예외` with reason (e.g. display numerals). Line count must equal the `rg | wc -l` count (state both in the section).
- [ ] **Step 5: Write §4 팔레트 밖 UI 색**: one row per distinct off-palette value used in UI styles (at least `#FF8800`, `#FFC256`, `#30B650`, `#ea580c`, `#fed7aa`, `#E5E5E5`, slate `#f1f5f9`/`#cbd5e1`/`#f8fafc`, CSS `'orange'` in UI styles) as `값 | 사용 파일 | 대체 토큰`. §5 예외 대장 summarizes all `예외` rows plus ink colors `orange, blue, black, red, green` ("사용자 데이터, 바꾸지 않음").
- [ ] **Step 6: Run** `node docs/ui-redesign/tools/check-inventory.mjs docs/ui-redesign/03-components-inventory.md .` — Expected: `OK rows=71` (or the current hit count).
- [ ] **Step 7: Commit** `docs(ui-redesign): add stage 3 components inventory`

### Task 8: Tokens/components doc, DESIGN.md, guide, Gate C

**Files:**
- Create: `docs/ui-redesign/03-tokens-components.md`
- Modify: `DESIGN.md`, `docs/ui-redesign/1794280544402-contituous-guide.md` (§2 stage table row "3~6", §3 update note)

**Interfaces:**
- Consumes: everything above.

- [ ] **Step 1: Write `03-tokens-components.md`** with sections: `## 1. 요약` (table like `02-ia-overlay-roles.md` §1: 단계 / 상태 = `단계 3 / **승인대기** — Gate C 검토 중. 질문은 §6`, 기준 `3846de6`, 설계·계획 paths, 사용한 스킬 `expo-design-system`, `impeccable` `document`·`extract`, `vercel-react-native-skills` (Pressable/a11y), 소스 변경, 검증 commands); `## 2. 토큰` (spec §4 table); `## 3. 컴포넌트` (spec §5 APIs + one usage example per state: default, pressed, disabled, loading, selected, error, empty); `## 4. 규칙` (spec §6, all eight bullets, plus the Chip `tab` role ruling); `## 5. 인벤토리 요약` (counts by 대상 and 교체 단계 from Task 7, badge conclusion); `## 6. Gate C 요청` (spec §10's four questions, plus the `Tag` note if Task 7 found repeats); `## 7. 소스 변경 파일` (the five `src/ui` files).
- [ ] **Step 2: Update `DESIGN.md`** following impeccable `document` (load `C:\Users\Lenovo\.claude\skills\impeccable\reference\document.md` first): add entries for the four components to the frontmatter `components:` block, the three tokens to the `## Layout` section, and to the `## Components` section a description of `Button` (4 variants × 2 sizes), `Chip`, `StateView`, `Dialog` with their token use. Do not change existing values.
- [ ] **Step 3: Update the guide**: stage table row → `| 3 토큰·공통 컴포넌트 | **승인대기** (Gate C 검토 중) | 03-tokens-components.md, 03-components-inventory.md, src/ui/{Button,Chip,StateView,Dialog}.tsx |` and `| 4~6 | 미착수 | — |`; replace the §3 note's last sentence with "단계 3을 마쳐 **Gate C 검토 중**이다. 질문은 `03-tokens-components.md` §6. **Gate C 승인 전에는 단계 4를 시작하지 않는다.**"
- [ ] **Step 4: Verify all**:
  - `npx jest` → failing suites exactly `canvasSize`, `timeline`, `notices`.
  - `npm run typecheck` → exit 0.
  - `node --test docs/ui-redesign/tools/check-inventory.test.mjs` and `check-roles.test.mjs` → all pass.
  - `node docs/ui-redesign/tools/check-inventory.mjs docs/ui-redesign/03-components-inventory.md .` → `OK`.
  - `node docs/ui-redesign/tools/check-roles.mjs docs/ui-redesign/02-roles.json docs/ui-redesign/02-ia-overlay-roles.md docs/ui-structure/ui-structure.json docs/ui-redesign/01-diagnosis.md` → `OK rows=66 deviations=8`.
  - `git diff --stat 3846de6 -- app src package.json` → only the five `src/ui` files.
- [ ] **Step 5: Commit** `docs(ui-redesign): request Gate C for stage 3`
- [ ] **Step 6:** Ask the user the Gate C questions one at a time. Do not start stage 4 before approval.
