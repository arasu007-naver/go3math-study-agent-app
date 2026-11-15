# Study Log 학습장 목록과 '돌아보기' (앱)

- 작성일: 2026-11-15
- 상태: 검토 대기
- 서버: api-v2 `feature/study-note-review`(4d75615), `https://apiv3.qoolla.com`에 배포됨. 설계는 `api-v2/docs/superpowers/specs/2026-11-15-study-note-review-api-design.md`
- 앞선 설계: `2026-11-14-study-note-activities-design.md`, `2026-11-15-study-note-crud-api-design.md`

## 1. 왜 만드나

학생이 이번 주에 쓴 학습장을 한곳에서 보고, 카드마다 그 학습(task)을 캔버스에서 풀 때 한 일을 펼쳐 돌아볼 수 있게 한다. 지금 한 일은 풀이 업로드뿐이고, 나중에 퀴즈 보내기 같은 기록이 더해진다.

함께 고칠 것: 타임라인(task 조회)은 학생의 행동이 바로 반영되도록 늘 새로 조회한다. 학습장을 저장했는데 목록이 그대로면 저장이 안 된 것처럼 보인다.

## 2. 목표 · 하지 않을 것 · 실패로 볼 것

목표
- Study Log 독(태블릿 dock `chat`, 폰 탭 "Study Log")을 열면 **이번 주 학습장** 목록이 보인다.
- 카드: 제목, 학습장 요약, 그 아래 버튼 줄. 버튼 줄 오른쪽에 **'돌아보기' + 아래 화살표** 버튼.
- '돌아보기'를 누르면 카드 아래로 그 task의 풀이 업로드와 퀴즈 답 올리기(§7.1)가 시각순으로 펼쳐진다. 다시 누르면 접힌다(화살표가 위로 바뀐다).
- 기존 에이전트·선생님 메시지는 같은 독의 **'메시지' 탭**으로 옮긴다. 아무것도 잃지 않는다.
- 학습장 저장, 캔버스 종료 뒤에는 타임라인과 학습장 목록이 새로 조회된다.

하지 않을 것
- 구독·구독 갱신·결제 같은, task에 속하지 않는 사용자 로그는 '돌아보기'에 넣지 않는다(사용자 결정).
- `GET /api/study-log`(user_action_log) 피드를 메시지 탭에 섞는 일. `docs/study-log-action-items.md` D5의 일이고 이번 범위가 아니다. 나중에 메시지 탭에 넣는다.
- 날짜 범위로 기록을 찾지 않는다. 돌아보기는 **task id로** 조회한다(사용자 결정).
- 서버 API 변경(이미 배포됨). §7의 질문 하나만 예외.

실패로 볼 것
- 학습장을 저장했는데 타임라인·목록에 바로 안 보인다.
- 독을 열 때 모든 카드의 사진을 미리 받아 느려진다.
- 탭을 나누면서 지금 응답해야 할 에이전트 안내(InstructionCard)를 학생이 못 보게 된다.

## 3. 방법 (Approaches)

| 안 | 내용 | 결과 |
|---|---|---|
| **A. 목록 API + 돌아보기 API를 따로** | 독을 열 때 목록만, 펼친 카드만 업로드를 받는다 | **채택**(서버가 이 모양으로 구현·배포) |
| B. 목록에 업로드까지 담기 | 펼치면 바로 보이지만 안 펼칠 카드의 사진까지 매번 받는다 | 버림 |
| C. 앱만 고치기 | task마다 학습장을 하나씩 조회 — task id로 업로드를 찾을 방법이 앱에 없다 | 버림 |

독 안 배치(사용자가 고름): **탭으로 나누기** `이번 주 학습장 | 메시지`. 버린 안: 학습장만 두기(선생님 메시지를 다시 볼 곳이 사라짐), 메시지 위에 목록 얹기(스크롤이 길어지고 메시지가 밀림).

## 4. 화면

```
Study Log                                  ✕
[ 이번 주 학습장 ]  [ 메시지 • ]
┌──────────────────────────────────────────┐
│ 📝 수열의 극한                              │
│ ✏️ 일반항 구하는 법 · 대부분 해냈어요         │
│                              [돌아보기 ⌄] │
├──────────────────────────────────────────┤
│ 11월 14일 14:02   [풀이 사진]               │
│ 11월 14일 14:20   [풀이 사진]               │
└──────────────────────────────────────────┘
┌──────────────────────────────────────────┐
│ 📝 기출 검색                               │
│ ✏️ …                                      │
│                              [돌아보기 ⌄] │
└──────────────────────────────────────────┘
```

- 탭: 독 맨 위에 두 칸 전환(세그먼트). `메시지` 칸에는 읽지 않은 메시지 점을 보인다.
- 목록 탭
  - 이번 주 = **이번 주 월요일(KST)부터**. `from`에 그 날짜를 보낸다. *(앞에서 제안, 반대 없음)*
  - 순서: 서버 순서 그대로(최근에 손댄 task 먼저).
  - 종류: 타임라인과 같은 `CARD_TYPES`(selection, collection, topic, topic-live, hotline, bookmark)만 보인다. 서버는 학습장이 있는 모든 task를 주지만, 다른 종류는 `describeTask`가 "책갈피 0문항"으로 잘못 이름 붙인다. *(내 결정)*
  - 비었을 때: "이번 주에 쓴 학습장이 없어요".
  - 조회 중: 기존 `SkeletonCards`. 실패: "학습장을 불러오지 못했어요" + 아래로 당겨 다시 조회.
  - 아래로 당겨 새로 조회(pull-to-refresh)를 지원한다.
- 카드
  - 제목·요약은 타임라인 카드와 같은 함수(`describeTask`의 제목, `describeNote`)로 만든다. 같은 학습이 두 화면에서 같은 이름으로 보인다.
  - 버튼 줄은 `flexDirection: row`, 오른쪽 정렬. 지금 버튼은 '돌아보기' 하나. 나중 버튼(예: 학습장 수정, 다시 풀기)이 왼쪽에 붙을 자리다.
  - '돌아보기': `Button variant="text" size="sm"`, 뒤에 `chevron-down`/`chevron-up` 아이콘, `expanded` 접근성 상태.
- 펼친 영역
  - 처음 펼칠 때 `GET /api/study-notes/{taskId}/activities`를 부른다. 받는 동안 한 줄 스켈레톤.
  - 항목: 시각(`timeLabel`과 같은 `M월 D일 HH:mm`) + 풀이 사진 썸네일. 사진을 누르면 크게 본다(Diary가 쓰는 확대 보기를 재사용). *(내 제안)*
  - 비었으면 "이 학습에서 올린 풀이가 없어요".
  - 실패하면 "불러오지 못했어요" + '다시 시도'.
  - 한 번 받은 결과는 카드(taskId 기준)에 남긴다. 다시 접었다 펼쳐도 다시 부르지 않는다.
  - 목록이 조용히 다시 조회될 때(§6) 펼친 카드는 **펼친 채로 두고**, 그 카드의 업로드만 조용히 다시 받는다. 캔버스에서 풀이를 올리고 돌아오면 새 사진이 보인다. 펼침 상태와 업로드 캐시는 taskId로 두어 목록 조회와 따로 산다. 접힌 카드의 캐시는 버린다(다음에 펼칠 때 새로 받는다).
  - 펼친 영역에는 **시각이 있는 기록만**(풀이 업로드, 퀴즈 답 §7.1) 보인다. `note.activities`의 조회한 개념·받은 퀴즈는 시각이 없어 시간순 목록에 넣지 못하므로 이번에는 넣지 않는다(사용자 말: "현재는 풀이 업로드"). 시각이 있는 퀴즈 기록이 생기면 같은 목록에 더한다.
- 메시지 탭: 지금의 `ChatTimeline` 그대로(메시지·타임라인 항목·맨 아래 InstructionCard).

### 4.1 어느 탭으로 열리나 *(내 제안)*

- 기본은 **이번 주 학습장**.
- 단, 지금 응답할 안내(`state.instruction`)가 있거나 읽지 않은 메시지 표시로 독을 연 경우에는 **메시지** 탭으로 연다. 응답해야 할 안내를 놓치지 않게 하려는 것이다.
- 독이 열려 있는 동안 고른 탭은 유지한다. 앱을 다시 켜면 기본으로 돌아간다(저장하지 않는다).
- "응답할 안내"는 `requiresResponse`가 있는 안내만 센다. 응답이 필요 없는 선생님 메시지 때문에 늘 메시지 탭으로 열리지 않게 한다.
- 학습장 탭을 보는 중에 새 안내가 오면 **탭을 바꾸지 않는다**(보던 카드를 잃지 않게). 대신 `메시지` 탭에 읽지 않음 점을 켜고, 독이 닫혀 있을 때와 같은 알림(toast)을 띄운다. 지금은 `dock === 'chat'`이면 아무것도 하지 않는데(`TabletAgentLayer.tsx`), 이것을 "메시지 탭을 보고 있을 때만"으로 바꾼다. 폰 Study Log 탭도 같다.
- 안내가 사라질 때 지금은 채팅 독을 닫는다. 학습장 탭을 보고 있으면 닫지 않는다.

## 5. 데이터

새 fetcher `src/adapters/studyLogFetchers.ts` (kit 포트는 `src/kit/study-log/`):

```ts
listNotes(from: string /* YYYY-MM-DD */): Promise<StudyNoteListItem[]>   // GET /api/study-notes?from=
listActivities(taskId: number): Promise<StudyNoteUpload[]>               // GET /api/study-notes/{taskId}/activities
type StudyNoteListItem = { note: StudyNote; taskType: string; task: string | null; collectionId: number | null };
type StudyNoteUpload  = { id: number; imageUrl: string; createdAt: string /* KST, 오프셋 없음 */ };
```

- `apiV3()` + `authStore` 토큰을 쓴다. 학습장 fetcher와 달리 **GraphQL 대체 경로는 없다**(GraphQL에 같은 조회가 없다). 실패는 화면의 실패 상태로 보인다.
- `note`는 단건 조회와 같은 모양이라 `studyNoteFetchers`의 `toNote`를 함께 쓴다.
- 카드 제목에 쓸 `TimelineTask`는 목록 항목에서 만든다: `{ id: note.taskId, taskType, task, collectionId, note }`.
- `createdAt`은 오프셋이 없는 KST 문자열이다. 기기 시간대와 상관없이 KST로 읽는다.

## 6. 늘 새로 조회하기

- 앱 공용 신호 `studyDataVersion`(작은 store, 숫자 하나)을 둔다. 다음 때 올린다.
  - `study_note_saved` (학습장 시트 저장 — `src/host/widgets.tsx` StudyNoteWidget)
  - `solve_finished` (캔버스를 나갈 때 — `src/host/useSolveFinished.ts`)
  - 풀이 사진 업로드 성공 (`src/adapters/solutionPhoto.ts`)
- `TimelinePanel`과 학습장 목록은 이 값이 바뀌면 첫 페이지를 다시 조회한다. 이미 보이는 목록은 그대로 두고 조용히 바꾼다(스켈레톤을 다시 띄우지 않는다).
- 화면이 다시 보일 때도 새로 조회한다. 폰 탭은 포커스될 때(`useFocusEffect`), 태블릿 dock은 열 때(지금처럼 다시 마운트).
- `TimelinePanel`은 `refreshKey` prop을 받는다. kit이 앱 store를 직접 모르게 한다.

## 7. 정해야 할 것 — 주제(topic)·문제 모음 카드 제목

새 목록 API는 `taskType`·`task`·`collectionId`만 준다. 그런데 타임라인의 주제 카드 제목은 GraphQL `getTaskHistory`가 붙여 주는 `topicTitle`이고, 문제 모음은 `title`이다. 그래서 지금 API로는 주제·문제 모음 카드 제목이 비어 보인다. 기출 검색·실황 수업·책갈피는 `task`만으로 제목이 나온다.

결정 *(내 결정, 사용자 답 없음 — 서버가 `title`을 주면 그것을 먼저 쓴다)*
- 목록 항목에 서버 `title`(선택 필드)이 있으면 그것을 제목으로 쓴다.
- 없으면 주제(topic)는 기존 `fetchTopic(collectionId)`로 주제 제목을 받아 채운다. 같은 collectionId는 앱이 켜져 있는 동안 한 번만 받는다. 받기 전·실패 시 제목은 "주제".
- 문제 모음(collection)은 "문제 모음"으로 보인다.

## 7.1 퀴즈 답 올리기 (사용자 추가 요청, 2026-11-15)

사용자 요청: `user_action_log`에 퀴즈 답 올리기를 남기고, '돌아보기'에 풀이 업로드와 함께 시각순으로 보인다.

지금 코드
- 앱은 실황 수업 퀴즈 답을 graphql `addLiveClassQuizResponse(quizId, answerUrl)`로 보낸다(`src/api/graphql/mutations/record.ts:48`).
- 이 resolver(`graphql-api-server/resolvers/index.ts:4032`)는 `insertQuizResponse`만 하고 `user_action_log`에 쓰지 않는다. `docs/study-log-action-items.md` §3.3의 `LIVE_CLASS_QUIZ_ANSWER`(targetId = quizId)는 아직 구현 전이다.
- 인자에 taskId가 없다. 그래서 이 기록만으로는 어느 task의 '돌아보기'에 넣을지 정할 수 없다.

결정 (사용자, 2026-11-15)
- 퀴즈는 실황 수업에서 선생님이 보내고, 학생이 앱에서 '답 보내기'를 한다.
- 답 보내기는 **풀이 올리기와 같은 task id**를 쓴다. 그 캔버스에서 이미 풀이를 올려 task가 있으면 그 id다.
- 아직 풀이를 올리지 않아 task가 없으면, **답을 보내기 전에 task를 만들고**(풀이 올리기와 같은 `ensureTaskId` + 같은 spec) 그 task id와 함께 답을 보낸다. 만든 id는 캔버스가 기억해 이후 풀이 올리기도 같은 task를 쓴다.

필요한 서버 일(사용자 담당)
1. `addLiveClassQuizResponse`가 `LIVE_CLASS_QUIZ_ANSWER`를 쓴다(기록 실패는 답 저장을 실패시키지 않는다).
2. `addLiveClassQuizResponse(quizId, answerUrl, taskId: Int)` — 선택 인자 `taskId`를 받아 기록의 `extraStatement`에 `task:{taskId}`로 남긴다(`ix_action_extra_time`으로 찾는다). `description`에도 `taskId`를 넣는다.
3. `GET /api/study-notes/{taskId}/activities`가 풀이 업로드와 퀴즈 답을 함께, 시각 오름차순으로 준다. 항목에 종류를 더한다(제안: `type: "SOLUTION_UPLOAD" | "QUIZ_ANSWER"`, 퀴즈면 `quizId`). `imageUrl`은 퀴즈면 `answerUrl`.

앱 쪽
- 펼친 영역의 항목에 종류 표시(예: "풀이 업로드" / "퀴즈 답")를 붙인다. `type`이 없는 옛 응답은 풀이 업로드로 읽는다.
- 실황 수업 화면(`app/topic-live-class.tsx`, `app/hotline-class.tsx`)이 `QuizResponseModal`에 `resolveTaskId()`를 넘긴다. 풀이 올리기와 같은 `ensureTaskId(taskId, spec)`를 부르고 화면의 taskId를 갱신한다. 모달은 답 이미지 업로드 뒤 이 id를 `taskId` 변수로 보낸다.
- task를 만들지 못하면(네트워크 등) taskId 없이 답을 보낸다. 답 보내기 자체는 막지 않는다.
- 서버가 아직 `taskId` 인자를 모르면 GraphQL이 요청을 거절한다. 그때(`Unknown argument "taskId"` 류의 검증 오류)는 taskId 없이 한 번 더 보낸다. 서버 배포 순서와 상관없이 답 보내기가 깨지지 않는다.

## 8. 빌더에게 맡기는 것

- 탭 전환 컴포넌트 모양(theme 토큰으로).
- 썸네일 크기·확대 보기 재사용 방식.
- fetcher·목록의 테스트 구성. 최소한: `from` 계산(월요일, KST), 404·401일 때 실패 상태, 펼칠 때 한 번만 조회, `studyDataVersion`이 바뀌면 다시 조회.
- 기존 `ChatTimeline` 테스트가 깨지지 않게 메시지 탭으로 옮기기.
