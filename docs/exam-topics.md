# 10월 모의고사 주제 식별 검증 (명세서 §6.2 2단계, M3 완료 조건)

- 검증일: 2026-10-31 (Asia/Seoul)
- 방법: `https://activity.qoolla.com/graphql`에 **조회만** 수행(`subjectTopicTotalPageCount`, `subjectTopics`, pageSize 12, 전 페이지). 로그인 토큰 없음.
- 대상 과목: `MATH_TOPIC_SUBJECTS`의 `COMMON_MATH`, `CALCULUS`, `STATISTICS`, `GEOMETRY`

## 결과

| 과목 | 주제 수 | 제목에 "10월"이 있는 주제 (id · 제목 · 문항 수) |
|---|---|---|
| COMMON_MATH | 52 | 255 · 2025 10월 시행 수학 공통 주요 문제 · 9 |
| CALCULUS | 50 | 257 · 2025 10월 시행 미적문 주요문제 · 7 |
| STATISTICS | 51 | 256 · 2025 10월 시행 확률과 통계 주요문제 · 6 |
| GEOMETRY | 50 | 258 · 2025 10월 시행 기하 주요문제 · 6 |

- **`orgType` / `orgId`는 203개 주제 전부 `null`** → 메타데이터로는 시험 주제를 식별할 수 없다.
- 시험 주제는 **제목 규칙**("YYYY M월 시행 … 주요 문제")으로만 구분된다. 표기가 일정하지 않다(`주요 문제`/`주요문제`, `2026.`/`2026년`, 오타 `미적문`).
- **2026년 10월 시행 주제는 아직 없다**(조회 시점 기준 최신은 2026. 9월 시행).
- `topicForStudy(topicId)`(문항 목록)는 **로그인 토큰이 없으면 `null`**을 돌려준다. `subjectTopics`는 공개.

## 판단

- (A) 서버가 `topicIds`를 정해 `show_topic_list{source:{kind:'ids'}}`로 보내는 방식이 맞다. 제목 정규식은 표기 흔들림 때문에 서버 v0의 **설정 파일 고정 목록**(§6.3)으로 시작하는 것을 권장한다. 현재 확인된 id: 255, 256, 257, 258(2025년 10월).
- (B) 검색 경로(`exam_search` → `search_submitted` → 서버가 `getMemberMathPreExams`)는 주제 데이터와 무관하게 동작하므로, 2026년 10월 주제가 생기기 전까지의 대안으로 쓸 수 있다.
- 앱 쪽 남은 작업: `source.kind='ids'` 표시(현재 `unsupported`로 거절). id 목록으로 주제 요약을 받는 공개 조회가 없어서, 서버가 요약(제목·문항 수)을 함께 내려보내는 형태로 프로토콜을 확장할지 결정이 필요하다(M5).
