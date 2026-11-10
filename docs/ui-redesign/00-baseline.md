# 단계 0 — Baseline

## 1. 기준

| 항목 | 값 |
|---|---|
| 프로젝트 루트 | `go3math-study-agent-app` |
| 기준 브랜치/커밋 | `feat/study-note` @ `76b99e3` |
| 작업 브랜치 | `design/ui-redesign` (push·PR 없음) |
| 작성일 | 2026-11-10 (KST) |
| 스택 | Expo SDK `~54.0.36`, React Native `0.81.5`, expo-router `~6.0.24` |

## 2. 스킬

| 스킬 | 설치 | 이번 세션 노출 | 경로 |
|---|---|---|---|
| `impeccable` | 설치됨(사용자 전역) | 노출됨 | `~/.claude/skills/impeccable` |
| `expo-design-system` | 설치됨(2026-11-10, 커밋 `5badaa6`) | 노출됨(설치 직후 같은 세션에서 확인) | `.claude/skills/expo-design-system` |
| `vercel-react-native-skills` | 설치됨(2026-11-10, 커밋 `5badaa6`) | 노출됨(위와 같음) | `.claude/skills/vercel-react-native-skills` |
| `expo-native-ui`, `expo-router`, `expo-overview` (조건부) | 미설치 | — | 필요해질 때 설치 |
| `ui-ux-pro-max` (선택) | 설치됨(플러그인) | 노출됨 | 이번 사이클에서는 쓰지 않음 |

- 설치 명령: `npx skills@latest add expo/skills --skill expo-design-system -a claude-code -y`, `npx skills@latest add vercel-labs/agent-skills --skill vercel-react-native-skills -a claude-code -y`. 설치로 `skills-lock.json`이 생겼다.
- 단계 0→1이 실제로 쓰는 스킬은 `impeccable`뿐이다. 나머지 둘은 단계 3 진입 전에 노출을 다시 확인한다.
- `impeccable init`은 실행하지 않았다. `PRODUCT.md`와 `DESIGN.md`가 이미 있다(커밋 `4bc70e7`).

## 3. 명령

`package.json`에 실제로 있는 스크립트와 기준 커밋에서의 결과다.

| 스크립트 | 명령 | 기준 결과 |
|---|---|---|
| `lint` | `expo lint` | **실패(exit 1)** — 153건(오류 2, 경고 151). 오류 2건은 `src/kit/canvas/CanvasChrome.tsx:116`의 `react/no-unescaped-entities` |
| `typecheck` | `tsc --noEmit` | 통과(exit 0) |
| `test` | `jest` | 이번 단계에서 실행하지 않음 |
| `test:e2e` | `maestro test .maestro` | 이번 단계에서 실행하지 않음 |
| `doctor` | `expo-doctor` | 이번 단계에서 실행하지 않음 |
| build | 없음 | 빌드는 EAS 또는 `expo run:ios|android` |

lint 오류는 이번 작업 이전부터 있던 것이며 고치지 않았다(소스 미변경).

## 4. 보존 제약

| 제약 | 현재 코드 상태 | 근거 |
|---|---|---|
| Pretendard 유지 | 400/600/700 세 굵기를 `useFonts`로 불러오고 `theme.fontFamily`가 같은 키를 쓴다 | `app/_layout.tsx:23-25`, `src/ui/theme.ts:74-79` |
| `react-native-paper` 재도입 금지 | 의존성과 import에 없다. 주석에서만 언급된다 | `package.json`(검색 결과 없음), `src/ui/Sheet.tsx:6` |
| Tablet 판정 `min(w,h) ≥ 600` | 진입 600, 이탈 560, 디바운스 200ms. 560~599는 직전 모드를 유지한다 | `src/layout/deviceMode.ts:8-10`, `:13`, `:18` |
| 하단 6칸 | 6칸 정의(공지·검색·타임라인·실황 수업·주간 공부·내 정보, 실황 수업과 주간 공부는 `disabled: true`)는 `DrawerFooter.tsx`에 있지만 **그 컴포넌트는 화면에 렌더되지 않는다**(타입만 쓰임). 실제 태블릿 내비는 세로 pill 툴바로, 타임라인·Diary·검색·실황 수업·내 정보 5개와 채팅 버튼이다. 주간 공부는 없고 실황 수업은 켜져 있다 | `src/agent/tablet/DrawerFooter.tsx:12-17`(정의), `src/agent/tablet/ChatRail.tsx:11-17`(실제 내비) |
| Dark mode 제외 | `userInterfaceStyle: 'light'` | `app.config.ts:32` |
| Landscape 제한 목록 미정 | `LANDSCAPE_RESTRICTED`가 빈 Set이고 "사용자 결정 대기" 주석이 있다. 앱 전역 방향 고정은 없다 | `src/kit/canvas/landscapeRestrictions.ts:3-4`, `app.config.ts:34` |
| RN StyleSheet + 토큰 | `src/ui/theme.ts` 토큰. NativeWind/Tamagui 없음 | `package.json`(검색 결과 없음) |

참고: 폰의 하단 탭은 태블릿 6칸과 구성이 다르다(History·검색·Diary·내 정보·Study Log, `app/(main)/_layout.tsx:12`). 이 차이는 단계 1 진단에서 다룬다.

## 5. 참조 문서

| 문서 | 스펙에 적힌 경로 | 실제 경로 |
|---|---|---|
| 개선 스펙 | `specs/qoolla-ui-design-improvement-spec.md` | `docs/design/qoolla-ui-design-improvement-spec.md` |
| 블록도 스펙 | `specs/expo-ui-block-diagram-spec.md` | `docs/expo-ui-block-diagram-spec.md` |
| 기존 디자인 명세 | `specs/design-spec.md` | `specs/design-spec.md` (일치) |
| 제품·디자인 맥락 | — | `PRODUCT.md`, `DESIGN.md` |

## 6. 과거 개선 패스

`docs/design/`에 이전 패스의 iPad 11 세로 캡처가 있다: `before/`(3장), `after-P1/`, `after-P2/`, `after-P3/`, `after-rail/`. `specs/design-spec.md`의 P1~P3 구현 흔적이며, 이번 진단은 그 결과가 반영된 현재 코드를 대상으로 한다.

## 7. 빌드 환경 메모

- `expo run:ios`는 이 Mac에서 Simulator 앱을 찾지 못해 실패한다. 캡처용 빌드는 `xcodebuild`를 직접 썼다.
- 설치된 Xcode의 시뮬레이터 SDK는 최소 iOS 15.0 미만 Pod를 거부한다. 빌드 명령에서만 `IPHONEOS_DEPLOYMENT_TARGET=15.1`로 덮어썼고 파일은 바꾸지 않았다.
- iOS 27.2 런타임에서는 앱이 실행 직후 종료된다(UIScene 수명주기 미채택). 캡처는 iOS 26.4 시뮬레이터로 했다.

## 8. 이 브랜치의 문서 외 커밋

`d0a5d1c fix(ios): adopt the UIScene lifecycle so the app launches on iOS 27`가 이 브랜치에 올라와 있다. `app.config.ts`, `plugins/`, `__tests__/withIosSceneLifecycle.test.ts`를 바꾸는 커밋이며 UI 개선 작업의 산출물이 아니다(다른 작업에서 커밋됨). `app/`, `src/`, `package.json`은 바뀌지 않았다.

## 9. 단계 상태

| 단계 | 상태 |
|---|---|
| 0 환경·스킬·baseline | 완료 |
| 1 현황 진단 | 승인대기 (조건부: 실기기 캡처 없음, 시뮬레이터 26장, 번들 출처 미확인) |
| 2~6 | 미착수 |
