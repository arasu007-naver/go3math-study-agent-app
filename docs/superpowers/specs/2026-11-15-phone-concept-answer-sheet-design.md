# 폰 문제 목록의 개념 조회·해답 시트·학습장 설계

- 작성일: 2026-11-15
- 상태: 승인됨(대화에서 결정)
- 앞선 설계: `2026-11-12-canvas-concept-answer-sheet-design.md`, `2026-11-14-study-note-activities-design.md`
- 관련 코드: `src/phone/PhoneScreens.tsx`, `src/phone/PhoneStudy.tsx`(신규), `src/layout/fullScreenRoutes.ts`

## 1. 목적

폰에는 풀이 캔버스가 없어 개념 조회와 학습장 흐름이 빠져 있다. 폰의 문제 목록 화면(문제 묶음·책갈피·주제 문제)에서도 개념을 조회하고, 나갈 때 학습장에 그 개념을 남길 수 있게 한다. 해답은 화면을 넘기지 않고 목록 위 bottom modal로 본다.

## 2. 접근 방식

| 안 | 내용 | 판단 |
|---|---|---|
| A. 폰 화면에 직접 | 폰 결과 화면(`ProblemsResultScreen`·`TopicResultScreen`)이 FAB·시트·나갈 때 처리를 갖는다. kit 패널은 그대로. | **선택**. 태블릿 Stage의 `ProblemListPanel`(말풍선 해답·연필 FAB)을 건드리지 않는다. |
| B. `ProblemListPanel`에 넣기 | 패널이 개념 FAB와 해답 시트를 직접 그린다. | 태블릿과 폰 동작이 한 컴포넌트에서 갈라지고 `TopicUnitList`에도 같은 코드를 또 넣어야 한다. |
| C. `useSolveFinished` 재사용 | 목록 화면을 캔버스처럼 다뤄 `solve_finished`를 보내고 에이전트가 학습장을 띄운다. | 폰은 결과 화면을 앱이 바로 여는 규칙이고, 에이전트는 풀이 수 0이면 학습장을 띄우지 않는다. |

## 3. 동작

### 3.1 개념 FAB와 모달

- 폰 문제 목록·주제 문제 화면 오른쪽 아래에 책 아이콘 FAB('개념 조회')를 둔다. 폰은 연필 FAB를 쓰지 않으므로 그 자리다.
- 누르면 `ConceptLookupPanel`이 든 bottom modal(90%)이 열린다. 고른 개념은 캔버스와 같은 `pickedConceptsStore`에 둔다.
- 이번 화면에서 새로 고른 개념만 그 화면의 활동 기록에 더한다(캔버스 `CanvasStudySheet`와 같은 규칙).

### 3.2 해답 bottom modal

- 문제 카드의 눈 버튼, Diary 그날 기록의 '답안 예시'는 `/…/solution` 화면으로 가지 않고 해답 WebView가 든 bottom modal(70%, 손잡이로 90%까지)을 연다.
- 쓰는 곳이 없어진 `/timeline|search|chat|diary/solution` 라우트와 `SolutionResultScreen`은 지운다.
- 두 시트 모두 Android 뒤로 가기는 시트만 닫는다.

### 3.3 나갈 때 학습장

- 화면이 사라질 때(뒤로 버튼·제스처) 개념을 조회했거나 풀이 사진을 올렸으면 학습장 시트를 앱이 바로 연다(`session.showLocalSheet('study_note', …)`).
- task: 이미 있으면 그 task, 없으면 그 목록의 spec으로 `ensureTaskId`를 불러 만든다(사용자 결정 2026-11-15: 사진 없이 개념만 조회해도 task를 만든다). 만들지 못하면 학습장을 띄우지 않고 기록을 버린다.
- 조회한 개념은 `appendActivity`로 그 task 키에 저장해, 학습장 양식의 추천 칩으로 보인다.
- mode: 실황 수업 목록(hotline·topic_live)은 `live`, 나머지는 `self`. 주제 문제 화면은 주제 제목을 `topicHints`로 넘긴다.
- `solve_finished`는 보내지 않는다(에이전트가 같은 시트를 또 띄우지 않게).

## 4. 범위 밖

- 태블릿 Stage의 문제 목록(말풍선 해답·연필 FAB)
- `docs/ui-structure/*`(생성 문서) 갱신
- 서버 변경

## 5. 테스트

- `__tests__/phoneStudy.test.tsx`: 개념만 조회 → task를 만들고 기록 저장 후 학습장 시트를 연다 / 아무것도 안 했으면 열지 않는다 / task를 못 만들면 열지 않는다 / 사진만 올려도 연다.
- `__tests__/fullScreenRoutes.test.ts`: solution 경로 제거 반영.
- `npx tsc --noEmit`, `npx expo lint`, `npx jest` 통과.
