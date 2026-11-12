# UI 디자인 개선 — 단계 2 (역할·정보구조·오버레이) 설계

- 작성일: 2026-11-10
- 상위 스펙: `docs/design/qoolla-ui-design-improvement-spec.md` (이하 "개선 스펙") §단계 2
- 선행: 단계 1 진단 `docs/ui-redesign/01-diagnosis.md` (2026-11-10 Gate A 조건부 승인, §12)
- 범위: 개선 스펙 단계 2. **Gate B 승인 요청에서 끝난다.** 단계 3 이후는 별도 설계·계획 사이클로 다룬다.

## 1. 목표

화면·오버레이 각각이 무엇을 막고, 어떻게 열리고 닫히며, 어느 층에 놓이고, Phone과 Tablet에서 어떤 모습인지를 한 문서로 정한다. 사용자는 이 문서 하나로 Gate B를 판단한다. 이 사이클에서는 앱 소스(`app/`, `src/`)를 수정하지 않는다.

성공 기준:

1. `docs/ui-redesign/02-ia-overlay-roles.md`가 역할 정의(5종), 층 순서, 노드 66개 전부의 역할 표, 어긋남 목록, 기능 이름 대응표, 태블릿·Phone 배치 원칙, Gate B 질문을 담고 있다.
2. `docs/ui-redesign/02-roles.json`이 역할 표와 같은 행을 담고, `docs/ui-redesign/tools/check-roles.mjs`가 통과한다.
3. 단계 1 검증 스크립트 두 개(`check-structure.mjs`, `check-captures.mjs`)가 계속 통과한다(블록도·캡처 미변경).
4. `git diff --stat 76b99e3 -- app src package.json`의 출력이 비어 있다.

## 2. 결정 사항 (단계 2 브레인스토밍, 2026-11-10)

진단 §10의 질문 다섯 개에 사용자가 답한 것이다.

| # | 질문 | 결정 | 관련 이슈 |
|---|---|---|---|
| Q1 | dock이 열려 있을 때 Stage를 계속 조작할 수 있어야 하는가 | **Modeless.** dock 밖에 보이는 Stage는 계속 조작된다. scrim 없음 | D-02, D-10 |
| Q2 | 캔버스 시트는 툴바를 덮는가, 툴바 위에서 멈추는가 | **툴바 위에서 멈춘다.** 시트가 열려도 툴바와 보이는 캔버스를 쓸 수 있다 | D-04 |
| Q3 | 기능 이름을 어느 한 벌로 | **한국어 + 제품 이름 두 개**: 타임라인 · Diary · 검색 · 실황 수업 · 내 정보 · Study Log | D-09 |
| Q4 | 태블릿 내비 기준 | **떠 있는 툴바(rail)가 기준.** 있는 기능만 보인다. 주간 공부는 예약 칸으로 기록하고 화면이 생기면 rail에 넣는다. 6칸 기능은 목록으로 보존한다 | 진단 §10-4 |
| Q5 | 캡처를 언제 채우는가 | **단계 4 파일럿 때.** 파일럿 화면을 바꾸기 직전 실기기 iPad로 전, 끝난 뒤 후를 찍는다. 단계 2~3은 코드 근거로 진행하고 기존 시뮬레이터 캡처는 출처 미확인 표시를 유지한다 | Gate A 조건 |
| — | 문서 작성 방식 | **안 A: 역할 먼저, 모든 노드 분류.** 블록도(단계 1 산출물)는 고치지 않고 node id로 참조한다 | — |

## 3. 산출물

| 파일 | 내용 |
|---|---|
| `docs/ui-redesign/02-ia-overlay-roles.md` | 본 문서의 §4~§8을 채운 단계 2 보고서. 개선 스펙의 산출물 |
| `docs/ui-redesign/02-roles.json` | 역할 표의 기계 판독 사본: `{ meta, roles, layers, rows, deviations, names }` |
| `docs/ui-redesign/tools/check-roles.mjs` | 역할 표 검증(§9) |
| `docs/ui-redesign/1794280544402-contituous-guide.md` | 단계 상태 표를 `2 승인대기`로 갱신 |

보고서 머리의 요약 표에는 단계 1과 같이 사용한 스킬(`impeccable` `shape`, `adapt` + native 참고)과 쓰지 않은 스킬, 소스 변경 없음을 적는다.

## 4. 역할 정의

| 역할 | 대상(현재 블록도 kind) | 뒤를 막는가 | 열림 / 닫힘 | Phone ↔ Tablet |
|---|---|---|---|---|
| **Screen** | `screen` 24 | 영역 전체를 차지한다 | 라우트로 연다. 뒤로가기는 지금처럼 `back_requested`로 에이전트에 넘긴다(의미 불변) | 같은 라우트. 늘리지 않고 재구성한다(`adapt`) |
| **Dock** | `dock_*` 6 (`dock_timeline`, `dock_notice`, `dock_search`, `dock_live`, `dock_profile`, `dock_chat`) | **막지 않는다**(Q1). scrim 없음, 보이는 Stage는 조작된다 | rail 항목으로 연다. 같은 항목·✕·기존 규칙(Stage에 문제 목록이 뜨면 닫힘, Diary의 `list` 출처는 예외)으로 닫는다. 한 번에 하나 | 태블릿 전용. Phone에서는 각 dock이 탭 화면이다 |
| **Modeless** | `modeless` 중 dock을 뺀 10 (`global_loading`, `tablet_launch`, `chat_rail`, `agent_toast`, `canvas_toolbar`, `landscape_notice`, `tl_toast`, `tl_memo`, `hl_toast`, `hl_memo`) | 자기 영역 밖의 입력을 막지 않는다. 경쟁하는 Stage 콘텐츠를 가리지 않는다(D-02) | 부모 화면이 소유한다 | rail·캔버스 툴바는 태블릿 전용, toast는 둘 다 |
| **Bottom Sheet** | `bottomsheet` 6 | 자기 영역만 덮는다. **캔버스에서는 툴바 위에서 멈춘다**(Q2) | 보이는 닫기 컨트롤 + 끌어 닫기. 높이는 공용 단계에서 고른다(단계 개수는 단계 2, 수치는 단계 3) | 같은 역할 |
| **Modal** | `modal` 13 | **막는다.** scrim 있음 | 명시적 선택이나 닫기가 있어야 닫힌다(확인, 선택기, 퀴즈, PDF, 목록 모달) | Phone에서는 전체 높이 시트로 보일 수 있다 |
| (역할 밖) | `navigator` 6, `external` 1 | — | — | 오버레이가 아니다. 표에 사유와 함께 남긴다 |

합계: 역할 59 + 역할 밖 7 = 66.

## 5. 층 순서

아래에서 위로: Stage → 캔버스 툴바 → Bottom Sheet(툴바 옆에 놓이고 툴바 위로 겹치지 않는다) → Dock → rail → toast → Modal → 시스템 UI.

- toast가 dock보다 위인 이유: dock이 열려 있어도 튜터 메시지가 보여야 한다(PRODUCT.md 원칙 3 "사람 튜터가 먼저다").
- D-02 처리 1안: Stage가 rail의 현재 변을 inset으로 비워 둔다. rail을 끌거나 가로로 바뀌면 다시 계산한다. 대안(rail을 콘텐츠 밖 고정 위치로 제한, rail 반투명화)은 비교표로 함께 적는다. 수치는 정하지 않는다.

## 6. 역할 표와 어긋남

- 행: node id, 역할, 역할이 기대하는 차단성, 블록도에 기록된 `blocking`, 열림·닫힘, Phone/Tablet 형태, 어긋남 id. 66행.
- 어긋남: 노드, 어긴 규칙, 진단 id(없으면 `NEW-nn`), 고칠 단계. 시작 목록은 D-02(rail이 카드를 가림), D-04(시트가 툴바를 덮음·높이 세 가지), D-10(dock 폭과 Stage inset), D-07(목록 모달 배치), D-13(대화상자 틀 세 벌), D-11(프로필 동작 위치 Phone/Tablet 불일치)이고, 분류 중 새로 찾은 것을 더한다.
- D-06(가로 빈 띠)은 사용자 결정 대기로 기록만 하고 안을 내지 않는다. 제한 목록(`landscapeRestrictions.ts`)은 채우지 않는다.

## 7. 기능 이름

- 최종 한 벌(Q3): 타임라인 · Diary · 검색 · 실황 수업 · 내 정보 · Study Log.
- 표면별 옛 이름 → 새 이름 대응표를 둔다. 확인된 변경: Phone 탭 `History` → 타임라인, dock 제목 `Study` → 타임라인, 하단 6칸 정의 `공지` → Diary(공지는 Diary 안의 탭으로 남는다).
- 같은 규칙으로 펜 색 **표시 라벨**은 한국어(주황, 파랑, 검정, 빨강, 초록)로 적는다. 저장값 `orange, blue, black, red, green`은 바꾸지 않는다.
- 코드 속 라벨 교체는 단계 3 이후다.

## 8. 배치 원칙

- **태블릿**: rail이 기준(Q4). 항목 순서는 현재 rail을 따른다. 주간 공부는 예약 칸. 렌더되지 않는 `DrawerFooter`는 레거시로 기록하고 삭제 여부는 단계 3의 코드 결정으로 넘긴다. drawer 폭 % 등 배치 수치는 안만 내고 6칸 기능·필기·학습 상태 보존 요구와 분리해 적는다(개선 스펙 §단계 2).
- **Phone**: 탭 5개(타임라인 · 검색 · Diary · 내 정보 · Study Log)가 6칸 기능 중 넷을 맡는다. 실황 수업과 주간 공부는 Phone 진입점이 없다. Gate B 질문으로 올리고, 실황 수업의 Phone 위치는 1안+근거를 낸다.
- Phone ↔ Tablet은 늘리기가 아니라 재구성이다(`impeccable adapt`, native 참고).

## 9. 검증

`check-roles.mjs <02-roles.json> <02-ia-overlay-roles.md> <ui-structure.json> <01-diagnosis.md>`는 다음 중 하나라도 어기면 실패한다.

1. `ui-structure.json`의 node id가 역할 표에 없다.
2. 역할 표에 없는 node id가 있다.
3. 역할이 5종 또는 `outside`가 아니다. `outside`에는 사유가 있어야 한다.
4. 어긋남 id가 진단 문서에 없고 `NEW-nn` 형식도 아니다.
5. md 표와 json의 행 수가 다르다.

함께 돌리는 것:

- 단계 1 검증 스크립트 두 개 — 결과가 `OK nodes=66 edges=115`, `OK done=26 blocked=47` 그대로여야 한다.
- `git diff --stat 76b99e3 -- app src package.json` — 출력 없음.

## 10. 범위 밖

- 픽셀·토큰 값, 시트 높이 수치, dock 폭 수치(단계 3).
- 모든 코드 변경(`DrawerFooter` 삭제, 코드 속 라벨 교체 포함).
- Landscape 제한 목록.
- 캡처(Q5에 따라 단계 4 파일럿).
- push, PR.

## 11. 끝맺음

단계 2를 `승인대기`로 보고하고 Gate B 질문(Phone의 실황 수업·주간 공부 진입점, D-02 처리안, 시트 높이 단계 개수 등)을 사용자에게 묻는다. 승인 전에는 단계 3을 시작하지 않는다.
