# UI Redesign Stage 4b — Dock Panels Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the five tablet dock panels (timeline, search, live class, profile, Diary) onto the 4a shared components and theme tokens, delete the search dock's 개념 tab, and make the exam-search row labels clear their row. Behavior otherwise stays the same.

**Architecture:** No new shared parts. Each dock gets its own task, which swaps local `Pressable`/`GoButton`/hex styles for `Button`/`Chip`/`IconButton`/`Tag`/`Dialog` and `theme.ts` tokens. A growing `__tests__/dockDrift.test.ts` pins "no hex / numeric fontSize" per touched file. The Diary task waits for the other session's uncommitted Diary work (spec D8).

**Tech Stack:** Expo SDK 54, RN 0.81, TypeScript, jest-expo + RNTL v14 (async `render`/`fireEvent`, read styles via `StyleSheet.flatten(el.props.style)`), `@expo/vector-icons` Ionicons.

**Spec:** `docs/superpowers/specs/2026-11-12-ui-redesign-stage4b-design.md` (Korean; binding authority, commits `9959e0b`, `73e3eaf`)

## Global Constraints

- Branch `design/ui-redesign-stage4`, worktree `.claude/worktrees/ui-redesign-stage4`, base `f791a77`. No push, PR, merge or deploy unless the user says so. Don't touch `d0a5d1c` or the main checkout. Never bare `git stash`. The worktree guard refuses `git -C`, chained git commands and heredocs: run one plain git command per call.
- `app/`, `src/`: visuals, styles and shared components only. The only behavior changes are D2 (delete the 개념 tab), D3 (`resolveInitialCategory` checks the preset against the tab list) and D4 (row "선택" buttons clear their row). Labels, a11y labels and handlers otherwise stay the same.
- No new tokens, no dependency, `package.json` unchanged. Pretendard; no react-native-paper; no dark mode.
- `git diff --stat f791a77 -- app src package.json` lists only the files in spec §4 (excluding the commit that merges the other session's work, D8).
- MMKV keys and values unchanged (`RESEARCH_CATEGORY_KEY`, ExamSearch `STORAGE_KEY`). A stored `'concept'` is not erased.
- Status words only: `미착수 | 진행 | 승인대기 | 완료 | blocked`.
- Baselines at `f791a77`: `npm run typecheck` exit 0. `npx jest`: 313 tests, 310 pass; failing = `canvasSize`, `notices`, `timeline › lists cards and reports the chosen task`. `TimelinePanel › shows the empty placeholder` may fail only in a full run (passes alone). After each task, failing set ⊆ that set and the pass count does not drop.
- Claude never types account credentials. Captures with personal data are never committed. Simulator shots are not real-device evidence.

**Plan-level ruling (refines spec D3):** `src/host/registry.ts:52` already restricts the research preset to `z.enum(['recent','pre','mentor'])`, so the agent cannot send `'concept'` today. D3 still applies inside `resolveInitialCategory` (defense against `widgets.tsx`'s type assertion); the registry is not changed.

## Review Focus

1. A stored `'concept'` (`lastAgenda`) on a device that used the old tab → search opens on 2026, no crash, value left in storage. Test in Task 2.
2. Pressing a row's "선택" clear button when that row is already empty → stays empty, other rows unchanged, nothing written to storage. Test in Task 3.
3. Switching 계열 in pre_exam after clearing years → years reset to `defaultYearsFor(subject)` as today (clear does not break `changeSubject`). Test in Task 3.
4. Timeline line that starts with an emoji not in the map, or with no emoji → text drawn verbatim, nothing lost. Test in Task 1.
5. Name dialog: pressing 저장 with an unchanged or whitespace-only name → disabled, `changeName` not called. Test in Task 5.

---

### Task 1: Timeline card (D1)

**Files:**
- Modify: `src/kit/timeline/TimelinePanel.tsx` (card render + styles, ~170–240)
- Create: `__tests__/dockDrift.test.ts`
- Test: `__tests__/timeline.test.tsx`

**Interfaces:**
- Produces: `export function splitLeadingIcon(text: string): { icon?: 'document-text-outline' | 'calendar-outline' | 'list-outline' | 'time-outline'; text: string }` in `TimelinePanel.tsx`. Map: `📝`→`document-text-outline`, `📆` and `🗓`→`calendar-outline`, `🔢`→`list-outline`, `🕑`→`time-outline`. Strips the emoji (with any variation selector) and one following space. Unknown or no emoji → `{ text }` unchanged.
- Produces: `__tests__/dockDrift.test.ts` exporting nothing; has `const FILES: string[]` and `findDrift(source)` = the `uiDrift.test.ts` patterns (hex, `fontSize:\s*\d`) plus named colors: `/[cC]olor[:=]\s*["'](?!transparent)[a-zA-Z]+["']/g` (catches `color: 'orange'`, `backgroundColor: 'orange'`, `color="orange"`). Include a self-test `drift finder catches named colors`. Later tasks append to `FILES`.

- [ ] **Step 1: Write failing tests** in `timeline.test.tsx`:
  - `splitLeadingIcon maps known emoji and keeps unknown text`: `splitLeadingIcon('📝 기출 검색')` → `{ icon: 'document-text-outline', text: '기출 검색' }`; `'📆 10월'` → calendar; `'🔢 번호: 1, 2'` → list; `'🕑 11/12'` → time; `'★ 기타'` → `{ text: '★ 기타' }`; `'그냥 글'` → `{ text: '그냥 글' }`.
  - `card has no emoji glyphs and uses Buttons`: render one card (`TimelineCard` is exported from 4a) with `onOpenNote`; `queryByText(/📝|📆|🔢|🕑/)` is null; `getByRole('button', { name: '<title> 학습하기' })` and `'<title> 학습장'` exist (title without emoji); the date text is present.
  - Create `dockDrift.test.ts` with `FILES = ['src/kit/timeline/TimelinePanel.tsx']` and test `dock panels have no drift` (same shape as `uiDrift.test.ts`).
- [ ] **Step 2: Run** `npx jest __tests__/timeline.test.tsx __tests__/dockDrift.test.ts` → new tests FAIL (`splitLeadingIcon` not exported; drift lists `#000`, `#FF8800`, `'orange'`, numeric fontSize).
- [ ] **Step 3: Implement** per spec §4 row 1: title `type.title` + `colors.text`, no underline; subtitle `type.bodyStrong` + `colors.accentText`; month line `type.body` + `colors.subtle`; number line `type.caption` + `colors.muted`; date `type.caption` + `colors.muted`, right-aligned in its current place; icons Ionicons size 16 in `colors.muted` before the text; card bg `colors.card`; `ItemSeparatorComponent` → 1px (`StyleSheet.hairlineWidth * 2`) `colors.line`; 학습장 → `Button variant="secondary" size="sm"`, 가자!!! → `Button variant="primary" size="sm"`; footer spinner `colors.accent`. `describeTask` unchanged.
- [ ] **Step 4: Run** the same command → PASS (except the baseline `lists cards` failure, unchanged). `npm run typecheck` → exit 0.
- [ ] **Step 5: Commit** `git add` the three files, then `git commit -m "feat(ui): timeline cards on tokens, icons and shared buttons"` with the Co-Authored-By line.

### Task 2: Search dock tabs, delete 개념 (D2, D3)

**Files:**
- Modify: `src/kit/research/ResearchPanel.tsx`, `src/host/widgets.tsx:201` (type assertion only)
- Test: `__tests__/research.test.ts`, `__tests__/dockDrift.test.ts`

**Interfaces:**
- Produces: `export type ResearchCategory = 'recent' | 'pre' | 'mentor'`; `resolveInitialCategory(preset: string | undefined, store?)` — returns `preset` if in `CATEGORIES`, else stored value if in `CATEGORIES`, else `'recent'`.

- [ ] **Step 1: Write failing tests** in `research.test.ts`: change `restores the concept tab` to `stored concept falls back to recent` (`store('concept')` → `'recent'`); add `unknown preset falls back like a stored value` (`resolveInitialCategory('concept' as never, store('pre'))` → `'pre'`); add a render test `shows three tabs without 개념`: `getAllByRole('tab')` has labels `['2026','모의 고사','주제/묶음']`, `queryByText('개념')` null, the selected tab has `accessibilityState.selected === true`. Append `src/kit/research/ResearchPanel.tsx` to `dockDrift` `FILES`.
- [ ] **Step 2: Run** `npx jest __tests__/research.test.ts __tests__/dockDrift.test.ts` → FAIL on the three new/changed cases and drift (`#E5E5E5`).
- [ ] **Step 3: Implement:** remove `concept` from `CATEGORIES` and the type, remove the `ConceptLookupPanel` import and branch, tabs → `Chip accessibilityRole="tab" selected={category === c.key}`; widen `preset` param and check it with `CATEGORIES.some`. In `widgets.tsx` keep `props.category as ResearchCategory | undefined` compiling (one line at most). Do not touch `ConceptLookupPanel.tsx` or `registry.ts`.
- [ ] **Step 4: Run** same command → PASS; `npm run typecheck` → exit 0.
- [ ] **Step 5: Commit** `feat(ui): search dock tabs as chips and drop the concept tab`.

### Task 3: Exam search rows (D4)

**Files:**
- Modify: `src/kit/exam-search/ExamSearchPanel.tsx`
- Create: `__tests__/examSearchPanel.test.tsx`
- Test: `__tests__/dockDrift.test.ts`

**Interfaces:**
- Produces: in-file `ChipRow({ label, onClear?, children })`. With `onClear`: `Button variant="secondary" size="sm" icon="refresh" title={`${label} 선택`} accessibilityHint="선택을 모두 지웁니다" onPress={onClear}`. Without: `Text` in `type.bodyStrong` + `colors.subtle`. Local `Chip` removed; shared `Chip` with `accessibilityRole="radio"` for 계열, `"checkbox"` for the others.

- [ ] **Step 1: Write failing tests** (`examSearchPanel.test.tsx`, `mode="pre_exam"`, a fake `store` with `getString`/`set` jest.fn):
  - `시행월 선택 clears only months`: 11월 chip checked at start; press `getByRole('button', { name: '시행월 선택' })`; no month checkbox is checked; years and 계열 states unchanged; `store.set` not called.
  - `연도 and 번호 clear their own row` (same shape; press a 번호 chip first so it has something to clear).
  - `clearing an empty row keeps it empty` (Review Focus 2).
  - `subject change after clearing years restores default years` (Review Focus 3): clear 연도, press another 계열 radio, at least one year checkbox checked again.
  - `계열 has no clear button and uses radios`: `queryByRole('button', { name: '계열 선택' })` null; `getAllByRole('radio').length` = subjects count.
  - `this_year mode has no 연도 row`.
  - `가자!!! submits the query` → `onSubmit` called once.
  - Append the file to `dockDrift` `FILES`.
- [ ] **Step 2: Run** `npx jest __tests__/examSearchPanel.test.tsx __tests__/dockDrift.test.ts` → FAIL.
- [ ] **Step 3: Implement:** `onClear` for 연도 `() => setYears([])`, 시행월 `() => setMonths([])`, 번호 `() => setNumbers([])`; 가자!!! → `Button variant="primary" size="sm" title="가자!!!"`; notice `type.body` + `colors.danger`; row divider `colors.line`; root bg `colors.card`. Query builders untouched.
- [ ] **Step 4: Run** same command → PASS; typecheck exit 0.
- [ ] **Step 5: Commit** `feat(ui): exam search rows with shared chips and row clear buttons`.

### Task 4: Live class badge

**Files:**
- Modify: `src/kit/live-class/LiveClassListPanel.tsx:102-119`
- Test: `__tests__/liveClass.test.tsx`, `__tests__/dockDrift.test.ts`

- [ ] **Step 1: Write failing test** `count badge is an unread Tag`: render with a list giving a count; the count text's flattened style equals the `Tag tone="unread"` text style (compare against `render(<Tag label={n} tone="unread" />)`'s text style). Append the file to `FILES`.
- [ ] **Step 2: Run** `npx jest __tests__/liveClass.test.tsx __tests__/dockDrift.test.ts` → FAIL.
- [ ] **Step 3: Implement:** replace the badge `View`/`Text` with `<Tag label={count} tone="unread" />`; drop the badge styles.
- [ ] **Step 4: Run** → PASS; typecheck exit 0.
- [ ] **Step 5: Commit** `feat(ui): live class count badge as Tag`.

### Task 5: Profile dock (D7)

**Files:**
- Modify: `src/kit/profile/ProfileActions.tsx`, `src/kit/profile/MyInfoPanel.tsx`, `src/kit/profile/MessageBoxPanel.tsx`, `src/agent/tablet/TabletAgentLayer.tsx:152-157`
- Test: `__tests__/profileActions.test.tsx`, `__tests__/tabletDrawer.test.tsx`, `__tests__/dockDrift.test.ts`

- [ ] **Step 1: Write failing tests:**
  - Replace `lays out name, image, then logout (logout rightmost)` with `lists name, image, then logout last`: `getAllByRole('button')` names in order `['이름 변경','프로필 이미지 변경','로그아웃']`; 로그아웃 text color = `colors.danger`; no `textDecorationLine: 'underline'` on any.
  - `name dialog disables save for unchanged or blank names` (Review Focus 5): open dialog, `저장` has `accessibilityState.disabled` true with the current name and with `'   '`; pressing it does not call `editors.changeName`.
  - Keep `changes the name through the dialog` passing (`changeName` called once with the new name).
  - In `tabletDrawer.test.tsx`: `profile dock shows card, actions, then mailbox` — compare vertical order via the render tree index of the testIDs/labels for MyInfoPanel, `이름 변경`, and the mailbox title.
  - Append the three profile files to `FILES`.
- [ ] **Step 2: Run** `npx jest __tests__/profileActions.test.tsx __tests__/tabletDrawer.test.tsx __tests__/dockDrift.test.ts` → FAIL.
- [ ] **Step 3: Implement** per spec §4/§5.5: `Button variant="text" size="md"` for the first two, a 1px `colors.line` divider, then `Button variant="text" size="md" tone="danger"` 로그아웃. Name modal → `Dialog visible title="이름 변경" cancel={{}} confirm={{ title: '저장', disabled: trimmed === '' || trimmed === current, onPress: saveName }} onDismiss={close}` with the `TextInput` (same `maxLength={NAME_MAX}`, `autoFocus`, `onSubmitEditing={saveName}`) as children; `saveName` body unchanged. Tokens in `MyInfoPanel`/`MessageBoxPanel` (no layout change). `TabletAgentLayer`: reorder to `MyInfoPanel`, `ProfileActions`, `MessageBoxPanel`.
- [ ] **Step 4: Run** → PASS; typecheck exit 0.
- [ ] **Step 5: Commit** `feat(ui): profile dock actions as buttons, name Dialog, actions above mailbox`.

### Task 6: Diary dock (D5, D6, D6a) — `blocked` until D8

**Precondition:** the other session ("Diary Dock 풀이 구분선 추가") has committed its Diary changes and the user has said to merge them into this branch. Until then mark this task `blocked`, skip to Task 7, and come back. Merge only on the user's word; re-measure line numbers after it.

**Files:**
- Modify: `src/kit/diary/DiaryPanel.tsx`, `src/kit/diary/RecordsCalendar.tsx`, `src/kit/diary/DailyRecordsList.tsx`, `src/kit/notices/NoticesPanel.tsx`
- Test: `__tests__/diaryPanel.test.tsx`, `__tests__/dockDrift.test.ts`, plus whatever Diary tests the merged session added (must stay green)

**Interfaces:**
- Consumes (from the merged session): `DailyRecordsList` props `onSolve?(target: DiarySolveTarget)`, `DiarySolveTarget = { sourceType; sourceId; image; taskId? }`, testID `solution-divider`. Unchanged.

- [ ] **Step 1: Write failing tests** in `diaryPanel.test.tsx`:
  - `day tab is a selected tab chip with a separate close button`: open a day; `getByRole('tab', { name: '<M월/D일>' })` selected; press `getByRole('button', { name: '<M월/D일> 탭 닫기' })` → that tab gone, the notice tab stays.
  - `per-problem 가자!!! is a Button and calls onSolve once` with the problem's target.
  - `dividers: problem lineStrong, solution line`: flattened `backgroundColor` of the problem divider = `colors.lineStrong`, of `solution-divider` = `colors.line`.
  - `calendar arrows change month`: press `이전 달` / `다음 달` buttons, the month title changes.
  - `day count badge is an unread Tag` (same comparison as Task 4).
  - `풀이 목록 back is a button`.
  - Append the four files to `FILES` (for `NoticesPanel.tsx`, tokens only).
- [ ] **Step 2: Run** `npx jest __tests__/diaryPanel.test.tsx __tests__/dockDrift.test.ts` → FAIL.
- [ ] **Step 3: Implement** per spec §4/§5.4: `Tab` → `Chip accessibilityRole="tab" selected` + `IconButton size="sm" icon="close" accessibilityLabel={`${label} 탭 닫기`}` for closable tabs; remove the underline styles; tab bar border `colors.line`. Back → `Button variant="text" size="md" icon="chevron-back" title="풀이 목록"`. Calendar arrows → `IconButton size="md"` with labels `이전 달`/`다음 달`; badge → `Tag tone="unread"`. `DailyRecordsList`: 책갈피 추가/답안 예시 → `Button secondary sm`, 가자!!! → `Button primary sm` (row stays right-aligned), problem divider `colors.lineStrong`, `solutionDivider` `colors.line` with `marginVertical: 8` kept, `#FFFFFF` → `colors.card`. `NoticesPanel`: tokens only.
- [ ] **Step 4: Run** → PASS; typecheck exit 0.
- [ ] **Step 5: Commit** `feat(ui): diary dock tabs, buttons, dividers and calendar on shared parts`.

### Task 7: Inventory, notes, captures, Gate D request

**Files:**
- Modify: `docs/ui-redesign/03-components-inventory.md`, `docs/ui-redesign/04-pilot/shot-list.md`, the guide stage table (`docs/ui-redesign/1794280544402-contituous-guide.md`)
- Create: `docs/ui-redesign/04-pilot/4b-notes.md`

- [ ] **Step 1:** Update inventory rows for every file touched in Tasks 1–6 to new line numbers and "4b 됨"; §1.1 GoButton count; §5 icon-only row (Diary close, calendar arrows). Run `node docs/ui-redesign/tools/check-inventory.mjs docs/ui-redesign/03-components-inventory.md .` → `OK rows=<n>`.
- [ ] **Step 2:** Add 4b shots to `shot-list.md` per spec §7 (dock 다섯 칸, Diary 날 탭 with a 풀이 탭 open, 기출 검색 두 모드, 이름 변경 대화상자; `ipad-…` and `android-…` names).
- [ ] **Step 3:** Write `4b-notes.md` (Korean, 4a-notes shape): commits, test numbers, rulings, D2–D4 as exceptions to the visual-only rule, D8 status, what is left. Guide table: 4 → `승인대기` only if Task 6 is done; otherwise `진행` with "Diary blocked(D8)".
- [ ] **Step 4: Verify:** `npx jest > <workspace>/jest-4b.txt` and read the tail → failing set ⊆ baseline. `npm run typecheck` → exit 0. `git diff --stat f791a77 -- app src package.json` → only spec §4 files (+ the D8 merge commit's files, listed separately).
- [ ] **Step 5: Commit** `docs(ui-redesign): stage 4b inventory, notes and shot list`. Then request Gate D for all of stage 4 with real-iPad/Android "after" captures (user logs in with the test account; no simulator evidence).
