# Study Log 액션 로그 항목과 `user_action_log` 설계 (검토안)

작성일: 2026-11-13 · 개정 3회(Q1~Q7, Q8~Q13, Q14~Q18 답 반영) · 상태: **열린 질문 없음. 사용자 최종 검토 대기.** DB 변경은 실행하지 않았다.

이 문서는 api-v2의 기존 설계 `api-v2/docs/superpowers/specs/2026-11-08-study-log-design.md`(이하 **11-08 설계**)를 이어서 쓴다. 11-08 설계와 다른 점만 새로 정한다.

## 0. 결정 (2026-11-13, 사용자 답)

| # | 질문 | 결정 |
|---|---|---|
| D1 | 구독·결제는 누가 쓰나 | **PAY WEB이 `user_action_log`에 직접 쓴다.** api-v2를 거치지 않는다 |
| D2 | 조회 로그를 얼마나 촘촘히 | **조회 로그는 남기지 않는다.** 문제 조회·해답 페이지 열람 모두 남기지 않는다. 학생의 "풀이"는 조회가 아니라 저장으로 남는다(D8). `id` BIGINT 전환도 하지 않는다 |
| D3 | 실황 수업 퇴장 | **선생님이 수업을 닫을 때 서버가 그 수업 참여자 모두에게 자동으로 남긴다.** 앱 연결 끊김으로 추정하지 않고, 앱 API도 만들지 않는다 |
| D4 | 풀이 업로드 | **Study Log에 보인다** (Diary 달력과 겹쳐도 보인다) |
| D5 | Study Log dock은 누가 채우나 | **앱이 `GET /api/study-log`를 받아** 메시지와 섞는다 |
| D6 | 기출 검색 기록 | **서버에 바로 남기지 않는다.** 앱 로컬 저장소에 두고, 학생이 첫 풀이를 저장할 때 task(서버 기록)가 된다(§3.4) |
| D7 | userId | api-v2 `UserPrincipal.getId()`와 graphql `u.sub`는 **같은 값**이다 |
| D8 | 풀이란 무엇이고 어디서 보나 | **풀이 = 캔버스 이미지(`toDataURL`)다.** 풀이 기록(record)으로 저장되고, Diary(달력) 탭에서 본다. Study Log에는 저장한 순간이 남는다(`SOLUTION_SAVE`). 피드백 대상은 D14 |
| D9 | 주제 실황 수업 퇴장 | **주제 선생님이 주제 실황 수업을 닫을 때**도 D3과 같이 남긴다. 닫는 resolver는 이미 있다: graphql `offTopicLiveClass(liveClassId)`(§3.1) |
| D10 | task를 언제 만드나 | **모든 유형에서 첫 풀이를 저장할 때 만든다.** 태블릿 캔버스 화면은 캔버스 스냅샷을 저장할 때, 폰은 어떤 검색 결과에서든 풀이 사진을 올릴 때. 캔버스를 열 때는 만들지 않는다 |
| D11 | 로컬에 둔 검색은 얼마나 두나 | **task가 될 때까지**, 즉 그 검색에서 첫 풀이를 저장할 때까지 둔다. 따로 개수 상한·만료는 두지 않는다 |
| D12 | PAY WEB DB 계정 | **PAY WEB이 스스로 계정을 마련하고 기록한다.** 이 문서는 actionType과 `description` 모양만 정한다 |
| D13 | 닫지 않고 끝난 수업 | **사용자가 따로 감시기(watcher/sentinel)를 만든다.** 활동 없는 실황 수업을 찾아 처리한다. 이 문서 범위 밖이고, 그 감시기가 지킬 기록 규칙만 §3.1에 적는다 |
| D14 | 선생님 피드백은 무엇에 붙나 | **풀이 사진이 아니라 task의 문제(task unit)에 붙는다.** Study Log에 `TUTOR_FEEDBACK`으로 보인다. 대상은 `targetId` = taskId, `extraStatement` = `{sourceType}:{sourceId}`다(§3.3) |
| D15 | 캔버스 저장과 사진 업로드 구분 | **구분하지 않는다.** `medium` 인자도, `fileName` 경로 규칙도 두지 않는다 |
| D16 | 수업 닫기 본인 확인 | **사용자가 주인 선생님만 수업을 닫을 수 있게 고친다**(`closeOnlineClass`, `offTopicLiveClass`). 이 문서의 퇴장 기록은 그 확인을 전제로 한다 |
| D17 | 같은 문제를 여러 번 저장하면 | **저장마다 남긴다.** Diary와 같다. 합치지 않는다 |
| D18 | 풀이 없는 검색 | **무시한다.** 서버에도 Study Log에도 남지 않는다. 따로 상한은 두지 않는다 |

## 1. 지금 상태

### 1.1 앱: Study Log dock이 보여 주는 것

- 태블릿 dock `chat`의 제목이 "Study Log"다(`src/agent/tablet/TabletAgentLayer.tsx:39`). Phone은 하단 탭 "Study Log"(`app/(main)/_layout.tsx:27`)다.
- 내용은 `ChatTimeline`(`src/agent/tablet/ChatTimeline.tsx`) 하나다. 에이전트·튜터 메시지와 에이전트 서버의 `timeline_append` 항목(`search · topic · task · daily_summary · weekly_summary`, `src/protocol/index.ts:75`)을 시간순으로 섞는다.
- 앱은 `GET /api/study-log`를 아직 부르지 않는다. D5에 따라 앞으로 부른다(§5).

### 1.2 같은 기록을 이미 보여 주는 다른 화면

| 화면 | 데이터 | 겹치는 행동 |
|---|---|---|
| Study(타임라인) dock `TimelinePanel` | `MY_TASKS` 과제 카드 4종(기출 검색·문제 모음·주제·책갈피), 방문 횟수 `visitCnt` | 주제·과제 열기, 기출 검색으로 만든 과제 |
| Diary dock `DiaryPanel` | 월간 달력(`GET /api/records/month` 또는 `MONTHRY_RECORDS`), 그날 풀이 `DAILY_RECORDS`, 선생님 피드백(`FEEDBACK_OF_RECORD`) | 풀이 저장 (D4·D8: Study Log에도 보인다) |

### 1.3 서버: 이미 쓰는 actionType

| actionType | 쓰는 곳 | 상태 |
|---|---|---|
| `ONLINE_CLASS_OPEN` | graphql-api-server `index.ts:86` | 튜터의 행동이다. Study Log에는 표시하지 않는다. 선생님 수업 퇴장(D3)에서 수업 시작 시각을 찾는 데 쓴다 |
| `EXAM_SEARCH` | api-v2 `QuestionQueryController` → `StudyLogWriter` | main에 들어가 있다. 이 앱은 이 경로를 쓰지 않는다 |
| `LIVE_CLASS_JOIN` | graphql-api-server `resolvers/index.ts:299` `logLiveClassJoin` | main에 들어가 있다. 같은 수업은 1시간에 한 번(redis NX) |

조회 API `GET /api/study-log`와 `StudyLogAction` enum(`EXAM_SEARCH`, `LIVE_CLASS_JOIN`)은 api-v2 main에 있다. 11-08 DDL(`api-v2/docs/sql/2026-11-08-user_action_log.sql`)은 아직 **적용 전**이다.

### 1.4 확인하다 발견한 것

1. **이 앱의 기출 검색은 `EXAM_SEARCH`로 기록되지 않는다.** 앱은 m-cache `POST /api/search`·`/api/search2`를 부른다(`src/api/rest/index.ts:31`). D6에 따라 그대로 둔다.
2. **`LIVE_CLASS_JOIN` 문구에 수업 이름이 빠진다.** `description`에 `title`이 없어 모든 행이 "실황수업 참여"로만 나온다(§3.1 보완).
3. **선생님 수업 참여는 `targetId`가 NULL이다.** 조회 응답 `StudyLogItem`에 `targetUserId`가 없어 앱이 어느 선생님인지 모른다(§5).
4. **풀이 저장은 이미 한 mutation으로 모인다.** 캔버스 저장(`app/notebook.tsx:121` `recordOf`), 실황 수업 캔버스(`app/topic-live-class.tsx:170`, `app/hotline-class.tsx:163`), 폰 사진(`src/adapters/solutionPhoto.ts`)이 모두 graphql `createRecord`를 부른다. 그래서 `SOLUTION_SAVE` 쓰는 곳은 `createRecord` 하나면 된다.
5. **task를 저장 때 만드는 코드는 이미 절반 있다.** 저장하는 네 곳 모두 taskId가 없으면 `ensureTaskId`로 그 자리에서 만든다. 책갈피는 이미 저장 때 만든다. 남은 일은 캔버스를 열 때 만드는 `resolveTaskId`(`src/host/widgets.tsx:39`)를 모든 유형에서 건너뛰게 하는 것이다(§3.4).
6. **주제 실황 수업을 닫는 곳이 있다.** graphql `offTopicLiveClass(liveClassId)` → `db/topic.ts:351` `closeLiveClass`가 주제 주인인지 확인하고 `topic_live_class.onActive = 0`으로 바꾼다. 수업 회차는 `topic_live_class` 행이고, 시작 시각은 `createdAt` 또는 다시 열 때(`reNewTopicLiveClass`) 바뀌는 `updatedAt`이다.
7. **선생님 수업 닫기에는 본인 확인이 없다.** `closeOnlineClass(tutorId)`는 로그인만 확인하고, 호출한 사람이 그 선생님인지 보지 않는다. D16으로 사용자가 고친다. (`offTopicLiveClass`는 `closeLiveClass`가 이미 주제 주인인지 확인한다.)
8. **지금 피드백은 풀이 기록(record)에 붙는다.** graphql `createFeedback(input: {recordId, filename, script})`가 `recordId`로 피드백을 넣고, 학생에게 "풀이 첨삭이 도착했습니다." 메모를 보낸다(`resolvers/index.ts:3490`). D14는 피드백 대상을 task의 문제로 본다. record에는 `taskId`·`sourceType`·`sourceId`가 있으므로, 지금 구조에서도 record에서 task의 문제를 찾을 수 있다(§3.3). task unit 전용 테이블은 코드에서 찾지 못했다. task의 문제는 task JSON의 `units[{sourceType, sourceId}]`로 정해진다.

## 2. 기록 원칙

11-08 그대로:

- 행동이 일어난 서버가 그 자리에서 쓴다. 앱이 로그를 보내는 API는 만들지 않는다.
- 기록이 실패해도 본 동작(저장·입장·닫기·결제)은 실패시키지 않는다.
- `description`은 JSON 문자열이다. 화면 문구는 조회 서버(`StudyLogAction.title`)가 만든다.
- 결제 금액, 결제 수단, 카드 정보는 넣지 않는다.

새로 더하는 원칙:

- **표시용 이름은 쓸 때 함께 남긴다.** 수업 이름, 주제 이름, 상품 이름은 `description.title`에 넣는다. 조회할 때 다른 테이블을 조인하지 않는다.
- **`extraStatement`는 중복을 합치거나 짝을 찾는 키 하나로만 쓴다.** 사람이 읽는 값은 넣지 않는다.
- **`targetId`·`targetUserId`가 가리키는 대상은 actionType마다 하나로 정한다**(§3). 그래서 대상 종류 컬럼(`targetType`)은 두지 않는다.
- **쓰는 곳은 네 곳이다**: api-v2, graphql-api-server, PAY WEB(D1·D12), 실황 수업 감시기(D13). actionType 이름과 `description` 모양은 이 문서가 기준이다.

## 3. 기록할 액션 목록

표기: **v1** = 이번에 넣는다, **보류** = §6 질문이 정해지면 넣는다, **제외** = Study Log에 넣지 않는다.

### 3.1 실황 수업

| actionType | 단계 | 기록 위치 | targetId | targetUserId | extraStatement | description (JSON) | 중복 규칙 | 표시 문구 |
|---|---|---|---|---|---|---|---|---|
| `LIVE_CLASS_JOIN` (주제 실황 수업) | v1 (구현됨, 보완) | graphql `lastLiveTopicMessage` | topicId | NULL | `topic:{topicId}` | `{"kind":"topic","topicId":12,"title":"수열의 극한 실황"}` | 같은 수업 1시간 1회. 수업이 닫히면 redis 키를 지운다 | 실황 수업 참여 · {title} |
| `LIVE_CLASS_JOIN` (선생님 수업) | v1 (구현됨, 보완) | graphql `lastOnlineClassMessage` | NULL | tutorId | `hotline:{tutorId}` | `{"kind":"hotline","tutorId":"kim","title":"김OO 선생님 수업"}` | 같음 | 선생님 수업 참여 · {title} |
| `LIVE_CLASS_LEAVE` (주제 실황 수업) | **v1 (D9)** | graphql `offTopicLiveClass(liveClassId)` — `closeLiveClass`가 닫기에 성공한 뒤 | topicId | NULL | `topic:{topicId}` | `{"kind":"topic","topicId":12,"liveClassId":7,"title":"...","joinedAt":"...","durationSec":1830,"reason":"class_closed"}` | 참여자마다 회차당 1회 | 실황 수업 끝 · {분} |
| `LIVE_CLASS_LEAVE` (선생님 수업) | **v1 (D3)** | graphql `closeOnlineClass(tutorId)` — 닫은 뒤 | NULL | tutorId | `hotline:{tutorId}` | `{"kind":"hotline","tutorId":"kim","title":"...","joinedAt":"...","durationSec":1830,"reason":"class_closed"}` | 같음 | 선생님 수업 끝 · {분} |
| `LIVE_CLASS_QUIZ_ANSWER` | v1 | graphql `addLiveClassQuizResponse(quizId, answerUrl)` | quizId | 선생님 수업이면 tutorId | NULL | `{"kind":"topic"\|"hotline","topicId":12,"title":"..."}` | 없음 (퀴즈마다 1회) | 실황 수업 퀴즈 답안 제출 · {title} |

`LIVE_CLASS_JOIN` 보완: `logLiveClassJoin`이 `title`과 `extraStatement`를 채운다. 기존 행은 `title`이 없으니 기본 문구로 나온다.

`LIVE_CLASS_LEAVE` 만드는 방법(두 종류 같음):

1. 닫기가 성공한 뒤 기록을 시작한다. 기록 실패는 닫기를 실패시키지 않는다.
2. 회차 시작 시각을 정한다.
   - 주제 실황 수업: 그 `topic_live_class` 행의 `updatedAt`(다시 연 시각), 없으면 `createdAt`.
   - 선생님 수업: 그 선생님의 가장 최근 `ONLINE_CLASS_OPEN` 행의 `committedAt`.
3. 참여자 = `actionType='LIVE_CLASS_JOIN' AND extraStatement=(위 키) AND committedAt >= 시작 시각`인 행의 `userId`들. 사용자마다 가장 이른 참여 시각을 `joinedAt`으로 쓴다.
4. 같은 키·같은 시작 시각 이후에 이미 `LIVE_CLASS_LEAVE`가 있는 사용자는 건너뛴다.
5. 참여자마다 한 행씩 넣고, 그 사용자의 `study-log:live-class-join:…` redis 키를 지운다. 1시간 안에 수업을 다시 열어도 다시 참여가 남는다.

**감시기(D13)가 지킬 규칙.** 감시기가 활동 없는 수업을 닫을 때도 위 1~5를 그대로 따르고, `description.reason`만 `"inactive"`로 쓴다. 가능하면 감시기는 위 두 resolver와 같은 닫기 함수를 불러, 기록 코드가 한 곳에만 있게 한다.

### 3.2 구독·결제 (D1·D12: PAY WEB이 직접 쓴다)

| actionType | 단계 | 기록 위치 | targetId | targetUserId | extraStatement | description (JSON) | 표시 문구 |
|---|---|---|---|---|---|---|---|
| `SUBSCRIPTION_START` | v1 | PAY WEB 구독 시작 처리 | 구독 id (정수일 때) | NULL | 플랜 코드 | `{"planName":"수능 수학 1개월","periodEnd":"2026-12-13"}` | 구독 시작 · {planName} |
| `SUBSCRIPTION_RENEW` | v1 | PAY WEB 정기 결제 갱신 | 구독 id | NULL | 플랜 코드 | `{"planName":"...","periodEnd":"..."}` | 구독 갱신 · {planName} |
| `SUBSCRIPTION_CANCEL` | v1 | PAY WEB 해지 신청 | 구독 id | NULL | 플랜 코드 | `{"planName":"...","periodEnd":"..."}` (이 날까지 이용) | 구독 해지 · {periodEnd}까지 이용 |
| `SUBSCRIPTION_END` | 보류 | PAY WEB 만료 배치 | 구독 id | NULL | 플랜 코드 | `{"planName":"..."}` | 구독 종료 |
| `PAYMENT_COMPLETE` | v1 | PAY WEB 결제 승인 웹훅 | 결제 id (정수일 때, 아니면 NULL) | NULL | 주문 번호 | `{"productName":"..."}` | 결제 완료 · {productName} |
| `PAYMENT_REFUND` | v1 | PAY WEB 환불 처리 | 결제 id | NULL | 주문 번호 | `{"productName":"...","partial":false}` | 환불 · {productName} |

- `userId`는 api-v2·graphql과 같은 값(D7)을 넣는다.
- 웹훅이 두 번 와도 한 번만 쓴다. `actionType`과 주문 번호(`extraStatement`)가 같은 행이 있으면 건너뛴다(§4 `ix_action_extra_time`).
- 결제 id가 문자열이면 `targetId`(int)에 넣지 못한다. 그때는 주문 번호만으로 찾는다.

### 3.3 공부 행동

| actionType | 단계 | 기록 위치 | targetId | targetUserId | extraStatement | description (JSON) | 중복 규칙 | 표시 문구 |
|---|---|---|---|---|---|---|---|---|
| `SOLUTION_SAVE` | **v1 (D4·D8·D15·D17)** | graphql `createRecord` (api-v2로 옮기면 그쪽) | 생성된 record id | NULL | `{sourceType}:{sourceId}` | `{"sourceType":"UNIT","sourceId":123,"taskId":45,"taskType":"selection","title":"2024 6월 21번","search":{...}}` | 없음 (저장마다 1행, D17) | 풀이 저장 · {title} |
| `TUTOR_FEEDBACK` | **v1 (D14)** | graphql `createFeedback` (피드백을 넣은 뒤). 피드백 API가 task unit 기준으로 바뀌면 그쪽 | taskId | 피드백을 단 선생님 id(`u.sub`) | `{sourceType}:{sourceId}` | `{"taskId":45,"sourceType":"UNIT","sourceId":123,"title":"2024 6월 21번","recordId":678}` (`recordId`는 있을 때만) | 없음 (피드백마다 1행) | 선생님 피드백 도착 · {title} |
| `BOOKMARK_ADD` | v1 | graphql `addBookmark(sourceType, sourceId)` | sourceId | NULL | `{sourceType}:{sourceId}` | `{"sourceType":"...","sourceId":123,"title":"..."}` | 같은 키 하루 1회 | 책갈피 추가 · {title} |
| `BOOKMARK_REMOVE` | 보류 | graphql `removeBookmark` | sourceId | NULL | `{sourceType}:{sourceId}` | 같음 | 같은 키 하루 1회 | 책갈피 삭제 · {title} |
| `EXAM_SEARCH` | 이 앱에서는 쓰지 않음 (D6) | api-v2 쪽은 그대로 둔다(다른 클라이언트용) | — | — | — | — | — | (api-v2 행이 있으면 지금 문구 그대로) |
| `ANSWER_VIEW`, `PROBLEM_VIEW` | **제외 (D2)** | — | — | — | — | — | — | — |
| `TOPIC_OPEN` / `TASK_OPEN` | 제외 | — | — | — | — | — | — | Timeline `visitCnt`가 이미 맡는다 |
| `STUDY_NOTE_SAVE` | 제외 | — | — | — | — | — | — | 학습장은 Timeline 쪽(11-08 §1) |

`SOLUTION_SAVE` 이름: 지난 개정의 `SOLUTION_PHOTO_UPLOAD`를 바꿨다. D8로 캔버스 저장과 폰 사진이 같은 행동이 되었고, D15로 둘을 구분하지 않는다. `CREATE_RECORD` 인자는 그대로다.

`TUTOR_FEEDBACK` 쓰는 법:

- `userId`는 **피드백을 받는 학생**이다. 선생님의 행동이지만 학생의 Study Log에 보여야 하기 때문이다. 선생님은 `targetUserId`에 둔다.
- 지금 `createFeedback`는 `recordId`만 받는다. 그 record의 `userId`(학생)·`taskId`·`sourceType`·`sourceId`를 읽어 채운다. 같은 task의 같은 문제에 저장이 여러 번 있어도(D17) 피드백 대상은 task의 문제 하나다.
- record의 `taskId`가 0이면(task 없이 저장된 옛 기록) `targetId`는 NULL로 두고 `extraStatement`만 채운다.
- 앱에서 이 항목을 누르면 그 task의 문제 목록(`task_selected`)을 연다.

### 3.4 task 생성 시점과 로컬 검색 (D6·D10·D11)

흐름(모든 유형 공통):

1. 학생이 기출을 검색하거나, 주제·선생님 수업·책갈피·목록에서 문제를 연다. 앱은 task를 만들지 않는다. 기출 검색이면 **검색 조건(spec)을 앱 로컬 저장소(`src/storage`)에 둔다.**
2. 학생이 풀이 캔버스를 연다. 여기서도 task를 만들지 않는다.
3. 첫 풀이를 저장한다. 태블릿은 캔버스 스냅샷 저장, 폰은 풀이 사진 업로드다. 이때 앱이 spec으로 task를 만들고(`ensureTaskId`), 그 taskId로 `CREATE_RECORD`를 부른다.
4. 서버는 `createRecord`에서 `SOLUTION_SAVE`를 쓴다. task가 selection이면 task의 검색 조건 요약을 `description.search`에 넣는다.
5. 앱은 로컬의 그 검색을 지운다(D11). 그 뒤 같은 세션의 저장은 이미 받은 taskId를 쓴다.
6. 풀이를 저장하지 않은 검색은 무시한다(D18). 서버로 보내지 않고, dock에도 보이지 않는다. 로컬에 남은 것은 앱이 아무 때나 지워도 된다(예: 새 검색을 하거나 앱을 다시 켤 때). 남겨 둘 제품 요구는 없다.

결과:

- Study Log에 "기출 검색" 항목은 따로 생기지 않는다. 풀이를 저장한 검색만 `SOLUTION_SAVE` 안에서 보인다.
- 풀이를 저장하지 않은 공부는 Timeline에도 Study Log에도 남지 않는다.
- 풀지 않은 검색은 그 기기 로컬에만 남는다. 다른 기기나 재설치 후에는 사라진다.

앱 쪽 할 일(이 문서 범위 밖, 참고):

- `src/host/widgets.tsx:39` `resolveTaskId`: 지금은 책갈피만 건너뛴다. 모든 유형을 건너뛰게 바꾼다(캔버스 열 때 task 생성 중단). 저장하는 네 곳은 이미 `ensureTaskId`로 만든다(§1.4-5).
- 실황 수업 캔버스(`app/topic-live-class.tsx`, `app/hotline-class.tsx`)는 열 때 `openTopicLiveClass`/`openHotlineClass` → `openWithTask`를 거친다. 같이 바뀐다.
- task 없이 taskId에 기대는 곳을 확인한다. `problem_selected.taskId`, `solve_finished.taskId`, 학습 노트 시트(`study_note`)는 첫 저장 전에는 taskId가 없다.
- 로컬 검색 저장: spec을 키로 하나씩 둔다. `ensureTaskId`의 세션 메모리 캐시(`created` Map)는 앱을 다시 켜면 사라지므로, 첫 저장 뒤 지우는 것도 로컬 저장소 기준으로 한다.

## 4. 테이블 변경

### 4.1 판단

기존 테이블을 그대로 쓴다. 11-08 DDL(문자셋 변경 + 인덱스 2개)에 인덱스 하나만 더한다. 이번 답(D8~D13)으로 DDL은 바뀌지 않는다.

| 항목 | 결정 | 이유 |
|---|---|---|
| utf8mb4 | 한다 (11-08) | 수업·상품 이름에 이모지가 들어간다 |
| `(userId, id)` 인덱스 | 한다 (11-08) | `GET /api/study-log` 커서 페이징 (D5) |
| `(userId, actionType, committedAt)` 인덱스 | 한다 (11-08) | 하루 1회 같은 사용자 중복 확인(책갈피). 풀이 저장은 합치지 않는다(D17) |
| `(actionType, extraStatement, committedAt)` 인덱스 | **새로 한다** | 수업을 닫을 때 그 회차 참여자 찾기(D3·D9·D13), PAY WEB 주문 번호 중복 확인(D1) |
| 대상 종류 컬럼 `targetType` | 안 한다 | actionType마다 대상을 하나로 정했다 |
| `description`을 JSON 타입으로 | 안 한다 | MariaDB의 JSON은 LONGTEXT 별칭이라 얻는 것이 없다. 옛 행 중 JSON이 아닌 것이 있으면 깨진다 |
| `id`를 BIGINT로 | 안 한다 (D2) | 조회 로그를 남기지 않는다. 저장마다 남기는 `SOLUTION_SAVE`(D17)도 기존 풀이 기록 행 수와 같은 규모라 int 상한(약 21억)까지 멀다 |
| `committedAt` NOT NULL | 안 한다 | 기존 쓰기 코드가 기본값에 맡긴다 |

기존 145행과의 호환: 컬럼을 지우거나 이름을 바꾸지 않는다. utf8 → utf8mb4 변환은 데이터를 잃지 않는다.

### 4.2 DDL (제안, 적용 전)

11-08 파일의 사전 점검을 먼저 한다. 그다음 아래를 적용한다.

```sql
-- [사전 점검] 11-08 파일과 같다.
--   SHOW CREATE TABLE user_action_log;
--   SHOW TABLE STATUS LIKE 'user_action_log';   -- Row_format = Dynamic 확인
--   SELECT actionType, COUNT(*) FROM user_action_log GROUP BY actionType;
--   SELECT MAX(CHAR_LENGTH(extraStatement)) FROM user_action_log;
ALTER TABLE user_action_log
  CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  ADD KEY ix_user_id (userId, id),
  ADD KEY ix_user_action_time (userId, actionType, committedAt),
  ADD KEY ix_action_extra_time (actionType, extraStatement, committedAt);
```

- utf8mb4에서 `VARCHAR(255)` 두 개 + timestamp 인덱스 키는 2044바이트다. DYNAMIC 행 형식의 한도 3072바이트 안이다. COMPACT면 실패하니 먼저 확인한다.
- 145행이라 잠금 시간은 무시할 만하다.
- PAY WEB 계정 권한은 PAY WEB이 정한다(D12). 이 테이블에는 INSERT·SELECT면 충분하다.

## 5. 조회 API와 앱 (D5, 이 문서 범위 밖, 참고)

- `StudyLogAction` enum에 v1 항목을 더한다: `LIVE_CLASS_LEAVE`, `LIVE_CLASS_QUIZ_ANSWER`, `SUBSCRIPTION_START`, `SUBSCRIPTION_RENEW`, `SUBSCRIPTION_CANCEL`, `PAYMENT_COMPLETE`, `PAYMENT_REFUND`, `SOLUTION_SAVE`, `TUTOR_FEEDBACK`, `BOOKMARK_ADD`.
- 조회는 `userId`로만 거른다. `TUTOR_FEEDBACK`은 학생 `userId`로 쓰므로 그대로 학생에게 나온다.
- `StudyLogItem`에 `targetUserId`를 더한다. 선생님 수업 참여·퇴장을 다시 열려면 필요하다.
- `SOLUTION_SAVE` 항목은 `targetId`(record id)를 내려 준다. 앱은 이 항목을 누르면 Diary 탭의 그날(`committedAt` 날짜)을 연다. 풀이를 보는 곳은 Diary다(D8).
- 앱에 `GET /api/study-log?before=&limit=` fetcher를 만든다(`src/adapters/`, `apiV3`). `ChatTimeline`이 메시지·`timeline_append` 항목과 함께 시각순으로 섞는다. 위로 스크롤하면 `nextBefore`로 더 받는다.
- 표시 종류(아이콘·배지)는 앱이 `actionType`으로 정한다. 문구는 서버 `title`을 그대로 쓴다.
- 로컬에만 있는 검색(D11·D18)은 dock에 보이지 않는다.
- `TUTOR_FEEDBACK` 항목은 `targetId`(taskId)로 그 task의 문제 목록을 연다.

## 6. 남은 질문

없다. Q1~Q18은 모두 §0의 D1~D18로 정했다. 사용자 최종 검토를 기다린다.

구현 때 확인할 것(질문이 아니라 점검 목록):

- DDL 적용 전 사전 점검(§4.2)과 적용 일시 기록.
- 기존 `actionType` 값 목록(`GROUP BY actionType`)에 이 문서와 겹치는 이름이 없는지.
- PAY WEB(D12)·감시기(D13)·닫기 본인 확인(D16)은 사용자가 맡는다. 이 문서의 actionType·`description` 모양을 따르는지만 맞춰 본다.
- 피드백 API가 task unit 기준으로 바뀌면(D14) `TUTOR_FEEDBACK` 기록 위치를 그쪽으로 옮긴다.
