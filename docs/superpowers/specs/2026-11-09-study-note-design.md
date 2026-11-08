# 학습장(학습 노트) 입력 설계

- 작성일: 2026-11-09
- 상태: 설계 승인됨 → 구현 계획 작성 전
- 관련 코드: `src/kit/timeline/TimelinePanel.tsx`, `src/state/solve.ts`, `src/host/registry.ts`, `src/host/widgets.tsx`, `src/protocol/index.ts`, `app/notebook.tsx`, `app/topic-live-class.tsx`, `app/hotline-class.tsx`, `src/api/graphql/{queries,mutations}/study.ts`

## 1. 목적

캔버스로 공부한 타임라인 학습 기록(task)마다 "무엇을 공부했는지" 짧은 설명(학습장)을 남긴다.

- 실황 수업: 강의자가 쓴 설명을 서버가 채워 준다. 학생은 그 위에 자기 상태(칩)와 한 줄 메모만 남긴다.
- 혼자 공부: 학생이 직접 입력한다.

메모를 쓰는 사람과 용도:

1. 학생 본인이 나중에 복습할 때
2. 튜터가 지도할 때
3. 에이전트가 일간·주간 정리와 다음 할 일 추천에 쓸 때
4. 기존 Qoolla 학습 노트와 같은 형식 유지(M10 parity). `TimelinePanel`의 "아직 안 옮김: 학습 노트 작성"을 대체한다.

성공 기준:

- 캔버스를 나간 학생이 몇 초 안에(칩 한두 번) 메모를 남길 수 있다.
- 메모 입력이 필기와 화면 이탈을 막지 않는다.
- 나중에 타임라인 카드에서 메모를 보고 고칠 수 있다.

## 2. 결정 사항

| 항목 | 결정 |
|---|---|
| 입력 시점 | 캔버스를 나갈 때 묻되 건너뛸 수 있다. 타임라인 카드에서 언제든 작성하고 고칠 수 있다. |
| 누가 묻나 | 에이전트(A안). 앱은 이벤트만 보내고, 묻는 여부와 빈도는 서버가 정한다. |
| 입력 방식 | 선택칩(달성률·어려웠던 점)과 한두 줄 텍스트. 텍스트 칸은 펜(Scribble·S펜)으로도 쓸 수 있다. |
| 저장소 | 기존 GraphQL `registerTaskNote` / `updateTaskNote` / `studyNote(taskId)` |
| taskId | 캔버스에 들어가기 전에 항상 확보한다. |
| 실황 수업 | 강의자 설명은 읽기 전용으로 보여 준다. 학생은 칩과 선택 한 줄 메모만 남긴다. |

## 3. 구조와 데이터 흐름

### 3.1 캔버스 진입 전 taskId 확보

- 서버는 `search_submitted`·`topic_selected`·`task_selected` 처리에서 task를 만들거나 찾는다. 그 `taskId`를 위젯 props에 실어 보낸다.
  - `problem_list.source`의 `exam_query`·`bookmarks`에 `taskId?: number`를 추가한다. `task`는 이미 `taskId`를 갖고 있다.
  - `problem_preview` props에 `taskId?: number`를 추가한다.
- 앱은 `openNotebook` / `openTopicLiveClass` / `openHotlineClass`를 부르기 직전에 `taskId`가 없으면 `createTask`(`src/api/graphql/mutations/task.ts`)로 받아 온다.
- `createTask`가 실패해도 캔버스는 연다. 이때는 `client_error { where: 'study_note.ensure_task' }`를 보내고, 그 세션에는 `taskId`가 없다.
- 이 단계를 거친 뒤 `SolveSession.taskId`는 실패한 경우를 빼면 항상 값이 있다.

### 3.2 캔버스 종료 → 에이전트가 양식 띄우기

1. 캔버스의 "나가기"나 뒤로가기를 누르면 화면은 지금처럼 바로 닫는다. 이탈을 막지 않는다.
2. 앱은 다음 이벤트를 보낸다.
   ```ts
   solve_finished: { taskId?: number; kind: 'self' | 'topic_live' | 'hotline'; solvedCount: number }
   ```
3. 에이전트가 물어야 한다고 판단하면 다음 명령을 보낸다.
   ```ts
   show_component('study_note', { taskId: number; mode: 'self' | 'live' })
   ```
   - 태블릿: drawer. 폰: 하단 탭 위 하단 모달. 다른 에이전트 위젯과 같은 자리다.
   - `taskId`가 없거나, 이미 메모가 있거나, 빈도 제한에 걸리면 묻지 않는다. 이 판단은 서버가 한다.
4. `study_note`는 `src/host/registry.ts`에 `mode: 'both'`로 등록한다. props는 zod로 검증한다.
   ```ts
   study_note: { mode: 'both', propsSchema: z.object({ taskId: z.number().int(), mode: z.enum(['self', 'live']) }) }
   ```

### 3.3 나중에 고치기 (타임라인 카드)

- `TimelinePanel` 카드에 학습장 요약 한 줄과 보조 버튼 "학습장"을 추가한다.
- "학습장" 버튼을 누르면 앱이 같은 `StudyNoteForm`을 시트로 직접 연다. 학생이 명시적으로 고른 동작이므로 에이전트를 거치지 않는다.
- mode는 카드의 task가 실황 수업이면 `live`, 아니면 `self`다. 서버의 노트 요약 필드로 판단한다(§7).

### 3.4 저장

- `src/kit/study-note/`는 fetcher 주입형으로 만든다. 기존 kit 패턴과 같다. 구현은 `src/adapters/studyNoteFetchers.ts`에 둔다.
  ```ts
  export interface StudyNoteFetchers {
    fetchNote(taskId: number): Promise<StudyNote | null>;
    saveNote(taskId: number, input: StudyNoteInput, existing: boolean): Promise<void>;
  }
  ```
- 조회는 `studyNote(taskId)`로 한다. 저장은 노트가 없으면 `registerTaskNote`, 있으면 `updateTaskNote`로 한다.
- 저장에 성공하면 `study_note_saved { taskId }`를 보낸다. "나중에"로 닫으면 `study_note_dismissed { taskId }`를 보낸다.

필드 매핑:

| 양식 | API 필드 | 값 |
|---|---|---|
| 얼마나 해냈나요? | `achievementRate` | 조금 25 / 절반 50 / 거의 75 / 다 했어요 100. 고르지 않으면 보내지 않는다. |
| 어려웠던 점 | `difficulties` | 칩 코드를 쉼표로 잇는다(`concept,setup,calc,time` 또는 `none`). 이 앱은 따로 텍스트를 받지 않는다. 기존 노트에 칩 코드가 아닌 텍스트가 있으면 보존한다(§5). |
| 공부한 내용 / 한 줄 메모 | `description` | 최대 200자 |
| 다음 목표 | `expectations` | 최대 200자. `self` 모드에만 있다. |

## 4. 양식 UI

컴포넌트: `src/kit/study-note/StudyNoteForm.tsx`

```ts
type Props = {
  taskId: number;
  mode: 'self' | 'live';
  title: string;            // 문제·주제 제목
  topicHints?: string[];    // 추천 칩(이미 받아 둔 값만)
  fetchers: StudyNoteFetchers;
  onDone(result: 'saved' | 'dismissed'): void;
};
```

### 4.1 `self` 모드

```
학습장 · 2025년 10월 모의고사 21번
얼마나 해냈나요?
 [조금] [절반] [거의] [다 했어요]           ← 단일 선택
어려웠던 점 (여러 개)
 [개념] [식 세우기] [계산] [시간] [없음]     ← '없음'을 고르면 나머지 해제
공부한 내용
 [ 한두 줄 입력 · 최대 200자            ]
 추천: (수열의 귀납적 정의) (일반항)          ← 누르면 입력칸에 추가
▸ 다음 목표 (선택)                           ← 접힘
                          [나중에]  [저장]
```

### 4.2 `live` 모드

- 맨 위에 "선생님 정리" 카드를 둔다. 강의자 설명을 읽기 전용으로, 회색 배경에 보여 준다. 설명이 없으면 "선생님 정리가 아직 없어요"를 보여 준다.
- 그 아래에 달성률 칩, 어려웠던 점 칩, "한 줄 메모 (선택)"를 둔다. 목표 칸은 없다.

### 4.3 동작 규칙

- 저장 버튼은 칩이나 텍스트 중 하나라도 입력이 있으면 켜진다.
- 수정 모드에서는 기존 노트로 미리 채우고, 버튼 문구를 "수정"으로 바꾼다.
- 추천 칩 출처:
  - 주제에서 온 경우: 주제명
  - 기출에서 온 경우: 문제의 단원·개념 태그(이미 받아 둔 값)
  - 둘 다 없으면 추천 줄을 숨긴다. 추천 칩을 위해 새로 조회하지 않는다.
- 키보드가 올라오면 시트나 drawer가 키보드를 피해 위로 올라간다.

### 4.4 타임라인 카드 변경

- 메모가 있을 때: 날짜 줄 위에 `✏️ {description} · {달성률 라벨}`을 한 줄로 보여 준다(`numberOfLines={1}`). 실황 수업은 강의자 설명을 요약으로 보여 준다.
- 메모가 없을 때: 회색으로 "학습장을 남겨 보세요"를 보여 준다.
- "가자!!!" 왼쪽에 테두리 보조 버튼 "학습장"을 둔다. 주 버튼은 여전히 "가자!!!"다.

### 4.5 디자인·접근성

- `src/ui/theme.ts` 토큰과 Pretendard를 쓴다. 주황은 선택된 칩과 저장 버튼에만 쓴다.
- 칩 높이는 32, hitSlop으로 누르는 영역은 44 이상이다.
- 칩에는 `accessibilityRole` `radio`(달성률) / `checkbox`(어려웠던 점)와 `accessibilityState.selected`를 준다. 그룹에는 레이블을 붙인다.
- 감소 모션 설정을 따르고, 이때 시트 애니메이션은 페이드로 바꾼다.
- 문구는 존댓말로 쓴다.

## 5. 오류 처리

| 상황 | 처리 |
|---|---|
| 저장 실패 | 양식을 닫지 않고 입력을 유지한다. "저장하지 못했어요. 다시 시도해 주세요."를 보여 주고 버튼을 "다시 저장"으로 바꾼다. |
| 앱 종료·크래시 | 입력 중인 내용을 MMKV `studyNoteDraft:<taskId>`에 임시 저장한다. 다시 열면 복원하고, 저장에 성공하면 지운다. |
| 기존 노트 조회 실패 | 빈 양식으로 열고 "이전 메모를 불러오지 못했어요"를 안내한다. 저장할 때는 조회를 한 번 더 한 뒤 register와 update 중 하나를 고른다(덮어쓰기 방지). |
| register "이미 있음" 실패 | `updateTaskNote`로 한 번 재시도한다. |
| 기존 `difficulties`에 칩 코드가 아닌 텍스트가 있음 | 알려진 칩 코드만 칩으로 보여 준다. 나머지 텍스트는 저장할 때 그대로 뒤에 붙여 보존한다. |
| taskId 확보 실패 | 캔버스는 연다. `solve_finished`에서 `taskId`를 빼고, 에이전트는 묻지 않는다. `client_error`로 보고한다. |
| 위젯 props 오류·오프라인 | 기존 규칙대로 `invalid_props` / `offline` ack를 보낸다. |

## 6. 테스트

Jest와 React Native Testing Library를 쓰고, 기존 `__tests__/` 패턴을 따른다.

- `studyNoteForm.test.tsx`
  - 칩 규칙: 단일 선택, 다중 선택, "없음" 배타
  - 저장 버튼 활성화 조건
  - 필드 매핑(25/50/75/100, `difficulties` 문자열)
  - 수정 모드 미리 채우기
  - `live` 모드: 강의자 설명 읽기 전용, 목표 칸 없음
  - 저장 실패 시 입력 유지, 임시 저장, 복원
- `studyNoteFetchers.test.ts`
  - 노트가 없으면 register, 있으면 update
  - 조회 실패 뒤 재조회
  - "이미 있음" 실패 시 update로 재시도
  - 칩 코드가 아닌 텍스트 보존
- `m3.test.ts`(registry): `study_note` props 검증 통과와 거절
- `timeline.test.tsx`: 메모 요약 줄, 빈 상태 문구, "학습장" 버튼이 양식을 여는지
- `session.test.ts`와 `mockAgent`: `solve_finished`를 보내면 mock이 `study_note`를 띄우고, 노트가 있으면 띄우지 않는지
- 캔버스 진입: `taskId`가 없으면 `createTask`를 호출하고, 실패해도 캔버스가 열리는지

lint(`npx expo lint`)와 typecheck(`npx tsc --noEmit`)를 통과해야 완료다.

## 7. 서버 계약 (앱 범위 밖, 서버 팀 확인 필요)

1. **taskId 전달:** `problem_list`(`exam_query`·`bookmarks`)와 `problem_preview` props에 `taskId`를 싣는다.
2. **묻기 규칙:** `solve_finished`를 받으면 `show_component('study_note')`를 보낼지 상태 표로 정한다.
   - 메모가 이미 있으면 묻지 않는다.
   - `taskId`가 없으면 묻지 않는다.
   - 빈도 제한 기본값은 매 세션이다. 서버에서 바꿀 수 있다.
3. **강의자 설명 필드:** 실황 수업 강의자 설명은 학생 필드(`description`)와 **별도 필드**로 받는다. 예: `studyNote.tutorDescription`, 또는 `noteType='tutor'`인 별도 노트. 학생이 저장할 때 강의자 설명을 덮어쓰지 않아야 한다.
4. **목록 요약:** `getTaskHistory`(`MY_TASKS`)에 노트 요약을 추가한다. 예: `note { description achievementRate noteType tutorDescription }`. 카드마다 따로 조회하지 않기 위해서다.
5. **기록:** 메모를 저장하면 채팅 타임라인에 `timeline_append`로 기록을 남기고, 일간·주간 정리에 반영한다.

서버 3번과 4번이 준비되기 전에는 앱이 다음처럼 동작한다.

- 노트 요약이 없으면 카드는 "학습장을 남겨 보세요"만 보여 준다.
- `live` 모드의 강의자 설명 영역은 "선생님 정리가 아직 없어요"를 보여 준다.

## 8. 범위 밖

- 손글씨 이미지 메모
- 메모 검색과 모아보기 화면(다이어리 연동은 다음 단계)
- 튜터가 앱 안에서 학생 메모에 답하기
- 위에 적은 것 외의 프로토콜 변경. 이번에 추가하는 것은 이벤트 `solve_finished`·`study_note_saved`·`study_note_dismissed`, 위젯 `study_note`, props의 `taskId?` 필드뿐이다.
