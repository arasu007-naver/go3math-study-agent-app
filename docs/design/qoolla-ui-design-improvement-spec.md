# Qoolla UI 디자인 개선 작업 스펙 (단계별 스킬 명시)

> 대상: Claude (코딩 에이전트)  
> 목적: 13년간 여러 코드를 붙여 만든 Qoolla Expo/RN 학생 앱의 **레이아웃·시각 일관성**을, 화면마다 “예쁘게” 따로 고치지 않고 **승인된 기준을 단계적으로 적용**한다.  
> 산출: 단계별 문서·기준·(승인 후) 시각 구현. 교육 내용·업무 로직·라우트 의미·권한·실제 저장 행위는 보존한다.  
> 확인일: **2026-11-10 (Asia/Seoul, KST)** — 아래 스킬 이름·설치 명령은 이 날짜에 upstream을 직접 확인한 값이다.

---

## 0. 범위 / 비범위 / 입력

### 0.1 범위
- 레이아웃, 여백, 정렬, 타이포, 색·상태, 버튼·아이콘, 모달/시트/독/오버레이 시각·역할 정리, 공통 컴포넌트·토큰, 실기기 검증.
- 단계 상태는 실제로만 표기: `미착수` | `진행` | `승인대기` | `완료` | `blocked`.

### 0.2 비범위
- 비즈니스/에이전트 프로토콜, GraphQL·WebSocket, 인증, MMKV 키·값, 필기 잉크 색 데이터, 앱 아이콘·스플래시·번들 ID 변경.
- Dark mode **구현**(토큰 구조 대비만 허용). `react-native-paper` **재도입 금지**.
- Landscape에서 **제한할 기능 목록을 새로 창작**하는 것(메커니즘·미정 목록은 기존 결정 유지).
- 스토어 제출, 유료 계정·인증서 신규, 무단 배포. 이 스펙 문서 작성 단계에서 앱 수정·스킬 설치·기기 캡처를 **지금 실행하지 않는다**(Claude가 이후 단계로 수행할 때 본문 규칙을 따른다).

### 0.3 입력 (placeholder — 실행 시 채움)

| 항목 | 값 |
|---|---|
| 프로젝트 루트 | `<프로젝트 경로>` (예: `go3math-study-agent-app`) |
| 기준 브랜치/커밋 | `<branch 또는 commit>` |
| 작업 브랜치 | `<예: design/ui-redesign>` (푸시·PR은 사용자 지시 시에만) |
| 선행 구조 스펙 | `specs/expo-ui-block-diagram-spec.md` (전달받은 원본을 참조. 이 작업에서 별도 개정하지 않음) |
| 기존 디자인 구현 명세 | `specs/design-spec.md` v1.1 (제공된 경우 참조. 기능 제약·과거 토큰 안. 시각 수치는 재진단 후 재확정) |
| 캡처 기기 | 실제 iPad(모델·iPadOS·빌드는 다이어그램 스펙 §1과 동일 placeholder) |

참조 문서는 Claude 실행 환경에 첨부하거나 위 상대 경로에 준비한다. 경로는 실제 위치에 맞춰 입력한다. 문서가 없으면 그 내용을 읽은 것으로 가정하지 말고 누락을 기록한다.

### 0.4 승인 게이트 (필수)
1. **Gate A** — 단계1 진단·블록도·iPad 캡처 보고 승인 전, 전체 화면 시각 개편 금지.  
2. **Gate B** — 단계2 역할/정보구조 안 승인 전, 공통 컴포넌트·전면 토큰 교체 금지.  
3. **Gate C** — 단계3 토큰·공통 컴포넌트 기준 승인 전, 다수 화면 일괄 수정 금지.  
4. **Gate D** — 단계4 대표 학습 화면(채팅·캔버스·독·시트) **실제 iPad 승인** 전, 다른 화면군 확산 금지.  
5. 큰 방향 변경(팔레트 교체, 내비 모델 변경, 신규 UI 라이브러리)은 명시 승인 후에만.

선택지는 **1안+근거**를 기본으로 한다. 대안은 충돌·불가피한 경우에만.

---

## 1. 기존 제약 보존 · 문서 충돌

### 1.1 반드시 보존 (기능 요구)
- 폰트: **Pretendard** 유지(번들 굵기·적용 방식은 코드·`design-spec`과 맞출 것).
- `react-native-paper` 재도입 금지.
- Tablet: 짧은 변 `min(w,h) ≥ 600` (히스테리시스 등 **판정 로직**은 임의 변경 금지; 코드 확인 후 보고).
- 하단 고정 기능 **6칸**: 공지 · 검색 · 타임라인 · 실황 수업 · 주간 공부 · 내 정보.
- Dark mode: 현 범위 **제외**.
- Landscape 제한 **기능 목록**: 미정으로 기록하고 실제 코드의 현재 동작을 유지한다. 새 제한을 창작하거나 기존 제한을 임의 해제하지 않는다.
- 스타일 스택: 기존 **RN StyleSheet + 토큰** 우선. NativeWind/Tamagui 등 신규 스타일 체계 도입 금지(추가 의존성은 사용자 승인).

### 1.2 재검토 가능 (배치·시각 값, 영구 고정 아님)
- Tablet drawer 폭 30%·clamp, 카드 gutter, 구체 hex/spacing/radius 수치, FloatingToolbar 세부 치수 등 **배치·토큰 숫자**.
- `design-spec.md`에 적힌 토큰 표·구현 순서는 **과거 구현안**이다. 본 스펙의 진단(단계1) 후 Gate B/C에서 재확정한다. 단, §1.1 기능 요구와 “동작·프로토콜·데이터 불변”은 유지.

### 1.3 스킬 지침과의 충돌 (우선순위)
| 출처 | 내용 | 본 작업에서의 처리 |
|---|---|---|
| `expo-native-ui` / `expo-design-system` | `Color`(expo-router) 시맨틱 색, light/dark 자동 적응, `@expo/ui` 우선 | **조건부**. 앱이 Expo SDK 54대라면 SDK 56+·`@expo/ui` 전면 도입을 요구하지 않는다. 기존 `theme`을 확장. Dark 구현 금지와 충돌하면 dark 도입하지 않는다. |
| `expo-native-ui` | SF Symbols / 시스템 폰트 권장 | Pretendard·기존 아이콘 스택(`@expo/vector-icons` 등) 유지. 신규 아이콘 패키지는 승인 전 금지. |
| `impeccable` detector | overused-font 등 | Pretendard는 브랜드 폰트로 **ignore** 후보. 규칙을 끄거나 예외 사유를 기록. |
| `ui-ux-pro-max` | 새 팔레트·폰트 페어링 제안 | **선택적 방향 탐색만**. 승인된 Qoolla 기준·Pretendard와 섞어 최종안을 만들지 않는다. |
| `vercel-react-native-skills` | FlashList·네이티브 모달 등 | 성능·패턴 참고. 라우트/저장/권한 의미 변경·대규모 내비 교체는 Gate 승인 필요. |

실제 화면·소스를 **지금 분석한 척하지 않는다.** 아래 진단·수치·명령은 실행 시 코드·기기에서 확인한다.

---

## 2. 스킬 레지스트리 (2026-11-10 KST 확인)

### 2.1 Claude에서 스킬 쓰는 방식
- **Claude Code / plugin·`.claude/skills`**: 설치된 스킬이 작업 맥락에 맞게 로드될 수 있다. 시작 시 ` /skills`·플러그인 목록·프로젝트 `.claude/skills` 존재를 **확인**한 뒤 사용한다.
- **일반 Claude 대화(스킬 미설치)**: 자동 적용되지 않는다. 스킬을 읽었다고 주장하거나 설치했다고 가정하지 말고, 없으면 **blocked**로 보고하거나 공개 SKILL.md URL을 읽어 지침만 따른다(실행 환경 정책에 맞게).
- 임의 slash command를 새로 만들지 않는다. 공식 명령만 사용한다.

### 2.2 필수

| 스킬 이름 (frontmatter) | 역할 | 설치 (확인됨) | 비고 |
|---|---|---|---|
| `impeccable` | 기존 UI 평가·개선 지휘. Operate 모드(앱 UI). `critique`/`audit`/`document`/`extract`/`layout`/`typeset`/`adapt`/`polish`/`harden`/`optimize`/`shape`/`init` | `npx impeccable install` — 또는 Claude: `/plugin marketplace add pbakaus/impeccable` 후 Impeccable 설치. 이후 `/impeccable init` | v4.8.2 확인. 네이티브: `adapt.native.md` 등. **필수 1순위(진단·개선안).** |
| `expo-design-system` | 인앱 토큰(theme)·공통 컴포넌트 계약·드리프트 감사 | Skills CLI: `npx skills@latest add expo/skills --skill expo-design-system` — 또는 Claude plugin: `claude plugin install expo@claude-plugins-official` (플러그인은 Expo 스킬 묶음) | `*` 전체 설치 강요 금지. 이 이름만 지정. |
| `vercel-react-native-skills` | RN/Expo 성능·리스트·Pressable·safe area·네이티브 모달 패턴 | `npx skills add vercel-labs/agent-skills --skill vercel-react-native-skills` | 폴더명은 `react-native-skills`, **호출 이름은 frontmatter `vercel-react-native-skills`**. Vercel 문서 기준 설치명 사용. |

### 2.3 조건부

| 스킬 이름 | 언제 | 설치 | 제한 |
|---|---|---|---|
| `expo-native-ui` | 네이티브 감각 스타일·safe area·시트/컨트롤 가이드가 필요할 때 | `npx skills@latest add expo/skills --skill expo-native-ui` | **새 라이브러리 전면 도입 요구 아님.** SDK/`@expo/ui` 전제가 맞지 않으면 지침만 참고하고 의존성 추가는 승인. |
| `expo-router` | Modal/Sheet/Stack 역할·presentation 정리 시 | `npx skills@latest add expo/skills --skill expo-router` | 라우트 **의미·경로 남용 리팩터** 금지. presentation·헤더 등 시각/내비 표현만. |
| `expo-overview` | Expo 작업 진입점이 모호할 때 | `npx skills@latest add expo/skills --skill expo-overview` | 선택적 로드. |

### 2.4 선택 (방향 탐색만)

| 스킬 이름 | 설치 | 사용 규칙 |
|---|---|---|
| `ui-ux-pro-max` | Claude: `/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill` → `/plugin install ui-ux-pro-max@ui-ux-pro-max-skill` — 또는 `npx ui-ux-pro-max-cli init --ai claude` | Gate B 이전 **짧은 방향 탐색**에만. 결과로 Pretendard·6칸 바·paper 금지를 뒤집지 않는다. 승인 기준과 **취향을 섞지 않는다.** |

### 2.5 설치 최소 범위 (권장 명령 묶음)
```bash
# 프로젝트 루트에서 — 필수만
npx impeccable install
npx skills@latest add expo/skills --skill expo-design-system
npx skills add vercel-labs/agent-skills --skill vercel-react-native-skills

# 조건부 (필요할 때만)
npx skills@latest add expo/skills --skill expo-native-ui
npx skills@latest add expo/skills --skill expo-router
```
Claude Code면 Expo/Impeccable은 README의 **plugin 경로**를 우선해도 된다. `npx skills@latest add expo/skills --skill '*'` 전체 설치는 하지 않는다.

---

## 3. 단계 개요 (제안 순서 1→5 ↔ 본 문서 1→6)

| 사용자 제안 | 본 문서 단계 | 한 줄 |
|---|---|---|
| 1 현황을 블록도·iPad 스크린샷으로 펼쳐 진단 | **1** (+0 준비) | 구조·실기기 증거 + UX 진단 |
| 2 화면/모달/시트/독 역할·정보구조 통일 | **2** | 상호작용·레이아웃 역할 기준 |
| 3 작은 디자인 시스템·공통 컴포넌트 | **3** | 토큰·프리미티브·상태 규칙 |
| 4 대표 학습 화면 완성·승인 | **4** | 채팅·캔버스·독·시트 파일럿 |
| 5 화면군 점진 확산·실기기 검증 | **5** + **6** | 확산 + QA |

선행 산출물 루트: `docs/ui-redesign/` (다이어그램 산출물은 기존 `docs/ui-structure/` — 블록도 스펙 준수).

---

## 4. 단계×스킬×작업×산출물×통과 기준

상태 열은 실행 시 갱신한다.

### 단계 0 — 환경·스킬·baseline
| | |
|---|---|
| **상태** | 미착수 |
| **필수 스킬** | `impeccable` (`init`로 PRODUCT.md 등 프로젝트 맥락 — 없으면 기존 스펙으로 대체하고 미실행 사유 기록) |
| **조건부** | Expo plugin/`expo-overview` (에이전트가 Expo 진입에 혼선일 때) |
| **작업** | 스킬 설치·노출 확인. baseline 커밋 기록. `package.json` 스크립트에서 **실제 존재하는** lint/typecheck/test/build 명령만 메모(없으면 `미확인`, 지어내지 않음). 기존 `design-spec`·에이전트 스펙의 보존 제약을 체크리스트로 옮김. |
| **산출물** | `docs/ui-redesign/00-baseline.md` (커밋, 스킬 목록, 명령 메모, 제약) |
| **통과** | 필수 스킬이 에이전트에 보이거나, 부재 시 blocked+대안. 소스 미변경. |

### 단계 1 — 현황 진단 (제안 ①)
| | |
|---|---|
| **상태** | 미착수 |
| **필수 스킬** | `impeccable` — `critique`(휴리스틱·우선순위), `audit`(a11y·반응형·품질; 네이티브면 `audit.native` 경로). 진단 관점: 여백/정렬/시선 우선순위/중복 조작/과도한 구획/버튼 우선순위/텍스트 위계/아이콘/로딩·빈·오류·disabled·선택/한국어 긴 문구·수식/키보드·safe area·회전·스크롤·시트 겹침. |
| **선행** | **`expo-ui-block-diagram-spec.md` 전체 수행**(Screen/Modal/Modeless/Dock/Bottom Sheet + iPad 실캡처·`ui-structure.html`). 이 단계는 그 스펙의 **소스 미변경** 규칙을 따른다. |
| **조건부** | `expo-router`(presentation·시트 분류 보강), `expo-native-ui`(네이티브 안티패턴 이름 참고) |
| **선택** | `ui-ux-pro-max` — 방향 키워드 탐색만, 최종 팔레트 확정 금지 |
| **작업** | 코드 근거 블록도 + 실 iPad 캡처. 기존 버튼·칩 구현과 사용 위치(인라인 구현 포함)를 수집한다. Impeccable로 우선순위 이슈 목록. Phone은 **별도 출처**(실기기 또는 시뮬레이터)를 명시하고 iPad 캡처로 Phone을 대체하지 않음. |
| **산출물** | `docs/ui-structure/*`(다이어그램 스펙), `docs/ui-redesign/01-diagnosis.md`, (선택) `.impeccable/critique/*` |
| **통과** | Gate A. 미캡처는 사유. 시뮬레이터를 실기기로 포장 금지. |

### 단계 2 — 내비·오버레이·레이아웃 역할 (제안 ②)
| | |
|---|---|
| **상태** | 미착수 |
| **필수 스킬** | `impeccable` — `shape`(코드 전 UX 계획), `adapt`(+ **native** 참고: Phone↔Tablet은 늘리기가 아니라 재구성). |
| **조건부** | `expo-router`(modal/formSheet/tabs 역할 정리 가이드), `expo-native-ui`(시트 vs 커스텀 모달 등 — 도입 강요 없이) |
| **작업** | Screen/Modal/Modeless/Dock/Bottom Sheet의 **정보구조·차단성·진입/닫힘** 역할을 표로 통일. Phone/Tablet 배치 원칙(예: 채팅 drawer overlay, 독 고정 6칸)을 문서로 확정. drawer **폭 %** 등 배치는 안을 제안하되 6칸 기능과 필기·학습 상태 보존 요구와 분리. |
| **산출물** | `docs/ui-redesign/02-ia-overlay-roles.md` (1안+근거) |
| **통과** | Gate B. 라우트 의미·권한 변경 없음. |

### 단계 3 — 토큰·공통 컴포넌트·상태 규칙 (제안 ③)
| | |
|---|---|
| **상태** | 미착수 |
| **필수 스킬** | `expo-design-system` — 기존 theme 채택·확장, 하드코딩 드리프트 감사, variant/size/state 계약. `impeccable` — `document`(DESIGN.md), `extract`(반복 패턴→시스템). |
| **조건부** | `expo-native-ui`(네이티브 감각 값 참고), `vercel-react-native-skills`(`ui-pressable`, safe area, 이미지 등 패턴) |
| **작업** | 코드·진단에서 토큰 도출. **임의 팔레트/글자크기/치수를 최종인 양 단정하지 않음.** 기준 파일(예: 기존 `src/ui/theme.ts` 경로가 있으면 그것) + 예외 대장. **공용 `Button`·`Chip` 추출을 필수 작업**으로 하고, Text/Card/Sheet 등은 실제 반복 패턴을 기준으로 작은 세트로 정리한다. 상태: default/pressed/disabled/loading/selected/error/empty. Pretendard·paper 금지·dark 제외 준수. |
| **산출물** | `docs/ui-redesign/03-tokens-components.md`, 예외대장, (승인 후) theme/프리미티브 코드 |
| **통과** | Gate C. 대표 화면 승인 전 전 앱 일괄 치환 금지. |

#### 단계 3 필수 세부 작업 — 공용 `Button`·`Chip` 추출

**적용 스킬:** `impeccable`의 `extract` + `expo-design-system`. 조작·접근성 구현 검토에는 `vercel-react-native-skills`를 적용한다.

1. **기존 구현 목록화:** 컴포넌트명만 검색하지 말고 `Pressable`/`Touchable*`, 인라인 스타일, 라이브러리 버튼, 필터·태그·선택 칩 등 실제 사용처를 찾는다. `파일:라인 / 역할 / 현재 표현 / 동작·상태 / 공용화 대상 / 예외 사유`를 기록한다. 단계 1은 조사만 수행한다.
2. **공용 컴포넌트 설계:** `Button`과 `Chip`을 각각 독립된 재사용 컴포넌트로 추출한다. 기존 공용 구현이 있으면 확장·정리하고 같은 역할의 컴포넌트를 새로 중복 생성하지 않는다. 실제 코드 이름과 저장 경로는 기존 프로젝트 관례에 맞춰 확정한다.
3. **공통 계약:** 색·간격·높이·글자·모서리는 승인된 토큰을 사용한다. `variant`·`size`·아이콘·비활성·접근성 속성 등은 실제 사용 사례를 근거로 타입을 정의한다. 화면별 복사나 무제한 스타일 덮어쓰기를 기본 사용법으로 삼지 않는다.
4. **`Button` 규칙:** 주요/보조/위험 동작의 위계, 눌림·비활성·로딩 상태, 아이콘 배치를 통일한다. 기존 클릭 처리와 로딩 중 중복 실행 방지 등 동작을 보존하며 상태 전환을 검증한다.
5. **`Chip` 규칙:** 정보 태그·필터·선택·삭제 가능 칩은 실제 존재하는 용도만 구분한다. 선택/비선택·비활성·삭제 동작은 해당 용도에만 적용한다. 읽기 전용 태그를 임의로 클릭 가능하게 만들거나 선택·필터 의미를 바꾸지 않는다.
6. **점진 교체:** Gate C 승인 후 대표 화면에서 공용 `Button`·`Chip`을 먼저 구현·사용한다. Gate D 승인 뒤 단계 5에서 화면군별 기존 구현을 교체한다. 모든 사용처를 조사하되 실제 Chip이 없는 대표 화면에 검증 목적으로 가짜 기능을 추가하지 않는다.
7. **예외 관리:** 플랫폼 고유 컨트롤 등 공용화하지 않는 항목은 근거와 위치를 예외 대장에 남긴다. 스타일이 조금 다르다는 이유만으로 중복 구현을 유지하지 않는다.

**추가 산출물:** `docs/ui-redesign/03-components-inventory.md`(기존→공용 매핑·예외), `03-tokens-components.md` 안의 `Button`·`Chip` API/상태별 사용 예제, 승인 후 공용 컴포넌트 코드와 기존 테스트 체계에 맞춘 검증.

**완료 기준:** 공용 `Button`·`Chip`이 실제 사용처에서 재사용되고, 중복 스타일은 토큰·variant로 정리돼 있다. 교체한 사용처·남은 사용처·예외를 구분하며 기존 동작·접근성·Phone/Tablet 표현을 검증한다. 컴포넌트 파일만 만들고 사용처를 그대로 두면 완료로 보지 않는다.

### 단계 4 — 대표 학습 화면 파일럿 + iPad 승인 (제안 ④)
| | |
|---|---|
| **상태** | 미착수 |
| **필수 스킬** | `impeccable` — `layout`/`typeset`/`polish`(필요 시 `quieter`/`distill`로 과밀 완화). `vercel-react-native-skills` — 스크롤·리스트·모달·safe area 구현 품질. |
| **조건부** | `expo-native-ui`, `expo-router` |
| **작업** | **채팅 · 캔버스 · 독 · 시트**만 기준 적용. 전후 캡처(실 iPad). 롤백 가능한 작은 커밋 단위. 배포·스토어 없음. |
| **산출물** | `docs/ui-redesign/04-pilot/` (전후 PNG·노트), 파일럿 코드 |
| **통과** | Gate D — 사용자 **실기기** 승인. 기능 회귀(필기·알림·6칸 기능·에이전트 지시 처리) 확인. |

### 단계 5 — 화면군 점진 확산 (제안 ⑤)
| | |
|---|---|
| **상태** | 미착수 |
| **필수 스킬** | `expo-design-system`(드리프트 재감사), `impeccable` `polish`/`critique`(군 단위) |
| **조건부** | `vercel-react-native-skills` |
| **작업** | 우선순위 예: (1) 학습 본체 잔여 (2) 검색·타임라인 (3) 공지·실황·주간 (4) 내 정보/설정. 군마다 전후 캡처·짧은 테스트·롤백 단위. **승인된 기준만** 적용(화면별 새 취향 금지). 공용 `Button`·`Chip`으로 기존 사용처를 점진 교체하고 매핑·예외 대장을 갱신한다. |
| **산출물** | `docs/ui-redesign/05-rollout-log.md` |
| **통과** | 군별 체크리스트 + 실 iPad 스모크. |

### 단계 6 — QA (기능·시각·a11y·성능)
| | |
|---|---|
| **상태** | 미착수 |
| **필수 스킬** | `impeccable` — `harden`(오류·오버플로·엣지), `audit`, `optimize`(필요 시). `vercel-react-native-skills`(리스트·애니·렌더). |
| **조건부** | `expo-native-ui` Behavior/a11y 점검 항목 |
| **작업** | 기능 회귀, 시각 일관성, 접근성(iPad 터치 영역은 최소 44×44pt를 목표로 확인, 접근성 라벨·스크린리더·글자 확대·명암 대비 점검), 성능(스크롤 프레임). repo에 **실재하는** lint/typecheck/test/build만 실행. 불가 항목은 `blocked`/`미검증`+사유. Phone/iPad 출처 분리. |
| **산출물** | `docs/ui-redesign/06-qa-report.md` |
| **통과** | 치명 이슈 0, 제약 §1.1 유지, paper 미재도입, Pretendard 유지. `Button`·`Chip`의 재사용·상태·동작·예외 검증 완료. |

---

## 5. 구현 vs 분석 — 소스 변경 규칙

| 구간 | 소스 수정 |
|---|---|
| 단계 0–1, 블록도 스펙 수행 | **금지** (분석·캡처·문서만) |
| 단계 2 | 원칙적으로 문서. 실험 코드 필요 시 사용자 승인 |
| 단계 3–6 | Gate 통과 후 **시각·스타일·공통 컴포넌트**만 허용. 로직/프로토콜/저장/권한/라우트 의미 변경 금지 |
| Git | 비파괴 브랜치·작은 커밋. push/PR/배포는 사용자 지시 시에만 |

---

## 6. 검증·캡처 규칙 (요약)
- **실제 iPad** 증거를 기본으로 한다. 시뮬레이터는 출처를 명시하고 실기기 완료로 보고하지 않는다.
- Phone은 별도 장치/시뮬레이터 + 출처. iPad 캡처로 Phone을 대체하지 않는다.
- 전후 비교 경로: `docs/ui-redesign/captures/<phase>/<device>-<screen>-before|after.png`
- 비밀·개인정보 화면 금지. 테스트·비식별 데이터 우선. 운영 데이터 변경·실제 제출 금지.
- 임의 “개선 %” 수치 금지. 측정했으면 방법·조건을 적는다.

---

## 7. 단계별 Claude 지시문 (복붙용)

공통 머리말:
```text
스펙: specs/qoolla-ui-design-improvement-spec.md
프로젝트: <루트> @ <commit>
지금 단계: <N>
필수 스킬: <이름들> — 설치/노출을 확인한 뒤에만 “스킬 사용”이라고 쓸 것. 없으면 blocked.
보존: Pretendard, paper 재도입 금지, 6칸 하단 기능, Tablet≥600 판정 로직, dark 제외, landscape 제한 목록 창작 금지.
교육/업무 로직·라우트 의미·권한·저장 행위 변경 금지.
선택지는 1안+근거. 승인 게이트 이전 다음 단계 코드 확산 금지.
```

| 단계 | 추가 지시 |
|---|---|
| 0 | 스킬 설치 확인, `00-baseline.md` 작성, 소스 수정 없음. |
| 1 | `expo-ui-block-diagram-spec.md` 선행 완료 → `impeccable critique/audit`로 `01-diagnosis.md`. Gate A까지. |
| 2 | `impeccable shape` + `adapt`(native). `02-ia-overlay-roles.md`. Gate B. |
| 3 | `expo-design-system` + `impeccable document/extract`. 토큰은 코드·진단 근거. 기존 버튼·칩을 조사해 공용 `Button`·`Chip`으로 추출하는 API·상태·사용처 매핑을 작성하라. Gate C 전 전면 치환 금지. |
| 4 | 채팅·캔버스·독·시트만. `layout`/`typeset`/`polish` + `vercel-react-native-skills`. 실 iPad 전후 캡처. Gate D. |
| 5 | 승인 기준만 화면군 적용. 롤아웃 로그. 취향 재발명 금지. |
| 6 | `harden`/`audit`/`optimize` + RN 성능 규칙. 실재 스크립트만. `06-qa-report.md`. |

시작 프롬프트 예:
```text
Qoolla UI 개선을 specs/qoolla-ui-design-improvement-spec.md 대로 진행한다.
필수 스킬 impeccable, expo-design-system, vercel-react-native-skills 노출을 먼저 확인해라.
지금은 단계 0→1만. 블록도 스펙을 선행하고 소스는 수정하지 마라.
산출물: docs/ui-redesign/00-baseline.md, 01-diagnosis.md, docs/ui-structure/* .
Gate A 승인 전 단계 2 이상으로 가지 마라.
```

---

## 8. 완료 보고 형식 (단계마다)
- 단계·상태·사용한 스킬(실제 로드 여부)
- 산출물 경로
- 캡처: 실기기 여부(`isPhysicalDevice`), 모델, 방향
- 승인 게이트 요청 여부 / blocked 사유
- 소스 변경 파일 목록(없으면 “없음”)
- 다음 단계 진입 가능 여부

---

## 9. 출처 (upstream, 2026-11-10 KST)
- [Impeccable README](https://github.com/pbakaus/impeccable), [스킬 정의](https://raw.githubusercontent.com/pbakaus/impeccable/main/plugin/skills/impeccable/SKILL.md), [네이티브 적응 지침](https://raw.githubusercontent.com/pbakaus/impeccable/main/plugin/skills/impeccable/reference/adapt.native.md).
- [Expo skills README](https://github.com/expo/skills), [expo-design-system 정의](https://raw.githubusercontent.com/expo/skills/main/plugins/expo/skills/expo-design-system/SKILL.md), [expo-native-ui 정의](https://raw.githubusercontent.com/expo/skills/main/plugins/expo/skills/expo-native-ui/SKILL.md).
- [Vercel agent-skills README](https://github.com/vercel-labs/agent-skills), [React Native 스킬 정의](https://raw.githubusercontent.com/vercel-labs/agent-skills/main/skills/react-native-skills/SKILL.md) (frontmatter 이름 `vercel-react-native-skills`, 폴더명 `react-native-skills`).
- [UI UX Pro Max README](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) (**선택**).
- 로컬: `specs/expo-ui-block-diagram-spec.md`, `specs/design-spec.md` v1.1.

미확인으로 남긴 것: 대상 리포의 **현재** lint/test 스크립트 실제 이름, 대상 커밋의 Expo SDK 패치 버전, 스킬이 사용자 Claude 환경에 이미 설치돼 있는지 — 실행 시 확인.
