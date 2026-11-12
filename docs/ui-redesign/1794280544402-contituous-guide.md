# UI 디자인 개선 — 이어서 작업하기 안내

- 작성: 2026-11-10 (KST), 파일명 숫자는 작성 시각의 epoch ms
- 대상: 다른 PC에서 이 작업을 이어받는 사람과 Claude 세션
- 현재 위치: **단계 1 완료, Gate A 검토 중**. 사용자는 아직 Gate A를 승인하지 않았다.

## 1. 새 PC에서 가장 먼저 할 일

### 1.1 브랜치 받기

작성 시점에 원격(`origin`)에는 `main`과 `fix/ios-uiscene-lifecycle`만 있다. **`design/ui-redesign`과 `feat/study-note`는 원격에 없다.** 이전 PC에서 먼저 올려야 한다.

```bash
git push -u origin design/ui-redesign
```

`design/ui-redesign`은 `feat/study-note`(76b99e3) 위에 쌓여 있어서 이 브랜치만 올려도 study-note 커밋이 함께 간다. 새 PC에서는:

```bash
git fetch origin
```

```bash
git switch design/ui-redesign
```

```bash
npm install
```

### 1.2 Claude 세션 시작 문구

새 세션에 아래를 그대로 붙여 넣는다.

```text
docs/ui-redesign/1794280544402-contituous-guide.md 를 읽고 그 지점부터 이어서 진행하시오.
/superpowers:using-superpowers 를 사용해 brainstorming → plan → implementation 순서를 지키시오.
```

### 1.3 스킬 확인

| 스킬 | 위치 | 새 PC에서 |
|---|---|---|
| `expo-design-system`, `vercel-react-native-skills` | 저장소 `.claude/skills/` (커밋됨) | 따로 설치할 필요 없음 |
| `impeccable` | 사용자 전역 `~/.claude/skills/impeccable` | **다시 설치해야 함**: `npx impeccable install` |
| `superpowers` | Claude 플러그인 | 플러그인이 켜져 있는지 확인 |
| `ui-ux-pro-max` | Claude 플러그인 | 선택. 이번 작업에서는 쓰지 않았다 |

세션에서 스킬이 실제로 노출되는지 확인한 뒤에만 "스킬 사용"이라고 적는다. 없으면 `blocked`로 보고한다.

## 2. 지금까지 한 것

| 단계 | 상태 | 산출물 |
|---|---|---|
| 0 환경·스킬·baseline | 완료 | `docs/ui-redesign/00-baseline.md` |
| 1 현황 진단 | **완료** (2026-11-10 Gate A 조건부 승인, 조건 3건 유지) | `docs/ui-structure/ui-structure.{md,json,html}`, `docs/ui-redesign/captures/01/`, `docs/ui-redesign/01-buttons-chips-survey.md`, `docs/ui-redesign/01-diagnosis.md` |
| 2 역할·정보구조 | **완료** (2026-11-10 Gate B 승인, 결정은 `02-ia-overlay-roles.md` §9) | `docs/ui-redesign/02-ia-overlay-roles.md`, `docs/ui-redesign/02-roles.json`, `docs/ui-redesign/tools/check-roles.mjs` |
| 3~6 | 미착수 | — |

읽는 순서:

1. `docs/design/qoolla-ui-design-improvement-spec.md` — 전체 스펙(게이트 A~D, 보존 제약)
2. `docs/superpowers/specs/2026-11-10-ui-redesign-stage0-1-design.md` — 단계 0→1 설계
3. `docs/superpowers/plans/2026-11-10-ui-redesign-stage0-1.md` — 단계 0→1 계획(실행 완료)
4. `docs/ui-redesign/01-diagnosis.md` — 진단 결과와 Gate A 질문
5. `docs/ui-redesign/00-baseline.md` — 기준 커밋, 명령, 보존 제약의 코드 근거

진단 요약: Design Health 20/40. P1 다섯 건은 버튼 표현 불일치(D-01), 세로 pill 툴바가 Stage 카드를 가림(D-02), 빈·오류 상태 미설계(D-03), 캔버스 시트가 툴바를 덮음(D-04), 칩 선택색·가짜 버튼 라벨(D-05)이다.

## 3. 지금 멈춘 지점

> **2026-11-10 갱신**: Gate A는 조건부로 승인됐고(`01-diagnosis.md` §12), 단계 2는 **Gate B 승인으로 완료**됐다(`02-ia-overlay-roles.md` §9, Q1·Q3은 1안이 아닌 대안을 골랐다). 다음은 단계 3(토큰·공통 컴포넌트·상태 규칙)을 새 사이클(brainstorming → 설계 → 계획 → 실행)로 시작하는 것이다. 단계 2의 설계·계획: `docs/superpowers/specs/2026-11-10-ui-redesign-stage2-design.md`, `docs/superpowers/plans/2026-11-10-ui-redesign-stage2.md`. 검증: `node docs/ui-redesign/tools/check-roles.mjs docs/ui-redesign/02-roles.json docs/ui-redesign/02-ia-overlay-roles.md docs/ui-structure/ui-structure.json docs/ui-redesign/01-diagnosis.md` → `OK rows=66 deviations=8`. 아래는 Gate A 때의 기록이다.

사용자가 "이대로 Gate A 검토"를 골랐고, Gate A 요약을 받은 상태에서 PC를 옮긴다. **승인 여부는 아직 답하지 않았다.**

이어받은 세션이 할 일:

1. 사용자에게 Gate A 승인 여부를 묻는다. 승인 전에는 단계 2를 시작하지 않는다.
2. 승인되면 단계 2를 **새 사이클**로 시작한다: `superpowers:brainstorming` → 설계 문서(`docs/superpowers/specs/YYYY-MM-DD-ui-redesign-stage2-design.md`) → `superpowers:writing-plans` → 실행.
3. 단계 2의 필수 스킬은 `impeccable`의 `shape`와 `adapt`(native 참고)다. 산출물은 `docs/ui-redesign/02-ia-overlay-roles.md`이고 Gate B에서 멈춘다. 소스는 원칙적으로 수정하지 않는다.
4. 단계 2 브레인스토밍에서 아래 질문을 **하나씩** 묻는다(`01-diagnosis.md` §10).
   - dock이 열려 있을 때 Stage를 계속 조작할 수 있어야 하는가?
   - 캔버스 시트는 툴바를 덮어야 하는가, 툴바 위에서 멈춰야 하는가?
   - 기능 이름을 어느 한 벌로 통일하는가? (Phone 탭 이름, dock 제목, 하단 6칸 정의, 툴바 접근성 라벨이 서로 다르다)
   - 하단 6칸은 렌더되지 않고 세로 pill 툴바가 그 역할을 한다. 이 형태를 기준으로 삼는가?
   - 실기기 캡처를 언제 채우는가?

## 4. Gate A에 붙어 있는 조건 (해결 안 됨)

1. **실기기 캡처 0장.** 캡처 26장은 모두 iOS 26.4 시뮬레이터다(iPad Air 13-inch M4 20장, iPhone 17 6장). 파일명 `ipad-sim-`, `phone-sim-`. 실기기 캡처에는 `ipad-` 접두사만 쓴다. 시뮬레이터를 실기기로 적지 않는다.
2. **캡처 번들 출처 미확인.** 캡처에 쓴 Metro 개발 서버가 `76b99e3`의 JS를 내보내지 않았다. Study dock 캡처에 study-note UI(학습장 줄·버튼)가 없고, 서버에서 받은 `TimelinePanel` 모듈에 `noteBtn`이 없었다. 캡처 전체가 study-note 이전 화면일 수 있다. 진단의 `파일:라인` 근거는 코드에서 읽은 것이라 유효하다.
3. **미촬영 47행.** 학습장 시트, 주제 실황 수업·선생님 수업 화면과 그 시트·모달, Phone의 결과 화면, 토스트, 이름 변경·PDF 모달 등. 목록과 사유는 `docs/ui-redesign/captures/01/manifest.md`.

재촬영할 때의 절차는 §6에 있다.

## 5. 반드시 지킬 규칙

스펙 §1.1과 §5에서 온 것이다. 단계가 바뀌어도 유지한다.

- `app/`, `src/`는 Gate 통과 전에 수정하지 않는다. 단계 3 이후에도 시각·스타일·공통 컴포넌트만 바꾸고 로직·프로토콜·저장·권한·라우트 의미는 바꾸지 않는다.
- Pretendard 유지. `react-native-paper` 재도입 금지. dark mode 구현 금지. NativeWind/Tamagui 등 새 스타일 체계 금지. 의존성 추가는 사용자 승인.
- Tablet 판정(`src/layout/deviceMode.ts`: 진입 600, 이탈 560, 디바운스 200ms)은 바꾸지 않는다.
- 하단 6칸의 **기능**(공지·검색·타임라인·실황 수업·주간 공부·내 정보)은 유지한다.
- Landscape 제한 목록(`src/kit/canvas/landscapeRestrictions.ts`)은 비어 있고 사용자 결정 대기다. 새로 채우지 않는다.
- 필기 잉크 색 값(`orange, blue, black, red, green`)과 MMKV 저장값은 사용자 데이터다. 바꾸지 않는다.
- 새 팔레트·글자 크기·치수를 임의로 확정하지 않는다. 선택지는 1안+근거로 낸다.
- push, PR, 배포는 사용자가 지시할 때만 한다.
- 단계 상태는 `미착수 | 진행 | 승인대기 | 완료 | blocked`로만 적는다.
- 게이트: A(단계 1 승인 전 전체 시각 개편 금지), B(단계 2 승인 전 공통 컴포넌트·토큰 교체 금지), C(단계 3 승인 전 다수 화면 일괄 수정 금지), D(단계 4 실기기 승인 전 다른 화면군 확산 금지).

## 6. 환경에서 겪은 문제와 우회법

이전 PC(Xcode가 iOS 27.2 SDK)에서 겪은 것이다. 새 PC의 Xcode 버전에 따라 달라질 수 있다.

| 문제 | 원인 | 우회 |
|---|---|---|
| `expo run:ios`가 "Can't determine id of Simulator app"으로 끝남 | Xcode 안에 `Simulator.app`이 없음 | `xcodebuild`로 직접 빌드하고 `xcrun simctl install`로 설치 |
| `xcodebuild`가 Pod의 deployment target(9~12)을 거부 | 시뮬레이터 SDK가 15.0 미만을 받지 않음 | 명령에만 `IPHONEOS_DEPLOYMENT_TARGET=15.1`을 덧붙임. 파일은 바꾸지 않음 |
| iOS 27.2 시뮬레이터에서 실행 직후 종료 | `UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption` — UIScene 수명주기 미채택 | iOS 26.4 시뮬레이터 사용. 수정 커밋 `d0a5d1c`가 이 브랜치에 있으니, 다시 빌드하면 27.2에서도 뜰 수 있다(미확인) |
| 캡처가 기준 커밋과 다른 화면 | 오래 떠 있던 Metro가 예전 모듈을 내보냄 | Metro를 캐시 없이 새로 띄운다 |
| `npm run lint` 실패 | 기존 오류 2건(`src/kit/canvas/CanvasChrome.tsx:116`), 경고 151건 | 이번 작업 이전부터 있던 것. 기준 상태로만 기록 |

시뮬레이터 빌드 명령(이전 PC에서 성공한 형태):

```bash
xcodebuild -workspace ios/Go3Math.xcworkspace -scheme Go3Math -configuration Debug -sdk iphonesimulator -destination 'id=<시뮬레이터 UDID>' -derivedDataPath ios/build/sim-dd IPHONEOS_DEPLOYMENT_TARGET=15.1 build
```

`ios/`는 git에서 무시된다. 새 PC에 없으면 `npx expo prebuild -p ios`로 만든다(CNG, 손으로 고치지 않는다).

재촬영 절차:

1. 체크아웃이 `design/ui-redesign`인지 확인하고, 캡처가 끝날 때까지 브랜치를 바꾸지 않는다.
2. Metro를 캐시 없이 띄운다: `npx expo start --dev-client --clear`
3. 번들이 맞는지 먼저 확인한다. 아래 명령의 결과가 0이 아니어야 한다.
   ```bash
   curl -s "http://localhost:8081/src/kit/timeline/TimelinePanel.bundle?platform=ios&dev=true&modulesOnly=true&runModule=false" | grep -c noteBtn
   ```
4. 앱 연결: `xcrun simctl openurl <UDID> "com.qoolla.student://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081"`
5. 게스트 화면은 개발 빌드의 "로그인 없이 둘러보기"로 들어간다. 데이터가 필요한 화면은 **사용자가 직접** 테스트 계정으로 로그인한다. Claude는 계정 정보를 입력하지 않는다.
6. 캡처는 `xcrun simctl io <UDID> screenshot <파일>`. 캔버스에서 필기·저장·전체 지우기 확인은 하지 않는다.
7. 파일을 `docs/ui-redesign/captures/01/`에 넣고 `manifest.md`를 고친 뒤 검증 스크립트를 돌린다. 개인정보가 보이는 캡처는 커밋하지 않는다.

시트를 닫은 직후의 탭은 애니메이션 중에 무시되는 일이 잦았다. 한 번 더 눌러야 한다.

## 7. 검증 도구

`docs/ui-redesign/tools/`에 있다. 이전 세션의 임시 폴더에 있던 것을 옮겨 왔다.

| 파일 | 용도 |
|---|---|
| `check-structure.mjs` | 블록도 검증: 노드 id·종류, 엣지 끝점, 근거 `파일:라인` 존재, 진입 경로, md와 json의 행 수 일치 |
| `check-captures.mjs` | 캡처 매니페스트 검증: 파일 존재, 파일명 규칙, `ipad-`는 실기기·`*-sim-`은 시뮬레이터, blocked 사유 |
| `export-structure.mjs` | `ui-structure.html` 안의 `NODES`·`EDGES`·`ISSUES`에서 `ui-structure.md`와 `.json`을 내보냄 |
| `digest.mjs` | `rg` 결과(`파일:라인:…`)를 받아 눌리는 요소마다 role·상태·스타일 정의를 한 줄로 요약 |
| `shot.sh` | 시뮬레이터 스크린샷 + 작은 미리보기. 안의 UDID 두 개는 이전 PC 것이니 새 PC 값으로 바꾼다 |

```bash
node docs/ui-redesign/tools/check-structure.mjs docs/ui-structure/ui-structure.json docs/ui-structure/ui-structure.md .
```

```bash
node docs/ui-redesign/tools/check-captures.mjs docs/ui-redesign/captures/01/manifest.md docs/ui-redesign/captures/01
```

작성 시점 결과는 `OK nodes=66 edges=115`, `OK done=26 blocked=47`이다.

블록도는 **HTML이 단일 원천**이다. 구조를 고칠 때는 `ui-structure.html`의 데이터를 고친 뒤 내보낸다.

```bash
node docs/ui-redesign/tools/export-structure.mjs docs/ui-structure/ui-structure.html docs/ui-structure
```

소스 미변경 확인:

```bash
git diff --stat 76b99e3 -- app src package.json
```

출력이 없어야 한다.

## 8. 브랜치 상태와 정리할 것

- `design/ui-redesign` = `feat/study-note`(76b99e3) + 문서 커밋 + **`d0a5d1c`**.
- `d0a5d1c fix(ios): adopt the UIScene lifecycle so the app launches on iOS 27`은 UI 개선 작업의 산출물이 아니다. 작업 도중 다른 곳에서 이 브랜치에 커밋됐다. 같은 수정이 `fix/ios-uiscene-lifecycle`(원격에 있음)에도 있다. **이 브랜치에 둘지 뺄지 사용자가 정해야 한다.** 정해지기 전에는 건드리지 않는다.
- 이전 PC에서는 같은 폴더에서 다른 작업이 브랜치를 바꿔 가며 돌았다. 캡처·빌드 중에는 한 폴더에서 한 작업만 한다. 필요하면 `git worktree`로 폴더를 나눈다.

## 9. 이전 세션이 내린 결정

계획에서 벗어났거나 계획이 정하지 않은 것이다.

1. 스킬 CLI를 `-a claude-code -y`로 실행했고 `skills-lock.json`을 커밋했다.
2. 블록도 엣지의 근거는 한 문자열에 여러 개를 적을 수 있다(`파일:67 (호출 :111, :159)`, `a:95 → b:65`). 검증 스크립트가 이 형식을 읽는다.
3. 기존 블록도가 같은 커밋에서 만들어져 있어, 다시 쓰지 않고 그 데이터에서 md/json을 내보낸 뒤 코드와 대조했다.
4. iPad 캡처는 사용자 지시로 시뮬레이터를 썼다. 계획의 파일명 규칙에 `ipad-sim-`을 더했다.
5. iOS 27.2 크래시는 앱을 고치지 않고 iOS 26.4 시뮬레이터로 우회했다.
6. 실기기 캡처가 없는데도 단계 1을 `승인대기 (조건부)`로 보고했다. 계획은 이 경우 `blocked`를 요구했다. 문서 곳곳에 시뮬레이터 증거뿐임을 적어 두었다.
7. 버튼·칩 조사에 `GoButton` 호출 위치 표(28곳)를 더했다.
8. `d0a5d1c`를 브랜치에 그대로 두었다.

## 10. 독립 리뷰에서 미룬 사소한 지적

고치지 않았다. 단계 2~3에서 해당 문서를 만질 때 함께 고치면 된다.

- 진단 D-09: 기능 이름은 세 벌이 아니라 네 벌이다(`ChatRail.tsx:12-16`의 접근성 라벨 포함). dock 제목의 근거는 `TabletAgentLayer.tsx:39`, Phone 탭 정의는 `app/(main)/_layout.tsx:22-27`이다.
- 조사표: `ProfileActions` 행(53/65/74)을 `(T)`로 표시했지만 밑줄색이 `#000000` 하드코딩이다(`ProfileActions.tsx:123`).
- 조사표: `StudyNoteForm` 칩을 "토큰만 쓴다"고 적고 표에서는 `(H: 32)`로 표시했다.
- 조사표: `TimelinePanel.tsx:205`의 눌림색 `#D35400`과 `GoButton`의 scale 1.05가 빠졌다.
- 진단 §7: 하드코딩 색 상위 10개 파일 목록이 hex와 색 이름 수를 섞어 센 값이다. 잉크 색도 섞여 있다.
- `ui-structure.json`: `ext` 노드의 `kind: "external"`이 블록도 스펙의 종류 목록에 없다.
- 블록도에 시스템 UI(사진 선택기 `src/adapters/profileEditors.ts:70`, 네이티브 로그인 시트 `src/auth/oauth.ts:39-66`)가 노드로 없다.

## 11. 옮겨지지 않는 것

- 이전 세션의 superpowers 진행 기록(`.superpowers/sdd/…/progress.md`)은 git에서 무시된다. 필요한 내용은 §9와 §10에 옮겨 적었다.
- 이전 세션의 대화 내용. 이 문서와 위 산출물이 전부다.
- 시뮬레이터에 설치한 앱과 로그인 상태, `ios/build/sim-dd` 빌드 산출물.
