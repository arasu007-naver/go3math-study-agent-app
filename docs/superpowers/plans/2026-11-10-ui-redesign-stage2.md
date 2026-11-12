# UI 디자인 개선 단계 2 (역할·정보구조·오버레이) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 화면·오버레이 66개 노드 각각의 역할(차단성·열림/닫힘·층·Phone/Tablet 형태)을 한 문서로 정하고, 검증 스크립트로 빠짐없음을 증명해 Gate B 승인을 요청한다.

**Architecture:** 산출물은 문서 두 개(`02-ia-overlay-roles.md`, `02-roles.json`)와 검증 스크립트 하나다. 역할 표의 원천은 JSON이고, md 표는 사람이 읽는 같은 행이다. 검증 스크립트가 JSON·md·블록도(`ui-structure.json`)·진단(`01-diagnosis.md`)을 서로 대조한다. 블록도와 앱 소스는 건드리지 않는다.

**Tech Stack:** Node 22(`node:test`, ESM `.mjs`), `impeccable` 스킬(`shape`, `adapt` + native 참고), `rg`.

**Spec:** `docs/superpowers/specs/2026-11-10-ui-redesign-stage2-design.md` (상위: `docs/design/qoolla-ui-design-improvement-spec.md` §단계 2, 진단: `docs/ui-redesign/01-diagnosis.md`)

## Global Constraints

- `app/`, `src/`, `package.json`은 수정하지 않는다. 기준 커밋 `76b99e3`. 확인 명령 `git diff --stat 76b99e3 -- app src package.json`의 출력이 비어야 한다.
- 단계 1 산출물(`docs/ui-structure/*`, `docs/ui-redesign/captures/01/*`)은 수정하지 않는다.
- 작업 브랜치 `design/ui-redesign`. push, PR, 배포는 하지 않는다. 의존성 추가 금지.
- 역할은 `screen | dock | modeless | bottomsheet | modal | outside` 여섯 값만 쓴다.
- 역할별 기대 차단성: `screen` → `null`, `dock` → `false`, `modeless` → `false`, `bottomsheet` → `false`, `modal` → `true`, `outside` → `null`.
- 어긋남 id는 진단에 있는 `D-01`~`D-13`이거나 새로 찾은 `NEW-01`, `NEW-02`, … 형식만 쓴다.
- 기능 이름 최종 한 벌: 타임라인 · Diary · 검색 · 실황 수업 · 내 정보 · Study Log.
- 펜 색 저장값 `orange, blue, black, red, green`은 바꾸지 않는다. 표시 라벨만 주황 · 파랑 · 검정 · 빨강 · 초록으로 적는다.
- 픽셀·토큰 값, 시트 높이 수치, dock 폭 수치는 정하지 않는다. Landscape 제한 목록은 채우지 않는다.
- 사실은 코드에서 확인한 것만 `파일:라인`으로 적는다. 확인하지 못한 것은 `미확인`으로 적는다. 캡처는 시뮬레이터·출처 미확인 표시를 그대로 둔다.
- 단계 상태 표기는 `미착수 | 진행 | 승인대기 | 완료 | blocked`만 쓴다.
- 문서는 한국어, 존댓말 없이 평서문(단계 1 문서와 같은 문체).
- 커밋 메시지는 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`로 끝낸다.

## Review Focus

1. **기록된 차단성이 역할과 다른 노드** — `study_note_sheet`는 블록도에 `blocking: true`로 기록돼 있지만 Bottom Sheet의 기대값은 `false`다. 역할을 바꿔 맞추지 말고 어긋남으로 드러내야 한다. → Task 1 `mismatch needs deviation` 테스트, Task 2 Step 3.
2. **두 기기에 다 있는 노드** — `modes`가 `["phone","tablet"]`인 12개는 Phone/Tablet 칸에 두 형태를 다 적어야 한다. 한쪽만 적으면 adapt 결정이 빠진다. → Task 1 `forms must name every mode` 테스트.
3. **고아 노드 4개**(`timeline_topic`, `global_loading`, `tl_popup`, `hl_popup`) — 진입 경로가 없어도 역할 표에서 빠지면 안 된다. → Task 1 `missing row` 테스트, Task 2 Step 2.
4. **md 셀 안의 `|`** — 열림·닫힘 설명에 `|`가 들어가면 표가 깨져 다른 열이 밀린다. → Task 1 `md columns` 테스트.
5. **펜 색 저장값이 이름 대응표에서 바뀌어 보이는 것** — 대응표에 저장값 열을 두고 그대로 적어야 한다. → Task 3 Step 3의 확인 명령.

---

## File Structure

| 파일 | 책임 |
|---|---|
| Create `docs/ui-redesign/tools/check-roles.mjs` | `checkRoles()` 함수(대조 규칙)와 CLI 진입점 |
| Create `docs/ui-redesign/tools/check-roles.test.mjs` | `node:test`로 규칙마다 실패 사례를 고정 |
| Create `docs/ui-redesign/02-roles.json` | 역할 표의 원천 |
| Create `docs/ui-redesign/02-ia-overlay-roles.md` | 단계 2 보고서(개선 스펙 산출물) |
| Modify `docs/ui-redesign/1794280544402-contituous-guide.md` | 단계 상태 표, 이어서 할 일 |

### `02-roles.json` 형태 (Task 1이 검증하고 Task 2·3이 채운다)

```json
{
  "meta": { "stage": 2, "baseline": "76b99e3", "structure": "docs/ui-structure/ui-structure.json" },
  "roles": ["screen", "dock", "modeless", "bottomsheet", "modal", "outside"],
  "layers": ["Stage", "캔버스 툴바", "Bottom Sheet", "Dock", "rail", "toast", "Modal", "시스템 UI"],
  "rows": [
    { "id": "dock_live", "role": "dock", "expectedBlocking": false, "recordedBlocking": false,
      "openClose": "…", "forms": "Tablet: …", "deviations": [], "reason": null }
  ],
  "deviations": [
    { "id": "D-02", "nodes": ["chat_rail", "agent_home"], "rule": "…", "stage": 3 }
  ],
  "names": [
    { "surface": "Phone 탭", "file": "app/(main)/_layout.tsx:22", "old": "History", "new": "타임라인" }
  ]
}
```

`deviations[].stage`는 `2 | 3 | 4 | "사용자 결정"` 중 하나다.

### `02-ia-overlay-roles.md` 절 구성 (번호 고정, Task 1의 파서가 `## 3. 역할 표`를 찾는다)

`## 1. 요약` · `## 2. 역할 정의와 층 순서` · `## 3. 역할 표` · `## 4. 어긋남` · `## 5. 기능 이름` · `## 6. 배치 원칙` · `## 7. Gate B 요청` · `## 8. 소스 변경 파일`

`## 3. 역할 표`의 열(7개, 이 순서): `node id | 역할 | 기대 차단 | 기록 blocking | 열림·닫힘 | Phone / Tablet | 어긋남`. node id 셀은 백틱으로 감싸도 되고, 차단 값은 `true`/`false`/`—`(null), 어긋남은 쉼표로 구분하거나 `—`.

---

### Task 1: 역할 표 검증 스크립트

**Files:**
- Create: `docs/ui-redesign/tools/check-roles.mjs`
- Test: `docs/ui-redesign/tools/check-roles.test.mjs`

**Interfaces:**
- Consumes: 없음.
- Produces:
  - `export function checkRoles({ roles, md, structure, diagnosis }): string[]` — `roles`는 파싱한 `02-roles.json`, `structure`는 파싱한 `ui-structure.json`, `md`·`diagnosis`는 파일 내용 문자열. 오류 문장 배열을 돌려주고 문제가 없으면 `[]`.
  - CLI: `node docs/ui-redesign/tools/check-roles.mjs <02-roles.json> <02-ia-overlay-roles.md> <ui-structure.json> <01-diagnosis.md>` — 오류가 있으면 `FAIL` 다음 줄마다 오류를 stderr에 쓰고 종료 코드 1, 없으면 `OK rows=<행 수> deviations=<어긋남 수>`를 stdout에 쓰고 0. 파일이 없으면 `FAIL missing <경로>`, 종료 코드 1.

오류 문장은 아래 접두어로 시작한다(테스트가 접두어로 찾는다).

| 규칙 | 오류 접두어 |
|---|---|
| 블록도 노드가 rows에 없음 | `missing row <id>` |
| rows의 id가 블록도에 없음 | `unknown node <id>` |
| rows id 중복 | `duplicate row <id>` |
| role이 `roles` 여섯 값 밖 | `bad role <id>` |
| `outside`인데 `reason`이 비었음 | `outside without reason <id>` |
| `expectedBlocking`이 역할별 기대값과 다름 | `expected blocking <id>` |
| `recordedBlocking`이 블록도 `blocking`과 다름 | `recorded blocking <id>` |
| 기대·기록 차단이 다른데 `deviations`가 비었음 | `mismatch needs deviation <id>` |
| 블록도 `modes`의 기기(`phone`→`Phone`, `tablet`→`Tablet`)가 `forms`에 없음 | `forms must name every mode <id>` |
| 어긋남 id가 `D-\d\d`인데 진단 문서에 없음, 또는 두 형식 어디에도 안 맞음 | `unknown deviation <id>` |
| row가 `deviations` 목록에 없는 id를 참조 | `undeclared deviation <rowId> <devId>` |
| `deviations[].stage`가 허용값 밖 | `bad stage <devId>` |
| md `## 3. 역할 표` 행의 열이 7개가 아님 | `md columns <id>` |
| md 행 수 ≠ rows 수 | `md rows <md수> != json <json수>` |
| md 행의 역할이 json과 다름 | `md role <id>` |

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`check-roles.test.mjs`는 `node:test`의 `test`와 `node:assert/strict`를 쓰고 `./check-roles.mjs`에서 `checkRoles`를 가져온다. 공용 고정값을 만드는 `fixture()`를 두고 테스트마다 한 곳만 깨뜨린다.

```js
const structure = { nodes: [
  { id: 'home', kind: 'screen', blocking: null, modes: ['phone', 'tablet'] },
  { id: 'confirm', kind: 'modal', blocking: true, modes: ['tablet'] },
  { id: 'nav_root', kind: 'navigator', blocking: null, modes: ['phone', 'tablet'] },
] };
// fixture(): roles = { roles:[여섯 값], rows:[
//   { id:'home', role:'screen', expectedBlocking:null, recordedBlocking:null, forms:'Phone: 탭 화면 / Tablet: Stage', deviations:[] },
//   { id:'confirm', role:'modal', expectedBlocking:true, recordedBlocking:true, forms:'Tablet: 대화상자', deviations:['D-13'] },
//   { id:'nav_root', role:'outside', expectedBlocking:null, recordedBlocking:null, forms:'Phone / Tablet', deviations:[], reason:'navigator' } ],
//   deviations:[{ id:'D-13', nodes:['confirm'], rule:'대화상자 틀 하나', stage:3 }] }
// md = '## 3. 역할 표\n| node id | 역할 | … 7열 머리 |\n|---|…|\n' + 행 세 줄 + '\n## 4. 어긋남\n'
// diagnosis = '| D-13 | P3 | …'
```

테스트(이름 → 단언):

- `valid fixture passes` → `assert.deepEqual(checkRoles(f), [])`
- `missing row` → `home` 행을 빼면 오류 중 하나가 `missing row home`으로 시작
- `unknown node` → id `ghost` 행 추가 → `unknown node ghost`
- `duplicate row` → `home` 행 두 번 → `duplicate row home`
- `bad role` → `home.role = 'page'` → `bad role home`
- `outside without reason` → `nav_root.reason = ''` → `outside without reason nav_root`
- `expected blocking` → `confirm.expectedBlocking = false` → `expected blocking confirm`
- `recorded blocking` → `confirm.recordedBlocking = false` → `recorded blocking confirm`
- `mismatch needs deviation` → 블록도 `confirm.kind='modal'`은 두고 `confirm.recordedBlocking`과 블록도 `blocking`을 둘 다 `false`, `deviations: []` → `mismatch needs deviation confirm`
- `forms must name every mode` → `home.forms = 'Tablet: Stage'` → `forms must name every mode home`
- `unknown deviation` → `confirm.deviations=['D-99']`, `deviations[0].id='D-99'` → `unknown deviation D-99`; 별도 단언으로 `NEW-1`도 `unknown deviation NEW-1`, `NEW-01`은 통과
- `undeclared deviation` → `home.deviations=['D-13']`은 통과하지만 `home.deviations=['NEW-02']`(목록에 없음) → `undeclared deviation home NEW-02`
- `bad stage` → `deviations[0].stage = 5` → `bad stage D-13`
- `md columns` → md의 `home` 행 열림·닫힘 셀에 `a | b` → `md columns home`
- `md rows` → md에서 한 행을 빼면 `md rows 2 != json 3`
- `md role` → md의 `home` 행 역할 셀을 `modal`로 → `md role home`

- [ ] **Step 2: 테스트가 실패하는지 본다**

Run: `node --test docs/ui-redesign/tools/check-roles.test.mjs`
Expected: FAIL — `Cannot find module` (`check-roles.mjs`가 아직 없음)

- [ ] **Step 3: `checkRoles({ roles, md, structure, diagnosis }): string[]`를 `check-roles.mjs`에 구현한다**

md 파싱: `md.split('## 3. 역할 표')[1]`을 다음 `\n## `에서 자르고, `|`로 시작하는 줄 중 머리(`node id`)와 구분선(`---`)을 뺀 것이 행이다. 셀은 `split('|').slice(1, -1).map(trim)`, node id 셀은 백틱을 지운다. 진단 id 존재는 `diagnosis.includes(id)`로 본다. CLI는 `import.meta.url === pathToFileURL(process.argv[1]).href`일 때만 돈다. 기존 도구(`check-captures.mjs`)처럼 짧은 함수 하나로 둔다.

- [ ] **Step 4: 테스트가 통과하는지 본다**

Run: `node --test docs/ui-redesign/tools/check-roles.test.mjs`
Expected: PASS, `# fail 0`

- [ ] **Step 5: 커밋**

```bash
git add docs/ui-redesign/tools/check-roles.mjs docs/ui-redesign/tools/check-roles.test.mjs
git commit -m "docs(ui-redesign): add role table checker for stage 2"
```

---

### Task 2: 역할 정의·역할 표·어긋남 (`02-roles.json`, md §1~§4)

**Files:**
- Create: `docs/ui-redesign/02-roles.json`
- Create: `docs/ui-redesign/02-ia-overlay-roles.md` (§1~§4, §8. §5~§7은 머리만 두고 Task 3이 채운다)

**Interfaces:**
- Consumes: Task 1의 CLI.
- Produces: `02-roles.json`의 `rows`(66), `deviations`, `roles`, `layers`. Task 3이 `names`를 더하고 md §5~§7을 채운다.

- [ ] **Step 1: `impeccable shape`를 불러온다**

`impeccable` 스킬의 `shape` 참고(`reference/shape.md`)를 읽고 그 절차를 역할 정의와 층 순서에 적용한다. `impeccable context`는 이번 세션에 이미 돌았으면 다시 돌리지 않는다.

- [ ] **Step 2: 66행을 채운다**

`docs/ui-structure/ui-structure.json`의 노드마다 한 행. 역할은 kind에서 시작한다: `screen`→`screen`, `modal`→`modal`, `bottomsheet`→`bottomsheet`, `dock_*` 6개→`dock`, 나머지 `modeless` 10개→`modeless`, `navigator`·`external`→`outside`(사유: "오버레이가 아닌 내비게이터" / "앱 밖 시스템"). `recordedBlocking`은 블록도 값을 그대로 옮긴다. `openClose`와 `forms`는 노드의 `file`을 읽어 확인한 진입·닫힘 수단을 `파일:라인`과 함께 한 줄로 적고, 셀에 `|`를 쓰지 않는다. 고아 노드 4개도 행을 가진다.

- [ ] **Step 3: 어긋남을 채운다**

시작 목록(spec §6): `D-02`, `D-04`, `D-07`, `D-10`, `D-11`, `D-13`, 그리고 `D-06`(stage `"사용자 결정"`, 안 없음). 기대·기록 차단이 다른 행(최소 `study_note_sheet`)은 `NEW-01`부터 번호를 매겨 규칙과 근거 `파일:라인`, 고칠 단계를 적는다. 역할을 바꿔 맞추지 않는다.

- [ ] **Step 4: md §1~§4·§8을 쓴다**

§1 요약 표: 단계/상태 `단계 2 / 진행`, 기준 `76b99e3`, 사용한 스킬 `impeccable`(`shape`, `adapt` + native 참고), 쓰지 않은 스킬, 소스 변경 `없음`. §2는 spec §4 역할 표와 §5 층 순서·toast 근거. §3은 JSON rows를 7열 표로. §4는 deviations 표(`id | 노드 | 어긴 규칙 | 근거 | 고칠 단계`). §8은 "없음".

- [ ] **Step 5: 검증한다**

Run: `node docs/ui-redesign/tools/check-roles.mjs docs/ui-redesign/02-roles.json docs/ui-redesign/02-ia-overlay-roles.md docs/ui-structure/ui-structure.json docs/ui-redesign/01-diagnosis.md`
Expected: `OK rows=66 deviations=<7 이상>`

- [ ] **Step 6: 커밋**

```bash
git add docs/ui-redesign/02-roles.json docs/ui-redesign/02-ia-overlay-roles.md
git commit -m "docs(ui-redesign): classify all 66 nodes into overlay roles and list deviations"
```

---

### Task 3: 기능 이름·배치 원칙·Gate B 요청 (md §5~§7, `names`)

**Files:**
- Modify: `docs/ui-redesign/02-ia-overlay-roles.md` (§5~§7)
- Modify: `docs/ui-redesign/02-roles.json` (`names`)

**Interfaces:**
- Consumes: Task 2의 rows·deviations(§6이 `D-02`, `D-10`, `D-11`을 참조).
- Produces: 완성된 보고서. Task 4가 상태만 `승인대기`로 바꾼다.

- [ ] **Step 1: `impeccable adapt`와 native 참고를 불러온다**

`reference/adapt.md`와 `reference/adapt.native.md`를 읽고 Phone ↔ Tablet을 늘리기가 아닌 재구성으로 적용한다.

- [ ] **Step 2: §5 기능 이름을 쓴다**

표 열: `표면 | 근거 파일:라인 | 옛 이름 | 새 이름`. 표면 네 벌은 Phone 탭(`app/(main)/_layout.tsx`), dock 제목(`src/agent/tablet/TabletAgentLayer.tsx`의 `DOCK_TITLES`), rail 라벨(`src/agent/tablet/ChatRail.tsx`의 `RAIL_ITEMS`), 하단 6칸 정의(`src/agent/tablet/DrawerFooter.tsx`의 `FOOTER_ITEMS`)이고, 라인 번호는 실행 시점 코드에서 읽는다. 확정 변경: `History` → 타임라인, `Study` → 타임라인, `공지` → Diary(공지는 Diary 안의 탭). 펜 색은 따로 `표시 라벨 | 저장값` 표로 주황/`orange` · 파랑/`blue` · 검정/`black` · 빨강/`red` · 초록/`green`. 같은 내용을 `names`에 넣는다. 코드 교체는 단계 3 이후라고 적는다.

- [ ] **Step 3: 펜 색 저장값이 그대로인지 본다**

Run: `rg -n "orange|blue|black|red|green" docs/ui-redesign/02-ia-overlay-roles.md`
Expected: §5 펜 색 표의 저장값 열에 다섯 값이 원래 철자로 나온다.

- [ ] **Step 4: §6 배치 원칙을 쓴다**

- 태블릿: rail이 기준, 항목 순서는 현재 `RAIL_ITEMS`, 주간 공부는 예약 칸, `DrawerFooter`는 레거시(삭제 여부는 단계 3). dock은 Modeless(scrim 없음, 보이는 Stage 조작). drawer·dock 폭은 안만 내고 수치 없음.
- D-02 처리 비교표: 1안(Stage가 rail의 현재 변을 inset으로 비움, 끌기·가로 전환 때 재계산) / 대안(rail을 콘텐츠 밖 고정 위치로 제한) / 대안(rail 반투명). 열: `안 | 가림 해결 | 필기 방해 | 구현 범위 | 근거`. 1안을 추천으로 표시.
- 캔버스 시트: 툴바 위에서 멈춤, 높이 단계 개수 1안+근거(수치 없음), 보이는 닫기 + 끌어 닫기.
- Phone: 탭 5개가 6칸 기능 중 넷을 맡는다. 실황 수업·주간 공부는 진입점 없음. 실황 수업 Phone 위치 1안+근거.
- 6칸 기능·필기·학습 상태 보존 요구를 배치 안과 별도 줄로 적는다.

- [ ] **Step 5: §7 Gate B 요청을 쓴다**

질문만 적고 답은 정하지 않는다: Phone의 실황 수업 진입점(1안), 주간 공부 예약 칸 처리, D-02 1안 채택, 시트 높이 단계 개수, `NEW-nn` 어긋남 각각의 처리 단계.

- [ ] **Step 6: 검증한다**

Run: `node docs/ui-redesign/tools/check-roles.mjs docs/ui-redesign/02-roles.json docs/ui-redesign/02-ia-overlay-roles.md docs/ui-structure/ui-structure.json docs/ui-redesign/01-diagnosis.md`
Expected: `OK rows=66 deviations=<Task 2와 같은 수>`

- [ ] **Step 7: 커밋**

```bash
git add docs/ui-redesign/02-ia-overlay-roles.md docs/ui-redesign/02-roles.json
git commit -m "docs(ui-redesign): add name map, layout principles and Gate B questions"
```

---

### Task 4: 전체 검증과 Gate B 요청

**Files:**
- Modify: `docs/ui-redesign/02-ia-overlay-roles.md` (§1 상태)
- Modify: `docs/ui-redesign/1794280544402-contituous-guide.md` (§2 단계 표, §3 멈춘 지점)

**Interfaces:**
- Consumes: Task 1~3의 산출물.
- Produces: Gate B 요청 상태.

- [ ] **Step 1: 모든 검증을 돌린다**

```bash
node --test docs/ui-redesign/tools/check-roles.test.mjs
node docs/ui-redesign/tools/check-roles.mjs docs/ui-redesign/02-roles.json docs/ui-redesign/02-ia-overlay-roles.md docs/ui-structure/ui-structure.json docs/ui-redesign/01-diagnosis.md
node docs/ui-redesign/tools/check-structure.mjs docs/ui-structure/ui-structure.json docs/ui-structure/ui-structure.md .
node docs/ui-redesign/tools/check-captures.mjs docs/ui-redesign/captures/01/manifest.md docs/ui-redesign/captures/01
git diff --stat 76b99e3 -- app src package.json
```

Expected: `# fail 0`, `OK rows=66 …`, `OK nodes=66 edges=115`, `OK done=26 blocked=47`, 마지막 명령 출력 없음.

- [ ] **Step 2: 상태를 바꾼다**

md §1 단계/상태를 `단계 2 / 승인대기`로. 안내 문서 §2 표의 단계 2 행을 `승인대기`와 산출물 경로 세 개로, §3에 "Gate B 검토 중, 승인 전 단계 3 시작 금지"를 적는다.

- [ ] **Step 3: 커밋**

```bash
git add docs/ui-redesign/02-ia-overlay-roles.md docs/ui-redesign/1794280544402-contituous-guide.md
git commit -m "docs(ui-redesign): request Gate B for stage 2"
```

- [ ] **Step 4: Gate B를 요청한다**

사용자에게 §7 질문을 하나씩 묻는다. 승인 전에는 단계 3을 시작하지 않는다.
