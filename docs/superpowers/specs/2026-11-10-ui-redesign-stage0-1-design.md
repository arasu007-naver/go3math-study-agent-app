# UI 디자인 개선 — 단계 0→1 (baseline · 블록도 · 진단) 설계

- 작성일: 2026-11-10
- 상위 스펙: `docs/design/qoolla-ui-design-improvement-spec.md` (이하 "개선 스펙")
- 선행 스펙: `docs/expo-ui-block-diagram-spec.md` (이하 "블록도 스펙")
- 범위: 개선 스펙의 단계 0과 단계 1. **Gate A 승인 요청에서 끝난다.** 단계 2 이후는 별도 설계·계획 사이클로 다룬다.

## 1. 목표

Qoolla 학생 앱의 현재 UI 구조와 시각 문제를 코드와 실기기 증거로 펼쳐 놓고, 사용자가 Gate A에서 판단할 수 있는 진단 보고서를 만든다. 이 사이클에서는 앱 소스(`app/`, `src/`)를 수정하지 않는다.

성공 기준:

1. `docs/ui-redesign/00-baseline.md`가 기준 커밋, 스킬 상태, 실재 스크립트, 보존 제약을 담고 있다.
2. `docs/ui-structure/`가 블록도 스펙 §7 완료 조건을 충족한다.
3. `docs/ui-redesign/01-diagnosis.md`가 우선순위가 매겨진 이슈 목록과 버튼·칩 사용처 조사표를 담고 있다.
4. `git diff --stat <기준 커밋> -- app src`의 출력이 비어 있다.

## 2. 결정 사항

| 항목 | 결정 | 근거 |
|---|---|---|
| 이번 사이클 범위 | 단계 0→1만 | 단계 2 이후 설계는 단계 1 진단 결과에 의존한다 |
| 작업 브랜치 | `feat/study-note`(76b99e3)에서 `design/ui-redesign` 분기 | 최신 시트·공부노트 UI를 진단에 포함한다 |
| 미설치 필수 스킬 | `expo-design-system`, `vercel-react-native-skills`를 단계 0에서 설치 | 단계 0 통과 기준이 필수 스킬 노출이다 |
| iPad 캡처 | 사용자가 실기기를 연결하고 에이전트가 캡처 | Gate A는 실기기 증거를 요구한다 |
| Phone 캡처 | 시뮬레이터, 출처 명시 | 개선 스펙 §6이 허용한다 |
| 기존 블록도 | 재작성하지 않고 코드와 대조해 검증·보완 | 이미 노드·엣지·JSON이 있다. 검증으로 오래된 내용을 걸러낸다 |
| push / PR | 하지 않음 | 개선 스펙 §5 |

## 3. 시작 시점의 저장소 상태

- Expo SDK 54(`~54.0.36`), RN 0.81.5, expo-router `~6.0.24`. 라우트는 `app/`에 있다.
- 실재 스크립트: `lint`(expo lint), `typecheck`(tsc --noEmit), `test`(jest), `test:e2e`(maestro), `doctor`(expo-doctor).
- 설치된 스킬: `impeccable`(사용자 전역). `expo-design-system`, `vercel-react-native-skills`는 없다.
- `PRODUCT.md`, `DESIGN.md`, `specs/design-spec.md`가 이미 있다. `docs/design/before`, `after-P1`~`after-P3`, `after-rail`에 과거 개선 패스의 캡처가 있다.
- `docs/ui-structure/screen-block-diagram.html`이 있다(미커밋). 다이어그램, 노드·엣지 표, 이슈 목록, 계획(미구현), JSON 섹션을 포함한다. `ui-structure.md`, `ui-structure.json` 파일은 없고 캡처도 없다.
- 개선 스펙은 블록도 스펙 경로를 `specs/expo-ui-block-diagram-spec.md`로 적었지만 실제 위치는 `docs/expo-ui-block-diagram-spec.md`다.
- 실기기 "Jaesung의 iPad"는 설계 시점에 오프라인이다.

## 4. 작업 구성

### 4.1 준비

1. `design/ui-redesign` 브랜치를 만든다.
2. 미커밋 문서 3건(`docs/design/qoolla-ui-design-improvement-spec.md`, `docs/expo-ui-block-diagram-spec.md`, `docs/ui-structure/screen-block-diagram.html`)을 첫 커밋으로 넣는다.
3. 스킬을 설치한다.
   ```bash
   npx skills@latest add expo/skills --skill expo-design-system
   npx skills add vercel-labs/agent-skills --skill vercel-react-native-skills
   ```
   설치로 생긴 파일은 별도 커밋으로 둔다. 현재 세션에 노출되지 않으면 baseline에 "설치됨, 다음 세션부터 노출"로 적는다. `--skill '*'` 전체 설치는 하지 않는다.

### 4.2 단계 0 — `docs/ui-redesign/00-baseline.md`

담는 내용:

- 기준 브랜치와 커밋, 작업 브랜치.
- 스킬별 설치 여부와 현재 세션 노출 여부.
- 실재 스크립트 목록. build 스크립트는 없으므로 `미확인`이 아니라 "없음(EAS/`expo run`)"으로 적는다.
- 개선 스펙 §1.1 보존 제약 체크리스트. 각 항목에 코드 근거(`파일:라인`)를 단다. 특히 Tablet 판정 로직(진입 600, 이탈 560, 디바운스)과 하단 6칸은 코드에서 위치를 확인해 적는다.
- 참조 문서의 실제 경로와 스펙상의 경로 차이.
- `impeccable init` 미실행 사유: `PRODUCT.md`와 `DESIGN.md`가 이미 있다.
- 과거 개선 패스(P1~P3, rail)의 존재와 캡처 위치.

### 4.3 단계 1-a — 블록도 (`docs/ui-structure/`)

1. 블록도 스펙 §4 절차로 라우트, Navigator, 비라우트 UI(Modal, 시트, drawer, toast, 오버레이), 전환을 코드에서 수집한다.
2. 수집 결과를 기존 HTML의 노드·엣지와 대조한다. 누락, 오래된 항목, 근거 라인이 어긋난 항목을 고친다.
3. 산출물:
   - `ui-structure.md` — 블록도 스펙 §5.1 구성.
   - `ui-structure.json` — 블록도 스펙 §5.2 스키마.
   - `ui-structure.html` — 기존 `screen-block-diagram.html`을 이 이름으로 옮기고 내용을 갱신한다.
4. 검증: Mermaid가 오류 없이 렌더링되는지, md와 json의 노드·엣지 수가 같은지, 모든 엣지에 `파일:라인` 근거가 있는지, 모든 노드에 진입 경로가 있는지(없으면 `orphan`) 확인한다.

### 4.4 단계 1-b — 캡처 (`docs/ui-redesign/captures/01/`)

1. 블록도 노드 목록에서 캡처 목록을 만든다. 항목마다 화면, 상태, 방향, 파일명을 적는다. 파일명은 `<device>-<screen>-before.png` 형식이다.
2. iPad 실기기: 사용자가 기기를 연결·잠금 해제한다. 기기에 dev client가 이미 설치돼 있으면 그것을 쓴다. 없어서 새 빌드가 필요하면 빌드 전에 사용자에게 확인한다(`ios/` 생성 여부 포함). 화면 이동이 원격으로 안 되는 곳은 사용자가 기기에서 조작한다.
3. Phone: 시뮬레이터로 찍고 출처를 "시뮬레이터"로 적는다. iPad 캡처로 대신하지 않는다.
4. 테스트·비식별 계정만 쓴다. 제출, 저장 등 운영 데이터를 바꾸는 동작은 하지 않는다. 개인정보가 보이는 화면은 찍지 않는다.
5. 찍지 못한 항목은 사유와 함께 목록에 남긴다. 캡처마다 실기기 여부, 모델, OS, 방향을 기록한다.
6. `ui-structure.html`에 캡처를 연결한다.

### 4.5 단계 1-c — 진단 (`docs/ui-redesign/01-diagnosis.md`)

1. `impeccable`의 `critique`와 `audit`(native 경로)을 캡처와 코드에 적용한다. 진단 관점은 개선 스펙 단계 1 표의 목록을 따른다.
2. 이슈마다 심각도, 위치(화면과 `파일:라인`), 증거(캡처 경로), 해당 관점을 적는다. 해결안은 방향만 적고 수치는 확정하지 않는다.
3. 버튼·칩 조사: 컴포넌트명뿐 아니라 `Pressable`, `Touchable*`, 인라인 스타일, 필터·태그·선택 칩까지 검색한다. `파일:라인 / 역할 / 현재 표현 / 동작·상태` 표로 기록한다. 공용화 대상 판정과 예외 사유 열은 단계 3에서 채우므로 비워 둔다.
4. `DESIGN.md` 토큰과 `src/ui/theme.ts`, 실제 화면 코드의 하드코딩 값 사이의 어긋남을 진단 항목으로 넣는다.
5. Pretendard에 대한 impeccable detector 경고는 브랜드 폰트 예외로 기록한다.
6. `ui-ux-pro-max`는 이번 사이클에서 쓰지 않는다.

### 4.6 종료

1. `git diff --stat 76b99e3 -- app src`가 비어 있는지 확인한다.
2. `npm run lint`와 `npm run typecheck`를 실행해 기준 상태를 baseline에 기록한다(소스를 바꾸지 않으므로 회귀 확인이 아니라 기준 기록이다).
3. 개선 스펙 §8 형식으로 보고하고 Gate A 승인을 요청한다. 단계 상태는 `승인대기`로 적는다.

## 5. 커밋 단위

1. 스펙 문서와 기존 블록도 추가
2. 이 설계 문서
3. 스킬 설치 파일
4. `00-baseline.md`
5. 블록도 산출물
6. 캡처
7. `01-diagnosis.md`

## 6. 하지 않는 것

- `app/`, `src/` 수정. 캡처를 쉽게 하려는 임시 코드도 넣지 않는다.
- 단계 2 이후 산출물(역할 표, 토큰 안, 공용 `Button`·`Chip` 설계).
- 새 팔레트, 글자 크기, 치수의 확정.
- 의존성 추가, `react-native-paper` 재도입, dark mode.
- push, PR, 배포.

## 7. 위험과 대응

| 위험 | 대응 |
|---|---|
| iPad가 계속 오프라인이거나 dev client가 없다 | 블록도와 코드 기반 진단을 먼저 끝내고 캡처 항목은 `blocked`로 둔다. Gate A는 캡처가 채워진 뒤에 요청한다 |
| 스킬 설치가 현재 세션에 노출되지 않는다 | baseline에 사실대로 적는다. 이번 사이클은 `impeccable`만 쓰므로 진행에는 영향이 없다 |
| 에이전트가 이끄는 화면은 서버 instruction이 있어야 뜬다 | 테스트 계정에서 재현 가능한 흐름만 찍고, 재현하지 못한 화면은 사유를 남긴다 |
| 기존 블록도가 study-note 변경 이전 내용이다 | 4.3의 대조 절차로 갱신한다 |
