// Qoolla 학습 앱 디자인 토큰(design-spec §4). 신규/수정 스타일은 반드시 이 파일의 값만 사용한다.
// 앱 바닥(bg) 위에 흰 카드(card)가 떠 있는 두 층 구조. 주황(accent)은 주 버튼·활성 상태·읽지 않음 점·진행 바에만 쓴다.
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
  bg: palette.gray[50], // 앱 바닥
  card: palette.gray[0], // 카드/패널/툴바
  cardMuted: palette.gray[100], // 카드 안 보조 면(세그먼트 바탕, 튜터 말풍선)
  scrim: 'rgba(24,24,27,0.32)', // Phone 모달 뒤 딤
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
  dangerSoft: palette.danger[50], // 위험 톤 버튼의 누름 바탕(accentSoft와 같은 짝, 단계 4a)
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

/** Pretendard(SIL OFL 1.1). 번들 굵기: 400/600/700만. 이름은 app/_layout.tsx useFonts 키와 일치해야 함.
 *  Android는 fontWeight로 굵기를 고르지 못하므로 굵기별 family를 직접 지정한다.
 *  폰트 로드 실패 시에도 앱은 시스템 폰트로 동작(RN이 미등록 family를 시스템으로 폴백). */
export const fontFamily = {
  regular: 'Pretendard-Regular', // 400
  semibold: 'Pretendard-SemiBold', // 600
  bold: 'Pretendard-Bold', // 700
} as const;
// 500(Medium)은 번들하지 않음 → caption은 regular 사용

export const type = {
  caption: { fontSize: 12, lineHeight: 16, fontFamily: fontFamily.regular, fontWeight: '400' },
  body: { fontSize: 14, lineHeight: 20, fontFamily: fontFamily.regular, fontWeight: '400' },
  bodyStrong: { fontSize: 14, lineHeight: 20, fontFamily: fontFamily.semibold, fontWeight: '600' },
  title: { fontSize: 16, lineHeight: 22, fontFamily: fontFamily.semibold, fontWeight: '600' },
  heading: { fontSize: 20, lineHeight: 28, fontFamily: fontFamily.bold, fontWeight: '700' },
  // 하단 바 라벨 전용. 11pt, 한 줄
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
  gutter: 12, // 화면 가장자리·카드 간 간격
  chatRatio: 0.3, // drawer 폭 비율 (스펙 §4)
  chatMin: 300,
  chatMax: 400,
  chatRail: 64, // 접힌 레일 폭
  foldMaxRatio: 0.4, // 펼친 폴더블 drawer 상한
  dockMax: 560,
  headerH: 56,
  footerH: 56,
  footerIcon: 22, // 하단 바 아이콘
  footerItems: 6, // 공지·검색·타임라인·실황 수업·주간 공부·내 정보
  toolbarH: 52, // 캔버스 툴바 높이 = 버튼 터치 영역(아이콘 + 라벨)
  canvasMargin: 6, // 풀이 캔버스 좌우 여백
  toolbarGap: 16, // 툴바와 하단 바/drawer/토스트 사이 최소 간격
  hit: 44, // 최소 터치 영역
  toastW: 360,
  controlSm: 32, // 밀집 행의 Button sm·Chip 최소 높이. hitSlop으로 hit까지 채운다
  railOpacity: 0.88, // rail 카드 바탕 투명도(Gate B Q3). 단계 4에서 ChatRail에 적용
  dialogMax: 400, // Dialog 최대 폭(= chatMax). 버튼 둘과 한국어 제목 한 줄
} as const;

export const z = { canvas: 0, dock: 10, drawer: 20, toolbar: 30, toast: 40, modal: 50 } as const;

export const theme = { palette, colors, space, radius, type, shadow, motion, layout, z, fontFamily };
export type Theme = typeof theme;
