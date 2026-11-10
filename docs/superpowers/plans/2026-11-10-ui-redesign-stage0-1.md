# UI 디자인 개선 단계 0→1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Qoolla 학생 앱의 현재 UI 구조와 시각 문제를 코드·실기기 증거로 문서화해 Gate A 승인을 요청한다.

**Architecture:** 산출물은 전부 문서와 캡처다. 블록도는 코드에서 다시 수집한 사실을 기존 HTML과 대조해 고치고, 진단은 그 블록도와 캡처 위에 `impeccable critique`/`audit`을 적용해 만든다. 앱 소스는 건드리지 않는다.

**Tech Stack:** Expo SDK 54, RN 0.81.5, expo-router 6, Mermaid, `impeccable` 스킬, `rg`, `node`(검증 스크립트), `xcrun devicectl`/`simctl`(캡처).

**Spec:** `docs/superpowers/specs/2026-11-10-ui-redesign-stage0-1-design.md` (상위: `docs/design/qoolla-ui-design-improvement-spec.md`, 블록도 규칙: `docs/expo-ui-block-diagram-spec.md`)

## Global Constraints

- `app/`, `src/`는 수정하지 않는다. 캡처용 임시 코드도 넣지 않는다. 기준 커밋은 `76b99e3`.
- 작업 브랜치는 `design/ui-redesign`. push, PR, 배포는 하지 않는다.
- 의존성 추가 금지. `react-native-paper` 재도입 금지. dark mode 구현 금지.
- 보존 제약: Pretendard, Tablet 판정 `min(w,h) ≥ 600`(판정 로직 불변), 하단 6칸(공지·검색·타임라인·실황 수업·주간 공부·내 정보), landscape 제한 목록은 미정으로 기록.
- 코드에서 확인한 사실만 적는다. 확인하지 못한 것은 `미확인`으로 적는다.
- 시뮬레이터 캡처를 실기기로 표기하지 않는다. iPad 캡처로 Phone을 대신하지 않는다.
- 테스트·비식별 계정만 쓴다. 제출·저장 등 운영 데이터를 바꾸는 동작을 하지 않는다.
- 새 팔레트·글자 크기·치수를 확정하지 않는다. 단계 2 이후 산출물을 만들지 않는다.
- 단계 상태 표기는 `미착수 | 진행 | 승인대기 | 완료 | blocked`만 쓴다.
- 커밋 메시지는 `Co-Authored-By: Claude <noreply@anthropic.com>`로 끝낸다.

## Review Focus

1. **오래된 블록도 항목** — 기존 HTML의 노드·엣지가 study-note 변경 이후 코드와 다를 때, 블록도는 현재 코드를 따라야 한다. → Task 2 Step 4의 근거 라인 검증.
2. **출처가 뒤섞인 캡처** — 시뮬레이터 캡처가 실기기 폴더·표기에 섞이면 안 된다. → Task 3 Step 6의 매니페스트 검증.
3. **캡처에 찍힌 개인정보** — 실명, 연락처, 실제 학생 데이터가 보이는 캡처는 커밋하지 않는다. → Task 3 Step 5.
4. **조사 중 생긴 소스 변경** — 포매터나 실수로 `app/`·`src/`가 바뀌면 안 된다. → 모든 Task의 마지막 검증 단계와 Task 5 Step 1.
5. **이름만 검색한 버튼·칩 조사** — `Button`이라는 이름이 없는 인라인 `Pressable` 버튼이 빠지면 단계 3 설계가 틀어진다. → Task 4 Step 2의 검색 범위 검증.

## File Structure

| 파일 | 책임 |
|---|---|
| `docs/ui-redesign/00-baseline.md` | 기준 커밋, 스킬 상태, 스크립트, 보존 제약 근거 |
| `docs/ui-structure/ui-structure.md` | 사람이 읽는 블록도와 노드·엣지 표 |
| `docs/ui-structure/ui-structure.json` | 같은 내용의 기계 판독용 |
| `docs/ui-structure/ui-structure.html` | 다이어그램 뷰어(기존 `screen-block-diagram.html`을 옮김) + 캡처 연결 |
| `docs/ui-redesign/captures/01/manifest.md` | 캡처 목록, 출처, 기기, 미캡처 사유 |
| `docs/ui-redesign/captures/01/*.png` | 캡처 |
| `docs/ui-redesign/01-buttons-chips-survey.md` | 버튼·칩 사용처 조사표 |
| `docs/ui-redesign/01-diagnosis.md` | 우선순위 이슈 목록, Gate A 요청 |

검증 스크립트는 저장소에 넣지 않고 세션 scratchpad에 둔다.

---

### Task 1: 스킬 설치와 baseline

**Files:**
- Create: `docs/ui-redesign/00-baseline.md`
- Create: 스킬 CLI가 만드는 파일(경로는 설치 결과로 확인)

**Interfaces:**
- Produces: `00-baseline.md`의 "보존 제약" 표. 이후 Task가 Tablet 판정 훅과 하단 6칸의 `파일:라인`을 여기서 가져다 쓴다.

- [ ] **Step 1: 스킬 설치**

```bash
npx skills@latest add expo/skills --skill expo-design-system
npx skills add vercel-labs/agent-skills --skill vercel-react-native-skills
```

Expected: 두 명령 모두 성공. `git status --short`로 생긴 파일을 확인한다. 대화형 프롬프트가 나오면 프로젝트 범위, Claude Code 대상만 고른다. `--skill '*'`는 쓰지 않는다.

- [ ] **Step 2: 설치 파일 커밋**

`git status --short`에 나온 스킬 파일만 add한다. `app/`, `src/`, `package.json`이 바뀌었으면 멈추고 사용자에게 보고한다.

```bash
git commit -m "chore(skills): install expo-design-system and vercel-react-native-skills"
```

- [ ] **Step 3: 보존 제약의 코드 근거 수집**

```bash
rg -n "600|560" src/layout src/host
rg -n "Pretendard" app src app.json | head
rg -n "react-native-paper|nativewind|tamagui" package.json src app
rg -n "공지|검색|타임라인|실황|주간|내 정보" src app | head -40
rg -n "landscape|orientation" src app app.json | head -40
```

Expected: Tablet 판정 훅(진입 600, 이탈 560, 디바운스 200ms)과 하단 6칸 정의의 `파일:라인`을 얻는다. `react-native-paper` 검색은 결과가 없어야 한다.

- [ ] **Step 4: 기준 상태 실행**

```bash
npm run lint
npm run typecheck
```

Expected: 종료 코드와 오류·경고 수를 기록한다. 실패해도 고치지 않는다(소스 미변경).

- [ ] **Step 5: `docs/ui-redesign/00-baseline.md` 작성**

절 구성은 다음으로 고정한다.

1. 기준 — 기준 브랜치/커밋 `feat/study-note @ 76b99e3`, 작업 브랜치, 작성일
2. 스킬 — 표 `스킬 / 설치 여부 / 이번 세션 노출 여부 / 설치 경로`. `impeccable`, `expo-design-system`, `vercel-react-native-skills`, 그리고 미설치로 두는 조건부·선택 스킬. `impeccable init` 미실행 사유(`PRODUCT.md`, `DESIGN.md` 존재)
3. 명령 — `lint`, `typecheck`, `test`, `test:e2e`, `doctor`와 Step 4 결과. build 스크립트는 "없음(EAS/`expo run`)"
4. 보존 제약 — 표 `제약 / 현재 코드 상태 / 근거(파일:라인)`. 개선 스펙 §1.1의 7개 항목 전부
5. 참조 문서 — 스펙상의 경로와 실제 경로
6. 과거 개선 패스 — `docs/design/before`, `after-P1`~`after-P3`, `after-rail`
7. 단계 상태 — 단계 0 `완료`, 단계 1 `진행`

- [ ] **Step 6: 검증과 커밋**

```bash
git diff --stat 76b99e3 -- app src
```

Expected: 출력 없음.

```bash
git add docs/ui-redesign/00-baseline.md
git commit -m "docs(ui-redesign): add stage 0 baseline"
```

---

### Task 2: 블록도 검증·보완

**Files:**
- Create: `docs/ui-structure/ui-structure.md`
- Create: `docs/ui-structure/ui-structure.json`
- Rename + Modify: `docs/ui-structure/screen-block-diagram.html` → `docs/ui-structure/ui-structure.html`

**Interfaces:**
- Produces: `ui-structure.json`. 스키마는 블록도 스펙 §5.2 그대로다 — `meta{commit, router, generatedAt}`, `nodes[{id, kind, name, file, route, parent, blocking, modes}]`, `edges[{from, to, rel, trigger, condition, source}]`, `unresolved[]`. `kind`는 `navigator|screen|modal|modeless|bottomsheet`, `rel`은 `contains|navigate|present|dismiss_to|deeplink`. Task 3과 Task 5가 노드 `id`를 참조한다.

- [ ] **Step 1: 코드에서 사실 수집**

블록도 스펙 §4의 1~6번 절차를 수행한다. 검색은 다음에서 시작한다.

```bash
find app -type f | sort
rg -n "presentation\s*:" app src
rg -n "<Modal|BottomSheet(Modal)?|useBottomSheet|present\(\)" app src
rg -n "router\.(push|replace|back|dismiss|navigate)|navigation\.navigate|<Link |Redirect" app src
rg -n "<(Stack|Tabs|Drawer|Slot)\b" app src
rg -n "Sheet|Drawer|Toast|Overlay|Dock" src --files-with-matches
```

에이전트 명령으로 뜨는 화면은 화이트리스트 정의(`src/agent`, `src/protocol`, `src/host`)에서 화면 이름과 렌더 위치를 추적한다. 라우트가 아닌 UI는 그것을 여는 상태값·핸들러의 `파일:라인`을 엣지 근거로 삼는다.

- [ ] **Step 2: 기존 HTML과 대조**

기존 HTML의 "6. 기계 판독용 JSON" 섹션에서 노드·엣지를 꺼내 Step 1 결과와 비교한다. 차이를 `추가 / 삭제 / 근거 라인 수정 / 종류 수정`으로 분류해 `ui-structure.md`의 미확인/이슈 절 앞에 "기존 블록도 대비 변경" 표로 남긴다.

- [ ] **Step 3: 산출물 작성**

- `ui-structure.json`: 위 스키마. `meta.commit`은 `76b99e3`, `meta.router`는 `expo-router`.
- `ui-structure.md`: 블록도 스펙 §5.1의 6개 절. Mermaid는 §6 표기 규칙을 따른다(모든 블록에 `표시 이름<br/>ComponentName<br/>파일경로`, 라벨은 큰따옴표). 노드가 40개를 넘으면 Navigator별 subgraph와 상세 다이어그램으로 나눈다. Phone/Tablet 구조가 다른 곳은 모드별 다이어그램을 추가한다.
- `ui-structure.html`: `git mv`로 옮긴 뒤 다이어그램, 표, JSON 섹션을 새 내용으로 맞춘다. 제목과 기존 레이아웃은 유지한다.

- [ ] **Step 4: 검증 스크립트 작성과 실행**

scratchpad에 `check-structure.mjs <json경로> <md경로> <repo루트>`를 만든다. 다음을 검사하고 하나라도 실패하면 종료 코드 1로 끝낸다.

- 모든 노드 `id`가 `^[a-z_][a-z0-9_]*$`이고 중복이 없다
- 모든 `kind`, `rel`이 허용 값이다
- 모든 엣지의 `from`, `to`가 존재하는 노드이거나 `ext`다
- 모든 엣지 `source`가 `경로:라인` 형식이고, 그 파일이 있고, 라인 번호가 파일 길이 이하다
- 모든 `file`이 실제로 있다
- `navigator`가 아닌 모든 노드에 들어오는 엣지가 하나 이상 있거나 `unresolved`에 `orphan`으로 올라 있다
- `ui-structure.md` 노드 표·엣지 표의 행 수가 json의 `nodes`, `edges` 길이와 같다

Run: `node <scratchpad>/check-structure.mjs docs/ui-structure/ui-structure.json docs/ui-structure/ui-structure.md .`
Expected: `OK nodes=<N> edges=<M>`, 종료 코드 0.

- [ ] **Step 5: Mermaid 렌더링 확인**

`ui-structure.md`의 각 mermaid 블록을 scratchpad의 `.mmd` 파일로 뽑아 렌더링한다.

Run: `npx -y @mermaid-js/mermaid-cli -i <scratchpad>/diagram-1.mmd -o <scratchpad>/diagram-1.svg`
Expected: 블록마다 오류 없이 SVG가 생긴다. 네트워크나 Chromium 문제로 실행할 수 없으면 `ui-structure.html`을 브라우저로 열어 렌더링을 확인하고, 그 방법을 `ui-structure.md` 개요에 적는다.

- [ ] **Step 6: 소스 미변경 확인과 커밋**

```bash
git diff --stat 76b99e3 -- app src
```

Expected: 출력 없음.

```bash
git add docs/ui-structure
git commit -m "docs(ui-structure): verify block diagram against code and add md/json outputs"
```

---

### Task 3: 캡처

**Files:**
- Create: `docs/ui-redesign/captures/01/manifest.md`
- Create: `docs/ui-redesign/captures/01/<device>-<screen>-before.png`
- Modify: `docs/ui-structure/ui-structure.html` (캡처 연결)

**Interfaces:**
- Consumes: `ui-structure.json`의 노드 `id`.
- Produces: `manifest.md`의 표 `node id / 화면·상태 / 기기 / 방향 / 파일 / 출처 / 상태 / 사유`. `<device>`는 `ipad` 또는 `phone-sim`, `<screen>`은 노드 `id`(상태가 여럿이면 `-<state>`를 붙인다). `출처`는 `실기기` 또는 `시뮬레이터`, `상태`는 `완료` 또는 `blocked`. Task 5가 이 표의 파일 경로를 증거로 인용한다.

- [ ] **Step 1: 캡처 목록 작성**

`ui-structure.json`의 `screen`, `modal`, `modeless`, `bottomsheet` 노드마다 `manifest.md`에 행을 만든다. `modes`에 `tablet`이 있으면 `ipad` 행(세로, 그리고 캔버스 계열은 가로 추가), `phone`이 있으면 `phone-sim` 행을 둔다. 상태는 모두 `blocked`, 사유는 `미촬영`으로 시작한다. 목록을 사용자에게 보여 준다.

- [ ] **Step 2: 실기기 준비 — 사용자 확인 지점**

```bash
xcrun devicectl list devices
```

Expected: "Jaesung의 iPad"가 `available`/`connected`. 오프라인이면 사용자에게 연결·잠금 해제를 요청하고 기다린다.

기기에 앱(dev client)이 설치돼 있는지 확인한다.

```bash
xcrun devicectl device info apps --device <UDID> | rg -i "qoolla|go3"
```

설치돼 있으면 `npm run start`로 dev server를 띄워 연결한다(dev server는 백그라운드로 실행). 설치돼 있지 않으면 **빌드하지 말고** 사용자에게 `expo run:ios --device`(`ios/` 생성 가능) 실행 여부를 묻는다.

- [ ] **Step 3: iPad 캡처**

로그인은 테스트 계정으로 한다. 계정 정보는 사용자가 기기에서 직접 입력한다. 목록 순서대로 화면을 띄우고 캡처한다. 원격 조작이 안 되는 화면 이동은 사용자에게 요청한다. 캡처 방법은 그 시점에 동작하는 것을 쓰고(Xcode Devices 창의 Take Screenshot, 또는 기기에서 찍어 AirDrop으로 전달) `manifest.md`에 방법을 적는다. 기기 모델, iPadOS 버전, 방향을 행마다 기록한다.

- [ ] **Step 4: Phone 시뮬레이터 캡처**

iPhone 시뮬레이터에 설치된 dev client가 있으면 그것으로, 없으면 Step 2와 같은 규칙으로 사용자에게 빌드 여부를 묻는다.

```bash
xcrun simctl io booted screenshot docs/ui-redesign/captures/01/phone-sim-<screen>-before.png
```

출처는 모두 `시뮬레이터`로 적는다.

- [ ] **Step 5: 개인정보 검토**

모든 PNG를 열어 확인한다. 실명, 연락처, 이메일, 실제 학생 데이터가 보이는 캡처는 지우고 해당 행을 `blocked`, 사유 `개인정보 노출`로 바꾼다.

- [ ] **Step 6: 매니페스트 검증**

scratchpad에 `check-captures.mjs <manifest경로> <captures폴더>`를 만든다. 다음을 검사하고 실패하면 종료 코드 1로 끝낸다.

- `완료` 행의 파일이 모두 있고, 폴더의 모든 PNG가 표에 있다
- `ipad-`로 시작하는 파일의 출처는 `실기기`, `phone-sim-`로 시작하는 파일의 출처는 `시뮬레이터`다
- `blocked` 행에는 사유가 있다
- 파일명이 `^(ipad|phone-sim)-[a-z0-9_]+(-[a-z0-9_]+)?-before\.png$`이다

Run: `node <scratchpad>/check-captures.mjs docs/ui-redesign/captures/01/manifest.md docs/ui-redesign/captures/01`
Expected: `OK done=<N> blocked=<M>`, 종료 코드 0.

- [ ] **Step 7: HTML 연결과 커밋**

`ui-structure.html`의 노드 목록에 캡처 썸네일 링크 열을 추가한다(상대 경로 `../ui-redesign/captures/01/...`).

```bash
git diff --stat 76b99e3 -- app src
```

Expected: 출력 없음. `ios/`가 생겼다면 커밋하지 않는다.

```bash
git add docs/ui-redesign/captures/01 docs/ui-structure/ui-structure.html
git commit -m "docs(ui-redesign): add stage 1 device captures and manifest"
```

---

### Task 4: 버튼·칩 사용처 조사

**Files:**
- Create: `docs/ui-redesign/01-buttons-chips-survey.md`

**Interfaces:**
- Produces: 표 `파일:라인 / 종류(button|chip) / 역할 / 현재 표현 / 동작·상태 / 공용화 대상 / 예외 사유`. 마지막 두 열은 비워 둔다(단계 3에서 채운다). Task 5가 이 표의 집계를 인용한다.

- [ ] **Step 1: 후보 수집**

```bash
rg -n "<(Pressable|TouchableOpacity|TouchableHighlight|TouchableWithoutFeedback|Button)\b" app src > <scratchpad>/pressables.txt
rg -n "(Chip|Tag|Badge|Pill|Filter)" app src --glob '*.tsx' > <scratchpad>/chip-candidates.txt
rg -n "export (default )?function \w*(Button|Chip|Tag|Pill)\w*|export const \w*(Button|Chip|Tag|Pill)\w*" app src
wc -l <scratchpad>/pressables.txt
```

- [ ] **Step 2: 분류와 표 작성**

`pressables.txt`의 모든 행을 읽고 버튼 역할인 것(텍스트·아이콘으로 동작을 실행)과 칩 역할인 것(태그·필터·선택)을 표에 넣는다. 버튼도 칩도 아닌 것(목록 행 전체, 카드, 배경 닫기 영역, 필기 영역)은 표 아래 "제외" 목록에 `파일:라인 — 이유`로 적는다. `현재 표현`에는 그 스타일의 높이, 반경, 배경색, 글자 스타일을 코드 값 그대로 적고 `theme` 토큰인지 하드코딩인지 표시한다. `동작·상태`에는 disabled, loading, selected, pressed 처리 유무를 적는다.

검증: 표의 행 수와 제외 목록의 행 수를 더하면 `pressables.txt`의 행 수와 같아야 한다. 문서 끝에 `후보 N = 표 A + 제외 B`를 적는다.

- [ ] **Step 3: 집계**

문서 앞에 요약을 둔다 — 공용 컴포넌트로 이미 있는 것(이름, 파일, 사용 횟수), 인라인 구현 수, 표현 변형의 종류(높이·반경·색 조합별 횟수), 상태 처리가 빠진 곳의 수.

- [ ] **Step 4: 커밋**

```bash
git diff --stat 76b99e3 -- app src
```

Expected: 출력 없음.

```bash
git add docs/ui-redesign/01-buttons-chips-survey.md
git commit -m "docs(ui-redesign): survey existing button and chip usages"
```

---

### Task 5: 진단과 Gate A 요청

**Files:**
- Create: `docs/ui-redesign/01-diagnosis.md`
- Modify: `docs/ui-redesign/00-baseline.md` (단계 상태)

**Interfaces:**
- Consumes: `ui-structure.json` 노드 `id`, `manifest.md` 캡처 경로, `01-buttons-chips-survey.md` 집계, `00-baseline.md` 보존 제약 근거.

- [ ] **Step 1: `impeccable` 스킬 로드와 진단**

Skill 도구로 `impeccable`을 호출해 `critique`와 `audit`(native 경로) 지침을 읽는다. 지침이 요구하는 참조 파일(`audit.native` 등)도 읽는다. 대상은 캡처와 해당 화면 코드다. 진단 관점은 개선 스펙 단계 1의 목록이다: 여백, 정렬, 시선 우선순위, 중복 조작, 과도한 구획, 버튼 우선순위, 텍스트 위계, 아이콘, 로딩·빈·오류·disabled·선택 상태, 한국어 긴 문구·수식, 키보드, safe area, 회전, 스크롤, 시트 겹침.

스킬이 소스 수정이나 detector 설치를 제안하면 따르지 않는다. Pretendard 관련 경고는 "브랜드 폰트 예외"로 기록한다.

- [ ] **Step 2: 토큰 드리프트 조사**

```bash
rg -n "#[0-9A-Fa-f]{3,8}\b" app src --glob '*.tsx' --glob '!src/ui/theme.ts' | wc -l
rg -n "(fontSize|borderRadius|padding\w*|margin\w*|gap)\s*:\s*\d+" app src --glob '*.tsx' | wc -l
```

`DESIGN.md` frontmatter의 색·타이포 값과 `src/ui/theme.ts`의 값을 비교해 다른 항목을 나열한다. 하드코딩이 많은 파일 상위 10개를 적는다.

- [ ] **Step 3: `01-diagnosis.md` 작성**

절 구성은 다음으로 고정한다.

1. 요약 — 단계, 상태 `승인대기`, 사용한 스킬과 실제 로드 여부, 기준 커밋
2. 증거 — 블록도 노드·엣지 수(종류별), 캡처 수(실기기/시뮬레이터/blocked), 기기 모델·OS
3. 이슈 목록 — 표 `ID / 심각도(P0~P3) / 관점 / 화면(node id) / 위치(파일:라인) / 증거(캡처 경로) / 관찰 / 개선 방향`. 심각도 순으로 정렬. `개선 방향`은 방향만 적고 수치를 정하지 않는다
4. 구조 이슈 — 블록도에서 나온 것(Modal 중첩, 복귀 경로 불명확, orphan, 역할이 겹치는 오버레이)
5. 토큰 드리프트 — Step 2 결과
6. 버튼·칩 — Task 4 집계 요약과 문서 링크
7. 보존 제약 확인 — baseline 표를 참조하고 이번 진단이 건드리지 않음을 적는다
8. 미검증·blocked — 미캡처 화면과 사유, 실행하지 못한 검사
9. Gate A 요청 — 승인 시 다음 사이클(단계 2)의 입력이 되는 질문 목록. 답을 미리 정하지 않는다
10. 소스 변경 파일 — "없음"

모든 P0·P1 이슈에는 `위치`와 `증거`가 둘 다 있어야 한다. 증거 캡처가 `blocked`이면 코드 근거만으로 적고 그 사실을 표시한다.

- [ ] **Step 4: 검증**

```bash
git diff --stat 76b99e3 -- app src
git status --short
rg -n "TBD|TODO|추후 작성" docs/ui-redesign/00-baseline.md docs/ui-redesign/01-diagnosis.md docs/ui-redesign/01-buttons-chips-survey.md
node <scratchpad>/check-structure.mjs docs/ui-structure/ui-structure.json docs/ui-structure/ui-structure.md .
node <scratchpad>/check-captures.mjs docs/ui-redesign/captures/01/manifest.md docs/ui-redesign/captures/01
```

Expected: 첫 명령과 세 번째 명령은 출력 없음. `git status`에 `ios/`, `android/`, `package.json` 변경이 없다. 두 검증 스크립트는 `OK`. `01-diagnosis.md`가 인용한 캡처 경로와 `파일:라인`이 실제로 있는지 표에서 5개를 골라 직접 열어 본다.

- [ ] **Step 5: baseline 상태 갱신과 커밋**

`00-baseline.md`의 단계 상태를 단계 1 `승인대기`로 바꾼다. iPad 캡처가 하나도 없으면 `blocked`로 적고 Gate A를 요청하지 않는다.

```bash
git add docs/ui-redesign
git commit -m "docs(ui-redesign): add stage 1 diagnosis and request Gate A"
```

- [ ] **Step 6: 보고**

개선 스펙 §8 형식으로 사용자에게 보고한다 — 단계·상태·사용 스킬, 산출물 경로, 캡처(실기기 여부, 모델, 방향), Gate A 요청 또는 blocked 사유, 소스 변경 파일 "없음", 다음 단계 진입 가능 여부. 그리고 멈춘다. 단계 2는 시작하지 않는다.
