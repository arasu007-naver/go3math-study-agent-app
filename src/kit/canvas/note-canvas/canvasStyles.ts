import { StyleSheet } from 'react-native';
import { colors, radius, shadow, space, type } from '../../../ui/theme';

// 캔버스 패널 공통 스타일(design-spec P2-2). topic-live-canvas·hotline-class-canvas·notebook·topic-notebook이 같이 쓴다.
// frame의 padding 3은 유지한다: topic-live/hotline은 이 View의 onLayout 크기로 캔버스 템플릿 크기를 정한다.
export const canvasStyles = StyleSheet.create({
  frame: { flex: 1, height: '100%', padding: 3, backgroundColor: colors.card, borderRadius: radius.md, overflow: 'hidden' },
  loading: { flex: 1, height: '100%', padding: 3, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card, borderRadius: radius.md },
  // 메모 토스트(실황 수업 캔버스 오른쪽 위)
  memoToast: {
    position: 'absolute',
    top: space.md,
    right: space.md,
    width: 640,
    maxWidth: 640,
    padding: space.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    zIndex: 10,
    ...shadow.float,
  },
  memoToastClose: { alignSelf: 'flex-end', marginBottom: space.sm },
  memoToastCloseText: { ...type.heading, color: colors.accentPress },
  // 옮겨 온 paper Modal 자리의 웹뷰 팝업 카드
  popup: { position: 'absolute', top: 36, left: 18, maxWidth: 640, padding: space.md, backgroundColor: colors.card, borderRadius: radius.lg, ...shadow.float },
});
