# go3math-study-agent-app 디자인 개선 구현 명세 (design-spec.md)

- 버전: v1.1 (2026-11-02)
- 대상 리포: `/Users/jaesungphi/QoollaWorkspace/go3math-study-agent-app` (Expo SDK 54, RN 0.81.5, React 19.1, expo-router 6)
- 작업자: Claude (코딩 에이전트)
- 근거 문서: `study-agent-app-ui-review.md`(UI 리뷰), `qoolla-agent-led-app-spec.md` §4(에이전트 UX 결정, v0.4.4)
- 변경 이력:
  - v1.0 (2026-11-02): 최초 작성.
  - v1.1 (2026-11-02): §10 열린 질문 5개 결정 반영 — Pretendard 필수(P2), react-native-paper 삭제 승인(P3), 툴바 하단 가운데, 하단 바 6칸(실황 수업·주간 공부 추가), 캔버스 가로 모드 기능 제한 메커니즘(제한 목록은 미정).
- 표기: 줄 번호는 2026-11-02 기준 읽기 전용 확인 값입니다. 작업 시점에 줄이 밀렸다면 **줄 번호가 아니라 인용한 코드 조각으로 위치를 찾으세요.**

---

## 0. 요약

"주황 테두리로 칸막이를 친 화면"을 "옅은 회색 바닥 위에 떠 있는 흰 카드" 구조로 바꿉니다. 색·간격·반경·글자·그림자·모션을 `src/ui/theme.ts` 한 파일의 토큰으로 모으고, 옮겨 온 캔버스의 이질적인 UI(react-native-paper 모달, 주황 FAB, 별도 재생 툴바)를 하나의 `FloatingToolbar`(하단 가운데)로 통합합니다. 동작·프로토콜·데이터는 바꾸지 않습니다.

**사용자 결정(2026-11-02, 확정)**: ① Pretendard 폰트 도입(P2 필수, expo-font, 400/600/700만 번들) ② `react-native-paper` 삭제(P3, 사용처 7개 교체 후) ③ 캔버스 툴바는 하단 가운데 ④ 하단 고정 바 6칸: 공지·검색·타임라인·실황 수업·주간 공부·내 정보 ⑤ 캔버스 화면 가로(폭>높이)에서 기능 제한 — 메커니즘만 구현, **제한할 기능 목록은 사용자 확인 대기**(§10).

---

## 1. 목표 / 비목표 / 제약

### 1.1 목표
1. 디자인 토큰 도입: 모든 신규·수정 스타일은 `theme.ts` 토큰만 사용.
2. 주황 테두리 제거: 주황(brand)은 **행동/선택**(주 버튼, 활성 탭, 읽지 않음 점, 진행 바)에만 사용.
3. Tablet 레이아웃 셸: drawer와 dock을 가장자리에서 12 띄운 흰 카드로 통일, 폭·높이·반경·간격 정렬.
4. 하단 고정 바를 아이콘+라벨 6칸 세그먼트(한 줄)로 경량화.
5. 캔버스 도구(PencilFab, 펜 속성 모달, PlaybackToolbar)를 `FloatingToolbar` 하나로 통합하고 캔버스 공통 스타일 중복 제거.
6. 타이포 5단계 정리 + Pretendard 폰트 적용(필수).
7. 모션을 reanimated 4로 통일하고 감소 모션(reduced motion) 대응.
8. 토스트 구현을 하나로 통합.
9. react-native-paper 의존 제거(코드 + `package.json`).
10. 캔버스 화면 가로 모드 기능 제한 메커니즘(감지·안내·비활성화).

### 1.2 비목표 (하지 않음)
- 비즈니스 로직, 에이전트 프로토콜(`@qoolla/agent-protocol` 타입, WebSocket 메시지), GraphQL 쿼리/구독, 인증, 저장소(MMKV) 키 변경.
- 화면 흐름·instruction 처리 순서·튜터 메시지 우선 규칙 변경.
- 새 기능 추가. 예외: 가로 모드 캔버스 기능 제한 **메커니즘**(P2-5)은 이번 범위. 단, 어떤 기능을 제한할지는 사용자 결정 전까지 임의로 정하지 않음.
- 다크 모드(토큰 구조만 대비, 구현은 안 함).
- 앱 아이콘, 스플래시, 앱 표시 이름, `com.qoolla.student` 식별자 변경.
- **필기 잉크 색상 값 변경**: `strokeColors = ['orange','blue','black','red','green']`과 MMKV `canvasStrokeColor` 저장값은 사용자 데이터·실황 동기화 값이므로 그대로 둡니다(UI 크롬 색만 토큰으로 바꿈).

### 1.3 반드시 지킬 UX 결정 (스펙 §4)
| 항목 | 결정 | 이 작업에서의 의미 |
|---|---|---|
| 모드 판단 | 짧은 변 `min(w,h) >= 600` → Tablet, Tablet에서 `< 560`이 되어야 Phone 복귀(히스테리시스), 200ms 디바운스 | `src/layout/deviceMode.ts`의 판단 로직 **변경 금지**. `drawerWidth()`만 수정 |
| Phone | instruction은 하단 탭 위 **하단 모달**(`PhoneInstructionModal`) | 스타일만 토큰화 |
| Tablet drawer | **왼쪽→오른쪽**으로 열림, 필요할 때만 표시, 캔버스 위에 **겹침(overlay)**, drawer 영역만 터치 받고 **캔버스 필기 입력은 계속** | 카드화해도 overlay·`pointerEvents="box-none"` 구조 유지 |
| drawer 폭 | 화면 폭 30%, 300~400 clamp, 펼친 폴더블은 최대 40% | `drawerWidth()` 변경 |
| Tutor toast | Tablet **오른쪽 상단**, **6.4초** 자동 닫힘, 터치 중 타이머 일시정지, **탭하면 drawer 열림**, 닫힌 뒤 **읽지 않음 점** + 기록 유지, 토스트 중에도 필기 입력 유지 | 통합 토스트가 이 동작을 그대로 보장 |
| 하단 고정 바 | 공지 / 검색 / 타임라인 / 실황 수업 / 주간 공부 / 내 정보, 스크롤해도 고정 | 6칸 한 줄(P1-6). 로그아웃은 '내 정보' dock 안으로 이동(동작은 동일한 핸들러 호출) |
| 화면 방향 | 전역 `orientation` 고정 없음, 캔버스 화면 내부에서 처리. 캔버스 화면이 가로면 기능 제한 | `app.config.ts`에 orientation 추가 금지, `expo-screen-orientation` 도입 금지. 감지는 캔버스 화면 자체 크기(폭>높이)로(P2-5) |
| 캔버스 툴바 | 하단 가운데 | 하단 바·토스트·drawer와 겹치지 않게 배치(P2-1) |
| 브랜드 | 기존 앱 아이콘·브랜드 승계 | 브랜드 주황 계열 유지(톤만 `#F97316` 계열로 정리) |
| 폴더블 | 접고 펼 때 열린 instruction·필기·수업 연결 유지 | 레이아웃 변경이 상태를 리마운트하지 않게 할 것(조건부 렌더 대신 스타일 변경) |

### 1.4 기술 제약
- 스타일: `StyleSheet.create` + 토큰. NativeWind/Tamagui 등 신규 스타일 라이브러리 도입 금지.
- 애니메이션: `react-native-reanimated` 4(이미 설치). RN `Animated`는 이 작업에서 제거 대상.
- 아이콘: 이미 설치된 `@expo/vector-icons`(Ionicons) 또는 `react-native-svg` 사용. 신규 아이콘 패키지 금지.
- 신규 의존성은 **추가 전 사용자 승인 필요**. 승인 완료(2026-11-02): Pretendard 폰트 파일(OFL) 추가 + `expo-font`(이미 설치, 없으면 `npx expo install expo-font`), `react-native-paper` 삭제. 그 외는 여전히 승인 필요.

---

## 2. 현재 상태 (확인된 위치)

| 파일 | 현재 | 문제 |
|---|---|---|
| `src/ui/theme.ts` | `colors` 11개, `agent: 'orange'` | 간격/반경/글자/그림자/모션 토큰 없음 |
| `app/_layout.tsx` L6, L20, L27 | `PaperProvider` 래핑 | paper 제거 대상 |
| `app/(main)/index.tsx` | SafeArea `#FFFFFF` > Stage + Phone/Tablet 레이어 | 바닥이 흰색이라 카드가 안 뜸 |
| `src/host/Stage.tsx` L40 | header `borderBottomWidth: 2, borderBottomColor: colors.agent` | 주황 하단선 |
| `src/host/Stage.tsx` L22, L44 | `'#15803D'`, `'#FEF3C7'` 하드코딩 | 토큰화 |
| `src/agent/TabletAgentLayer.tsx` (311줄) L274-275 | drawer `borderRightWidth: 2, borderRightColor: colors.agent` | 주황 우측선, 풀높이 판 |
| 〃 L286 | footer `borderTopWidth: 1, borderTopColor: colors.agent` | 주황 상단선 |
| 〃 L287 | footerBtn `flexBasis: '45%'`, `#E5E5E5`, 2열 wrap | 무거운 알약 5개 |
| 〃 L265 | unread dot | 유지(토큰화) |
| 〃 | drawer + DrawerFooter + TutorToast 한 파일, RN `Animated` 220ms | 분리 대상 |
| `src/agent/DockWrapper.tsx` L53-57 | 오른쪽만 반경 12, `borderWidth: 1, borderLeftWidth: 0, borderColor: colors.agent`, 높이 80% 세로 가운데, maxWidth 640 | 주황 테두리, drawer와 정렬 불일치 |
| `src/agent/EdgeTab.tsx` L46-50 | 28×112 세로 탭, 주황 테두리 | 레일/헤더 버튼으로 대체 |
| `src/layout/deviceMode.ts` L24-26 | `Math.min(420, Math.max(280, width * 0.36))` | 30% / 300~400으로 |
| `src/kit/canvas/note-canvas/topic-live-canvas.tsx` L655 | paper `Modal` style `backgroundColor:'white', borderWidth:2, borderColor:'orange'` | 팝오버로 대체 |
| 〃 L702, L728 | 캔버스 영역 `padding:3, borderWidth:2, borderColor:'orange', borderRadius:6` | 테두리 제거 |
| 〃 L729 | `ActivityIndicator color="orange"`(paper) | RN `ActivityIndicator` + 토큰 |
| 〃 L745-746, L767, L786 | StyleSheet 내 `borderColor:'orange'`, `backgroundColor:'orange'` | 토큰화 |
| `src/kit/canvas/note-canvas/hotline-class-canvas.tsx` L676, L723, L749, L750, L766-767, L788, L807 | topic-live-canvas와 동일 패턴 | 동일 처리 + 공통 스타일로 |
| `src/kit/ui/PencilFab.tsx` | `#FF8800` 원형 FAB | FloatingToolbar로 흡수 |
| `src/kit/script-player/PlaybackToolbar.tsx` | 별도 재생 툴바 | FloatingToolbar 재생 모드로 흡수 |
| `src/kit/canvas/note-canvas/pencil-props-modal.tsx` | paper Modal | 팝오버로 |
| paper 사용 파일 7개 | `image-adjust-card.tsx`, `topic-notebook.tsx`, `pencil-props-modal.tsx`, `notebook.tsx`, `hotline-class-canvas.tsx`, `topic-live-canvas.tsx`, `app/_layout.tsx` | P3에서 제거 |
| 토스트 | `TabletAgentLayer` 내부 `TutorToast` + `src/kit/ui/toast.tsx` | 하나로 |
| PencilFab/PlaybackToolbar 사용처 | `src/kit/topic-panel/TopicUnitList.tsx`, `src/kit/problem-list/ProblemListPanel.tsx` 등 | 교체 시 함께 수정 |

하드코딩 규모(대략): hex 141, rgba 12, fontSize 80(9종), borderRadius 62(19종), padding/margin 숫자 205, shadow/elevation 44, 주황 계열 8종 이상.

---

## 3. 디자인 원칙
1. **바닥과 카드 두 층**: 앱 바닥 `colors.bg`(#F7F7F8), 그 위 흰 카드(`colors.card`) + 그림자. 구분은 선이 아니라 배경 대비와 그림자로.
2. **주황은 행동에만**: 테두리·제목 글자에 주황 금지. 허용: 주 버튼, 활성 상태 글자/아이콘, 읽지 않음 점, 토스트 진행 바, 포커스 링.
3. **값은 토큰에서만**: 간격 4의 배수(`space`), 반경 3종+pill, 글자 5단계, 그림자 2종, 모션 3속도.
4. **캔버스가 주인공**: 보조 UI는 접히고 떠 있음.
5. **하나의 움직임**: 모든 등장·이동은 같은 spring/duration.

---

## 4. 토큰 파일 — `src/ui/theme.ts` (전체 교체)

기존 키(`text, muted, border, line, surface, ground, agent, agentText, agentSoft, tutor, unread`)는 **하위호환으로 유지**해 import하는 8개 파일이 깨지지 않게 합니다. 단, `agent`는 `'orange'` 키워드에서 hex로 바뀝니다.

```ts
// src/ui/theme.ts
// Qoolla 학습 앱 디자인 토큰. 신규/수정 스타일은 반드시 이 파일의 값만 사용한다.
import { Platform, type TextStyle, type ViewStyle } from 'react-native';

export const palette = {
  gray: {
    0: '#FFFFFF',
    25: '#FCFCFD',
    50: '#F7F7F8',
    100: '#EFEFF1',
    200: '#E4E4E7',
    300: '#D4D4D8',
    400: '#A1A1AA',
    500: '#71717A',
    600: '#52525B',
    700: '#3F3F46',
    900: '#18181B',
  },
  brand: {
    50: '#FFF7ED',
    100: '#FFEDD5',
    200: '#FED7AA',
    500: '#F97316',
    600: '#EA580C',
    700: '#C2410C',
  },
  success: { 50: '#F0FDF4', 600: '#16A34A', 700: '#15803D' },
  danger: { 50: '#FEF2F2', 600: '#DC2626' },
  warn: { 50: '#FFFBEB', 100: '#FEF3C7', 500: '#F59E0B' },
} as const;

export const colors = {
  // 표면
  bg: palette.gray[50],          // 앱 바닥
  card: palette.gray[0],         // 카드/패널/툴바
  cardMuted: palette.gray[100],  // 카드 안 보조 면(세그먼트 바탕, 튜터 말풍선)
  scrim: 'rgba(24,24,27,0.32)',  // Phone 모달 뒤 딤
  // 글자
  text: palette.gray[900],
  subtle: palette.gray[700],
  muted: palette.gray[500],
  disabled: palette.gray[400],
  onAccent: palette.gray[0],
  // 선(필요할 때만, 1px)
  line: palette.gray[200],
  lineStrong: palette.gray[300],
  // 브랜드
  accent: palette.brand[500],
  accentPress: palette.brand[600],
  accentText: palette.brand[700],
  accentSoft: palette.brand[50],
  accentSoftPress: palette.brand[100],
  // 상태
  unread: palette.brand[600],
  online: palette.success[600],
  offline: palette.gray[400],
  success: palette.success[600],
  danger: palette.danger[600],
  warnSoft: palette.warn[100],
  // 하위호환 (기존 import 유지용 — 신규 코드에서 사용 금지)
  surface: palette.gray[0],
  ground: palette.gray[50],
  border: palette.gray[400],
  agent: palette.brand[500],
  agentText: palette.brand[700],
  agentSoft: palette.brand[50],
  tutor: palette.gray[900],
} as const;

export const space = { none: 0, xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radius = { sm: 8, md: 12, lg: 20, pill: 999 } as const;

/** Pretendard(SIL OFL 1.1). 번들 굵기: 400/600/700만. 이름은 app/_layout.tsx useFonts 키와 일치해야 함(P2-3).
 *  Android는 fontWeight로 굵기를 고르지 못하므로 굵기별 family를 직접 지정한다.
 *  폰트 로드 실패 시에도 앱은 시스템 폰트로 동작(RN이 미등록 family를 시스템으로 폴백). */
export const fontFamily = {
  regular: 'Pretendard-Regular',   // 400
  semibold: 'Pretendard-SemiBold', // 600
  bold: 'Pretendard-Bold',         // 700
} as const;
// 500(Medium)은 번들하지 않음 → caption은 regular 사용

export const type = {
  caption: { fontSize: 12, lineHeight: 16, fontFamily: fontFamily.regular, fontWeight: '400' },
  body: { fontSize: 14, lineHeight: 20, fontFamily: fontFamily.regular, fontWeight: '400' },
  bodyStrong: { fontSize: 14, lineHeight: 20, fontFamily: fontFamily.semibold, fontWeight: '600' },
  title: { fontSize: 16, lineHeight: 22, fontFamily: fontFamily.semibold, fontWeight: '600' },
  heading: { fontSize: 20, lineHeight: 28, fontFamily: fontFamily.bold, fontWeight: '700' },
  // 하단 바 라벨 전용(P1-6). 11pt, 한 줄
  tabLabel: { fontSize: 11, lineHeight: 14, fontFamily: fontFamily.semibold, fontWeight: '600' },
} as const satisfies Record<string, TextStyle>;

export const shadow = {
  none: {},
  card: Platform.select<ViewStyle>({
    ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
    default: { elevation: 3, shadowColor: '#000' },
  })!,
  float: Platform.select<ViewStyle>({
    ios: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 24, shadowOffset: { width: 0, height: 8 } },
    default: { elevation: 8, shadowColor: '#000' },
  })!,
} as const;

export const motion = {
  fast: 150,
  base: 220,
  slow: 320,
  dockDelay: 60,
  toastMs: 6400, // 스펙 §4.6 결정값 — 변경 금지
  spring: { damping: 22, stiffness: 240, mass: 1 },
} as const;

export const layout = {
  gutter: 12,        // 화면 가장자리·카드 간 간격
  chatRatio: 0.3,    // drawer 폭 비율 (스펙 §4)
  chatMin: 300,
  chatMax: 400,
  chatRail: 64,      // 접힌 레일 폭
  foldMaxRatio: 0.4, // 펼친 폴더블 drawer 상한
  dockMax: 560,
  headerH: 56,
  footerH: 56,
  footerIcon: 22,    // 하단 바 아이콘
  footerItems: 6,    // 공지·검색·타임라인·실황 수업·주간 공부·내 정보
  toolbarH: 52,
  toolbarGap: 16,    // 툴바와 하단 바/drawer/토스트 사이 최소 간격
  hit: 44,           // 최소 터치 영역
  toastW: 360,
} as const;

export const z = { canvas: 0, dock: 10, drawer: 20, toolbar: 30, toast: 40, modal: 50 } as const;

export const theme = { palette, colors, space, radius, type, shadow, motion, layout, z, fontFamily };
export type Theme = typeof theme;
```

**수용 기준(P0 토큰)**
- `yarn typecheck` 통과, 기존 `colors.*` import 8개 파일 무수정으로 컴파일.
- 앱 실행 시 시각 변화는 `colors.agent`가 `'orange'`(#FFA500) → `#F97316`로 바뀐 것뿐. (P0 시점엔 폰트 파일이 아직 없으므로 `fontFamily`는 시스템 폰트로 폴백되어 보임 — 정상. 실제 로드는 P2-3.)

---

## 5. 단계별 작업

각 단계 = 커밋 1개(§8). 단계마다 §7 검증을 돌린 뒤 다음 단계로 넘어갑니다.

### P0. 토큰 도입 + 주황 테두리 제거

**P0-1. `src/ui/theme.ts`** — §4 코드로 교체.

**P0-2. 주황 테두리 제거 (정확한 위치)**

| 파일 | 위치 | 변경 |
|---|---|---|
| `src/host/Stage.tsx` | L40 `header` | `borderBottomWidth: 2, borderBottomColor: colors.agent` 삭제. `backgroundColor: 'transparent'`, `height: layout.headerH`, `paddingHorizontal: space.md`, `gap: space.xs` |
| `src/host/Stage.tsx` | L22 | `'#15803D'` → `colors.online`, `colors.border` → `colors.offline` |
| `src/host/Stage.tsx` | L44 `fallback` | `margin/padding: space.md`, `borderRadius: radius.sm`, `'#FEF3C7'` → `colors.warnSoft`, `fontSize:14` → `...type.body` |
| `src/agent/TabletAgentLayer.tsx` | L274-275 `drawer` | `borderRightWidth`, `borderRightColor` 삭제(P1에서 카드화) |
| 〃 | L286 `footer` | `borderTopWidth: 1, borderTopColor: colors.agent` 삭제 |
| 〃 | L290 `history` | `borderTopColor: colors.line` 유지 가능(회색 1px은 허용) |
| `src/agent/DockWrapper.tsx` | L55-57 | `borderWidth`, `borderLeftWidth`, `borderColor` 삭제 |
| `src/agent/EdgeTab.tsx` | L48-50 | 동일 삭제(P1에서 파일 자체 대체) |
| `topic-live-canvas.tsx` | L702, L728 | 인라인 `padding: 3, borderWidth: 2, borderColor: 'orange', borderRadius: 6` → `canvasStyles.frame`(P2-3)로. P0에서는 `borderWidth: 0, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.card` |
| 〃 | L745-746 | StyleSheet 항목의 `borderWidth: 2, borderColor: 'orange'` 삭제 |
| 〃 | L767, L786 | `backgroundColor: 'orange'` → `colors.accent` (UI 크롬인 경우만. 잉크 미리보기면 그대로) |
| 〃 | L729 | `color="orange"` → `color={colors.accent}` |
| `hotline-class-canvas.tsx` | L723, L749, L750, L766-767, L788, L807 | topic-live-canvas와 동일 |
| 〃 / topic-live | L655 / L676 paper Modal style | P0: `borderWidth:2, borderColor:'orange'` 삭제, `'white'` → `colors.card`, `borderRadius: radius.lg`, `...shadow.float`. (P2에서 팝오버로 교체) |

**절대 바꾸지 않을 것**: `strokeColors` 배열(L50/L51), `useState('orange')`(L74/L76), `|| 'orange'` 기본값(L427, L557, L631 / L435, L579, L652), L542/L564의 굵기 미리보기 색 `'orange'`(잉크색 의미).

**P0-3. 하드코딩 검색 명령**(작업 전후 개수 기록)
```bash
rg -n "borderColor: *(colors\.agent|'orange'|\"orange\")" src app
rg -n "#[0-9A-Fa-f]{3,8}\b" src app --glob '!src/ui/theme.ts' | wc -l
rg -n "'(white|orange|black)'" src app | wc -l
```

**수용 기준**
- `rg -n "border(Top|Bottom|Left|Right)?Color: *(colors\.agent|'orange')" src app` 결과 0건.
- 캔버스 필기·실황 동기화·잉크 색 선택 동작 동일(기존 MMKV 값 `'orange'` 사용자도 정상).

---

### P1. 레이아웃 셸 + 하단 고정 바

**P1-1. 바닥색** — `app/(main)/index.tsx`
- SafeArea `backgroundColor: '#FFFFFF'` → `colors.bg`.
- Stage 콘텐츠(캔버스 카드)는 `colors.card` 유지. Phone/Tablet 분기 구조와 `deviceMode` 훅 사용은 그대로.

**P1-2. drawer 폭** — `src/layout/deviceMode.ts` L24-26 (판단 로직 600/560/200ms는 건드리지 않음)
```ts
import { layout } from '@/ui/theme'; // 기존 alias 규칙에 맞출 것

/** drawer 폭: 화면 폭 30%(300~400), 펼친 폴더블(거의 정사각형)은 최대 40% — 스펙 §4.7 */
export function drawerWidth(width: number, height: number): number {
  const base = Math.min(layout.chatMax, Math.max(layout.chatMin, width * layout.chatRatio));
  const nearSquare = Math.max(width, height) / Math.min(width, height) < 1.3;
  return nearSquare ? Math.min(base, width * layout.foldMaxRatio) : base;
}
```
- 기존 `FOLD_DRAWER_MAX_RATIO` 상수가 있으면 `layout.foldMaxRatio`를 참조하도록 하고, 기존 nearSquare 판정식이 다르면 **기존 판정식을 유지**하세요.
- 관련 단위 테스트가 있으면 기대값(36%, 280/420)을 30%, 300/400으로 갱신.

**P1-3. TabletAgentLayer 분리** (동작 무변경, 파일 이동만 + 스타일)
```
src/agent/tablet/
  TabletAgentLayer.tsx   // 조립: 상태(open/collapsed/unread)·이벤트 핸들러는 기존 코드 그대로 이동
  AgentDrawer.tsx        // 카드 drawer (헤더 + 스크롤 채팅 + DrawerFooter)
  ChatRail.tsx           // 접힌 64px 레일
  DrawerFooter.tsx       // 하단 고정 바 (P1-5)
  (TutorToast는 P3에서 src/ui/toast로 통합; P1에서는 tablet/TutorToast.tsx로 이동만)
```
- 기존 `src/agent/TabletAgentLayer.tsx`는 새 위치를 re-export하는 1줄 파일로 남기거나 import 경로를 모두 갱신(둘 중 하나, 커밋 메시지에 명시).

**P1-4. 카드 drawer + dock + 레일**

상태: `open`(drawer 펼침), `collapsed`(레일만 표시), `closed`(아무것도 없음, 기존 "필요할 때만" 동작). 기존 open/close 트리거(instruction 도착, 토스트 탭, 닫기)는 그대로 두고, 기존 EdgeTab `'>'` 동작(다시 열기)은 레일 탭으로, `'<'`(닫기)는 drawer 헤더의 접기 버튼으로 연결합니다. 레일은 **기존에 EdgeTab이 보이던 조건에서만** 보입니다.

```tsx
// src/agent/tablet/AgentDrawer.tsx (스타일 스케치)
const s = StyleSheet.create({
  drawer: {
    position: 'absolute',
    left: layout.gutter, top: layout.gutter, bottom: layout.gutter,
    // width는 drawerWidth(w,h) — 인라인으로 주입
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingTop: space.lg, paddingHorizontal: space.lg, paddingBottom: space.md,
    gap: space.md,
    zIndex: z.drawer,
    ...shadow.float,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: layout.hit },
  title: { ...type.title, color: colors.text, flex: 1 },   // 기존 13px bold 주황 제목 대체
  iconBtn: { width: layout.hit, height: layout.hit, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
});
```
- 오버레이 유지: 루트 컨테이너 `pointerEvents="box-none"`, drawer 카드만 터치 수신. **캔버스 필기는 drawer 바깥에서 계속 동작**해야 함.
- 헤더 오른쪽: 접기 아이콘(`Ionicons chevron-back`, 20, `colors.muted`), `accessibilityLabel="채팅 접기"`.

```tsx
// src/agent/tablet/ChatRail.tsx
const s = StyleSheet.create({
  rail: {
    position: 'absolute', left: layout.gutter, top: layout.gutter, bottom: layout.gutter,
    width: layout.chatRail, backgroundColor: colors.card, borderRadius: radius.lg,
    alignItems: 'center', paddingVertical: space.md, gap: space.sm, zIndex: z.drawer, ...shadow.float,
  },
  avatar: { width: 40, height: 40, borderRadius: radius.pill, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  dot: { position: 'absolute', top: space.xs, right: space.xs, width: 10, height: 10, borderRadius: radius.pill, backgroundColor: colors.unread, borderWidth: 2, borderColor: colors.card },
});
// 구성: 상단 에이전트 아바타(탭 → drawer 열기, unread 점) / 가운데 비움 / 하단 6개 아이콘(공지·검색·타임라인·실황 수업·주간 공부·내 정보, 22pt, 세로 간격 space.xs, 탭 → drawer 열고 해당 항목 실행 = 하단 바 버튼과 같은 핸들러, 라벨 없음·accessibilityLabel만)
```
- 레일 접근성: 각 버튼 `accessibilityRole="button"`, 라벨 한국어.

```tsx
// src/agent/DockWrapper.tsx
// left = gutter + (drawer 열림 ? drawerW : chatRail) + gutter
const s = StyleSheet.create({
  dock: {
    position: 'absolute', top: layout.gutter, bottom: layout.gutter,   // 기존 height 80% + 세로 가운데 제거
    maxWidth: layout.dockMax,                                          // 640 → 560
    backgroundColor: colors.card, borderRadius: radius.lg,              // 4모서리 동일 반경
    overflow: 'hidden', zIndex: z.dock, ...shadow.float,
  },
  header: { height: layout.headerH, flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.lg, gap: space.sm },
  title: { ...type.title, color: colors.text, flex: 1 },
  content: { flex: 1 },   // borderBottomRightRadius: 11 제거
});
```
- dock 헤더 오른쪽에 닫기 버튼(`Ionicons close`) — 기존 dock 닫기 핸들러 연결(기존 EdgeTab `'<'`가 dock을 닫던 경우).
- dock 폭: `Math.min(layout.dockMax, screenW - left - layout.gutter)`.

**P1-5. `src/agent/EdgeTab.tsx`** — 사용처를 레일/헤더 버튼으로 교체 후 파일 삭제. `rg -n "EdgeTab" src app` 0건.

**P1-6. 하단 고정 바** — `DrawerFooter.tsx`

현재: 버튼 5개(로그아웃 포함) 2열 wrap 알약 `#E5E5E5`, 활성 시 주황 배경. 변경: **6칸 한 줄 세그먼트**(공지·검색·타임라인·실황 수업·주간 공부·내 정보).

**레이아웃 규칙(최소 drawer 폭 300 기준으로 검증)**
- 바는 drawer 카드 좌우 padding(16)을 상쇄해 넓게 씀: `marginHorizontal: -space.sm` → 바 폭 = 300 − 2×16 + 2×8 = **284**.
- 바 padding `space.xxs`(2), 칸 사이 gap **0**(활성 표시는 흰 pill 배경이 담당) → 칸 폭 = (284 − 4) / 6 ≈ **46.7** ≥ 44(최소 터치 영역).
- 칸: `flex: 1, minWidth: 0`, 세로 배치 아이콘 **22** + 라벨, 높이 `layout.footerH − space.sm`(48).
- 라벨: `type.tabLabel`(11pt, SemiBold), `numberOfLines={1}`, `ellipsizeMode="clip"`, `maxFontSizeMultiplier={1.2}`(큰 글씨에서 줄바꿈 방지; 아이콘은 확대 안 됨).
- **라벨 자르기 규칙**: 화면에는 짧은 라벨(`short`), 스크린리더에는 전체 라벨(`label`).
  - 짧은 라벨은 최대 4음절: 공지 / 검색 / 타임라인 / 실황 / 주간 / 내 정보.
  - 칸 폭이 56 이상(drawer ≥ 약 356)이면 전체 라벨 표시: 공지 / 검색 / 타임라인 / 실황 수업 / 주간 공부 / 내 정보. 판정은 바 `onLayout` 폭으로 `(barW - 4) / 6 >= 56`.
  - 그래도 넘치면 말줄임(…) 대신 잘림(clip) — 단, 위 두 라벨 세트는 11pt Pretendard에서 넘치지 않아야 하며 iPad·Fold 스크린샷으로 확인(§7.4).
  - 라벨 문자열을 임의로 바꾸지 말 것. 기존 kind 문자열·핸들러 이름이 다르면 기존 값을 사용.

```tsx
type FooterKind = 'notice' | 'search' | 'timeline' | 'liveClass' | 'weeklyStudy' | 'profile'; // 기존 kind 문자열이 있으면 기존 값을 사용
const ITEMS: { kind: FooterKind; label: string; short: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { kind: 'notice',      label: '공지',      short: '공지',     icon: 'megaphone-outline' },
  { kind: 'search',      label: '검색',      short: '검색',     icon: 'search-outline' },
  { kind: 'timeline',    label: '타임라인',  short: '타임라인', icon: 'time-outline' },
  { kind: 'liveClass',   label: '실황 수업', short: '실황',     icon: 'radio-outline' },
  { kind: 'weeklyStudy', label: '주간 공부', short: '주간',     icon: 'calendar-outline' },
  { kind: 'profile',     label: '내 정보',   short: '내 정보',  icon: 'person-circle-outline' },
];
const FULL_LABEL_MIN_SEG = 56;

export function DrawerFooter({ active, onPress }: { active?: FooterKind; onPress: (k: FooterKind) => void }) {
  const [barW, setBarW] = useState(0);
  const segW = barW ? (barW - space.xxs * 2) / ITEMS.length : 0;
  const full = segW >= FULL_LABEL_MIN_SEG;
  return (
    <View style={s.bar} accessibilityRole="tablist" onLayout={(e) => setBarW(e.nativeEvent.layout.width)}>
      {ITEMS.map((it) => {
        const on = active === it.kind;
        const tint = on ? colors.accentText : colors.muted;
        return (
          <Pressable key={it.kind} onPress={() => onPress(it.kind)}
            accessibilityRole="tab" accessibilityState={{ selected: on }} accessibilityLabel={it.label}
            hitSlop={{ top: space.xs, bottom: space.xs }}
            style={({ pressed }) => [s.seg, on && s.segOn, pressed && !on && s.segPressed]}>
            <Ionicons name={it.icon} size={layout.footerIcon} color={tint} />
            <Text style={[s.label, { color: tint }]} numberOfLines={1} ellipsizeMode="clip" maxFontSizeMultiplier={1.2}>
              {full ? it.label : it.short}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
const s = StyleSheet.create({
  bar: { flexDirection: 'row', marginHorizontal: -space.sm, backgroundColor: colors.cardMuted, borderRadius: radius.md, padding: space.xxs, gap: 0 },
  seg: { flex: 1, minWidth: 0, minHeight: layout.footerH - space.sm, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', gap: space.xxs, paddingHorizontal: space.xxs },
  segOn: { backgroundColor: colors.card, ...shadow.card },
  segPressed: { backgroundColor: colors.accentSoftPress },
  label: { ...type.tabLabel, textAlign: 'center' },
});
```
- 아이콘 이름은 Ionicons에 실재하는지 typecheck로 확인(없으면 가까운 outline 아이콘으로 대체하고 보고).
- 위치: drawer 카드 안 맨 아래, ScrollView **바깥**(스크롤해도 고정 — 기존 구조 유지).
- **로그아웃**: 하단 바에서 제거하고 '내 정보' dock 화면 하단에 `텍스트 버튼(type.bodyStrong, colors.danger)`으로 이동. 기존 로그아웃 핸들러를 **그대로** 호출(확인 다이얼로그 유무 등 동작 동일). 내 정보 화면 파일 위치를 찾지 못하면 작업 중단하고 사용자에게 물을 것.
- **실황 수업·주간 공부(신규 칸)**: 탭 시 다른 칸과 같은 방식으로 drawer 채팅 영역/dock에 해당 위젯 카드를 표시. 에이전트가 보내던 기존 실황 수업 정보·주간 공부 내용 카드 컴포넌트와 데이터 조회를 **재사용**(새 쿼리·프로토콜 추가 금지). 기존 하단 바 핸들러가 kind별 분기 구조면 같은 분기에 추가. 재사용할 컴포넌트·데이터 경로를 찾지 못하면 멈추고 질문.

**P1-7. Phone** — `PhoneInstructionModal.tsx`, `InstructionCard.tsx`
- 모달 시트: `backgroundColor: colors.card, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: space.lg, ...shadow.float`, 딤 `colors.scrim`. 핸들 바 36×4 `colors.lineStrong`.
- InstructionCard: `backgroundColor: colors.card, borderRadius: radius.md, padding: space.lg, gap: space.sm`, 테두리 없음(카드 위 카드면 `colors.cardMuted` 배경). 주 행동 버튼 `colors.accent` 배경 + `colors.onAccent` 글자 `type.bodyStrong`, 높이 44, `radius.md`. 보조 버튼 `colors.cardMuted` + `colors.text`.
- 하단 탭 위 위치·열림 조건은 그대로.

**P1 수용 기준**
- Tablet 가로(예: 1194×834): drawer 폭 = clamp(358, 300, 400) = 358, 좌·상·하 12 여백, 모서리 20, 그림자.
- Tablet 세로(834×1194): 폭 300(=clamp(250.2)).
- 펼친 폴더블(약 884×1104, 비율 1.25<1.3): base=clamp(265.2,300,400)=300, 40% 상한 353.6 → 300.
- dock 상하가 drawer와 정확히 같은 높이로 정렬, 간격 12.
- 접기 → 64 레일, 레일에서 unread 점 표시, 레일 탭 → drawer 열림.
- drawer/dock/레일 바깥 캔버스에서 펜 필기 가능(drawer 열린 상태 포함).
- 하단 바 6칸이 drawer 폭 300에서 한 줄(줄바꿈·겹침 없음), 칸 폭 ≥ 44, 짧은 라벨 표시. drawer 폭 400에서는 전체 라벨. 로그아웃은 내 정보 안에서 동작.
- 레일에도 6개 아이콘.

---

### P2. 캔버스 통합 + 타이포그래피

**P2-1. `src/kit/canvas/FloatingToolbar.tsx` (신규)**

PencilFab(펜 속성 열기), pencil-props-modal(색·굵기), PlaybackToolbar(재생/이전/다음/구간)를 하나의 떠 있는 pill로 통합. **콜백은 기존 컴포넌트가 받던 props를 그대로 받아 같은 함수를 호출**합니다.

```tsx
// src/kit/canvas/FloatingToolbar.tsx
import Animated, { FadeInDown, FadeOutDown, useReducedMotion } from 'react-native-reanimated';

export type ToolId = 'pen' | 'highlighter' | 'eraser' | 'color' | 'undo' | 'redo' | 'more';
export type FloatingToolbarProps = {
  mode: 'draw' | 'playback';
  // draw — 기존 캔버스에 있는 도구만 노출(없는 도구는 생략, 신규 기능 금지)
  tools: { id: ToolId; icon: React.ReactNode; label: string; disabled?: boolean }[];
  activeTool?: ToolId;
  onSelectTool: (id: ToolId) => void;
  strokeColor: string;             // 잉크 색(데이터 값 그대로, 'orange' 포함)
  // playback — PlaybackToolbar의 기존 props를 그대로 전달
  playback?: React.ComponentProps<typeof PlaybackControls>;
  onToggleMode?: () => void;       // 둘 다 가능한 화면에서만
  // 배치(P2-1 배치 규칙): 툴바가 피해야 할 영역
  insets: { left: number; right: number; bottom: number }; // drawer/레일 폭, 하단 탭·홈 인디케이터 등
  restricted?: ReadonlySet<ToolId>; // 가로 모드 제한(P2-5) — 비활성(숨김 아님)
};

export function FloatingToolbar(p: FloatingToolbarProps) {
  const reduce = useReducedMotion();
  return (
    <Animated.View
      entering={reduce ? undefined : FadeInDown.duration(motion.base)}
      exiting={reduce ? undefined : FadeOutDown.duration(motion.fast)}
      // 하단 가운데: 피할 영역을 뺀 '보이는 캔버스'의 가운데에 놓는다
      style={[s.wrap, { left: p.insets.left, right: p.insets.right, bottom: p.insets.bottom + layout.toolbarGap }]}
      pointerEvents="box-none">
      <View style={s.bar}>
      {p.mode === 'draw' ? (
        <>
          {p.tools.map((t) => {
            const off = t.disabled || p.restricted?.has(t.id);
            return (
            <Pressable key={t.id} onPress={() => p.onSelectTool(t.id)} disabled={off}
              accessibilityRole="button" accessibilityLabel={t.label}
              accessibilityHint={p.restricted?.has(t.id) ? '가로 화면에서는 사용할 수 없습니다' : undefined}
              accessibilityState={{ selected: p.activeTool === t.id, disabled: off }}
              style={[s.btn, p.activeTool === t.id && s.btnOn, off && s.btnOff]}>
              {t.id === 'color' ? <View style={[s.swatch, { backgroundColor: p.strokeColor }]} /> : t.icon}
            </Pressable>
            );
          })}
        </>
      ) : (
        p.playback && <PlaybackControls {...p.playback} />
      )}
      {p.onToggleMode && (<><View style={s.divider} /><Pressable style={s.btn} onPress={p.onToggleMode} accessibilityLabel="모드 전환">…</Pressable></>)}
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap: { position: 'absolute', alignItems: 'center', zIndex: z.toolbar }, // left/right/bottom은 인라인
  bar: {
    height: layout.toolbarH, flexDirection: 'row', alignItems: 'center',
    gap: space.xs, paddingHorizontal: space.sm,
    backgroundColor: colors.card, borderRadius: radius.pill, ...shadow.float,
  },
  btn: { width: layout.hit, height: layout.hit, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  btnOn: { backgroundColor: colors.accentSoft },
  btnOff: { opacity: 0.38 },
  swatch: { width: 22, height: 22, borderRadius: radius.pill, borderWidth: 2, borderColor: colors.card, ...shadow.card },
  divider: { width: 1, height: 24, backgroundColor: colors.line, marginHorizontal: space.xs },
});
```
- `PlaybackControls`: `src/kit/script-player/PlaybackToolbar.tsx`의 버튼 렌더 부분을 컨테이너 스타일 없이 분리한 컴포넌트(같은 파일에서 export). `PlaybackToolbar`는 `FloatingToolbar mode="playback"`을 감싸는 얇은 호환 래퍼로 남겨, 사용처(`TopicUnitList.tsx`, `ProblemListPanel.tsx` 등) 변경을 최소화.
- 색/굵기 선택(기존 pencil-props-modal 내용) → `src/kit/canvas/ToolPopover.tsx`(신규): 툴바 위 `space.sm` 위에 뜨는 카드(`radius.lg`, `shadow.float`, `padding: space.md`). RN `Modal transparent` + 바깥 탭 닫기. 굵기·색 목록과 저장(MMKV `canvasStrokeColor` 등) 로직은 기존 코드를 그대로 옮김.
- `PencilFab.tsx`: 사용처를 FloatingToolbar의 `pen`/`color` 버튼으로 교체 후 삭제. `rg -n "PencilFab" src app` 0건.
- **배치 규칙(결정: 하단 가운데, 위치 옵션 없음 — 기존 `placement='right'` 안은 폐기)**
  - 가로 위치: 보이는 캔버스 영역의 가운데. `insets.left` = Tablet에서 drawer가 열려 있으면 `gutter + drawerW + gutter`, 접혀 레일만 있으면 `gutter + chatRail + gutter`, 닫혀 있으면 0. dock이 캔버스를 덮는 화면이면 `insets.left`에 dock 오른쪽 끝까지 포함. `insets.right` = 0.
  - 세로 위치: `insets.bottom` = SafeArea 하단 + (Phone이면 하단 탭 높이) + `layout.toolbarGap`. Tablet 하단 고정 바는 drawer 카드 **안**에 있으므로 `insets.left`로 이미 피함 — 툴바와 drawer/하단 바는 가로로 겹치지 않아야 함.
  - 토스트(오른쪽 상단)와는 세로로 떨어져 있지만, 짧은 화면(높이 < 500)에서도 툴바 상단이 토스트 하단 + `layout.toolbarGap`보다 아래에 오는지 확인. z 순서는 `z.toolbar(30) < z.toast(40)`.
  - 보이는 캔버스 폭이 툴바 폭보다 좁으면(예: drawer 열림 + 좁은 화면) 툴바를 `ScrollView horizontal`로 감싸 잘리지 않게 하고 drawer 위로 올라가지 않게 함.
  - drawer 열림/닫힘 시 툴바 이동은 drawer와 같은 spring(P3-1), reduce 시 즉시.
- 가로 모드 기능 제한은 `restricted`로 **비활성화**(숨기지 않음) — P2-5.

**P2-2. 캔버스 공통 스타일 중복 제거** — `src/kit/canvas/note-canvas/canvasStyles.ts` (신규)
- `topic-live-canvas.tsx`(StyleSheet ≈ L740-L800)와 `hotline-class-canvas.tsx`(≈ L761-L821)의 거의 동일한 블록을 diff로 비교해 공통 부분만 이동, 다른 키는 각 파일에 남김.
```ts
export const canvasStyles = StyleSheet.create({
  frame: { flex: 1, height: '100%', backgroundColor: colors.card, borderRadius: radius.md, overflow: 'hidden' }, // 기존 padding:3/border 제거
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card, borderRadius: radius.md },
  // …두 파일 공통 키 (색은 토큰으로 치환)
});
```
- L702/L728(topic), L723/L749(hotline) 인라인 스타일 → `[canvasStyles.frame, { width }]`, 로딩 쪽 → `canvasStyles.loading` + RN `ActivityIndicator color={colors.accent}`.
- **주의**: `onLayout`으로 캔버스 크기를 재는 View의 padding(3)이 사라지면 측정 폭이 6 커짐. 스크립트 좌표/스냅샷 비율 계산이 이 값에 의존하는지 확인하고, 의존하면 `padding: 3`은 유지(테두리만 제거).

**P2-3. 타이포그래피**
- 9종 fontSize → 5단계 매핑(§6 표). 제목류(drawerTitle, dock title, 13px bold 주황) → `type.title` + `colors.text`.
- 채팅: 에이전트 말풍선 `colors.accentSoft` 배경, `radius.lg`, `padding: space.md`, `type.body`. 튜터 말풍선 `colors.cardMuted`. "이전 메시지" 목록을 말풍선 리스트로(데이터·정렬 순서 동일). 시간 라벨 `type.caption` `colors.muted`.
- **Pretendard(필수, 사용자 승인 완료 2026-11-02)**
  - 라이선스: SIL Open Font License 1.1(상업적 번들 허용). 출처: 공식 GitHub `orioncactus/pretendard` 릴리스. `assets/fonts/OFL.txt`에 라이선스 전문 함께 커밋.
  - 파일: **실제 쓰는 굵기만** — `assets/fonts/Pretendard-Regular.otf`(400), `Pretendard-SemiBold.otf`(600), `Pretendard-Bold.otf`(700). Medium·Light·Variable·전체 패밀리 번들 금지. (Dynamic Subset/웹폰트 woff2는 RN에서 쓰지 않음.)
  - 로드: `expo-font`(설치 여부 `package.json`에서 확인, 없으면 `npx expo install expo-font` — 승인 범위 내). `app/_layout.tsx`에서 `useFonts` + 기존 스플래시 처리에 연결:
```tsx
// app/_layout.tsx
import { useFonts } from 'expo-font';
const [fontsLoaded, fontError] = useFonts({
  'Pretendard-Regular': require('../assets/fonts/Pretendard-Regular.otf'),
  'Pretendard-SemiBold': require('../assets/fonts/Pretendard-SemiBold.otf'),
  'Pretendard-Bold': require('../assets/fonts/Pretendard-Bold.otf'),
});
// fontsLoaded || fontError 이면 스플래시 해제 → 렌더. 실패 시 시스템 폰트로 계속(무한 대기 금지), console.warn만.
```
  - 키 이름은 `theme.ts`의 `fontFamily` 값과 **정확히 일치**해야 함(§4). config plugin 방식(`expo-font` plugin `fonts` 배열)으로 네이티브 임베드해도 되지만, 그 경우 `app.config.ts`의 plugins만 수정하고 식별자·아이콘·orientation은 건드리지 않음.
  - 적용: 모든 텍스트는 `type.*`(fontFamily 포함) 또는 `src/ui/Text.tsx` 래퍼로. 굵기는 `fontWeight` 대신 family로 결정(Android 대응) — 500을 쓰던 곳은 400 또는 600 중 가까운 쪽으로.
  - **MathJax 수식은 자체 수식 폰트를 유지**: 수식 렌더러(WebView/SVG)의 폰트 설정을 바꾸거나 Pretendard를 주입하지 않음. 캔버스 내부 좌표 의존 텍스트도 대상 아님(§6.2).
  - 크기: 3개 otf 합계를 측정해 보고(앱 용량 증가분).
- 권장: `src/ui/Text.tsx`(`variant: keyof typeof type`, `color?: keyof typeof colors`) 래퍼를 만들어 신규·수정 코드에서 사용.

**P2-5. 캔버스 화면 가로 모드 기능 제한(메커니즘)** — 사용자 결정: 제한함. **어떤 기능을 제한할지는 미정(§10-1)**.
- 감지: 전역 방향 API가 아니라 **캔버스 화면 루트 View의 `onLayout` 크기**로 판단 — `isLandscape = width > height`. (Tablet에서 drawer가 겹쳐도 캔버스 화면 자체 크기 기준. `expo-screen-orientation` 도입 금지, `app.config.ts` orientation 추가 금지.) 같은 값일 때는 세로로 간주.
- 훅: `src/kit/canvas/useCanvasLandscape.ts` → `{ isLandscape, onLayout }`. 크기 변화는 기존 모드 판단과 같은 200ms 디바운스.
- 제한 목록: `src/kit/canvas/landscapeRestrictions.ts`
```ts
import type { ToolId } from './FloatingToolbar';
/** 캔버스 화면이 가로일 때 비활성화할 기능. 사용자 결정 대기(design-spec §10-1) — 임의로 채우지 말 것 */
export const LANDSCAPE_RESTRICTED: ReadonlySet<ToolId | 'playback' | 'snapshot'> = new Set([]);
```
- 동작: 가로이면 `FloatingToolbar restricted={LANDSCAPE_RESTRICTED}` 전달 → 해당 버튼은 **비활성화(숨기지 않음)**: `disabled`, `opacity 0.38`, `accessibilityState.disabled`, `accessibilityHint`. 툴바 밖의 제한 대상(예: 재생 버튼, 스냅샷)도 같은 집합을 보고 비활성.
- 안내: 가로 진입 시 캔버스 상단 가운데에 인라인 배너 `src/kit/canvas/LandscapeNotice.tsx` — "가로 화면에서는 일부 기능을 사용할 수 없어요. 세로로 돌리면 모두 사용할 수 있어요." (`colors.cardMuted` 배경, `radius.pill`, `type.caption`, 아이콘 `phone-portrait-outline`). 비활성 버튼 탭 시에도 같은 문구를 짧게 다시 보여 줌. 배너는 `pointerEvents="box-none"`, 필기 입력을 막지 않음, 토스트(오른쪽 상단)와 겹치지 않게 가운데·`z.toolbar`.
- 제한 목록이 비어 있으면 배너도 표시하지 않음(빈 제한 상태로 안내만 뜨는 것 방지).
- 필기 데이터·실황 동기화·진행 중 재생 상태는 회전으로 끊기거나 리마운트되지 않아야 함(§9.2-6). 이미 활성인 도구가 제한 대상이 되면 기본 펜으로 전환하지 말고 사용자 결정 전까지 상태 유지 + 질문 목록에 기록.

**P2 수용 기준**
- 캔버스 화면에 주황 테두리/주황 FAB 없음, 떠 있는 pill 툴바 1개만 **하단 가운데**에 존재. drawer 열림/레일/닫힘, Phone 하단 탭, 토스트 표시 상태 모두에서 겹침 없음.
- 모든 UI 텍스트가 Pretendard(400/600/700)로 렌더, MathJax 수식은 기존 폰트. 폰트 로드 실패 시뮬레이션(파일명 오타)에서도 앱 기동.
- 가로 모드: `LANDSCAPE_RESTRICTED`에 테스트 값(예: `'eraser'`)을 임시로 넣으면 배너 표시 + 버튼 비활성(보임) 확인 후 빈 집합으로 되돌려 커밋.
- 펜 색·굵기 변경, 지우개, 실행 취소, 스크립트 재생/이전/다음/구간 재생이 기존과 동일하게 동작, 저장값 동일.
- 실황 수업 수신 중 캔버스 동기화(`onReceiveGuide`) 정상, 스냅샷 좌표 어긋남 없음.
- `rg -n "fontSize: *(11|13|15|17|18|22|24)\b" src/agent src/host src/kit/canvas` 0건(§6 매핑 적용 범위).

---

### P3. 모션 + 토스트 통합 + paper 제거

**P3-1. 모션을 reanimated 4로**
- `TabletAgentLayer`(현재 RN `Animated` 220ms timing) → reanimated.
```tsx
const reduce = useReducedMotion();
const dw = drawerWidth(w, h);
const x = useSharedValue(open ? 0 : -(dw + layout.gutter));
useEffect(() => {
  const to = open ? 0 : -(dw + layout.gutter);
  x.value = reduce ? to : withSpring(to, motion.spring);
}, [open, dw, reduce]);
const drawerStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

// dock: drawer 뒤 60ms 지연 + 페이드
const o = useSharedValue(0);
useEffect(() => {
  o.value = reduce ? (dockOpen ? 1 : 0) : withDelay(motion.dockDelay, withTiming(dockOpen ? 1 : 0, { duration: motion.base }));
}, [dockOpen, reduce]);
```
- 레일↔drawer: `LinearTransition.springify().damping(22).stiffness(240)` (reduce 시 미적용).
- 하단 바 활성 인디케이터: 흰 pill 하나를 `left`를 `withSpring`으로 이동(세그먼트 폭 = (barW - padding)/6).
- 폴더블 전환 시 모드 변경은 애니메이션 없이 즉시(스펙: "바로 바꾸기"), 상태 유지.
- 모든 곳: `useReducedMotion()`이 true면 duration 0/즉시 값.
- 완료 후 `rg -n "from 'react-native'.*Animated|Animated\.(timing|spring|Value)" src/agent src/ui src/kit/canvas` 0건.

**P3-2. 토스트 통합** — `src/ui/toast/` (신규)
- 두 구현(`TabletAgentLayer` 내부 `TutorToast`, `src/kit/ui/toast.tsx`)의 사용처를 조사해 하나의 `ToastHost` + `useToast()`로 통합. `src/kit/ui/toast.tsx`의 기존 공개 API(함수명·인자)는 **호환 래퍼로 유지**해 호출부 무수정.
```tsx
type ToastItem = { id: string; kind: 'tutor' | 'info' | 'error'; text: string; onPress?: () => void; durationMs?: number };
// tutor 토스트 규칙 (스펙 §4.6 — 값/동작 변경 금지)
// - 위치: Tablet 오른쪽 상단 (top: gutter + safeTop, right: gutter), width: layout.toastW
// - 표시 시간: motion.toastMs(6400). 터치 중(onPressIn~onPressOut) 타이머 일시정지, 남은 시간부터 재개
// - 탭: drawer 열기(기존 핸들러) 후 토스트 닫기
// - 자동 닫힘 후: unread 점 유지 + 메시지 기록 유지(기존 로직 그대로)
// - 미리보기 문구 길이 자르기는 기존 값 유지
// - 루트 pointerEvents="box-none": 토스트 카드만 터치, 캔버스 필기 계속
// - 응답 필요 메시지는 토스트가 아니라 drawer 바로 열기(기존 분기 유지)
const s = StyleSheet.create({
  toast: { position: 'absolute', right: layout.gutter, width: layout.toastW, backgroundColor: colors.card,
    borderRadius: radius.md, padding: space.md, gap: space.xs, zIndex: z.toast, ...shadow.float, overflow: 'hidden' },
  title: { ...type.caption, color: colors.muted },
  body: { ...type.bodyStrong, color: colors.text },
  progress: { position: 'absolute', left: 0, bottom: 0, height: 3, backgroundColor: colors.accent },
});
// 진행 바: width 100%→0% 를 withTiming(duration: 남은 시간, easing: Easing.linear). reduce 모드에서는 진행 바 숨김(타이머는 동일하게 6.4s)
// 등장/퇴장: FadeInUp / FadeOutUp (motion.base / motion.fast), reduce 시 없음
```
- Phone에서 기존 토스트 위치/동작이 있다면 그대로 유지(Phone 튜터 메시지는 하단 모달 경로).
- 완료 후 `TutorToast` 중복 정의 0건.

**P3-3. react-native-paper 제거** (7개 파일)
| 파일 | paper 사용 | 대체 |
|---|---|---|
| `topic-live-canvas.tsx` | `Portal`, `Modal`(L655), `ActivityIndicator`(L729) | `ToolPopover`/RN `Modal transparent`, RN `ActivityIndicator` |
| `hotline-class-canvas.tsx` | 동일(L676, L750) | 동일 |
| `pencil-props-modal.tsx` | `Modal` | `ToolPopover` 내용으로 이동 후 파일 삭제 또는 RN Modal 래퍼 |
| `notebook.tsx`, `topic-notebook.tsx`, `image-adjust-card.tsx` | 파일별 확인(`rg -n "react-native-paper" <file>`) | `src/ui/Sheet.tsx`(RN Modal + 카드 스타일), RN 기본 컴포넌트, 버튼은 `src/ui/Button.tsx` |
| `app/_layout.tsx` L6, L20, L27 | `PaperProvider` | 제거(나머지 Provider 순서 유지, 주석 L18 갱신) |
- `onDismiss` ↔ RN `onRequestClose` + 배경 탭 닫기로 의미 동일하게.
- 7개 파일 모두 교체되어 `rg` 0건이 된 뒤 `yarn remove react-native-paper` 실행 — **사용자 승인 완료(2026-11-02)**, 추가 확인 불필요. paper 전용 peer(`react-native-vector-icons` 등)는 `rg`로 다른 사용처가 없을 때만 함께 제거하고, 그 외 패키지는 건드리지 않음. 이후 `yarn install`, `yarn doctor`, iOS는 `npx pod-install`(bare/prebuild 사용 시).
- 완료 기준: `rg -n "react-native-paper" src app` 0건 **및** `package.json`·lockfile에 `react-native-paper` 없음.

**P3-4. 공통 프리미티브** (선택이지만 권장, 새 의존성 없음)
- `src/ui/Card.tsx`(`colors.card`, `radius.lg|md`, `shadow.card|float`), `src/ui/Button.tsx`(primary/secondary/text, 높이 44), `src/ui/IconButton.tsx`(44 원형), `src/ui/Text.tsx`.

**P3 수용 기준**
- drawer/dock/레일/토스트/툴바 애니메이션이 모두 같은 spring 감각, 60fps(개발 빌드 Perf Monitor에서 프레임 드롭 없음).
- iOS "동작 줄이기" / Android "애니메이션 제거" 켜면 즉시 전환.
- 튜터 토스트: 6.4초 후 닫힘, 누르고 있으면 안 닫힘, 탭 → drawer 열림, 닫힌 뒤 unread 점, 토스트 중 필기 가능.
- paper 0건(코드·package.json), 앱 기동·모든 캔버스 모달 정상.

---

## 6. 하드코딩 값 이관 가이드

### 6.1 색
| 기존 | 신규 토큰 | 비고 |
|---|---|---|
| `'orange'`, `#FFA500`, `#FF8800`, `#FFC256` (UI 크롬) | `colors.accent` | 잉크 색 데이터 `'orange'`는 **유지** |
| `#EA580C`, `#D35400` | `colors.accentPress` | 눌림·강조 |
| `#C2410C`, `#B45309` | `colors.accentText` | 흰 바탕 위 주황 글자 |
| `#FFF7ED` | `colors.accentSoft` | |
| 주황 테두리(`border*Color: 'orange'/colors.agent`) | **삭제** | 그림자/배경 대비로 대체 |
| `'white'`, `#FFFFFF`, `#FFF`, `#fff` | `colors.card` | 글자색으로 쓰인 흰색은 `colors.onAccent` |
| `#FAFAFA`, `#F5F5F5`, `#F4F4F5`, `#F9FAFB` | `colors.bg` | |
| `#E5E5E5`, `#E5E7EB`, `#E4E4E7` (배경) | `colors.cardMuted` | 선이면 `colors.line` |
| `#E5E5E5`, `#E5E7EB`, `#E4E4E7` (선) | `colors.line` | |
| `#D4D4D8`, `#D1D5DB` | `colors.lineStrong` | |
| `#A1A1AA`, `#9CA3AF` | `colors.disabled` (선이면 `colors.lineStrong`) | |
| `#71717A`, `#6B7280`, `#52525B` | `colors.muted` | |
| `#3F3F46`, `#374151` | `colors.subtle` | |
| `#18181B`, `#1F2937`, `#111827`, `'black'`(글자) | `colors.text` | |
| `#15803D`, `#16A34A` | `colors.online` / `colors.success` | |
| `#DC2626`, `#EF4444`, `'red'`(UI) | `colors.danger` | |
| `#FEF3C7` | `colors.warnSoft` | |
| `rgba(0,0,0,0.3~0.5)` 딤 | `colors.scrim` | |
| 기타 rgba 그림자색 | `shadow.*` | |

### 6.2 글자 크기 (9종 → 5단계)
| 기존 fontSize | 신규 | 
|---|---|
| 11, 12 | `type.caption` |
| 13, 14 (보통) | `type.body` |
| 13, 14 (bold/semibold) | `type.bodyStrong` |
| 15, 16, 17 | `type.title` |
| 18, 20, 22, 24 | `type.heading` |
| (하단 바 라벨) | `type.tabLabel`(11) — 하단 바 전용 |

**fontWeight → fontFamily**
| 기존 fontWeight | 신규 |
|---|---|
| 100~400, normal | `fontFamily.regular` |
| 500, 600 | `fontFamily.semibold` |
| 700~900, bold | `fontFamily.bold` |
- `fontFamily: 'System'` 등 기존 family 지정은 위 토큰으로. MathJax/수식 렌더 영역은 제외.
- 수학 수식·캔버스 내부 렌더 텍스트(스크립트/문제 이미지 위 텍스트)는 **대상 아님**(좌표 의존).

### 6.3 반경 (19종 → 4종)
| 기존 borderRadius | 신규 |
|---|---|
| 2, 3, 4, 5, 6, 8, 10 | `radius.sm` (원형 점/아바타는 `radius.pill`) |
| 11, 12, 14, 16 | `radius.md` |
| 18, 20, 24, 28, 32 | `radius.lg` |
| 높이/2 값(22 on 44 등), 원형 | `radius.pill` |

### 6.4 간격
| 기존 | 신규 |
|---|---|
| 1~3 | `space.xxs`(2) (1px 헤어라인은 `StyleSheet.hairlineWidth`) |
| 4~5 | `space.xs` |
| 6~10 | `space.sm` |
| 11~14 | `space.md` |
| 15~20 | `space.lg` |
| 21~28 | `space.xl` |
| 29+ | `space.xxl` |
- 레이아웃 치수(헤더 56, 터치 44, 레일 64, 하단 바 아이콘 22, 툴바 간격 16 등)는 `layout.*`.

### 6.5 그림자/elevation
| 기존 | 신규 |
|---|---|
| elevation 1~4, shadowRadius ≤ 12 | `shadow.card` |
| elevation 5+, shadowRadius > 12, 모달/떠 있는 요소 | `shadow.float` |

### 6.6 이관 범위
- 필수: `src/agent/**`, `src/host/**`, `src/ui/**`, `app/**`, `src/kit/canvas/**`(UI 크롬), `src/kit/ui/**`, `src/kit/script-player/PlaybackToolbar.tsx`.
- 선택(시간 남으면, 별도 커밋): 그 밖의 `src/kit/**` 패널.
- 이관 중 의미가 애매한 값(예: 상태를 나타내는 색)은 바꾸지 말고 `// TODO(design): 확인` 주석 + 최종 보고에 목록화.

---

## 7. 검증 체크리스트

### 7.1 명령 (package.json scripts)
```bash
yarn lint        # expo lint
yarn typecheck   # tsc --noEmit
yarn test        # jest
yarn doctor      # expo-doctor (의존성 변경한 P3에서 필수)
```
- 각 단계 커밋 전 lint/typecheck/test 통과. 기존에 실패하던 항목이 있으면 P0 시작 전 기준 결과(오류 개수)를 기록하고 **늘지 않았음**을 보고.

### 7.2 기기 매트릭스
| 기기 | 모드 | 확인 |
|---|---|---|
| iPad (11", 1194×834 pt) 가로/세로 | Tablet | drawer 358/300, dock 정렬, 토스트, 툴바 하단 가운데, 하단 바 6칸(300: 짧은 라벨) |
| iPad mini (1133×744) | Tablet | 짧은 변 744 |
| Android 태블릿 (Galaxy Tab S, 1280×800 dp) | Tablet | elevation 그림자 |
| Galaxy Z Fold 접힘 (약 344×882) / 접힘 가로 | Phone | 가로로 돌려도 Phone 유지 |
| Galaxy Z Fold 펼침 (약 673~884 × 841~1104) | Tablet | 폴더블 40% 상한 |
| iPhone 15 / Pro Max 세로·가로 | Phone | 가로여도 Phone(짧은 변<600), 캔버스 가로 제한 배너·비활성 |
| Android 폰 (360×800) | Phone | 하단 모달 |
| 경계: 리사이즈 창/에뮬레이터 600, 580, 559 | 히스테리시스 | 600↑ Tablet, 560~599 직전 유지, <560 Phone |

### 7.3 기능 회귀 (모든 단계)
- [ ] Tablet drawer: 왼쪽→오른쪽, 캔버스 위 overlay, drawer 열린 채로 캔버스 필기 가능
- [ ] 튜터 메시지: 오른쪽 상단 토스트, 6.4초, 누르는 동안 정지, 탭 → drawer, 닫힌 뒤 unread 점·기록
- [ ] 응답 필요 메시지는 drawer 바로 열림
- [ ] 기본 흐름(서버 instruction) 선택지·화면 전환 동일
- [ ] 하단 바 6칸(공지/검색/타임라인/실황 수업/주간 공부/내 정보) 한 줄, drawer 300에서 줄바꿈 없음, 스크롤해도 고정. 기존 4개 결과 동일, 실황 수업·주간 공부는 기존 카드 재사용
- [ ] 로그아웃(내 정보 안) 동작 동일
- [ ] Phone 하단 모달 열림/닫힘 동일
- [ ] 폴더블 접기/펴기: 열린 instruction, 필기, 실황 수업 연결 유지(리마운트·재접속 없음)
- [ ] 캔버스: 펜/색/굵기/지우개/실행 취소, 스크립트 재생, 실황 동기화, 스냅샷 좌표
- [ ] 툴바 하단 가운데, drawer·하단 바·하단 탭·토스트와 겹침 없음
- [ ] 캔버스 화면 가로(폭>높이): 제한 대상 버튼 비활성(보임) + 안내 배너, 세로 복귀 시 즉시 해제, 회전 중 필기·재생 유지
- [ ] Pretendard 적용(400/600/700), MathJax 수식 폰트 변화 없음
- [ ] `package.json`에 `react-native-paper` 없음(P3 후)
- [ ] 기존 사용자 MMKV `canvasStrokeColor = 'orange'` 정상
- [ ] 앱 아이콘·스플래시·표시 이름 변화 없음, `app.config.ts`에 orientation 없음
- [ ] 접근성: 모든 아이콘 버튼 라벨(하단 바는 전체 라벨), 터치 영역 ≥ 44, 큰 글씨(접근성 글자 크기 최대)에서 하단 바(라벨 1.2배 상한)·토스트 잘림 없음
- [ ] reduced motion 켠 상태 확인

### 7.4 스크린샷 비교
- 기준선: P0 시작 전 아래 화면을 각 기기(최소 iPad 가로, Fold 펼침, iPhone)에서 캡처 → `docs/design/before/<device>-<screen>.png`.
- 화면: ①Tablet 첫 화면(drawer 열림) ②drawer + dock(내 정보) ③drawer 접힘(레일) ④튜터 토스트 표시 ⑤캔버스(필기 중, 툴바) ⑥캔버스 재생 모드 ⑦펜 속성 팝오버 ⑧Phone instruction 모달 ⑨하단 바 6칸(drawer 300/400) ⑩캔버스 가로 모드(배너·비활성 버튼).
- 각 단계 후 `docs/design/after-P<n>/`에 같은 이름으로 캡처, PR/커밋 설명에 전후 표 첨부. iOS 시뮬레이터: `xcrun simctl io booted screenshot <path>`, Android: `adb exec-out screencap -p > <path>`.

---

## 8. 커밋 순서 (단계당 1커밋)

| 순서 | 커밋 메시지 | 범위 |
|---|---|---|
| 0 | `chore(design): capture baseline screenshots and lint/type results` | 스크린샷·기준 결과만 (코드 무변경) |
| 1 | `feat(ui): P0 design tokens and remove orange borders` | theme.ts, §5 P0 표의 위치 |
| 2 | `feat(ui): P1 floating card shell, collapsible rail, 6-item bottom bar` | deviceMode.drawerWidth, agent/tablet/*, DockWrapper, EdgeTab 삭제, DrawerFooter, Phone 모달 스타일 |
| 3 | `feat(canvas): P2 FloatingToolbar, Pretendard, landscape restriction` | FloatingToolbar, ToolPopover, canvasStyles, PencilFab 삭제, PlaybackToolbar 래퍼, type 이관, Pretendard(assets/fonts + OFL.txt + useFonts), 가로 모드 제한 메커니즘 |
| 4 | `feat(ui): P3 reanimated motion, unified toast, remove react-native-paper` | 모션, src/ui/toast, paper 제거, `yarn remove react-native-paper`(승인 완료) |
| 5(선택) | `refactor(ui): migrate remaining hardcoded values to tokens` | §6.6 선택 범위 |

- 브랜치: `design/modern-ui`. 각 커밋은 단독으로 빌드·실행 가능해야 함. push/PR 생성은 사용자 지시가 있을 때만.

---

## 9. Claude 작업 지침

### 9.1 먼저 읽을 파일 (이 순서로)
1. 이 문서 전체
2. `package.json`, `app.config.ts`, `tsconfig.json`(경로 alias 확인), `babel.config.js`
3. `src/ui/theme.ts`, `src/layout/deviceMode.ts`
4. `app/_layout.tsx`, `app/(main)/index.tsx`, `src/host/Stage.tsx`
5. `src/agent/TabletAgentLayer.tsx`, `DockWrapper.tsx`, `EdgeTab.tsx`, `InstructionCard.tsx`, `PhoneInstructionModal.tsx`
6. 실황 수업 정보·주간 공부 내용 카드 컴포넌트(`rg -n "실황|주간|liveClass|weekly" src`), `src/kit/ui/toast.tsx`, `src/kit/ui/PencilFab.tsx`, `src/kit/script-player/PlaybackToolbar.tsx`
7. `src/kit/canvas/note-canvas/topic-live-canvas.tsx`, `hotline-class-canvas.tsx`, `pencil-props-modal.tsx`, `notebook.tsx`, `topic-notebook.tsx`, `image-adjust-card.tsx`
8. 사용처: `rg -n "EdgeTab|PencilFab|PlaybackToolbar|TutorToast|kit/ui/toast|react-native-paper|colors\." src app`

### 9.2 규칙
1. **비즈니스 로직 금지 구역**: 핸들러 본문, 상태 전이, GraphQL/WebSocket/Apollo, 인증, MMKV 키·값, 프로토콜 타입, `deviceMode`의 600/560/200ms 판단, instruction 우선순위, 토스트 6.4초·탭 동작. 스타일·컴포넌트 구조·애니메이션만 바꿉니다. 로직을 옮길 때는 **잘라 붙이기**만 하고 수정하지 않습니다.
2. **의존성 추가/삭제 전 반드시 사용자에게 질문.** 이미 승인된 것(2026-11-02): Pretendard 폰트 파일 3종 + `expo-font`, `react-native-paper` 삭제(P3, 사용처 0건 후). 이 외의 추가/삭제는 질문.
3. `.env` 및 비밀 파일을 읽거나 수정하지 않습니다. `app.config.ts`의 식별자·아이콘·스플래시·이름은 수정 금지, orientation 추가 금지.
4. 잉크 색 데이터(`strokeColors`, `'orange'` 기본값)는 바꾸지 않습니다.
5. 신규/수정 스타일에 hex·숫자 fontSize·임의 radius 금지 — 토큰만. 예외가 필요하면 `theme.ts`에 토큰을 추가하고 이 문서 §4와 차이를 보고.
6. 레이아웃 전환(폰↔태블릿, 열림↔접힘)에서 상태를 가진 컴포넌트를 언마운트하지 않습니다(스타일/transform으로 처리).
7. 단계마다 §7.1 명령 통과 + §7.3 체크 후 커밋. 실패를 숨기지 말고 보고.
8. 문서의 줄 번호와 실제 코드가 다르면 코드 조각으로 찾고, 의미가 다르면 작업을 멈추고 질문합니다.
9. 판단이 필요한 미결정 사항(가로 모드에서 **제한할 기능 목록**, 다크 모드)은 구현하지 않고 질문 목록에 남깁니다. 가로 모드 제한 메커니즘(P2-5)과 하단 바 6칸은 결정 완료이므로 구현합니다.
10. 각 단계 종료 보고: 바꾼 파일 목록, 전후 하드코딩 개수(§5 P0-3 명령), 스크린샷 경로, 남은 TODO.

### 9.3 완료 정의 (전체)
- §1.1 목표 10개 충족, §7 체크리스트 전부 통과, `rg` 검사(주황 테두리, EdgeTab, PencilFab, paper, RN Animated in agent) 0건, `package.json`에 paper 없음, Pretendard 3종만 번들.
- 스펙 §4 결정(§1.3 표)이 모두 그대로 동작.

---

## 10. 열린 질문 / 결정 기록

**결정됨 (2026-11-02, 사용자)**
| # | 질문 | 결정 | 반영 위치 |
|---|---|---|---|
| D1 | Pretendard 도입 | 도입. P2 필수, expo-font, 400/600/700만 번들, SIL OFL, MathJax는 자체 폰트 유지 | §4 `fontFamily`/`type`, §5 P2-3, §6.2, §7 |
| D2 | react-native-paper 삭제 | 삭제 승인. P3에서 7개 사용처 교체 후 `yarn remove` | §1.4, §5 P3-3, §8, §9.2 |
| D3 | 캔버스 툴바 위치 | 하단 가운데(오른쪽 세로 안 폐기). 하단 바·토스트·drawer와 겹치지 않게 | §1.3, §5 P2-1 |
| D4 | 실황 수업·주간 공부를 하단 바에 | 추가. 6칸 한 줄(공지·검색·타임라인·실황 수업·주간 공부·내 정보), 레일도 6개 | §1.3, §4 `layout`, §5 P1-6, §7 |
| D5 | 캔버스 가로 모드 | 기능 제한함. 캔버스 화면 폭>높이 감지, 안내 배너, 제한 기능은 비활성(숨김 아님) | §1.3, §5 P2-5, §7 |

**남은 질문 (사용자 결정 필요)**
1. 캔버스 화면 가로 모드에서 **구체적으로 제한할 기능 목록**(예 후보: 필기 도구 일부, 지우개, 스크립트 재생, 스냅샷 등). 결정 전까지 `LANDSCAPE_RESTRICTED`는 빈 집합으로 두고 임의로 채우지 않음.
2. (선택) 다크 모드 — 이번 범위 아님.
