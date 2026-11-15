# 학습장 CRUD API 설계 (api-v2 저장소, 배포 이름 api-v3)

- 작성일: 2026-11-15
- 상태: 구현·배포됨(api-v2 `/api/study-notes/{taskId}`, 2026-11-15)
- 구현 저장소: `/Users/jaesung/QoollaWorkspace/api-v2` (Spring, `https://apiv3.qoolla.com`)
- 호출하는 쪽: `go3math-study-agent-app`의 학습장 양식(`src/kit/study-note/`, `src/adapters/studyNoteFetchers.ts`)
- 앞선 설계: `2026-11-14-study-note-activities-design.md`(앱 쪽 활동 기록)

## 1. 목적

학생 앱의 학습장 조회·등록·수정·삭제를 GraphQL 서버(`activity.qoolla.com`, `graphql-api-server/db/task.ts`)에서 Java API로 옮긴다. 옮기면서 앱이 이미 보내도록 만들어 둔 활동 기록(`activities`) 필드를 함께 받는다. GraphQL 서버에는 `activities`를 추가하지 않는다.

## 2. 지금 있는 것

| 위치 | 내용 |
|---|---|
| `api-v2` `StudyNotesController` | `POST /api/study-notes/class-description` 하나(강사가 수업 끝에 기본 description을 넣음) |
| `api-v2` `StudyNoteCommandRepository` | `task`, `task_note`를 `NamedParameterJdbcTemplate`로 읽고 씀. `findNote`는 `ORDER BY id DESC LIMIT 1` |
| `graphql-api-server/db/task.ts` | `getStudyNoteOfTaskId`, `insertTaskNote`, `updateStudyNoteOfTaskId` — 이번에 옮기는 동작의 원본 |
| 앱 `src/api/rest/apiV3.ts` | `Authorization: Bearer <app-token>`, JSON. 401·403·404·5xx는 "Java 쪽을 쓸 수 없음"으로 보고 기존 GraphQL 경로로 다시 보낸다 |

테이블은 `task`(과제)와 `task_note`(과제당 학습장)이다. 요청에서 말한 "study_task 테이블"은 이 둘을 가리키는 것으로 보고 썼다. 실제로 `study_task`라는 테이블이 따로 있으면 구현 전에 확인한다(§8).

## 3. 데이터

### 3.1 컬럼 추가

```sql
alter table mathdb.task_note add column activities json null;
```

`docs/sql/`에 파일로 둔다. 운영 DB에는 사람이 실행한다.

### 3.2 학습장 응답 모양

```json
{
  "taskId": 123,
  "description": "일반항",
  "difficulties": "concept,calc",
  "expectations": "",
  "achievementRate": 75,
  "noteType": "topic",
  "startDate": "2026-11-12T08:00:00",
  "completeDate": null,
  "activities": "{\"v\":1,\"concepts\":[{\"id\":1,\"title\":\"일반항\"}],\"quizIds\":[45]}"
}
```

- `noteType`은 `task.taskType`, `startDate`·`completeDate`는 `task`의 값이다(원본 `getStudyNoteOfTaskId`와 같다).
- `activities`는 JSON을 문자열로 준다. 앱이 문자열로 받아 스스로 파싱하고, 깨진 값은 빈 기록으로 본다. 컬럼이 null이면 null.

### 3.3 요청 본문(등록·수정 공통)

| 필드 | 형 | 제약 |
|---|---|---|
| `description` | string | 최대 2048자(컬럼 길이) |
| `difficulties` | string | 쉼표로 이은 코드. 서버는 내용을 해석하지 않는다 |
| `expectations` | string | 컬럼 길이까지 |
| `achievementRate` | int | 0~100 |
| `activities` | string | JSON으로 파싱되는 객체여야 한다. 최대 16KB |

모든 필드는 선택이다. 수정에서 빠진 필드(또는 null)는 건드리지 않는다. 빈 문자열 `""`은 "지운다"는 뜻이므로 그대로 저장한다(앱이 지운 글을 `""`로 보낸다).

`activities`는 서버가 합치지 않고 받은 값으로 덮어쓴다. 합치기는 앱이 저장 직전에 다시 조회해서 한다. 서버는 모양(`v`, `concepts`, `quizIds`)을 검사하지 않는다.

## 4. 엔드포인트

모두 `/api/study-notes` 아래, 기존 `StudyNotesController`에 더한다. 사용자는 토큰의 `UserPrincipal`로 정한다.

| 메서드·경로 | 동작 | 성공 응답 |
|---|---|---|
| `GET /{taskId}` | 과제의 학습장 조회 | 200 `{ "note": {…} }`, 없으면 200 `{ "note": null }` |
| `POST /{taskId}` | 학습장 등록 | 201 `{ "note": {…} }` |
| `PUT /{taskId}` | 학습장 수정. 없으면 만든다 | 200 `{ "note": {…} }` |
| `DELETE /{taskId}` | 학습장 삭제 | 204 |

- **조회**: 학습장이 없는 것은 오류가 아니다. 404로 답하면 앱이 "Java 쪽을 쓸 수 없음"으로 보고 GraphQL로 다시 보내므로, 200에 `note: null`로 답한다.
- **등록**: 이미 학습장이 있으면 409. 앱은 등록이 실패하면 다시 조회해서 수정으로 재시도한다.
- **수정**: 원본(`updateStudyNoteOfTaskId`)처럼 없으면 만든다. 수정할 때 `task_note.lastVisitedAt`을 지금으로, `task.visitCnt`를 1 올리고 `task.lastVisitedAt`을 지금(unix 초)으로 바꾼다. 새로 만든 경우에는 `task`를 건드리지 않는다(원본과 같다).
- **삭제**: `task_note` 행만 지우고 `task`는 남긴다. 없어도 204.
- 한 과제에 `task_note` 행이 여러 개면 가장 최근 것(`id` 내림차순 첫 행, 기존 `findNote`와 같다)을 읽고 수정한다. 삭제는 그 과제의 행을 모두 지운다.

## 5. 권한과 오류

| 상황 | 응답 |
|---|---|
| 토큰 없음·만료 | 401 (기존 보안 설정 그대로) |
| `taskId`의 과제가 없음 | 400, 메시지 `과제를 찾을 수 없습니다` |
| 과제의 `userId`가 토큰 사용자와 다름 | 403 |
| 본문 검증 실패(길이, 범위, `activities`가 JSON 객체가 아님) | 400 |
| 등록인데 이미 있음 | 409 |

- 과제가 없을 때 404가 아니라 400을 쓰는 이유는 §4 조회와 같다(앱이 404를 "배포 전"으로 본다).
- 403은 앱이 GraphQL로 다시 보내는 상태 코드다. 지금 GraphQL 쪽이 소유자를 검사하지 않는다면 남의 과제에 대한 요청이 GraphQL에서 통과할 수 있다. 이번 범위에서는 Java 쪽만 막고, 이 사실을 결과 보고에 적는다.
- 오류 본문은 기존 예외 처리(`BadRequestException` 등)가 내는 `{ "message": … }` 모양을 따른다. 앱이 `message`를 읽는다.

## 6. 구현 메모

- 기존 방식 그대로: 컨트롤러 → `StudyNoteService` → `StudyNoteCommandRepository`(JDBC). 요청·응답은 `payload`의 record.
- `registerClassDescription`과 그 테스트는 동작을 바꾸지 않는다.
- `activities`는 JDBC에서 문자열로 넣고 읽는다(MySQL `json` 컬럼). 넣기 전에 Jackson으로 파싱해 객체인지 확인한다.
- 등록·수정은 `@Transactional`.

## 7. 테스트

`StudyNoteServiceTest`의 방식(저장소를 가짜로 두는 단위 테스트)을 따른다.

- 조회: 있음, 없음(`note: null`), 남의 과제(403), 없는 과제(400)
- 등록: 새로 만듦, 이미 있음(409), `activities` 저장, `activities`가 JSON이 아님(400)
- 수정: 빠진 필드는 그대로, `""`은 지움, 없으면 만듦, `task` 방문 기록 갱신, `activities` 덮어쓰기
- 삭제: 지움, 없어도 204, 남의 과제(403)
- 컨트롤러: 경로·상태 코드(201, 204, 409)와 응답 감싸기(`note`)

`./gradlew test`가 통과해야 완료다.

## 8. 확인이 필요한 것

1. "study_task 테이블"이 `task`·`task_note`를 뜻하는지. DB에 `study_task`가 따로 있으면 이 문서의 테이블 이름을 고친다.
2. `task_note.expectations`·`difficulties`의 컬럼 길이(검증 상한을 여기에 맞춘다).
3. 삭제를 실제로 쓸 화면이 있는지. 지금 앱에는 학습장을 지우는 기능이 없다.

## 9. 범위 밖

- 운영 DB에 `alter table` 실행, 배포
- 앱이 GraphQL 대신 이 API를 부르도록 바꾸는 일(이 API가 배포된 뒤 `go3math-study-agent-app`에서 따로 한다)
- 월별·주별 학습장 목록(`monthlyStudyNotes` 등)
- GraphQL 서버의 학습장 코드 제거
- 선생님 정리(`tutorDescription`) 필드
