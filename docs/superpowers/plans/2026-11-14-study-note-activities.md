# 학습장 활동 기록(activities) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 캔버스에서 조회한 개념과 받은 퀴즈 id를 task별로 모아 학습장(`task_note.activities`)에 저장하고, 학습장 양식에서 추천 칩과 퀴즈 개수로 보여 준다.

**Architecture:** 캔버스에 들어가 있는 동안의 기록은 모듈 store(`canvasActivityStore`)에 쌓는다. 캔버스가 언마운트될 때 `useSolveFinished`가 taskId 키로 MMKV에 합쳐 쓴다. `StudyNoteForm`은 서버 노트의 `activities`와 MMKV 기록을 합쳐 보여 주고, 저장할 때 JSON 문자열로 보낸다.

**Tech Stack:** Expo / React Native, TypeScript, Apollo Client(GraphQL), react-native-mmkv(`KeyValueStore`), Jest + React Native Testing Library

**Spec:** `docs/superpowers/specs/2026-11-14-study-note-activities-design.md`

## Global Constraints

- 서버 선행: `registerTaskNote`·`updateTaskNote`의 `activities: String` 인자와 `studyNote.activities` 필드가 배포된 뒤에 Task 2 이후를 배포한다. 서버에 없으면 저장 전체가 실패한다.
- JSON 모양: `{ "v": 1, "concepts": [{ "id": number, "title": string }], "quizIds": number[] }`. `title`은 `MathConcept.rawTitle`.
- MMKV 키: `agent:studyNoteActivity:<taskId>`
- description에는 자동으로 써넣지 않는다. `MAX_TEXT`(200) 그대로.
- 문구는 존댓말. 퀴즈 줄 문구는 정확히 `수업 퀴즈 n개`.
- 기존 코드의 무관한 부분은 고치지 않는다.
- 완료 조건: `npx jest`, `npx expo lint`, `npx tsc --noEmit` 통과.

## Review Focus

1. 같은 task에 두 번 들어가 같은 개념을 다시 봄 → 기록에 한 번만 남는다(Task 1 합치기 테스트).
2. `activities`가 JSON이 아니거나 `concepts`가 배열이 아님 → 양식이 죽지 않고 빈 기록으로 연다(Task 1 파싱 테스트, Task 4 양식 테스트).
3. 캔버스에 들어오기 전 검색 dock에서 골라 둔 개념 → 이번 캔버스 기록에 들어가지 않는다(Task 3 테스트).
4. 풀이를 올리지 않고 나감(taskId 없음) → MMKV에 아무것도 쓰지 않고, 다음 캔버스에 기록이 넘어가지 않는다(Task 3 테스트).
5. 노트 조회가 실패한 상태에서 저장 → 다시 조회한 서버 기록과 합쳐 보내 서버의 기존 기록을 지우지 않는다(Task 4 테스트).

---

### Task 1: 활동 기록 모델과 로컬 저장

**Files:**
- Create: `src/kit/study-note/activity.ts`
- Test: `__tests__/studyNoteActivity.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type Activities = { v: 1; concepts: { id: number; title: string }[]; quizIds: number[] };
  export function emptyActivities(): Activities;
  export function isEmptyActivities(a: Activities): boolean;
  /** id 기준 합집합. 순서는 a 먼저, 그다음 b에서 새로 나온 것 */
  export function mergeActivities(a: Activities, b: Activities): Activities;
  /** null·깨진 JSON·모양이 다른 값은 emptyActivities(). 모양이 맞는 항목만 남긴다 */
  export function parseActivities(raw: string | null | undefined): Activities;
  export const activityKey: (taskId: number) => string; // `agent:studyNoteActivity:${taskId}`
  export function loadActivity(store: KeyValueStore, taskId: number): Activities;
  /** 이미 있는 기록에 합쳐 쓴다. add가 비었으면 쓰지 않는다 */
  export function appendActivity(store: KeyValueStore, taskId: number, add: Activities): void;
  export function clearActivity(store: KeyValueStore, taskId: number): void;
  ```
  `KeyValueStore`는 `src/storage/types`의 것이다(`src/kit/study-note/draft.ts`와 같은 방식).

- [ ] **Step 1: 실패하는 테스트 작성** — `__tests__/studyNoteActivity.test.ts`. store는 `Map` 기반 가짜 `KeyValueStore`.

```ts
const A = { v: 1 as const, concepts: [{ id: 1, title: '일반항' }], quizIds: [45] };
const B = { v: 1 as const, concepts: [{ id: 1, title: '일반항' }, { id: 2, title: '점화식' }], quizIds: [45, 46] };

it('합칠 때 id가 같은 것은 한 번만, 처음 본 순서로 남긴다', () => {
  expect(mergeActivities(A, B)).toEqual({ v: 1, concepts: [{ id: 1, title: '일반항' }, { id: 2, title: '점화식' }], quizIds: [45, 46] });
});
it.each([null, undefined, '', 'not json', '[]', '{"concepts":"x"}'])('깨진 값 %p은 빈 기록', (raw) => {
  expect(parseActivities(raw)).toEqual(emptyActivities());
});
it('모양이 맞는 항목만 남긴다', () => {
  expect(parseActivities('{"v":1,"concepts":[{"id":1,"title":"a"},{"id":"x"}],"quizIds":[3,"4",null]}'))
    .toEqual({ v: 1, concepts: [{ id: 1, title: 'a' }], quizIds: [3] });
});
it('appendActivity는 기존 기록에 합쳐 쓰고, 빈 기록은 쓰지 않는다', () => {
  appendActivity(store, 7, emptyActivities());
  expect(store.getString(activityKey(7))).toBeUndefined();
  appendActivity(store, 7, A);
  appendActivity(store, 7, B);
  expect(loadActivity(store, 7)).toEqual(mergeActivities(A, B));
  clearActivity(store, 7);
  expect(loadActivity(store, 7)).toEqual(emptyActivities());
});
it('activityKey', () => expect(activityKey(7)).toBe('agent:studyNoteActivity:7'));
```

- [ ] **Step 2: 실패 확인** — `npx jest __tests__/studyNoteActivity.test.ts` → 모듈 없음으로 FAIL
- [ ] **Step 3: `src/kit/study-note/activity.ts` 구현** (위 Interfaces 그대로)
- [ ] **Step 4: 통과 확인** — `npx jest __tests__/studyNoteActivity.test.ts` → PASS
- [ ] **Step 5: Commit** — `feat(study-note): 활동 기록 모델과 로컬 저장`

---

### Task 2: GraphQL과 fetcher에 activities 싣기

**Files:**
- Modify: `src/api/graphql/queries/study.ts`(`STUDY_NOTE`에 `activities` 필드)
- Modify: `src/api/graphql/mutations/study.ts`(`REGIST_TASK_NOTE`·`UPDATE_STUDY_NOTE`에 `$activities: String` 변수와 `activities: $activities` 인자)
- Modify: `src/kit/study-note/model.ts`(`StudyNote`에 `activities?: string | null`, `StudyNoteInput`에 `activities?: string`)
- Test: `__tests__/studyNoteFetchers.test.ts`

**Interfaces:**
- Produces: `StudyNote.activities`, `StudyNoteInput.activities`(둘 다 JSON 문자열). `src/adapters/studyNoteFetchers.ts`는 `...input`과 `...note`를 그대로 넘기므로 고치지 않는다.

- [ ] **Step 1: 실패하는 테스트 추가** — 기존 `studyNoteFetchers.test.ts`의 mock client 패턴을 따른다.
  - `fetchNote`: 응답 `studyNote.activities`가 `'{"v":1,"concepts":[],"quizIds":[45]}'`이면 결과의 `activities`가 같은 문자열이다.
  - `register`·`update`: `input.activities`가 mutation `variables.activities`로 간다.
  - `print(STUDY_NOTE)`에 `activities`가, `print(REGIST_TASK_NOTE)`·`print(UPDATE_STUDY_NOTE)`에 `activities: $activities`가 들어 있다(`print`는 `graphql`).
- [ ] **Step 2: 실패 확인** — `npx jest __tests__/studyNoteFetchers.test.ts` → FAIL
- [ ] **Step 3: 위 세 파일 수정**
- [ ] **Step 4: 통과 확인** — `npx jest __tests__/studyNoteFetchers.test.ts` → PASS, `npx tsc --noEmit` → 오류 없음
- [ ] **Step 5: Commit** — `feat(study-note): 학습장 조회·저장에 activities 필드 추가`

---

### Task 3: 캔버스에서 수집하고 나갈 때 로컬에 남기기

**Files:**
- Create: `src/state/canvasActivity.ts`
- Modify: `src/host/useSolveFinished.ts`
- Modify: `src/kit/canvas/CanvasStudySheet.tsx:54`
- Modify: `app/topic-live-class.tsx`(`setLiveQuiz`를 부르는 두 곳: 약 98행, 240행)
- Modify: `app/hotline-class.tsx`(같은 두 곳: 약 126행, 232행)
- Test: `__tests__/canvasActivity.test.ts`, `__tests__/solveFinished.test.tsx`, `__tests__/canvasStudySheet.test.tsx`

**Interfaces:**
- Consumes: Task 1의 `Activities`, `emptyActivities`, `mergeActivities`, `appendActivity`
- Produces:
  ```ts
  // src/state/canvasActivity.ts — createStore(src/state/createStore.ts) 사용
  type Action =
    | { type: 'reset' }
    | { type: 'concepts'; concepts: { id: number; rawTitle: string }[] }
    | { type: 'quiz'; quizId: number };
  export const canvasActivityStore: { getState(): Activities; dispatch(a: Action): void; ... };
  ```
  `quiz`의 `quizId`가 유한한 수가 아니면 상태를 바꾸지 않는다. `concepts`·`quiz` 모두 `mergeActivities`로 합친다.

**동작 결정:**
- `useSolveFinished`: 마운트 effect에서 `canvasActivityStore.dispatch({ type: 'reset' })`. 언마운트 cleanup에서 `solve_finished`를 보내기 전에, taskId가 있으면 `appendActivity(storage, taskId, canvasActivityStore.getState())`를 부른다. `storage`는 `src/host/widgets.tsx`가 `StudyNoteForm`에 넘기는 것과 같은 것을 import한다.
- `CanvasStudySheet`: `onPickedChange`를 다음으로 바꾼다. 이번에 새로 고른 것만 기록한다.
  ```ts
  onPickedChange={(next) => {
    const added = next.filter((c) => !pickedConcepts.some((p) => p.id === c.id));
    if (added.length) canvasActivityStore.dispatch({ type: 'concepts', concepts: added });
    pickedConceptsStore.dispatch(next);
  }}
  ```
- 두 실황 화면: `const receiveQuiz = useCallback((q: LiveQuiz) => { canvasActivityStore.dispatch({ type: 'quiz', quizId: Number(q.quizId) }); setLiveQuiz(q); }, []);`를 두고, `setLiveQuiz({ quizId: ..., content: ... })` 호출과 `onQuizReceived={setLiveQuiz}`를 `receiveQuiz`로 바꾼다. `onClose={() => setLiveQuiz(null)}`은 그대로 둔다.

- [ ] **Step 1: 실패하는 테스트 작성**
  - `canvasActivity.test.ts`: `concepts`를 두 번 보내도 id당 하나(`title`은 `rawTitle`), `quiz` 45·45·46 → `[45, 46]`, `quiz` NaN → 변화 없음, `reset` → `emptyActivities()`.
  - `solveFinished.test.tsx`(기존 패턴에 추가):
    - taskId 7로 마운트 → store에 개념 1개·퀴즈 1개 dispatch → 언마운트 → `loadActivity(storage, 7)`에 그 기록이 있다.
    - taskId 없이 마운트 → dispatch → 언마운트 → storage에 `agent:studyNoteActivity:`로 시작하는 키가 없다.
    - 위 뒤에 다시 마운트하면 `canvasActivityStore.getState()`가 `emptyActivities()`다.
  - `canvasStudySheet.test.tsx`(기존 패턴에 추가): `pickedConceptsStore`에 `{id:1}`이 미리 있는 상태에서 `ConceptLookupPanel`의 `onPickedChange`가 `[{id:1,...},{id:2,rawTitle:'점화식'}]`로 불리면 `canvasActivityStore.getState().concepts`는 `[{ id: 2, title: '점화식' }]`이다.
- [ ] **Step 2: 실패 확인** — `npx jest __tests__/canvasActivity.test.ts __tests__/solveFinished.test.tsx __tests__/canvasStudySheet.test.tsx` → FAIL
- [ ] **Step 3: 구현** (위 동작 결정대로)
- [ ] **Step 4: 통과 확인** — 같은 명령 → PASS, `npx tsc --noEmit` → 오류 없음
- [ ] **Step 5: Commit** — `feat(canvas): 조회한 개념과 받은 퀴즈를 task별로 기록`

---

### Task 4: 학습장 양식에 보여 주고 저장하기

**Files:**
- Modify: `src/kit/study-note/StudyNoteForm.tsx`
- Test: `__tests__/studyNoteForm.test.tsx`

**Interfaces:**
- Consumes: Task 1의 `parseActivities`, `loadActivity`, `mergeActivities`, `isEmptyActivities`, `clearActivity`; Task 2의 `StudyNote.activities`, `StudyNoteInput.activities`
- Produces: props 변화 없음(`StudyNoteFormProps` 그대로)

**동작 결정:**
- 보여 줄 기록: `mergeActivities(parseActivities(existing?.activities), loadActivity(store, taskId))`.
- 추천 줄: `topicHints` 뒤에 개념 제목을 붙이고 같은 문구는 한 번만 보여 준다. 합친 목록이 비면 추천 줄을 숨긴다. 누르면 기존 `addHint`를 쓴다.
- 퀴즈 줄: `quizIds.length > 0`이면 입력칸 아래에 `styles.caption`으로 `수업 퀴즈 ${n}개`.
- `save`:
  1. `const current = existing === undefined ? await fetchers.fetchNote(taskId) : existing;`(실패하면 기존처럼 catch로 간다)
  2. `current`의 `activities`와 로컬 기록을 합친다. 비어 있지 않으면 `input.activities = JSON.stringify(merged)`, 비었으면 키를 넣지 않는다.
  3. `persistNote(fetchers, taskId, input, current)`. `persist.ts`는 고치지 않는다.
  4. 성공하면 `clearDraft`와 함께 `clearActivity(store, taskId)`.
- "나중에"는 로컬 기록을 지우지 않는다.

- [ ] **Step 1: 실패하는 테스트 추가** — 기존 `studyNoteForm.test.tsx`의 가짜 fetchers·store 패턴을 따른다. 로컬 기록은 `appendActivity(store, 7, ...)`로 넣는다.
  - 로컬에 개념 `일반항`, `topicHints=['수열']` → 칩 `수열`·`일반항`이 보이고, `일반항`을 누르면 입력칸 값이 `일반항`이다.
  - `topicHints` 없이 로컬 개념만 있어도 추천 줄이 보인다. 둘 다 없으면 `추천:`이 없다.
  - `topicHints=['일반항']`이고 개념도 `일반항`이면 칩은 하나다.
  - 서버 `activities`에 퀴즈 45, 로컬에 퀴즈 46 → `수업 퀴즈 2개`가 보인다. 퀴즈가 없으면 그 줄이 없다.
  - 서버 `activities`가 `'not json'`이어도 렌더링되고 저장할 수 있다.
  - 칩 하나 고르고 저장 → `update`(또는 `register`)의 input `activities`를 `JSON.parse`하면 서버와 로컬을 합친 값이다. 저장 뒤 `loadActivity(store, 7)`은 빈 기록이다.
  - 기록이 전혀 없으면 input에 `activities` 키가 없다.
  - "나중에" → `loadActivity(store, 7)`이 그대로 남는다.
  - 첫 `fetchNote`는 reject, 저장 때의 두 번째 `fetchNote`는 `activities`에 개념 1을 가진 노트 → 보낸 `activities`에 개념 1과 로컬 기록이 모두 있다.
  - 저장 실패(`update` reject) → 로컬 기록이 남는다.
- [ ] **Step 2: 실패 확인** — `npx jest __tests__/studyNoteForm.test.tsx` → FAIL
- [ ] **Step 3: `StudyNoteForm.tsx` 수정**
- [ ] **Step 4: 통과 확인** — `npx jest` 전체 → PASS, `npx expo lint`·`npx tsc --noEmit` → 오류 없음
- [ ] **Step 5: Commit** — `feat(study-note): 학습장에 조회한 개념 추천과 수업 퀴즈 개수 표시`
