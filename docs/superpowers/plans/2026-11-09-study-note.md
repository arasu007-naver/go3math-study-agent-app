# 학습장(학습 노트) 입력 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 캔버스를 나갈 때 에이전트가 띄우고, 타임라인 카드에서도 여는 학습장 양식(칩과 짧은 텍스트)을 만들어 기존 task note API에 저장한다.

**Architecture:**
- 양식은 `src/kit/study-note/`에 fetcher 주입형 kit으로 만든다.
- 에이전트 명령 `show_component('study_note')`는 Stage를 바꾸지 않는다. 대신 세션 상태의 새 슬롯 `sheet`에 들어가고, 루트 레이아웃의 `SheetHost`가 이것을 모달 시트로 띄운다.
- 캔버스 화면은 언마운트될 때 `solve_finished`를 보낸다. 캔버스를 열기 전에는 `ensureTaskId`로 taskId를 확보한다.

**Tech Stack:** Expo SDK 54, React Native 0.81, TypeScript, zod, Apollo Client 4, react-native-mmkv, reanimated 4, Jest와 @testing-library/react-native

**Spec:** `docs/superpowers/specs/2026-11-09-study-note-design.md`

## Global Constraints

- **스타일:** `StyleSheet.create`와 `src/ui/theme.ts` 토큰(`colors`, `space`, `radius`, `type`)만 쓴다. 하위호환 토큰(`surface`, `ground`)은 쓰지 않는다. 새 스타일 라이브러리나 의존성은 추가하지 않는다.
- **주황 사용처:** 선택된 칩과 저장 버튼에만 쓴다(`colors.accent` / `accentSoft` / `accentText`).
- **크기:** 칩 높이는 32, `hitSlop`으로 누르는 영역을 44 이상으로 맞춘다.
- **문구:** 학생에게 존댓말을 쓴다. 문구는 스펙 §4·§5 원문 그대로 쓴다.
- **새 MMKV 키:** `agent:` 접두사를 붙인다. 초안 키는 `agent:studyNoteDraft:<taskId>`다. 스펙의 `studyNoteDraft:<taskId>`에 저장소 규칙(`src/storage/types.ts`)을 적용한 이름이다.
- **입력 길이:** `description`과 `expectations`는 각각 최대 200자다.
- **달성률 값:** 조금 25, 절반 50, 거의 75, 다 했어요 100.
- **어려웠던 점 칩 코드:** `concept`(개념), `setup`(식 세우기), `calc`(계산), `time`(시간), `none`(없음).
- **필기와 이탈을 막지 않는다:** taskId 확보에 실패해도 캔버스는 연다. 캔버스를 나갈 때 양식이 화면 이탈을 막지 않는다.
- **완료 조건:** 모든 작업을 마친 뒤 `npx expo lint`와 `npx tsc --noEmit`를 통과해야 한다.
- **스펙과 달라진 점(이 계획의 결정):** 태블릿에서도 drawer 대신 모달 시트로 띄운다. 양식이 뜨는 시점에는 캔버스가 이미 닫혀 있어 필기를 가릴 일이 없다. 그리고 Stage의 문제 목록을 덮어쓰지 않기 위해서다.

## Review Focus

1. **200자를 넘는 붙여넣기나 이모지가 섞인 입력:** 200자에서 잘리고 저장도 200자 이하로 된다. → Task 4
2. **기존 노트의 `achievementRate`가 25/50/75/100이 아닌 값(예: 60):** 칩은 아무것도 선택하지 않은 상태로 보이고, 학생이 칩을 고르지 않으면 원래 값이 그대로 저장된다. → Task 2
3. **기존 `difficulties`에 칩 코드가 아닌 자유 텍스트가 있는 경우:** 칩만 바꿔 저장해도 그 텍스트가 보존된다. → Task 2
4. **연필 버튼을 빠르게 두 번 누르는 경우:** 진행 중인 `createTask`를 공유해 task가 하나만 생긴다. → Task 7
5. **에이전트가 띄운 시트가 열려 있는데 타임라인에서 같은 task의 학습장을 또 여는 경우:** 시트는 하나만 있고, 저장 이벤트도 한 번만 나간다. → Task 5

---

### Task 1: 프로토콜·registry·세션에 시트 슬롯 추가

**Files:**
- Modify: `src/protocol/index.ts` (`AppEventPayloads`)
- Modify: `src/host/registry.ts`
- Modify: `src/agent/commandRouter.ts` (`RouterState`, `show_component`, `close_component`)
- Modify: `src/agent/session.ts`
- Test: `__tests__/studyNoteRouting.test.ts` (새 파일)

**Interfaces:**
- Produces:
  - `AppEventPayloads`에 다음 이벤트를 추가한다.
    - `solve_finished: { taskId?: number; kind: 'self' | 'topic_live' | 'hotline'; solvedCount: number }`
    - `study_note_saved: { taskId: number }`
    - `study_note_dismissed: { taskId: number }`
  - `RegistryEntry`에 `placement?: 'stage' | 'sheet'`를 추가한다. 기본값은 `'stage'`다.
  - registry `study_note`: `{ mode: 'both', placement: 'sheet', propsSchema: z.object({ taskId: z.number().int(), mode: z.enum(['self', 'live']), title: z.string().optional(), topicHints: z.array(z.string()).max(5).optional() }) }`. 추천 칩(주제명, 단원 태그)은 에이전트가 이미 가진 값으로 `topicHints`에 실어 보낸다.
  - registry `problem_list.source`의 `exam_query`와 `bookmarks`에 `taskId: z.number().int().optional()`를 추가한다. `problem_preview` props에도 같은 `taskId`를 추가한다.
  - `RouterState.sheet: StageView | null`. 초기값은 `null`이다.
  - `AgentSession.showLocalSheet(componentId: string, props: Record<string, unknown>): void`
  - `AgentSession.closeSheet(): void`

- [ ] **Step 1: 실패하는 테스트 작성** — `__tests__/studyNoteRouting.test.ts`
  - `routes study_note to the sheet slot without touching stage`
    - 먼저 `problem_list`가 떠 있는 상태를 만든다.
    - `show_component { componentId: 'study_note', props: { taskId: 7, mode: 'self' } }`를 보낸다.
    - 기대: `state.sheet`가 `{ componentId: 'study_note', props: { taskId: 7, mode: 'self' } }`이고, `state.stage.componentId === 'problem_list'`이며, ack는 `ok: true`.
  - `rejects study_note with invalid props`: props가 `{ taskId: 'x' }`이면 ack `code: 'invalid_props'`, `sheet === null`.
  - `close_component study_note clears only the sheet`: sheet만 비워지고 stage는 그대로 남는다.
  - `accepts optional taskId on exam_query and problem_preview`: `resolveComponent('problem_list', { source: { kind: 'exam_query', query: {}, taskId: 3 } }, 'tablet')`가 `ok`이고 결과 props에 `taskId: 3`이 남는다.
  - `session.showLocalSheet / closeSheet update the snapshot`: `MockAgentTransport` 대신 `{ connect(){}, send(){}, close(){} }` 같은 빈 transport로 `AgentSession`을 만들어 확인한다.

- [ ] **Step 2: 실패 확인**
  Run: `npx jest __tests__/studyNoteRouting.test.ts`
  Expected: FAIL. `sheet`가 undefined이고 `study_note`는 `unsupported`로 나온다.

- [ ] **Step 3: 구현**
  - registry에 위 항목을 추가한다.
  - `routeCommand`의 `show_component`에서 `registry[id].placement === 'sheet'`이면 `stage` 대신 `sheet`에 넣는다. 이때 `fallbackText`는 건드리지 않는다.
  - `close_component`는 `id`가 `sheet.componentId`와 같으면 `sheet`만 비운다. id가 없을 때의 동작은 기존 그대로 둔다(stage만 비움).
  - hello `capabilities.components`에 `study_note`가 자동으로 포함되는지 확인한다(registry 기반이라 추가 코드는 필요 없다).

- [ ] **Step 4: 통과 확인**
  Run: `npx jest __tests__/studyNoteRouting.test.ts __tests__/commandRouter.test.ts __tests__/session.test.ts`
  Expected: PASS

- [ ] **Step 5: 커밋**
  `git commit -m "feat(study-note): sheet slot and protocol events for the study note widget"`

---

### Task 2: 양식 모델과 초안 저장 (순수 로직)

**Files:**
- Create: `src/kit/study-note/model.ts`
- Create: `src/kit/study-note/draft.ts`
- Test: `__tests__/studyNoteModel.test.ts`

**Interfaces:**
- Produces (`model.ts`):
  ```ts
  export type DifficultyCode = 'concept' | 'setup' | 'calc' | 'time' | 'none';
  export const ACHIEVEMENTS: readonly { value: 25 | 50 | 75 | 100; label: '조금' | '절반' | '거의' | '다 했어요' }[];
  export const DIFFICULTIES: readonly { code: DifficultyCode; label: string }[]; // 개념·식 세우기·계산·시간·없음
  export type StudyNote = {
    taskId: number;
    description?: string | null;
    difficulties?: string | null;
    expectations?: string | null;
    achievementRate?: number | null;
    noteType?: string | null;
    tutorDescription?: string | null;
  };
  export type StudyNoteInput = { description?: string; difficulties?: string; expectations?: string; achievementRate?: number };
  export type FormState = {
    achievement: 25 | 50 | 75 | 100 | null;
    difficulties: DifficultyCode[];
    description: string;
    expectations: string;
    /** 칩에 없는 원래 값. 보존용 */
    legacyRate: number | null;
    legacyDifficultyText: string;
  };
  export const MAX_TEXT = 200;
  export function emptyForm(): FormState;
  export function fromNote(note: StudyNote | null): FormState;
  export function toggleDifficulty(codes: DifficultyCode[], code: DifficultyCode): DifficultyCode[];
  export function canSave(s: FormState): boolean;
  export function toInput(s: FormState, mode: 'self' | 'live'): StudyNoteInput;
  ```
- Produces (`draft.ts`): 아래 함수는 `src/storage/types.ts`의 `KeyValueStore`를 쓴다.
  ```ts
  export const draftKey: (taskId: number) => string; // `agent:studyNoteDraft:${taskId}`
  export function loadDraft(store: KeyValueStore, taskId: number): FormState | null; // JSON이 깨졌으면 null
  export function saveDraft(store: KeyValueStore, taskId: number, s: FormState): void;
  export function clearDraft(store: KeyValueStore, taskId: number): void;
  ```

- [ ] **Step 1: 실패하는 테스트 작성**
  - `toggleDifficulty`
    - `toggleDifficulty(['concept'], 'none')` → `['none']`
    - `toggleDifficulty(['none'], 'calc')` → `['calc']`
    - `toggleDifficulty(['calc'], 'calc')` → `[]`
  - `canSave`
    - `emptyForm()` → false
    - 달성률만 있으면 true, 칩 하나만 있으면 true, `description: '  '`이면 false
  - `toInput` 매핑
    - 입력: `{ achievement: 75, difficulties: ['concept', 'calc'], description: '일반항', expectations: '복습' }`, `'self'`
    - 기대: `{ achievementRate: 75, difficulties: 'concept,calc', description: '일반항', expectations: '복습' }`
    - `'live'` 모드에서는 `expectations` 키가 없다.
  - Review Focus 2: `fromNote({ taskId: 1, achievementRate: 60 })`
    - `achievement === null`, `legacyRate === 60`
    - 칩을 고르지 않고 `toInput`하면 `achievementRate: 60`이 남는다.
  - Review Focus 3: `fromNote({ taskId: 1, difficulties: 'concept,함수 그래프가 헷갈림' })`
    - `difficulties` → `['concept']`, `legacyDifficultyText` → `'함수 그래프가 헷갈림'`
    - `toInput` → `difficulties: 'concept,함수 그래프가 헷갈림'`
  - `toInput` 길이: `description`과 `expectations`는 `.trim()` 후 200자로 자른다. 비어 있으면 키를 빼고 보낸다.
  - `draft`
    - `saveDraft` → `loadDraft` 왕복이 같다.
    - 키는 `'agent:studyNoteDraft:7'`이다.
    - 깨진 JSON이면 null.
    - `clearDraft` 후 null.

- [ ] **Step 2: 실패 확인**
  Run: `npx jest __tests__/studyNoteModel.test.ts`
  Expected: FAIL. 모듈이 없다.

- [ ] **Step 3: 구현** — `model.ts`, `draft.ts`
  - `fromNote`는 `difficulties`를 `,`로 나눈다. 알려진 코드는 칩으로, 나머지 조각은 원래 순서대로 `,`로 다시 이어 `legacyDifficultyText`에 넣는다.

- [ ] **Step 4: 통과 확인**
  Run: `npx jest __tests__/studyNoteModel.test.ts`
  Expected: PASS

- [ ] **Step 5: 커밋**
  `git commit -m "feat(study-note): form model, field mapping and draft storage"`

---

### Task 3: 노트 fetcher와 저장 흐름

**Files:**
- Create: `src/kit/study-note/persist.ts`
- Create: `src/adapters/studyNoteFetchers.ts`
- Test: `__tests__/studyNoteFetchers.test.ts`

**Interfaces:**
- Consumes: Task 2의 `StudyNote`, `StudyNoteInput`
- Produces:
  ```ts
  // persist.ts
  export interface StudyNoteFetchers {
    fetchNote(taskId: number): Promise<StudyNote | null>;
    register(taskId: number, input: StudyNoteInput): Promise<void>;
    update(taskId: number, input: StudyNoteInput): Promise<void>;
  }
  /** existing: 열 때 조회한 결과. undefined = 조회 실패 */
  export function persistNote(f: StudyNoteFetchers, taskId: number, input: StudyNoteInput, existing: StudyNote | null | undefined): Promise<void>;
  // studyNoteFetchers.ts
  export function createStudyNoteFetchers(client: ApolloClient): StudyNoteFetchers;
  ```

- [ ] **Step 1: 실패하는 테스트 작성** — `persistNote`를 jest.fn으로 만든 fetcher로 검사한다.
  - `existing === null` → `register`를 1회 호출하고, `update`는 호출하지 않는다.
  - `existing`이 노트 → `update`를 1회 호출한다.
  - `existing === undefined` → `fetchNote`를 먼저 1회 호출하고, 결과에 따라 register 또는 update를 고른다. `fetchNote`가 throw하면 `persistNote`도 reject하고, register와 update는 호출하지 않는다(덮어쓰기 방지).
  - `register`가 reject하는 경우:
    - `fetchNote`를 다시 호출해 노트가 있으면 `update`로 1회 재시도하고 resolve한다.
    - 노트가 없으면 원래 에러로 reject한다.
  - `createStudyNoteFetchers`
    - 가짜 client의 `query`/`mutate` 호출을 확인한다.
    - `fetchNote`는 `STUDY_NOTE`를 `{ taskId }`와 `fetchPolicy: 'network-only'`로 조회한다. `studyNote`가 null이면 null을 돌려준다.
    - `register`는 `REGIST_TASK_NOTE`, `update`는 `UPDATE_STUDY_NOTE`를 `{ taskId, ...input }`로 호출한다.

- [ ] **Step 2: 실패 확인**
  Run: `npx jest __tests__/studyNoteFetchers.test.ts`
  Expected: FAIL

- [ ] **Step 3: 구현**
  - GraphQL 문서는 `src/api/graphql/queries/study.ts`와 `mutations/study.ts`의 기존 것을 그대로 쓴다.
  - `tutorDescription`은 서버 필드가 생기기 전까지 쿼리에 넣지 않는다. 매핑 결과는 `undefined`다(스펙 §7-3).

- [ ] **Step 4: 통과 확인**
  Run: `npx jest __tests__/studyNoteFetchers.test.ts`
  Expected: PASS

- [ ] **Step 5: 커밋**
  `git commit -m "feat(study-note): note fetchers and register/update persist flow"`

---

### Task 4: `StudyNoteForm` 컴포넌트

**Files:**
- Create: `src/kit/study-note/StudyNoteForm.tsx`
- Test: `__tests__/studyNoteForm.test.tsx`

**Interfaces:**
- Consumes: Task 2의 model과 draft, Task 3의 `StudyNoteFetchers`와 `persistNote`
- Produces:
  ```ts
  export function StudyNoteForm(props: {
    taskId: number;
    mode: 'self' | 'live';
    title: string;
    topicHints?: string[];
    fetchers: StudyNoteFetchers;
    store: KeyValueStore;
    onDone(result: 'saved' | 'dismissed'): void;
  }): JSX.Element;
  ```

**문구(스펙 원문):**
- 헤더: `학습장 · {title}`
- 질문과 레이블: `얼마나 해냈나요?` / `어려웠던 점 (여러 개)` / `공부한 내용`(self) · `한 줄 메모 (선택)`(live) / `▸ 다음 목표 (선택)` / `추천:`
- 버튼: `나중에` / `저장` · `수정` · `다시 저장`
- 안내:
  - 저장 실패: `저장하지 못했어요. 다시 시도해 주세요.`
  - 기존 노트 조회 실패: `이전 메모를 불러오지 못했어요`
  - 실황 수업 강의자 설명 캡션: `선생님 정리`
  - 강의자 설명 없음: `선생님 정리가 아직 없어요`

- [ ] **Step 1: 실패하는 테스트 작성** — RNTL로 검사한다. 가짜 fetchers와 `memoryStore` 같은 객체(`getString`/`set`/`remove`)를 쓴다.
  - `saves achievement and difficulty chips`
    - 노트 없음(`fetchNote` → null)
    - `거의`, `개념`, `계산`을 누르고 `저장`
    - 기대: `register(7, { achievementRate: 75, difficulties: 'concept,calc' })`, `onDone('saved')`
  - `save is disabled until something is entered`: `저장` 버튼의 `accessibilityState.disabled === true`
  - `chips expose radio/checkbox roles`: `거의`는 role `radio`, `개념`은 role `checkbox`. 누른 뒤 `accessibilityState.selected === true`
  - `prefills an existing note and labels the button 수정`: 기존 노트 `{ description: '일반항', achievementRate: 50 }`이면 입력칸 값이 `일반항`, `절반`이 선택됨, 버튼은 `수정`. 저장하면 `update`를 호출한다.
  - `live mode`
    - `선생님 정리`와 `선생님 정리가 아직 없어요`가 보인다.
    - `다음 목표` 토글이 없다.
    - 레이블이 `한 줄 메모 (선택)`이다.
  - `hint chip appends to description`: `topicHints={['일반항']}`이면 칩 `일반항`을 누른 뒤 입력칸 값에 `일반항`이 들어 있다. `topicHints`가 없으면 `추천:`이 보이지 않는다.
  - Review Focus 1: 201자 문자열을 `changeText`하면 입력칸의 `maxLength`가 200이고, 저장된 `description.length <= 200`이다.
  - `keeps input and draft when saving fails`
    - `register`가 reject한다.
    - 기대: 오류 문구가 보이고, 버튼이 `다시 저장`이며, `onDone`은 호출되지 않는다. `store.getString('agent:studyNoteDraft:7')`에 값이 있다.
    - 다시 렌더하면 초안이 복원된다.
    - 저장에 성공하면 초안 키가 지워진다.
  - `fetch failure shows notice and empty form`: `fetchNote`가 reject하면 `이전 메모를 불러오지 못했어요`가 보이고, 저장 시 `persistNote`에 `existing === undefined`가 넘어간다(`fetchNote`가 두 번째로 호출되는지로 확인).
  - `나중에 calls onDone('dismissed') without saving`

- [ ] **Step 2: 실패 확인**
  Run: `npx jest __tests__/studyNoteForm.test.tsx`
  Expected: FAIL

- [ ] **Step 3: 구현**
  - 처음 열 때 우선순위는 초안 → `fetchNote` 결과 → `emptyForm()`이다.
  - 입력이 바뀔 때마다 `saveDraft`, 저장에 성공하면 `clearDraft`.
  - `TextInput`에는 `maxLength={MAX_TEXT}`를 준다.
  - 칩 그룹은 `accessibilityRole="radiogroup"`와 그룹 레이블을 갖는다.
  - 키보드를 피하는 처리는 이 컴포넌트가 아니라 Task 5의 `SheetHost`가 맡는다.

- [ ] **Step 4: 통과 확인**
  Run: `npx jest __tests__/studyNoteForm.test.tsx`
  Expected: PASS

- [ ] **Step 5: 커밋**
  `git commit -m "feat(study-note): StudyNoteForm with chips, live mode and draft recovery"`

---

### Task 5: `SheetHost`, `study_note` 위젯, 루트 마운트

**Files:**
- Create: `src/host/SheetHost.tsx`
- Modify: `src/host/widgets.tsx` (`sheetWidgets`를 export)
- Modify: `app/_layout.tsx` (`<GlobalLoadingOverlay />` 바로 앞에 `<SheetHost />`)
- Test: `__tests__/sheetHost.test.tsx`

**Interfaces:**
- Consumes:
  - Task 1의 `RouterState.sheet`, `session.closeSheet()`, `study_note_saved`, `study_note_dismissed`
  - Task 4의 `StudyNoteForm`
- Produces:
  - `export const sheetWidgets: Record<string, (p: WidgetProps) => ReactElement>`. 항목은 `{ study_note: StudyNoteWidget }`이다.
  - `export function SheetHost({ state, session }?: { state?: SessionSnapshot; session?: AgentSession }): JSX.Element | null`. 인자가 없으면 `useAgentSession()`을 쓴다. 테스트에서는 인자를 주입한다.

- [ ] **Step 1: 실패하는 테스트 작성**
  - `renders the study note form when sheet is set`: `state.sheet = { componentId: 'study_note', props: { taskId: 7, mode: 'self', title: '21번' } }`이면 `학습장 · 21번`이 보인다.
  - `title defaults to 학습장 기록`: `title`이 없으면 헤더는 `학습장 · 학습장 기록`이다.
  - `passes topicHints through`: props에 `topicHints: ['일반항']`이 있으면 추천 칩 `일반항`이 보인다.
  - `saved → emits study_note_saved once and closes`: `session.emit`이 `('study_note_saved', { taskId: 7 })`로 정확히 1회 호출되고, `closeSheet`도 1회 호출된다.
  - `dismissed → emits study_note_dismissed and closes`
  - `renders nothing when sheet is null`
  - Review Focus 5: sheet props를 `{ taskId: 7 }`에서 `{ taskId: 8 }`로 바꿔 다시 렌더하면 form이 `key`로 다시 마운트되어 8의 노트를 조회한다(`fetchNote(8)`). 그 상태에서 저장하면 `study_note_saved`가 `taskId: 8`로 1회만 나간다.

- [ ] **Step 2: 실패 확인**
  Run: `npx jest __tests__/sheetHost.test.tsx`
  Expected: FAIL

- [ ] **Step 3: 구현**
  - RN `Modal`을 `transparent`로 띄우고, 뒤에 `colors.scrim`을 깐다.
    - 폰: 카드가 화면 아래에 붙는다.
    - 태블릿: 아래 가운데에 최대 너비 560인 카드로 띄운다.
  - `animationType`은 reanimated의 `useReducedMotion()`이 true면 `'fade'`, 아니면 `'slide'`다.
  - `KeyboardAvoidingView`의 `behavior`는 iOS에서 `'padding'`이다.
  - 배경을 탭하면 `onDone('dismissed')`와 같은 동작을 한다.
  - `<StudyNoteForm key={taskId} …>`에 다음을 넘긴다.
    - `fetchers`: `createStudyNoteFetchers(apolloClient)` (모듈 상수)
    - `store`: `storage`

- [ ] **Step 4: 통과 확인**
  Run: `npx jest __tests__/sheetHost.test.tsx`
  Expected: PASS

- [ ] **Step 5: 커밋**
  `git commit -m "feat(study-note): sheet host renders the study_note widget app-wide"`

---

### Task 6: 타임라인 카드 학습장 요약과 버튼

**Files:**
- Modify: `src/kit/timeline/TimelinePanel.tsx`
- Modify: `src/agent/tablet/TabletAgentLayer.tsx` (dock `timeline`)
- Modify: `src/phone/PhoneScreens.tsx` (`TimelineTabScreen`)
- Test: `__tests__/timeline.test.tsx` (기존 파일 확장)

**Interfaces:**
- Consumes: Task 1의 `session.showLocalSheet`, Task 2의 `ACHIEVEMENTS`
- Produces:
  - `TimelineTask.note?: { description?: string | null; achievementRate?: number | null; noteType?: string | null; tutorDescription?: string | null } | null`
  - `export function describeNote(t: TimelineTask): string | null`
    - 요약 텍스트는 `✏️ {text} · {달성률 라벨}`이다.
    - `text`는 `tutorDescription ?? description`이다.
    - 라벨이 없으면 ` · …` 부분을 뺀다.
    - 둘 다 비어 있으면 null이다.
  - `export function noteModeOf(t: TimelineTask): 'self' | 'live'`: `note.noteType === 'tutor'`이거나 `tutorDescription`이 있으면 `'live'`다.
  - `TimelinePanel` prop: `onOpenNote?(task: TimelineTask): void`

- [ ] **Step 1: 실패하는 테스트 작성** (기존 테스트는 그대로 통과해야 한다)
  - `describeNote`
    - `{ note: { description: '일반항 구하기', achievementRate: 75 } }` → `'✏️ 일반항 구하기 · 거의'`
    - `{ note: { tutorDescription: '귀납적 정의', description: '나' } }` → `'✏️ 귀납적 정의'`
    - `{ note: null }` → `null`
  - `noteModeOf`: `{ note: { noteType: 'tutor' } }` → `'live'`, `{}` → `'self'`
  - `shows note summary or placeholder and opens the note`
    - `onOpenNote`를 주면 노트가 없는 카드에 `학습장을 남겨 보세요`가 보인다.
    - 라벨 `📝 기출 검색 학습장` 버튼을 누르면 `onOpenNote(selection)`이 호출된다.
  - `no note button without onOpenNote`: 기존 테스트의 `getAllByRole('button')` 개수 1이 유지된다.

- [ ] **Step 2: 실패 확인**
  Run: `npx jest __tests__/timeline.test.tsx`
  Expected: FAIL

- [ ] **Step 3: 구현**
  - 요약 줄은 날짜 줄 위에 `numberOfLines={1}`로 둔다.
    - 노트가 있으면 `colors.subtle`, 없으면 `colors.muted`.
  - "학습장" 버튼은 "가자!!!" 왼쪽에 둔다. 테두리 `colors.lineStrong`, 높이 32, `hitSlop` 6.
  - 두 호출부에서 다음을 연결한다.
    ```ts
    onOpenNote={(t) => session.showLocalSheet('study_note', {
      taskId: Number(t.id),
      mode: noteModeOf(t),
      title: describeTask(t).title.replace(/^📝\s*/, ''),
    })}
    ```
  - `MY_TASKS` 쿼리에는 `note` 필드를 아직 추가하지 않는다. 서버 계약 §7-4가 생기면 추가한다. 그 전에는 `note`가 undefined이므로 placeholder가 보인다.

- [ ] **Step 4: 통과 확인**
  Run: `npx jest __tests__/timeline.test.tsx`
  Expected: PASS

- [ ] **Step 5: 커밋**
  `git commit -m "feat(timeline): study note summary and 학습장 button on task cards"`

---

### Task 7: 캔버스 진입 전 taskId 확보와 종료 시 `solve_finished`

**Files:**
- Create: `src/adapters/ensureTask.ts`
- Create: `src/host/useSolveFinished.ts`
- Modify: `src/host/widgets.tsx` (`openNotebook` / `openTopicLiveClass` / `openHotlineClass`와 그 호출부)
- Modify: `src/agent/tablet/TabletAgentLayer.tsx` (실황 수업 dock과 Diary dock의 캔버스 열기 호출부)
- Modify: `src/phone/PhoneScreens.tsx` (캔버스 열기 호출부가 있으면)
- Modify: `app/notebook.tsx`, `app/topic-live-class.tsx`, `app/hotline-class.tsx`
- Test: `__tests__/ensureTask.test.ts`, `__tests__/solveFinished.test.tsx`

**Interfaces:**
- Consumes: Task 1의 `solve_finished`, `src/api/graphql/mutations/task.ts`의 `CREATE_SELECTION_TASK`
- Produces:
  ```ts
  // ensureTask.ts
  export type TaskSpec = { taskType: 'selection' | 'topic' | 'bookmark' | 'hotline' | 'list'; task: Record<string, unknown> };
  export function createEnsureTask(deps: {
    create(spec: TaskSpec): Promise<number>;
    report(where: string, message: string): void;
  }): (taskId: number | undefined, spec: TaskSpec) => Promise<number | undefined>;
  export const ensureTaskId: ReturnType<typeof createEnsureTask>; // apolloClient + getAgentSession().emit('client_error')로 조립
  // useSolveFinished.ts
  export function useSolveFinished(a: { taskId?: number; kind: 'self' | 'topic_live' | 'hotline' }): { countSolved(): void };
  ```
  - `open*` 함수는 `async`가 되고, 마지막 인자로 `spec?: TaskSpec`을 받는다. taskId가 없고 spec이 있으면 `ensureTaskId`를 거친 뒤 화면을 연다.
  - 호출부의 spec은 다음과 같다.

    | 출처 | spec |
    |---|---|
    | 기출 검색 `exam_query` | `{ taskType: 'selection', task: query }` |
    | 주제 `problem_preview` | `{ taskType: 'topic', task: { topicId } }` |
    | 책갈피 | `{ taskType: 'bookmark', task: { units } }` |
    | 주제 실황 | `{ taskType: 'topic', task: { topicId } }` |
    | 선생님 수업 | `{ taskType: 'hotline', task: { tutorId } }` |
    | Diary `list` | `{ taskType: 'list', task: { problems: [{ sourceType, sourceId }] } }` |

  - `create`는 기존 `CREATE_SELECTION_TASK`(`$taskType`, `$task`)를 `{ taskType: spec.taskType, task: JSON.stringify(spec.task) }`로 호출하고 `createTask.id`를 숫자로 돌려준다.
  - **서버 확인 필요:** `hotline`과 `list`는 기존 앱에 없던 taskType이다. 서버가 이 값을 거절하면 `ensureTaskId`는 `undefined`를 돌려주고 `client_error`를 보고한다. 캔버스는 그대로 열리고, 그 세션에서는 학습장을 묻지 않는다.

- [ ] **Step 1: 실패하는 테스트 작성**
  - `ensureTask.test.ts`
    - taskId가 있으면 `create`를 호출하지 않고 그 값을 돌려준다.
    - 없으면 `create`의 결과를 돌려준다.
    - `create`가 reject하면 `undefined`를 돌려주고, `report('study_note.ensure_task', …)`를 1회 호출한다.
    - Review Focus 4: 같은 spec(`JSON.stringify` 기준)으로 동시에 두 번 호출하면 `create`는 1회만 호출되고 두 호출 모두 같은 id를 받는다. 완료된 뒤 다시 호출하면 새로 만든다.
  - `solveFinished.test.tsx`: `useSolveFinished`를 쓰는 테스트 컴포넌트를 렌더하고, `countSolved()`를 2번 부른 뒤 unmount한다.
    - 기대: `emit('solve_finished', { taskId: 7, kind: 'self', solvedCount: 2 })` 1회
    - taskId가 undefined이면 payload에 `taskId` 키가 없다.
    - emit 대상은 `jest.mock('../src/agent/useAgentSession')`로 가로챈다.

- [ ] **Step 2: 실패 확인**
  Run: `npx jest __tests__/ensureTask.test.ts __tests__/solveFinished.test.tsx`
  Expected: FAIL

- [ ] **Step 3: 구현**
  - `useSolveFinished`는 언마운트될 때 `getAgentSession().emit`을 호출한다. 언마운트를 기준으로 하면 나가기 버튼, 뒤로가기, 제스처 같은 모든 종료 경로가 한곳에서 처리된다.
  - `notebook.tsx`: `onSave` 안에서 `countSolved()`를 호출한다.
  - `topic-live-class.tsx`와 `hotline-class.tsx`: 풀이 저장 성공 지점(각 파일의 `CREATE_RECORD` 호출)에서 `countSolved()`를 호출한다.
  - `taskId`는 notebook에서는 `solveStore`에서 읽는다. 다른 두 화면에서는 params를 읽고, 0이면 undefined로 취급한다.

- [ ] **Step 4: 통과 확인**
  Run: `npx jest __tests__/ensureTask.test.ts __tests__/solveFinished.test.tsx __tests__/problemList.test.tsx __tests__/liveClass.test.tsx`
  Expected: PASS

- [ ] **Step 5: 커밋**
  `git commit -m "feat(study-note): ensure a task before opening canvases and emit solve_finished on exit"`

---

### Task 8: mockAgent가 학습장을 묻게 하고 최종 점검

**Files:**
- Modify: `src/agent/mockAgent.ts`
- Test: `__tests__/session.test.ts` (확장)

**Interfaces:**
- Consumes: Task 1의 이벤트와 `study_note` registry

- [ ] **Step 1: 실패하는 테스트 작성**
  - `MockAgentTransport`에 `solve_finished { taskId: 7, kind: 'self', solvedCount: 1 }`를 보내면 `show_component { componentId: 'study_note', props: { taskId: 7, mode: 'self' } }`가 온다.
  - `kind: 'topic_live'`이면 `mode: 'live'`다.
  - `taskId`가 없거나 `solvedCount === 0`이면 아무 명령도 오지 않는다.
  - `study_note_saved { taskId: 7 }` 뒤에 같은 taskId로 `solve_finished`를 보내면 다시 묻지 않는다.
  - 저장 후 `timeline_append`로 `kind: 'task'`, 제목 `학습장을 남겼어요` 항목이 온다.

- [ ] **Step 2: 실패 확인**
  Run: `npx jest __tests__/session.test.ts`
  Expected: FAIL

- [ ] **Step 3: `send` switch에 세 이벤트를 처리하는 case 추가**
  - 노트를 남긴 taskId는 `Set<number>`로 기억한다.
  - `study_note_dismissed`는 무시한다.

- [ ] **Step 4: 전체 검증**
  Run: `npx jest && npx expo lint && npx tsc --noEmit`
  Expected: 테스트, lint, typecheck가 모두 통과한다.

- [ ] **Step 5: 커밋**
  `git commit -m "feat(study-note): mock agent asks for a study note after solving"`
