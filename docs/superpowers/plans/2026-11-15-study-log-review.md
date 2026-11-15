# Study Log 학습장 목록과 '돌아보기' Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Study Log 독에 `이번 주 학습장 | 메시지` 탭을 두고, 학습장 카드의 '돌아보기'로 그 task의 풀이 업로드·퀴즈 답을 펼친다. 타임라인과 목록은 학생 행동 뒤 늘 새로 조회하고, 퀴즈 답은 task id와 함께 보낸다.

**Architecture:** api-v3 REST(`/api/study-notes?from=`, `/api/study-notes/{taskId}/activities`)를 kit 포트 + adapter로 감싼다. 앱 공용 숫자 store `studyDataVersion`을 행동 지점에서 올리고, 목록·타임라인이 그 값을 `refreshKey`로 받아 다시 조회한다. 탭 상태는 태블릿 `TabletAgentLayer`와 폰 `ChatTabScreen`이 들고, 내용은 공용 `StudyLogPanel`이 그린다.

**Tech Stack:** Expo SDK 54, RN 0.81, React 19.1, Apollo, jest + @testing-library/react-native.

**Spec:** `docs/superpowers/specs/2026-11-15-study-log-review-design.md`

## Global Constraints

- 스타일은 `StyleSheet.create` + `src/ui/theme.ts` 토큰. 주황은 동작에만. 문구는 한국어 존댓말.
- 이번 주 = 이번 주 월요일(KST) `YYYY-MM-DD`.
- 목록은 `CARD_TYPES`(selection, collection, topic, topic-live, hotline, bookmark)만.
- 업로드 `createdAt`은 오프셋 없는 KST 문자열.
- 손대지 않을 파일: `src/kit/canvas/note-canvas/{hotline-class-canvas,notebook,topic-live-canvas}.tsx`, `docs/superpowers/specs/2026-11-15-study-note-crud-api-design.md`(사용자 미커밋 변경).
- 완료 전 `npx jest`, `npx tsc --noEmit`, `npx expo lint`.

## Review Focus

1. 로그아웃 상태(토큰 없음) → 목록은 "학습장을 불러오지 못했어요"(던지지 않고 실패 상태). Task 1 테스트.
2. 일요일 23시 KST 기기(시간대 UTC)에서 `from`이 그 주 월요일 → Task 1 `weekStartKst` 테스트(UTC 기준 날짜가 다를 때).
3. 서버가 `taskId` 인자를 모를 때 퀴즈 답이 깨지지 않음 → Task 5 재시도 테스트.
4. 펼친 카드가 목록 재조회 뒤에도 펼쳐져 있고 업로드를 다시 받음 → Task 3 테스트.
5. 학습장 탭을 보는 중 응답이 필요한 안내 도착 → 탭 유지 + 메시지 점 → Task 4 테스트.

---

### Task 1: 포트·adapter·주 시작 계산

**Files:**
- Create: `src/kit/study-log/model.ts`, `src/adapters/studyLogFetchers.ts`
- Modify: `src/adapters/studyNoteFetchers.ts` (export `toNote`)
- Test: `__tests__/studyLogFetchers.test.ts`

**Interfaces — Produces:**
```ts
// src/kit/study-log/model.ts
export type StudyNoteListItem = { note: StudyNote; taskType: string; task: string | null; collectionId: number | null; title?: string | null };
export type ReviewActivity = { id: number; type: 'SOLUTION_UPLOAD' | 'QUIZ_ANSWER'; imageUrl: string; createdAt: string; quizId?: number };
export interface StudyLogFetchers { listNotes(from: string): Promise<StudyNoteListItem[]>; listActivities(taskId: number): Promise<ReviewActivity[]> }
export function weekStartKst(now: Date): string           // 'YYYY-MM-DD', KST 월요일
export function kstLabel(createdAt: string): string        // '11월 14일 14:02' (문자열을 KST로 읽음, 기기 시간대 무관)
export function toTimelineTask(item: StudyNoteListItem): TimelineTask   // {id: note.taskId, taskType, task, collectionId, title, note}
// src/adapters/studyLogFetchers.ts
export function createStudyLogFetchers(): StudyLogFetchers
```

- [ ] 테스트: `weekStartKst(new Date('2026-11-15T15:30:00Z'))`(KST 월 11-16 00:30) → `'2026-11-16'`; `new Date('2026-11-15T10:00:00Z')`(KST 일 19:00) → `'2026-11-09'`. `kstLabel('2026-11-14T14:02:00')` → `'11월 14일 14:02'`. `listNotes('2026-11-09')`가 `apiV3('/api/study-notes?from=2026-11-09', 'tok')`를 부르고 `notes`를 돌려주며 note의 `tutorDescription`은 undefined. `listActivities(5)`가 `/api/study-notes/5/activities`의 `activities`를 돌려주고 `type`이 없는 항목은 `'SOLUTION_UPLOAD'`. 토큰 없음 → reject. `toTimelineTask`가 `id`에 `note.taskId`.
- [ ] 실행해 실패 확인: `npx jest __tests__/studyLogFetchers.test.ts`
- [ ] 구현. 날짜 계산은 `now + 9h`의 UTC 요일/날짜로. 토큰은 `authStore.getState().appToken`, 없으면 `Error('로그인이 필요해요')`.
- [ ] 통과 확인, 커밋 `feat(study-log): 학습장 목록·돌아보기 조회 포트`

### Task 2: `studyDataVersion`과 늘 새로 조회하는 타임라인

**Files:**
- Create: `src/state/studyData.ts`
- Modify: `src/host/widgets.tsx` (StudyNoteWidget saved), `src/host/useSolveFinished.ts`, `src/adapters/solutionPhoto.ts` (성공 시), `src/kit/timeline/TimelinePanel.tsx` (`refreshKey?: number`), `src/agent/tablet/TabletAgentLayer.tsx`, `src/phone/PhoneScreens.tsx` (타임라인 탭에 refreshKey + 포커스 시 bump 없이 재조회)
- Test: `__tests__/timeline.test.tsx` (추가)

**Interfaces — Produces:** `studyDataStore` (`createStore`, state: number), `bumpStudyData(): void`, `useStudyDataVersion(): number`.

- [ ] 테스트: `TimelinePanel`을 `refreshKey={0}`로 그린 뒤 `refreshKey={1}`로 다시 그리면 `fetchTasks`가 page 0으로 한 번 더 불리고, 그 사이 스켈레톤이 다시 나오지 않는다(기존 카드가 보인다).
- [ ] 실패 확인 → 구현: `refreshKey`가 첫 값 이후 바뀌면 `load(0)`. 폰 타임라인 탭은 `useIsFocused()`가 true로 바뀔 때도 `load(0)`이 되도록 `refreshKey={version + focusCount}`.
- [ ] 통과, 커밋 `feat(timeline): 학습장 저장·캔버스 종료·풀이 업로드 뒤 다시 조회`

### Task 3: `StudyNoteReviewList` (학습장 탭)

**Files:**
- Create: `src/kit/study-log/StudyNoteReviewList.tsx`, `src/kit/study-log/topicTitles.ts`
- Test: `__tests__/studyNoteReviewList.test.tsx`

**Interfaces:**
- Consumes: Task 1 전부, `describeTask`, `describeNote`, `SkeletonCards`, `Button`(text, sm, `expanded`), Diary의 확대 보기(`ReactNativeZoomableView` + `DynamicDimensionsImage`, Modal 안).
- Produces: `StudyNoteReviewList({ fetchers, refreshKey, fetchTopicTitle?, now? }: { fetchers: StudyLogFetchers; refreshKey: number; fetchTopicTitle?(topicId: number): Promise<string>; now?: () => Date })`.
- `topicTitles.ts`: `cachedTopicTitle(id, fetch)` — 같은 id는 한 번만 부르는 모듈 Map.

- [ ] 테스트(각각 하나씩):
  - 목록 조회 중 스켈레톤 → 카드 제목 표시. `taskType: 'recommended'` 항목은 안 보인다.
  - 빈 목록 → "이번 주에 쓴 학습장이 없어요". 실패 → "학습장을 불러오지 못했어요".
  - topic 항목: `title` 없으면 `fetchTopicTitle(collectionId)` 결과가 제목, 실패면 "주제". collection 항목: "문제 모음". `title`이 있으면 그것.
  - '돌아보기' 누르면 `listActivities(taskId)` 한 번, 항목 `11월 14일 14:02`와 종류("풀이 업로드"/"퀴즈 답") 표시, 버튼 `accessibilityState.expanded === true`. 접고 다시 펼쳐도 다시 부르지 않는다.
  - 펼친 상태에서 `refreshKey` 변경 → 목록 재조회, 카드는 펼친 채, `listActivities`가 다시 불린다.
  - 업로드 없음 → "이 학습에서 올린 풀이가 없어요". 업로드 실패 → "불러오지 못했어요" + '다시 시도'.
- [ ] 실패 확인 → 구현. 카드 제목: `item.title` → topic 캐시 제목 → `describeTask(toTimelineTask(item)).title`(collection은 `📝 문제 모음`, topic 실패는 `📝 주제`). 펼침 상태 `Set<number>`와 업로드 캐시 `Map<number, …>`는 목록 state와 별개. 아래로 당겨 새로 조회.
- [ ] 통과, 커밋 `feat(study-log): 이번 주 학습장 카드와 돌아보기`

### Task 4: `StudyLogPanel` 탭과 독·폰 연결

**Files:**
- Create: `src/agent/StudyLogPanel.tsx`
- Modify: `src/agent/tablet/TabletAgentLayer.tsx`, `src/phone/PhoneScreens.tsx` (`ChatTabScreen`)
- Test: `__tests__/studyLogPanel.test.tsx`, `__tests__/tabletDrawer.test.tsx`(기존이 깨지면 맞춘다)

**Interfaces — Produces:** `type StudyLogTab = 'notes' | 'messages'`; `StudyLogPanel({ tab, onTab, messagesUnread, state, session, refreshKey })` — 위에 두 칸 전환(`accessibilityRole="tab"`, `selected` 상태, 라벨 "이번 주 학습장", "메시지"; 메시지 칸에 unread 점), 아래에 `StudyNoteReviewList` 또는 `ChatTimeline`. `export function initialTab(ins: Instruction | null, unread: boolean): StudyLogTab` — `ins?.requiresResponse || unread` → `'messages'`, 아니면 `'notes'`.

- [ ] 테스트: `initialTab` 세 경우. `StudyLogPanel`에서 "메시지" 탭 누르면 `onTab('messages')`; tab='messages'면 ChatTimeline 내용("지금은 안내가 없어요.")이 보인다.
- [ ] 구현 `TabletAgentLayer`: `chatTab` state.
  - 레일·toast로 채팅 열기 → `setChatTab(initialTab(ins, unread))`, 메시지 탭일 때만 `unread`를 끈다.
  - 새 안내 도착: `dock==='chat' && chatTab==='messages'` → 그대로; `dock==='chat' && chatTab==='notes'` → toast + unread; 나머지는 기존 규칙, 채팅을 바로 열 때는 메시지 탭으로.
  - 안내가 사라짐: 채팅 dock이고 메시지 탭일 때만 닫는다.
  - 메시지 탭으로 바꾸면 unread를 끈다.
- [ ] 구현 폰 `ChatTabScreen`: 로컬 `tab`, 포커스될 때 `initialTab(state.instruction, false)`; 학습장 탭일 때 `refreshKey`에 포커스 횟수를 더해 다시 조회.
- [ ] 테스트 전체 실행, 통과, 커밋 `feat(study-log): Study Log 독을 학습장·메시지 탭으로 나눈다`

### Task 5: 퀴즈 답에 task id

**Files:**
- Modify: `src/api/graphql/mutations/record.ts` (새 `ADD_LIVE_CLASS_QUIZ_RESPONSE_WITH_TASK`: `$taskId: Int` 추가; 기존 문서는 그대로), `src/api/graphql/mutations/index.ts`, `src/kit/live-class/QuizResponseModal.tsx` (`resolveTaskId?(): Promise<number | undefined>`), `app/topic-live-class.tsx`, `app/hotline-class.tsx`
- Test: `__tests__/quizResponseModal.test.tsx` (추가)

- [ ] 테스트:
  - `resolveTaskId`가 77 → 업로드 뒤 mutation 변수 `{ quizId: 3, answerUrl, taskId: 77 }`(새 문서).
  - 새 문서 호출이 `Unknown argument "taskId"` 메시지로 reject → 기존 문서로 `{ quizId: 3, answerUrl }` 한 번 더, 성공 처리(`onSubmitted`).
  - `resolveTaskId` reject 또는 undefined → 기존 문서, taskId 없음.
- [ ] 구현: 모달은 `useMutation`을 두 문서로. 재시도 판정은 메시지에 `taskId`가 들어 있고 GraphQL 검증 오류일 때만. 화면은 `resolveTaskId={async () => { const id = await ensureTaskId(taskId || undefined, topicLiveSpec(topicId)); if (id && id !== taskId) setTaskId(id); return id; }}`(hotline은 `hotlineSpec(tutorId)`), 그리고 성공 뒤 `bumpStudyData()`.
- [ ] 통과, 커밋 `feat(live-class): 퀴즈 답을 풀이 올리기와 같은 task id로 보낸다`

### Task 6: 검증과 iPad

- [ ] `npx jest` (timeline.test.tsx 첫 실행 간헐 실패는 재실행), `npx tsc --noEmit`, `npx expo lint` 오류 0.
- [ ] Metro(`metro-ipad`, 8087)가 살아 있으면 iPad 앱에서 다시 불러오기(JS만 바뀌었으므로 새 빌드 불필요). 꺼져 있으면 다시 띄운다.
