# 학습장 활동 기록(activities) 설계

- 작성일: 2026-11-14
- 상태: 승인 대기
- 앞선 설계: `2026-11-09-study-note-design.md`(학습장 양식과 나갈 때 띄우는 흐름)
- 관련 코드: `src/kit/study-note/`, `src/adapters/studyNoteFetchers.ts`, `src/api/graphql/{queries,mutations}/study.ts`, `src/host/widgets.tsx`, `src/kit/canvas/CanvasStudySheet.tsx`, `app/{notebook,topic-live-class,hotline-class}.tsx`

## 1. 목적

학생이 캔버스에서 한 일(조회한 개념, 실황 수업에서 받은 퀴즈)을 학습장에 함께 남긴다. 학생은 학습장을 쓸 때 그 목록을 보고 눌러서 "공부한 내용"을 쉽게 채운다. 튜터와 에이전트는 같은 기록을 요약에 쓴다.

## 2. 접근 방식

| 안 | 내용 | 판단 |
|---|---|---|
| A. JSON 컬럼 + 참조 | `task_note.activities`에 개념 id·제목과 퀴즈 id만 둔다. 퀴즈 본문은 `lesson_note`에서 읽는다. | **선택(2026-11-14)**. 컬럼 하나로 끝나고 퀴즈 사본이 생기지 않는다. |
| B. 내용 그대로 기입 | 개념 제목·링크·퀴즈 본문을 컬럼에 적는다. | 퀴즈 수식이 길어 길이 제한에 걸리고 원본과 어긋날 수 있다. |
| C. `task_activity` 테이블 | 행동마다 행을 쌓는다. | 통계에는 좋지만 지금 요구보다 크다. 필요해지면 A의 JSON을 옮긴다. |

## 3. 데이터

### 3.1 DB (서버, 이 저장소 밖)

```sql
alter table mathdb.task_note add column activities json null;
```

### 3.2 JSON 모양

```json
{ "v": 1, "concepts": [{ "id": 123, "title": "수열의 귀납적 정의" }], "quizIds": [45, 46] }
```

- `concepts[].title`은 `MathConcept.rawTitle`이다. 링크는 저장하지 않고 `id`로 만든다.
- `quizIds`는 수업 중 받은 퀴즈의 id다. 답을 냈는지는 기록하지 않는다(응답은 이미 `addLiveClassQuizResponse`로 서버에 있다).
- 같은 task에 여러 번 들어가면 id 기준 합집합으로 합친다. 순서는 처음 본 순서다.

### 3.3 GraphQL (서버, 이 저장소 밖)

`registerTaskNote`·`updateTaskNote`에 `activities: String` 인자를, `studyNote`에 `activities` 필드를 추가한다. 값은 위 JSON을 문자열로 만든 것이다.

**순서 제약:** 서버에 인자가 없는 상태에서 앱이 `activities`를 보내면 mutation 전체가 실패한다. 서버를 먼저 배포한다.

## 4. 앱 동작

### 4.1 수집

- 새 모듈 `src/kit/study-note/activity.ts`: `Activities` 타입, `mergeActivities(a, b)`, `parseActivities(raw)`(깨진 값은 빈 기록), MMKV 읽기·쓰기(`agent:studyNoteActivity:<taskId>`, 기존 초안 키와 같은 방식).
- 새 store `src/state/canvasActivity.ts`: 캔버스 한 번 들어가 있는 동안의 기록. 캔버스 화면이 마운트될 때 비운다.
  - 개념: `CanvasStudySheet`의 `onPickedChange`에서 새로 고른 개념을 더한다. `pickedConceptsStore`는 검색 dock과 함께 쓰고 앱을 끌 때까지 남으므로 그대로 쓰지 않는다.
  - 퀴즈: `topic-live-class`·`hotline-class`의 `setLiveQuiz` 자리에서 `quizId`를 더한다.
- 캔버스가 언마운트될 때(`useSolveFinished`와 같은 시점) taskId가 있으면 그 기록을 MMKV의 `agent:studyNoteActivity:<taskId>`에 합쳐 쓴다. taskId가 없으면(풀이를 올리지 않음) 버린다.

### 4.2 양식

- `StudyNoteForm`이 열릴 때 서버 노트의 `activities`와 MMKV의 기록을 합쳐 보여 준다.
- "공부한 내용" 입력칸 아래 추천 줄에 개념 제목 칩을 `topicHints` 뒤에 붙인다. 누르면 입력칸에 추가되는 기존 동작 그대로다. description에 자동으로 써넣지는 않는다(200자 제한 유지, 학생 글과 자동 기록 분리).
- 퀴즈가 있으면 추천 줄 아래에 "수업 퀴즈 n개"를 한 줄로 보여 준다. 퀴즈 본문 표시는 범위 밖이다.

```
공부한 내용
 [ 한두 줄 입력 · 최대 200자            ]
 추천: (주제명) (수열의 귀납적 정의) (일반항)   ← 뒤 둘이 조회한 개념
 수업 퀴즈 2개
```

### 4.3 저장

- `StudyNoteInput`에 `activities?: string`을 추가한다. 합친 기록이 비어 있지 않을 때만 보낸다.
- 저장에 성공하면 MMKV 기록을 지운다. "나중에"로 닫으면 남겨 두어, 타임라인 카드에서 나중에 열어도 이어진다.

## 5. 오류 처리

| 상황 | 처리 |
|---|---|
| `activities` 값이 JSON이 아니거나 모양이 다름 | 빈 기록으로 본다. 저장할 때 새 기록으로 덮어쓴다. |
| 노트 조회 실패 | 기존 규칙(재조회 뒤 register/update 선택)을 따른다. 재조회로 받은 `activities`와 합친다. |

## 6. 테스트

- `studyNoteActivity.test.ts`: 합치기(중복 제거·순서), 깨진 값 파싱, MMKV 읽기·쓰기·지우기
- `studyNoteForm.test.tsx`: 개념 칩이 추천 줄에 보이고 누르면 입력칸에 들어감, 퀴즈 줄 표시, 저장 입력에 `activities` 포함, 저장 뒤 MMKV 삭제, "나중에"는 유지
- `studyNoteFetchers.test.ts`: `activities`가 조회·저장에 오감
- 캔버스: 개념을 고르고 퀴즈를 받은 뒤 나가면 taskId 키로 기록이 남고, taskId가 없으면 남지 않음

`npx expo lint`와 `npx tsc --noEmit`를 통과해야 완료다.

## 7. 범위 밖

- 서버 변경 자체(컬럼, GraphQL 인자·필드)
- 타임라인 카드에 활동 기록 표시
- 퀴즈 본문·정답 여부 표시(`lesson_note` 조회)
- 캔버스 밖(검색 dock)에서 본 개념 기록
